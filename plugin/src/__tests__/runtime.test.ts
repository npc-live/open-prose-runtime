/**
 * Runtime tests
 */

import { parse } from '../parser';
import { RuntimeEnvironment, Interpreter, execute } from '../runtime';

describe('Runtime - Basic Execution', () => {
  let env: RuntimeEnvironment;
  let interpreter: Interpreter;

  beforeEach(() => {
    env = new RuntimeEnvironment({ debug: false });
    interpreter = new Interpreter(env);
  });

  it('should execute a simple program', async () => {
    const source = `session "Hello, world!"`;
    const parseResult = parse(source);
    expect(parseResult.errors).toHaveLength(0);

    const result = await interpreter.execute(parseResult.program);

    expect(result.success).toBe(true);
    expect(result.metadata.sessionsCreated).toBe(1);
    expect(result.metadata.statementsExecuted).toBe(1);
  });

  it('should declare and use variables', async () => {
    const source = `
let name = "OpenProse"
let version = 1
    `;

    const parseResult = parse(source);
    const result = await interpreter.execute(parseResult.program);

    expect(result.success).toBe(true);
    expect(result.outputs.get('name')).toBe('OpenProse');
    expect(result.outputs.get('version')).toBe(1);
  });

  it('should handle const variables', async () => {
    const source = `
const pi = 3.14
    `;

    const parseResult = parse(source);
    const result = await interpreter.execute(parseResult.program);

    expect(result.success).toBe(true);
    expect(result.outputs.get('pi')).toBe(3.14);
  });

  it('should allow reassigning let variables', async () => {
    const source = `
let counter = 0
counter = 1
counter = 2
    `;

    const parseResult = parse(source);
    const result = await interpreter.execute(parseResult.program);

    expect(result.success).toBe(true);
    expect(result.outputs.get('counter')).toBe(2);
  });

  it('should execute session with variable assignment', async () => {
    const source = `
let result = session "Research AI agents"
    `;

    const parseResult = parse(source);
    const result = await interpreter.execute(parseResult.program);

    expect(result.success).toBe(true);
    expect(result.outputs.has('result')).toBe(true);
    expect(result.metadata.sessionsCreated).toBe(1);
  });

  it('should handle string interpolation', async () => {
    const source = `
let topic = "AI"
let research = session "Research {topic} agents"
    `;

    const parseResult = parse(source);
    const result = await interpreter.execute(parseResult.program);

    expect(result.success).toBe(true);
    expect(result.metadata.sessionsCreated).toBe(1);
  });

  it('should handle arrays', async () => {
    const source = `
let items = ["a", "b", "c"]
    `;

    const parseResult = parse(source);
    const result = await interpreter.execute(parseResult.program);

    expect(result.success).toBe(true);
    expect(result.outputs.get('items')).toEqual(['a', 'b', 'c']);
  });

  it('should register agents', async () => {
    const source = `
agent researcher:
  model: "sonnet"
  skills: ["web-search"]
    `;

    const parseResult = parse(source);
    const result = await interpreter.execute(parseResult.program);

    expect(result.success).toBe(true);

    const agent = env.getAgent('researcher');
    expect(agent).toBeDefined();
    expect(agent?.model).toBe('sonnet');
    expect(agent?.skills).toContain('web-search');
  });

  it('should execute multiple statements sequentially', async () => {
    const source = `
let step1 = session "Step 1"
let step2 = session "Step 2"
let step3 = session "Step 3"
    `;

    const parseResult = parse(source);
    const result = await interpreter.execute(parseResult.program);

    expect(result.success).toBe(true);
    expect(result.metadata.sessionsCreated).toBe(3);
    expect(result.metadata.statementsExecuted).toBe(3);
    expect(result.outputs.size).toBe(3);
  });
});

describe('Runtime - Context Management', () => {
  it('should pass context to sessions', async () => {
    const source = `
let data = "important data"
let result = session "Process the data"
  context: data
    `;

    const parseResult = parse(source);
    const result = await execute(parseResult.program);

    expect(result.success).toBe(true);
  });

  it('should pass multiple variables in context', async () => {
    const source = `
let a = "first"
let b = "second"
let result = session "Combine data"
  context: [a, b]
    `;

    const parseResult = parse(source);
    const result = await execute(parseResult.program);

    expect(result.success).toBe(true);
  });

  it('should handle object context shorthand', async () => {
    const source = `
let x = 1
let y = 2
let result = session "Calculate"
  context: { x, y }
    `;

    const parseResult = parse(source);
    const result = await execute(parseResult.program);

    expect(result.success).toBe(true);
  });
});

describe('Runtime - Error Handling', () => {
  it('should fail on undefined variable', async () => {
    const source = `
let result = undefined_var
    `;

    const parseResult = parse(source);
    const result = await execute(parseResult.program);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should fail on const reassignment', async () => {
    const source = `
const x = 1
x = 2
    `;

    const parseResult = parse(source);
    const result = await execute(parseResult.program);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should track execution metadata', async () => {
    const source = `
let a = session "Task A"
let b = session "Task B"
    `;

    const parseResult = parse(source);
    const result = await execute(parseResult.program);

    expect(result.success).toBe(true);
    expect(result.metadata.duration).toBeGreaterThan(0);
    expect(result.metadata.sessionsCreated).toBe(2);
    expect(result.metadata.statementsExecuted).toBe(2);
  });
});

describe('Runtime - Convenience API', () => {
  it('should execute using convenience function', async () => {
    const source = `let x = "test"`;
    const parseResult = parse(source);

    const result = await execute(parseResult.program);

    expect(result.success).toBe(true);
    expect(result.outputs.get('x')).toBe('test');
  });

  it('should accept custom config', async () => {
    const source = `let x = 1`;
    const parseResult = parse(source);

    const result = await execute(parseResult.program, {
      defaultModel: 'opus',
      debug: true,
    });

    expect(result.success).toBe(true);
  });
});
