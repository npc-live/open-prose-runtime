# Skills vs Tools: 概念分离说明

## 🎯 核心区别

### Skills（技能）
**定义**: 引导提示词深入的知识/规范/指导

**作用**:
- 📚 补充AI的提示词上下文
- 🎨 提供特定领域的规范和知识
- 🧠 不是可执行的，而是**知识增强**

**示例**:
- `frontend-design` - 网页设计规范
- `api-documentation` - API 文档规范
- `code-review-guidelines` - 代码审查指南
- `security-best-practices` - 安全最佳实践

**本质**: 提示词工程（Prompt Engineering）的一部分

---

### Tools（工具）
**定义**: 一个function，输入输出相对明确

**作用**:
- 🔧 可执行的功能函数
- ⚡ 直接操作（文件、shell、计算等）
- 🎯 输入 → 处理 → 输出

**示例**:
- `read(path)` → `{success, content}`
- `write(path, content)` → `{success, bytes}`
- `bash(command)` → `{success, output}`
- `calculate(expression)` → `number`

**本质**: Function Calling / Tool Use

---

## 📝 语法对比

### 错误用法（混淆 skills 和 tools）❌

```prose
# ❌ 错误：把 tools 当作 skills
agent wrong:
  skills: ["read", "write", "bash"]  # 这是 tools，不是 skills！
```

### 正确用法（分离 skills 和 tools）✅

```prose
# ✅ 正确：分离 skills 和 tools
agent correct:
  skills: ["frontend-design"]        # 技能：网页设计规范
  tools: ["read", "write", "bash"]   # 工具：可执行函数
  prompt: "You are a web designer"
```

---

## 🏗️ 架构设计

### Agent 定义结构

```typescript
interface AgentInstance {
  name: string;
  model: 'opus' | 'sonnet' | 'haiku';
  skills: string[];       // 引导性技能（补充提示词）
  tools: string[];        // 可执行工具（函数调用）
  permissions: PermissionRules;
  defaultPrompt?: string;
}
```

### 执行流程

```
1. 解析 agent 定义
   ├─ skills: ["frontend-design"]  → 加载规范文档
   └─ tools: ["read", "write"]     → 启用工具注册

2. 构建提示词
   ├─ 基础提示: agent.prompt
   ├─ + Skills 内容: 网页设计规范...
   └─ + Tools 定义: [read(...), write(...)]

3. 执行 session
   ├─ AI 理解规范（从 skills）
   └─ AI 调用工具（从 tools）
```

---

## 💡 实际示例

### 示例 1: 网页设计师

```prose
# Skills 提供设计规范，Tools 提供执行能力
agent web_designer:
  model: sonnet
  skills: ["frontend-design", "ux-guidelines"]
  tools: ["write", "read", "bash"]
  prompt: "You are a professional web designer"

let website = session: web_designer
  prompt: "Create a landing page following our design system"
  # AI 会：
  # 1. 参考 frontend-design 规范（skills）
  # 2. 使用 write 工具创建 HTML 文件（tools）
```

---

### 示例 2: 代码审查员

```prose
# Skills 提供审查标准，Tools 提供读取能力
agent code_reviewer:
  model: opus
  skills: ["code-review-guidelines", "security-checklist"]
  tools: ["read", "bash"]
  prompt: "You review code for quality and security"

let review = session: code_reviewer
  prompt: "Review the file ./src/auth.ts"
  # AI 会：
  # 1. 按照 code-review-guidelines 检查（skills）
  # 2. 使用 read 工具读取文件（tools）
  # 3. 使用 bash 运行 linter（tools）
```

---

### 示例 3: 数据分析师

```prose
# Skills 提供分析方法，Tools 提供计算能力
agent data_analyst:
  model: sonnet
  skills: ["statistical-analysis", "data-visualization"]
  tools: ["read", "calculate", "write"]
  prompt: "You analyze data and generate insights"

let analysis = session: data_analyst
  prompt: "Analyze sales data in ./data.csv"
  # AI 会：
  # 1. 使用统计分析方法（skills）
  # 2. 使用 read 读取数据（tools）
  # 3. 使用 calculate 计算指标（tools）
  # 4. 使用 write 生成报告（tools）
```

---

## 🔄 Skills 的实现方式

### 当前状态（TODO）

```typescript
// interpreter.ts
if (spec.agent && spec.agent.skills && spec.agent.skills.length > 0) {
  skillPrompts = spec.agent.skills;
  this.env.log('info', `Agent has ${skillPrompts.length} skill(s) for prompt guidance: [${skillPrompts.join(', ')}]`);
  // TODO: Load skill content and append to prompt
}
```

