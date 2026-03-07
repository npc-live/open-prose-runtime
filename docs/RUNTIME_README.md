# OpenProse 运行时执行引擎

## ✅ 第一版已实现

恭喜！OpenProse 执行引擎的第一版已经实现并可以运行了。

## 已实现的功能

### ✅ Phase 1: 基础执行引擎

#### 核心组件
- **RuntimeEnvironment** - 运行时环境管理
- **ContextManager** - 变量作用域和上下文管理
- **Interpreter** - AST 解释执行器

#### 支持的语法
- ✅ **变量声明**: `let x = "value"`, `const pi = 3.14`
- ✅ **变量赋值**: `x = "new value"`
- ✅ **Session 执行**: `session "prompt"`
- ✅ **带变量的 Session**: `let result = session "prompt"`
- ✅ **字符串插值**: `session "Research {topic}"`
- ✅ **上下文传递**: `context: varName`, `context: [a, b]`, `context: { x, y }`
- ✅ **Agent 定义**: `agent name: model: sonnet, prompt: "..."`
- ✅ **数组**: `let items = ["a", "b", "c"]`
- ✅ **对象**: `let config = { key: "value" }`
- ✅ **顺序执行**: 按照语句顺序依次执行

## 快速开始

### 安装依赖
```bash
cd plugin
bun install
```

### 编译并执行程序

#### 1. 创建一个 `.prose` 文件
```prose
# example.prose
let topic = "AI agents"
let research = session "Research {topic}"
let summary = session "Summarize findings"
  context: research
```

#### 2. 运行程序
```bash
# 验证语法
bun run bin/open-prose.ts validate example.prose

# 编译（查看规范化输出）
bun run bin/open-prose.ts compile example.prose

# 执行
bun run bin/open-prose.ts run example.prose
```

### 编程接口

```typescript
import { parse, execute } from './src';

// 执行 OpenProse 代码
const source = `
  let x = "test"
  let result = session "Process {x}"
`;

const parseResult = parse(source);
const executionResult = await execute(parseResult.program);

if (executionResult.success) {
  console.log('Variables:', executionResult.outputs);
  console.log('Duration:', executionResult.metadata.duration, 'ms');
}
```

### 自定义配置

```typescript
import { execute } from './src/runtime';

const result = await execute(program, {
  // 默认模型
  defaultModel: 'sonnet',

  // 超时设置（毫秒）
  sessionTimeout: 300000,
  totalExecutionTimeout: 3600000,

  // 安全限制
  maxLoopIterations: 100,
  maxCallDepth: 50,

  // 调试选项
  debug: true,
  traceExecution: true,
  logLevel: 'info',
});
```

## 执行示例

### 示例 1: 简单变量和 Session
```prose
let name = "OpenProse"
let greeting = session "Say hello to {name}"
```

**执行结果**:
```
Variables:
  name = "OpenProse"
  greeting = {
    "output": "[MOCK SESSION OUTPUT]...",
    "metadata": { "model": "sonnet", "duration": 102 }
  }
```

### 示例 2: 上下文传递
```prose
let data = "important information"
let processed = session "Process this data"
  context: data
```

Session 会收到完整的上下文信息，包括 `data` 变量的值。

### 示例 3: 多个变量上下文
```prose
let a = "first"
let b = "second"
let c = "third"

let result = session "Combine all"
  context: [a, b, c]
```

### 示例 4: 对象上下文简写
```prose
let x = 1
let y = 2

let sum = session "Calculate x + y"
  context: { x, y }
```

## 运行测试

```bash
cd plugin

# 运行所有测试
bun test

# 只运行运行时测试
bun test src/__tests__/runtime.test.ts

# 运行特定测试
bun test src/__tests__/runtime.test.ts -t "should execute a simple program"
```

## 架构说明

### 目录结构
```
plugin/src/runtime/
├── types.ts          # 类型定义
├── context.ts        # 上下文管理器
├── environment.ts    # 运行时环境
├── interpreter.ts    # 解释器
└── index.ts          # 导出
```

