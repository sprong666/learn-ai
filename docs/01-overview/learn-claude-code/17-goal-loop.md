---
title: "s17 Goal Loop：模型提出停止，独立判断器决定是否继续"
description: "GoalState / 独立判断器 / Stop hook 自动续轮"
sidebar_position: 17
---

import CodeBlock from '@theme/CodeBlock';
import s17code from '!!raw-loader!./code/s17_code.py';

# s17 Goal Loop：模型提出停止，独立判断器决定是否继续

> *"模型不再调用工具，只代表这一轮想停；目标是否完成，再交给一个独立判断器。"*
>
> **Harness 层**：持续执行。在每轮结束处检查完成条件，没有完成就继续下一轮。

## 问题

从 s01 开始，Agent Loop 的退出条件一直很简单：模型不再调用工具，程序就返回。

这对普通对话足够，但对"修到测试全部通过""完成所有验收项"这样的任务还不够。模型可能认为已经做完，也可能只完成了一部分。**没有新的 `tool_use`，只能说明当前轮次结束了，不能直接证明整个目标已经达成。**

## 解决方案

![Goal Loop 总览](/img/learn-claude-code/s17-goal-loop-overview.svg)

`/goal` 在真正返回之前，再加一次独立判断。输入：

```text
/goal pytest tests/auth 退出码为 0，并且 lint 没有错误
```

程序保存完成条件，并立即把这段条件作为本轮任务交给主模型。当主模型不再调用工具时，主循环不会立刻 `return`，而是先运行 Goal Stop hook。没有活跃目标时，hook 直接放行，退出条件仍然和 s01 一样。

判断器是另一次**独立的模型调用**（`GoalController` 持有），与干活的模型分开：没有工具、不能读文件、不能重跑测试，只能根据对话中已经出现的内容做判断：

```json
{
  "ok": false,
  "reason": "对话中还没有出现 pytest 的退出码",
  "impossible": false
}
```

> 完整实现见原仓库 [s17_goal_loop/](https://github.com/shareAI-lab/learn-claude-code/tree/main/s17_goal_loop)（README.md + code.py）

## 工作原理

**接入点只有几行**——判断未通过时，controller 把理由直接追加到同一份 `messages[]`，然后进入下一轮，不需要用户再输入"继续"：

```python
decision = await self.goal.evaluate_after_turn(self.messages)
if decision.action == "block":
    self.messages.append({"role": "user", "content": decision.reason})
    continue
return SessionResult(text=text, status=decision.action)
```

**对话记录就是判断依据**。工具结果、主模型的说明和后台任务通知都作为消息进入对话。送给判断器的内容保留最近的完整消息；最新消息过长时只保留开头和结尾。判断器的提示明确要求根据对话中的具体结果判断——不能把没有结果支撑的宣称当成完成。因此主模型 system prompt 会要求：**运行验证命令后，把命令和结果明确写进对话**。

Goal Loop 不是测试框架。真正的验证仍由工具执行，它只负责判断验证结果是否已经出现在当前工作记录中。

**好的完成条件要能检查**。"把代码弄好"太模糊。更合适的条件写清三件事：结束状态、验证方式、限制条件：

```text
/goal 完成登录模块迁移，直到 pytest tests/auth 退出码为 0，
并且没有修改 tests/auth 之外的测试文件
```

**后台任务没有结束时，先不要判断**。Workflow、后台命令可能在主模型结束当前轮时仍在运行，立即判断没有意义。Goal Stop hook 返回 `defer`，等通知进入同一个 `messages[]` 后再继续。

**自动继续也必须有出口**。Goal 本身没有默认轮数上限，但保留两道通用出口：主循环的全局 `max_turns`，以及 Stop hook 连续阻止结束的次数上限。达到上限时交还控制权，**不把目标伪装成完成，也不自动清除**。判断器调用失败同样：停止续轮、保留目标、把错误交给用户。

**查看、替换和清除**：`/goal` 查看（条件、判断次数、token 用量、最近原因）；`/goal <条件>` 替换并立即执行；`/goal clear` 清除。`restore()` 可从宿主保存的 `goal_status` 事件恢复活跃 Goal。

**新增部件**：

| 部件 | 作用 |
|---|---|
| `GoalState` | 保存条件、判断次数、开始时间和最近原因 |
| `PromptGoalEvaluator` | 用一次独立模型调用读取对话并返回判断 |
| `GoalController` | 设置、查看、清除 Goal，并实现 Stop hook |
| `AgentSession` | 在原来的退出位置接入 Goal 判断 |

**与 s16 的关系**：s16 解决"一批工作怎样执行"；s17 解决"整件事情是否已经完成"。Workflow 的完成通知进入对话后，Goal 判断器再决定整个任务是否还要继续。两个机制可以单独使用。

## 完整源码

<details>
<summary>s17_code.py（点击展开，共 810 行）</summary>

<CodeBlock language="python" title="s17_code.py">{s17code}</CodeBlock>

</details>
