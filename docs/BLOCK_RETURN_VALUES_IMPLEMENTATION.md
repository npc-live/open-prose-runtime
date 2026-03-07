# Block Return Values 实现总结

## 🎯 实现的功能

成功实现了 OpenProse 的 **Block Return Values**（代码块返回值）功能，使得 blocks 能够像函数一样返回值。

### ✅ 核心功能

**语法**:
```prose
block get_message():
  return "Hello from block"

let msg = do get_message()
```

**特性**:
- ✅ 支持 `return` 语句在 block 内部使用
- ✅ Named blocks 可以返回值
- ✅ Anonymous blocks 也可以返回值
- ✅ 支持在任何位置使用 return（包括条件分支内）
- ✅ 没有 return 语句的 block 自动返回 null
- ✅ 支持 block 作为表达式（`let x = do block()`）
- ✅ 早期返回（early return）支持

---

## 📊 实现细节

### 代码修改

#### 1. Parser 层（语法解析）

**文件**: `plugin/src/parser/ast.ts`
- 添加 `ReturnStatementNode` 接口定义
- 添加到 `StatementNode` union type
- 添加 visitor 方法支持

**文件**: `plugin/src/parser/tokens.ts`
- 添加 `RETURN` token type
- 添加到 KEYWORDS 映射

**文件**: `plugin/src/parser/parser.ts`
- 实现 `parseReturnStatement()` 方法：
  ```typescript
  private parseReturnStatement(): ReturnStatementNode {
    const returnToken = this.advance();
    const start = returnToken.span.start;

    let value: ExpressionNode | null = null;
    if (!this.check(TokenType.NEWLINE) && !this.check(TokenType.EOF) && !this.check(TokenType.COMMENT)) {
      value = this.parseBindingExpression();
    }

    const end = this.previous().span.end;
    return { type: 'ReturnStatement', value, span: { start, end } };
  }
  ```

**文件**: `plugin/src/parser/index.ts`
- 导出 `ReturnStatementNode` type

#### 2. Runtime 层（运行时执行）

**文件**: `plugin/src/runtime/interpreter.ts`

1. **添加 ReturnSignal 异常类**:
   ```typescript
   class ReturnSignal extends Error {
     constructor(public readonly value: RuntimeValue) {
       super('ReturnSignal');
       this.name = 'ReturnSignal';
     }
   }
   ```
   这不是真正的错误，而是用于控制流的机制。

2. **实现 executeReturnStatement()**:
   ```typescript
   private async executeReturnStatement(statement: ReturnStatementNode): Promise<StatementResult> {
     let value: RuntimeValue = null;
     if (statement.value) {
       value = await this.evaluateExpression(statement.value);
     }
     throw new ReturnSignal(value);
   }
   ```

3. **修改 executeDoBlock() 捕获 ReturnSignal**:
   ```typescript
   try {
     for (const statement of blockDef.body) {
       await this.executeStatement(statement);
     }
     return { value: null }; // 没有 return 时返回 null
   } catch (error) {
     if (error instanceof ReturnSignal) {
       return { value: error.value }; // 返回 return 的值
     }
     throw error; // 其他错误继续抛出
   }
   ```

4. **在 evaluateExpression() 添加 DoBlock 支持**:
   ```typescript
   case 'DoBlock':
     const doResult = await this.executeDoBlock(expr as DoBlockNode);
     return doResult.value !== undefined ? doResult.value : null;
   ```

---

## 🧪 测试覆盖

### 测试文件
- `test-block-return-simple.prose` - 基础返回值测试
- `test-block-return-complete.prose` - 完整功能测试

### 测试场景

#### 1. 基础返回值 ✅
```prose
block get_message():
  return "Hello from block"

let msg = do get_message()
# msg = "Hello from block"
```

#### 2. 带参数的 Block ✅
```prose
block greet(name):
  return "Hello, {name}!"

let greeting1 = do greet("Alice")
let greeting2 = do greet("Bob")
# greeting1 = "Hello, Alice!"
# greeting2 = "Hello, Bob!"
```

#### 3. 条件返回 ✅
```prose
block check_value(val):
  if **{val} is "test"**:
    return "found test"
  else:
    return "not test"

let result = do check_value("test")
# result = "found test"
```

#### 4. 匿名 Block 返回 ✅
```prose
let computed = do:
  let temp = "computed value"
  return temp

# computed = "computed value"
```

#### 5. 无返回语句 ✅
```prose
block no_return():
  let x = "internal value"

let nothing = do no_return()
# nothing = null
```

### 测试结果
```
✓ 所有 5 个测试场景通过
✓ Variables 正确赋值
✓ String interpolation 正常工作
✓ 早期返回（early return）正常工作
✓ 无返回语句时正确返回 null
```

---

## 💡 使用示例

### 示例 1: 数据处理函数
```prose
block process_item(item):
  if **{item} is empty**:
    return "error: empty item"

  let processed = session: processor
    prompt: "Process {item}"

  return processed

let result = do process_item(data)
```

### 示例 2: 条件逻辑
```prose
block get_status(code):
  if **{code} is success**:
    return "OK"
  elif **{code} is error**:
    return "FAIL"
  else:
    return "UNKNOWN"

let status = do get_status(response)
```

