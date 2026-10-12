---
title: "s16 Workflow Runtime：模型决定单步，脚本决定编排"
description: "编排原语 / journal 续跑 / 稳定调用键 / 结构化输出"
sidebar_position: 16
---

import CodeBlock from '@theme/CodeBlock';
import s16code from '!!raw-loader!./code/s16_code.py';

# s16 Workflow Runtime：模型决定单步，脚本决定编排

> *"一次 tool_use，跑完一整套编排"* — `Workflow` 工具启动一个可恢复的脚本运行时，协调多次 agent 调用。
>
> **Harness 层**：编排 — 在单 agent 循环之上，执行保存好的多 agent 脚本。

## 问题

从 s01 到 s15，每一轮都由模型决定调用哪些工具。当后续路径取决于上一步发现了什么时，这种方式很合适。

但有些任务会重复一套固定流程。例如代码审查：同时检查多个维度，再逐条验证发现、合并重复项并按严重程度排序。执行前已经知道步骤及其先后关系，这时宿主需要三样东西：

- **并行**，别一个一个串着等
- **稳定的结果结构**，即使每个 agent 的回答会变化
- **可恢复**，跑到一半断了，已经做完的部分别从头再来

如果这套编排只存在于对话历史里，步骤顺序和检查点也只存在于历史里。

## 解决方案

![Workflow Runtime 总览](/img/learn-claude-code/s16-workflow-runtime-overview.svg)

在工具池里加入一个 `Workflow` 工具。宿主注册由 `agent() / parallel() / pipeline() / phase()` 组成的**可信脚本**；模型只提供保存好的 workflow 名称、参数和可选的续跑 run ID，**不提交可执行代码**。

workflow 以一次 `tool_use` 进入主循环。脚本运行时发出生命周期和进度事件，每一步写进磁盘上的 journal。脚本里的中间结果存在变量里，不塞进对话历史。下次用 `resume_from_run_id` 重启时，没改过的 `agent()` 直接使用 journal 中的结果。

模型可见的 schema 只接受 `name`、`args` 和 `resume_from_run_id`：

```python
WORKFLOW_TOOL = {
    "name": "Workflow",
    "input_schema": {
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "args": {"type": "object"},
            "resume_from_run_id": {"type": "string"},
        },
        "required": ["name"],
        "additionalProperties": False,
    },
}
```

> 完整实现见原仓库 [s16_workflow_runtime/](https://github.com/shareAI-lab/learn-claude-code/tree/main/s16_workflow_runtime)（README.md + code.py）

## 工作原理

**编排原语**。脚本收到只暴露少量原语的 `ExecutionState`，不直接读写文件、不运行 shell：

| 原语 | 作用 |
|------|------|
| `agent(prompt, {schema, label, phase})` | 派一个子 agent 干活 |
| `parallel(thunks)` | **等齐屏障**：所有任务并行跑完，一起等结果回来 |
| `pipeline(items, *stages)` | 每个 item 分阶段跑，**不等齐**，跑完一个往下走一个 |
| `phase(title)` / `log(message)` | 标记进度阶段 / 打日志 |
| `workflow(name, args)` | 嵌套子工作流（只支持一层） |

item 独立走多阶段用 `pipeline`；下一步必须同时用上一阶段全部结果时，用 `parallel` 等齐：

```python
async def pipeline(self, items, *stages):
    async def run_item(item, idx):
        value = item
        for stage in stages:            # 每个 item 独立跑完所有 stage
            value = await stage(value, item, idx)
        return value
    return await asyncio.gather(*[run_item(it, i) for i, it in enumerate(items)])
```

**结构化输出**。`agent({schema})` 要求子 agent 只返回匹配 schema 的 JSON，不合法重试一次再报错——s05 说过工具的参数不能全信；这里是同一个道理反过来：**子 agent 的输出也不能全信**：

```python
run = await asyncio.to_thread(self.runner.run, prompt, schema, label)
result = run.value
if schema is not None:
    ok, err = SimpleJsonSchema(schema).validate(result)
    if not ok:
        retry = await asyncio.to_thread(
            self.runner.run, prompt + "\n\n返回合法的 JSON。", schema, label)
        result = retry.value
        ok, err = SimpleJsonSchema(schema).validate(result)
        if not ok:
            raise WorkflowInputError(f"agent({{schema}}) 输出不合法: {err}")
```

**存储：快照 + journal，断了能续**。`.runtime/` 下保存快照 `<runId>.json`、输出、journal `<runId>.journal.jsonl` 和锁文件。每次新运行用排他式文件创建预留 runId；整次执行和持久化期间持有 run lock。journal 一条条记录每个 `agent()` 的结果：

```python
class WorkflowJournal:
    def record(self, key, value):
        self._f.write(json.dumps({"key": key, "value": value}) + "\n")
        self._f.flush()
        self.cache[key] = value
```

**resume 与稳定调用键**。带着 `resume_from_run_id` 重新调用时，脚本重新执行，但每个 `agent()` 都计算一个**确定的语义 key**：journal 命中直接返回缓存。关键点：**key 不能依赖并发完成顺序**（`parallel`/`pipeline` 完成顺序不确定，用"第几个完成"当 key 两次跑就对错位），必须基于调用内容的稳定哈希：

```python
def key(self, kind, label, prompt, schema):
    basis = f"{kind}|{label}|{prompt}|{json.dumps(schema, sort_keys=True)}"
    return f"{kind}-{_stable_hash(basis) % 10**10:010d}"

# agent() 内部：
cached = self.journal.cached(key)
if cached is not MISS:
    self.task.progress_event("workflow_agent", label=label, status="cached")
    return cached
```

**元数据校验前置**：注册时校验 `meta`（name 须为 1-64 字符安全 slug，用于本地产物文件名）——和 s12 校验 cron 表达式同一思路：保存的东西有问题，不要等到执行时才发现。

| | s15 Agent Harness 集成 | s16 Workflow Runtime |
|--|-----------|---------------------|
| 循环 | 单个、模型驱动 | 主循环不变；工具背后执行脚本编排 |
| 谁决定下一步 | 模型逐轮决定 | 脚本预先写好编排流程 |
| 多 agent | 一次性子 agent | 脚本化、可续跑的调用 |

## 接下来

s17 Goal Loop 会使用一个更小、独立的循环检查既定目标是否已经达成，并据此决定是否还需要下一轮。

## 完整源码

<details>
<summary>s16_code.py（点击展开，共 752 行）</summary>

<CodeBlock language="python" title="s16_code.py">{s16code}</CodeBlock>

</details>
