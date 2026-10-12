---
title: Learn Claude Code 系列
description: Agent Harness 工程学习笔记，仿照 shareAI-lab/learn-claude-code 从 Agent Loop 到 Goal Loop 逐章拆解
sidebar_position: 0
---

# Learn Claude Code 系列

> Agency 来自模型，Agent 产品 = 模型 + Harness

学习笔记基于开源课程 [shareAI-lab/learn-claude-code](https://github.com/shareAI-lab/learn-claude-code)，通过 17 章渐进式拆解 Claude Code 的 Harness 工程，每章都是一个独立可运行的 `code.py`。

## 章节

| 章 | 主题 | 关键概念 |
| --- | --- | --- |
| [s01](agent-loop) | Agent Loop | `messages` / `while True` / `tool_use` |
| [s02](tool-use) | Tool Use | `TOOL_HANDLERS` / dispatch map / 并发 |
| [s03](permission) | Permission | `PermissionRule` / 审批管线 |
| [s04](hooks) | Hooks | `PreToolUse` / `PostToolUse` / 扩展点 |
| [s05](todo-write) | TodoWrite | `TodoItem` / 先计划后执行 |
| [s06](subagent) | Subagent | `fresh messages[]` / 上下文隔离 |
| [s07](skill-loading) | Skill Loading | `SkillLoader` / 技能目录 / 按需注入 |
| [s08](context-compact) | Context Compact | budget / snip / micro / summary 四步压缩 |
| [s09](memory) | Memory | selection / extraction / consolidation |
| [s10](task-system) | Task System | `TaskRecord` / `blockedBy` / 磁盘持久化 |
| [s11](background-tasks) | Background Tasks | 线程执行 / 通知队列 |
| [s12](cron-scheduler) | Cron Scheduler | 持久化调度 / 会话级触发 |
| [s13](agent-teams) | Agent Teams | 持久队友 / 原子认领 / Worktree / 类型协议 |
| [s14](mcp-plugin) | MCP Plugin | 工具发现 / 命名空间 / 工具池组装 |
| [s15](integrated-harness) | Harness 集成 | 全部机制归到一个循环 |
| [s16](workflow-runtime) | Workflow Runtime | 脚本编排 / 生命周期事件 / journal 续跑 |
| [s17](goal-loop) | Goal Loop | 目标闸门 / 对话判断 / 自动续轮 |

## 学习建议

- 按顺序从 s01 读到 s17，部分机制建立在前一章运行时之上
- 每章笔记含「本章目标 / 笔记 / 关键代码 / 小结」四段，边读原仓库边补全
