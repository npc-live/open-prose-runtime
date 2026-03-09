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

const RESET  = '\x1b[0m';
const DIM    = '\x1b[2m';
const CYAN   = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const BOLD   = '\x1b[1m';

const LOG_COLORS: Record<string, string> = {
  debug: DIM,
  info:  CYAN,
  warn:  YELLOW,
  error: `${BOLD}${RED}`,
};

const LOG_LABELS: Record<string, string> = {
  debug: 'DEBUG',
  info:  ' INFO',
  warn:  ' WARN',
  error: 'ERROR',
};

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
    const color = LOG_COLORS[level];
    const label = LOG_LABELS[level];
    const ts = `${DIM}${timestamp}${RESET}`;
    const lv = `${color}[${label}]${RESET}`;
    const msg = level === 'error' ? `${RED}${message}${RESET}`
              : level === 'warn'  ? `${YELLOW}${message}${RESET}`
              : message;

    const line = `${ts} ${lv} ${msg}`;

    // All runtime logs go to stderr so they don't pollute stdout/results
    process.stderr.write(line + '\n');
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
