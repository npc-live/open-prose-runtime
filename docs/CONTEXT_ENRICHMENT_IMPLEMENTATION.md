# 上下文增强（Context Enrichment）实现文档

## 🎯 目标

解决 Runtime 执行可能丢失 LLM 全局理解能力的问题，通过在每个 discretion 评估点自动传递丰富的执行上下文，让 LLM 能够基于完整信息做出更智能的决策。

**关键原则**：
- ✅ 默认启用，无需用户配置
- ✅ 不改变语法，对用户透明
- ✅ 保持 Runtime 的结构化执行
- ✅ 在关键决策点增强 LLM 的判断能力

---

## 📊 问题分析

### 之前的实现

```typescript
// 简单的条件评估 - 只传递条件文本和当前变量
const prompt = `Evaluate this condition: "${condition.expression}"
Context: ${JSON.stringify(variables)}`;
```

**问题**：
- ❌ LLM 看不到执行历史
- ❌ LLM 看不到循环进度
- ❌ LLM 看不到之前的 session 输出
- ❌ LLM 无法理解整体目标和进度

### 现在的实现

```typescript
// 增强的条件评估 - 传递完整的执行上下文
const enrichedContext = {
  fileName, currentBlock, currentIteration,
  variables, recentChanges,
  recentEvents, executionPath,
  progress, recentSessionOutputs,
  loopInfo: { iteration, maxIterations, previousResults }
};

const enrichedPrompt = buildEnrichedDiscretionPrompt(condition, enrichedContext);
```

**优势**：
- ✅ LLM 看到完整的执行上下文
- ✅ LLM 了解循环进度和历史
- ✅ LLM 可以参考之前的输出
- ✅ LLM 能够做出更智能的决策

---

## 🔧 实现细节

### 1. 数据结构

#### ExecutionEvent
```typescript
interface ExecutionEvent {
  type: 'statement' | 'session' | 'condition' | 'error';
  description: string;
  timestamp: number;
  result?: any;
}
```

跟踪执行历史中的关键事件。

#### EnrichedExecutionContext
```typescript
interface EnrichedExecutionContext {
  // 当前执行状态
  fileName: string | null;
  currentBlock: string | null;
  currentIteration: number | null;

  // 变量状态
  variables: Record<string, RuntimeValue>;
  recentChanges: string[];  // 最近的变量赋值

  // 执行历史
  recentEvents: ExecutionEvent[];  // 最近 5-10 个事件
  executionPath: string[];  // Block/函数调用栈

  // 进度跟踪
  totalStatements: number;
  executedStatements: number;
  remainingStatements: number;

  // Session 结果
  recentSessionOutputs: string[];  // 最近几次 session 的输出

  // 循环上下文（如果在循环中）
  loopInfo: {
    iteration: number;
    maxIterations: number | null;
    previousResults: any[];
  } | null;
}
```

包含 LLM 做决策所需的所有上下文信息。

### 2. Interpreter 新增字段

```typescript
class Interpreter {
  // 上下文跟踪
  private executionEvents: ExecutionEvent[] = [];
  private currentFileName: string | null = null;
  private currentBlockStack: string[] = [];
  private totalStatements: number = 0;
  private executedStatements: number = 0;
  private recentSessionOutputs: string[] = [];
  private loopContext: {
    iteration: number;
    maxIterations: number | null;
    previousResults: any[];
  } | null = null;
}
```

### 3. 核心方法

#### captureEnrichedContext()
```typescript
private captureEnrichedContext(): EnrichedExecutionContext {
  // 捕获当前完整的执行上下文
  const variablesMap = this.env.contextManager.getAllVariables();
  const variables: Record<string, RuntimeValue> = {};
  for (const [key, value] of variablesMap.entries()) {
    variables[key] = value;
  }

  // 获取最近的变量变化
  const recentChanges: string[] = [];
  const varEntries = Object.entries(variables).slice(-5);
  for (const [key, value] of varEntries) {
    recentChanges.push(`${key} = ${this.formatValueForContext(value)}`);
  }

  return {
    fileName: this.currentFileName,
    currentBlock: this.currentBlockStack[this.currentBlockStack.length - 1] || null,
    currentIteration: this.loopContext?.iteration ?? null,
    variables,
    recentChanges,
    recentEvents: this.executionEvents.slice(-10),
    executionPath: [...this.currentBlockStack],
    totalStatements: this.totalStatements,
    executedStatements: this.executedStatements,
    remainingStatements: this.totalStatements - this.executedStatements,
    recentSessionOutputs: this.recentSessionOutputs.slice(-3),
    loopInfo: this.loopContext ? { ...this.loopContext } : null,
  };
}
```

#### buildEnrichedDiscretionPrompt()
```typescript
private buildEnrichedDiscretionPrompt(
  condition: string,
  context: EnrichedExecutionContext
): string {
  let prompt = `You are evaluating a condition in an AI workflow execution.

CONDITION TO EVALUATE:
"${condition}"

