---
title: "s09 Memory：让重要信息跨会话保留下来"
description: "存储 / 召回 / 提取 / 整理 四个子系统"
sidebar_position: 9
---

import CodeBlock from '@theme/CodeBlock';
import s09code from '!!raw-loader!./code/s09_code.py';

# s09 Memory：让重要信息跨会话保留下来

> *"把以后还会用到的信息留下来。"* 文件存储 + 索引 + 相关性选择 + 按需召回。
>
> **Harness 层**：Memory 在会话之外保存可复用知识，并在相关任务中取回。

## 问题

Agent 开始新会话时，`messages` 里没有上一次的对话。用户之前说过的编码偏好、项目背景和排查线索，下次任务还可能用到。没有持久存储，这些信息只能由用户重新说一遍。

把完整 transcript 留下来适合归档，却不适合每次都发给模型：对话越来越长，当前任务需要的信息难以定位，旧事实也可能已过期。

## 解决方案

![Memory Overview](/img/learn-claude-code/s09-memory-overview.svg)

**全部写进 system prompt 为什么不合适**：记忆越多，与当前任务无关的内容就越多，token 和上下文窗口被持续占用。s07 已给出更好的读取方式：**保留简短索引，只在需要时加载正文**。区别是 Skill 由人编写保持只读；Memory 由 Agent 从对话中提取，并在后续任务中再次使用。

因此本章处理四件事：**存储、召回、提取、整理**。

![Memory Subsystems](/img/learn-claude-code/s09-memory-subsystems.svg)

> 完整实现见原仓库 [s09_memory/](https://github.com/shareAI-lab/learn-claude-code/tree/main/s09_memory)（README.md + code.py）

## 工作原理

**存储：一个记忆一个文件**。每条记忆是 `.memory/` 下的 Markdown 文件，frontmatter 记录 `name`、`description` 和 `type`：

```markdown
---
name: user-preference-tabs
description: User prefers tabs for indentation
type: user
---

User prefers using tabs, not spaces, for indentation.
```

`type` 四类：user（长期偏好）/ feedback（工作反馈）/ project（项目事实）/ reference（外部线索）。`MEMORY.md` 是索引，写入后由 `rebuild_memory_index()` 重建。

**召回：先选择，再加载正文**。每次用户请求时，`select_relevant_memories()` 让一次轻量模型调用从目录中选择最多五条相关记录（失败降级为关键词匹配）；选择完成后 `load_memories()` 才读取文件并限制正文总长度。`build_system()` 明确声明：召回内容只是背景知识，与当前请求冲突时以当前请求为准。

```python
prompt = (
    "Select memory records that are relevant to the current user request. "
    "Return only a JSON array of catalog indices, such as [0, 2]. "
    "Return [] when none are relevant."
)

relevant_memories = load_memories(messages)
system = build_system(relevant_memories)
```

**提取：回合结束后保存可复用信息**。用户不一定会明确说"请记住"。候选必须带 `scope`：只有 `persistent` 才跨会话保留，`current_task`（临时命令、临时路径、临时限制）不存。`should_store_memory()` 最后把关：字段不完整、含"本次会话"语义、与已有记忆重复的候选都拒绝。

```python
tool_calls = [b for b in response.content if b.type == "tool_use"]
if not tool_calls:
    force = trigger_hooks("Stop", messages)
    if force:
        messages.append({"role": "user", "content": force})
        continue
    if extract_memories(messages):
        consolidate_memories()
    return
```

**整理：合并重复和过期内容**。达到 10 条时 `consolidate_memories()` 让模型生成整理后的记录列表。替换前保存快照；失败时恢复原文件并重建索引：

```python
snapshot = {path.name: path.read_text(encoding="utf-8")
            for path in MEMORY_DIR.glob("*.md")
            if path.name != MEMORY_INDEX.name}

try:
    # 删除旧文件 → 写入整理后的记忆 → 重建索引
    ...
except Exception:
    # 恢复快照并重建索引
    ...
```

> **与 s08 的边界**：s08 管理当前会话的上下文预算，s09 管理会话之外的可复用知识。Memory 是选择性存储，不是 transcript 的无损备份，也不取代上下文压缩。

## 接下来

Memory 解决了跨会话保留信息的问题，但复杂任务还需要记录每一步的状态和依赖关系。仅靠对话中的 TODO，程序退出后就无法继续追踪进度。

s10 Task System → 把任务、状态和依赖关系保存到磁盘。

## 完整源码

<details>
<summary>s09_code.py（点击展开，共 700 行）</summary>

<CodeBlock language="python" title="s09_code.py">{s09code}</CodeBlock>

</details>
