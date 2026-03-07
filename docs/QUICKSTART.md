# OpenProse 执行引擎 - 快速入门

## 🚀 5 分钟上手

### 1. 运行示例程序

```bash
cd plugin

# Hello World
bun run bin/open-prose.ts run examples/01-hello-world.prose

# 研究和总结
bun run bin/open-prose.ts run examples/02-research-and-summarize.prose

# 完整演示
bun run bin/open-prose.ts run ../demo.prose
```

### 2. 创建你的第一个程序

创建 `hello.prose`:
```prose
let name = "World"
let greeting = session "Say hello to {name}"
```

运行：
```bash
bun run bin/open-prose.ts run hello.prose
```

### 3. 理解输出

```
============================================================
Executing: hello.prose
============================================================

[INFO] Starting program execution
[INFO] Executing session: Say hello to World
[INFO] Execution completed successfully in 104ms

============================================================
Execution Results
============================================================

✓ Execution completed successfully

Variables:
  name = "World"
  greeting = {
    "output": "[MOCK SESSION OUTPUT]...",
    "metadata": { "model": "sonnet", "duration": 102 }
  }

Metadata:
  Duration: 104ms
  Sessions created: 1
  Statements executed: 2
```

## ✅ 支持的功能

### 变量
```prose
# 可变变量
let x = "hello"
x = "world"

# 常量
const pi = 3.14
```

### Session 执行
```prose
# 简单 session
session "Do something"

# 带结果捕获
let result = session "Research AI"

# 字符串插值
let topic = "AI"
let research = session "Research {topic}"
```

### 上下文传递
```prose
let data = "important info"

# 传递单个变量
let result = session "Process"
  context: data

# 传递多个变量
let result = session "Process"
  context: [data, other]

# 对象简写
let x = 1
let y = 2
let result = session "Calculate"
  context: { x, y }
```

### 数组和对象
```prose
let items = ["a", "b", "c"]
let config = { key: "value", count: 42 }
```

## 📚 更多资源

- **完整文档**: [RUNTIME_README.md](./RUNTIME_README.md)
- **技术设计**: [EXECUTION_ENGINE_TECH.md](./EXECUTION_ENGINE_TECH.md)
- **实现总结**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

## ⚠️ 当前版本限制

- Session 执行是 Mock 实现（返回测试数据）
- 尚未支持：并行、循环、条件、错误处理

真实的 AI 集成将在下一个版本实现。

## 🧪 运行测试

```bash
cd plugin

# 所有测试
bun test

# 只运行 runtime 测试
bun test src/__tests__/runtime.test.ts
```

## 💻 编程接口

```typescript
import { parse, execute } from './src';

const source = `
  let x = "test"
  let result = session "Process {x}"
`;

const parseResult = parse(source);
const result = await execute(parseResult.program);

console.log(result.outputs.get('x')); // "test"
console.log(result.success); // true
```

## 🎯 CLI 命令

```bash
# 验证语法
bun run bin/open-prose.ts validate program.prose

# 编译（查看规范化输出）
bun run bin/open-prose.ts compile program.prose

# 执行
bun run bin/open-prose.ts run program.prose
```

## 🏆 成功标志

如果你看到这个输出，说明一切正常：

```
✓ Execution completed successfully

Metadata:
  Duration: XXXms
  Sessions created: X
  Statements executed: X
```

---

**准备好了？开始编写你的第一个 OpenProse 程序吧！** 🚀