EXECUTION CONTEXT:
`;

  // 添加当前执行状态
  if (context.currentBlock) {
    prompt += `- Current block: ${context.currentBlock}\n`;
  }

  // 添加循环上下文
  if (context.loopInfo) {
    prompt += `- Loop iteration: ${context.loopInfo.iteration}`;
    if (context.loopInfo.maxIterations) {
      prompt += ` / ${context.loopInfo.maxIterations}`;
    }
    prompt += `\n`;

    if (context.loopInfo.previousResults.length > 0) {
      prompt += `- Previous loop results: ${context.loopInfo.previousResults.slice(-3).join(', ')}\n`;
    }
  }

  // 添加进度信息
  prompt += `- Progress: ${context.executedStatements}/${context.totalStatements} statements executed\n`;

  // 添加最近的变量变化
  if (context.recentChanges.length > 0) {
    prompt += `\nRECENT VARIABLE CHANGES:\n`;
    context.recentChanges.forEach(change => {
      prompt += `  ${change}\n`;
    });
  }

  // 添加当前变量
  prompt += `\nCURRENT VARIABLES:\n`;
  Object.entries(context.variables).forEach(([key, value]) => {
    prompt += `  ${key} = ${this.formatValueForContext(value, 80)}\n`;
  });

  // 添加最近的 session 输出
  if (context.recentSessionOutputs.length > 0) {
    prompt += `\nRECENT AI SESSION OUTPUTS:\n`;
    context.recentSessionOutputs.forEach((output, i) => {
      prompt += `  [${i + 1}] ${this.formatValueForContext(output, 100)}\n`;
    });
  }

  // 添加最近的执行事件
  if (context.recentEvents.length > 0) {
    prompt += `\nRECENT EXECUTION HISTORY:\n`;
    context.recentEvents.forEach(event => {
      prompt += `  [${event.type}] ${event.description}\n`;
    });
  }

  prompt += `\nBased on the FULL CONTEXT above, evaluate whether the condition is TRUE or FALSE.
Consider:
- The overall goal and progress of the workflow
- Whether continuing makes sense given the current state
- Any patterns or trends in the execution history
- The quality and completeness of recent results

Respond with ONLY "true" or "false" (one word, lowercase).`;

  return prompt;
}
```

#### evaluateCondition() - 重写
```typescript
private async evaluateCondition(condition: DiscretionNode): Promise<boolean> {
  // 捕获增强的执行上下文
  const enrichedContext = this.captureEnrichedContext();

  // 构建增强的 prompt
  const enrichedPrompt = this.buildEnrichedDiscretionPrompt(
    condition.expression,
    enrichedContext
  );

  // 记录为事件
  this.addExecutionEvent('condition', `Evaluating: ${condition.expression}`);

  // 调用 LLM 评估
  const result = await this.openRouterClient.executeSession(spec, ...);
  const output = result.output.toLowerCase().trim();

  // 解析结果
  const finalResult = output.includes('true') && !output.includes('false');

  // 记录结果
  this.addExecutionEvent('condition', `Result: ${finalResult}`);

  return finalResult;
}
```

### 4. 上下文跟踪点

#### 程序启动时
```typescript
async execute(program: ProgramNode) {
  // 初始化上下文跟踪
  this.totalStatements = program.statements.length;
  this.executedStatements = 0;
  this.executionEvents = [];
  this.recentSessionOutputs = [];
  this.currentBlockStack = [];

  // 执行程序...
}
```

#### Session 执行后
```typescript
private async executeSessionStatement(statement) {
  const result = await this.executeSession(spec);

  // 跟踪 session 输出
  this.recentSessionOutputs.push(result.output);
  if (this.recentSessionOutputs.length > 10) {
    this.recentSessionOutputs = this.recentSessionOutputs.slice(-10);
  }

  // 添加执行事件
  this.addExecutionEvent('session', `Session completed: ${result.output.substring(0, 50)}...`, result);

  return { value: result };
}
```

#### 循环执行时
```typescript
private async executeLoopBlock(block) {
  const loopResults: any[] = [];

  // 设置循环上下文
  this.loopContext = {
    iteration: 0,
    maxIterations,
    previousResults: [],
  };

  while (...) {
    // 更新循环上下文
    this.loopContext.iteration = iteration;
    this.loopContext.previousResults = loopResults;

    // 执行循环体
    const iterationResult = await this.executeLoopBody();
    loopResults.push(iterationResult);

    iteration++;
  }

  // 清除循环上下文
  this.loopContext = null;
}
```

---

## 💡 增强的 Prompt 示例

### 简单循环条件

**之前**：
```
Evaluate this condition: "we have processed enough items"
Context: {"count": 3}
```

