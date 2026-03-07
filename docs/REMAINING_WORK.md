# 剩余 15% 工作清单

## 📊 当前状态: 85% → 100%

### ✅ 已完成 (85%)
1. ✅ 工具框架 (100%)
2. ✅ 内置工具 (100%)
3. ✅ Agent skills 自动启用 (100%)
4. ✅ 多轮工具调用 (100%)
5. ✅ 工具结果展示 (100%)

### 🚧 未完成 (15%)

---

## 中优先级 - 增强功能 (10%)

### 1. 工具权限检查 ❌ (3%)

**功能**: 限制 agent 能使用的工具，提升安全性

**当前问题**:
```prose
agent restricted:
  model: sonnet
  skills: ["calculate", "file_write", "web_search"]
  permissions:
    tools: ["calculate"]  # ← 这个限制不生效
```

**需要实现**:
```typescript
// plugin/src/runtime/interpreter.ts
private async executeSession(spec: SessionSpec): Promise<SessionResult> {
  // 获取 agent 定义的所有 skills
  let allowedTools = spec.agent?.skills || [];

  // 如果定义了 permissions.tools，进行过滤
  if (spec.agent?.permissions?.tools) {
    allowedTools = allowedTools.filter(tool =>
      spec.agent.permissions.tools.includes(tool)
    );
  }

  // 只启用被允许的工具
  const enableTools = allowedTools.length > 0;

  // 将允许的工具列表传递给 OpenRouter
  const result = await this.openRouterClient.executeSession(
    spec,
    this.env.config,
    enableTools,
    allowedTools  // ← 新增参数
  );
}
```

```typescript
// plugin/src/runtime/openrouter.ts
async executeSession(
  spec: SessionSpec,
  config: RuntimeConfig,
  enableTools: boolean = false,
  allowedTools?: string[]  // ← 新增参数
): Promise<SessionResult> {
  if (useTools) {
    // 只获取被允许的工具
    const tools = allowedTools
      ? this.toolRegistry.getTools(allowedTools)
      : this.toolRegistry.getAll();

    requestBody.tools = this.toolRegistry.toOpenRouterFormat(tools);
  }
}
```

**预计时间**: 30 分钟

---

### 2. 工具注册表传递 ❌ (4%)

**功能**: 支持用户注册自定义工具

**当前问题**:
```typescript
// 用户想添加自定义工具，但没有 API
const myCustomTool = {
  name: 'fetch_weather',
  description: 'Get weather info',
  handler: async (args) => { /* ... */ }
};

// 无法注册！
```

**需要实现**:
```typescript
// plugin/src/runtime/index.ts
export async function execute(
  program: ProgramNode,
  config?: Partial<RuntimeConfig>,
  customTools?: ToolDefinition[]  // ← 新增参数
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

  // 传递给 OpenRouter 客户端
  const openRouterClient = createOpenRouterClient(toolRegistry);
  const interpreter = new Interpreter(env, openRouterClient);

  return await interpreter.execute(program);
}
```

**使用方式**:
```typescript
import { execute, ToolDefinition } from './runtime';

const weatherTool: ToolDefinition = {
  name: 'get_weather',
  description: 'Get current weather',
  parameters: {
    type: 'object',
    properties: {
      city: { type: 'string' }
    },
    required: ['city']
  },
  handler: async (args) => {
    const response = await fetch(`https://api.weather.com/${args.city}`);
    return await response.json();
  }
};

const result = await execute(program, {}, [weatherTool]);
```

**预计时间**: 45 分钟

---

### 3. 工具执行追踪 ❌ (3%)

**功能**: 记录和监控工具调用，便于调试

**需要实现**:
```typescript
// plugin/src/runtime/tools.ts
export class ToolRegistry {
  private executionLog: Array<{
    name: string;
    args: any;
    result: any;
    error?: Error;
    timestamp: number;
    duration: number;
  }> = [];

  private listeners: Array<(event) => void> = [];

  onExecute(callback: (event) => void): void {
    this.listeners.push(callback);
  }

