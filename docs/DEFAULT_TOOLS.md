# Default Tools

**Status**: ✅ Implemented (v2.1.0)

## Overview

OpenProse automatically provides a set of default tools to all sessions, even without defining an agent. This allows sessions to interact with the file system and execute shell commands out of the box.

## Default Tools

The following 4 tools are available by default:

1. **`read`** - Read files from the file system
2. **`write`** - Write content to files
3. **`edit`** - Edit existing files (find and replace)
4. **`bash`** - Execute shell commands

## Usage

### Without Agent (Default Tools)

```prose
# These sessions automatically have access to default tools
session "Read the file README.md and summarize it"
session "List all .ts files in the src/ directory"
session "Create a new file called output.txt with 'Hello World'"
```

### With Agent (Custom Tools)

```prose
# Agent explicitly specifies tools
agent reviewer:
  model: sonnet
  prompt: "You are a code reviewer"
  tools: ["read", "bash"]  # Only these tools available

session: reviewer "Review the code"
```

### With Agent (All Tools)

```prose
# Agent can include default tools + custom tools
agent analyst:
  model: opus
  tools: ["read", "write", "edit", "bash", "calculate"]

session: analyst "Analyze data and write report"
```

## Tool Capabilities

### 1. `read` Tool

Reads files from the file system.

**Parameters:**
- `path` (string) - Path to the file to read

**Example LLM Usage:**
```json
{
  "name": "read",
  "arguments": {
    "path": "src/index.ts"
  }
}
```

**Returns:**
```json
{
  "success": true,
  "content": "file contents here...",
  "path": "src/index.ts"
}
```

### 2. `write` Tool

Writes content to a file (creates or overwrites).

**Parameters:**
- `path` (string) - Path to the file to write
- `content` (string) - Content to write

**Example LLM Usage:**
```json
{
  "name": "write",
  "arguments": {
    "path": "output.txt",
    "content": "Hello World"
  }
}
```

**Returns:**
```json
{
  "success": true,
  "path": "output.txt"
}
```

### 3. `edit` Tool

Edits a file by finding and replacing text.

**Parameters:**
- `path` (string) - Path to the file to edit
- `find` (string) - Text to find
- `replace` (string) - Text to replace with

**Example LLM Usage:**
```json
{
  "name": "edit",
  "arguments": {
    "path": "config.json",
    "find": "\"debug\": false",
    "replace": "\"debug\": true"
  }
}
```

**Returns:**
```json
{
  "success": true,
  "path": "config.json",
  "replacements": 1
}
```

### 4. `bash` Tool

Executes shell commands.

**Parameters:**
- `command` (string) - Shell command to execute

**Example LLM Usage:**
```json
{
  "name": "bash",
  "arguments": {
    "command": "ls -la src/"
  }
}
```

**Returns (success):**
```json
{
  "success": true,
  "output": "total 24\ndrwxr-xr-x ...",
  "command": "ls -la src/"
}
```

**Returns (failure):**
```json
{
  "success": false,
  "error": "Command failed: ls: src/: No such file or directory",
  "stderr": "ls: src/: No such file or directory\n",
  "command": "ls -la src/"
}
```

## Implementation Details

### Default Tools Logic

In `plugin/src/runtime/interpreter.ts`:

```typescript
const DEFAULT_TOOLS = ['read', 'write', 'edit', 'bash'];

// Determine which tools to enable
if (spec.agent && spec.agent.tools && spec.agent.tools.length > 0) {
  // Agent explicitly specifies tools - use those
  allowedTools = spec.agent.tools;
} else {
  // No agent or no tools specified - use default tools
  allowedTools = DEFAULT_TOOLS;
}
```

### Overriding Default Tools

To disable default tools, define an agent with an empty tools array:

```prose
agent restricted:
  model: sonnet
  prompt: "You cannot use any tools"
  tools: []  # No tools available

session: restricted "Just answer using knowledge"
```

### Adding Custom Tools

Custom tools can be registered in the ToolRegistry and then specified in an agent:

```prose
agent enhanced:
  model: opus
  tools: ["read", "write", "bash", "my_custom_tool"]

session: enhanced "Use custom functionality"
```

## Security Considerations

### File System Access

- The `read` and `write` tools have access to the entire file system
- Be cautious about allowing LLMs to read sensitive files (e.g., `.env`, private keys)
- Consider implementing permission restrictions in production

### Shell Command Execution

- The `bash` tool can execute arbitrary shell commands
- This is powerful but potentially dangerous
- Consider sandboxing or restricting commands in production
- Use agent permissions to limit tool access

### Production Recommendations

For production deployments, consider:

1. **Implement a permission system**:
   ```prose
   agent safe_agent:
     model: sonnet
     tools: ["read", "write"]  # No bash access
     permissions:
       file_read: "allow"
       file_write: "allow"
       bash: "deny"
   ```

2. **Limit file access scope**:
   - Restrict read/write to specific directories
   - Implement path validation in tool implementation

3. **Audit tool calls**:
   - Log all tool invocations
   - Monitor for suspicious patterns
   - Alert on sensitive file access

## Examples

### Example 1: Code Analysis

```prose
# Analyze code structure without defining an agent
session "List all TypeScript files in src/ directory"
session "Read src/index.ts and explain what it does"
session "Find all TODO comments in the codebase"
```

### Example 2: Automated Refactoring

```prose
# Read, analyze, and modify code
session "Read src/utils.ts"
session "Identify functions that should be renamed for clarity"
session "Apply the renames using the edit tool"
```

### Example 3: Documentation Generation

```prose
# Generate documentation from code
session "Read all files in src/ directory"
session "Create API documentation in docs/API.md"
```

## Version History

- **v2.1.0**: Default tools implemented (read, write, edit, bash)
- **v2.0.0**: Tools only available when explicitly specified in agent

## Related Documentation

- [Tools Implementation](../plugin/src/runtime/tools.ts)
- [Agent Definition](AGENT_DEFINITION.md)
- [Permissions](PERMISSIONS.md)
