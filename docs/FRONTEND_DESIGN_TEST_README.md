# Frontend Design Test Files 🎨

测试 OpenProse 的 frontend-design skill 并验证生成的网页。

## 📁 文件说明

### 1. 测试文件

#### `test-frontend-design-final.prose` ⭐ 推荐
**最完整的测试版本**，包含完整的验证流程。

**功能**:
- ✅ 导入 `frontend_design` skill
- ✅ 生成 prose.md 风格的网页
- ✅ 验证所有必需元素（head, logo, nav, footer）
- ✅ 检查配色方案（简单、干净）
- ✅ 生成详细的测试报告

**运行**:
```bash
bun run plugin/bin/open-prose.ts run test-frontend-design-final.prose
```

#### `test-frontend-design-v2.prose`
使用内置工具的版本（不需要导入外部 skill）。

**运行**:
```bash
bun run plugin/bin/open-prose.ts run test-frontend-design-v2.prose
```

#### `test-frontend-design.prose`
使用外部 URL 导入 skill 的版本（需要 skills.sh 服务）。

---

### 2. Skill 定义

#### `skills/frontend-design.json`
自定义的 `frontend_design` 工具定义。

**功能**:
- 生成完整的 HTML + CSS
- Prose.md 风格设计
- 响应式布局
- 生产就绪

**参数**:
```json
{
  "style": "prose-style",
  "requirements": "Design requirements",
  "elements": ["head", "logo", "nav", "footer"]
}
```

---

### 3. 生成的网页

#### `generated-website.html`
测试生成的实际网页，可以直接在浏览器中打开查看。

**特点**:
- ✅ Light background (#fafbfc)
- ✅ Dark text (#1f2937)
- ✅ Purple accent (#8b5cf6)
- ✅ Responsive design
- ✅ Mobile-friendly

**预览**:
```bash
open generated-website.html
# 或
python3 -m http.server 8000
# 然后访问 http://localhost:8000/generated-website.html
```

---

## 🎯 测试要求

所有测试文件都验证以下要求：

### 必需元素 ✅
1. **`<head>`** - 包含 meta tags 和 title
2. **Logo** - 在 header 中显示（文字或图片）
3. **`<nav>`** - 导航菜单，至少 4 个链接
4. **`<footer>`** - 页脚，包含版权信息

### 设计风格 ✅
参考 https://prose.md/

1. **简单配色**
   - 背景：白色或浅灰 (#ffffff, #fafbfc)
   - 文字：深灰或黑色 (#1f2937, #111827)
   - 强调色：单一颜色（紫色 #8b5cf6 或蓝色）
   - 总共 ≤3 种主要颜色

2. **Minimal 美学**
   - 大量留白
   - 简洁排版
   - 圆角元素 (border-radius: 8px)
   - 细微阴影 (box-shadow)

3. **现代设计**
   - 系统字体 (system-ui, sans-serif)
   - 响应式布局
   - Hover 效果
   - 平滑过渡

---

## 📊 测试结果

运行 `test-frontend-design-final.prose` 后的输出：

```
━━━━━━━━━━━━━━━
TEST SUMMARY
━━━━━━━━━━━━━━━
✅ <head> section
✅ Logo
✅ <nav> links
✅ <footer>
✅ Simple colors (prose.md style)

RESULT: PASS ✅
━━━━━━━━━━━━━━━
```

### 详细验证报告

```
FRONTEND DESIGN TEST REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REQUIRED ELEMENTS:
1. <head> section: ✅ YES
2. Logo in header: ✅ YES ("OpenProse")
3. <nav> element: ✅ YES (Home, Features, Docs, GitHub)
4. <footer> element: ✅ YES

COLOR SCHEME:
✅ PASS (simple, prose-style)
- Background: #fafbfc (light gray)
- Text: #1f2937 (dark gray)
- Accent: #8b5cf6 (purple)
- Palette: 3 colors total

OVERALL RESULT:
[X] All 4 required elements present
[X] Color scheme is simple (like prose.md)
[X] Design is minimal and clean

STATUS: ✅ PASSED

Website meets all requirements! 🎉
```

---

## 🛠️ 自定义测试

### 修改 Skill 定义

编辑 `skills/frontend-design.json` 来改变默认设计：

```json
{
  "name": "frontend_design",
  "description": "Your description",
  "parameters": { ... },
  "handler": "async (args) => { ... }"
}
```

### 添加额外验证

在 `.prose` 文件中添加更多检查：

```prose
# 检查响应式设计
let check_responsive = session: validator
  prompt: "Check if the HTML has media queries for mobile devices"
  context: [website]

# 检查可访问性
let check_a11y = session: validator
  prompt: "Check if the HTML has proper ARIA labels and semantic tags"
  context: [website]
```

---

## 📝 使用场景

### 1. 快速原型设计
```prose
import "frontend_design" from "./skills/frontend-design.json"

agent designer:
  skills: ["frontend_design"]

let landing_page = session: designer
  prompt: "Create a SaaS landing page"
```

### 2. 设计系统验证
```prose
# 验证多个设计是否一致
let design1 = session: designer
  prompt: "Create homepage"

let design2 = session: designer
  prompt: "Create about page"

let consistency_check = session: validator
  prompt: "Check if both designs use the same color scheme"
  context: [design1, design2]
```

### 3. A/B 测试
```prose
# 生成两个版本
let version_a = session: designer
  prompt: "Create version A with purple accent"

let version_b = session: designer
  prompt: "Create version B with blue accent"
```

---

## 🎨 设计参考

### Prose.md 风格特点

从 https://prose.md/ 学习到的设计特点：

1. **极简主义**
   - 最少的视觉元素
   - 大量留白
   - 单色强调

2. **排版优先**
   - 清晰的层次结构
   - 可读的字号
   - 适当的行高

3. **微交互**
   - Hover 状态
   - 平滑过渡
   - 细微反馈

4. **响应式**
   - Mobile-first
   - 流式布局
   - 断点合理

---

## 🚀 快速开始

1. **运行测试**
   ```bash
   cd /Users/qing/projects/open-prose
   bun run plugin/bin/open-prose.ts run test-frontend-design-final.prose
   ```

2. **查看生成的网页**
   ```bash
   open generated-website.html
   ```

3. **修改并重新测试**
   - 编辑 `skills/frontend-design.json`
   - 重新运行测试
   - 查看新的 `generated-website.html`

---

## 📚 相关文档

- [OpenProse Runtime](./RUNTIME_README.md)
- [Tool Calling Guide](./TOOL_CALLING.md)
- [Import Skills](./COMPLETION_REPORT.md#4-import-skills-支持)

---

## ✨ 测试通过示例

**测试日期**: 2026-03-06

**结果**: ✅ 全部通过

**生成的网站**:
- 包含所有必需元素（head, logo, nav, footer）
- 使用 prose.md 风格的简单配色
- 响应式设计，mobile-friendly
- 生产就绪的 HTML + CSS

**工具调用**:
```
🛠️ Tool Calls:
  └─ frontend_design({
       "style": "prose-style",
       "requirements": "Minimal design like prose.md...",
       "elements": ["head", "logo", "nav", "footer"]
     }) → [完整的 HTML 代码]
```

---

**创建时间**: 2026-03-06
**OpenProse 版本**: v2.0.0 (100% 完成)
**状态**: ✅ 测试通过
