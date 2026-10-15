---
title: SKILL 模板
description: 编写新 SKILL 的标准模板与规范，附 5 种 Agent Skill 设计模式
sidebar_position: 3
# 更新日期: 
---

# SKILL 模板

> 编写新 SKILL 的标准模板与规范，并附 5 种可复用的设计模式

## 本章目标

- 掌握 SKILL 的标准目录结构与 frontmatter 规范。
- 认识 5 种设计模式，知道什么时候套哪一种。

## 正文

### 1. 标准目录结构

```
skills/my-skill/
├── SKILL.md              # 必需：frontmatter + 指令正文
├── references/           # 可选：按需加载的规则、清单、分型文档
│   └── conventions.md
├── assets/               # 可选：输出模板、随包资产
│   └── report-template.md
└── scripts/              # 可选：确定性辅助脚本（校验、转换、渲染、导出）
    └── self_check.py
```

**frontmatter 规范**：

```yaml
---
name: my-skill            # kebab-case，注册表按名寻址
description: >-           # 路由依据：写清"做什么 + 何时用"，模型据此决定是否加载
  ...
disable-model-invocation: true   # 可选：仅用户手动调用（如纯风格类）
user-invocable: false            # 可选：不进入人类命令目录
metadata:                 # 可选：版本、标签等自由字段
---
```

三条原则：

- `description` 是最重要的字段——宿主模型只凭 `name` + `description` 决定是否调用，要枚举触发关键词、场景和排除项。
- **主文件控体积**，细节下沉 `references/`，指令写明"何时加载哪个文件"。
- **模型不可靠的事交给 `scripts/`**：几何校验、格式转换、导出等下沉为确定性脚本，指令只写"何时以什么参数调用"——这让 SKILL 从提示词集合升级为可验证的工程组件。

### 2. 五种设计模式

研究生态中的技能构建方式（Anthropic 仓库、Vercel、Google 内部指南），可归纳出五种反复出现的模式：

![5 种 Agent Skill 设计模式总览](/img/skill-patterns/overview.png)

#### 模式 1：工具包装器（Tool Wrapper）

**解决的问题**：让 Agent 瞬间成为某个库/框架的专家。

![Tool Wrapper 模式示意](/img/skill-patterns/1-tool-wrapper.png)

把 API 约定、团队规范打包进技能，提示中出现相关关键词时才加载——把内部规范融入工作流的最简机制。

**1) 完整 SKILL.md 样例**（教会 Agent 编写 FastAPI 代码）：

```markdown
# skills/api-expert/SKILL.md
---
name: api-expert
description: FastAPI development best practices and conventions. Use when
  building, reviewing, or debugging FastAPI applications, REST APIs, or
  Pydantic models.
metadata:
  pattern: tool-wrapper
  domain: fastapi
---
You are an expert in FastAPI development. Apply these conventions to the
user's code or question.

## Core Conventions
Load 'references/conventions.md' for the complete list of FastAPI best
practices.

## When Reviewing Code
1. Load the conventions reference
2. Check the user's code against each convention
3. For each violation, cite the specific rule and suggest the fix

## When Writing Code
1. Load the conventions reference
2. Follow every convention exactly
3. Add type annotations to all function signatures
4. Use Annotated style for dependency injection
```

注意指令明确告诉 Agent：**只有在开始审查或编写代码时才加载** `conventions.md`——按需加载是这一模式的灵魂。

**2) 工具包装模式 SKILL 模板**（替换大写占位符即可复用）：

```markdown
# skills/<skill-name>/SKILL.md
---
name: <skill-name>
description: <技术栈> best practices and conventions. Use when building,
  reviewing, or debugging <技术栈> code.          # ← 枚举触发关键词
metadata:
  pattern: tool-wrapper
  domain: <domain>
---
You are an expert in <技术栈> development. Apply these conventions to the
user's code or question.

## Core Conventions
Load 'references/conventions.md' for the complete list of <技术栈> best
practices.

## When Reviewing Code
1. Load the conventions reference
2. Check the user's code against each convention
3. For each violation, cite the specific rule and suggest the fix

## When Writing Code
1. Load the conventions reference
2. Follow every convention exactly
3. <领域专属硬性要求，如：type annotations / 错误处理 / 命名规范>

## When Debugging
1. Load the conventions reference
2. Identify which convention the failing code violates
3. Explain the fix in terms of the violated rule
```

配套的 `references/conventions.md` 按规则清单组织：每条规则 = 陈述 + 正例 + 反例，方便 Agent 逐条对照引用。

#### 模式 2：生成器（Generator）

