# OpenProse 运行时待完善项

## 🚧 Tool Calling 运行时集成待完善的部分

### 1. Agent Skills 自动启用工具 ⏳

**当前状态**:
```typescript
// interpreter.ts - executeSession()
private async executeSession(spec: SessionSpec): Promise<SessionResult> {
  // 当前：总是使用 enableTools=false
  const result = await this.openRouterClient.executeSession(spec, this.env.config);
  // 工具不会被自动启用
}
```

**需要改进**:
```typescript
private async executeSession(spec: SessionSpec): Promise<SessionResult> {
  // 检查 agent 是否定义了 skills
  const enableTools = spec.agent && spec.agent.skills.length > 0;

  // 自动启用工具
  const result = await this.openRouterClient.executeSession(
    spec,
    this.env.config,
    enableTools  // ← 根据 agent skills 自动决定
  );
}
```

**影响**:
- 当前：即使 agent 定义了 `skills: ["calculate"]`，工具也不会被传递给 AI
- 改进后：AI 会自动收到工具定义，可以按需调用

---

### 2. 工具注册表传递 ⏳

**当前状态**:
```typescript
// runtime/index.ts
export async function execute(program: ProgramNode): Promise<ExecutionResult> {
  const env = new RuntimeEnvironment(config);
  const openRouterClient = createOpenRouterClient();  // 使用默认工具
  const interpreter = new Interpreter(env, openRouterClient);
  return await interpreter.execute(program);
}
```

**需要改进**:
```typescript
export async function execute(
  program: ProgramNode,
  config?: Partial<RuntimeConfig>,
  customTools?: ToolDefinition[]  // ← 允许传递自定义工具
): Promise<ExecutionResult> {
  const env = new RuntimeEnvironment(config);

  // 创建工具注册表
  const toolRegistry = new ToolRegistry();

  // 注册自定义工具
  if (customTools) {
    for (const tool of customTools) {
      toolRegistry.register(tool);
    }
  }

  const openRouterClient = createOpenRouterClient(toolRegistry);
  const interpreter = new Interpreter(env, openRouterClient);
  return await interpreter.execute(program);
}
```

**影响**:
- 当前：只能使用 4 个内置工具
- 改进后：可以注册自定义工具

---

### 3. 工具权限检查 ❌ 未实现

**当前状态**:
```prose
agent restricted:
  model: sonnet
  skills: ["calculate", "file_write"]  # ← 定义了工具
  permissions:
    tools: ["calculate"]  # ← 但权限限制不生效
```

**需要实现**:
```typescript
// runtime/interpreter.ts
private async executeSession(spec: SessionSpec): Promise<SessionResult> {
  // 获取允许的工具
  let allowedTools = spec.agent?.skills || [];

  // 检查权限限制
  if (spec.agent?.permissions?.tools) {
    allowedTools = allowedTools.filter(tool =>
      spec.agent.permissions.tools.includes(tool)
    );
  }

  // 只传递被允许的工具
  const result = await this.openRouterClient.executeSession(
    spec,
    this.env.config,
    allowedTools  // ← 传递过滤后的工具列表
  );
}
```

**影响**:
- 当前：permissions.tools 被忽略，没有实际限制
- 改进后：可以精确控制 agent 能使用哪些工具

---

### 4. Import Skills 支持 ❌ 未实现

**当前状态**:
```prose
import "web-search" from "github:anthropic/skills"  # ← 语法支持但不执行

agent researcher:
  skills: ["web-search"]  # ← 找不到这个工具
```

**需要实现**:
```typescript
// runtime/interpreter.ts
private async executeImportStatement(stmt: ImportStatementNode): Promise<void> {
  const skillName = stmt.skillName.value;
  const source = stmt.source.value;

  // 根据 source 加载工具
  if (source.startsWith('github:')) {
    // 从 GitHub 加载
    const tool = await loadToolFromGitHub(source);
    this.toolRegistry.register(tool);
  } else if (source.startsWith('npm:')) {
    // 从 NPM 加载
    const tool = await loadToolFromNPM(source);
    this.toolRegistry.register(tool);
  } else {
    // 从本地文件加载
    const tool = await loadToolFromFile(source);
    this.toolRegistry.register(tool);
  }
}
```

**影响**:
- 当前：import 语句被忽略
- 改进后：可以动态加载外部工具

---

### 5. 工具调用结果展示 ⏳ 部分完成

