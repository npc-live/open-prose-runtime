# 剩余未实现的功能（39%）

## 📊 总览

**当前完成度**: 61% (28/46)
**剩余功能**: 39% (18/46)

---

## 🔍 详细列表

### 1. 循环控制 - Pipeline Operations（2个功能，22%）

#### 1.1 Map Operation
```prose
const items = ["a", "b", "c"]

let results = items | map:
  session: processor
    prompt: "Process {item}"
```

**AST**: `PipeExpressionNode` with map
**优先级**: 🟡 中等
**复杂度**: ⭐⭐⭐

---

#### 1.2 Filter Operation
```prose
const numbers = [1, 2, 3, 4, 5]

let evens = numbers | filter:
  **number is even**
```

**AST**: `PipeExpressionNode` with filter
**优先级**: 🟡 中等
**复杂度**: ⭐⭐⭐

---

#### 1.3 Reduce Operation
```prose
const numbers = [1, 2, 3, 4, 5]

let sum = numbers | reduce(0, num):
  acc + num
```

**AST**: `PipeExpressionNode` with reduce
**优先级**: 🟡 中等
**复杂度**: ⭐⭐⭐⭐

---

#### 1.4 Parallel Map (pmap)
```prose
const items = ["a", "b", "c"]

let results = items | pmap:
  session: processor
    prompt: "Process {item}"
```

**AST**: `PipeExpressionNode` with pmap
**优先级**: 🟢 低
**复杂度**: ⭐⭐⭐⭐

---

### 2. 条件分支 - Choice Block（2个功能，40%）

#### 2.1 Choice Block
```prose
choice **Which approach is best for this task?**:
  option "Approach A":
    session: agent "Use approach A"

  option "Approach B":
    session: agent "Use approach B"

  option "Approach C":
    session: agent "Use approach C"
```

**AST**: `ChoiceBlockNode`, `ChoiceOptionNode`
**说明**: AI 根据 criteria 选择一个 option 执行
**优先级**: 🟡 中等
**复杂度**: ⭐⭐⭐

---

### 3. 错误处理 - Retry & Backoff（3个功能，43%）

#### 3.1 Retry Property
```prose
let result = session: api
  prompt: "Call unreliable API"
  retry: 3
```

**AST**: PropertyNode on SessionStatement
**说明**: 自动重试失败的 session
**优先级**: 🔴 高（常用功能）
**复杂度**: ⭐⭐

---

#### 3.2 Backoff Strategy
```prose
let result = session: api
  prompt: "Call API"
  retry: 3
  backoff: "exponential"  # or "linear", "none"
```

**AST**: PropertyNode on SessionStatement
**说明**: 重试之间的等待策略
**优先级**: 🟡 中等
**复杂度**: ⭐⭐

---

#### 3.3 Throw (已实现但未测试)
```prose
throw "Custom error message"
```

**状态**: 已实现 `executeThrowStatement()`，但未充分测试
**优先级**: 🟢 低（已实现）
**复杂度**: ⭐

---

### 4. 高级功能 - Blocks & Chains（8个功能，100%）

#### 4.1 Do Block (Anonymous)
```prose
do:
  let x = session: agent "Step 1"
  let y = session: agent "Step 2"
  let z = session: agent "Step 3"
```

**AST**: `DoBlockNode`
**说明**: 匿名代码块，用于组织代码
**优先级**: 🟢 低
**复杂度**: ⭐⭐

---

#### 4.2 Named Block Definition
```prose
block process_item:
  let data = session: agent "Fetch data"
  let result = session: agent "Process data"
  return result
```

**AST**: `BlockDefinitionNode`
**说明**: 定义可复用的代码块
**优先级**: 🟡 中等（代码复用）
**复杂度**: ⭐⭐⭐

---

#### 4.3 Block Invocation
```prose
do process_item
```

**AST**: `DoBlockNode` with name
**说明**: 调用已定义的 block
**优先级**: 🟡 中等
**复杂度**: ⭐⭐

---

#### 4.4 Block Parameters
```prose
block greet(name):
  let message = session: agent "Say hello to {name}"

do greet("Alice")
do greet("Bob")
```

