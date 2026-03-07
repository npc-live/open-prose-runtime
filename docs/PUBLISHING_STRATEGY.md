# OpenProse 发布策略

## 📦 项目概览

OpenProse 是一个包含多个组件的项目：
- **plugin** - 核心语言实现（Parser + Runtime + CLI）
- **vscode-extension** - VSCode 扩展
- **api** - API 服务（可选）
- **landing** - 官方网站
- **docs** - 完整文档

## 🎯 推荐发布策略

### 方案 1: 简化发布（推荐用于早期阶段）

**适用于**: 0.x 版本，快速迭代期

```
open-prose (单一 NPM 包)
├── 包含: Parser + Runtime + CLI
├── 发布到: npm
└── VSCode 扩展单独发布到 VSCode Marketplace
```

**优点**:
- 简单易维护
- 用户安装方便
- 快速发布迭代

**缺点**:
- 无法分别版本控制各组件
- 包体积较大

### 方案 2: Monorepo 发布（推荐用于 1.0+ 版本）

**适用于**: 成熟期，多团队协作

```
@open-prose/core       - 核心 Parser + AST
@open-prose/runtime    - 运行时引擎
@open-prose/cli        - CLI 工具（依赖 core + runtime）
@open-prose/vscode     - VSCode 扩展
@open-prose/api        - API 服务器（可选）
```

**优点**:
- 模块化，各组件独立版本
- 用户可以只安装需要的部分
- 更专业的架构

**缺点**:
- 复杂度增加
- 需要 monorepo 工具（Lerna/Turborepo）

## 📋 当前建议：采用方案 1

基于当前状态（0.1.0 版本），建议采用**简化发布策略**。

### 第一阶段：准备发布

#### 1. 完善 package.json

```json
{
  "name": "open-prose",
  "version": "0.1.0",
  "description": "A Domain-Specific Language for orchestrating AI agent sessions",
  "keywords": [
    "dsl",
    "ai",
    "agents",
    "orchestration",
    "automation",
    "llm",
    "workflow"
  ],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/open-prose.git"
  },
  "bugs": {
    "url": "https://github.com/your-username/open-prose/issues"
  },
  "homepage": "https://github.com/your-username/open-prose#readme",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "open-prose": "dist/bin/open-prose.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc && chmod +x dist/bin/open-prose.js",
    "prepublishOnly": "npm run build && npm test",
    "test": "jest",
    "lint": "tsc --noEmit"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "dotenv": "^17.3.1"
  },
  "devDependencies": {
    "@types/jest": "^29.5.11",
    "@types/node": "^20.10.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "typescript": "^5.3.0"
  }
}
```

#### 2. 创建 .npmignore

```
# Source files
src/
__tests__/

# Development files
*.test.ts
*.spec.ts
tsconfig.json
jest.config.js

# Examples and docs (可选，如果想包含就去掉)
examples/
unit-test/
docs/

# Build artifacts
*.tsbuildinfo
.DS_Store
node_modules/

# IDE
.vscode/
.idea/
```

#### 3. 添加 LICENSE 文件

```
MIT License

Copyright (c) 2026 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

#### 4. 完善 README.md

确保包含：
- ✅ 清晰的项目介绍
- ✅ 安装说明
- ✅ 快速开始示例
- ✅ 链接到完整文档
- ✅ 贡献指南
- ✅ License 信息

#### 5. 创建 CHANGELOG.md

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-03-07

### Added
- Initial release
- Parser for .prose files
- Runtime execution engine
- CLI tool (validate, compile, run)
- String interpolation support
- Implicit context passing
- Default tools (read, write, edit, bash)
- Anthropic Skills integration
- VSCode extension with syntax highlighting

### Features
- Session orchestration
- Agent definitions
- Context management
- Tool integration
- Error handling
- Import system
```

### 第二阶段：NPM 发布

#### 准备工作

```bash
cd plugin

# 1. 确保所有依赖已安装
bun install

# 2. 运行测试
bun test

# 3. 构建项目
bun run build

# 4. 本地测试包
npm pack
# 会生成 open-prose-0.1.0.tgz

# 5. 在另一个目录测试安装
cd /tmp
npm install /path/to/open-prose-0.1.0.tgz
npx open-prose --version
```

#### NPM 发布步骤

```bash
# 1. 登录 NPM（首次）
npm login

# 2. 检查将要发布的文件
npm publish --dry-run

# 3. 正式发布
npm publish

# 如果包名已被占用，可以使用 scoped package
npm publish --access public
```

#### 使用 Scoped Package（推荐）

如果 `open-prose` 名称被占用：

```json
{
  "name": "@your-username/open-prose",
  "version": "0.1.0"
}
```

发布：
```bash
npm publish --access public
```

### 第三阶段：VSCode 扩展发布

#### 准备 VSCode 扩展

```bash
cd vscode-extension

# 1. 安装 vsce
npm install -g @vscode/vsce

# 2. 更新 package.json
# 确保包含 publisher、version、repository 等字段

# 3. 创建图标（可选）
# icon.png - 128x128 PNG

# 4. 打包扩展
vsce package
# 生成 open-prose-0.1.0.vsix

# 5. 本地测试
code --install-extension open-prose-0.1.0.vsix
```

#### 发布到 VSCode Marketplace

```bash
# 1. 创建 Azure DevOps 账号（如果没有）
# https://dev.azure.com/

# 2. 创建 Personal Access Token
# https://dev.azure.com/ → User Settings → Personal Access Tokens

# 3. 登录
vsce login your-publisher-name

# 4. 发布
vsce publish
```

### 第四阶段：文档网站

#### 使用 GitHub Pages

