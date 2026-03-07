# OpenProse 执行引擎技术实现文档

## 1. 项目概述

### 1.1 当前状态
OpenProse 目前已实现：
- **词法分析器 (Lexer)**: 解析 `.prose` 源代码为 Token 流
- **语法分析器 (Parser)**: 将 Token 流转换为抽象语法树 (AST)
- **语义验证器 (Validator)**: 验证程序的语义正确性（变量引用、作用域等）
- **编译器 (Compiler)**: 将 AST 编译为标准化的格式

### 1.2 需求目标
实现一个**执行引擎 (Execution Engine)**，使 `.prose` 程序能够：
1. 解析程序的控制流结构（顺序、并行、循环、条件等）
2. 根据程序定义创建和管理 AI Agent 会话
3. 执行代码约束和条件判断
4. 传递上下文和变量状态
5. 处理错误和异常情况
6. 返回执行结果

---

## 2. 核心架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      .prose Source File                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: Compilation (已实现)                                │
│  ┌──────────┐   ┌──────────┐   ┌───────────┐   ┌─────────┐ │
│  │  Lexer   │──▶│  Parser  │──▶│ Validator │──▶│Compiler │ │
│  └──────────┘   └──────────┘   └───────────┘   └─────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │ Compiled AST
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 2: Execution (待实现)                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Orchestrator (智能编排器)                    │   │
│  │  ┌──────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│  │  │ Interpreter  │  │   Context   │  │   Agent    │  │   │
│  │  │  (执行器)     │◀▶│   Manager   │◀▶│  Manager   │  │   │
│  │  └──────────────┘  └─────────────┘  └────────────┘  │   │
│  │         ▲                                             │   │
│  │         │                                             │   │
│  │         ▼                                             │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │         Runtime Environment                   │   │   │
│  │  │  - Variable Store                             │   │   │
│  │  │  - Session Pool                               │   │   │
│  │  │  - Error Handler                              │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
              Execution Results
```

### 2.2 核心组件

#### 2.2.1 Interpreter (解释器)
**职责**：遍历 AST 并执行每个节点
```typescript
interface Interpreter {
  // 执行程序入口
  execute(program: ProgramNode): Promise<ExecutionResult>;

  // 执行语句节点
  executeStatement(stmt: StatementNode): Promise<StatementResult>;

  // 执行表达式节点
  evaluateExpression(expr: ExpressionNode): Promise<Value>;

  // 处理控制流
  executeControlFlow(node: ControlFlowNode): Promise<void>;
}
```

**实现要点**：
- 访问者模式遍历 AST
- 支持异步执行（AI 会话需要等待响应）
- 维护执行栈用于调试和错误追踪

#### 2.2.2 Context Manager (上下文管理器)
**职责**：管理变量作用域和上下文传递
```typescript
interface ContextManager {
  // 变量管理
  declareVariable(name: string, value: Value, isConst: boolean): void;
  getVariable(name: string): Value | undefined;
  setVariable(name: string, value: Value): void;

  // 作用域管理
  pushScope(): void;
  popScope(): void;

  // 上下文快照（用于传递给 Agent）
  captureContext(variables: string[]): ContextSnapshot;
}
```

**数据结构**：
```typescript
interface Scope {
  variables: Map<string, Variable>;
  parent: Scope | null;
}

interface Variable {
  name: string;
  value: Value;
  isConst: boolean;
  type: 'string' | 'number' | 'array' | 'object' | 'session_result';
}
```

#### 2.2.3 Agent Manager (代理管理器)
**职责**：创建、管理和调度 AI Agent 会话
```typescript
interface AgentManager {
  // 创建 Agent 实例
  createAgent(definition: AgentDefinitionNode): AgentInstance;

  // 启动会话
  startSession(
    agent: AgentInstance | null,
    prompt: string,
    context: ContextSnapshot
  ): Promise<SessionHandle>;

  // 等待会话完成
  waitForSession(handle: SessionHandle): Promise<SessionResult>;

  // 并行执行多个会话
  executeParallel(
    sessions: SessionSpec[],
    strategy: JoinStrategy
  ): Promise<ParallelResult>;
}
```

**Agent 定义**：
```typescript
interface AgentInstance {
  name: string;
  model: 'opus' | 'sonnet' | 'haiku';
  skills: string[];
  permissions: PermissionRules;
  defaultPrompt?: string;
}