  async execute(name: string, args: any): Promise<RuntimeValue> {
    const startTime = Date.now();

    console.log(`[Tool] 🔧 Calling ${name}`, args);

    try {
      const tool = this.tools.get(name);
      if (!tool) {
        throw new Error(`Tool '${name}' not found`);
      }

      const result = await tool.handler(args);
      const duration = Date.now() - startTime;

      // 记录成功执行
      const logEntry = {
        name,
        args,
        result,
        timestamp: Date.now(),
        duration
      };

      this.executionLog.push(logEntry);

      console.log(`[Tool] ✓ ${name} returned in ${duration}ms`, result);

      // 触发监听器
      for (const listener of this.listeners) {
        listener(logEntry);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // 记录失败
      const logEntry = {
        name,
        args,
        result: null,
        error: error as Error,
        timestamp: Date.now(),
        duration
      };

      this.executionLog.push(logEntry);

      console.error(`[Tool] ✗ ${name} failed in ${duration}ms`, error);

      throw error;
    }
  }

  getExecutionLog() {
    return this.executionLog;
  }

  clearLog() {
    this.executionLog = [];
  }
}
```

**使用方式**:
```typescript
// 监听工具调用
toolRegistry.onExecute((event) => {
  console.log(`Tool ${event.name} took ${event.duration}ms`);
  if (event.error) {
    console.error(`Tool ${event.name} failed:`, event.error);
  }
});

// 获取执行历史
const log = toolRegistry.getExecutionLog();
console.log(`Total tool calls: ${log.length}`);
console.log(`Average duration: ${log.reduce((sum, e) => sum + e.duration, 0) / log.length}ms`);
```

**预计时间**: 40 分钟

---

## 低优先级 - 扩展功能 (5%)

### 4. Import Skills 支持 ❌ (3%)

**功能**: 从外部源动态加载工具

**语法**:
```prose
import "web-search" from "github:anthropic/skills"
import "file-ops" from "npm:@openprose/tools-file"
import "custom" from "./my-tools.js"

agent researcher:
  skills: ["web-search", "calculate"]
```

**需要实现**:
```typescript
// plugin/src/runtime/interpreter.ts
private async executeImportStatement(stmt: ImportStatementNode): Promise<void> {
  const skillName = stmt.skillName.value;
  const source = stmt.source.value;

  let tool: ToolDefinition;

  if (source.startsWith('github:')) {
    // 从 GitHub 加载
    tool = await this.loadToolFromGitHub(source, skillName);
  } else if (source.startsWith('npm:')) {
    // 从 NPM 加载
    tool = await this.loadToolFromNPM(source, skillName);
  } else {
    // 从本地文件加载
    tool = await this.loadToolFromFile(source, skillName);
  }

  // 注册工具
  this.toolRegistry.register(tool);
  this.env.log('info', `Imported skill '${skillName}' from ${source}`);
}

private async loadToolFromGitHub(source: string, skillName: string): Promise<ToolDefinition> {
  // github:anthropic/skills -> https://raw.githubusercontent.com/anthropic/skills/main/...
  const [, repo] = source.split(':');
  const url = `https://raw.githubusercontent.com/${repo}/main/${skillName}.json`;

  const response = await fetch(url);
  const definition = await response.json();

  return {
    name: skillName,
    description: definition.description,
    parameters: definition.parameters,
    handler: eval(definition.handler)  // 注意：需要安全评估
  };
}
```

**预计时间**: 2 小时（涉及网络请求和安全考虑）

---

### 5. 更细粒度错误处理 ❌ (2%)

**功能**: 针对不同错误类型的智能处理

**需要实现**:
```typescript
// plugin/src/runtime/openrouter.ts
async executeSession(...) {
  try {
    const result = await this.callAPI(messages, tools);
    return result;
  } catch (error) {
    const errorMessage = error.message || String(error);

    // 1. 工具调用失败 - 重试不使用工具
    if (errorMessage.includes('tool_call_failed')) {
      this.env.log('warn', 'Tool calling failed, retrying without tools');
      return await this.executeSession(spec, config, false);
    }

    // 2. 速率限制 - 等待后重试
    if (errorMessage.includes('rate_limit') || errorMessage.includes('429')) {
      this.env.log('warn', 'Rate limit hit, waiting 5s before retry');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return await this.executeSession(spec, config, enableTools);
    }

    // 3. 超时 - 降级到更短的 max_tokens
    if (errorMessage.includes('timeout')) {
      this.env.log('warn', 'Timeout, reducing max_tokens');
      config.maxTokens = Math.floor((config.maxTokens || 4000) / 2);
      return await this.executeSession(spec, config, enableTools);
    }

    // 4. 模型不可用 - 回退到 mock
    if (errorMessage.includes('model_not_available')) {
      this.env.log('error', 'Model not available, falling back to mock');
      return this.mockSession(spec);
    }

    // 其他错误 - 直接抛出
    throw error;
  }
}
```

**预计时间**: 30 分钟

---

## 📋 实现建议顺序

### 如果想快速达到 90%（关键增强）：
1. **工具权限检查** (30 min) ✨ 安全性提升
2. **工具注册表传递** (45 min) ✨ 可扩展性提升

### 如果想达到 95%（加上调试能力）：
3. **工具执行追踪** (40 min) 🔍 调试和监控

### 如果想达到 100%（完整生态）：
4. **Import Skills 支持** (2 hours) 🌐 生态扩展
5. **更细粒度错误处理** (30 min) 🛡️ 稳定性

---

## 📊 时间预估

| 功能 | 优先级 | 时间 | 完成度提升 |
|------|-------|------|-----------|
| 工具权限检查 | ⭐⭐⭐ 中 | 30min | +3% → 88% |
| 工具注册表传递 | ⭐⭐⭐ 中 | 45min | +4% → 92% |
| 工具执行追踪 | ⭐⭐ 中 | 40min | +3% → 95% |
| Import Skills | ⭐ 低 | 2h | +3% → 98% |
| 错误处理 | ⭐ 低 | 30min | +2% → 100% |
| **总计** | | **4.5h** | **+15%** |

---

## 🎯 推荐方案

### 方案 A: 快速增强 (1小时15分钟)
完成中优先级的前两项：
- ✅ 工具权限检查 (30min)
- ✅ 工具注册表传递 (45min)
- **结果**: 85% → 92%
- **收益**: 安全性 + 可扩展性

### 方案 B: 完整增强 (2小时)
完成所有中优先级：
- ✅ 工具权限检查 (30min)
- ✅ 工具注册表传递 (45min)
- ✅ 工具执行追踪 (40min)
- **结果**: 85% → 95%
- **收益**: 安全 + 扩展 + 调试

### 方案 C: 100% 完成 (4.5小时)
实现所有剩余功能
- **结果**: 85% → 100%
- **收益**: 完整功能生态

---

## 💡 我的建议

**推荐方案 B**（2小时达到 95%）

理由：
1. ✅ **工具权限检查** - 安全性是生产环境必需的
2. ✅ **工具注册表传递** - 让 OpenProse 真正可扩展
3. ✅ **工具执行追踪** - 调试工具调用问题必不可少

低优先级的功能（Import Skills、细粒度错误处理）可以在实际使用中根据需求再添加。

---

**要不要我现在开始实现这些功能？** 🚀

选项：
- A: 实现方案 A (1h15m → 92%)
- B: 实现方案 B (2h → 95%)
- C: 实现方案 C (4.5h → 100%)
- D: 暂时不需要，85% 已经足够