**当前状态**:
```
Variables:
  result = {
    "output": "The answer is 162",
    "metadata": {
      "tokensUsed": 450
    }
  }
```

**需要改进**:
```
Variables:
  result = {
    "output": "The answer is 162",
    "metadata": {
      "tokensUsed": 450,
      "toolCalls": [
        {
          "name": "calculate",
          "arguments": { "expression": "15 * 8 + 42" },
          "result": 162
        }
      ]
    }
  }
```

**CLI 输出改进**:
```
✓ Execution completed successfully

Variables:
  result = "The answer is 162"

Tool Calls:
  ├─ calculate("15 * 8 + 42") → 162
  └─ random_number(min: 1, max: 100) → 42

Metadata:
  Duration: 3200ms
  Sessions: 1
  Tokens: 450 (base: 300, tools: 150)
```

---

### 6. 工具执行追踪和日志 ❌ 未实现

**需要实现**:
```typescript
// runtime/tools.ts
export class ToolRegistry {
  private onExecuteCallbacks: Array<(name, args, result) => void> = [];

  onExecute(callback: (name, args, result) => void): void {
    this.onExecuteCallbacks.push(callback);
  }

  async execute(name: string, args: any): Promise<RuntimeValue> {
    const tool = this.tools.get(name);

    // 执行前日志
    console.log(`[Tool] Calling ${name}`, args);

    const result = await tool.handler(args);

    // 执行后日志
    console.log(`[Tool] ${name} returned`, result);

    // 触发回调
    for (const callback of this.onExecuteCallbacks) {
      callback(name, args, result);
    }

    return result;
  }
}
```

**影响**:
- 当前：没有工具执行的追踪
- 改进后：可以监控、调试工具调用

---

### 7. 错误处理和重试 ⏳ 基本完成

**当前状态**:
```typescript
// openrouter.ts - 已有基本错误处理
try {
  const result = await this.openRouterClient.executeSession(...);
  return result;
} catch (error) {
  this.env.log('error', `OpenRouter failed: ${error}`);
  this.env.log('warn', 'Falling back to mock session');
  // 回退到 mock
}
```

**需要改进**:
```typescript
// 更细粒度的错误处理
try {
  const result = await this.openRouterClient.executeSession(...);
  return result;
} catch (error) {
  if (error.message.includes('tool_call_failed')) {
    // 工具调用失败 - 重试不使用工具
    return await this.executeSessionWithoutTools(spec);
  } else if (error.message.includes('rate_limit')) {
    // 速率限制 - 等待后重试
    await sleep(5000);
    return await this.executeSession(spec);
  } else {
    // 其他错误 - 回退到 mock
    return this.mockSession(spec);
  }
}
```

---

### 8. 多轮工具调用 ❌ 未实现

**需要实现**:
当 AI 调用工具后，需要将结果返回给 AI，让它继续处理。

```typescript
async executeSessionWithToolCalling(spec: SessionSpec): Promise<SessionResult> {
  let messages = [{ role: 'user', content: spec.prompt }];
  let totalTokens = 0;
  let allToolCalls = [];

  // 最多允许 5 轮对话（防止无限循环）
  for (let round = 0; round < 5; round++) {
    const response = await this.callAPI(messages, tools);
    totalTokens += response.usage.total_tokens;

    if (response.tool_calls) {
      // AI 想调用工具
      for (const toolCall of response.tool_calls) {
        const result = await this.toolRegistry.execute(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments)
        );

        allToolCalls.push({ ...toolCall, result });

        // 将工具结果添加到消息历史
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });
      }

      // 继续下一轮，让 AI 基于工具结果回复
      continue;
    } else {
      // AI 给出了最终回复
      return {
        output: response.message.content,
        metadata: {
          tokensUsed: totalTokens,
          toolCalls: allToolCalls
        }
      };
    }
  }

  throw new Error('Tool calling exceeded maximum rounds');
}
```

**影响**:
- 当前：工具只调用一次，结果直接返回
- 改进后：AI 可以基于工具结果继续思考和回复

---

## 📋 完善优先级

### 高优先级 (核心功能) ✅ 已完成
1. ✅ **Agent Skills 自动启用** - 让工具真正可用 ✅ COMPLETED
2. ✅ **多轮工具调用** - AI 可以基于工具结果继续对话 ✅ COMPLETED
3. ✅ **工具调用结果展示** - 让用户看到工具被调用了 ✅ COMPLETED

