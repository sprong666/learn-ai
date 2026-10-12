---
title: "s04 Hooks：挂在循环上，不写进循环里"
description: "PreToolUse / PostToolUse / UserPromptSubmit / Stop 四个扩展点"
sidebar_position: 4
---

import CodeBlock from '@theme/CodeBlock';
import s04code from '!!raw-loader!./code/s04_code.py';

# s04 Hooks：挂在循环上，不写进循环里

> *"挂在循环上, 不写进循环里"* — hook 在工具执行前后注入扩展逻辑。
>
> **Harness 层**：hook — 扩展点不侵入循环。

## 问题

s03 的 Agent 有权限检查了。但每次加一个新检查——"记录每次 bash 调用"、"操作后自动 git add"——都要修改 `agent_loop` 函数。你想扩展的是 Agent 的行为，但你改的却是循环本身。**循环应该是一个稳定的核心，扩展应该挂在外面。**

## 解决方案

![Hooks Overview](/img/learn-claude-code/s04-hooks-overview.svg)

s03 的循环和权限逻辑完全保留。唯一的变动是把 `check_permission()` 从循环体内移到了 hook 上：循环不再直接调用任何检查函数，改为 `trigger_hooks("PreToolUse", block)`，由注册表决定跑什么。

四个事件，覆盖一个完整的 agent cycle：

| 事件 | 触发时机 | 典型用途 |
|------|---------|---------|
| UserPromptSubmit | 用户输入提交后、进入 LLM 前 | 输入验证、注入上下文 |
| PreToolUse | 工具执行前 | 权限检查、日志记录 |
| PostToolUse | 工具执行后 | 副作用（自动 git add 等）、输出检查 |
| Stop | 循环即将退出时 | 收尾清理、决定是否继续循环 |

> 完整实现见原仓库 [s04_hooks/](https://github.com/shareAI-lab/learn-claude-code/tree/main/s04_hooks)（README.md + code.py）

## 工作原理

**hook 注册表**：一个字典，事件名映射到回调列表。`PreToolUse` 返回非 `None` 时，本次工具执行被阻止；`Stop` 返回非 `None` 时，注入该消息并**继续循环**；其余两个的返回值不参与控制流。

```python
HOOKS = {"UserPromptSubmit": [], "PreToolUse": [], "PostToolUse": [], "Stop": []}

def register_hook(event: str, callback):
    HOOKS[event].append(callback)

def trigger_hooks(event: str, *args):
    for callback in HOOKS[event]:
        result = callback(*args)
        if result is not None:   # 返回值 ≠ None → hook 说"停"
            return result
    return None
```

**UserPromptSubmit**——用户输入提交后、进入 LLM 前触发，例如记录当前工作目录：

```python
def context_inject_hook(query: str) -> str | None:
    print(f"[HOOK] UserPromptSubmit: working in {WORKDIR}")
    return None   # return None = 不修改，放行

register_hook("UserPromptSubmit", context_inject_hook)
```

**PreToolUse / PostToolUse**——s03 的权限检查逻辑包装成 PreToolUse hook，再加日志和大输出提醒：

```python
def permission_hook(block):
    if block.name == "bash":
        for pattern in DENY_LIST:
            if pattern in block.input.get("command", ""):
                return "Permission denied by deny list"
    if block.name in ("read_file", "write_file", "edit_file"):
        path = block.input.get("path", "")
        if not (WORKDIR / path).resolve().is_relative_to(WORKDIR):
            choice = input("   Allow? [y/N] ").strip().lower()
            if choice not in ("y", "yes"):
                return "Permission denied by user"
    return None

def log_hook(block):
    print(f"[HOOK] {block.name}(...)")

def large_output_hook(block, output):
    if len(str(output)) > 100000:
        print(f"[HOOK] ⚠ Large output from {block.name}")

register_hook("PreToolUse", permission_hook)
register_hook("PreToolUse", log_hook)
register_hook("PostToolUse", large_output_hook)
```

**Stop**——循环即将退出时触发，返回字符串可强制续轮：

```python
def summary_hook(messages: list) -> str | None:
    tool_count = sum(1 for m in messages
                     for b in (m.get("content") if isinstance(m.get("content"), list) else [])
                     if isinstance(b, dict) and b.get("type") == "tool_result")
    print(f"[HOOK] Stop: session used {tool_count} tool calls")
    return None   # return None = 允许停止；返回字符串 = 强制继续

register_hook("Stop", summary_hook)
```

**循环里只改了一处**：`check_permission(block)` → `trigger_hooks("PreToolUse", block)`：

```python
for block in tool_calls:
    blocked = trigger_hooks("PreToolUse", block)
    if blocked:
        results.append({"type": "tool_result", "tool_use_id": block.id,
                        "content": str(blocked)})
        continue

    handler = TOOL_HANDLERS.get(block.name)
    output = handler(**block.input) if handler else f"Unknown: {block.name}"

    trigger_hooks("PostToolUse", block, output)
    results.append({"type": "tool_result", "tool_use_id": block.id,
                    "content": output})
```

四个 hook 覆盖了 agent cycle 的关键节点：输入 → 执行前 → 执行后 → 退出。循环只负责调用 `trigger_hooks()`，具体逻辑全在 hook 回调里。

## 接下来

Agent 现在能安全执行操作了。但它有没有停下来想过"我应该先做什么，再做什么"？给它一个复杂任务，它是一上来就动手，还是先列个计划？

s05 TodoWrite → 给 Agent 一个计划工具。先列清单，再做。

## 完整源码

<details>
<summary>s04_code.py（点击展开，共 235 行）</summary>

<CodeBlock language="python" title="s04_code.py">{s04code}</CodeBlock>

</details>
