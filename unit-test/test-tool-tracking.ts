#!/usr/bin/env bun
/**
 * Test tool execution tracking
 */

import { parse } from './plugin/src/parser/index.js';
import { execute, ToolRegistry } from './plugin/src/runtime/index.js';

// Define a test program with multiple tool calls
const programSource = `
agent math_agent:
  model: sonnet
  skills: ["calculate", "random_number"]
  prompt: "You are a math wizard"

# Multiple tool calls to test tracking
let calc1 = session: math_agent
  prompt: "Calculate 10 + 20"

let calc2 = session: math_agent
  prompt: "Generate 3 random numbers between 1-10 and calculate their sum"
`;

async function main() {
  console.log('🧪 Testing Tool Execution Tracking\n');

  // Parse the program
  const parseResult = parse(programSource);
  if (!parseResult.program) {
    console.error('Parse failed');
    return;
  }

  // Create a tool registry with listener
  const toolRegistry = new ToolRegistry();

  let callCount = 0;
  toolRegistry.onExecute((event) => {
    callCount++;
    console.log(`\n📊 Tool Event #${callCount}:`);
    console.log(`  Name: ${event.name}`);
    console.log(`  Args: ${JSON.stringify(event.arguments)}`);
    console.log(`  Duration: ${event.duration}ms`);
    if (event.error) {
      console.log(`  Status: ❌ FAILED`);
      console.log(`  Error: ${event.error.message}`);
    } else {
      console.log(`  Status: ✅ SUCCESS`);
      console.log(`  Result: ${JSON.stringify(event.result)}`);
    }
  });

  // Execute with tracking
  console.log('📝 Executing program with tool tracking enabled\n');
  const result = await execute(parseResult.program, {}, []);

  if (result.success) {
    console.log('\n\n✅ Execution completed successfully\n');

    // Get statistics
    const stats = toolRegistry.getStatistics();

    console.log('📈 Execution Statistics:');
    console.log(`  Total tool calls: ${stats.totalCalls}`);
    console.log(`  Successful: ${stats.successfulCalls}`);
    console.log(`  Failed: ${stats.failedCalls}`);
    console.log(`  Average duration: ${stats.averageDuration.toFixed(2)}ms`);
    console.log('\n  Tool usage breakdown:');
    for (const [tool, count] of Object.entries(stats.toolUsage)) {
      console.log(`    - ${tool}: ${count} call(s)`);
    }

    // Get full log
    const log = toolRegistry.getExecutionLog();
    console.log(`\n📋 Full execution log (${log.length} entries):`);
    for (let i = 0; i < log.length; i++) {
      const entry = log[i];
      const status = entry.error ? '❌' : '✅';
      console.log(`  ${i + 1}. ${status} ${entry.name} - ${entry.duration}ms`);
    }
  } else {
    console.log('\n❌ Execution failed\n');
  }
}

main().catch(console.error);
