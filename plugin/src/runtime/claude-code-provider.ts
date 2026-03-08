/**
 * Claude Code Provider
 * Integrates local Claude Code as an AI provider for OpenProse agents
 */

import { spawn } from 'child_process';
import { SessionResult, SessionSpec, RuntimeConfig } from './types';

/**
 * Claude Code Provider - uses local Claude Code CLI
 */
export class ClaudeCodeProvider {
  private claudeCodePath: string;

  constructor(claudeCodePath: string = 'claude') {
    this.claudeCodePath = claudeCodePath;
  }

  /**
   * Execute a session using local Claude Code
   */
  async executeSession(
    spec: SessionSpec,
    config: RuntimeConfig,
    enableTools: boolean = false,
    allowedTools?: string[],
    skillPrompts?: string[]
  ): Promise<SessionResult> {
    const startTime = Date.now();

    try {
      // Build the prompt with context
      const fullPrompt = this.buildPromptWithContext(spec, enableTools, allowedTools, skillPrompts);

      // Call Claude Code
      const output = await this.callClaudeCode(fullPrompt);

      // Parse tool calls from output if any
      const toolCalls = this.extractToolCalls(output);

      return {
        output: output,
        metadata: {
          model: 'claude-code-local',
          duration: Date.now() - startTime,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to execute Claude Code session: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Call Claude Code CLI
   */
  private async callClaudeCode(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = ['--output-format', 'text'];

      const child = spawn(this.claudeCodePath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
      });

      let stdout = '';
      let stderr = '';
      let resolved = false;

      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          child.stdout?.removeAllListeners();
          child.stderr?.removeAllListeners();
          child.removeAllListeners();
          try {
            child.kill('SIGTERM');
          } catch (e) {
            // Process may already be dead
          }
        }
      };

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (error) => {
        cleanup();
        reject(new Error(`Failed to spawn Claude Code: ${error.message}`));
      });

      child.on('close', (code) => {
        cleanup();
        if (code !== 0) {
          reject(new Error(`Claude Code exited with code ${code}: ${stderr}`));
        } else {
          resolve(stdout.trim());
        }
      });

      // Send prompt to stdin
      try {
        child.stdin.write(prompt);
        child.stdin.end();
      } catch (error) {
        cleanup();
        reject(new Error(`Failed to write to Claude Code stdin: ${error}`));
      }

      // Timeout after 5 minutes
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Claude Code execution timed out'));
      }, 5 * 60 * 1000);

      // Clear timeout on completion
      child.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }

  /**
   * Build a prompt with context information and tool instructions
   */
  private buildPromptWithContext(
    spec: SessionSpec,
    enableTools: boolean,
    allowedTools?: string[],
    skillPrompts?: string[]
  ): string {
    let prompt = '';

    // Add agent-specific system prompt if available
    if (spec.agent?.prompt) {
      prompt += `${spec.agent.prompt}\n\n`;
    }

    // Add tool instructions if tools are enabled
    if (enableTools && allowedTools && allowedTools.length > 0) {
      prompt += `## Available Tools\n\n`;
      prompt += `You have access to the following tools:\n`;
      prompt += allowedTools.map(tool => `- ${tool}`).join('\n');
      prompt += `\n\nUse these tools proactively to accomplish the task. After using tools, summarize what you did.\n\n`;
    }

    // Add skill prompts (knowledge/guidance) if available
    if (skillPrompts && skillPrompts.length > 0) {
      prompt += '## Skills and Knowledge\n\n';
      prompt += skillPrompts.join('\n\n---\n\n');
      prompt += '\n\n';
    }

    // Add main prompt
    prompt += `## Task\n\n${spec.prompt}\n\n`;

    // Add context if provided
    if (spec.context && spec.context.variables) {
      const contextVars = spec.context.variables;
      const contextKeys = Object.keys(contextVars);

      if (contextKeys.length > 0) {
        prompt += '## Context\n\n';

        for (const key of contextKeys) {
          const value = contextVars[key];
          prompt += `### ${key}\n`;
          prompt += `${this.formatValue(value)}\n\n`;
        }
      }
    }

    return prompt;
  }

  /**
   * Format a value for display in context
   */
  private formatValue(value: any): string {
    if (typeof value === 'string') {
      return value;
    } else if (typeof value === 'object' && value !== null) {
      if ('output' in value && 'metadata' in value) {
        // SessionResult - return the output
        return value.output;
      }
      return JSON.stringify(value, null, 2);
    } else {
      return String(value);
    }
  }

  /**
   * Extract tool calls from Claude Code output
   * This is a simple heuristic - Claude Code output may include tool usage info
   */
  private extractToolCalls(output: string): any[] {
    const toolCalls: any[] = [];

    // Look for patterns like "Used tool: bash" or "Called: read_file"
    const toolPattern = /(?:Used tool|Called|Tool used):\s*(\w+)/gi;
    let match;

    while ((match = toolPattern.exec(output)) !== null) {
      toolCalls.push({
        name: match[1].toLowerCase(),
        arguments: {},
        result: 'Tool used via Claude Code',
      });
    }

    return toolCalls;
  }

  /**
   * Test the Claude Code connection
   */
  async test(): Promise<boolean> {
    try {
      const result = await this.executeSession(
        {
          agent: null,
          prompt: 'Say "Hello from Claude Code!"',
          context: null,
        },
        {
          defaultModel: 'sonnet',
        } as RuntimeConfig
      );

      return result.output.length > 0;
    } catch (error) {
      console.error('Claude Code test failed:', error);
      return false;
    }
  }
}

/**
 * Create a Claude Code provider
 */
export function createClaudeCodeProvider(claudeCodePath?: string): ClaudeCodeProvider {
  return new ClaudeCodeProvider(claudeCodePath);
}
