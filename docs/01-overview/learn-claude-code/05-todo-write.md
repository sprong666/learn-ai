---
title: "s05 TodoWrite：没有计划的 Agent，做着做着就偏了"
description: "TodoItem / 先计划后执行 / reminder 机制"
sidebar_position: 5
---

import CodeBlock from '@theme/CodeBlock';
import s05code from '!!raw-loader!./code/s05_code.py';

# s05 TodoWrite：没有计划的 Agent，做着做着就偏了

> *"没有计划的 agent 走哪算哪"* — 先列步骤再动手，长任务更不容易漏项。
>
> **Harness 层**：规划 — 让 Agent 在动手之前先想清楚。

## 问题

给 Agent 一个复杂任务："把所有 Python 文件改成 snake_case 命名，然后跑测试，修好失败。"

Agent 开始干活，改了 3 个文件，跑了个测试，发现 2 个失败，开始修。修着修着，它忘了最初是"改成 snake_case"，测试失败把注意力全吸走了。

对话越长越严重：工具结果不断填满上下文，系统提示的影响力被稀释。一个 10 步重构，做完 1-3 步就开始即兴发挥，因为 4-10 步已经被挤出注意力了。

## 解决方案

![Todo Overview](/img/learn-claude-code/s05-todo-overview.svg)

s05 保留 s04 的工具分发、权限检查和 Hooks，再加入 `todo_write` 工具与 reminder 计数器。`todo_write` 只更新计划状态，实际工作仍由原有工具完成。

`TodoManager` 持有内存中的任务列表，负责校验更新，并把渲染结果返回给模型：

- 状态标记：`[ ]` pending / `[>]` in_progress / `[x]` completed
- 约束：一次最多 20 项、content 非空、**同一时间只能有一个 in_progress**；字符串输入可以是 JSON 或 Python 列表表示，解析不使用 `eval`

**Reminder 机制**：连续三个工具调用轮次没有使用 `todo_write` 时，reminder 追加到第三轮的工具结果中，随后计数器清零。

> 完整实现见原仓库 [s05_todo_write/](https://github.com/shareAI-lab/learn-claude-code/tree/main/s05_todo_write)（README.md + code.py）

## 工作原理

**TodoManager 与工具注册**：

```python
class TodoManager:
    def __init__(self):
        self.items = []

    def update(self, todos: list | str) -> str:
        # 解析并校验后整体替换当前列表
        validated = []
        ...
        self.items = validated
        return self.render()

    def render(self) -> str:
        # [ ] pending, [>] in progress, [x] completed
        ...

TODO = TodoManager()

def run_todo_write(todos: list | str) -> str:
    output = TODO.update(todos)
    print(output)
    return output
```

工具定义和其他 5 个工具一起加入 dispatch map：

```python
{"name": "todo_write",
 "input_schema": {
     "type": "object",
     "properties": {
         "todos": {
             "type": "array",
             "items": {
                 "type": "object",
                 "properties": {
                     "content": {"type": "string"},
                     "status": {"type": "string",
                                "enum": ["pending", "in_progress", "completed"]},
                 },
             },
         },
     },
 },
}
```

**Reminder 注入**：

```python
rounds_since_todo = 0 if used_todo else rounds_since_todo + 1
if rounds_since_todo >= 3:
    results.append({
        "type": "text",
        "text": "<reminder>Update your todos.</reminder>",
    })
    rounds_since_todo = 0
```

Agent 收到任务后的典型流程：先调 `todo_write` 列出所有步骤（全 `pending`）→ 做一个步骤，改成 `in_progress` → 做完改成 `completed` → 看下一个 `pending` → 继续。

**关键洞察**：todo_write 不给 Agent 增加任何**执行能力**。它增加的是**规划能力**。

## 接下来

Agent 能计划了。但如果一个任务太大，比如"重构整个认证模块"，光靠 TODO 列表不够。这个任务本身就是几十个小任务的集合，放在同一个对话里会被上下文淹没。

s06 Subagent → 把大任务拆成子任务，每个子任务派一个独立的 Agent。它们有自己的干净上下文，不会互相污染。

## 完整源码

<details>
<summary>s05_code.py（点击展开，共 305 行）</summary>

<CodeBlock language="python" title="s05_code.py">{s05code}</CodeBlock>

</details>
