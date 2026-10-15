---
title: OpenCode 内置 Agent
description: Primary Agents 与 Subagents 的分类、配置与用法
sidebar_position: 2
---

# OpenCode 内置 Agent

## 一、Agent 基础概念

### 1.1 Agent 分类

OpenCode 分为两类核心代理：

1. **Primary Agents（主Agent）**：用户直接交互的顶层助手，分为内置 Build、Plan 两种；
2. **Subagents（子Agent）**：专业专项助手，主Agent可自动/手动`@`调用，用于拆分并行任务。

层级结构：

```
主 Agent (Build/Plan)
    │
    ├─ 自动调用 SubAgent ──► @general (通用任务处理)
    │
    ├─ 自动调用 SubAgent ──► @explore (代码库探索)
    │
    └─ 手动调用 SubAgent ──► @your-custom-agent (自定义任务)
```

### 1.2 内置原生Agent列表

|Agent 名称|类型|核心用途|
|---|---|---|
|Build|Primary|默认开发主Agent，拥有全部工具操作权限|
|Plan|Primary|项目规划、代码分析，不修改代码|
|General|Subagent|通用多步骤任务、资料调研|
|Explore|Subagent|只读遍历项目代码结构|

### 1.3 典型适用场景

|场景|使用方案|
|---|---|
|多模块并行代码生成|`@general` 分发独立任务并行执行|
|代码静态审查|自定义只读权限审查子Agent|
|项目代码结构检索|`@explore` 快速扫描目录、接口、模型|
|需求方案分析|切换 Plan 主Agent做无损分析|
|批量文档编写|自定义文档专用子Agent并行输出多语言文档|

## 二、基础操作用法

### 2.1 切换主Agent

- TUI快捷键：`Tab` 循环切换 Build ↔ Plan
- 自定义快捷键：配置 `switch_agent` 快速切换

### 2.2 SubAgent 两种调用方式

1. **手动调用（@标记）**

```
@general 搜索该函数完整使用示例
@explore 找出项目所有数据库连接代码
```

2. **自动调用** 主Agent识别任务类型后自动匹配子Agent，例如查询项目API接口时，Build会自动唤起`@explore`只读检索。

### 2.3 Agent 管理 CLI 命令

```
# 交互式新建自定义Agent
opencode agent create
# 查看全局+项目所有Agent
opencode agent list
```

`opencode agent create` 交互式配置流程：

1. 选择生效范围：全局/项目级
2. 填写Agent功能描述
3. 绑定可用工具权限
4. 自动生成Markdown配置文件

## 三、Agent 两种配置方式

### 3.1 全局JSON配置（opencode.json）

在项目根目录`opencode.json`统一管理所有Agent，示例：

```
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "build": {
      "mode": "primary",
      "model": "anthropic/claude-sonnet-4-20250514",
      "prompt": "{file:./prompts/build.txt}"
    },
    "plan": {
      "mode": "primary",
      "model": "anthropic/claude-haiku-4-20250514"
    },
    "code-reviewer": {
      "description": "审查代码的最佳实践和潜在问题",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-20250514",
      "prompt": "你是一个代码审查员。关注安全性、性能和可维护性。"
    }
  }
}
```

### 3.2 Markdown 独立配置文件

存放路径：

- 项目级：`./.opencode/agents/`
- 全局级：`~/.config/opencode/agents/` 文件名即为Agent调用标识，示例`review.md`：

```

description: 审查代码质量和最佳实践
mode: subagent
model: anthropic/claude-sonnet-4-20250514
temperature: 0.1
tools:
  write: false
  edit: false
  bash: false

你是一个代码审查助手。专注于：
- 代码质量和最佳实践
- 潜在的 bug 和边界情况
- 性能影响
- 安全性考虑
只提供建设性反馈，不直接修改代码。
```

### 3.3 通用配置参数说明

|配置项|说明|示例值|
|---|---|---|
|description|Agent功能描述（必填）|"FastAPI路由自动生成工具"|
|mode|代理类型|primary / subagent / all|
|model|绑定大模型|anthropic/claude-sonnet-4-20250514|
|temperature|输出随机性0~1|0.1（严谨审查）、0.7（创意文档）|
|steps|单次最大执行步数|5|
|prompt|外部系统提示文件路径|`{file:./prompts/review.txt}`|
|color|UI展示颜色|#ff6b6b / accent|
|tools|工具权限开关|write: false 禁止写文件|

## 四、并行任务处理机制

### 4.1 并行实现原理

主Agent调用SubAgent会生成独立子会话，多子会话可并行执行无依赖任务；TUI提供会话导航快捷键：

|操作|快捷键|功能|
|---|---|---|
|进入首个子会话|`<Leader>+Down`|查看子Agent执行详情|
|切换下一个子会话|Right|多并行任务循环切换|
|切换上一个子会话|Left|反向遍历子会话|
|返回主会话|Up|回到父Agent对话|

### 4.2 并行任务典型示例

1. **多数据模型并行生成**

```
请并行处理以下模型创建：
1. User模型（用户基础信息）
2. Post模型（文章主体）
3. Comment模型（评论）
```

2. **多模块并行代码审查**

```
@code-reviewer 并行审查三大模块：
1. Models数据库模型规范
2. Routers接口权限与异常处理
3. Services业务逻辑性能隐患
```

3. **多语言文档批量生成** 分英文、中文、日文三套文档目录，子Agent同时生成各版本README、API文档。

### 4.3 任务拆分规范

- ✅ 推荐拆分：任务完全独立、无上下游依赖（如三个独立数据表）
- ❌ 不推荐拆分：任务存在强依赖（Post依赖User表，需串行执行） 存在依赖的任务统一提交，由主Agent自动按顺序调度。

## 五、精细化权限控制

### 5.1 工具权限三级规则

权限取值：

1. `allow`：无确认直接执行
2. `ask`：执行前弹窗请求用户确认
3. `deny`：彻底禁用该工具

示例只读审查Agent权限配置：

```
"readonly-reviewer": {
  "permission": {
    "edit": "deny",
    "bash": "deny",
    "webfetch": "deny"
  }
}
```

### 5.2 SubAgent调用权限限制

控制主Agent可唤起哪些子Agent，但用户手动`@`调用不受该限制：

```
"orchestrator": {
  "mode": "primary",
  "permission": {
    "task": {
      "*": "deny",
      "orchestrator-*": "allow",
      "code-reviewer": "ask"
    }
  }
}
```