**解决的问题**：保证每次生成的结构化文档一致。

![Generator 模式示意](/img/skill-patterns/2-generator.png)

`assets/` 存输出模板、`references/` 存样式指南，指令充当"项目管理器"：加载模板 → 读样式 → 问缺失变量 → 填充。

```markdown
# skills/report-generator/SKILL.md
---
name: report-generator
description: Generates structured technical reports. Use when the user
  asks to write, create, or draft a report or analysis document.
metadata:
  pattern: generator
---
Step 1: Load 'references/style-guide.md' for tone and formatting rules.
Step 2: Load 'assets/report-template.md' for the required output structure.
Step 3: Ask the user for any missing information needed to fill the template.
Step 4: Fill the template; every section must be present in the output.
Step 5: Return the completed report as a single Markdown document.
```

#### 模式 3：审核员（Reviewer）

**解决的问题**：把"检查什么"与"怎么检查"分离。

![Reviewer 模式示意](/img/skill-patterns/3-reviewer.png)

评分标准存 `references/review-checklist.md`，指令保持不变：加载清单 → 逐条评分 → 按严重程度分组输出。换一份清单（如 OWASP）就得到另一种专业审计。

**1) 完整 SKILL.md 样例**（Python 代码审核员）：

```markdown
# skills/code-reviewer/SKILL.md
---
name: code-reviewer
description: Reviews Python code for quality, style, and common bugs. Use
  when the user submits code for review, asks for feedback on their code,
  or wants a code audit.
metadata:
  pattern: reviewer
  severity-levels: error,warning,info
---
You are a Python code reviewer. Follow this review protocol exactly:

Step 1: Load 'references/review-checklist.md' for the complete review criteria.
Step 2: Read the user's code carefully. Understand its purpose before critiquing.
Step 3: Apply each rule from the checklist to the code. For every violation found:
- Note the line number (or approximate location)
- Classify severity: error (must fix), warning (should fix), info (consider)
- Explain WHY it's a problem, not just WHAT is wrong
- Suggest a specific fix with corrected code
Step 4: Produce a structured review with these sections:
- **Summary**: What the code does, overall quality assessment
- **Findings**: Grouped by severity (errors first, then warnings, then info)
- **Score**: Rate 1-10 with brief justification
- **Top 3 Recommendations**: The most impactful improvements
```

**2) 审核员模式 SKILL 模板**（替换占位符即可复用）：

```markdown
# skills/<skill-name>/SKILL.md
---
name: <skill-name>
description: Reviews <对象> for <审查维度>. Use when the user submits
  <对象> for review, asks for feedback, or wants an audit.
metadata:
  pattern: reviewer
  severity-levels: error,warning,info
---
You are a <领域> reviewer. Follow this review protocol exactly:

Step 1: Load 'references/review-checklist.md' for the complete review criteria.
Step 2: Read the user's submission carefully. Understand its purpose before critiquing.
Step 3: Apply each rule from the checklist. For every violation found:
- Note the location
- Classify severity: error (must fix), warning (should fix), info (consider)
- Explain WHY it's a problem, not just WHAT is wrong
- Suggest a specific fix
Step 4: Produce a structured review:
- **Summary** / **Findings**（按严重度分组） / **Score** / **Top N Recommendations**
```

配套 `references/review-checklist.md` 的组织方式：每条规则含 **规则编号 + 检查项 + 判定标准 + 默认严重度**。这份清单是模式的"弹药库"——把 Python 风格清单换成安全（OWASP）、性能或可访问性清单，同一套指令立即变成另一种专业审计，适合自动化 PR 预审。

#### 模式 4：反转（Inversion）

**解决的问题**：阻止 Agent 猜测并立即生成答案。

![Inversion 模式示意](/img/skill-patterns/4-inversion.png)

Agent 扮演面试官：按阶段结构化提问，用不可协商的门控指令（"所有阶段完成后方可开始构建"）强制先收集上下文，全部确认后才产出输出。适合需求采集、项目规划。

```markdown
# skills/project-planner/SKILL.md
---
name: project-planner
description: Plans a project by gathering requirements through structured
  questions first. Use when the user says "help me plan" or "design a system".
metadata:
  pattern: inversion
  interaction: multi-turn
---
DO NOT start building or designing until all phases are complete.
## Phase 1 — Problem Discovery (ask one question at a time, wait for each answer)
## Phase 2 — Technical Constraints (only after Phase 1 is fully answered)
## Phase 3 — Synthesis (only after all questions are answered)
```

#### 模式 5：流水线（Pipeline）

