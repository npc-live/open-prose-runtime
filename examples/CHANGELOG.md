# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Performance optimizations
- Additional built-in tools
- More comprehensive error messages
- Plugin system for custom tools

## [0.1.0] - 2026-03-07

### Added
- **Parser**: Complete `.prose` syntax parser with AST generation
- **Runtime**: Execution engine with environment management
- **CLI Tool**: `validate`, `compile`, and `run` commands
- **String Interpolation**: `{variable}` syntax in prompts
- **Implicit Context Passing**: Automatic context flow between sessions
- **Default Tools**: Built-in `read`, `write`, `edit`, `bash` tools
- **Anthropic Skills Integration**: Import skills from `github:anthropics/skills`
- **OpenRouter Integration**: Real AI model execution via OpenRouter API
- **VSCode Extension**: Syntax highlighting and `.prose` file support
- **Agent System**: Define reusable agents with models, prompts, skills, and tools
- **Import System**: Import skills from GitHub, NPM, and local files
- **Error Handling**: Try-catch blocks with proper error propagation
- **Control Flow**: If-else, loops, parallel execution
- **Pipeline Operations**: Map, filter, reduce with AI processing

### Features

#### Language Features
- Session statements with prompt and context
- Agent definitions with configurable properties
- Let and const bindings for variable management
- String interpolation in prompts and strings
- Object and array literals
- Comments (line and block)

#### Runtime Features
- Multi-round tool calling (up to 50 rounds)
- Automatic conversation history tracking
- Session output capture and display
- Tool registry with extensible architecture
- Mock mode for testing without API calls

#### Tool System
- **read**: Read files from filesystem
- **write**: Create or overwrite files
- **edit**: Find-and-replace text editing
- **bash**: Execute shell commands

#### Skills Integration
- Import from `github:anthropics/skills`
- Markdown-based skill parsing (SKILL.md)
- Automatic skill content injection into system prompts
- Support for multiple skills per agent

#### Developer Experience
- Comprehensive CLI with detailed logging
- Validation with helpful error messages
- Compile-time checking
- Tool call visualization
- Execution time tracking
- Token usage reporting

### Technical Implementation
- TypeScript codebase with full type safety
- Bun runtime for fast execution
- Modular architecture (Parser → Validator → Interpreter)
- Comprehensive test suite
- Well-documented codebase

### Documentation
- Complete README with examples
- Quick Start Guide
- Runtime Documentation
- Execution Engine Technical Design
- Built-in Tools Reference
- Quick Reference Guide
- Anthropic Skills Integration Guide
- Skill Optimization Loop Documentation
- Publishing Strategy Guide

### Examples
- 30+ example programs covering all features
- Real-world use cases (web development, research, documentation)
- Skill optimization loop for testing and improving skills
- String interpolation demonstrations
- Multi-agent workflows

### Known Limitations
- OpenRouter API required for real execution
- Limited to models supported by OpenRouter
- No built-in type system for variables
- VSCode extension has basic features only

### Breaking Changes
None (initial release)

### Security
- No hardcoded API keys
- Environment variable support for secrets
- Safe file operations with error handling
- Sandboxed tool execution

---

## Version History

### Pre-release Development
- 2025-12-29 to 2026-01-01: Initial design and specification
- 2026-01-02 to 2026-03-06: Implementation and testing
- 2026-03-07: Feature complete, documentation added

---

## Upgrade Guide

### From No Version to 0.1.0

This is the first release, no upgrade needed.

### Future Upgrades

Upgrade instructions will be provided with each new version that contains breaking changes.

---

## Compatibility

### Node.js
- **Minimum**: 18.0.0
- **Recommended**: 20.0.0+

### Bun
- **Minimum**: 1.0.0
- **Recommended**: Latest stable

### Operating Systems
- macOS (tested)
- Linux (should work)
- Windows (should work, not extensively tested)

---

## Contributors

Thank you to everyone who contributed to this release!

- Initial development and implementation
- Documentation and examples
- Testing and bug reports

---

## Links

- [GitHub Repository](https://github.com/your-username/open-prose)
- [NPM Package](https://www.npmjs.com/package/open-prose)
- [Documentation](https://your-username.github.io/open-prose/)
- [Issues](https://github.com/your-username/open-prose/issues)
- [Discussions](https://github.com/your-username/open-prose/discussions)
