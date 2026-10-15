---
title: Skills 子系统配置说明
description: 解析 DeepSeek Harness 技能（Skills）子系统的发现、注册表分层与配置项
sidebar_position: 4
# 更新日期: 
---

# Skills 子系统配置说明

> 基于官方参考文档 [Skills | DeepSeek Harness](https://deepseek-harness.github.io/deepseek-harness/reference/subsystems/skills) 整理

## 本章目标

- 理解 DSH 技能子系统的四大组成：Service Definition、Provider、Consumer 与分层注册表。
- 掌握本地技能目录的发现优先级（rank）与放置位置——这是日常配置技能时最常用的部分。
- 了解 `disable-model-invocation` / `user-invocable` 调用控制及会话目录注入机制。

## 正文

### 1. 子系统组成

技能能力族包含：

| 组件 | 包 | 职责 |
| --- | --- | --- |
| Service Definition | `dsh-skill`（`ctx.skills`） | 分层注册表：发现、合并、按需加载完整定义 |
| 本地 Provider | `dsh-skill-filesystem` | 扫描本地目录根，贡献文件系统技能 |
| 随包 Provider | `dsh-skill-badge`、`dsh-skill-office`、`dsh-sandbox-windows-acl` | 随安装包提供内置技能 |
| Consumer | `dsh-tool-skill` | 面向模型的 `skill` 工具 + 会话目录注入 |

### 2. 本地发现优先级（日常配置重点）

本地提供方按 rank 从小到大扫描，**rank 越小优先级越高**（同层重名时低 rank 胜出）：

| Rank | 来源 | 目录 |
| --- | --- | --- |
| 100 | project-dsh | `<项目根>/.dsh/skills` |
| 200 | project-agents | `<项目根>/.agents/skills` |
| 300 | custom | `Config.customSkillDirs` 自定义目录 |
| 400 | user-dsh | `<dshHome>/skills` |
| 500 | user-agents | `<agentsHome>/skills` |
| 600 | bundled | `Config.bundledSkillDir` / `DSH_BUNDLED_SKILL_DIR` |

要点：

- **项目根** = 含 `.git` 的最近祖先目录；找不到则退回当前 cwd。git-root 探测通过 `ctx.fs` 进行，远程/沙箱工作区不会越界到宿主文件系统。
- 用户 DSH 根会跳过其 `.system` 子目录。
- 本地提供方不合成内置系统技能；随包技能需部署方通过 bundled 根目录或专用提供方提供。
- **skill 身份**：名称必须是 kebab-case（`^[a-z0-9]+(?:-[a-z0-9]+)*$`）。接受目录包（`<name>/SKILL.md`）和扁平文件（`<name>.md`）；**不支持**递归 `**/SKILL.md` 发现。
- 目录由 Chokidar 监视（新增/移除/变更），`write`/`edit` 工具命中相关路径时也会同步使目录失效；watcher 失败会把观测标记为不完整，但不隐藏可加载的候选。

### 3. 注册表分层与重名裁决

注册表沿用工具注册表确立的"宿主 + 按 scope 分层"形态：

- 注册落入调用方上下文 scope 对应的层：宿主与 repository 插件进**全局层**，agent preset 常驻挂载的插件进**该 preset 的层**。
- 读取时合并全局层与观察 scope 链：**最近层的条目直接赢得重名技能**；rank 顺序只在单层内裁决。
- 发现缓存以解析后的 scope 链为键；提供方或运行时变更发出无过滤的 `skills/change` 失效事件（不带 diff），消费方自行重新 `snapshot()`。
- 注册表**不缓存完整定义**——每次 `get()` 都让胜出提供方重读正文，因此修改 SKILL.md 立即对后续调用生效。

### 4. 调用控制：frontmatter 配置

本地提供方读取名称完全匹配的 kebab-case frontmatter 键，省略的字段默认为 `true`：

| frontmatter 键 | 领域字段 | 效果 |
| --- | --- | --- |
| `disable-model-invocation` | `modelInvocable` | 置 false 后不进入模型可见目录，仅限用户手动调用 |
| `user-invocable` | `userInvocable` | 置 false 后不进入人类命令目录 |

四种组合均被 `ctx.skills.list()` 保留；两者皆为 false 时技能只能被受信的 `ctx.skills.get()` 调用方获取。`skill` 工具加载前、后各检查一次 `isModelInvocable`，无权访问的技能被拒绝。

### 5. 会话目录与工具约定

- `dsh-tool-skill` 在会话首个观察到非空完整视图的步骤注入持久 user-role `<system-reminder>` 目录；目录只含排序后的 `name` 和 XML 转义的 `description`——**不含正文、路径、来源或路由提示**。
- `catalogDescriptionMaxLength` 限制目录中 description 长度，默认 `500`，最小 `3`。
- 后续每步对可见条目计算 digest，变化时通过 `agent.inject()` 追加完整目录替换；上下文压缩隐藏历史目录后，下一份完整快照会重建目录。
- 工具结果包含 `<skill_content>`、`<skill_resources>`、`<skill_instructions>`；`resourceBase` 仅按需解析显式引用的资源，不枚举技能目录。

### 6. 注册表自身配置项

| 配置 | 说明 |
| --- | --- |
| `Config.collectCacheMaxEntries` | 内存中保留的已完成 cwd/provider 目录缓存上限（注册表唯一自有配置） |
| `Config.customSkillDirs` | rank 300 自定义技能目录 |
| `Config.bundledSkillDir` / `DSH_BUNDLED_SKILL_DIR` | rank 600 随包技能目录 |
| `catalogDescriptionMaxLength` | 会话目录 description 上限（Consumer 侧，默认 500） |

其余本地目录根（`dshHome`、`agentsHome`）、watcher 启用/轮询/稳定性/符号链接/项目容量等由本地提供方拥有，确切默认值见官方"插件配置目录"。

## 小结

- 放技能就记住 rank 表：项目 `.dsh/skills` > `.agents/skills` > 自定义 > 用户级 > 随包；目录包或扁平 md 皆可，不支持递归发现。
- frontmatter 两个调用控制键决定技能出现在模型目录、用户命令目录还是两者。
- 完整定义从不缓存——改 SKILL.md 即时生效，无需重启。

## 参考资料

- [Skills 子系统参考文档](https://deepseek-harness.github.io/deepseek-harness/reference/subsystems/skills)
- 源码：`packages/skill/skill`、`packages/skill/skill-filesystem`、`packages/skill/tool-skill`
