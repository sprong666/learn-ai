---
title: "s12 Cron Scheduler：按时间启动任务"
description: "CronJob / 持久化调度 / 会话级触发"
sidebar_position: 12
---

import CodeBlock from '@theme/CodeBlock';
import s12code from '!!raw-loader!./code/s12_code.py';

# s12 Cron Scheduler：按时间启动任务

> 给 Agent 装一个闹钟——到点后把对应 prompt 加入待执行队列，Agent 空闲时交给 Agent Loop。

## 问题

s11 解决的是命令开始后的执行方式：耗时的 Bash 命令可以在后台运行。但它不会记录某项工作应该在什么时间开始，也没有组件持续检查当前时间。

对于"每天早上 9 点跑测试"或"每 30 分钟检查 CI 状态"，如果只依靠当前的 Agent Loop，用户仍要在每次到点后重新发送 prompt。Harness 需要保存执行时间，到点后把对应的 prompt 加入待执行队列，再在 Agent 空闲时交给 Agent Loop。

## 解决方案

![Cron Scheduler Overview](/img/learn-claude-code/s12-cron-scheduler-overview.svg)

调度线程在本地时间匹配到任务时（如 `0 9 * * *` + `run tests`），把 `[Scheduled] run tests` 放进 `cron_queue`。队列处理线程等到 Agent 空闲后启动一轮 Agent Loop，模型随后调用 Bash 执行测试。

s12 保留 s04 的五个基础工具和 Hooks，增加 `schedule_cron`、`list_crons`、`cancel_cron`。不包含 s11 的后台命令——这里传递的是一条待执行的 prompt，不是后台命令的执行结果。

> 完整实现见原仓库 [s12_cron_scheduler/](https://github.com/shareAI-lab/learn-claude-code/tree/main/s12_cron_scheduler)（README.md + code.py）

## 工作原理

**CronJob 保存什么**：

```python
@dataclass
class CronJob:
    id: str
    cron: str
    prompt: str
    recurring: bool
    durable: bool
    pending_delivery: bool = False   # 已到期但尚未被模型接收
    last_fired: str | None = None    # 防止同一分钟重复入队
```

五段式表达式（分/时/日/月/星期），支持 `*`、`*/N`、`N`、`N-M`、`N,M,...`；保存前 `validate_cron()` 拒绝字段数量或取值范围不正确的表达式。

**到期后先入队**：调度线程每秒读取本地时间，表达式匹配且当前分钟未触发时，先保存 `pending_delivery` 和 `last_fired`，再放进内存队列。持久化失败时恢复原状态，不把只存在于内存中的任务暴露给队列处理线程。

**Agent 空闲后再交付**：队列处理线程不判断时间，用 `agent_lock` 避免定时任务与用户回合并发修改会话：

```python
def queue_processor_loop(stop_event=RUNTIME_STOP):
    while not stop_event.wait(0.2):
        if not has_cron_queue() or not agent_lock.acquire(blocking=False):
            continue
        try:
            if has_cron_queue():
                run_agent_turn_locked()
        finally:
            agent_lock.release()
```

Agent Loop 从队列取出到期任务，作为新的用户消息追加：

```python
fired = consume_cron_queue()
for job in fired:
    messages.append({"role": "user", "content": f"[Scheduled] {job.prompt}"})
```

模型调用失败时，消息从当前会话移除、任务放回队列；成功后一次性任务删除，周期任务清除 `pending_delivery`。这是**至少一次**交付。

**持久化与运行边界**：

| 模式 | 保存位置 | 进程重启后 |
|---|---|---|
| `durable=True` | `.scheduled_tasks.json` | 重新加载 |
| `durable=False` | 内存 | 消失 |

- Agent 进程关闭后调度线程也停止；`durable` 只保留任务定义，**不补跑停机期间错过的时间点**
- 定时回合中需要交互确认的工具调用会被拒绝，不与主终端抢输入
- 需要关机后仍按时执行 → 用系统 crontab、systemd timer 等外部调度服务

## 接下来

调度器可以在指定时间启动一轮 Agent Loop，但这一轮仍由一个 Agent 处理。面对需要同时调查多个模块、并行修改并汇总结果的任务，Harness 还需要把工作分给多个 Agent。

s13 Agent Teams → Lead 分配任务，队友独立执行，再通过收件箱返回结果。

## 完整源码

<details>
<summary>s12_code.py（点击展开，共 663 行）</summary>

<CodeBlock language="python" title="s12_code.py">{s12code}</CodeBlock>

</details>
