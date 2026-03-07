# Skill Optimization Loop - 闭环测试系统

## 概述

这是一个自动化的 AI Skill 测试和优化闭环系统，用于：
1. 测试 skill 的效果
2. 发现问题和不足
3. 分析根本原因
4. 生成改进措施
5. 验证改进效果

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    输入：设计规格                               │
│              (图片描述 / 文字规格 / 原型图)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  阶段 1: 初始生成      │
          │  - Agent with Skills │
          │  - 生成 HTML/CSS     │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  阶段 2: 自动评估      │
          │  - 对比规格           │
          │  - 发现差异           │
          │  - 严重程度分级       │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  阶段 3: 根因分析      │
          │  - Skill 缺陷？       │
          │  - Prompt 不清晰？    │
          │  - Context 丢失？     │
          │  - Tool 使用问题？    │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  阶段 4: 生成改进      │
          │  - 新 Skill 文件      │
          │  - 改进的 Prompt      │
          │  - 优化建议           │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  阶段 5: 重新生成      │
          │  - 应用改进           │
          │  - 生成 v2            │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  阶段 6: 最终验证      │
          │  - v1 vs v2 对比      │
          │  - 改进率统计         │
          │  - 经验总结           │
          └──────────────────────┘
```

## 文件说明

### 完整版本
`plugin/examples/skill-optimization-simple.prose`
- 7 个阶段的完整闭环
- 详细的根因分析
- 生成改进 Skill 文件
- 完整的评估报告

### 快速演示
`plugin/examples/skill-loop-demo.prose`
- 简化的 4 阶段流程
- 快速验证概念
- 适合学习和测试

## 使用方法

### 1. 准备设计规格

创建详细的设计规格，包括：
```prose
let design_spec = """
**Color Scheme:**
- Primary: #2563eb (hex code)
- Secondary: #1e293b
...

**Typography:**
- Heading: 3rem, bold, sans-serif
- Body: 1.125rem, regular
...

**Layout:**
- Hero section - full width
- 3-column grid
...
"""
```

### 2. 导入相关 Skills

```prose
import "frontend-design" from "github:anthropics/skills"
import "web-artifacts-builder" from "github:anthropics/skills"
import "brand-guidelines" from "github:anthropics/skills"
```

### 3. 定义专门的 Agents

```prose
agent web_developer:
  model: sonnet
  skills: ["frontend-design", "web-artifacts-builder"]
  tools: ["write", "read", "edit"]

agent qa_evaluator:
  model: opus
  skills: ["brand-guidelines"]
  tools: ["read", "bash"]

agent root_cause_analyst:
  model: opus
  tools: ["read"]