interface SessionSpec {
  agent: AgentInstance | null;  // null = 使用默认
  prompt: string;
  context: ContextSnapshot;
  name?: string;  // 用于命名结果变量
}
```

#### 2.2.4 Runtime Environment (运行时环境)
**职责**：提供执行时的基础设施
```typescript
interface RuntimeEnvironment {
  // 变量存储
  variableStore: VariableStore;

  // 会话池（用于并行执行）
  sessionPool: SessionPool;

  // 错误处理器
  errorHandler: ErrorHandler;

  // 配置
  config: RuntimeConfig;
}

interface RuntimeConfig {
  // 默认模型
  defaultModel: 'opus' | 'sonnet' | 'haiku';

  // 超时设置
  sessionTimeout: number;
  maxConcurrentSessions: number;

  // 安全限制
  maxLoopIterations: number;  // 防止无限循环
  maxCallDepth: number;       // 防止递归爆栈

  // 调试选项
  debug: boolean;
  traceExecution: boolean;
}
```

---

## 3. 执行模型详解

### 3.1 执行流程

#### 3.1.1 顺序执行 (Sequential)
```prose
session "First task"
session "Second task"
session "Third task"
```

**执行逻辑**：
1. 创建默认 Agent 会话执行 "First task"
2. 等待第一个会话完成，获取结果
3. 创建新会话执行 "Second task"（可访问前面的结果）
4. 依次执行后续会话

**代码实现**：
```typescript
async function executeSequential(statements: StatementNode[]): Promise<void> {
  for (const stmt of statements) {
    await executeStatement(stmt);
  }
}
```

#### 3.1.2 并行执行 (Parallel)
```prose
parallel:
  researchA = session "Research topic A"
  researchB = session "Research topic B"
  researchC = session "Research topic C"
```

**执行逻辑**：
1. 同时启动 3 个会话（不等待）
2. 根据 join 策略决定何时继续：
   - `all` (默认): 等待所有会话完成
   - `first`: 等待第一个完成
   - `any(N)`: 等待 N 个完成
3. 收集结果并绑定到变量

**代码实现**：
```typescript
async function executeParallel(
  parallel: ParallelBlockNode
): Promise<Map<string, Value>> {
  const sessionSpecs: SessionSpec[] = [];

  // 收集所有会话规格
  for (const stmt of parallel.body) {
    if (stmt.type === 'LetBinding' && stmt.value.type === 'SessionStatement') {
      sessionSpecs.push({
        name: stmt.name.name,
        ...extractSessionSpec(stmt.value)
      });
    }
  }

  // 并行启动
  const handles = await Promise.all(
    sessionSpecs.map(spec => agentManager.startSession(...))
  );

  // 根据策略等待
  const results = await waitWithStrategy(handles, parallel.joinStrategy);

  return results;
}
```

#### 3.1.3 循环执行 (Loop)

##### 固定次数循环 (Repeat)
```prose
repeat 3 as i:
  session "Process iteration {i}"
```

**执行逻辑**：
```typescript
async function executeRepeat(repeat: RepeatBlockNode): Promise<void> {
  const count = evaluateExpression(repeat.count);

  for (let i = 0; i < count; i++) {
    if (repeat.indexVar) {
      contextManager.setVariable(repeat.indexVar.name, i);
    }

    for (const stmt of repeat.body) {
      await executeStatement(stmt);
    }
  }
}
```

##### 条件循环 (Loop Until/While)
```prose
loop until **the code is production ready** (max: 5):
  session "Review and improve the code"
