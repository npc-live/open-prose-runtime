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

import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';
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
  open-prose compile <file.prose>     Compile and validate a program
  open-prose validate <file.prose>    Validate syntax only
  open-prose run <file.prose>         Execute a program
  open-prose install-skills           Install skills into Claude Code globally
  open-prose version                  Show version number
  open-prose help                     Show this help message

Options for install-skills:
  --force                             Overwrite existing skill files
  --dry-run                           Preview what would be installed

Examples:
  open-prose run examples/hello-world.prose
  open-prose install-skills
  open-prose install-skills --force
  open-prose install-skills --dry-run
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

    // ANSI helpers
    const R  = '\x1b[0m';
    const DIM  = '\x1b[2m';
    const BOLD = '\x1b[1m';
    const GREEN  = '\x1b[32m';
    const CYAN   = '\x1b[36m';
    const YELLOW = '\x1b[33m';
    const RED    = '\x1b[31m';
    const BG_DARK = '\x1b[48;5;236m';  // dark grey background for AI output

    const hr = (ch = '─', n = 60) => ch.repeat(n);

    if (result.success) {
      process.stderr.write(`\n${DIM}${hr()}${R}\n`);
      process.stderr.write(`${GREEN}${BOLD}✓ done${R} ${DIM}(${result.metadata.duration}ms · ${result.metadata.sessionsCreated} session(s) · ${result.metadata.statementsExecuted} statement(s))${R}\n`);
      process.stderr.write(`${DIM}${hr()}${R}\n\n`);

      // ── Print AI output in a box (dedup by content) ─────────────
      const shownOutputs = new Set<string>();
      const printAiBlock = (label: string, output: string) => {
        if (shownOutputs.has(output)) return;
        shownOutputs.add(output);
        console.log(`${BOLD}${CYAN}┌─ ${label} ${'─'.repeat(Math.max(0, 54 - label.length))}┐${R}`);
        for (const line of output.split('\n')) {
          console.log(`${CYAN}│${R} ${line}`);
        }
        console.log(`${BOLD}${CYAN}└${'─'.repeat(59)}┘${R}`);
        console.log('');
      };

      // ── Variables (plain values only) ────────────────────────────
      if (result.outputs.size > 0) {
        const isSessionResult = (v: any) =>
          typeof v === 'object' && v !== null && 'output' in v && 'metadata' in v;

        const plain = [...result.outputs.entries()].filter(([, v]) => !isSessionResult(v));
        const sessionVars = [...result.outputs.entries()].filter(([, v]) => isSessionResult(v));

        if (plain.length > 0) {
          process.stderr.write(`${DIM}variables${R}\n`);
          for (const [name, value] of plain) {
            process.stderr.write(`  ${YELLOW}${name}${R} = ${JSON.stringify(value)}\n`);
          }
          process.stderr.write('\n');
        }

        // Named session variables first, then any anonymous outputs not already shown
        for (const [name, value] of sessionVars) {
          printAiBlock(name, (value as any).output as string);
        }
      }

      for (let i = 0; i < result.sessionOutputs.length; i++) {
        const label = result.sessionOutputs.length > 1 ? `session ${i + 1}` : 'output';
        printAiBlock(label, result.sessionOutputs[i].output);
      }
    } else {
      process.stderr.write(`\n${RED}${BOLD}✗ execution failed${R}\n`);
      if (result.errors.length > 0) {
        for (const error of result.errors) {
          process.stderr.write(`  ${RED}${error.type}:${R} ${error.message}\n`);
          for (const line of error.stack) {
            process.stderr.write(`    ${DIM}${line}${R}\n`);
          }
        }
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ Execution failed with exception:');
    console.error(error);
    process.exit(1);
  }
}

function installSkills(opts: { force: boolean; dryRun: boolean }): void {
  const BOLD = '\x1b[1m'; const R = '\x1b[0m';
  const GREEN = '\x1b[32m'; const YELLOW = '\x1b[33m'; const DIM = '\x1b[2m'; const CYAN = '\x1b[36m';

  // Skills live next to this binary: <plugin>/skills/
  const skillsRoot = resolve(__dirname, '..', 'skills');
  if (!existsSync(skillsRoot)) {
    console.error(`Skills directory not found: ${skillsRoot}`);
    process.exit(1);
  }

  // Claude Code global commands directory
  const commandsDir = join(homedir(), '.claude', 'commands');

  const skillDirs = readdirSync(skillsRoot, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  if (skillDirs.length === 0) {
    console.log('No skills found to install.');
    return;
  }

  if (opts.dryRun) {
    console.log(`${BOLD}${YELLOW}dry-run${R} — no files will be written\n`);
  }

  if (!opts.dryRun) {
    mkdirSync(commandsDir, { recursive: true });
  }

  let installed = 0;
  let skipped = 0;

  for (const skillName of skillDirs) {
    const skillDir = join(skillsRoot, skillName);
    const dest = join(commandsDir, `${skillName}.md`);

    // Collect all .md files in skill directory, SKILL.md first
    const mdFiles = readdirSync(skillDir)
      .filter(f => f.endsWith('.md'))
      .sort((a, b) => (a === 'SKILL.md' ? -1 : b === 'SKILL.md' ? 1 : a.localeCompare(b)));

    if (mdFiles.length === 0) {
      console.log(`  ${DIM}skip${R}  ${skillName}  ${DIM}(no .md files)${R}`);
      skipped++;
      continue;
    }

    if (existsSync(dest) && !opts.force) {
      console.log(`  ${YELLOW}skip${R}  ${skillName}  ${DIM}(already installed — use --force to overwrite)${R}`);
      skipped++;
      continue;
    }

    // Merge all .md files; replace ${CLAUDE_PLUGIN_ROOT} with actual path
    const content = mdFiles
      .map(f => readFileSync(join(skillDir, f), 'utf-8'))
      .join('\n\n---\n\n')
      .replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, resolve(__dirname, '..'));

    if (opts.dryRun) {
      console.log(`  ${CYAN}would install${R}  ${BOLD}${skillName}${R}  →  ${DIM}${dest}${R}  ${DIM}(${content.length} chars)${R}`);
    } else {
      writeFileSync(dest, content, 'utf-8');
      console.log(`  ${GREEN}✓${R}  ${BOLD}${skillName}${R}  →  ${DIM}${dest}${R}`);
    }
    installed++;
  }

  console.log('');
  if (opts.dryRun) {
    console.log(`${DIM}Would install ${installed} skill(s), skip ${skipped}${R}`);
  } else if (installed > 0) {
    console.log(`${GREEN}${BOLD}✓ Installed ${installed} skill(s)${R}  ${DIM}Available as slash commands in Claude Code (e.g. /open-prose)${R}`);
  } else {
    console.log(`${YELLOW}Nothing installed.${R} ${DIM}All skills already exist. Use --force to overwrite.${R}`);
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

  case 'install-skills':
    installSkills({
      force: args.includes('--force'),
      dryRun: args.includes('--dry-run'),
    });
    break;

  case 'help':
  case '--help':
  case '-h':
    printUsage();
    break;

  case 'version':
  case '--version':
  case '-v':
    console.log(`OpenProse CLI v${VERSION}`);
    break;

  case undefined:
    printUsage();
    break;

  default:
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
}
