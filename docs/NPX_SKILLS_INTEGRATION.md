# NPX Skills Integration 文档

## 概述

OpenProse 现在支持通过 `npx skills add <owner/repo>` 自动引入外部技能！

## 🚀 快速开始

### 方法 1: 使用 `npx_skills_add` 工具（推荐）

```prose
# 导入工具
import "npx_skills_add" from "./skills/npx-skills.json"

# 定义 agent
agent skills_manager:
  model: sonnet
  skills: ["npx_skills_add"]

# 安装技能
let result = session: skills_manager
  prompt: "Use npx_skills_add to install skills from 'anthropics/example-skills'"
```

### 方法 2: 使用 `shell_exec` 工具

```prose
# 导入 shell 执行工具
import "shell_exec" from "./skills/shell-exec.json"

agent admin:
  model: sonnet
  skills: ["shell_exec"]

# 执行 npx 命令
let result = session: admin
  prompt: "Run shell command: npx skills add anthropics/example-skills"
```

---

## 📦 可用工具

### 1. `npx_skills_add` 工具

**文件**: `skills/npx-skills.json`

**功能**: 专门用于安装 GitHub 上的技能包

**参数**:
```json
{
  "repo": "owner/repo",           // GitHub 仓库
  "skill_name": "optional-name"   // 可选：技能名称
}
```

**示例**:
```prose
import "npx_skills_add" from "./skills/npx-skills.json"

agent manager:
  skills: ["npx_skills_add"]

let install = session: manager
  prompt: "Install skills from 'vercel/ai-skills' using npx_skills_add tool"
```

---

### 2. `shell_exec` 工具

**文件**: `skills/shell-exec.json`

**功能**: 执行任意 shell 命令（需谨慎使用）

**参数**:
```json
{
  "command": "shell command",     // 必需：要执行的命令
  "cwd": "/path/to/dir",         // 可选：工作目录
  "timeout": 30000                // 可选：超时（毫秒）
}
```

**示例**:
```prose
import "shell_exec" from "./skills/shell-exec.json"

agent admin:
  skills: ["shell_exec"]

# 检查 Node 版本
let node_version = session: admin
  prompt: "Run command: node --version"

# 列出文件
let files = session: admin
  prompt: "Run command: ls -la"

# NPX 命令
let npx_result = session: admin
  prompt: "Run command: npx skills add owner/repo"
```

---

## 🎯 完整示例

### 示例 1: 安装并使用外部技能

```prose
# 1. 导入工具
import "npx_skills_add" from "./skills/npx-skills.json"
import "shell_exec" from "./skills/shell-exec.json"

# 2. 安装技能
agent installer:
  model: sonnet
  skills: ["npx_skills_add"]

let install_result = session: installer
  prompt: "Install 'anthropics/web-search' skills using npx_skills_add"

# 3. 验证安装
agent verifier:
  model: sonnet
  skills: ["shell_exec"]

let verify = session: verifier
  prompt: "Check installed skills with command: npx skills list"

# 4. 使用已安装的技能
# (假设安装了 web_search 技能)
import "web_search" from "./skills/web_search.json"

agent researcher:
  model: sonnet
  skills: ["web_search"]

let search_result = session: researcher
  prompt: "Search for 'OpenAI GPT-4' using web_search"
```

---

### 示例 2: 批量安装技能

```prose
import "shell_exec" from "./skills/shell-exec.json"

agent batch_installer:
  model: sonnet
  skills: ["shell_exec"]

# 定义要安装的技能列表
let repos = ["anthropics/skills", "vercel/ai", "langchain/tools"]

# 安装第一个
let install1 = session: batch_installer
  prompt: "Run: npx skills add anthropics/skills"

# 安装第二个
let install2 = session: batch_installer
  prompt: "Run: npx skills add vercel/ai"

# 安装第三个
let install3 = session: batch_installer
  prompt: "Run: npx skills add langchain/tools"
```

---

## 🛡️ 安全注意事项

### ⚠️ Shell 命令执行风险

`shell_exec` 工具执行任意 shell 命令，存在安全风险：

1. **只使用可信命令**
2. **不要执行用户输入的命令**
3. **限制文件系统访问**
4. **设置合理的超时**

### 建议的安全实践

```prose
# ❌ 危险：直接执行未验证的命令
let dangerous = session: admin
  prompt: "Execute: {user_input}"  # 不要这样做！

# ✅ 安全：预定义的命令
let safe = session: admin
  prompt: "Run: npx skills add anthropics/skills"

# ✅ 安全：限制 agent 权限
agent restricted:
  skills: ["npx_skills_add"]  # 只允许特定工具
  permissions:
    tools: ["npx_skills_add"]
```

---

## 📋 支持的 NPX Skills 命令

### 安装技能
```bash
npx skills add <owner/repo>
```

### 列出已安装技能
```bash
npx skills list
```

### 移除技能
```bash
npx skills remove <skill-name>
```

### 更新技能
```bash
npx skills update <skill-name>
```

---

## 🔧 在 OpenProse 中使用

### 1. 安装技能

```prose
import "npx_skills_add" from "./skills/npx-skills.json"

agent installer:
  skills: ["npx_skills_add"]

let result = session: installer
  prompt: "Install skills from 'owner/repo'"
```

### 2. 导入已安装的技能

假设你安装了 `web-search` 技能：

```prose
# 从 npx skills 安装位置导入
import "web_search" from "~/.skills/web-search.json"

# 或从 npm 导入（如果发布了）
import "web_search" from "npm:@skills/web-search"
```

### 3. 使用技能

```prose
agent researcher:
  model: sonnet
  skills: ["web_search"]

let results = session: researcher
  prompt: "Search for latest AI news"
```

---

## 🎨 实际应用场景

