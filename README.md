# OpenProse

**A Domain-Specific Language (DSL) for orchestrating AI agent sessions**

OpenProse is a powerful and expressive DSL designed to simplify the orchestration of AI agent workflows. Write clean, declarative code to chain AI sessions, manage context, and build complex intelligent applications.

## 📖 Overview

OpenProse provides a simple yet powerful syntax for:

- **AI Session Orchestration**: Chain multiple AI agent sessions together
- **Context Management**: Pass data and context between sessions seamlessly
- **Variable Handling**: Manage state with `let` (mutable) and `const` (immutable) variables
- **String Interpolation**: Embed variables directly in your prompts
- **Pipeline Operations**: Map, filter, and reduce data through AI processing
- **Control Flow**: Conditional execution and advanced flow control
- **Tool Integration**: Call external tools and integrate with NPX skills

### Key Features

✅ **100% Complete** - All core features implemented  
✅ **TypeScript Runtime** - Fast, reliable execution engine  
✅ **CLI Tools** - Validate, compile, and run programs  
✅ **Rich Documentation** - Comprehensive guides and references  

## 🚀 Installation

### Prerequisites

- **Node.js** >= 18.0.0
- **Bun** >= 1.0.0 (recommended for best performance)

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/your-org/open-prose.git
cd open-prose/plugin

# Install dependencies
bun install

# Verify installation
bun run bin/open-prose.ts --version
```

### Alternative: Using npm

```bash
npm install open-prose
```

## 💡 Usage

### Basic Example

Create your first OpenProse program (`hello.prose`):

```prose
let name = "World"
let greeting = session "Say hello to {name}"
```

Run it:

```bash
bun run bin/open-prose.ts run hello.prose
```

**Output:**
```
============================================================
Executing: hello.prose
============================================================

[INFO] Starting program execution
[INFO] Executing session: Say hello to World
[INFO] Execution completed successfully in 104ms

============================================================
Execution Results
============================================================

✓ Execution completed successfully

Variables:
  name = "World"
  greeting = {
    "output": "[AI response here]",
    "metadata": { "model": "sonnet", "duration": 102 }
  }

Metadata:
  Duration: 104ms
  Sessions created: 1
  Statements executed: 2
```

### CLI Commands

OpenProse provides several CLI commands:

```bash
# Validate syntax without execution
bun run bin/open-prose.ts validate program.prose

# Compile and view normalized output
bun run bin/open-prose.ts compile program.prose

# Execute a program
bun run bin/open-prose.ts run program.prose
```

### Advanced Features

#### Context Passing

Pass context to sessions for more informed AI responses:

```prose
let data = "important information"
let result = session "Process this data"
  context: data

# Multiple variables
let x = 1
let y = 2
let result = session "Calculate with x and y"
  context: { x, y }
```

#### Arrays and Objects

```prose
let items = ["apple", "banana", "cherry"]
let config = {
  apiKey: "your-key",
  timeout: 5000,
  retries: 3
}
```

#### String Interpolation

```prose
let topic = "artificial intelligence"
let research = session "Research {topic} and provide a summary"
```

## 🛠️ Programmatic API

Use OpenProse directly in your TypeScript/JavaScript code:

```typescript
import { parse, execute } from 'open-prose';

const source = `
  let x = "test"
  let result = session "Process {x}"
`;

// Parse the source code
const parseResult = parse(source);

// Execute the program
const result = await execute(parseResult.program);

console.log(result.outputs.get('x')); // "test"
console.log(result.success); // true
```

## 📚 Documentation

Explore our comprehensive documentation:

- **[Quick Start Guide](docs/QUICKSTART.md)** - Get started in 5 minutes
- **[Runtime Documentation](docs/RUNTIME_README.md)** - Deep dive into the execution engine
- **[Technical Design](docs/EXECUTION_ENGINE_TECH.md)** - Architecture and implementation details
- **[Built-in Tools](docs/BUILTIN_TOOLS_README.md)** - Available tools and integrations
- **[Quick Reference](docs/QUICK_REFERENCE.md)** - Syntax cheat sheet

## 🧪 Testing

Run the test suite:

```bash
cd plugin

# Run all tests
bun test

# Run specific test file
bun test src/__tests__/runtime.test.ts

# Watch mode
bun test --watch
```

## 🏗️ Architecture

OpenProse consists of several key components:

- **Parser**: Converts `.prose` source code to an Abstract Syntax Tree (AST)
- **Execution Engine**: Runtime that executes the AST and manages state
- **Session Manager**: Handles AI session creation and execution
- **Tool System**: Integrates external tools and NPX skills
- **CLI**: Command-line interface for development and deployment

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/open-prose.git`
3. Install dependencies: `bun install`
4. Create a branch: `git checkout -b feature/amazing-feature`

### Making Changes

1. Write or update tests for your changes
2. Ensure all tests pass: `bun test`
3. Update documentation as needed
4. Commit with clear messages: `git commit -m "Add amazing feature"`

### Submitting Changes

1. Push to your fork: `git push origin feature/amazing-feature`
2. Open a Pull Request with a detailed description

### Code Style

- Follow existing code patterns and conventions
- Write clear, descriptive variable and function names
- Include comments for complex logic
- Ensure TypeScript types are properly defined

### Areas We Need Help

- ✨ New built-in tools and integrations
- 🐛 Bug fixes and edge case handling
- 📝 Documentation improvements
- 🧪 Additional test coverage
- 🎨 VS Code extension enhancements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ using Bun and TypeScript
- Inspired by the need for simpler AI workflow orchestration
- Community contributions and feedback

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/open-prose/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/open-prose/discussions)
- **Documentation**: [docs/](docs/)

---

**Ready to get started?** Check out the [Quick Start Guide](docs/QUICKSTART.md) and begin building with OpenProse! 🚀