**AST**: `BlockDefinitionNode` with parameters
**说明**: 带参数的可复用 block
**优先级**: 🟡 中等
**复杂度**: ⭐⭐⭐⭐

---

#### 4.5 Arrow Chain
```prose
let result = session: agent "Step 1"
  -> session: agent "Step 2"
  -> session: agent "Step 3"
```

**AST**: `ArrowExpressionNode`
**说明**: 链式调用，前一个结果传递到下一个
**优先级**: 🟢 低（语法糖）
**复杂度**: ⭐⭐

---

#### 4.6 Pipe Chain (as statement)
```prose
let result = session: agent "Generate"
  | session: agent "Transform"
  | session: agent "Validate"
```

**AST**: `PipeExpressionNode` (as statement chain)
**说明**: 类似 arrow 但使用 | 语法
**优先级**: 🟢 低（语法糖）
**复杂度**: ⭐⭐

---

### 5. 其他 Parser 已支持但 Runtime 未实现

#### 5.1 Multi-line Strings
```prose
session: agent """
  This is a long prompt
  that spans multiple lines
  for readability.
"""
```

**AST**: `StringLiteralNode` with `isTripleQuoted: true`
**说明**: Parser 已支持，但 Runtime 执行未测试
**优先级**: 🟢 低（已解析）
**复杂度**: ⭐

---

#### 5.2 String Interpolation
```prose
let name = "Alice"
let greeting = session: agent "Hello {name}!"
```

**AST**: `InterpolatedStringNode`
**说明**: Parser 已支持，但 Runtime 执行时 {var} 不会替换
**优先级**: 🔴 高（影响用户体验）
**复杂度**: ⭐⭐

---

## 📋 按优先级排序

### 🔴 P0 - 高优先级（应该实现）

这些功能会显著提升用户体验：

1. **String Interpolation** (⭐⭐)
   - 当前 `{var}` 不会替换，AI 看到字面量
   - 影响所有使用变量的场景
   - **建议：立即实现**

2. **Retry Property** (⭐⭐)
   - 常用功能，自动重试失败的 API 调用
   - 减少用户手动写重试逻辑
   - **建议：近期实现**

---

### 🟡 P1 - 中等优先级（可选实现）

这些功能增强语言能力：

3. **Named Blocks** (⭐⭐⭐)
   - 代码复用和组织
   - 减少重复代码

4. **Block Parameters** (⭐⭐⭐⭐)
   - 参数化的代码块
   - 提高灵活性

5. **Pipeline Operations** (⭐⭐⭐)
   - 函数式编程风格
   - 数据转换流水线

6. **Choice Blocks** (⭐⭐⭐)
   - AI 决策分支
   - 动态路由

7. **Backoff Strategy** (⭐⭐)
   - 配合 retry 使用
   - 更智能的重试

---

### 🟢 P2 - 低优先级（可以跳过）

这些功能是语法糖或边缘场景：

8. **Arrow Chains** (⭐⭐)
   - 语法糖，可用其他方式实现

9. **Pipe Chains** (⭐⭐)
   - 语法糖

10. **Do Blocks** (⭐⭐)
    - 组织代码，影响不大

11. **pmap** (⭐⭐⭐⭐)
    - Parallel map，复杂且用途有限

12. **Multi-line Strings** (⭐)
    - Parser 已支持，只需测试

---

## 💡 实现建议

### 快速提升到 70%（+4个功能）

最有价值的 4 个功能：

1. **String Interpolation** (必需)
   ```typescript
   // interpreter.ts
   private async evaluateInterpolatedString(node: InterpolatedStringNode) {
     let result = '';
     for (const part of node.parts) {
       if (part.type === 'StringLiteral') {
         result += part.value;
       } else if (part.type === 'Identifier') {
         result += this.env.contextManager.getVariable(part.name);
       }
     }
     return result;
   }
   ```

2. **Retry Property**
   ```typescript
   // openrouter.ts
   private async executeSessionWithRetry(spec: SessionSpec, retries: number) {
     for (let i = 0; i < retries; i++) {
       try {
         return await this.executeSession(spec);
       } catch (err) {
         if (i === retries - 1) throw err;
       }
     }
   }
   ```

