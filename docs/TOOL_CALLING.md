# OpenProse Tool Calling 指南

## 🛠️ 功能概述

OpenProse 现在支持 **Tool Calling (函数调用)**，允许 AI 模型在执行过程中调用预定义的工具/函数来完成特定任务。

## 📋 内置工具

### 1. `calculate` - 数学计算
执行数学表达式计算。

**参数**:
- `expression` (string): 数学表达式，支持 +, -, *, /, **, sqrt, abs 等

**示例**:
```json
{
  "name": "calculate",
  "arguments": {
    "expression": "15 * 8 + 42"
  }
}
```

**结果**: `162`

### 2. `get_current_time` - 获取当前时间
获取当前日期和时间。

**参数**:
- `format` (string, 可选): 格式类型
  - `"iso"`: ISO 8601 格式 (默认)
  - `"unix"`: Unix 时间戳
  - `"readable"`: 人类可读格式

**示例**:
```json
{
  "name": "get_current_time",
  "arguments": {
    "format": "readable"
  }
}
```

**结果**: `"March 6, 2026, 08:45:30 AM"`

### 3. `random_number` - 生成随机数
生成指定范围内的随机数。

**参数**:
- `min` (number): 最小值（包含）
- `max` (number): 最大值（包含）
- `integer` (boolean, 可选): 是否返回整数，默认 true

**示例**:
```json
{
  "name": "random_number",
  "arguments": {
    "min": 1,
    "max": 100,
    "integer": true
  }
}
```

**结果**: `42` (随机整数)

### 4. `string_operations` - 字符串操作
对文本执行各种操作。

**参数**:
- `text` (string): 要处理的文本
- `operation` (string): 操作类型
  - `"uppercase"`: 转大写
  - `"lowercase"`: 转小写
  - `"reverse"`: 反转
  - `"length"`: 获取长度
  - `"trim"`: 去除首尾空格
  - `"capitalize"`: 首字母大写

**示例**:
```json
{
  "name": "string_operations",
  "arguments": {
    "text": "hello world",
    "operation": "uppercase"
  }
}
```

**结果**: `"HELLO WORLD"`

## 📝 使用方法

### 方式 1: 通过 Agent Skills（推荐）

在 `.prose` 文件中定义带有 skills 的 agent：

```prose
# 定义一个具有工具能力的 agent
agent calculator:
  model: sonnet
  skills: ["calculate", "random_number"]
  prompt: "You are a helpful calculator assistant"

# 使用该 agent 执行任务
let result = session: calculator
  prompt: "Calculate 15 * 8 + 42, then generate a random number between 1 and 100"
```

### 方式 2: 直接提示（当前实现）

由于运行时还在开发中，目前可以通过提示让 AI 使用工具：

```prose
# AI 会在提示中说明如何使用工具
session "Calculate 15 * 8 + 42. Use the calculate tool if available"

session "What's the current time? Use the get_current_time tool if available"

session "Convert 'hello world' to uppercase. Use the string_operations tool if available"
```

## 🎯 实际示例

### 示例 1: 数学助手
```prose
agent math_helper:
  model: sonnet
  skills: ["calculate"]

let problem = "What is (15 + 27) * 3 - 10?"
let answer = session: math_helper
  prompt: "Solve this math problem: {problem}"
```

**AI 会调用**: `calculate((15 + 27) * 3 - 10)` → 结果: `116`

### 示例 2: 数据处理流水线
```prose
agent data_processor:
  model: sonnet
  skills: ["string_operations", "calculate"]

let text = "  Hello World  "
let cleaned = session: data_processor
  prompt: "Clean this text and count its length after cleaning"
  context: text
```

**AI 可能调用**:
1. `string_operations(text: "  Hello World  ", operation: "trim")` → `"Hello World"`
2. `string_operations(text: "Hello World", operation: "length")` → `11`

### 示例 3: 游戏逻辑
```prose
agent game_master:
  model: sonnet
  skills: ["random_number", "calculate"]

session: game_master
  prompt: "Roll 2 dice (1-6) and calculate the sum"
```

**AI 会调用**:
1. `random_number(min: 1, max: 6)` → `4`
2. `random_number(min: 1, max: 6)` → `3`
3. `calculate(4 + 3)` → `7`

## 🔧 自定义工具

你可以添加自己的工具到 `ToolRegistry`：

