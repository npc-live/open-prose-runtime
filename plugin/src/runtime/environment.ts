/**
 * Runtime Environment - provides infrastructure for execution
 */

import { ContextManager } from './context';
import {
  RuntimeConfig,
  DEFAULT_RUNTIME_CONFIG,
  ExecutionError,
  AgentInstance,
} from './types';

/**
 * Runtime Environment
 */
export class RuntimeEnvironment {
  public readonly config: RuntimeConfig;
  public readonly contextManager: ContextManager;
  private agents: Map<string, AgentInstance> = new Map();
  private errors: ExecutionError[] = [];
  private startTime: number = 0;
  private sessionCount: number = 0;
  private statementCount: number = 0;
  private callDepth: number = 0;

  constructor(config?: Partial<RuntimeConfig>) {
    this.config = { ...DEFAULT_RUNTIME_CONFIG, ...config };
    this.contextManager = new ContextManager();
  }

  /**
   * Start execution timer
   */
  startExecution(): void {
    this.startTime = Date.now();
    this.errors = [];
    this.sessionCount = 0;
    this.statementCount = 0;
    this.callDepth = 0;
  }

  /**
   * Get execution duration in milliseconds
   */
  getExecutionDuration(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Check if execution has timed out
   */
  hasTimedOut(): boolean {
    return this.getExecutionDuration() > this.config.totalExecutionTimeout;
  }

  /**
   * Register an agent definition
   */
  registerAgent(agent: AgentInstance): void {
    if (this.agents.has(agent.name)) {
      throw new Error(`Agent '${agent.name}' is already registered`);
    }
    this.agents.set(agent.name, agent);
  }

  /**
   * Get an agent by name
   */
  getAgent(name: string): AgentInstance | undefined {
    return this.agents.get(name);
  }

  /**
   * Increment session counter
   */
  incrementSessionCount(): void {
    this.sessionCount++;
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessionCount;
  }

  /**
   * Increment statement counter
   */
  incrementStatementCount(): void {
    this.statementCount++;
  }

  /**
   * Get statement count
   */
  getStatementCount(): number {
    return this.statementCount;
  }

  /**
   * Increment call depth
   */
  incrementCallDepth(): void {
    this.callDepth++;
    if (this.callDepth > this.config.maxCallDepth) {
      throw new Error(`Maximum call depth (${this.config.maxCallDepth}) exceeded`);
    }
  }

  /**
   * Decrement call depth
   */
  decrementCallDepth(): void {
    this.callDepth--;
  }

  /**
   * Add an execution error
   */
  addError(error: ExecutionError): void {
    this.errors.push(error);
  }

  /**
   * Get all errors
   */
  getErrors(): ExecutionError[] {
    return [...this.errors];
  }

  /**
   * Check if there are any errors
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Log a message (respects log level)
   */
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'debug':
        console.debug(`${prefix} ${message}`);
        break;
      case 'info':
        console.info(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
    }
  }

  /**
   * Check if we should log at this level
   */
  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Trace execution if enabled
   */
  trace(message: string): void {
    if (this.config.traceExecution) {
      this.log('debug', `TRACE: ${message}`);
    }
  }

  /**
   * Reset the environment
   */
  reset(): void {
    this.contextManager.reset();
    this.agents.clear();
    this.errors = [];
    this.startTime = 0;
    this.sessionCount = 0;
    this.statementCount = 0;
    this.callDepth = 0;
  }
}