```

**执行逻辑**：
```typescript
async function executeLoop(loop: LoopBlockNode): Promise<void> {
  const maxIter = loop.maxIterations?.value || runtimeConfig.maxLoopIterations;
  let iteration = 0;

  while (iteration < maxIter) {
    // 执行循环体
    for (const stmt of loop.body) {
      await executeStatement(stmt);
    }

    // AI 评估条件
    if (loop.condition) {
      const shouldStop = await evaluateDiscretion(
        loop.condition,
        loop.variant === 'until' ? 'stop-when-true' : 'stop-when-false'
      );

      if (shouldStop) break;
    }

    iteration++;
  }
}
```

**关键**：`evaluateDiscretion()` 需要向 Orchestrator AI 提问：
```typescript
async function evaluateDiscretion(
  discretion: DiscretionNode,
  mode: 'stop-when-true' | 'stop-when-false'
): Promise<boolean> {
  const prompt = `
Based on the current context and execution history,
evaluate this condition: "${discretion.expression}"

Context:
${captureCurrentContext()}

Answer with JSON:
{ "result": true/false, "reasoning": "..." }
`;

  const response = await orchestratorSession.ask(prompt);
  return response.result;
}
```

#### 3.1.4 条件分支 (If/Choice)

##### If Statement
```prose
if **the codebase is large**:
  session "Use thorough analysis"
else:
  session "Use quick scan"
```

**执行逻辑**：
```typescript
async function executeIf(ifStmt: IfStatementNode): Promise<void> {
  const condition = await evaluateDiscretion(ifStmt.condition, 'execute-when-true');

  if (condition) {
    for (const stmt of ifStmt.thenBody) {
      await executeStatement(stmt);
    }
  } else {
    // 检查 elif 子句
    for (const elif of ifStmt.elseIfClauses) {
      const elifCondition = await evaluateDiscretion(elif.condition, 'execute-when-true');
      if (elifCondition) {
        for (const stmt of elif.body) {
          await executeStatement(stmt);
        }
        return;
      }
    }

    // else 分支
    if (ifStmt.elseBody) {
      for (const stmt of ifStmt.elseBody) {
        await executeStatement(stmt);
      }
    }
  }
}
```

##### Choice Block
```prose
choice **which approach is best for this codebase**:
  option "modular":
    session "Refactor into modules"
  option "monolithic":
    session "Keep as single file"
```

**执行逻辑**：
```typescript
async function executeChoice(choice: ChoiceBlockNode): Promise<void> {
  // AI 选择一个选项
  const selectedOption = await orchestratorChoose(
    choice.criteria.expression,
    choice.options.map(opt => opt.label.value)
  );

  // 执行选中的选项
  const option = choice.options.find(o => o.label.value === selectedOption);
  if (option) {
    for (const stmt of option.body) {
      await executeStatement(stmt);
    }
  }
}

async function orchestratorChoose(
  criteria: string,
  options: string[]
): Promise<string> {
  const prompt = `
Select ONE option based on this criteria: "${criteria}"

Available options:
${options.map((o, i) => `${i + 1}. ${o}`).join('\n')}

Current context:
${captureCurrentContext()}

Return JSON:
{ "selected": "option-name", "reasoning": "..." }
`;

  const response = await orchestratorSession.ask(prompt);
  return response.selected;
}
```

### 3.2 上下文传递机制

#### 3.2.1 Context 属性
```prose
let research = session "Research AI agents"

session "Summarize findings":
  context: research
```

**实现**：
```typescript
interface ContextSnapshot {
  variables: Record<string, any>;
  metadata: {
    timestamp: number;
    executionPath: string[];
  };
}

function buildContextForSession(
  contextExpr: ExpressionNode
): ContextSnapshot {
  if (contextExpr.type === 'Identifier') {
    // context: varName
    const value = contextManager.getVariable(contextExpr.name);
    return { variables: { [contextExpr.name]: value } };
  }
  else if (contextExpr.type === 'ArrayExpression') {
    // context: [var1, var2, var3]
    const vars = {};
    for (const elem of contextExpr.elements) {
      if (elem.type === 'Identifier') {
        vars[elem.name] = contextManager.getVariable(elem.name);
      }
    }
    return { variables: vars };
  }
  else if (contextExpr.type === 'ObjectExpression') {
    // context: { var1, var2 }
    const vars = {};
    for (const prop of contextExpr.properties) {
      const name = prop.name.name;
      vars[name] = contextManager.getVariable(name);
    }
    return { variables: vars };
  }
}
```

#### 3.2.2 上下文编码
将上下文转换为 Prompt 的一部分：

```typescript
function encodeContextToPrompt(context: ContextSnapshot): string {
  let prompt = '\n\n## Context\n\n';

  for (const [name, value] of Object.entries(context.variables)) {
    if (typeof value === 'string') {
      prompt += `### ${name}\n${value}\n\n`;
    } else if (Array.isArray(value)) {
      prompt += `### ${name} (array)\n${value.map((v, i) => `${i}: ${v}`).join('\n')}\n\n`;
    } else if (typeof value === 'object') {
      prompt += `### ${name} (object)\n${JSON.stringify(value, null, 2)}\n\n`;
    }
  }

  return prompt;
}
```

### 3.3 错误处理机制

#### 3.3.1 Try/Catch/Finally
```prose
try:
  session "Risky operation"
