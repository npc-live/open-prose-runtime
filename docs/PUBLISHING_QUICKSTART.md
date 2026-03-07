# OpenProse 发布快速指南

## 🚀 快速发布（30分钟搞定）

### 第一步：准备工作（5分钟）

```bash
# 1. 确保在项目根目录
cd /Users/qing/projects/open-prose

# 2. 运行预发布检查
bash scripts/pre-publish-check.sh

# 3. 如果有问题，根据提示修复
```

### 第二步：更新信息（5分钟）

编辑 `plugin/package.json`:

```json
{
  "name": "open-prose",
  "version": "0.1.0",
  "description": "A Domain-Specific Language for orchestrating AI agent sessions",
  "keywords": ["dsl", "ai", "agents", "orchestration", "llm"],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/open-prose.git"
  },
  "homepage": "https://github.com/your-username/open-prose"
}
```

### 第三步：NPM 发布（10分钟）

```bash
cd plugin

# 1. 登录 NPM（首次）
npm login
# 输入用户名、密码、邮箱

# 2. 测试打包
npm pack
# 生成 open-prose-0.1.0.tgz

# 3. 测试安装
cd /tmp
npm install /path/to/open-prose/plugin/open-prose-0.1.0.tgz
npx open-prose --version
# 如果正常就继续

# 4. 返回项目
cd /path/to/open-prose/plugin

# 5. 正式发布（试运行）
npm publish --dry-run
# 检查将要发布的文件列表

# 6. 正式发布
npm publish

# 搞定！
```

### 第四步：GitHub Release（5分钟）

```bash
# 1. 提交所有更改
git add .
git commit -m "chore: prepare for v0.1.0 release"

# 2. 创建标签
git tag -a v0.1.0 -m "Release v0.1.0"

# 3. 推送到 GitHub
git push origin main --tags

# 4. 在 GitHub 上创建 Release
# 访问: https://github.com/your-username/open-prose/releases/new
# - 选择 tag: v0.1.0
# - 标题: v0.1.0 - Initial Release
# - 描述: 复制 CHANGELOG.md 的内容
# - 点击 "Publish release"
```

### 第五步：验证（5分钟）

```bash
# 1. 验证 NPM 安装
npm install -g open-prose
open-prose --version

# 2. 运行示例
cd /tmp
mkdir test-open-prose
cd test-open-prose

echo 'let name = "World"
session "Say hello to {name}"' > hello.prose

open-prose run hello.prose

# 3. 检查 NPM 页面
# https://www.npmjs.com/package/open-prose
```

## 📋 简化的检查清单

### 发布前

- [ ] README.md 准确
- [ ] LICENSE 文件存在
- [ ] CHANGELOG.md 更新
- [ ] package.json 信息完整
- [ ] 所有测试通过
- [ ] 代码已提交到 Git

### 发布后

- [ ] NPM 包可安装 (`npm install open-prose`)
- [ ] CLI 工具可用 (`npx open-prose --version`)
- [ ] GitHub Release 已创建
- [ ] 文档链接正确

## ⚠️ 常见问题

### 包名被占用

如果 `open-prose` 已被使用：

```json
{
  "name": "@your-username/open-prose"
}
```

发布时：
```bash
npm publish --access public
```

### 权限错误

```bash
# 确保已登录
npm whoami

# 如果没有登录
npm login
```

### 发布失败

```bash
# 查看详细错误
npm publish --loglevel verbose

# 常见原因：
# 1. 版本号已存在 - 更新 version
# 2. 未登录 - npm login
# 3. 包名冲突 - 使用 scoped package
```

### 撤回发布

```bash
# 发布后 24 小时内可以撤回
npm unpublish open-prose@0.1.0

# 24 小时后只能标记为废弃
npm deprecate open-prose@0.1.0 "Please use 0.1.1 instead"
```

## 🎯 发布后的工作

### 1. 宣传

- [ ] 在 GitHub 添加话题标签
- [ ] 在 Twitter/X 发布
- [ ] 在 Reddit r/programming 发布
- [ ] 在 Hacker News 发布

### 2. 文档

- [ ] 创建 GitHub Pages 网站
- [ ] 添加更多示例
- [ ] 录制视频教程

### 3. 社区

- [ ] 创建 Discord 服务器
- [ ] 设置 GitHub Discussions
- [ ] 回复 Issues 和 PRs

## 📞 需要帮助？

- 📖 完整文档: [docs/PUBLISHING_STRATEGY.md](docs/PUBLISHING_STRATEGY.md)
- 💬 GitHub Discussions: 提问和讨论
- 🐛 GitHub Issues: 报告问题

---

**祝发布顺利！🎉**