```

### 4. 运行闭环

```bash
bun run plugin/bin/open-prose.ts run plugin/examples/skill-optimization-simple.prose
```

## 关键特性

### 自动化评估
- 读取生成的文件
- 与规格逐项对比
- 自动分类问题（颜色/布局/字体/间距）
- 严重程度评级（Critical/High/Medium/Low）

### 智能根因分析

分析问题的4个维度：

**Category A - Skill Deficiency（技能缺陷）**
- Skill 缺少特定领域知识
- 例如：没有 CSS Grid 模式、颜色方案指导等
- **解决**: 生成补充的 Skill 文件

**Category B - Prompt Insufficiency（提示不足）**
- 初始 prompt 太模糊
- 缺少具体要求
- 例如："modern design" 没有具体指标
- **解决**: 重写更明确的 prompt

**Category C - Context Loss（上下文丢失）**
- 信息在阶段间丢失
- Agent 没有正确使用 context
- **解决**: 改进 context 传递策略

**Category D - Tool Usage Issues（工具使用问题）**
- Agent 没有有效使用工具
- 文件没有正确创建/读取
- **解决**: 提供工具使用示例和错误处理

### 改进措施生成

系统自动生成：

1. **新的 Skill 文件**（如果是 Skill 缺陷）
   ```markdown
   ---
   name: improved-frontend-design
   description: Enhanced frontend with color management
   ---

   # Improved Frontend Design

   ## Color Management
   [补充的知识内容]
   ```

2. **改进的 Prompt**（如果是 Prompt 问题）
   ```
   具体化的 prompt，包含：
   - 精确的颜色代码
   - 具体的尺寸数值
   - 明确的布局要求
   ```

3. **Context 优化建议**（如果是 Context 问题）

4. **Tool 使用纠正**（如果是 Tool 问题）

### 迭代验证

- v1 vs v2 对比
- 计算改进率
- 统计修复的问题数
- 生成经验总结

## 实际应用场景

### 场景 1: Web 开发
```prose
图片 → 描述 → 生成 HTML/CSS → 评估 → 改进 → 验证
```

### 场景 2: 文档生成
```prose
规格 → 生成文档 → 评估格式 → 改进模板 → 重新生成
```

### 场景 3: 代码审查
```prose
需求 → 生成代码 → 代码审查 → 发现模式问题 → 改进 Skill
```

### 场景 4: API 测试
```prose
API 规格 → 生成测试 → 执行测试 → 分析失败 → 改进测试策略
```

## 输出文件

闭环会生成以下文件：

```
generated-landing-page.html       # v1 初始版本
generated-landing-page-v2.html    # v2 改进版本
skills/improved-frontend-design.md # 新的 Skill
improved-prompt-template.txt      # 改进的 Prompt 模板
skill-optimization-report.md      # 完整报告
```

## 性能指标

系统会追踪：
- **Issue Resolution Rate**: 问题解决率 (%)
- **Quality Score**: 质量分数 (0-100)
- **Iteration Count**: 迭代次数
- **Time per Stage**: 每阶段耗时
- **Skill Effectiveness**: Skill 有效性评分

## 最佳实践

### 1. 详细的初始规格
- 使用具体的数值（不要说"大"，而是"48px"）
- 提供颜色的 hex code
- 明确布局结构
- 包含响应式断点

### 2. 选择合适的 Skills
- 针对任务导入相关 skills
- 不要导入无关的 skills（增加噪音）
- 可以自定义 skills

### 3. 正确的 Agent 配置
- 开发 Agent 需要 write 权限
- QA Agent 需要 read 和 bash 权限
- 分析 Agent 主要需要 read 权限

### 4. Context 传递
- 在每个阶段传递必要的 context
- 使用对象简写：`{ design_spec, evaluation }`
- 避免传递过大的 context

### 5. 工具使用指导
- 明确告诉 Agent 使用哪些工具
- 提供文件路径
- 添加 "IMPORTANT: Use the WRITE tool" 等强调

## 故障排查

### Skill 不加载
```
[WARN] Skill not found or not loaded: frontend-design
```
**解决**: 检查 skill 名称，确认在 anthropics/skills 仓库中存在

### Context 丢失
```
Evaluation shows: Agent didn't consider previous feedback
```
**解决**: 检查 context 传递，使用 `context: { var1, var2 }`

### 文件没有生成
```
File not found: generated-page.html
```
**解决**:
- 确保 Agent 有 `tools: ["write"]`
- 在 prompt 中明确要求使用 WRITE tool
- 提供完整的文件路径

### 评估不准确
```
QA Agent says "looks good" but issues exist
```
**解决**:
- 使用 opus 作为 QA agent（更仔细）
- 提供更详细的检查清单
- 要求逐项对比

## 扩展

### 添加自定义评估标准
```prose
agent custom_qa:
  model: opus
  prompt: """
  You are a QA specialist with focus on:
  - Accessibility (WCAG 2.1 AA)
  - Performance (Core Web Vitals)
  - SEO best practices
  """
```

### 集成外部工具
```prose
agent validator:
  tools: ["bash"]

session: validator
  prompt: "Run HTML validator: npx html-validate generated-page.html"
```

### 多维度评分
```prose
let scores = {
  color_accuracy: 95,
  layout_correctness: 80,
  typography: 90,
  responsiveness: 85
}
```

## 未来改进

- [ ] 支持图片输入（视觉分析）
- [ ] 集成浏览器截图对比
- [ ] 自动化的 A/B 测试
- [ ] Skill 版本管理
- [ ] 评估标准库
- [ ] 性能基准测试

## 示例运行

完整的运行示例：
```bash
# 快速演示（约 1-2 分钟）
bun run plugin/bin/open-prose.ts run plugin/examples/skill-loop-demo.prose

# 完整闭环（约 5-10 分钟）
bun run plugin/bin/open-prose.ts run plugin/examples/skill-optimization-simple.prose
```

## 参考资料

- [Anthropic Skills Repository](https://github.com/anthropics/skills)
- [OpenProse Documentation](../README.md)
- [Agent Best Practices](./AGENTS.md)
- [Skill Integration](./ANTHROPIC_SKILLS.md)
