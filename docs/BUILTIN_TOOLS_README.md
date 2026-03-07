# OpenProse 内置工具文档

## 📦 内置工具列表

OpenProse v2.0 现在包含 **8 个内置工具**：

### 原有工具 (1-4)
1. ✅ `calculate` - 数学计算
2. ✅ `get_current_time` - 获取当前时间
3. ✅ `random_number` - 生成随机数
4. ✅ `string_operations` - 字符串操作

### 新增工具 (5-8) 🆕
5. ✅ `read` - 读取文件
6. ✅ `write` - 写入文件
7. ✅ `bash` - 执行 Shell 命令
8. ✅ `edit` - 编辑文件

---

## 🔧 工具详细说明

### 5. `read` - 读取文件

**功能**: 从指定路径读取文件内容

**参数**:
```typescript
{
  path: string;      // 必需：文件路径
  encoding?: string; // 可选：编码格式（默认 utf-8）
}
```

**返回值**:
```typescript
{
  success: boolean;
  content?: string;  // 文件内容
  path: string;
  error?: string;
}
```

**示例**:
```prose
agent reader:
  skills: ["read"]

let content = session: reader
  prompt: "Use read tool to read './config.json'"
```

---

### 6. `write` - 写入文件

**功能**: 将内容写入文件（创建或覆盖）

**参数**:
```typescript
{
  path: string;      // 必需：文件路径
  content: string;   // 必需：要写入的内容
  encoding?: string; // 可选：编码格式（默认 utf-8）
  append?: boolean;  // 可选：是否追加模式（默认 false）
}
```

**返回值**:
```typescript
{
  success: boolean;
  path: string;
  bytes: number;     // 写入字节数
  mode: string;      // 'write' 或 'append'
  error?: string;
}
```

**示例**:
```prose
agent writer:
  skills: ["write"]

# 写入新文件
let result1 = session: writer
  prompt: "Use write tool to create './output.txt' with content 'Hello World'"

# 追加内容
let result2 = session: writer
  prompt: "Use write tool with append=true to add '\\nLine 2' to './output.txt'"
```

---

### 7. `bash` - 执行 Shell 命令

**功能**: 执行任意 Shell/Bash 命令

**参数**:
```typescript
{
  command: string;   // 必需：要执行的命令
  cwd?: string;      // 可选：工作目录
  timeout?: number;  // 可选：超时时间（毫秒，默认 30000）
}
```

**返回值**:
```typescript
{
  success: boolean;
  output?: string;   // 命令输出
  command: string;
  error?: string;
  stderr?: string;
}
```

**示例**:
```prose
agent sysadmin:
  skills: ["bash"]

# 检查版本
let node = session: sysadmin
  prompt: "Use bash tool to run: node --version"

# 列出文件
let files = session: sysadmin
  prompt: "Use bash tool to run: ls -la"

# 多个命令
let multi = session: sysadmin
  prompt: "Use bash tool to run: echo 'Start' && npm install && echo 'Done'"
```

⚠️ **安全警告**:
- 只执行可信命令
- 不要执行用户未验证的输入
- 注意命令注入风险

---

### 8. `edit` - 编辑文件

**功能**: 读取文件、修改内容、写回

**参数**:
```typescript
{
  path: string;      // 必需：文件路径
  operation: string; // 必需：操作类型
  content: string;   // 必需：新内容
  search?: string;   // 替换/插入时需要：搜索文本
  encoding?: string; // 可选：编码格式
}
```

**操作类型**:
- `replace` - 替换匹配的文本（需要 search 参数）
- `insert` - 在匹配位置后插入（需要 search 参数）
- `append` - 追加到文件末尾
- `prepend` - 添加到文件开头

**返回值**:
```typescript
{
  success: boolean;
  path: string;
  operation: string;
  originalLength: number;
  newLength: number;
  changed: boolean;
  error?: string;
}
```

**示例**:
```prose
agent editor:
  skills: ["edit"]

# 追加内容
let append = session: editor
  prompt: "Use edit tool with operation='append' to add '\\nFooter' to './doc.txt'"

# 替换文本
let replace = session: editor
  prompt: "Use edit tool with operation='replace' search='old' content='new' in './doc.txt'"

# 前置内容
let prepend = session: editor
  prompt: "Use edit tool with operation='prepend' to add 'Header\\n' to './doc.txt'"
```

---

## 🎯 使用示例

### 示例 1: 文件工作流

