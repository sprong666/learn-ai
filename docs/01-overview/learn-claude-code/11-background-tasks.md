---
title: "s11 Background Tasks：慢操作放后台"
description: "后台线程执行 / 占位结果 / task_notification 通知"
sidebar_position: 11
---

import CodeBlock from '@theme/CodeBlock';
import s11code from '!!raw-loader!./code/s11_code.py';

# s11 Background Tasks：慢操作放后台

> *"慢操作放后台，Agent Loop 继续运行"* — 后台线程执行命令，后续轮次收集完成结果。
>
> **Harness 层**：后台 — 异步执行, 不阻塞主循环。

## 问题

读取文件或运行 `git status` 通常很快，同步执行时等待并不明显。但安装依赖、执行完整测试或构建项目可能持续几分钟。命令返回前，Harness 无法处理当前响应中的下一个工具调用，也不能进入下一轮。

如果后续工作并不依赖这个命令，继续等待就没有必要。s11 要解决的是：让耗时的 Bash 命令在后台执行，使 Agent Loop 可以继续处理其他工作，并在后续轮次收集完成结果。

## 解决方案

![Background Tasks Overview](/img/learn-claude-code/s11-background-tasks-overview.svg)

把慢操作放入后台线程：当前工具调用先返回一个占位 `tool_result`，Agent Loop 继续运行；后续轮次开始时再收集已完成的结果，以通知形式加入对话。

| | 同步 (s04) | 后台 (s11) |
|---|---|---|
| 慢操作 | 当前工具调用被阻塞 | 后台线程执行 |
| Agent Loop | 等待命令返回 | 收到占位结果后继续运行 |
| 结果 | 命令结束后返回 | 先返回 `bg_id`，后续轮次收集 |

**判断标准**：模型通过 bash 工具的 `run_in_background` 参数显式请求。只有参数明确为 `true` 且工具是 bash 时才进后台路径——不再根据 `install`、`build`、`test` 等关键词猜测。

> 完整实现见原仓库 [s11_background_tasks/](https://github.com/shareAI-lab/learn-claude-code/tree/main/s11_background_tasks)（README.md + code.py）

## 工作原理

**BackgroundManager** 保存任务状态和完成队列。`start()` 先登记任务，再启动 daemon 线程，并立即返回 `bg_id`：

```python
class BackgroundManager:
    def __init__(self):
        self.tasks = {}
        self.results = {}
        self._ready = []
        self._lock = threading.Lock()

    def start(self, block) -> str:
        # 登记任务，再在 daemon 线程中运行 _run()，立即返回 bg_id
        ...

    def _run(self, task_id: str, command: str):
        output, exit_code = _run_bash_process(command)
        status = "completed" if exit_code == 0 else "failed"
        with self._lock:
            self.tasks[task_id]["status"] = status
            self.results[task_id] = _format_bash_result(output, exit_code)
            self._ready.append(task_id)
```

命令非零退出或 worker 异常时进入 `failed`。Shell 在独立进程组中启动；命令完成、超时或 Agent 退出（含 SIGTERM）时停止原进程组——这是生命周期清理，**不是沙箱**。

**通知收集**：后续轮次开始时 `collect()` 从完成队列取出结果，格式化为 `<task_notification>`。通知**不复用原始 `tool_use_id`**——原始 tool call 已用占位结果回复，一个 `tool_use` 仍然只对应一个 `tool_result`。后台结果不会主动唤醒 Agent。

**循环中的集成**：每次调用 LLM 前先收集已完成的后台结果；`execute_tool()` 仍先跑 `PreToolUse`，再选择同步或后台：

```python
while True:
    inject_background_results(messages)
    response = client.messages.create(...)

def execute_tool(block) -> str:
    blocked = trigger_hooks("PreToolUse", block)
    if blocked is not None:
        return str(blocked)
    if should_run_background(block.name, block.input):
        task_id = start_background_task(block)
        output = f"[Background task {task_id} started]"
    else:
        output = call_tool(block)
    trigger_hooks("PostToolUse", block, output)
    return output
```

**时间线示例**：

```text
Turn 1: bash "npm install" (run_in_background=true)
        → bg_0001 占位结果 → 模型：继续读 config
Turn 2: read_file "package.json"（同步，快）
Turn 3: 收集 bg_0001 通知
        → 模型同时看到 config 内容 + install 结果
```

## 接下来

后台任务解决了"慢操作不阻塞"。但如果想定时做某件事呢？"每天早上 9 点跑测试"、"每 5 分钟检查一次服务器状态"。

s12 Cron Scheduler → 给 Agent 装一个闹钟。

## 完整源码

<details>
<summary>s11_code.py（点击展开，共 445 行）</summary>

<CodeBlock language="python" title="s11_code.py">{s11code}</CodeBlock>

</details>
