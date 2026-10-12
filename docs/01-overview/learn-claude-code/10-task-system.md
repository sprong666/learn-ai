---
title: "s10 Task System：从执行清单到可协调的任务状态"
description: "TaskRecord / blockedBy 依赖图 / 磁盘持久化"
sidebar_position: 10
---

import CodeBlock from '@theme/CodeBlock';
import s10code from '!!raw-loader!./code/s10_code.py';

# s10 Task System：从执行清单到可协调的任务状态

> *"大目标拆成小任务, 排好序, 持久化"* — 文件持久化的任务图, 多 agent 协作的基础。
>
> **Harness 层**：任务 — 持久化的目标, 可恢复的进度。

## 问题

s05 的 TodoWrite 让 Agent 记录当前任务的执行步骤，但清单中的每一项只有内容和状态。

当项目被拆成创建数据库表、编写 API 和添加测试三个任务时，Harness 还需要知道它们之间的关系：数据库表完成后才能编写 API，API 接口确定后才能添加测试。每个任务还要记录由谁负责。TodoWrite 没有记录这些依赖和分工——它可以显示"编写 API"仍未完成，但 Harness 无法据此判断这个任务是否可以开始。

## 解决方案

![Task System Overview](/img/learn-claude-code/s10-task-system-overview.svg)

代码保留 s04 的五个基础工具、Permission、Hooks 和统一 `execute_tool`，再加入 6 个任务工具、`.tasks/` 目录持久化和 `blockedBy` 依赖检查。

| | TodoWrite (s05) | Task System (s10) |
|---|---|---|
| 定位 | 当前任务的执行清单 | 可恢复的任务系统 |
| 存储 | 进程内 / 会话状态 | `.tasks/{id}.json` |
| 依赖 | 无 | `blockedBy` 依赖图 |
| 生命周期 | 当前会话 | 跨会话保留 |
| 分工 | 不负责任务认领 | `owner` / claim |
| 更新契约 | 整表替换 | 单条记录 CRUD |

> 完整实现见原仓库 [s10_task_system/](https://github.com/shareAI-lab/learn-claude-code/tree/main/s10_task_system)（README.md + code.py）

## 工作原理

![Task DAG](/img/learn-claude-code/s10-task-dag.svg)

**数据结构**：每个任务是一个 JSON 文件，ID 使用 `task_` 加 8 位随机十六进制字符，创建时排他写入。

```python
@dataclass
class Task:
    id: str
    subject: str
    description: str
    status: str          # pending | in_progress | completed
    owner: str | None    # 负责当前任务的 Agent
    blockedBy: list[str] # 依赖的任务 ID 列表
```

**两阶段构建契约**：先创建所有节点，再用 `create_task` 返回的 ID 调 `update_task(addBlockedBy=...)` 添加边。原因：模型一条回复里的多个工具调用在任何结果产生前就已确定，某个 `create_task` 无法直接使用另一个调用刚生成的 ID。`update_task` 校验通过后统一保存：目标任务与依赖必须存在、目标必须 pending 且无人认领、不能自依赖或成环。

```python
# 第一阶段：创建所有节点并取得运行时 ID
schema = create_task("setup database schema")
endpoints = create_task("create API endpoints")
tests = create_task("write tests")
docs = create_task("write docs")

# 第二阶段：使用返回的 ID 建立依赖边
update_task(endpoints.id, addBlockedBy=[schema.id])
update_task(tests.id, addBlockedBy=[endpoints.id])
update_task(docs.id, addBlockedBy=[schema.id])
```

**状态机**：`pending ──claim──> in_progress ──complete──> completed`

- `claim_task`：校验 pending + 依赖全部 completed，设置 owner
- `complete_task`：校验 in_progress + owner 匹配，完成后扫描并报告**刚刚被解锁**的下游任务
- `get_task`：返回完整 JSON（跨会话恢复时需要完整描述）
- `can_start`：`blockedBy` 全部 completed 才可开始

```python
def claim_task(task_id: str, owner: str = "agent") -> str:
    task = load_task(task_id)
    if task.status != "pending":
        return f"Task {task_id} is {task.status}, cannot claim"
    dependencies = incomplete_dependencies(task)
    if dependencies:
        return f"Blocked by: {dependencies}"
    task.owner = owner
    task.status = "in_progress"
    TASKS.save(task)
    return f"Claimed {task_id} ({task.subject})"

def complete_task(task_id: str, owner: str = "agent") -> str:
    task = load_task(task_id)
    if task.status != "in_progress":
        return f"Task {task_id} is {task.status}, cannot complete"
    if task.owner != owner:
        return f"Task {task_id} is owned by {task.owner}, not {owner}"
    ready_before = {t.id for t in list_tasks()
                    if t.status == "pending" and t.blockedBy and can_start(t.id)}
    task.status = "completed"
    TASKS.save(task)
    unblocked = [t.subject for t in list_tasks()
                 if t.status == "pending" and t.blockedBy
                 and t.id not in ready_before and can_start(t.id)]
    msg = f"Completed {task_id} ({task.subject})"
    if unblocked:
        msg += f"\nUnblocked: {', '.join(unblocked)}"
    return msg
```

每个 `create_task` 写一个 JSON 文件，`update_task`、`claim_task` 和 `complete_task` 更新文件。跨会话时，`.tasks/` 目录还在，Agent 读文件就能恢复进度。

## 接下来

任务图有了，但全量测试、安装依赖和部署等命令可能需要很长时间。同步执行时，Agent Loop 会一直停在当前工具调用上。

s11 Background Tasks → 把慢操作放到后台，Agent 继续处理其他任务，后台完成后再接收通知。

## 完整源码

<details>
<summary>s10_code.py（点击展开，共 485 行）</summary>

<CodeBlock language="python" title="s10_code.py">{s10code}</CodeBlock>

</details>
