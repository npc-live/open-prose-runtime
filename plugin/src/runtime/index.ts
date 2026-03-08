/**
 * Runtime module exports
 */

export * from './types';
export * from './context';
export * from './environment';
export * from './interpreter';
export * from './openrouter';
export * from './claude-code-provider';
export * from './tools';

/**
 * Convenience function to execute a program
 */
import { ProgramNode } from '../parser';
import { RuntimeEnvironment } from './environment';
import { Interpreter } from './interpreter';
import { ExecutionResult, RuntimeConfig } from './types';
import { createOpenRouterClient } from './openrouter';
import { createClaudeCodeProvider } from './claude-code-provider';
import { ToolDefinition, ToolRegistry } from './tools';

export async function execute(
  program: ProgramNode,
  config?: Partial<RuntimeConfig>,
  customTools?: ToolDefinition[]
): Promise<ExecutionResult> {
  const env = new RuntimeEnvironment(config);

  // Always create tool registry (needed for imports)
  const toolRegistry = new ToolRegistry();

  // Register custom tools if provided
  if (customTools && customTools.length > 0) {
    for (const tool of customTools) {
      toolRegistry.register(tool);
      env.log('info', `Registered custom tool: ${tool.name}`);
    }
  }

  // Create OpenRouter client with tool registry
  const openRouterClient = createOpenRouterClient(toolRegistry);

  // Create Claude Code provider
  const claudeCodeProvider = createClaudeCodeProvider();

  const interpreter = new Interpreter(env, openRouterClient, toolRegistry, claudeCodeProvider);
  return await interpreter.execute(program);
}