catch as err:
  session "Handle error: {err}"
finally:
  session "Cleanup resources"
```

**实现**：
```typescript
async function executeTry(tryBlock: TryBlockNode): Promise<void> {
  let error: Error | null = null;

  try {
    // 执行 try 块
    for (const stmt of tryBlock.tryBody) {
      await executeStatement(stmt);
    }
  } catch (e) {
    error = e as Error;

    // 执行 catch 块
    if (tryBlock.catchBody) {
      if (tryBlock.errorVar) {
        contextManager.declareVariable(tryBlock.errorVar.name, {
          message: error.message,
          stack: error.stack,
          type: error.name
        }, true);
      }

      for (const stmt of tryBlock.catchBody) {
        await executeStatement(stmt);
      }
    } else {
      // 没有 catch 块，重新抛出
      throw error;
    }
  } finally {
    // 总是执行 finally 块
    if (tryBlock.finallyBody) {
      for (const stmt of tryBlock.finallyBody) {
        await executeStatement(stmt);
      }
    }
  }

  // 如果有错误且没有被处理，重新抛出
  if (error && !tryBlock.catchBody) {
    throw error;
  }
}
```

#### 3.3.2 重试机制
```prose
session "Flaky operation":
  retry: 3
  backoff: "exponential"
```

**实现**：
```typescript
async function executeSessionWithRetry(
  session: SessionStatementNode
): Promise<SessionResult> {
  const retryCount = getPropertyValue(session.properties, 'retry') || 1;
  const backoffStrategy = getPropertyValue(session.properties, 'backoff') || 'linear';

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      return await executeSession(session);
    } catch (error) {
      lastError = error as Error;

      if (attempt < retryCount - 1) {
        // 计算等待时间
        const delay = calculateBackoff(attempt, backoffStrategy);
        await sleep(delay);
      }
    }
  }

  // 所有重试都失败
  throw lastError;
}