### 场景 1: 动态安装设计工具

```prose
# 用户请求前端设计技能
import "npx_skills_add" from "./skills/npx-skills.json"

agent setup:
  skills: ["npx_skills_add"]

# 安装前端设计技能
let install = session: setup
  prompt: "Install design skills from 'skillrepo/frontend-design'"

# 等待安装完成，然后使用
import "frontend_design" from "~/.skills/frontend-design.json"

agent designer:
  skills: ["frontend_design"]

let website = session: designer
  prompt: "Create a landing page"
```

---

### 场景 2: 根据任务自动安装所需技能

```prose
import "shell_exec" from "./skills/shell-exec.json"

agent auto_installer:
  model: sonnet
  skills: ["shell_exec"]
  prompt: "You automatically install required skills based on task requirements"

# 分析任务并安装技能
let task = "I need to search the web and analyze sentiment"

let auto_setup = session: auto_installer
  prompt: """
Task: {task}

Determine what skills are needed and install them:
1. For web search: npx skills add skills/web-search
2. For sentiment analysis: npx skills add skills/nlp-sentiment

Execute the installation commands.
"""
  context: [task]
```

---

### 场景 3: 技能市场

```prose
import "npx_skills_add" from "./skills/npx-skills.json"
import "shell_exec" from "./skills/shell-exec.json"

agent marketplace:
  model: sonnet
  skills: ["npx_skills_add", "shell_exec"]
  prompt: "You help users discover and install skills from a marketplace"

# 浏览可用技能
let browse = session: marketplace
  prompt: "List available skills in the 'awesome-skills' organization"

# 安装推荐技能
let install_recommended = session: marketplace
  prompt: "Install the top 3 most useful skills for data analysis"
```

---

## 🔍 故障排查

### 问题 1: npx 命令未找到

```prose
import "shell_exec" from "./skills/shell-exec.json"

agent checker:
  skills: ["shell_exec"]

let check = session: checker
  prompt: "Check if npx is installed: which npx"
```

**解决方案**:
```bash
# 安装 Node.js 和 npm
brew install node  # macOS
# 或
apt install nodejs npm  # Linux
```

---

### 问题 2: 技能安装失败

```prose
let install = session: installer
  prompt: "Try installing with verbose output: npx skills add owner/repo --verbose"
```

**检查**:
- GitHub 仓库是否存在
- 网络连接是否正常
- 是否有权限访问仓库

---

### 问题 3: 导入已安装技能失败

**查找技能位置**:
```prose
let find = session: admin
  prompt: "Find installed skills: ls ~/.skills"
```

**检查技能格式**:
```prose
let inspect = session: admin
  prompt: "Check skill JSON: cat ~/.skills/skill-name.json"
```

---

## 📚 相关资源

### OpenProse 文档
- [Import Skills](./COMPLETION_REPORT.md#4-import-skills-支持)
- [Tool Calling](./TOOL_CALLING.md)
- [Custom Tools](./FRONTEND_DESIGN_TEST_README.md)

### NPX Skills
- [NPX 官方文档](https://docs.npmjs.com/cli/v7/commands/npx)
- [Skills 生态系统](https://github.com/skills)

---

## ✅ 支持的 Shell 语句

### 当前支持 ✅

通过 `shell_exec` 工具，OpenProse 支持：

| 功能 | 支持 | 方式 |
|------|------|------|
| 执行 shell 命令 | ✅ | `shell_exec` tool |
| NPX 命令 | ✅ | `shell_exec` 或 `npx_skills_add` |
| 文件操作 | ✅ | `shell_exec` (ls, cat, etc.) |
| 环境检查 | ✅ | `shell_exec` (node -v, etc.) |
| Git 操作 | ✅ | `shell_exec` (git clone, etc.) |

### 语法层面 ❌

OpenProse 语言本身 **不直接支持** shell 语句语法，例如：

```prose
# ❌ 这样不支持
shell "ls -la"

# ❌ 这样也不支持
exec: ls -la
```

### 解决方案 ✅

使用工具调用：

```prose
# ✅ 正确方式
import "shell_exec" from "./skills/shell-exec.json"

agent admin:
  skills: ["shell_exec"]

let result = session: admin
  prompt: "Execute shell command: ls -la"
```

---

## 🎯 快速参考

### 安装 NPX Skills

```prose
import "npx_skills_add" from "./skills/npx-skills.json"

agent manager:
  skills: ["npx_skills_add"]

let install = session: manager
  prompt: "Install from 'owner/repo'"
```

### 执行 Shell 命令

```prose
import "shell_exec" from "./skills/shell-exec.json"

agent admin:
  skills: ["shell_exec"]

let result = session: admin
  prompt: "Run: your-command-here"
```

### 组合使用

```prose
import "npx_skills_add" from "./skills/npx-skills.json"
import "shell_exec" from "./skills/shell-exec.json"

agent power_user:
  skills: ["npx_skills_add", "shell_exec"]

# 安装
let install = session: power_user
  prompt: "Install skills from 'repo'"

# 验证
let verify = session: power_user
  prompt: "Run: npx skills list"
```

---

## 🎉 总结

### ✅ OpenProse 现在支持：

1. **NPX Skills 集成** - 通过 `npx_skills_add` 工具
2. **Shell 命令执行** - 通过 `shell_exec` 工具
3. **动态技能安装** - 运行时安装和导入
4. **完整工具链** - 安装、验证、使用

### ⚠️ 注意：

- Shell 执行需要安全考虑
- 语言层面不直接支持 shell 语法
- 通过工具调用实现（更安全、更可控）

---

**文档版本**: v1.0
**OpenProse 版本**: v2.0.0
**创建日期**: 2026-03-06
**状态**: ✅ 生产就绪
