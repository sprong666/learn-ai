---
title: "s08 Context Compact：上下文总会满，先整理，再总结"
description: "tool_result_budget / snip / micro / summary 四步压缩管线"
sidebar_position: 8
---

import CodeBlock from '@theme/CodeBlock';
import s08code from '!!raw-loader!./code/s08_code.py';

# s08 Context Compact：上下文总会满，先整理，再总结

> *"上下文总会满，要有办法腾地方。"* 四步压缩，低成本的操作优先执行。
>
> **Harness 层**：压缩让有限的上下文持续服务于长任务。

## 问题

Agent 持续工作时，读过的文件、执行过的命令和模型回复都会留在 `messages` 中。消息越积越多，最终超过模型能接收的上下文长度，API 返回 `prompt_too_long`。

在代码任务里，工具结果通常占据最多空间：读取长文件、测试和构建日志（可能一次几十 KB）、多文件搜索。压缩的目标是控制信息量，同时尽可能保留当前目标、用户约束和正在进行的工作。

## 解决方案

![Context Compact 全景](/img/learn-claude-code/s08-compact-overview.svg)

直接让模型总结整段历史可以明显缩短上下文，但摘要一定会遗漏细节，还多产生一次模型调用。而工具结果更适合优先处理：大文件可转存磁盘、旧命令可重新执行、文本裁剪不需要调用模型。

因此压缩顺序按信息损失和调用成本排列：**先转存，再裁剪，再替换旧结果，最后才生成摘要**。

![四步压缩管线](/img/learn-claude-code/s08-compaction-layers.svg)

| 步骤 | 触发条件 | 做法 |
|------|---------|------|
| 1. tool_result_budget | 每轮，最新一批结果总量 > 200k 字符 | >30k 的完整转存 `.task_outputs/tool-results/`，上下文留路径+2000 字符预览；从最大的开始处理 |
| 2. snip_compact | 消息 > 50 条 | 全量存 `.transcripts/`，保留最初 3 条 + 最近 46 条 + 归档标记 |
| 3. micro_compact | 估算超 50k 字符时 | 已读取的旧结果逐条替换为 `[saved at ...]` 路径，保留最近 3 条，压到阈值 80% 停 |
| 4. compact_history | 仍然超限 | 全量 transcript + 模型生成事实性摘要，用一条 `[Compacted]` 消息替换历史 |

> 完整实现见原仓库 [s08_context_compact/](https://github.com/shareAI-lab/learn-claude-code/tree/main/s08_context_compact)（README.md + code.py）

## 工作原理

**第一步 tool_result_budget**——只处理最新一批工具结果，完整内容仍可从路径取回，适合最先执行：

```python
ranked = sorted(blocks, key=lambda b: len(str(b.get("content", ""))), reverse=True)
for block in ranked:
    if total <= max_chars:
        break
    content = str(block.get("content", ""))
    if len(content) <= self.LARGE_RESULT_CHAR_LIMIT:   # 30000
        continue
    block["content"] = self.persist_large_output(
        block.get("tool_use_id", "unknown"), content)
```

![大结果转存](/img/learn-claude-code/s08-layer1-budget.svg)

**第二步 snip_compact**——切点必须保护 `assistant(tool_use)` 与 `user(tool_result)` 的配对关系，孤立的工具结果会让下一次 API 请求无效：

```python
head_end = 3
tail_start = len(messages) - (max_messages - head_end - 1)

if self.has_tool_use(messages[head_end - 1]):
    while head_end < tail_start and self.is_tool_result(messages[head_end]):
        head_end += 1

if (tail_start > 0 and self.is_tool_result(messages[tail_start])
        and self.has_tool_use(messages[tail_start - 1])):
    tail_start -= 1

transcript = self.write_transcript(messages)
marker = {"role": "user", "content":
          f"[{tail_start - head_end} messages archived at {transcript}]"}
messages = [*messages[:head_end], marker, *messages[tail_start:]]
```

**第三步 micro_compact**——模型已读取的结果保留最近 3 条，更早且超过 120 字符的逐条替换；替换前先完整落盘，每个占位都带可恢复路径：

![旧结果替换为可恢复路径](/img/learn-claude-code/s08-micro-compact.svg)

```python
unseen = self.unseen_tool_result_positions(messages)
consumed = [e for e in results if e[:2] not in unseen]

for _, _, block in consumed[:-self.KEEP_RECENT_RESULTS]:
    if self.estimate_chars(messages) <= target_chars:
        break
    content = str(block.get("content", ""))
    if len(content) <= 120:
        continue
    saved_path = self.persisted_output_path(content)
    if not saved_path:
        saved_path = self.save_output(block["tool_use_id"], content)
    block["content"] = f"[Earlier tool result saved at {saved_path}]"
```

**第四步 compact_history**——字符数仍超 `CONTEXT_CHAR_LIMIT = 50000` 时：写 transcript → 模型生成只含事实的摘要（`active_request` 单独传入，与摘要明确分开）→ 用一条 `[Compacted]` 消息替换历史：

![历史摘要](/img/learn-claude-code/s08-auto-compact.svg)

**为什么顺序固定**：第一、二步每轮执行，第三步只在超限时执行，只有第四步会增加 API 请求；每条被缩短的结果都保留可恢复路径。

```python
messages = self.tool_result_budget(messages)
messages = self.snip_compact(messages)
if self.estimate_chars(messages) > self.CONTEXT_CHAR_LIMIT:
    target = int(self.CONTEXT_CHAR_LIMIT * 0.8)
    messages = self.micro_compact(messages, target)
    if self.estimate_chars(messages) > self.CONTEXT_CHAR_LIMIT:
        messages = self.fit_tool_results(messages, target)
    if self.estimate_chars(messages) > self.CONTEXT_CHAR_LIMIT:
        messages = self.compact_history(messages, active_request)
```

**API 拒绝后的补救**：字符数只是估算，API 仍可能返回 `prompt_too_long`。`reactive_compact` 保存 transcript、总结较早历史、保留最近 5 条；`MAX_REACTIVE_RETRIES = 1` 限制补救一次。

**compact 工具**：模型可主动调用 `compact` 表示一个阶段结束。Harness 必须先执行完整批次（每个 `tool_use` 都有对应 `tool_result`），再摘要这个已闭合的回合——避免丢失副作用记录导致模型重复执行。

> **与 s09 的边界**：s08 管理当前会话的有限上下文，压缩时允许舍弃可恢复的细节；s09 保存需要跨压缩、跨会话继续存在的信息。

## 接下来

上下文压缩让 Agent 可以在有限窗口中继续长任务。需要跨压缩、跨会话保留的信息，还要进入独立的持久记忆系统。

s09 Memory 将实现记忆写入、检索与整理。

## 完整源码

<details>
<summary>s08_code.py（点击展开，共 522 行）</summary>

<CodeBlock language="python" title="s08_code.py">{s08code}</CodeBlock>

</details>