```bash
# 创建 docs 分支或使用 main/docs 目录

# 1. 创建简单的文档网站
mkdir -p docs-site
cd docs-site

# 复制所有 markdown 文档
cp -r ../docs/*.md ./

# 2. 创建 index.html（可以使用 GitHub Pages 主题）
# 或者使用 docsify/vuepress/docusaurus

# 3. 推送到 GitHub
git add .
git commit -m "Add documentation site"
git push origin main

# 4. 在 GitHub 仓库设置中启用 GitHub Pages
# Settings → Pages → Source: main/docs
```

#### 使用 Docsify（推荐）

```bash
# 1. 安装 docsify-cli
npm install -g docsify-cli

# 2. 初始化
docsify init ./docs-site

# 3. 创建文档结构
docs-site/
├── index.html
├── README.md
├── _sidebar.md
├── guide/
│   ├── quickstart.md
│   ├── installation.md
│   └── examples.md
└── api/
    ├── parser.md
    └── runtime.md

# 4. 本地预览
docsify serve docs-site

# 5. 部署到 GitHub Pages
# 提交到 gh-pages 分支
```

### 第五阶段：持续发布

#### 语义化版本

遵循 [Semver](https://semver.org/):
- **0.x.y** - 初期开发，API 可能变化
- **1.0.0** - 第一个稳定版本
- **1.x.0** - 新功能（向后兼容）
- **1.0.x** - Bug 修复
- **2.0.0** - Breaking changes

#### Git 工作流

```bash
# 1. 创建发布分支
git checkout -b release/v0.2.0

# 2. 更新版本号
cd plugin
npm version 0.2.0

# 3. 更新 CHANGELOG.md
# 添加新版本的变更记录

# 4. 提交更改
git add .
git commit -m "chore: bump version to 0.2.0"

# 5. 合并到 main
git checkout main
git merge release/v0.2.0

# 6. 创建 tag
git tag -a v0.2.0 -m "Release v0.2.0"

# 7. 推送
git push origin main --tags

# 8. 发布到 NPM
cd plugin
npm publish
```

#### 自动化发布（GitHub Actions）

创建 `.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        working-directory: plugin
        run: bun install

      - name: Run tests
        working-directory: plugin
        run: bun test

      - name: Build
        working-directory: plugin
        run: bun run build

      - name: Publish to NPM
        working-directory: plugin
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 📊 发布清单

### 发布前检查

- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] CHANGELOG.md 已更新
- [ ] README.md 准确无误
- [ ] package.json 信息完整
- [ ] LICENSE 文件存在
- [ ] 版本号符合语义化规范
- [ ] .npmignore 配置正确
- [ ] 构建成功（npm run build）
- [ ] 本地测试包安装正常

### 发布后验证

- [ ] NPM 包可以正常安装
  ```bash
  npm install open-prose
  npx open-prose --version
  ```
- [ ] VSCode 扩展可以安装
- [ ] 文档网站可以访问
- [ ] GitHub Release 创建成功
- [ ] 版本标签已推送

## 🎯 里程碑规划

### v0.1.0 (当前) - MVP
- ✅ 核心功能完成
- ✅ CLI 工具可用
- ✅ VSCode 扩展基础功能
- 🎯 发布到 NPM
- 🎯 基础文档完善

### v0.2.0 - 功能增强
- 性能优化
- 错误提示改进
- 更多内置工具
- 更多示例

### v0.5.0 - 社区就绪
- 完整测试覆盖
- 详细 API 文档
- 贡献指南
- 示例项目

### v1.0.0 - 生产就绪
- API 稳定
- 完整文档
- 性能优化
- 安全审计

## 🔧 工具推荐

### 包管理
- **changesets** - 管理 monorepo 版本和发布
- **semantic-release** - 自动化语义化版本发布

### 文档
- **Docsify** - 简单快速的文档网站
- **VuePress** - Vue 驱动的静态网站生成器
- **Docusaurus** - React 驱动的文档网站

### CI/CD
- **GitHub Actions** - 自动化测试和发布
- **CircleCI** - 专业 CI/CD 服务
- **Travis CI** - 开源项目免费

### 质量保障
- **Codecov** - 代码覆盖率报告
- **Snyk** - 安全漏洞扫描
- **ESLint** - 代码质量检查

## 📞 发布支持

### 常见问题

**Q: 包名被占用怎么办？**
A: 使用 scoped package: `@your-username/open-prose`

**Q: 如何撤回已发布的版本？**
A:
```bash
npm unpublish open-prose@0.1.0  # 发布后24小时内
npm deprecate open-prose@0.1.0 "请使用 0.1.1 版本"  # 24小时后
```

**Q: 如何处理 Breaking Changes？**
A:
1. 在 CHANGELOG 中明确说明
2. 增加主版本号（1.0.0 → 2.0.0）
3. 提供迁移指南

**Q: 如何收集用户反馈？**
A:
1. GitHub Issues
2. GitHub Discussions
3. Discord/Slack 社区
4. NPM 包统计分析

## 🚀 下一步行动

### 立即执行
1. ✅ 完善 plugin/package.json
2. ✅ 添加 LICENSE 文件
3. ✅ 创建 .npmignore
4. ✅ 完善 CHANGELOG.md
5. 🔄 运行测试并修复问题
6. 🔄 构建并本地测试

### 一周内
1. 发布到 NPM（测试版 0.1.0-beta.1）
2. 发布 VSCode 扩展（预览版）
3. 部署文档网站

### 一个月内
1. 收集用户反馈
2. 修复 bug
3. 发布 0.2.0 版本
4. 完善文档和示例

---

**需要帮助？** 查看 [贡献指南](CONTRIBUTING.md) 或在 [GitHub Discussions](https://github.com/your-username/open-prose/discussions) 提问。
