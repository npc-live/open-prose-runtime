---
name: open-prose
description: |
  OpenProse is a domain-specific language for orchestrating multi-step AI agent workflows.
  Write .prose files to define sessions, variables, loops, parallel execution, and more.
  The runtime handles execution — just run `open-prose run <file.prose>`.

  Activate when: the user mentions OpenProse, wants to run a .prose file,
  or wants to automate a multi-step AI workflow.
---

# OpenProse Skill

OpenProse is a DSL for scripting AI agent workflows. You write a `.prose` file describing
the steps; the `open-prose` CLI executes them, handling context passing, tool permissions,
and output display.

## Running a Program

```bash
open-prose run <file.prose>
```

That's it. The runtime:
- Parses and validates the program
- Executes each statement in order
- Spawns `claude` (or another configured provider) for each `session:`
- Passes variables and context between sessions automatically

Other commands:
```bash
open-prose validate <file.prose>   # check syntax without running
open-prose compile <file.prose>    # show compiled form
open-prose install-skills          # install skills into Claude Code globally
open-prose help                    # show all commands
```

## Language Quick Reference

### Agent definition
```prose
agent my_agent:
  provider: "claude-code"   # claude-code | claude | opencode | aider | custom:bin
  model: sonnet             # opus | sonnet | haiku
  tools: ["bash", "read"]
  prompt: "You are a helpful assistant."
```

### Session — run the agent on a task
```prose
let result = session: my_agent
  prompt: "Do something useful"
```

### Variables
```prose
let x = "hello"
const PI = 3.14
x = "world"          # reassign let
```

### String interpolation
```prose
let msg = "Hello {name}, today is {date}"
```

### Ask — prompt user for input at runtime
```prose
ask folder_name: "What folder should I create?"
```

### Parallel execution
```prose
parallel:
  let a = session: agent  prompt: "Task A"
  let b = session: agent  prompt: "Task B"
```

### Repeat N times
```prose
repeat 3:
  session: agent  prompt: "Do the thing again"
```

### For-each loop
```prose
foreach item in items:
  let r = session: agent  prompt: "Process: {item}"
```

### Unbounded loop (AI decides when to stop)
```prose
loop until "the result looks good":
  let draft = session: agent  prompt: "Improve the draft: {draft}"
```

### Conditional
```prose
if "result looks complete":
  session: agent  prompt: "Summarize"
elif "result needs more work":
  session: agent  prompt: "Revise"
else:
  session: agent  prompt: "Start over"
```

### Choice — AI picks the best option
```prose
choice by "which approach is more thorough":
  option "Deep dive":
    session: agent  prompt: "Analyze in depth"
  option "Quick scan":
    session: agent  prompt: "Scan quickly"
```

### Error handling
```prose
try:
  let r = session: agent  prompt: "Risky task"
catch:
  session: agent  prompt: "Handle the failure"
```

### Do block — named reusable block
```prose
do review:
  let r = session: agent  prompt: "Review the code"
```

### Pipeline
```prose
let final = draft -> refine -> polish
```

### Import
```prose
import "other-workflow.prose"
```

## Context Passing Between Sessions

Variables from previous sessions are injected into the next prompt via `{varname}`:

```prose
let facts = session: researcher
  prompt: "Research the topic"

let report = session: writer
  prompt: "Write a report based on: {facts}"
```

The runtime automatically includes session outputs as context in subsequent sessions.

## Writing Good .prose Programs

- **Be specific in prompts** — the agent only knows what you tell it
- **Break complex tasks into steps** — each session should have one clear goal
- **Use `let` to capture outputs** you'll need later
- **Use `ask` for user-provided values** at runtime
- **Start small** — 3-5 sessions before adding loops or parallel blocks

## Examples

The plugin includes ready-to-use examples:
```bash
ls ${CLAUDE_PLUGIN_ROOT}/examples/
```

To run an example:
```bash
open-prose run ${CLAUDE_PLUGIN_ROOT}/examples/test-claude-code-bash.prose
```

## Troubleshooting

**"Unknown provider"** — check `provider:` value in your agent definition.
Valid built-ins: `claude-code`, `claude`, `opencode`, `aider`. For others: `custom:mybinary --flag`.

**Session fails / times out** — default timeout is 5 minutes. Add to `.open-prose.json`:
```json
{ "providers": { "claude-code": { "timeout": 600000 } } }
```

**Override provider config** — create `.open-prose.json` in your project:
```json
{
  "providers": {
    "claude-code": { "bin": "/usr/local/bin/claude" }
  }
}
```

For full language reference, see `prose.md` in this skill's directory.
