# Skills 数据流程详解

## 完整流程图

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. IMPORT 阶段 (程序启动时)                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
    import "pdf" from "github:anthropics/skills"
                              │
                              ▼
    ┌────────────────────────────────────────┐
    │ loadAnthropicSkill()                   │
    │ - 从 GitHub 读取 SKILL.md              │
    │ - 解析 YAML frontmatter                │
    │ - 提取完整 Markdown 内容                │
    └────────────────────────────────────────┘
                              │
                              ▼
    返回 ToolDefinition 对象:
    {
      name: "pdf",
      description: "PDF manipulation...",
      type: "skill",           ← 标记为 skill 类型
      content: "[完整的 Markdown 内容]",  ← 存储在这里！
      execute: [不可执行函数]
    }
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. 存储阶段 - Tool Registry                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
    this.toolRegistry.register(tool)
                              │
                              ▼
    ToolRegistry 内部存储:
    Map<string, ToolDefinition> {
      "pdf" => {
        name: "pdf",
        type: "skill",
        content: "[SKILL.md 的完整内容]"  ← 内容保存在这里
      },
      "bash" => { ... },
      "read" => { ... }
    }


┌─────────────────────────────────────────────────────────────────┐
│ 3. SESSION 执行阶段                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
    agent documenter:         │
      skills: ["pdf"]         │
                              ▼
    ┌────────────────────────────────────────┐
    │ executeSession() in interpreter.ts     │
    │                                        │
    │ 遍历 agent.skills:                     │
    │   for (const skillName of spec.agent.skills) {
    │     const skillDef = this.toolRegistry.get(skillName)
    │                        ↑                │
    │                        └─ 从 registry 取出
    │                                        │
    │     if (skillDef.type === 'skill') {  │
    │       skillPrompts.push(              │
    │         skillDef.content  ← 取出 content
    │       )                                │
    │     }                                  │
    │   }                                    │
    └────────────────────────────────────────┘
                              │
                              ▼
    skillPrompts = [
      "[PDF skill 的完整 Markdown 内容]",
      "[其他 skills 的内容...]"
    ]
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. 注入到 OpenRouter (System Prompt)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
    await this.openRouterClient.executeSession(
      spec,
      config,
      enableTools,
      allowedTools,
      skillPrompts  ← 传递给 OpenRouter
    )
                              │
                              ▼
    ┌────────────────────────────────────────┐
    │ openrouter.ts                          │
    │                                        │
    │ if (skillPrompts && skillPrompts.length > 0) {
    │   systemMessage += '## Skills and Knowledge\n\n'
    │   systemMessage += skillPrompts.join('\n\n---\n\n')
    │                         ↑                │
    │                         └─ 拼接所有 skill 内容
    │ }                                      │
    │                                        │
    │ messages.push({                        │
    │   role: 'system',                      │
    │   content: systemMessage  ← 包含 skill 内容
    │ })                                     │
    └────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. 发送给 AI 模型                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
    POST https://openrouter.ai/api/v1/chat/completions
    {
      "model": "qwen/qwen3.5-27b",
      "messages": [
        {
          "role": "system",
          "content": "You are an AI assistant with tools...\n\n
                     ## Skills and Knowledge\n\n
                     ---\n
                     name: pdf\n
                     description: PDF manipulation\n
                     ---\n\n
                     # PDF Processing Skills\n\n
                     [完整的 PDF skill 内容]\n\n
                     ## Creating PDFs\n...\n
                     ## Extracting Content\n..."
        },
        {
          "role": "user",
          "content": "用户的 prompt"
        }
      ]
    }
                              │
                              ▼
    AI 模型看到了完整的 skill 知识，可以基于这些知识回答问题
```

## 关键数据结构

### ToolDefinition (type: 'skill')
```typescript
interface ToolDefinition {
  name: string;              // "pdf"
  description: string;       // "PDF manipulation..."
  type: 'skill';             // 标记为 skill
  content: string;           // ← 完整的 SKILL.md Markdown 内容存储在这里
  execute: () => Promise<any>; // 不可执行
}
```

### Storage Location
```typescript
class Interpreter {
  private toolRegistry: ToolRegistry;  // ← Skills 存储在这里

  // Import 时注册
  this.toolRegistry.register({
    name: "pdf",
    content: "[SKILL.md 内容]"  // ← 内容保存在 content 字段
  });

  // 使用时提取
  const skillDef = this.toolRegistry.get("pdf");
  const content = skillDef.content;  // ← 从这里取出
}
```

### System Prompt 结构
```
System Message:
├─ Tool Instructions (如果有 tools)
│  └─ "You have access to: read, write, bash..."
│
└─ Skills and Knowledge (如果有 skills)
   ├─ "## Skills and Knowledge"
   └─ [完整的 SKILL.md 内容]
      ├─ YAML frontmatter
      ├─ 主要说明文档
      ├─ 使用示例
      └─ 最佳实践
```

## 实际例子

### Import 时读取的内容
```markdown
---
name: pdf
description: PDF file manipulation and processing
---

# PDF Processing

This skill provides comprehensive PDF capabilities...

## Creating PDFs
You can create PDFs using ReportLab...

## Extracting Content
Use pdftotext or PyPDF2 to extract...

[... 几千字的详细说明 ...]
```

### 存储在 ToolRegistry 中
```javascript
toolRegistry = {
  "pdf": {
    name: "pdf",
    type: "skill",
    content: "[上面完整的 4KB Markdown 文本]"
  }
}
```

### 最终发送给 AI 的 System Prompt
```
System Message:

You are an AI assistant with access to tools...

## Skills and Knowledge

You have access to the following specialized skills:

---
name: pdf
description: PDF file manipulation and processing
---

# PDF Processing

This skill provides comprehensive PDF capabilities...

[完整的 4KB+ 文档内容]
```

## 总结

**Skills 的内容去哪了？**

1. **读取**: 从 GitHub 的 `SKILL.md` 文件读取 (4-10KB Markdown)
2. **存储**: 保存在 `ToolRegistry` 的 `ToolDefinition.content` 字段中
3. **提取**: Session 执行时从 `toolRegistry.get(skillName).content` 取出
4. **传递**: 通过 `skillPrompts` 数组传递给 OpenRouter
5. **注入**: 拼接到 System Message 的 "Skills and Knowledge" 部分
6. **使用**: AI 模型接收完整的 skill 内容作为知识库

**关键点**:
- Skill 内容**不会丢失**，完整保存在内存中
- Skill 是**文本知识**，不是可执行代码
- AI 通过 System Prompt 获得这些知识
- 每次 session 都会重新注入相关的 skills
