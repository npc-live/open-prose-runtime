# OpenRouter 集成文档

## ✅ 集成完成

OpenProse 现在已经成功集成了 OpenRouter API，可以调用真实的 AI 模型！

## 🎯 功能演示

### 实际运行结果

```prose
let research = session "Explain OpenProse, a DSL for orchestrating AI agent sessions, in 2-3 sentences"
```

**AI 输出**:
> OpenProse is a domain-specific language designed to declaratively define and manage the workflows of AI agent sessions through a structured syntax. It simplifies the orchestration of complex multi-agent interactions by abstracting communication patterns and state management, thereby streamlining the deployment of collaborative AI systems.

### 上下文传递示例

```prose
let research = session "Research AI agents"

let summary = session "Give me 3 key points"
  context: research
```

AI 会收到 `research` 的完整输出作为上下文。

### 数学计算示例

```prose
let x = 5
let y = 10
let calculation = session "What is the sum?"
  context: { x, y }
```

**AI 输出**: `15` ✓

## 📋 配置说明

### 1. 环境变量设置

在项目根目录的 `.env` 文件中：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

### 2. 当前使用的模型

```typescript
// plugin/src/runtime/openrouter.ts
const MODEL_MAP = {
  opus: 'qwen/qwen3.5-27b',   // Qwen 3.5 27B
  sonnet: 'qwen/qwen3.5-27b',  // Qwen 3.5 27B
  haiku: 'qwen/qwen3.5-27b',   // Qwen 3.5 27B
};
```

**Qwen 3.5 27B** - 快速、强大、成本效益高的开源模型。

### 3. 切换其他模型

编辑 `plugin/src/runtime/openrouter.ts` 中的 `MODEL_MAP`：

```typescript
const MODEL_MAP = {
  opus: 'anthropic/claude-opus-4.6',  // Claude Opus 4.6
  sonnet: 'anthropic/claude-sonnet-4.6', // Claude Sonnet 4.6
  haiku: 'qwen/qwen3.5-27b',  // Qwen 3.5 27B
};
```

可用模型列表：https://openrouter.ai/docs#models

## 🚀 使用方法

### CLI 执行

```bash
cd plugin

# 设置环境变量（如果没有 .env 文件）
export OPENROUTER_API_KEY=your-key-here

# 运行程序
bun run bin/open-prose.ts run your-program.prose
```

### 编程接口

```typescript
import { parse, execute } from './src';
import { createOpenRouterClient } from './src/runtime';

// 设置环境变量
process.env.OPENROUTER_API_KEY = 'your-key-here';

// 执行程序
const source = `
  let result = session "Explain quantum computing in simple terms"
`;

const parseResult = parse(source);
const executionResult = await execute(parseResult.program);

console.log(executionResult.outputs.get('result'));
```

## 📊 执行统计

每个 Session 执行后会返回详细的元数据：

```javascript
{
  output: "AI 的回复内容",
  metadata: {
    model: "qwen/qwen3.5-27b",  // 使用的模型
    duration: 16141,             // 执行时间(ms)
    tokensUsed: 1588             // 消耗的 Token 数
  }
}
```

## 🔄 自动回退机制

如果 OpenRouter API 调用失败，系统会自动回退到 Mock 模式：

```
[ERROR] OpenRouter failed: Error: API error
[WARN] Falling back to mock session
```

原因可能是：
- API Key 无效
- 网络问题
- 模型不可用
- 配额用完

在这种情况下，程序会继续执行但使用 Mock 数据。

## 💰 成本控制

### Token 使用统计

每次执行后可以看到总 Token 消耗：

```
Metadata:
  Duration: 76500ms
  Sessions created: 5
  Statements executed: 14
  Total tokens used: 7,914
```

### 估算成本

不同模型的定价不同，查看：https://openrouter.ai/docs#models

Qwen 3.5 27B 是免费/低成本模型。

## 🎨 示例程序

### 1. 简单研究

```prose
let topic = "machine learning"
let research = session "Explain {topic} in simple terms"
```

### 2. 多步骤工作流

```prose
# Step 1: Research
let research = session "Research the latest AI trends"

# Step 2: Analyze
let analysis = session "Analyze the key trends"
  context: research

# Step 3: Summarize
let summary = session "Create a 3-point summary"
  context: analysis
```

### 3. 数据处理

```prose
let data = ["apple", "banana", "orange"]
let count = 3

let result = session "Create a shopping list"
  context: { data, count }
```

## 🔧 高级配置

### 自定义 HTTP Headers

编辑 `plugin/src/runtime/openrouter.ts`：

```typescript
const response = await fetch(`${this.baseUrl}/chat/completions`, {
  headers: {
    'Authorization': `Bearer ${this.apiKey}`,
    'HTTP-Referer': 'https://your-app.com',
    'X-Title': 'Your App Name',
  },
  // ...
});
```

### 调整温度和 Token 限制

```typescript
body: JSON.stringify({
  model: modelId,
  messages: [...],
  temperature: 0.7,    // 创造性 (0-2)
  max_tokens: 4000,    // 最大输出 Token
  top_p: 0.9,          // 采样参数
}),
```

## 🐛 故障排查

### 问题 1: "OPENROUTER_API_KEY not found"

**解决**:
```bash
# 检查 .env 文件是否存在
ls -la .env

# 检查内容
cat .env

# 确保格式正确
export OPENROUTER_API_KEY=sk-or-v1-...
```

### 问题 2: "403 Forbidden"

**原因**: 模型在你的地区不可用

**解决**: 切换到其他模型，如 `qwen/qwen3.5-27b`

### 问题 3: "404 Not Found"

**原因**: 模型 ID 不存在

**解决**: 查看可用模型列表
```bash
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

### 问题 4: 响应很慢

**原因**:
- 模型负载高
- 网络延迟
- Token 数量大

**解决**:
- 使用更快的模型（如 haiku 配置）
- 减少 max_tokens
- 简化 prompt

## 📝 开发建议

### 1. 提示词优化

```prose
# ❌ 不好的提示词
session "Do something"

# ✅ 好的提示词
session "Analyze the code for security vulnerabilities and list the top 3 issues"
```

### 2. 合理使用上下文

```prose
# ✅ 只传递需要的变量
let result = session "Summarize"
  context: relevantData

# ❌ 避免传递所有变量
let result = session "Summarize"
  # 默认传递所有上下文（可能很大）
```

### 3. 错误处理

未来版本将支持：
```prose
try:
  let result = session "Complex task"
catch as err:
  session "Simplify the task"
```

## 🎉 成功指标

如果你看到这样的输出，说明集成成功：

```
✓ Execution completed successfully

Variables:
  greeting = {
    "output": "Hello, I am a helpful AI assistant...",
    "metadata": {
      "model": "qwen/qwen3.5-27b",
      "tokensUsed": 1588
    }
  }

Metadata:
  Sessions created: 5
  Statements executed: 14
```

注意：
- ✅ 输出是真实的 AI 回复（不是 [MOCK SESSION OUTPUT]）
- ✅ 有 `tokensUsed` 统计
- ✅ 模型显示为实际模型 ID

## 📚 更多资源

- **OpenRouter 文档**: https://openrouter.ai/docs
- **模型列表**: https://openrouter.ai/docs#models
- **定价信息**: https://openrouter.ai/docs#pricing
- **OpenProse 文档**: [RUNTIME_README.md](./RUNTIME_README.md)

---

**版本**: 1.0 (OpenRouter 集成)
**状态**: ✅ 完全可用
**最后更新**: 2026-03-06