function calculateBackoff(attempt: number, strategy: string): number {
  switch (strategy) {
    case 'exponential':
      return Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s...
    case 'linear':
      return (attempt + 1) * 1000; // 1s, 2s, 3s, 4s...
    default:
      return 1000;
  }
}
```

---

## 4. 实现路线图

### 4.1 Phase 1: 基础执行引擎 (2-3周)

#### 里程碑 1.1: Runtime Environment Setup
- [ ] 创建 `src/runtime/` 目录结构
- [ ] 实现 `RuntimeEnvironment` 类
- [ ] 实现 `VariableStore` 和 `Scope` 管理
- [ ] 编写单元测试

#### 里程碑 1.2: Basic Interpreter
- [ ] 实现 `Interpreter` 类骨架
- [ ] 实现顺序语句执行
- [ ] 实现简单 Session 执行（无 Agent）
- [ ] 测试基本的 "hello world" 程序

#### 里程碑 1.3: Variable & Context
- [ ] 实现变量声明 (`let`, `const`)
- [ ] 实现变量赋值
- [ ] 实现作用域管理
- [ ] 实现 Context 传递
- [ ] 测试变量和上下文功能

### 4.2 Phase 2: Agent 集成 (2-3周)

#### 里程碑 2.1: Agent Definition
- [ ] 实现 `AgentManager` 类
- [ ] 支持 Agent 定义解析
- [ ] 支持 Agent 属性（model, skills, permissions）
- [ ] 测试 Agent 创建

#### 里程碑 2.2: Session Management
- [ ] 实现与 Claude Code 的集成（通过 API 或 CLI）
- [ ] 实现 Session 创建和执行
- [ ] 实现 Session 结果捕获
- [ ] 测试 Agent Session 执行

#### 里程碑 2.3: Discretion Evaluation
- [ ] 实现 Orchestrator 询问机制
- [ ] 实现 `**...**` 表达式求值
- [ ] 测试 AI 判断逻辑

### 4.3 Phase 3: 控制流 (3-4周)

#### 里程碑 3.1: Parallel Execution
- [ ] 实现并行块执行
- [ ] 实现 Join 策略 (all, first, any)
- [ ] 实现失败策略 (fail-fast, continue, ignore)
- [ ] 测试并行执行

#### 里程碑 3.2: Loops
- [ ] 实现 `repeat` 循环
- [ ] 实现 `for...in` 循环
- [ ] 实现 `loop until/while` 循环
- [ ] 实现循环安全限制
- [ ] 测试各种循环

#### 里程碑 3.3: Conditionals
- [ ] 实现 `if/elif/else` 条件
- [ ] 实现 `choice` 块
- [ ] 测试条件分支

### 4.4 Phase 4: 高级特性 (2-3周)

#### 里程碑 4.1: Error Handling
- [ ] 实现 `try/catch/finally`
- [ ] 实现 `throw` 语句
- [ ] 实现重试机制
- [ ] 测试错误处理

#### 里程碑 4.2: Pipeline Operations
- [ ] 实现 `map` 操作
- [ ] 实现 `filter` 操作
- [ ] 实现 `reduce` 操作
- [ ] 实现 `pmap` (并行 map)
- [ ] 测试管道操作

#### 里程碑 4.3: Composition Blocks
- [ ] 实现 `block` 定义
- [ ] 实现 `do` 块调用
- [ ] 实现参数传递
- [ ] 测试块组合

### 4.5 Phase 5: 优化和完善 (2周)

#### 里程碑 5.1: Performance
- [ ] 会话池优化
- [ ] 并行执行优化
- [ ] 内存管理优化

#### 里程碑 5.2: Debugging
- [ ] 执行追踪
- [ ] 断点支持
- [ ] 执行日志

#### 里程碑 5.3: Documentation
- [ ] API 文档
- [ ] 架构文档
- [ ] 使用指南

---

## 5. 技术选型

### 5.1 语言和框架
- **主语言**: TypeScript (与现有代码库一致)
- **运行时**: Node.js / Bun
- **测试框架**: Vitest (现有)

### 5.2 Agent 集成方式

#### 方案 A: Claude Code CLI 集成
```typescript
async function executeSession(prompt: string): Promise<string> {
  const result = await exec(`claude code -p "${prompt}"`);
  return result.stdout;
}
```

**优点**: 简单直接
**缺点**: 性能开销大，难以获取中间状态

#### 方案 B: Anthropic API 集成
```typescript
import Anthropic from '@anthropic-ai/sdk';

async function executeSession(prompt: string): Promise<string> {
  const anthropic = new Anthropic();
  const message = await anthropic.messages.create({
    model: 'claude-opus-4',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  });

  return message.content[0].text;
}
```

**优点**: 性能好，控制精细
**缺点**: 需要 API Key，可能有成本

#### 方案 C: 混合方式（推荐）
- 默认使用 Claude Code CLI（无需 API Key）
- 支持配置 Anthropic API（性能优化）
- 提供插件机制支持其他 AI 平台

### 5.3 执行模式

#### 5.3.1 Orchestrator 模式
使用一个主 Orchestrator Session 来：
- 解释和执行程序逻辑
- 评估 `**...**` 条件
- 决定控制流走向
- 创建和管理子 Session

```typescript
class Orchestrator {
  private mainSession: AnthropicSession;

  constructor() {
    this.mainSession = new AnthropicSession({
      model: 'claude-opus-4',
      systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT
    });
  }

  async execute(program: ProgramNode): Promise<ExecutionResult> {
    const prompt = `
Execute this OpenProse program:

\`\`\`prose
${compileToString(program)}
\`\`\`

Follow the OpenProse execution semantics strictly.
`;

    return await this.mainSession.send(prompt);
  }
}
```

**Orchestrator System Prompt**:
```
You are the OpenProse Orchestrator, an AI system responsible for
executing OpenProse programs.

