# Claude Code Provider for OpenProse

## Overview

The Claude Code Provider allows OpenProse agents to use local Claude Code as their AI backend, instead of remote API services like OpenRouter. This gives you:

- **Superior tool calling**: Claude's native tool use capabilities
- **Local execution**: Use your own Anthropic API key
- **Full Claude Code tools**: Access to bash, read, write, edit, and more
- **Privacy**: Sensitive code stays local

## Installation

Make sure you have Claude Code installed and configured:

```bash
# Verify Claude Code is available
claude --version
```

## Usage

### Basic Example

Create a `.prose` file with an agent using the `claude-code` provider:

```prose
# example.prose

agent my_agent:
  provider: "claude-code"
  model: sonnet
  tools: ["bash", "read", "write"]
  prompt: "You are a helpful coding assistant."

let result = session: my_agent
  prompt: "List all .ts files in the current directory"
```

Run it:

```bash
cd plugin
bun run bin/open-prose.ts run example.prose
```

### Agent Configuration

```prose
agent <name>:
  provider: "claude-code"      # Use local Claude Code
  model: sonnet                # or "opus" or "haiku"
  tools: ["bash", "read", ...]  # Tools available to the agent
  prompt: "System prompt..."    # Optional: agent-specific instructions
```

### Supported Properties

| Property   | Type   | Description                           | Default      |
|-----------|--------|---------------------------------------|--------------|
| provider  | string | AI provider: "claude-code" or "openrouter" | "openrouter" |
| model     | string | Model tier: "opus", "sonnet", "haiku" | "sonnet"     |
| tools     | array  | List of tool names                    | []           |
| prompt    | string | System prompt for the agent           | undefined    |

### Available Tools

When using `claude-code` provider, these tools are available:

- **bash**: Execute shell commands
- **read**: Read file contents
- **write**: Write new files
- **edit**: Edit existing files
- **glob**: Find files by pattern
- **grep**: Search file contents

## Examples

### Example 1: Shell Operations

```prose
agent shell_agent:
  provider: "claude-code"
  tools: ["bash"]
  prompt: "You are a shell expert."

let result = session: shell_agent
  prompt: "Echo 'Hello from Claude Code'"
```

### Example 2: File Operations

```prose
agent file_agent:
  provider: "claude-code"
  tools: ["read", "write", "edit"]
  prompt: "You are a file management assistant."

let files = session: file_agent
  prompt: "Read README.md and create a summary in SUMMARY.md"
```

### Example 3: Code Analysis

```prose
agent code_analyst:
  provider: "claude-code"
  tools: ["read", "glob", "grep"]
  prompt: "You are a code reviewer."

let analysis = session: code_analyst
  prompt: "Find all TypeScript files and check for TODO comments"
```

## How It Works

1. **OpenProse** reads your `.prose` file and identifies agents with `provider: "claude-code"`
2. **Provider Selection**: When a session is created, OpenProse routes to Claude Code Provider
3. **Claude Code Invocation**: The provider spawns Claude Code CLI as a subprocess
4. **Prompt Building**: Combines your prompt, context, and tool instructions
5. **Execution**: Claude Code executes with access to specified tools
6. **Result Parsing**: Output is returned to OpenProse and stored in variables

## Architecture

```
┌─────────────────────────────────────────┐
│  OpenProse Runtime                      │
│  - Parses .prose file                   │
│  - Manages variables and control flow   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Claude Code Provider                   │
│  - Builds prompt with context           │
│  - Spawns claude CLI subprocess         │
│  - Parses tool usage from output        │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Claude Code (Local)                    │
│  - Uses Anthropic API                   │
│  - Executes tools (bash, read, etc.)    │
│  - Returns results                      │
└─────────────────────────────────────────┘
```

## Comparison: OpenRouter vs Claude Code

| Feature           | OpenRouter          | Claude Code         |
|-------------------|---------------------|---------------------|
| **Backend**       | Remote API (Qwen)   | Local CLI (Claude)  |
| **Tool Quality**  | Good                | Excellent           |
| **Cost**          | OpenRouter credits  | Anthropic API usage |
| **Privacy**       | Data sent to cloud  | Local processing    |
| **Speed**         | Network dependent   | Local + API calls   |
| **Setup**         | API key only        | Claude Code install |

## Configuration

### Environment Variables

Claude Code Provider uses your Claude Code configuration automatically. Make sure your `~/.claude/config.json` is set up:

```json
{
  "apiKey": "your-anthropic-api-key"
}
```

### Custom Claude Code Path

If `claude` is not in your PATH, specify it when creating the provider:

```typescript
import { createClaudeCodeProvider } from 'open-prose';

const provider = createClaudeCodeProvider('/custom/path/to/claude');
```

## Troubleshooting

### Error: "Failed to spawn Claude Code"

- Verify Claude Code is installed: `which claude`
- Check it's executable: `claude --version`
- Ensure it's in your PATH

### Error: "Claude Code execution timed out"

- Default timeout is 5 minutes
- Complex tasks may need more time
- Consider breaking into smaller sessions

### Tool calls not working

- Verify tools are listed in agent definition: `tools: ["bash"]`
- Check Claude Code has permissions for the requested operations
- Review Claude Code logs for tool execution errors

## Best Practices

1. **Start Simple**: Test with basic prompts before complex workflows
2. **Explicit Tools**: Only enable tools the agent needs
3. **Clear Prompts**: Give specific instructions about what to accomplish
4. **Error Handling**: Use try/catch blocks for robust workflows
5. **Timeouts**: Set reasonable expectations for long-running tasks

## Future Enhancements

Planned improvements:

- [ ] Streaming output support
- [ ] Custom tool definitions
- [ ] Multi-turn conversation state
- [ ] Token usage tracking
- [ ] Performance metrics

## Support

For issues or questions:

- GitHub Issues: https://github.com/your-org/open-prose/issues
- Claude Code docs: https://docs.anthropic.com/claude-code

---

**Happy coding with OpenProse + Claude Code!** 🚀
