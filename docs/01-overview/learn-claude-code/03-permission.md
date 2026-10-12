---
title: "s03 Permission：执行前做权限判断"
description: "PermissionRule / 审批管线 / 三道闸门"
sidebar_position: 3
---

import CodeBlock from '@theme/CodeBlock';
import s03code from '!!raw-loader!./code/s03_code.py';

# s03 Permission：执行前做权限判断

> *"工具执行前先做权限判断"* — 权限管线决定哪些操作需要审批。
>
> **Harness 层**：权限 — 在工具执行前加一道门。

## 问题

s02 的 Agent 有 5 个工具。file tools 受 `safe_path` 保护，但 bash 不受限制。让它"清理一下项目"，可能执行 `rm -rf /`。

安全边界由代码负责，判断发生在工具执行之前。

## 解决方案

![Permission Overview](/img/learn-claude-code/s03-permission-overview.svg)

s02 的循环完全保留。唯一的变动是在工具执行前插入 `check_permission()`。每个工具调用依次经过三道闸门：硬拒绝优先，软询问次之，都没命中就放行。

| 闸门 | 作用 | 命中后 |
|------|------|--------|
| 1. 拒绝列表 | 永远禁止的操作（`rm -rf /`、`sudo`） | 直接拒绝，不执行 |
| 2. 规则匹配 | 取决于上下文的操作（读/写工作区外、`rm` 文件） | 交给闸门 3 |
| 3. 用户审批 | 闸门 2 命中后，暂停等用户确认 | 用户决定允许或拒绝 |

三道都没命中 → 直接执行。大部分日常操作走这条路。

> 完整实现见原仓库 [s03_permission/](https://github.com/shareAI-lab/learn-claude-code/tree/main/s03_permission)（README.md + code.py）

## 工作原理

![Permission Pipeline](/img/learn-claude-code/s03-permission-pipeline.svg)

**闸门 1**：一张硬拒绝表，先查，命中就返回阻止信息。这张表使用简单字符串匹配来说明权限闸门的位置，不能视为完整的安全边界。

```python
DENY_LIST = ["rm -rf /", "sudo", "shutdown", "reboot", "mkfs", "dd if=", "> /dev/sda"]

def check_deny_list(command: str) -> str | None:
    for pattern in DENY_LIST:
        if pattern in command:
            return f"Blocked: '{pattern}' is on the deny list"
    return None
```

**闸门 2** 规则匹配，描述"什么时候需要问用户"。正则用于识别独立的破坏性命令单词（避免误伤 `model`、`delimiter`）：

```python
DESTRUCTIVE_COMMAND_WORD = re.compile(
    r"(?i)(?:^|[;&|()\n])\s*(?:rm|del)(?=\s|$|[;&|()])"
)

PERMISSION_RULES = [
    {
        "tools": ["read_file", "write_file", "edit_file"],
        "check": lambda args: not (WORKDIR / args.get("path", "")).resolve().is_relative_to(WORKDIR),
        "message": "Access outside workspace",
    },
    {
        "tools": ["bash"],
        "check": lambda args: contains_destructive_command(args.get("command", "")) or any(
            kw in args.get("command", "") for kw in ["rm ", "> /etc/", "chmod 777"]
        ),
        "message": "Potentially destructive command",
    },
]
```

**闸门 3**：规则命中后，暂停等用户输入。

```python
def ask_user(tool_name, args, reason) -> str:
    print(f"\n⚠  {reason}")
    print(f"   Tool: {tool_name}({args})")
    choice = input("   Allow? [y/N] ").strip().lower()
    return "allow" if choice in ("y", "yes") else "deny"
```

**三道闸门串在一起**，插在工具执行之前。被拒绝的调用也要追加 `tool_result`（"Permission denied."），保持消息配对完整：

```python
def check_permission(block) -> bool:
    if block.name == "bash":                      # 闸门 1: 硬拒绝
        reason = check_deny_list(block.input.get("command", ""))
        if reason:
            return False
    reason = check_rules(block.name, block.input) # 闸门 2: 规则匹配
    if reason:
        decision = ask_user(block.name, block.input, reason)  # 闸门 3
        if decision == "deny":
            return False
    return True

# 在 agent_loop 中——s02 的循环只加了一行：
for block in tool_calls:
    if not check_permission(block):
        results.append({... "content": "Permission denied."})
        continue
    output = TOOL_HANDLERS[block.name](**block.input)
    results.append(...)
```

## 接下来

当前权限检查每次都在循环里硬编码 `check_permission()`。加日志？操作后自动 git commit？这些扩展逻辑散落在 loop 里，循环很快就会膨胀。

s04 Hooks → 给循环加钩子，扩展逻辑挂在钩子上，循环保持干净。

## 完整源码

<details>
<summary>s03_code.py（点击展开，共 212 行）</summary>

<CodeBlock language="python" title="s03_code.py">{s03code}</CodeBlock>

</details>
