# Unit Tests

This folder contains all test files for the OpenProse runtime.

## Test Files

### Basic Tests
- `test-simple.prose` - Basic functionality test
- `test-execution.prose` - Execution engine test
- `test-examples.prose` - Example programs
- `test-showcase.prose` - Feature showcase

### String & Interpolation Tests
- `test-string-interpolation.prose` - String interpolation with `{var}` syntax
- `test-simple-interp*.prose` - Simple interpolation tests

### Control Flow Tests
- `test-control-flow.prose` - Complete control flow test
- `test-control-flow-simple.prose` - Simple control flow
- `test-advanced-control-flow.prose` - Advanced control flow (loop, try/catch)

### Block Tests
- `test-named-blocks.prose` - Named blocks with parameters
- `test-block-return.prose` - Block return values
- `test-block-return-simple.prose` - Simple block return test
- `test-block-return-complete.prose` - Complete block return test

### Pipeline Tests
- `test-pipeline.prose` - Basic pipeline test
- `test-pipeline-simple.prose` - Simple map operation
- `test-pipeline-pmap.prose` - Parallel map test
- `test-pipeline-filter.prose` - Filter operation
- `test-pipeline-comprehensive.prose` - Multiple pipeline operations

### Arrow & Chains Tests
- `test-arrow-simple.prose` - Simple arrow chain
- `test-arrow-chains.prose` - Complete arrow chain test
- `test-pipe-chains.prose` - Pipe chain test

### Retry & Error Handling Tests
- `test-retry.prose` - Retry mechanism
- `test-retry-with-error.prose` - Retry with actual errors
- `test-error-handling.prose` - Error handling

### Choice Blocks Tests
- `test-choice-blocks.prose` - AI-driven choice blocks

### Multi-line Strings Tests
- `test-multiline-strings.prose` - Triple-quoted strings

### Context Enrichment Tests
- `test-context-enrichment.prose` - Enriched discretion evaluation

### Tool Tests
- `test-builtin-tools.prose` - Built-in tools (calculate, time, etc.)
- `test-builtin-complete.prose` - Complete built-in tools test
- `test-tools.prose` - Tools integration
- `test-custom-tools.ts` - Custom tools implementation
- `test-tool-tracking.prose` - Tool call tracking
- `test-tool-tracking.ts` - Tool tracking implementation

### Integration Tests
- `test-complete-workflow.prose` - Complete workflow
- `test-openrouter.prose` - OpenRouter integration
- `test-openrouter-fixed.prose` - Fixed OpenRouter test
- `test-multi-round.prose` - Multi-round session
- `test-display.prose` - Display functionality

### Agent & Skills Tests
- `test-permissions.prose` - Permission system
- `test-import-skills.prose` - Skills import
- `test-skills-vs-tools.prose` - Skills vs Tools comparison
- `test-shell-simple.prose` - Shell skills
- `test-shell-and-skills.prose` - Shell and skills integration

### Frontend Tests
- `test-frontend-design.prose` - Frontend design
- `test-frontend-design-v2.prose` - Frontend design v2
- `test-frontend-design-final.prose` - Frontend design final

### Syntax Tests
- `test-syntax-check.prose` - Syntax validation

### Other Tests
- `test-final.prose` - Final integration test

## Running Tests

```bash
# Run a single test
bun run plugin/bin/open-prose.ts run unit-test/test-simple.prose

# Run all tests (if you have a test runner)
bun test

# Run with debug logging
DEBUG=* bun run plugin/bin/open-prose.ts run unit-test/test-control-flow.prose
```

## Test Categories

| Category | Tests | Status |
|----------|-------|--------|
| Basic Functionality | 4 | ✅ |
| String Interpolation | 3 | ✅ |
| Control Flow | 3 | ✅ |
| Blocks & Functions | 4 | ✅ |
| Pipelines | 5 | ✅ |
| Chains | 3 | ✅ |
| Error Handling | 3 | ✅ |
| Choice Blocks | 1 | ✅ |
| Multi-line Strings | 1 | ✅ |
| Context Enrichment | 1 | ✅ |
| Tools | 6 | ✅ |
| Integration | 6 | ✅ |
| Skills | 4 | ✅ |
| Frontend | 3 | ✅ |
| Syntax | 1 | ✅ |

**Total**: ~50 test files

## Test Coverage

- ✅ Basic syntax and execution
- ✅ String interpolation
- ✅ Control flow (if/loop/for/repeat)
- ✅ Error handling (try/catch/finally)
- ✅ Blocks and return values
- ✅ Pipeline operations (map/filter/reduce/pmap)
- ✅ Arrow chains
- ✅ Choice blocks (AI decision)
- ✅ Multi-line strings
- ✅ Context enrichment
- ✅ Built-in tools
- ✅ Custom tools
- ✅ Skills integration
- ✅ Parallel execution
- ✅ Retry mechanism
- ✅ OpenRouter integration
