---
title: "s07 Skill Loading：用到时再加载"
description: "SkillLoader / 技能目录 / 按需注入"
sidebar_position: 7
---

import CodeBlock from '@theme/CodeBlock';
import s07code from '!!raw-loader!./code/s07_code.py';

# s07 Skill Loading：用到时再加载

> system prompt 保存技能目录；`load_skill` 返回完整的 `SKILL.md`。
>
> **Harness 层**：知识加载 — 让模型先知道有哪些技能，再按名称读取内容。

## 问题

假设某个项目有一套 React 组件规范、一份 SQL 风格指南和一份 API 设计文档。我们希望 Agent 开发时遵守这些规范，最直接的做法是把它们全部放进 system prompt：

```python
SYSTEM = (
    f"You are a coding agent. "
    + open("docs/react-style.md").read()
    + open("docs/sql-style.md").read()
    + open("docs/api-design.md").read()
)
```

问题在于，三份文档被固定放进 system prompt，无法根据当前任务只选择需要的那一份。当前任务只改 React 组件时，SQL 风格指南和 API 设计文档与任务无关，却仍然占用输入 token 和上下文窗口，留给代码、对话和工具结果的空间也会变少。

## 解决方案

![Skill Overview](/img/learn-claude-code/s07-skill-overview.svg)

启动时，`SkillLoader` 扫描 `skills/*/SKILL.md`，读取 YAML frontmatter 中的 `name` 和 `description`，并把这份目录加入 system prompt。模型需要完整说明时，调用 `load_skill(name)`；返回的 `SKILL.md` 作为 `tool_result` 追加到消息列表。

| 内容 | 进入模型的位置 | 何时加入 |
|------|----------------|----------|
| 技能名称和描述 | system prompt | 启动时 |
| 完整 `SKILL.md` | `tool_result` | 调用 `load_skill` 时 |

> 完整实现见原仓库 [s07_skill_loading/](https://github.com/shareAI-lab/learn-claude-code/tree/main/s07_skill_loading)（README.md + code.py）

## 工作原理

每个技能是一个包含 `SKILL.md` 的目录：

```text
skills/
  agent-builder/SKILL.md
  code-review/SKILL.md
  mcp-builder/SKILL.md
  pdf/SKILL.md
```

**扫描技能**：`SkillLoader.scan()` 解析 frontmatter，缺失时降级——name 用目录名，description 用正文首行：

```python
class SkillLoader:
    def scan(self):
        self.skills.clear()
        skills_root = self.skills_dir.resolve()
        for manifest in sorted(self.skills_dir.glob("*/SKILL.md")):
            if (not manifest.is_file()
                    or not manifest.resolve().is_relative_to(skills_root)):
                continue
            content = manifest.read_text(encoding="utf-8")
            metadata, body = self.parse_frontmatter(content)
            raw_name = metadata.get("name")
            name = raw_name.strip() if isinstance(raw_name, str) else ""
            name = name or manifest.parent.name
            raw_description = metadata.get("description")
            description = (raw_description.strip()
                           if isinstance(raw_description, str) else "")
            description = description or body.split("\n", 1)[0]
            description = " ".join(str(description).lstrip("# ").split())
            self.skills[name] = {
                "name": name,
                "description": description,
                "content": content,
            }
```

`catalog()` 只输出名称和描述：

```text
- code-review: Perform thorough code reviews...
- pdf: Process PDF files...
```

**组装 system prompt**：技能目录随 `assemble_system_prompt()` 注入；`load_skill` 是一个普通工具，返回完整 `SKILL.md`：

```python
SKILL_TOOL = {
    "name": "load_skill",
    "description": "Load the full SKILL.md content for a named skill.",
    "input_schema": {
        "type": "object",
        "properties": {"name": {"type": "string"}},
        "required": ["name"],
    },
}

def run_load_skill(name: str) -> str:
    skill = LOADER.skills.get(name)
    if not skill:
        return f"Unknown skill: {name}. Available: {LOADER.catalog()}"
    return skill["content"]
```

## 接下来

技能可以按需加载了，但会话本身还在持续膨胀：读过的文件、跑过的命令都留在 `messages` 里，早晚超过上下文上限。

s08 Context Compact → 上下文总会满，要有办法腾地方。四步压缩管线，低成本的操作优先执行。

## 完整源码

<details>
<summary>s07_code.py（点击展开，共 325 行）</summary>

<CodeBlock language="python" title="s07_code.py">{s07code}</CodeBlock>

</details>
