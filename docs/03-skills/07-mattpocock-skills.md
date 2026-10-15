---
title: mattpocock/skills 分析
description: Matt Pocock 的工程级 Agent Skills 仓库全景分析
sidebar_position: 7
---

# mattpocock/skills 分析

> 仓库：[https://github.com/mattpocock/skills](https://github.com/mattpocock/skills)（本地 clone：`E:\code\opensource\ai\mattpocock-skills\skills`）
> 定位：**"Skills For Real Engineers"** —— Matt Pocock（Total TypeScript 作者）每天真实使用的工程技能集，不是 vibe coding。

## 设计哲学

README 开篇点明它与 GSD、BMAD、Spec-Kit 这类"接管整个流程"的框架的区别：

- **小而可改（small, easy to adapt）**：每个 skill 是独立目录，一个 SKILL.md + 若干支撑文件，随时可以 hack 成自己的版本。
- **可组合（composable）**：skill 之间互相调用（如 `grill-with-docs` 复用 `grilling`，`implement-spec` 消费 `to-spec`/`to-tickets` 的产物），而不是一个大而全的流水线。
- **模型无关**：不绑定 Claude Code，同时提供 Codex / Copilot / Gemini CLI 安装方式（plugin marketplace 或 skills.sh 拷贝）。
- **流程不夺权**：保持工程师对过程的控制，流程出 bug 时容易定位和修改。

## 仓库结构

```
mattpocock-skills/
├── skills/                  # 技能本体（按成熟度分类）
│   ├── engineering/         # 20 个工程技能（核心）
│   ├── productivity/        # 8 个通用生产力技能
│   ├── in-progress/         # 7 个开发中技能
│   ├── misc/                # 4 个一次性/特定场景技能
│   └── deprecated/          # 已废弃（仅剩 README）
├── .claude-plugin/          # Claude Code 插件清单
├── .agents/  .changeset/  scripts/  docs/
├── AGENTS.md  CLAUDE.md     # 给 agent 的仓库级说明
└── GLOSSARY.md  SCOPE.md
```

### 单个 skill 的典型结构

```
skills/engineering/code-review/
├── SKILL.md       # 入口：YAML frontmatter (name, description) + 流程指令
└── agents/        # 子代理指令，供并行 sub-agent 使用（隔离上下文）
```

**关键模式**：

1. **description 即路由**：frontmatter 的 description 写得极长且含触发词（"Use when..."），因为模型靠它决定何时加载该 skill。
2. **子代理隔离上下文**：重活（如 code-review 的双轴审查、diagnosing-bugs 的假设验证）拆给 `agents/` 下的子代理并行跑，主会话只聚合结论。
3. **一次初始化 skill**：`setup-matt-pocock-skills` 负责配置 issue tracker、triage 标签、文档布局，其他工程技能依赖它的产物。
4. **产物落盘**：`research`/`to-spec` 等把结论写成仓库内的 Markdown 文件，让知识沉淀进版本控制。

## 技能全景

### engineering（核心，20 个）

覆盖一条完整的真实工程工作流：想法 → 拷问 → 规格化 → 拆票 → 实现 → 审查 → 回顾。

| Skill | 用途 |
|---|---|
| ask-matt | 路由器：问它当前场景该用哪个 skill |
| setup-matt-pocock-skills | 一次性初始化：issue tracker、标签、文档布局 |
| grilling 系 / grill-me / grill-with-docs | 拷问式访谈，把模糊想法磨成扎实方案（with-docs 版顺带产出 ADR 和术语表） |
| to-spec | 把对话综合成规格并发布到 issue tracker |
| to-tickets | 把方案拆成带阻塞关系的 tracer-bullet 票 |
| wayfinder | 超大工程的"决策票地图"：逐张解决直到路线清晰 |
| implement / implement-spec | 按规格/票实现代码 |
| tdd | 测试驱动开发（red-green-refactor） |
| diagnosing-bugs | 疑难 bug 与性能回归的诊断循环 |
| code-review | 双轴审查（Standards + Spec），并行子代理 |
| pr | 写 PR 描述 |
| triage | issue/外部 PR 的状态机分诊，产出 agent-ready brief |
| retro | 编码会话回顾 |
| prototype | 一次性原型回答设计问题 |
| research | 调研高可信一手资料并落盘为 Markdown |
| wizard | 生成交互式 bash 向导，引导人类完成只有人能做的步骤（配密钥、点面板等） |
| domain-modeling / codebase-design | 领域建模与"深模块"设计词汇 |
| improve-codebase-architecture | 扫描代码库找深化机会，产出 HTML 报告 |

### productivity（通用，8 个）

| Skill | 用途 |
|---|---|
| grilling / grill-me | 拷问计划、决策、想法（engineering 版的前身） |
| handoff | 把当前对话压缩成交接文档给另一个 agent |
| teach | 在工作区内教用户新技能/概念 |
| to-questionnaire | 把答不了的问题变成给别人填的问卷 |
| wait-what | "停，刚才那条没说明白，重新讲" |
| writing-for-agents | 写给 agent 看的文档（SKILL.md、AGENTS.md 的元技能） |

### in-progress（7 个）与 misc（4 个）

- **in-progress**：chief-of-staff（单会话长目标协调子代理）、claude-handoff、loop-me、setup-ts-deep-modules（dependency-cruiser 深模块化 TS 仓库）、writing-beats / writing-fragments / writing-shape（写作三段式：挖素材 → 组节奏 → 成文章）。
- **misc**：偏一次性工具 —— git-guardrails-claude-code（hooks 拦截危险 git 命令）、migrate-to-shoehorn、scaffold-exercises、setup-pre-commit（Husky + lint-staged）。

## 值得借鉴的写法

1. **双轴 code-review**：把"是否符合代码规范"与"是否符合原始需求"拆成两个并行子代理，各自独立上下文，避免互相污染；内置 Fowler 代码坏味道基线（repo 文档可覆盖，但永远是 judgement call 而非硬违规）。
2. **wizard 模式**：承认有些步骤只有人能做，让 agent 现场生成一个 bash 向导带着人走，而不是假装自己能代劳。
3. ** tracer-bullet 拆票**：`to-tickets` 强调每张票自带阻塞边，优先纵向切出可验证的小切片。
4. **grilling 作为一等公民**：在"规格化之前先拷问"这件事上下了重注，贯穿工程与生产力两组技能。
5. **description 工程学**：每个 description 都是"做什么 + 触发条件（Use when...）+ 边界（Don't invoke...）"的三段式，是让路由准确的直接手段。

## 小结

- 该仓库是"个人工程工作流 skill 化"的标杆样本：小、可组合、模型无关、产物落盘。
- engineering 组构成一条从想法到回顾的完整流水线，但每一步都可单独取用。
- 对本系列文档最有迁移价值的是：子代理隔离、description 三段式写法、grill-then-spec 的前置拷问流程。

## 参考资料

- 仓库主页：[https://github.com/mattpocock/skills](https://github.com/mattpocock/skills)
- skills.sh 安装页：[https://skills.sh/mattpocock/skills](https://skills.sh/mattpocock/skills)