```prose
agent file_handler:
  model: sonnet
  skills: ["read", "write", "edit"]

# 1. 创建文件
let create = session: file_handler
  prompt: "Use write tool to create './data.json' with '{\"version\": 1}'"

# 2. 读取文件
let read = session: file_handler
  prompt: "Use read tool to read './data.json'"

# 3. 编辑文件
let edit = session: file_handler
  prompt: "Use edit tool to replace '\"version\": 1' with '\"version\": 2' in './data.json'"
```

---

### 示例 2: 系统管理

```prose
agent admin:
  model: sonnet
  skills: ["bash", "write"]

# 检查系统
let check = session: admin
  prompt: "Use bash tool to run: uname -a && df -h"

# 生成报告
let report = session: admin
  prompt: "Use write tool to save system info to './report.txt'"
```

---

### 示例 3: 日志处理

```prose
agent log_processor:
  skills: ["read", "bash", "write"]

# 读取日志
let logs = session: log_processor
  prompt: "Use read tool to read './app.log'"

# 分析日志（用 bash 工具）
let errors = session: log_processor
  prompt: "Use bash tool to run: grep ERROR app.log | wc -l"

# 生成摘要
let summary = session: log_processor
  prompt: "Use write tool to create './summary.txt' with error count"
```

---

## 🔒 安全最佳实践

### 1. 文件操作安全

```prose
# ✅ 安全：使用相对路径
let safe = session: admin
  prompt: "Use write tool to create './output/data.txt'"

# ❌ 危险：写入系统目录
let unsafe = session: admin
  prompt: "Use write tool to create '/etc/passwd'"  # 不要这样做！
```

---

### 2. Shell 命令安全

```prose
# ✅ 安全：预定义命令
let safe = session: admin
  prompt: "Use bash tool to run: node --version"

# ❌ 危险：未验证的用户输入
let user_input = "rm -rf /"
let unsafe = session: admin
  prompt: "Use bash tool to run: {user_input}"  # 非常危险！
```

---

### 3. 权限控制

```prose
# ✅ 限制工具权限
agent restricted:
  skills: ["read"]  # 只允许读取
  permissions:
    tools: ["read"]

# ❌ 过度权限
agent dangerous:
  skills: ["read", "write", "bash", "edit"]  # 太多权限
```

---

## 📊 工具对比

| 工具 | 用途 | 安全级别 | 性能 |
|------|------|---------|------|
| `read` | 读取文件 | 🟢 高 | 快 |
| `write` | 写入文件 | 🟡 中 | 快 |
| `bash` | 执行命令 | 🔴 低 | 取决于命令 |
| `edit` | 编辑文件 | 🟡 中 | 中 |

---

## 🧪 测试文件

OpenProse 提供了完整的测试文件：

1. **test-builtin-tools.prose** - 基础测试
2. **test-builtin-complete.prose** - 完整功能测试

运行测试：
```bash
bun run plugin/bin/open-prose.ts run test-builtin-tools.prose
bun run plugin/bin/open-prose.ts run test-builtin-complete.prose
```

---

## 📚 相关文档

- [Tool Calling 完整指南](./COMPLETION_REPORT.md)
- [NPX Skills 集成](./NPX_SKILLS_INTEGRATION.md)
- [Shell 执行总结](./SHELL_NPX_SUMMARY.md)

---

## ✨ 更新历史

- **v2.0.0** (2026-03-06)
  - ✅ 添加 `read` 工具
  - ✅ 添加 `write` 工具
  - ✅ 添加 `bash` 工具
  - ✅ 添加 `edit` 工具

- **v1.0.0** (之前)
  - ✅ `calculate`
  - ✅ `get_current_time`
  - ✅ `random_number`
  - ✅ `string_operations`

---

## 🎉 总结

### ✅ 现在你可以：

1. **读取文件** - `read` 工具
2. **写入文件** - `write` 工具（支持 append 模式）
3. **执行命令** - `bash` 工具（完整 shell 访问）
4. **编辑文件** - `edit` 工具（replace/insert/append/prepend）

### 🔑 关键特性：

- 🚀 **内置工具** - 无需 import，直接使用
- 🛡️ **安全控制** - 通过 permissions 限制
- 📊 **执行追踪** - 完整日志和统计
- ⚡ **高性能** - 异步执行，支持大文件

---

**创建时间**: 2026-03-06
**OpenProse 版本**: v2.0.0
**功能状态**: ✅ 生产就绪