```typescript
import { ToolRegistry, ToolDefinition } from './src/runtime/tools';

// 创建自定义工具
const weatherTool: ToolDefinition = {
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City name or coordinates',
      },
      units: {
        type: 'string',
        description: 'Temperature units',
        enum: ['celsius', 'fahrenheit'],
      },
    },
    required: ['location'],
  },
  handler: async (args) => {
    const { location, units = 'celsius' } = args;
    // 调用天气 API...
    return {
      temperature: 22,
      condition: 'sunny',
      location,
      units,
    };
  },
};

// 注册工具
const toolRegistry = new ToolRegistry();
toolRegistry.register(weatherTool);
```

## 📊 工具调用结果

当 AI 调用工具时，结果会包含在 `metadata.toolCalls` 中：

```javascript
{
  output: "The calculation result is 162",
  metadata: {
    model: "qwen/qwen3.5-27b",
    duration: 3200,
    tokensUsed: 450,
    toolCalls: [
      {
        name: "calculate",
        arguments: { expression: "15 * 8 + 42" },
        result: 162
      }
    ]
  }
}
```

## 🎨 设计模式

### 模式 1: 工具链
让 AI 依次调用多个工具：

```prose
agent analyst:
  model: sonnet
  skills: ["calculate", "string_operations"]

session: analyst
  prompt: "First, calculate 100 / 5. Then, convert the result to a string and tell me its length"
```

### 模式 2: 条件工具使用
AI 根据情况决定是否使用工具：

```prose
agent smart_agent:
  model: sonnet
  skills: ["calculate", "get_current_time"]

session: smart_agent
  prompt: "What is 2+2? If it's a simple calculation, just tell me. If complex, use the calculate tool"
```

### 模式 3: 批量处理
使用工具处理多个项目：

```prose
let numbers = [10, 20, 30, 40]

agent processor:
  model: sonnet
  skills: ["calculate"]

session: processor
  prompt: "Calculate the sum and average of these numbers"
  context: numbers
```

## ⚠️ 注意事项

### 1. 模型支持
不是所有模型都支持 function calling。当前配置：
- ✅ Qwen 3.5 27B - 支持
- ✅ GPT-4/GPT-4o - 支持
- ⚠️ 某些小模型 - 可能不支持

### 2. 工具权限
通过 `permissions` 控制 agent 能访问的工具：

```prose
agent restricted:
  model: sonnet
  skills: ["calculate"]  # 只能使用计算工具
  permissions:
    tools: ["calculate"]  # 明确限制
```

### 3. 错误处理
如果工具调用失败，AI 会收到错误信息并尝试其他方法。

### 4. Token 消耗
使用工具会增加 token 消耗：
- 工具定义: ~100-200 tokens
- 每次调用: ~50-100 tokens
- 结果传递: ~50-200 tokens

## 🚀 高级用法

### 动态工具注册
```typescript
// 在运行时注册工具
const customTools = [tool1, tool2, tool3];
for (const tool of customTools) {
  toolRegistry.register(tool);
}
```

### 工具执行追踪
```typescript
// 监听工具调用
toolRegistry.onExecute((toolName, args, result) => {
  console.log(`Tool ${toolName} called with`, args);
  console.log(`Result:`, result);
});
```

### 安全沙箱
```typescript
// 限制工具执行环境
const safeTool: ToolDefinition = {
  name: 'safe_eval',
  handler: async (args) => {
    // 在隔离环境中执行
    return vm.runInNewContext(args.code, {
      Math, String, Array  // 只提供安全的 API
    });
  },
};
```

## 📚 相关文档

- [OpenRouter Function Calling](https://openrouter.ai/docs#function-calling)
- [Tool Use Best Practices](https://www.anthropic.com/index/tool-use)
- [OpenProse Runtime](./RUNTIME_README.md)

## 🎯 路线图

- [x] 基础工具定义和注册
- [x] 内置工具（calculate, time, random, string）
- [ ] 工具调用完整集成到运行时
- [ ] Agent skills 属性支持
- [ ] 工具权限系统
- [ ] 自定义工具 API
- [ ] 工具调用追踪和调试
- [ ] 工具执行沙箱

---

**版本**: 1.2.0 (Tool Calling 支持)
**状态**: 🚧 开发中
**最后更新**: 2026-03-06
