---
title: "s02 Tool Use：多加一个工具，只加一行"
description: "TOOL_HANDLERS / dispatch map / 多工具调用"
sidebar_position: 2
---

import CodeBlock from '@theme/CodeBlock';
import s02code from '!!raw-loader!./code/s02_code.py';

# s02 Tool Use：多加一个工具，只加一行

> *"加一个工具, 只加一个 handler"* — 循环不用动, 新工具注册进 dispatch map 就行。
>
> **Harness 层**：工具分发 — 扩展模型能触达的边界。

## 问题

s01 的 Agent 只有一个 bash 工具。读文件要 `cat`，写文件要 `echo "..." > file.py`，改文件要 `sed`。

模型想的是"读这个文件"，却要拼出 `cat path/to/file`。多了一层翻译，浪费 token，还容易拼错。

## 解决方案

![Tool Dispatch](/img/learn-claude-code/s02-tool-dispatch.svg)

s01 的循环完全保留（LLM 调用、`tool_use` block 判断、消息追加）。唯一的变动在工具执行那 1 行：`run_bash()` 替换为 `TOOL_HANDLERS[block.name]()` 查表分发。

给 Agent 加一个工具只需要做两件事：

1. **定义工具**：在 `TOOLS` 数组里加一条描述
2. **注册处理函数**：在 `TOOL_HANDLERS` 字典里加一个映射

> 完整实现见原仓库 [s02_tool_use/](https://github.com/shareAI-lab/learn-claude-code/tree/main/s02_tool_use)（README.md + code.py）

## 工作原理

**从 1 个工具到 5 个工具**，每个工具独立定义：

```python
TOOLS = [
    {"name": "bash",       "description": "Run a shell command.", ...},
    {"name": "read_file",  "description": "Read file contents.",  ...},
    {"name": "write_file", "description": "Write content to file.", ...},
    {"name": "edit_file",  "description": "Replace text in file once.", ...},
    {"name": "glob",       "description": "Find files by pattern.", ...},
]
```

每个工具有自己的实现函数：

```python
def run_read(path, limit=None):
    lines = safe_path(path).read_text(encoding="utf-8").splitlines()
    if limit:
        lines = lines[:limit]
    return "\n".join(lines)

def run_edit(path, old_text, new_text):
    text = safe_path(path).read_text(encoding="utf-8")
    if old_text not in text:
        return "Error: text not found"
    safe_path(path).write_text(text.replace(old_text, new_text, 1), encoding="utf-8")
    return f"Edited {path}"

def run_glob(pattern):
    matches = sorted(set(glob(pattern, root_dir=WORKDIR, recursive=True)))
    shown = matches[:200]
    if len(matches) > 200:
        shown.append("... (more matches omitted; narrow the pattern)")
    return "\n".join(shown)
```

**工具分发**：

```python
TOOL_HANDLERS = {
    "bash":       run_bash,
    "read_file":  run_read,
    "write_file": run_write,
    "edit_file":  run_edit,
    "glob":       run_glob,
}

# 循环里只改了一行——从硬编码 run_bash 变成查表：
for block in tool_calls:
    handler = TOOL_HANDLERS[block.name]    # 查表
    output = handler(**block.input)         # 调用
    results.append(...)
```

**多个工具调用**：模型经常一次返回多个 tool_use（"读一下 a.py 和 b.py，然后列出所有 .py 文件"）。这些调用按照 `response.content` 中的**原始顺序逐个执行**。

| 概念 | 一句话 |
|------|--------|
| TOOL_HANDLERS | 工具名 → 处理函数的字典。加工具 = 加一行映射 |
| 工具定义 | 告诉模型"我能做什么"的 JSON schema |
| 多工具调用 | 模型可一次返回多个 tool_use，按原始顺序逐个执行 |
| 循环不变 | s01 的 `while True` 循环一行都没改 |

file tools 还加入了 `safe_path` 校验（防路径逃逸），但 bash 仍不受限制——这是 s03 的引子。

## 接下来

现在 Agent 有 5 个专用工具。file tools 受 `safe_path` 保护，但 bash 不受限制，`rm -rf /` 还是能跑。

s03 Permission → 在工具执行之前加一道门：这个操作安全吗？需要用户批准吗？

## 完整源码

<details>
<summary>s02_code.py（点击展开，共 167 行）</summary>

<CodeBlock language="python" title="s02_code.py">{s02code}</CodeBlock>

</details>