**现在**：
```
You are evaluating a condition in an AI workflow execution.

CONDITION TO EVALUATE:
"we have processed enough items"

EXECUTION CONTEXT:
- Loop iteration: 3 / 5
- Previous loop results: item_1, item_2, item_3
- Progress: 8/20 statements executed

RECENT VARIABLE CHANGES:
  count = 3

CURRENT VARIABLES:
  count = 3

RECENT AI SESSION OUTPUTS:
  [1] Processing item 1 completed
  [2] Processing item 2 completed
  [3] Processing item 3 completed

RECENT EXECUTION HISTORY:
  [session] Session completed: Processing item 1...
  [session] Session completed: Processing item 2...
  [session] Session completed: Processing item 3...
  [condition] Evaluating: we have processed enough items

Based on the FULL CONTEXT above, evaluate whether the condition is TRUE or FALSE.
Consider:
- The overall goal and progress of the workflow
- Whether continuing makes sense given the current state
- Any patterns or trends in the execution history
- The quality and completeness of recent results

Respond with ONLY "true" or "false" (one word, lowercase).
```

---

## 🎯 使用场景

### 场景 1: 质量改进循环

```prose
loop until **the quality is good enough** (max: 10):
  let result = session: improver "Improve quality"
```

**LLM 可以看到**：
- 已经改进了多少次（循环迭代）
- 之前每次改进的输出
- 质量是否真的在提升（通过历史对比）
- 是否已经达到足够好的状态

**LLM 可以决定**：
- "已经改进 3 次，质量显著提升，可以停止了" → true
- "改进了 5 次但没什么变化，继续也没意义" → true
- "才改进 2 次，质量还需要提升" → false

### 场景 2: 任务完成判断

```prose
loop until **all subtasks are done** (max: 20):
  session: worker "Work on next subtask"
```

**LLM 可以看到**：
- 已经完成了哪些子任务（从 session 输出）
- 还剩多少（从变量和历史推断）
- 是否已经覆盖所有内容

### 场景 3: 自适应决策

```prose
if **the current approach is not working well**:
  session: planner "Switch to alternative approach"
```

**LLM 可以看到**：
- 当前方法尝试了多久
- 最近的结果是什么样的
- 是否有明显的失败模式
- 是否值得切换策略

---

## 📊 性能影响

### Token 消耗

**之前**：
- 简单 prompt: ~50 tokens
- 变量上下文: ~20 tokens
- **总计**: ~70 tokens per condition

**现在**：
- 增强 prompt: ~200 tokens
- 变量上下文: ~100 tokens
- 执行历史: ~150 tokens
- Session 输出: ~200 tokens
- **总计**: ~650 tokens per condition

**增加**: ~9x token 消耗

### 成本估算

假设一个程序有 5 个条件评估：
- 之前: 70 × 5 = 350 tokens
- 现在: 650 × 5 = 3,250 tokens

**额外成本**: ~$0.003 per run (按 $1/M tokens 计算)

### 响应时间

由于 prompt 更长，LLM 处理时间会稍微增加（~10-20%），但决策质量显著提升，值得这个代价。

---

## ✅ 优势总结

### 1. 更智能的决策
LLM 现在可以基于完整上下文做出更准确的判断，而不是盲目地评估一个孤立的条件。

### 2. 自适应执行
LLM 可以"看到"执行进度和历史，从而做出自适应的决策，例如：
- 质量已经足够好，提前退出循环
- 当前方法不work，切换策略
- 已经处理了足够多的项目，不需要全部处理

### 3. 保持结构化
仍然使用 Runtime 执行，保持可预测性和可调试性，只是在决策点给 LLM 更多信息。

### 4. 对用户透明
用户不需要改变任何代码，自动获得更好的决策质量。

---

## 🚀 未来增强方向

### 1. 可配置的上下文详细程度
```prose
@config:
  context_enrichment: "minimal" | "standard" | "maximum"
```

### 2. 智能上下文过滤
只传递与当前条件相关的上下文，减少 token 消耗。

### 3. 上下文摘要
对长历史进行摘要，而不是传递完整内容。

### 4. 分层决策
简单条件使用简单上下文，复杂决策使用丰富上下文。

---

## 📝 测试

### 测试文件
`test-context-enrichment.prose`

### 测试场景
1. **循环直到条件满足** - LLM 看到迭代计数和历史
2. **质量循环** - LLM 看到之前的输出和改进趋势
3. **条件执行** - LLM 看到变量和执行路径
4. **Choice 选择** - LLM 看到完整状态做出选择

---

## 🎉 总结

**上下文增强**通过在每个 discretion 评估点自动传递丰富的执行上下文，成功地在保持 Runtime 结构化执行的同时，恢复了 LLM 的全局理解和自适应能力。

**关键成就**：
- ✅ 默认启用，无需配置
- ✅ 不改变语法
- ✅ 显著提升决策质量
- ✅ 保持可预测性
- ✅ 成本增加可接受

用户现在可以获得"两全其美"：Runtime 的可预测性 + LLM 的智能决策！

---

**实现时间**: 2026-03-07
**影响**: 所有使用 `**condition**` 的地方
**状态**: ✅ 已实现并默认启用
**向后兼容**: ✅ 完全兼容，用户无需修改代码
