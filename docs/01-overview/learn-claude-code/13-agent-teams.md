---
title: "s13 Agent Teams：团队运行时与协作协议"
description: "持久队友 / MessageBus / 原子认领 / Worktree / 类型化协议"
sidebar_position: 13
---

import CodeBlock from '@theme/CodeBlock';
import s13code from '!!raw-loader!./code/s13_code.py';

# s13 Agent Teams：团队运行时与协作协议

> *"一个 Agent 装不下整项工作时，就让队友分头完成。"*
>
> **Harness 层**：Team — 多个 Agent 如何分工、共享状态，同时接受 Lead 控制。

## 问题

让 Agent 重构整个后端，工作涉及配置加载、认证和测试。一个 Agent 可以依次处理，但总耗时更长，早期细节也会逐渐离开上下文。这类工作适合并行，可用户通常只描述目标，不会替运行时设计团队：

```text
重构这个示例后端。清理配置加载、认证和测试，保持现有接口，并确保测试通过。
```

Harness 需要回答一组相互关联的问题：谁判断并行是否有用？队友如何跨任务保留身份？结果如何自动返回 Lead？空闲队友能否直接接手 ready task？并行修改可能冲突时用哪个工作目录？关机和计划审批如何成为可追踪的协议？

## 解决方案

![Agent Teams Overview](/img/learn-claude-code/s13-agent-teams-overview.svg)

s13 复用 s10 的基础工具、Hooks、Permission 和 Task System，增加一套由 Lead 管理的团队运行时：

- **Lead** 负责用户对话，提出分工方案并**等待用户确认后才 spawn**（系统提示词显式写入这条边界）
- **队友** 运行独立 Agent Loop，在 WORK 和 IDLE 之间切换
- **MessageBus** 通过文件收件箱传递普通消息、结果和控制事件
- **运行时投递** 消费 Lead 的收件箱，把团队事件注入下一轮对话
- **共享任务板** 让空闲队友发现 ready task，并在锁内完成认领
- **可选 worktree** 把任务绑定到另一个工作目录
- **类型化协议和计划闸门** 显式记录关机与审批状态，计划获批前阻止修改型工具

与 s06 Subagent 的区别：

| | s06 Subagent | s13 队友 |
|---|---|---|
| 生命周期 | 一次调用后结束 | `WORK → IDLE → WORK`，直到关机 |
| 上下文 | 只服务一个任务 | 跨任务保留 |
| 通信 | 返回一次结果 | 接收消息并发出事件 |
| 协作 | 单向委派 | 与 Lead 双向协作 |

> 完整实现见原仓库 [s13_agent_teams/](https://github.com/shareAI-lab/learn-claude-code/tree/main/s13_agent_teams)（README.md + code.py）

## 工作原理

![Team Topology](/img/learn-claude-code/s13-team-topology.svg)

**MessageBus 把通信放在模型上下文之外**。Lead 和队友不能共享同一个 messages 数组。每个 Agent 一个 `.mailboxes/<name>.jsonl` 收件箱，锁保护并发读写，`Condition` 支持消息到达唤醒与 IDLE 短时等待：

```python
class MessageBus:
    def send(self, from_agent, to_agent, content, msg_type="message", metadata=None):
        msg = {"from": from_agent, "to": to_agent, "content": content,
               "type": msg_type, "metadata": metadata or {}}
        with self._changed:
            with self._path(to_agent).open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(msg, ensure_ascii=True) + "\n")
            self._changed.notify_all()

    def wait_for_messages(self, agent, timeout=None):
        # 等待消息到达，或超时返回
        ...
```

**结果与 IDLE 是两个事件**：`result` 回答"这项任务产出了什么"，`idle_notification` 回答"这个队友能否继续接任务"。运行时消费 Lead 收件箱后自动唤醒下一轮——Lead 启动队友后结束当前轮次，不需要轮询。

**IDLE 先看收件箱，再找 ready task**：关机、计划审批和 Lead 直接指令优先于临时发现的工作。

**发现和认领分两步，认领必须原子执行**：扫描只是某一时刻的快照（其他队友甚至其他 Harness 进程可能看到同一任务），所有权变更必须在进程内锁 + 文件锁内完成：

```python
def claim_task(task_id: str, owner: str) -> str:
    with task_store_lock():
        task = load_task(task_id)
        if task.status != "pending" or task.owner is not None:
            return "Task is no longer available"
        if _owner_in_progress(owner):
            return "Owner must complete its current task first"
        if not can_start(task_id):
            return "Task is blocked"
        cwd, error = task_worktree_cwd(task)
        if error:
            return f"Cannot claim {task_id}: {error}"
        task.owner = owner
        task.status = "in_progress"
        save_task(task)
        teammate_assignments[owner] = {"task_id": task.id, "cwd": cwd}
        return f"Claimed {task.id}"
```

**由任务选择工具的工作目录**：`Task.worktree` 是可选字段。`create_worktree` 只提供给 Lead，要求任务 pending、无人认领、尚未绑定。认领后该队友的 `bash`/`read_file`/`write_file`/`edit_file`/`glob` 都从 assignment 读取目录；未绑定任务解析到 `WORKDIR`；没有认领任务的队友不能使用工作区工具。**Worktree 只分离 Git 工作目录，不是安全沙箱**；移除是宿主函数，模型不能调用。

![Team Protocols](/img/learn-claude-code/s13-team-protocols-overview.svg)

**控制消息使用类型和 request_id**。关机和审批不靠猜测消息意图，而是结构化协议：ID 把回复关联到请求，类型阻止不匹配的回复修改状态，状态阻止同一回复重复生效：

```text
Lead 创建 pending 状态的关机请求
  → shutdown_request(request_id) 进入队友收件箱
  → 队友完成当前步骤
  → shutdown_response(request_id) 返回 Lead
  → pending 变为 approved，队友循环退出
```

**计划审批约束执行**：`plan_gates` 状态为 `required`/`pending`/`rejected` 时，队友可以读文件、修改计划，但工具分发层直接拒绝 `bash`/`write_file`/`edit_file`。提交计划时记录 task 和 work version，审批返回时两者一致才生效；认领或释放任务会使旧审批失效。

## 接下来

Lead 和队友目前只能调用直接写在 `code.py` 里的工具。接入 Jira、部署平台或知识库时，每增加一个服务都要重写工具定义和调用逻辑。

s14 MCP Tools → 通过统一的发现与调用协议，在运行时连接外部服务并把它们的工具加入工具池。

## 完整源码

<details>
<summary>s13_code.py（点击展开，共 1621 行）</summary>

<CodeBlock language="python" title="s13_code.py">{s13code}</CodeBlock>

</details>