3. **Named Blocks**
   ```typescript
   // interpreter.ts
   private blocks: Map<string, BlockDefinitionNode> = new Map();

   private async executeBlockDefinition(block: BlockDefinitionNode) {
     this.blocks.set(block.name.name, block);
   }

   private async executeDoBlock(doBlock: DoBlockNode) {
     if (doBlock.name) {
       const block = this.blocks.get(doBlock.name.name);
       for (const stmt of block.body) {
         await this.executeStatement(stmt);
       }
     }
   }
   ```

4. **Choice Blocks**
   ```typescript
   // interpreter.ts
   private async executeChoiceBlock(block: ChoiceBlockNode) {
     // Ask AI to choose an option
     const choice = await this.evaluateChoice(block.criteria, block.options);
     const chosen = block.options[choice];
     for (const stmt of chosen.body) {
       await this.executeStatement(stmt);
     }
   }
   ```

---

## 📊 完成度路线图

| 阶段 | 完成度 | 新增功能 | 工作量 |
|------|--------|---------|--------|
| **当前** | **61%** | - | - |
| +String Interpolation | 63% | 1 | 1-2小时 |
| +Retry/Backoff | 67% | 2 | 2-3小时 |
| +Named Blocks | 72% | 3 | 3-4小时 |
| +Choice Blocks | 74% | 2 | 2-3小时 |
| +Pipeline Ops | 83% | 4 | 4-6小时 |
| +Arrow/Pipe Chains | 87% | 2 | 2-3小时 |
| +Block Parameters | 91% | 1 | 3-4小时 |
| **全部完成** | **100%** | 18 | **18-25小时** |

---

## 🎯 建议的实现顺序

### Phase 1: 用户体验提升（2-3小时）
1. String Interpolation - **必需**
2. Retry Property - **常用**

**目标**: 67% 完成度

---

### Phase 2: 代码复用（5-7小时）
3. Named Blocks
4. Block Invocation
5. Block Parameters

**目标**: 72% 完成度

---

### Phase 3: 高级特性（8-10小时）
6. Pipeline Operations (map, filter, reduce)
7. Choice Blocks

**目标**: 83% 完成度

---

### Phase 4: 语法糖（4-5小时）
8. Arrow Chains
9. Pipe Chains
10. Do Blocks
11. pmap

**目标**: 100% 完成度

---

## ❓ 常见问题

### Q: 为什么不实现所有功能？
A: 当前 61% 已经覆盖所有核心功能：
- ✅ 变量、函数、工具
- ✅ 循环（repeat, for, loop）
- ✅ 条件（if/else）
- ✅ 错误处理（try/catch）
- ✅ 并发（parallel）

剩余 39% 主要是：
- 函数式编程（pipeline）
- 代码复用（blocks）
- 语法糖（chains）

对于大多数用户，当前功能已经足够。

---

### Q: 最应该实现哪个？
A: **String Interpolation**

原因：
1. 影响所有使用变量的场景
2. 当前 `{var}` 不工作，用户体验差
3. 实现简单（1-2小时）
4. Parser 已支持，只需 Runtime

---

### Q: 如果只能选 3 个？
A:
1. **String Interpolation** - 修复当前问题
2. **Retry Property** - 常用功能
3. **Named Blocks** - 代码复用

这 3 个会将完成度提升到 **72%**，覆盖大部分实用场景。

---

## 📚 相关文档

- [RUNTIME_COMPLETION_SUMMARY.md](./RUNTIME_COMPLETION_SUMMARY.md) - 已实现功能总结
- [SYNTAX_STATUS_REPORT.md](./SYNTAX_STATUS_REPORT.md) - 完整语法状态
- [HANDOFF.md](./HANDOFF.md) - Parser 实现状态（所有功能已解析）

---

**更新时间**: 2026-03-06
**OpenProse 版本**: v2.0.0
**当前完成度**: 61% (28/46)
**剩余功能**: 39% (18/46)
**推荐下一步**: String Interpolation
