---
title: "s15 Agent Harness 集成：多种机制，一个循环"
description: "26 个工具 / 组件在循环中的位置 / 事件源汇聚"
sidebar_position: 15
---

import CodeBlock from '@theme/CodeBlock';
import s15code from '!!raw-loader!./code/s15_code.py';

# s15 Agent Harness 集成：多种机制，一个循环

> *"多种机制，一个循环"* — 工具、权限、记忆、任务、团队、插件都挂在同一个 while True 上。
>
> **Harness 层**：集成 — 把本章示例实际使用的机制放进同一个可运行系统。

## 问题

前面的章节把不同机制放在各自独立的示例中。本章把集成运行时需要的机制接到一起。

一个能长期工作的 coding agent 需要同时拥有：工具分发和权限边界、hooks 扩展点、todo 计划和任务图、技能/记忆/系统 prompt 组装、压缩和错误恢复、后台任务和 cron 调度、团队与 idle 任务认领、任务绑定的 worktree、MCP 外部工具接入。

s15 不引入独立机制，而是展示现有机制从哪里进入模型循环，以及它们产生的事件如何回到同一段对话。

## 解决方案

![System Architecture](/img/learn-claude-code/s15-system-architecture.svg)

循环仍是同一个结构：调用模型，检查响应里有没有 `tool_use` block，执行工具，再把结果追加回 `messages`。

```text
用户输入
  → UserPromptSubmit hooks
  → cron/background 通知注入
  → context compact
  → memory + skills + MCP 状态组装 system prompt
  → LLM
  → has tool_use block?
      否 → Stop hooks → 返回
      是 → PreToolUse hooks + permission
          → TOOL_HANDLERS / MCP handlers / background dispatch
          → PostToolUse hooks
          → tool_result / task_notification 回 messages
          → 下一轮
```

**内置工具池包含 26 个工具**：

```text
bash, read_file, write_file, edit_file, glob
todo_write, task, load_skill, compact
create_task, update_task, list_tasks, get_task, claim_task, complete_task
schedule_cron, list_crons, cancel_cron
spawn_teammate, list_teammates, send_message
request_shutdown, request_plan, review_plan
create_worktree
connect_mcp
```

> 完整实现见原仓库 [s15_integrated_harness/](https://github.com/shareAI-lab/learn-claude-code/tree/main/s15_integrated_harness)（README.md + code.py）

## 工作原理

**组件在循环中的位置**：

| 位置 | 组件 | 作用 |
|------|------|------|
| 用户输入前后 | `UserPromptSubmit` hooks | 记录、注入、审计用户输入 |
| LLM 前 | cron queue / background notifications | 定时 prompt 与 `<task_notification>` 注入 messages |
| LLM 前 | compaction pipeline | 先压大输出，再裁历史，再压旧 tool_result，必要时摘要 |
| LLM 前 | memory / skills / MCP state | 组装 system prompt |
| LLM 调用 | error recovery | 429/529 重试，`max_tokens` 升级，prompt too long 触发 reactive compact |
| 工具执行前 | `PreToolUse` hooks + permission | 拦截危险命令、写越界、破坏性 MCP 工具 |
| 工具分发 | `assemble_tool_pool` | 组装内置工具和 MCP 动态工具 |
| 工具执行时 | background dispatch | 显式标记的 bash 进 daemon thread，主循环先返回占位结果 |
| 工具执行后 | `PostToolUse` hooks | 大输出告警、日志等后处理 |
| 退出时 | `Stop` hooks | 统计、清理、审计 |

**两层计划**：`todo_write`（会话内、内存、整表替换，防单 Agent 漂移）vs task graph（跨会话、磁盘、稳定 ID 单条生命周期更新，支撑团队协作）。任务图仍采用两阶段构建；只有 Lead 能用 `update_task`，队友只能列举、认领和完成。

**两类委派**：`task`（一次性 subagent，独立 `messages[]`，中间过程丢弃，只回摘要——解决**上下文隔离**）vs `spawn_teammate`（持久队友线程，`WORK → result → IDLE`，无固定轮数上限——解决**长期并行协作**）。每次调用模型前先读收件箱，直接消息和关机请求不会被连续 tool-use 轮次饿死；idle 时先等 MessageBus 消息，超时后才扫就绪 task，原子认领最多一个。

**权限要点**：权限作为 `PreToolUse` hook 而非硬编码；MCP server 的自我声明不作为授权依据（宿主维护精确的已知只读名单）；文件越界直接拒绝；只有前台用户轮次可弹交互确认，异步轮次直接拒绝。

**压缩与恢复**：LLM 前跑 `tool_result_budget → snip_compact → micro_compact → compact_history`。调用模型再包一层恢复：429 指数退避；529 可切 fallback model；`max_tokens` 先提高再要求 continuation；prompt too long reactive compact 后重试。

**后台与 cron**：`run_in_background=true` 的 bash 返回占位结果，后台完成以 `task_notification` 注入下一轮。cron durable 任务先持久化 `pending_delivery` 再入队，保留到模型调用成功——至少一次交付。CLI 同时监听 cron 队列、Lead 收件箱和后台任务，任一事件自动唤醒一轮 Agent。

**worktree 与 MCP**：任务级 worktree 管理工作目录（认领时解析 cwd、完成后本轮保留、IDLE 时释放；移除保留在宿主侧 `remove_worktree()`，模型不能调用）。MCP 走 `connect_mcp` + 动态工具池，拒绝规范化后的名称冲突。

## 接下来

s16 Workflow Runtime 会在这个 host 中加入 `Workflow` 工具：把固定的编排路径写在代码中，并记录运行进度，使同一次运行可以继续执行。

## 完整源码

<details>
<summary>s15_code.py（点击展开，共 2859 行）</summary>

<CodeBlock language="python" title="s15_code.py">{s15code}</CodeBlock>

</details>