Your responsibilities:
1. Execute statements in the order specified
2. Create sub-agents when encountering 'session' statements
3. Evaluate conditions in **...** using semantic understanding
4. Manage variable scope and context passing
5. Handle parallel execution and synchronization
6. Report execution results clearly

When you see:
- 'session "prompt"': Create a new AI session with that prompt
- 'parallel: ...': Execute contained sessions concurrently
- 'loop until **condition**': Evaluate the condition after each iteration
- 'if **condition**': Evaluate the condition to decide branching

Always maintain strict control flow while applying intelligent
judgment for condition evaluation and context passing.
```

---

## 6. 示例执行流程

### 6.1 简单顺序程序

**输入程序**:
```prose
let topic = "AI agents"
let research = session "Research {topic} in depth"
let summary = session "Summarize the research"
  context: research
```

**执行流程**:
1. 声明变量 `topic = "AI agents"`
2. 创建 Session 1: "Research AI agents in depth"
3. 等待 Session 1 完成，结果存入 `research`
4. 创建 Session 2: "Summarize the research"
   - Context: `{ research: "<Session 1 的输出>" }`
5. 等待 Session 2 完成，结果存入 `summary`
6. 返回最终状态

### 6.2 并行程序

**输入程序**:
```prose
parallel:
  bugs = session "Find bugs in code"
  perf = session "Find performance issues"
  security = session "Find security issues"

session "Create comprehensive report"
  context: [bugs, perf, security]
```

**执行流程**:
1. 启动 3 个并行 Session:
   - Session A: "Find bugs in code"
   - Session B: "Find performance issues"
   - Session C: "Find security issues"
2. 等待所有 Session 完成 (join strategy = "all")
3. 收集结果:
   - `bugs` = Session A 结果
   - `perf` = Session B 结果
   - `security` = Session C 结果
4. 创建 Session D: "Create comprehensive report"
   - Context: `{ bugs: "...", perf: "...", security: "..." }`
5. 返回最终报告

### 6.3 循环程序

**输入程序**:
```prose
let code = "initial code here"

loop until **the code passes all tests** (max: 5):
  code = session "Review and fix issues in the code"
    context: code
```

**执行流程**:
1. 初始化 `code`
2. **第 1 次迭代**:
   - 创建 Session 1: "Review and fix issues in the code"
   - 等待完成，更新 `code`
   - 询问 Orchestrator: "Does the code pass all tests?"
   - Orchestrator 回答: `{ result: false, reasoning: "Still has bugs" }`
   - 继续循环
3. **第 2-4 次迭代**: 类似...
4. **第 5 次迭代**:
   - 创建 Session 5
   - 询问 Orchestrator: "Does the code pass all tests?"
   - Orchestrator 回答: `{ result: true, reasoning: "All tests pass" }`
   - **退出循环**
5. 返回最终 `code`

---

## 7. 安全和限制

### 7.1 执行限制
```typescript
const DEFAULT_LIMITS = {
  // 防止无限循环
  MAX_LOOP_ITERATIONS: 100,

  // 防止递归爆栈
  MAX_CALL_DEPTH: 50,

  // 防止内存耗尽
  MAX_VARIABLE_SIZE: 10 * 1024 * 1024, // 10 MB
  MAX_TOTAL_MEMORY: 100 * 1024 * 1024, // 100 MB

  // 防止超时
  SESSION_TIMEOUT: 300000, // 5 分钟
  TOTAL_EXECUTION_TIMEOUT: 3600000, // 1 小时

  // 并行限制
  MAX_CONCURRENT_SESSIONS: 10,
};
```

### 7.2 权限控制
```prose
agent restricted:
  model: sonnet
  permissions:
    bash: deny
    file_write: deny
    network: allow
```

**实现**:
```typescript
interface PermissionRules {
  bash?: 'allow' | 'deny';
  file_read?: 'allow' | 'deny';
  file_write?: 'allow' | 'deny';
  network?: 'allow' | 'deny';
}