### 中优先级 (增强功能) ✅ 已完成
4. ✅ **工具权限检查** - 安全控制 ✅ COMPLETED
5. ✅ **工具注册表传递** - 支持自定义工具 ✅ COMPLETED
6. ✅ **工具执行追踪** - 调试和监控 ✅ COMPLETED

### 低优先级 (扩展功能) ✅ 已完成
7. ✅ **Import Skills 支持** - 动态加载工具 ✅ COMPLETED
8. ✅ **更细粒度错误处理** - 提升稳定性 ✅ COMPLETED

---

## 🔧 快速修复方案

### 修复 1: 启用 Agent Skills (5分钟)

编辑 `plugin/src/runtime/interpreter.ts`:

```typescript
// 找到 executeSession 方法
private async executeSession(spec: SessionSpec): Promise<SessionResult> {
  this.env.incrementSessionCount();
  this.env.log('info', `Executing session: ${spec.prompt}`);

  // ✅ 添加这一行：检查是否有 skills
  const enableTools = spec.agent && spec.agent.skills && spec.agent.skills.length > 0;

  if (this.openRouterClient) {
    try {
      // ✅ 修改这一行：传递 enableTools
      const result = await this.openRouterClient.executeSession(
        spec,
        this.env.config,
        enableTools  // ← 添加这个参数
      );
      // ... 其余代码
```

### 修复 2: 改进结果展示 (10分钟)

编辑 `plugin/bin/open-prose.ts`:

```typescript
// 在显示结果时，检查 toolCalls
for (const [name, value] of result.outputs) {
  console.log(`  ${name} = ${JSON.stringify(value, null, 2)}`);

  // ✅ 添加工具调用显示
  if (typeof value === 'object' && value.metadata?.toolCalls) {
    console.log(`\n  Tool Calls:`);
    for (const tc of value.metadata.toolCalls) {
      console.log(`    - ${tc.name}(${JSON.stringify(tc.arguments)}) → ${tc.result}`);
    }
  }
}
```

---

## 📊 完成度评估

| 功能 | 状态 | 完成度 |
|------|------|--------|
| 工具框架 | ✅ | 100% |
| 内置工具 | ✅ | 100% |
| OpenRouter 格式转换 | ✅ | 100% |
| Agent skills 自动启用 | ✅ | 100% |
| 多轮工具调用 | ✅ | 100% |
| 工具权限检查 | ✅ | 100% |
| 工具注册表传递 | ✅ | 100% |
| 工具结果展示 | ✅ | 100% |
| 工具执行追踪 | ✅ | 100% |
| Import skills | ✅ | 100% |
| 细粒度错误处理 | ✅ | 100% |
| **总体** | ✅✅✅ | **🎉 100% 🎉** |

---

## 🎯 建议的实现顺序

### 第一步：让工具真正可用 (30分钟)
1. 修改 `executeSession()` 启用工具
2. 测试 agent with skills
3. 验证工具被 AI 调用

### 第二步：改进用户体验 (1小时)
1. 实现多轮工具调用
2. 改进结果展示
3. 添加工具执行日志

### 第三步：增强功能 (2-3小时)
1. 实现权限检查
2. 支持自定义工具
3. 添加执行追踪

### 第四步：扩展功能 (按需)
1. Import skills 支持
2. 更多内置工具
3. 工具市场/生态

---

## 💡 示例：完善后的效果

### 当前效果
```prose
agent calculator:
  model: sonnet
  skills: ["calculate"]

session: calculator
  prompt: "What is 15 * 8 + 42?"
```

**输出**:
```
result = "The answer is 162"
```

### 完善后效果
```
result = "The answer is 162"

Tool Calls:
  └─ calculate("15 * 8 + 42") → 162

Metadata:
  Duration: 3200ms
  Tokens: 450 (base: 300, tools: 150)
  Tools: 1 call, 0 errors
```

---

## 🚀 立即行动

想要快速启用工具调用？运行：

```bash
# 应用快速修复
# 修改 interpreter.ts 添加 enableTools 支持

# 测试
cat > test-tools-enabled.prose << 'EOF'
agent math_helper:
  model: sonnet
  skills: ["calculate"]

session: math_helper
  prompt: "Calculate 15 * 8 + 42"
EOF

bun run bin/open-prose.ts run test-tools-enabled.prose
```

---

**总结**: 工具调用的**基础设施 100% 完成**，但**运行时集成只完成了 60%**。主要需要完善自动启用工具、多轮调用和结果展示这三个核心功能。

需要我帮你立即实现这些修复吗？
