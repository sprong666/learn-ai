---
title: "s14 MCP Tools：发现并调用外部工具"
description: "MCPClient / connect_mcp / 动态工具池"
sidebar_position: 14
---

import CodeBlock from '@theme/CodeBlock';
import s14code from '!!raw-loader!./code/s14_code.py';

# s14 MCP Tools：发现并调用外部工具

> **Harness 层**：MCP Tools — 连接服务、发现工具，并把它们加入 Agent 的工具循环。

## 问题

前面的基础工具都直接写在 `code.py` 里。接入文档系统和部署平台时，可以继续手写 `search_docs`、`deploy_status` 和 `trigger_deploy`，但每增加一个服务，都要重新维护工具定义、参数格式和调用代码；外部系统修改工具，也要跟着改。

MCP 把这部分拆成两个角色：**server 提供工具列表和调用入口，Harness 负责连接、命名、权限检查**，并把发现的工具交给模型。

## 解决方案

![MCP Architecture](/img/learn-claude-code/s14-mcp-architecture.svg)

本章从 s04 的五个基础工具和 Hooks 出发，增加三个部分：

- `MCPClient` 保存 server 返回的工具定义和调用入口
- `connect_mcp` 连接一个 server，并取得它的工具列表
- `assemble_tool_pool` 把基础工具与已连接的 MCP 工具组装到同一个工具池

课程里的 `docs` 和 `deploy` 是进程内模拟 server，用来展示 `tools/list`、`tools/call` 和动态工具池；真实 MCP transport 不在本章实现。

> 完整实现见原仓库 [s14_mcp_plugin/](https://github.com/shareAI-lab/learn-claude-code/tree/main/s14_mcp_plugin)（README.md + code.py）

## 工作原理

**基础 Agent Loop 不需要改变**。每轮调用模型前组装当前工具池，连接新 server 后下一轮自动生效：

```python
def agent_loop(messages: list):
    while True:
        tools, handlers = assemble_tool_pool()
        response = client.messages.create(
            model=MODEL, system=assemble_system_prompt(),
            messages=messages, tools=tools, max_tokens=8000,
        )
        ...
```

**MCPClient**：`register()` 对应工具发现结果，`call_tool()` 对应调用入口。错误返回给模型，不直接结束 Agent Loop——模型可以下一轮修正参数：

```python
class MCPClient:
    def register(self, tool_defs, handlers):
        self.tools = list(tool_defs)
        self._handlers = dict(handlers)

    def call_tool(self, tool_name, args):
        handler = self._handlers.get(tool_name)
        if not handler:
            return f"MCP error: unknown tool '{tool_name}'"
        try:
            return str(handler(**args))
        except Exception as error:
            return f"MCP error: {type(error).__name__}: {error}"
```

**connect_mcp 只负责连接和发现**。开始时模型只看到五个基础工具和 `connect_mcp`；调用 `connect_mcp(name="docs")` 后，下一轮模型调用会看到 `mcp__docs__search`、`mcp__docs__get_version`。

**前缀区分不同 server 的同名工具**：`mcp__{server}__{tool}`。`normalize_mcp_name()` 规范化字符，组装时检查规范化后的名称冲突和 64 字符限制，因此 `docs.one/get.version` 和 `docs_one/get_version` 不会悄悄映射到同一个名字。

**工具定义和 handler 一起加入工具池**。默认参数保存当前 client 和 tool，避免循环里的 lambda 全部指向最后一个工具：

```python
tools.append({
    "name": prefixed,                      # mcp__docs__search
    "description": tool_def.get("description", ""),
    "input_schema": schema,
})
handlers[prefixed] = (
    lambda *, client=server, tool=raw_name, **kwargs:
    client.call_tool(tool, kwargs)
)
```

**权限由宿主配置决定**。server 可以提供 `readOnlyHint` 或 `destructiveHint`，但这些信息来自 server，**不能直接作为授权依据**。本章使用宿主侧策略，未配置的外部工具默认需要用户确认：

```python
MCP_HOST_POLICY = {
    ("docs", "search"): "allow",
    ("docs", "get_version"): "allow",
    ("deploy", "status"): "allow",
    ("deploy", "trigger"): "confirm",
}
```

## 接下来

目前 MCP 还是一条独立的课程分支。s15 Integrated Harness 会把基础工具、Hooks、Skills、Context、Memory、Task、Background、Cron、Teams 和 MCP 放进同一个运行时。

## 完整源码

<details>
<summary>s14_code.py（点击展开，共 464 行）</summary>

<CodeBlock language="python" title="s14_code.py">{s14code}</CodeBlock>

</details>