**解决的问题**：复杂任务保证步骤不被跳过。

![Pipeline 模式示意](/img/skill-patterns/5-pipeline.png)

指令即工作流定义：严格顺序 + 菱形门控（如"用户批准前禁止进入装配阶段"），确保无法绕过中间步骤输出未验证结果。

**1) 完整 SKILL.md 样例**（Python 源码 → API 文档流水线）：

```markdown
# skills/doc-pipeline/SKILL.md
---
name: doc-pipeline
description: Generates API documentation from Python source code through a
  multi-step pipeline. Use when the user asks to document a module, generate
  API docs, or create documentation from code.
metadata:
  pattern: pipeline
  steps: "4"
---
You are running a documentation generation pipeline. Execute each step in
order. Do NOT skip steps or proceed if a step fails.

## Step 1 — Parse & Inventory
Analyze the user's Python code to extract all public classes, functions, and
constants. Present the inventory as a checklist. Ask: "Is this the complete
public API you want documented?"

## Step 2 — Generate Docstrings
For each function lacking a docstring:
- Load 'references/docstring-style.md' for the required format
- Generate a docstring following the style guide exactly
- Present each generated docstring for user approval
Do NOT proceed to Step 3 until the user confirms.

## Step 3 — Assemble Documentation
Load 'assets/api-doc-template.md' for the output structure. Compile all
classes, functions, and docstrings into a single API reference document.

## Step 4 — Quality Check
Review against 'references/quality-checklist.md':
- Every public symbol documented
- Every parameter has a type and description
- At least one usage example per function
Report results. Fix issues before presenting the final document.
```

**2) 流水线模式 SKILL 模板**（替换占位符即可复用）：

```markdown
# skills/<skill-name>/SKILL.md
---
name: <skill-name>
description: <一句话说明多步产出什么>. Use when the user asks to <触发场景>.
metadata:
  pattern: pipeline
  steps: "<N>"
---
You are running a <任务> pipeline. Execute each step in order. Do NOT skip
steps or proceed if a step fails.

## Step 1 — <盘点/解析>
<分析输入，产出中间结果清单>。Present it and ask the user to confirm.

## Step 2 — <核心生成>
- Load 'references/<style>.md' for the required format
- Generate following the style guide exactly
- Present results for user approval
Do NOT proceed until the user confirms.

## Step 3 — <组装/产出>
Load 'assets/<template>.md' for the output structure. Compile everything
into the final deliverable.

## Step 4 — <质量检查>
Review against 'references/<checklist>.md'. Report results and fix issues
before presenting the final output.
```

**三个关键设计**：

- **门控句式固定**："Do NOT proceed until the user confirms" 出现在每个需要人工批准的步骤末尾——这是防绕过的硬约束，不是建议。
- **按需加载**：每步只引入该步需要的 reference / template，上下文窗口始终保持整洁。
- **自检收尾**：最后一步永远是对自己产出的审核（复用审核员模式），失败即修复后再交付。

### 3. 如何选择模式？

![模式选型决策树](/img/skill-patterns/decision-tree.png)

一句话版：

| 任务本质 | 模式 |
| --- | --- |
| 用某库/规范干活，知识按需加载 | 工具包装器 |
| 每次产出相同结构的文档 | 生成器 |
| 对照标准给现有产物打分 | 审核员 |
| 需求模糊，先问清再做 | 反转 |
| 多步骤、有依赖、不能跳步 | 流水线 |

实例映射：[diagram-design](05-diagram-design.md) 是"生成器 + 审核员"复合（类型模板产出 + Taste Gate 自检）；[answer-me-with-html](06-answer-me-with-html.md) 是"包装器 + 生成器 + 流水线"复合（bundled CLI + 组件选型表 + 渲染回环）。模式可互补：流水线末尾加审核步骤复查自身，生成器开头用反转收集变量。

## 小结

- 标准 SKILL = `SKILL.md` + `references/`（按需规则）+ `assets/`（输出模板）+ `scripts/`（确定性脚本）。
- 五种模式各有命题：包装器管知识、生成器管一致性、审核员管质量、反转管澄清、流水线管顺序。
- 选型看任务本质，组合看复杂度；细节下沉 reference 是所有模式的共同底座。

## 参考资料

- [5 种 Agent Skill 设计模式（Google Cloud Tech）](https://x.com/GoogleCloudTech/status/2033953579824758855)
- 本系列实例：[i-have-adhd](04-i-have-adhd.md) · [diagram-design](05-diagram-design.md) · [answer-me-with-html](06-answer-me-with-html.md)