function checkPermission(
  agent: AgentInstance,
  action: string
): boolean {
  const rule = agent.permissions[action];
  return rule !== 'deny';
}
```

### 7.3 错误恢复
- Session 失败时的重试机制
- 并行执行中部分失败的处理
- 超时后的清理
- 资源泄漏防护

---

## 8. 测试策略

### 8.1 单元测试
- 每个组件独立测试
- Mock Agent 响应
- 边界条件测试

### 8.2 集成测试
- 完整程序端到端执行
- 与真实 Claude Code 集成测试
- 性能基准测试

### 8.3 LLM-as-Judge 测试
- 使用现有的 `test-harness/` 框架
- 验证 Orchestrator 行为正确性
- 评估条件判断的准确性

---

## 9. 部署和使用

### 9.1 CLI 扩展
```bash
# 编译（现有功能）
bun run bin/open-prose.ts compile program.prose

# 执行（新功能）
bun run bin/open-prose.ts run program.prose

# 调试执行
bun run bin/open-prose.ts run --debug program.prose

# 指定配置
bun run bin/open-prose.ts run --config config.json program.prose
```

### 9.2 API 使用
```typescript
import { parse, compile, execute } from 'open-prose';

// 方式 1: 从源码执行
const result = await execute(`
  session "Hello, world!"
`);

// 方式 2: 从 AST 执行
const parseResult = parse(source);
const compiled = compile(parseResult.program);
const result = await execute(compiled.program);

// 方式 3: 自定义配置
const result = await execute(program, {
  defaultModel: 'sonnet',
  maxConcurrentSessions: 5,
  debug: true
});
```

### 9.3 Plugin 集成
保持与现有 Claude Code Plugin 的兼容性：
```
/open-prose run examples/code-review.prose
```

---

## 10. 未来扩展

### 10.1 性能优化
- [ ] Session 结果缓存
- [ ] 智能并行调度
- [ ] 增量执行（仅执行变更部分）

### 10.2 调试工具
- [ ] 可视化执行流
- [ ] 断点调试
- [ ] 时间旅行调试

### 10.3 多平台支持
- [ ] OpenCode 集成
- [ ] Codex 集成
- [ ] 其他 AI 平台支持

### 10.4 分布式执行
- [ ] 跨机器并行执行
- [ ] 负载均衡
- [ ] 容错机制

---

## 11. 参考资料

### 11.1 相关文档
- `README.md`: 项目概述
- `plugin/skills/open-prose/prose.md`: 语言规范
- `specification/`: 设计文档
- `BUILD_PLAN.md`: 开发计划

### 11.2 相关项目
- LangChain: Python/JS 的 AI 编排框架
- AutoGen: 微软的多 Agent 框架
- CrewAI: Python 的 Agent 协作框架

### 11.3 技术参考
- Anthropic API 文档
- Claude Code 文档
- TypeScript AST 操作

---

## 附录 A: 数据结构定义

```typescript
// 执行结果
interface ExecutionResult {
  success: boolean;
  outputs: Map<string, any>;
  errors: ExecutionError[];
  metadata: {
    duration: number;
    sessionsCreated: number;
    tokensUsed: number;
  };
}

// 执行错误
interface ExecutionError {
  type: 'syntax' | 'runtime' | 'timeout' | 'permission';
  message: string;
  location: SourceSpan;
  stack: string[];
}

// Session 结果
interface SessionResult {
  output: string;
  metadata: {
    model: string;
    duration: number;
    tokensUsed: number;
  };
}

// 值类型
type Value =
  | string
  | number
  | boolean
  | Value[]
  | { [key: string]: Value }
  | SessionResult;
```

---

## 附录 B: 配置文件示例

```json
{
  "runtime": {
    "defaultModel": "sonnet",
    "maxConcurrentSessions": 5,
    "sessionTimeout": 300000,
    "maxLoopIterations": 100
  },
  "api": {
    "provider": "anthropic",
    "apiKey": "${ANTHROPIC_API_KEY}",
    "baseUrl": "https://api.anthropic.com"
  },
  "debug": {
    "enabled": false,
    "traceExecution": false,
    "logLevel": "info"
  }
}
```

---

**文档版本**: 1.0
**最后更新**: 2026-03-06
**作者**: OpenProse Team