### 未来实现方向

```typescript
// 1. 从文件/URL 加载 skill 内容
async function loadSkillContent(skillName: string): Promise<string> {
  // 加载 markdown/text 文件
  const content = await fs.readFile(`./skills/${skillName}.md`, 'utf-8');
  return content;
}

// 2. 将 skills 内容添加到系统提示词
const systemPrompt = `
${agent.defaultPrompt}

## Skills and Guidelines

${skillPrompts.map(s => loadSkillContent(s)).join('\n\n')}
`;

// 3. 发送给 AI
const messages = [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: userPrompt }
];
```

---

## 📦 Tools 的实现

### 内置 Tools（已实现）✅

```typescript
// tools.ts - BUILTIN_TOOLS
export const BUILTIN_TOOLS: ToolDefinition[] = [
  { name: 'calculate', ... },       // 计算
  { name: 'get_current_time', ... },// 时间
  { name: 'random_number', ... },   // 随机数
  { name: 'string_operations', ...},// 字符串
  { name: 'read', ... },            // 读文件 🆕
  { name: 'write', ... },           // 写文件 🆕
  { name: 'bash', ... },            // Shell 命令 🆕
  { name: 'edit', ... },            // 编辑文件 🆕
];
```

### 外部 Tools（通过 import）

```prose
# 导入外部工具
import "custom_tool" from "./skills/custom-tool.json"

agent admin:
  tools: ["custom_tool", "read", "write"]
```

---

## 🎨 Skills 文件格式

### Markdown 格式（推荐）

```markdown
# frontend-design.md

## Color Palette
- Primary: #8b5cf6
- Background: #fafbfc
- Text: #1f2937

## Typography
- Headings: System font stack
- Body: Sans-serif

## Layout Principles
- Mobile-first approach
- 12-column grid system
- Consistent spacing (8px base unit)

## Components
### Navigation Bar
- Fixed at top
- Logo on left
- Menu items on right
```

### 使用方式

```prose
agent designer:
  skills: ["frontend-design"]  # 自动加载 frontend-design.md
  tools: ["write"]
```

---

## 🔑 关键要点总结

### ✅ DO（推荐做法）

1. **Skills 用于知识/规范**
   ```prose
   skills: ["frontend-design", "api-docs"]
   ```

2. **Tools 用于可执行函数**
   ```prose
   tools: ["read", "write", "bash", "calculate"]
   ```

3. **分离使用**
   ```prose
   agent expert:
     skills: ["domain-knowledge"]   # 知识
     tools: ["read", "write"]        # 功能
   ```

---

### ❌ DON'T（错误做法）

1. **不要混淆 skills 和 tools**
   ```prose
   # ❌ 错误
   agent wrong:
     skills: ["read", "write"]  # 这些是 tools！
   ```

2. **不要把规范当作 tools**
   ```prose
   # ❌ 错误
   agent wrong:
     tools: ["frontend-design"]  # 这是 skill！
   ```

---

## 📊 对比表格

| 特性 | Skills | Tools |
|------|--------|-------|
| **本质** | 知识/规范/指导 | 可执行函数 |
| **作用** | 补充提示词 | 执行操作 |
| **输入输出** | 无明确I/O | 明确的输入输出 |
| **格式** | Markdown/Text | JSON 工具定义 |
| **示例** | frontend-design | read(path) |
| **执行** | 加载到提示词 | Function calling |
| **类型** | 静态知识 | 动态执行 |

---

## 🚀 下一步

### Skills 系统完善（TODO）

1. **Skill 文件加载**
   - 支持 `.md` 文件
   - 支持 URL 远程加载
   - 支持 GitHub 仓库

2. **Skill 内容注入**
   - 自动添加到系统提示词
   - 支持模板变量
   - 支持条件加载

3. **Skill 管理**
   - `list skills` 命令
   - `reload skill` 命令
   - Skill 版本管理

### Tools 系统扩展（已完成）✅

- ✅ 8 个内置 tools
- ✅ 外部 tools 导入
- ✅ Tool 权限控制
- ✅ Tool 执行追踪

---

## 📚 相关文档

- [Built-in Tools](./BUILTIN_TOOLS_README.md) - 内置工具文档
- [NPX Skills Integration](./NPX_SKILLS_INTEGRATION.md) - 外部技能集成
- [Tool Calling](./COMPLETION_REPORT.md) - 工具调用完整指南

---

**创建时间**: 2026-03-06
**OpenProse 版本**: v2.0.0
**功能状态**: Tools ✅ | Skills 🚧（部分实现）
