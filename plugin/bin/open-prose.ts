#!/usr/bin/env bun
/**
 * OpenProse CLI
 *
 * Usage:
 *   open-prose compile <file.prose>   - Compile and validate a program
 *   open-prose validate <file.prose>  - Validate without compiling
 *   open-prose run <file.prose>       - Execute a program
 *   open-prose help                   - Show this help message
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { config as loadEnv } from 'dotenv';
import { parse, compile, validate } from '../src';
import { execute } from '../src/runtime';
import { collectAndSendTelemetry } from '../src/telemetry';

// Load environment variables from .env file
loadEnv({ path: join(__dirname, '../../.env') });

// Read version from package.json
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
const VERSION: string = packageJson.version;

const args = process.argv.slice(2);

function printUsage(): void {
  console.log(`OpenProse CLI v${VERSION}

Usage:
  open-prose compile <file.prose>   Compile and validate a program
  open-prose validate <file.prose>  Validate syntax only
  open-prose run <file.prose>       Execute a program
  open-prose help                   Show this help message

Examples:
  open-prose compile program.prose
  open-prose validate examples/research.prose
  open-prose run examples/hello-world.prose
`);
}

function formatError(error: { message: string; line?: number; column?: number }): string {
  if (error.line !== undefined && error.column !== undefined) {
    return `Error at line ${error.line}, column ${error.column}: ${error.message}`;
  }
  return `Error: ${error.message}`;
}

function compileFile(filePath: string): void {
  if (!existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const source = readFileSync(filePath, 'utf-8');

  // Parse
  const parseResult = parse(source);

  if (parseResult.errors.length > 0) {
    console.error('Parse errors:');
    for (const error of parseResult.errors) {
      console.error(formatError(error));
    }
    process.exit(1);
  }

  // Validate
  const validationResult = validate(parseResult.program);

  if (validationResult.errors.length > 0) {
    console.error('Validation errors:');
    for (const error of validationResult.errors) {
      console.error(formatError(error));
    }
    process.exit(1);
  }

  if (validationResult.warnings.length > 0) {
    console.error('Warnings:');
    for (const warning of validationResult.warnings) {
      console.error(`Warning: ${warning.message}`);
    }
  }

  // Compile
  const compileResult = compile(parseResult.program);

  console.log(compileResult.code);

  if (compileResult.strippedComments.length > 0) {
    console.error(`\n# Stripped ${compileResult.strippedComments.length} comment(s)`);
  }

  // Send telemetry (non-blocking)
  collectAndSendTelemetry(parseResult.program, VERSION);
}

function validateFile(filePath: string): void {
  if (!existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const source = readFileSync(filePath, 'utf-8');

  // Parse
  const parseResult = parse(source);

  if (parseResult.errors.length > 0) {
    console.error('Parse errors:');
    for (const error of parseResult.errors) {
      console.error(formatError(error));
    }
    process.exit(1);
  }

  // Validate
  const validationResult = validate(parseResult.program);

  let hasIssues = false;

  if (validationResult.errors.length > 0) {
    console.error('Validation errors:');
    for (const error of validationResult.errors) {
      console.error(formatError(error));
    }
    hasIssues = true;
  }

  if (validationResult.warnings.length > 0) {
    console.error('Warnings:');
    for (const warning of validationResult.warnings) {
      console.error(`Warning: ${warning.message}`);
    }
  }

  if (validationResult.errors.length > 0) {
    process.exit(1);
  } else {
    console.log('Valid program');
  }
}

async function runFile(filePath: string): Promise<void> {
  if (!existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const source = readFileSync(filePath, 'utf-8');

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Executing: ${filePath}`);
  console.log('='.repeat(60) + '\n');

  // Parse
  const parseResult = parse(source);

  if (parseResult.errors.length > 0) {
    console.error('Parse errors:');
    for (const error of parseResult.errors) {
      console.error(formatError(error));
    }
    process.exit(1);
  }

  // Validate
  const validationResult = validate(parseResult.program);

  if (validationResult.errors.length > 0) {
    console.error('Validation errors:');
    for (const error of validationResult.errors) {
      console.error(formatError(error));
    }
    process.exit(1);
  }

  if (validationResult.warnings.length > 0) {
    console.warn('Warnings:');
    for (const warning of validationResult.warnings) {
      console.warn(`Warning: ${warning.message}`);
    }
    console.log('');
  }

  // Execute
  try {
    const result = await execute(parseResult.program, {
      debug: true,
      traceExecution: true,
      logLevel: 'info',
    });

    console.log(`\n${'='.repeat(60)}`);
    console.log('Execution Results');
    console.log('='.repeat(60) + '\n');

    if (result.success) {
      console.log('✓ Execution completed successfully\n');

      // Display session outputs first (most important)
      if (result.sessionOutputs.length > 0) {
        console.log('Session Outputs:');
        for (let i = 0; i < result.sessionOutputs.length; i++) {
          const session = result.sessionOutputs[i];
          console.log(`\n  Session ${i + 1}:`);
          console.log(`  ${session.output}`);

          // Display tool calls if present
          if (session.metadata.toolCalls && session.metadata.toolCalls.length > 0) {
            console.log(`\n  🛠️  Tool Calls:`);
            for (const tc of session.metadata.toolCalls) {
              const argsStr = JSON.stringify(tc.arguments);
              const resultStr = typeof tc.result === 'object'
                ? JSON.stringify(tc.result)
                : String(tc.result);
              console.log(`    ├─ ${tc.name}(${argsStr}) → ${resultStr}`);
            }
          }
        }
        console.log('');
      }

      // Display variables if any
      if (result.outputs.size > 0) {
        console.log('Variables:');
        for (const [name, value] of result.outputs) {
          // Check if value has tool calls (SessionResult)
          if (typeof value === 'object' && value !== null && 'metadata' in value && 'toolCalls' in value.metadata && value.metadata.toolCalls) {
            // Display output separately from metadata
            console.log(`  ${name} = ${JSON.stringify(value.output, null, 2)}`);

            // Display tool calls in a formatted way
            console.log(`\n  🛠️  Tool Calls for ${name}:`);
            for (const tc of value.metadata.toolCalls) {
              const argsStr = JSON.stringify(tc.arguments);
              const resultStr = typeof tc.result === 'object'
                ? JSON.stringify(tc.result)
                : String(tc.result);
              console.log(`    ├─ ${tc.name}(${argsStr}) → ${resultStr}`);
            }
            console.log('');
          } else {
            console.log(`  ${name} = ${JSON.stringify(value, null, 2)}`);
          }
        }
        console.log('');
      }

      console.log('Metadata:');
      console.log(`  Duration: ${result.metadata.duration}ms`);
      console.log(`  Sessions created: ${result.metadata.sessionsCreated}`);
      console.log(`  Statements executed: ${result.metadata.statementsExecuted}`);
    } else {
      console.error('✗ Execution failed\n');

      if (result.errors.length > 0) {
        console.error('Errors:');
        for (const error of result.errors) {
          console.error(`  ${error.type}: ${error.message}`);
          if (error.stack.length > 0) {
            console.error('  Stack:');
            for (const line of error.stack) {
              console.error(`    ${line}`);
            }
          }
        }
      }

      process.exit(1);
    }

    console.log('\n' + '='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n✗ Execution failed with exception:');
    console.error(error);
    process.exit(1);
  }
}

// Main
const command = args[0];

switch (command) {
  case 'compile':
    if (!args[1]) {
      console.error('Error: Missing file path');
      console.error('Usage: open-prose compile <file.prose>');
      process.exit(1);
    }
    compileFile(args[1]);
    break;

  case 'validate':
    if (!args[1]) {
      console.error('Error: Missing file path');
      console.error('Usage: open-prose validate <file.prose>');
      process.exit(1);
    }
    validateFile(args[1]);
    break;

  case 'run':
    if (!args[1]) {
      console.error('Error: Missing file path');
      console.error('Usage: open-prose run <file.prose>');
      process.exit(1);
    }
    runFile(args[1]).catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
    break;

  case 'help':
  case '--help':
  case '-h':
    printUsage();
    break;

  case undefined:
    printUsage();
    break;

  default:
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
}
