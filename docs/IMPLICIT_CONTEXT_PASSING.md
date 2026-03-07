# Implicit Context Passing

**Status**: ✅ Implemented (v2.1.0)

## Overview

OpenProse automatically passes context between consecutive session statements, allowing later sessions to "remember" what happened in earlier sessions without explicit wiring.

## How It Works

When executing a session statement, the interpreter:

1. **Checks for explicit context**: If the session has a `context: {...}` property, it uses that (explicit wins)
2. **Auto-builds context**: If no explicit context, it automatically includes:
   - The last 5 session outputs (to avoid token explosion)
   - All current variables
   - Execution metadata

This context is formatted as "Previous Conversation History" in the prompt sent to the LLM.

## Example

### Before (Explicit Context Required)

```prose
# Old way: had to manually wire context
let research = session "Research AI agents"
session context: {research: research} "Summarize the research"
```

### After (Implicit Context)

```prose
# New way: automatic context passing
session "Research AI agents"
session "Summarize the research"  # Automatically sees the previous session
```

## Practical Examples

### Multi-Step Workflow

```prose
# Step 1: Gather information
session "Research the top 3 programming languages in 2024"

# Step 2: Analyze (automatically sees step 1)
session "Based on the research, which language is best for web development?"

# Step 3: Recommend (automatically sees steps 1 and 2)
session "Create a learning roadmap for the recommended language"
```

### Iterative Refinement

```prose
# Initial draft
session "Write a product description for a smartwatch"

# Review and improve (sees the draft)
session "Is the description compelling? If not, suggest improvements"

# Final version (sees both previous sessions)
session "Rewrite the description incorporating the improvements"
```

## Configuration

### History Limit

By default, only the **last 5 sessions** are included in the context to prevent token explosion. This limit is hardcoded in `interpreter.ts`:

```typescript
const maxHistoryItems = 5; // Keep last 5 sessions
```

To change this, modify the `buildSessionSpec()` method in `plugin/src/runtime/interpreter.ts`.

### Disabling Implicit Context

If you want a session to **not** see previous sessions, explicitly set an empty context:

```prose
session "First task"
session context: {} "Second task - won't see the first"
```

Or use variables only:

```prose
let data = "some data"
session context: {data: data} "Task with only specific context"
```

## Implementation Details

### Context Structure

The auto-built context includes:

```typescript
{
  variables: {
    conversation_turn_1: "Output from session 1",
    conversation_turn_2: "Output from session 2",
    // ... up to last 5 sessions
    myVariable: "value",  // User-defined variables
    // ...
  },
  metadata: {
    timestamp: 1234567890,
    executionPath: ["main", "block1"]
  }
}
```

### Prompt Formatting

In the OpenRouter client, conversation history is formatted separately from variables:

```
[User's Prompt]

## Previous Conversation History

**Turn 1:**
[Session 1 output]

**Turn 2:**
[Session 2 output]

## Available Variables

### myVariable
[Variable value]
```

## Benefits

1. **Natural Workflow**: Matches how humans think about conversations
2. **Less Boilerplate**: No need to manually wire every session
3. **Backward Compatible**: Explicit `context:` still works and takes precedence
4. **Token Efficient**: Only includes recent history (last 5 sessions)

## Trade-offs

### Pros
- More intuitive for multi-step workflows
- Reduces code verbosity
- Matches user expectations from chat interfaces

### Cons
- Increased token usage (though limited to 5 sessions)
- Less explicit about what data flows where
- Can be surprising if user expects isolated sessions

## Related Features

- **String Interpolation**: Use `{variable}` to include specific values in prompts
- **Explicit Context**: Use `context: {key: value}` for precise control
- **Context Enrichment**: Discretion conditions also receive execution context

## Testing

See test file: `unit-test/test-implicit-context.prose`

```prose
# First session establishes facts
session "I'm thinking of a number. It's 42. And my favorite color is blue."

# Second session can reference the first without explicit wiring
session "What was the number and color I mentioned? Answer: 'Number: X, Color: Y'"

# Output: "Number: 42, Color: Blue" ✅
```

## Version History

- **v2.1.0**: Implicit context passing implemented
- **v2.0.0**: Manual context passing only