### 示例 3: 计算结果
```prose
block calculate():
  let data = session: analyzer "Analyze data"
  return data

let analysis = do calculate()
session: reporter "Report: {analysis}"
```

---

## 🆚 Before vs After

### Before（无返回值）
```prose
block greet(name):
  let greeting = "Hello, {name}!"
  # 无法返回 greeting

# 无法这样用:
# let msg = do greet("Alice")  ❌
```

### After（支持返回值）
```prose
block greet(name):
  return "Hello, {name}!"

# 可以这样用:
let msg = do greet("Alice")  ✅
session: tester "Say: {msg}"
```

---

## 🔍 实现原理

### 控制流机制

**问题**: 如何从嵌套的语句块中立即返回？

**解决方案**: 使用异常机制（ReturnSignal）：

1. **return 语句执行时**: 抛出 `ReturnSignal` 异常，携带返回值
2. **Block 执行器捕获**: `executeDoBlock()` 捕获 `ReturnSignal`
3. **提取返回值**: 从异常对象中提取 value
4. **继续执行**: 正常返回给调用者

这种方式的优势：
- ✅ 可以从任意深度的嵌套中返回
- ✅ 不需要检查每个语句是否返回
- ✅ 与异常处理（try/catch）兼容
- ✅ 性能开销小（只在 return 时才抛出）

### 类型系统集成

**StatementResult**:
```typescript
interface StatementResult {
  value?: RuntimeValue;  // 可选的返回值
}
```

**Block 作为表达式**:
```typescript
case 'DoBlock':
  const doResult = await this.executeDoBlock(expr as DoBlockNode);
  return doResult.value !== undefined ? doResult.value : null;
```

---

## 📈 完成度更新

| 类别 | 之前 | 现在 | 提升 |
|------|------|------|------|
| 高级功能 | 38% (3/8) | **50% (4/8)** | **+12%** ⬆️ |
| **总体** | **76% (35/46)** | **78% (36/46)** | **+2%** ⬆️ |

**新增功能**:
- ✅ Block return values（完整实现）
  - ✅ return 语句
  - ✅ 支持表达式返回
  - ✅ 支持早期返回
  - ✅ Block 作为表达式

---

## 🎯 Block 功能对比

### 其他语言

**JavaScript**:
```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
let msg = greet("Alice");
```

**Python**:
```python
def greet(name):
    return f"Hello, {name}!"
msg = greet("Alice")
```

### OpenProse
```prose
block greet(name):
  return "Hello, {name}!"

let msg = do greet("Alice")
```

**对比结论**: OpenProse blocks 现在与传统编程语言的函数功能相当！

---

## ⚠️ 已知限制

### 1. 不支持多返回值
```prose
# 不支持:
block get_pair():
  return x, y  ❌

# 解决方案: 返回数组或对象
block get_pair():
  return [x, y]  ✅
```

### 2. 不支持类型声明
```prose
# 不支持:
block add(x: number, y: number) -> number:  ❌
  return x + y

# 当前: 无类型检查
block add(x, y):
  return x + y  ✅（但没有类型安全）
```

---

## 🚀 实际应用场景

### 场景 1: 数据验证
```prose
block validate_email(email):
  if **{email} is valid email format**:
    return email
  else:
    return null

let validated = do validate_email(user_input)
if **{validated} is null**:
  session: error_handler "Invalid email"
```

### 场景 2: 配置工厂
```prose
block create_config(env):
  if **{env} is "production"**:
    return {
      api_url: "https://api.prod.com",
      timeout: 30
    }
  else:
    return {
      api_url: "https://api.dev.com",
      timeout: 10
    }

let config = do create_config(environment)
```

### 场景 3: 结果转换
```prose
block process_results(results):
  let processed = results | filter:
    if **{item} is valid**: session: checker

  if **{processed} is empty**:
    return "No valid results"
  else:
    return processed

let final = do process_results(raw_data)
```

---

## 📚 相关文档

- `IMPLEMENTATION_SUMMARY_2026-03-06.md` - String Interpolation + Retry + Named Blocks
- `PIPELINE_IMPLEMENTATION.md` - Pipeline 操作实现
- `COMPLETION_STATUS.md` - 完整完成度状态

---

## 🎉 总结

### 成就
1. ✅ 实现了完整的 Block return values 功能
2. ✅ 支持 return 语句在任意位置使用
3. ✅ Block 可以作为表达式用于赋值
4. ✅ 支持早期返回（early return）
5. ✅ 无返回语句时自动返回 null
6. ✅ 所有测试通过

### 影响
OpenProse blocks 现在：
- ✅ 功能等同于传统编程语言的函数
- ✅ 支持代码复用和模块化
- ✅ 可以构建复杂的逻辑流
- ✅ 更好的值传递和数据流控制

用户现在可以使用 **blocks 作为真正的函数**，构建更复杂、更模块化的 AI 工作流！

---

**实现时间**: 2026-03-07
**OpenProse 版本**: v2.0.0+
**Runtime 完成度**: 78% (36/46)
**提升**: +2% (从 76% 到 78%)
**高级功能**: 50% (4/8)
**状态**: ✅ 生产就绪
**测试**: ✅ 5/5 通过

---

🎉 **OpenProse Blocks 现在是真正的函数！** 🚀