### 执行流程

```
Source Code (.prose)
        ↓
   Lexer (词法分析)
        ↓
   Parser (语法分析)
        ↓
      AST
        ↓
  Validator (语义验证)
        ↓
  Compiler (编译规范化)
        ↓
  Interpreter (执行)
        ↓
     Results
```

### 执行过程

1. **初始化**: 创建 RuntimeEnvironment 和 Interpreter
2. **遍历 AST**: 按顺序执行每个语句
3. **变量管理**: 通过 ContextManager 管理作用域
4. **Session 执行**: 创建 AI Session（当前是 Mock 实现）
5. **上下文传递**: 将变量快照传递给 Session
6. **收集结果**: 记录所有变量和执行统计

## 当前限制

### ⚠️ Mock Session
当前版本的 Session 执行是 **Mock 实现**，返回固定的模拟输出。真实的 AI 集成将在 Phase 2 实现。

### 🚧 未实现的功能
以下功能已在解析器和编译器中支持，但运行时尚未实现：

- ⏳ 并行执行 (`parallel:`)
- ⏳ 循环 (`repeat`, `for`, `loop`)
- ⏳ 条件分支 (`if`, `choice`)
- ⏳ 错误处理 (`try/catch/finally`)
- ⏳ 管道操作 (`|map`, `|filter`, `|reduce`)
- ⏳ 块定义和调用 (`block`, `do`)
- ⏳ 箭头序列 (`session "A" -> session "B"`)

这些功能将在后续版本中逐步添加。

## 调试技巧

### 启用调试日志
```typescript
const result = await execute(program, {
  debug: true,
  traceExecution: true,
  logLevel: 'debug',
});
```

### 查看执行跟踪
运行时会输出详细的执行日志：
```
[INFO] Starting program execution
[INFO] Executing session statement
[INFO] Executing session: Research AI agents
[DEBUG] Variable 'result' declared with value: {...}
[INFO] Execution completed successfully in 104ms
```

### 检查执行结果
```typescript
if (result.success) {
  console.log('Duration:', result.metadata.duration, 'ms');
  console.log('Sessions:', result.metadata.sessionsCreated);
  console.log('Statements:', result.metadata.statementsExecuted);
  console.log('Variables:', result.outputs);
} else {
  console.error('Errors:', result.errors);
}
```

## 下一步计划

### Phase 2: Agent 集成 (2-3周)
- [ ] 集成 Anthropic API
- [ ] 支持 Claude Code CLI
- [ ] 实现真实的 Session 执行
- [ ] 实现 `**...**` 条件评估

### Phase 3: 控制流 (3-4周)
- [ ] 并行执行 (`parallel:`)
- [ ] 循环 (`repeat`, `for`, `loop`)
- [ ] 条件分支 (`if`, `choice`)

### Phase 4: 高级特性 (2-3周)
- [ ] 错误处理 (`try/catch/finally`)
- [ ] 管道操作
- [ ] 块组合

查看完整路线图：[EXECUTION_ENGINE_TECH.md](./EXECUTION_ENGINE_TECH.md)

## 贡献

欢迎贡献！开发流程：

1. 添加新功能前先看 `EXECUTION_ENGINE_TECH.md`
2. 在 `src/runtime/` 中实现功能
3. 在 `src/__tests__/runtime.test.ts` 中添加测试
4. 运行测试确保通过
5. 更新此文档

## 示例程序

查看 `plugin/examples/` 目录中的示例程序：
- `01-hello-world.prose` - 最简单的程序
- `02-research-and-summarize.prose` - 研究和总结工作流

可以用 `bun run bin/open-prose.ts run examples/XX.prose` 运行。

---

**版本**: 1.0 (Phase 1)
**状态**: ✅ 基础功能已实现
**最后更新**: 2026-03-06
