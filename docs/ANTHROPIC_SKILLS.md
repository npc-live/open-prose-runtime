# Anthropic Skills Integration

OpenProse now supports importing skills from the [Anthropic Skills repository](https://github.com/anthropics/skills), which provides a collection of pre-built skills that give AI agents specialized knowledge and capabilities.

## What are Skills?

Skills are different from tools:
- **Tools** are executable functions (read, write, bash, etc.) that perform actions
- **Skills** provide knowledge, guidance, and best practices to the AI agent through Markdown documentation

## Importing Anthropic Skills

Use the `import` statement to load skills from the Anthropic Skills repository:

```prose
# Import a skill from anthropics/skills
import "pdf" from "github:anthropics/skills"
import "bash" from "github:anthropics/skills"
```

## Using Skills with Agents

Assign skills to agents using the `skills` property:

```prose
agent document_expert:
  model: sonnet
  prompt: "You are a document processing expert"
  skills: ["pdf"]           # Skills provide knowledge
  tools: ["read", "write"]  # Tools provide actions
```

## How Skills Work

1. **Import Phase**: When a skill is imported, OpenProse fetches the `SKILL.md` file from the repository
2. **Parsing Phase**: The skill's YAML frontmatter (name, description) and Markdown content are extracted
3. **Injection Phase**: When a session runs, the skill's content is injected into the AI's system prompt
4. **Execution Phase**: The AI uses the skill's knowledge to guide its responses and actions

## Available Skills

The Anthropic Skills repository includes many pre-built skills. Some examples:

- **pdf**: PDF manipulation, creation, and extraction capabilities
- **bash**: Advanced shell scripting and command-line expertise
- **python**: Python programming best practices and patterns
- **sql**: Database querying and optimization guidance
- And many more...

Browse the full collection at: https://github.com/anthropics/skills/tree/main/skills

## Example: PDF Processing Agent

```prose
import "pdf" from "github:anthropics/skills"

agent pdf_processor:
  model: sonnet
  prompt: "You are a PDF processing specialist"
  skills: ["pdf"]
  tools: ["read", "write", "bash"]

session: pdf_processor
  prompt: "Explain your capabilities for working with PDF files"
```

**Output**: The AI will have access to comprehensive PDF knowledge including:
- How to merge, split, rotate, and manipulate PDFs
- Text and table extraction techniques
- PDF creation and form filling
- OCR capabilities for scanned documents
- Encryption and metadata handling

## Skill Content Format

Skills in the Anthropic repository follow this format:

```markdown
---
name: pdf
description: PDF manipulation and processing capabilities
---

# PDF Processing Skills

[Detailed knowledge and guidance about PDFs...]

## Creating PDFs
...

## Extracting Content
...
```

## Implementation Details

### Tool Registry Entry

When a skill is imported, it's registered as a special tool type:

```typescript
{
  name: "pdf",
  description: "PDF manipulation and processing capabilities",
  type: "skill",      // Marks this as a skill, not an executable tool
  content: "...",     // Full Markdown content from SKILL.md
  execute: async () => {
    throw new Error('Skills are not executable - they provide guidance to the AI');
  }
}
```

### System Prompt Injection

During session execution, skill content is added to the system prompt:

```
## Skills and Knowledge

You have access to the following specialized skills and knowledge:

[Full content of SKILL.md file(s)]
```

## Limitations

1. **Not Executable**: Skills provide knowledge, not executable functions
2. **GitHub Only**: Currently only supports `github:anthropics/skills` imports
3. **Internet Required**: Fetches skills from GitHub at runtime (cached in tool registry)
4. **Markdown Format**: Only supports the Anthropic Skills Markdown format with YAML frontmatter

## Future Enhancements

Planned improvements:
- Local skill imports (`import "custom" from "./skills/custom"`)
- NPM skill packages (`import "skill" from "npm:@org/skill-package"`)
- Skill caching to reduce network requests
- Support for custom skill repositories

## Best Practices

1. **Import Early**: Place imports at the top of your `.prose` file
2. **Assign to Agents**: Skills are most effective when assigned to specific agents
3. **Combine with Tools**: Use skills (knowledge) + tools (actions) for best results
4. **Choose Relevant Skills**: Only import skills that are relevant to your agent's task
5. **Check the Repository**: Browse the Anthropic Skills repo to discover new capabilities

## Troubleshooting

### Skill Not Found

```
[WARN] Skill not found or not loaded: pdf
```

**Solution**: Verify the skill exists in the repository at:
https://github.com/anthropics/skills/tree/main/skills/[skill-name]/SKILL.md

### Import Failed

```
[ERROR] Failed to import skill 'pdf': fetch failed
```

**Solution**: Check your internet connection and verify the repository is accessible

### Skill Not Applied

If the AI doesn't seem to have the skill knowledge:
1. Verify the skill is listed in the agent's `skills` array
2. Check the logs for "Loaded skill content for: [name]"
3. Ensure the session uses the agent with skills assigned

## Resources

- **Anthropic Skills Repository**: https://github.com/anthropics/skills
- **OpenProse Imports**: See `plugin/examples/11-skills-and-imports.prose`
- **Implementation**: `plugin/src/runtime/interpreter.ts` (loadAnthropicSkill method)
