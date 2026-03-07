# OpenProse 快速参考

## 📋 Skills vs Tools

```prose
agent name:
  skills: ["规范/知识"]  # 引导提示词的文档
  tools: ["函数名"]       # 可执行的工具
```

### Skills（技能）- 知识引导

```prose
skills: ["frontend-design", "api-docs", "security-guidelines"]
```

- 📚 补充AI上下文的规范文档
- 🎨 不可执行，纯知识
- 📝 通常是 .md 文件

### Tools（工具）- 可执行函数

```prose
tools: ["read", "write", "bash", "edit", "calculate"]
```

- 🔧 明确的输入输出
- ⚡ 可执行的函数
- 🎯 Function Calling

---

## 🔧 8 个内置 Tools

### 文件操作
```prose
tools: ["read", "write", "edit"]

# read - 读取文件
"Use read tool to read './file.txt'"

# write - 写入文件（支持 append）
"Use write tool to create './output.txt' with 'content'"
"Use write tool with append=true to add to './file.txt'"

# edit - 编辑文件
"Use edit tool with operation='append' to add to './file.txt'"
"Use edit tool with operation='replace' search='old' content='new'"
```

### Shell 执行
```prose
tools: ["bash"]

# bash - 执行命令
"Use bash tool to run: ls -la"
"Use bash tool to run: npm install"
```

### 其他工具
```prose
tools: ["calculate", "get_current_time", "random_number", "string_operations"]

# calculate - 数学计算
"Use calculate tool: 2 + 2"

# get_current_time - 获取时间
"Use get_current_time tool with format='iso'"

# random_number - 随机数
"Use random_number tool: min=1, max=100"

# string_operations - 字符串
"Use string_operations tool: text='hello', operation='uppercase'"
```

---

## 📝 完整示例

### 示例 1: 文件操作

```prose
agent file_manager:
  tools: ["read", "write", "bash"]

let create = session: file_manager
  prompt: "Use write tool to create './test.txt' with 'Hello'"

let read_content = session: file_manager
  prompt: "Use read tool to read './test.txt'"

let delete = session: file_manager
  prompt: "Use bash tool to run: rm test.txt"
```

### 示例 2: 网页设计（Skills + Tools）

```prose
agent web_designer:
  skills: ["frontend-design"]        # 设计规范
  tools: ["write", "read"]           # 文件操作
  prompt: "You are a web designer"

let website = session: web_designer
  prompt: "Create a landing page following our design system"
  # AI 会参考 frontend-design 规范（skills）
  # 并使用 write 工具创建 HTML（tools）
```

### 示例 3: 权限控制

```prose
agent restricted:
  tools: ["read", "write", "bash"]
  permissions:
    tools: ["read"]  # 只允许 read，禁止 write 和 bash

let safe = session: restricted
  prompt: "Read './config.json'"  # ✅ 允许

let unsafe = session: restricted
  prompt: "Delete all files"  # ❌ 没有 bash 权限
```

---

## 🚀 快速开始

### 1. 基础文件操作

```prose
agent admin:
  tools: ["read", "write", "bash"]

let result = session: admin
  prompt: "Create a file called 'hello.txt' with 'Hello World'"
```

### 2. 执行测试

```bash
bun run plugin/bin/open-prose.ts run yourfile.prose
```

### 3. 查看文档

```bash
# 内置工具详细文档
cat BUILTIN_TOOLS_README.md

# Skills vs Tools 概念
cat SKILLS_VS_TOOLS.md

# 更新总结
cat TOOLS_UPDATE_SUMMARY.md
```

---

## ⚠️ 安全注意事项

### bash 工具风险

```prose
# ✅ 安全：预定义命令
"Use bash tool to run: node --version"

# ❌ 危险：用户输入
let user_cmd = "rm -rf /"
"Use bash tool to run: {user_cmd}"  # 不要这样做！
```

### 权限控制

```prose
agent safe:
  tools: ["read"]           # 只读
  permissions:
    tools: ["read"]

agent admin:
  tools: ["read", "write", "bash"]  # 完全权限
  permissions:
    tools: ["read", "write", "bash"]
```

---

## 📚 相关文档

| 文档 | 内容 |
|------|------|
| [BUILTIN_TOOLS_README.md](./BUILTIN_TOOLS_README.md) | 8个内置工具详细API |
| [SKILLS_VS_TOOLS.md](./SKILLS_VS_TOOLS.md) | Skills vs Tools 概念详解 |
| [TOOLS_UPDATE_SUMMARY.md](./TOOLS_UPDATE_SUMMARY.md) | 本次更新总结 |
| [NPX_SKILLS_INTEGRATION.md](./NPX_SKILLS_INTEGRATION.md) | 外部技能集成 |
| [SHELL_NPX_SUMMARY.md](./SHELL_NPX_SUMMARY.md) | Shell 执行总结 |

---

**OpenProse v2.0.0** | 2026-03-06
