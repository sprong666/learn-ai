---
title: OpenCode 内置 API
description: 插件开发可用的内置 API 参考
sidebar_position: 4
---

# OpenCode 内置 API

## API 列表总览

下表先给出阅读导航，再按主题展开详细接口表。

| 主题                | 主要前缀                                                                                                                 | 说明                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 新版 v2 基础能力        | `/api/health` `/api/location` `/api/agent` `/api/command` `/api/model` `/api/reference` `/api/skill` `/api/provider` | 新版 `/api/*` 的基础查询能力                 |
| 新版 v2 文件与事件       | `/api/fs/*` `/api/event`                                                                                             | 文件系统浏览与事件订阅                         |
| 新版 v2 集成与凭据       | `/api/integration*` `/api/credential*`                                                                               | 集成列表、OAuth/Key 连接、凭据更新与删除           |
| 新版 v2 会话流转        | `/api/session*`                                                                                                      | 会话创建、查询、prompt、wait、compact、context |
| 新版 v2 权限与问题       | `/api/permission*` `/api/question*`                                                                                  | 待审批权限、待回答问题、会话级回复                   |
| 新版 v2 PTY         | `/api/pty*`                                                                                                          | PTY 生命周期与连接 token                   |
| 经典实例与配置           | `/agent` `/command` `/config` `/formatter` `/lsp` `/path` `/skill` `/instance/*` `/global/config`                    | 实例级查询、配置与基础状态接口                     |
| 经典全局与认证           | `/global/*` `/auth/*` `/log` `/event`                                                                                | 全局配置、健康、升级、认证凭据、日志与事件               |
| 经典项目与工作区          | `/project*` `/experimental/workspace*` `/experimental/worktree*` `/experimental/project/*/copy*` `/sync/*`           | 项目、workspace、worktree、复制与同步         |
| 经典 Provider 与 MCP | `/provider*` `/mcp*` `/experimental/resource`                                                                        | Provider、OAuth、MCP 服务与实验资源          |
| 经典会话与消息           | `/session*` `/permission*` `/question*`                                                                              | 经典会话主流程、消息管理、权限与问题                  |
| TUI 与控制面          | `/tui/*` `/experimental/control-plane/*` `/experimental/console*`                                                    | TUI 驱动、控制面、Console 组织切换             |
| 文件检索              | `/file*` `/find*`                                                                                                    | 文件列表、读取、状态、文本/文件/符号搜索               |
| VCS               | `/vcs*`                                                                                                              | 状态、diff、raw diff、patch apply        |
| 实验性工具与会话          | `/experimental/session*` `/experimental/tool*`                                                                       | 实验性 session/tool 查询与后台化             |

> 注：本地 `http://127.0.0.1:14096/doc` 当前可访问，且会返回 OpenAPI 文档。上表用于导航，不替代 OpenAPI 精确统计或完整 schema。（来源：本地 `http://127.0.0.1:14096/doc` 实测）

## 一、新版 `/api/*`

新版接口统一位于 `/api/*` 前缀下，覆盖健康检查、Agent、Model、文件系统、事件、集成、凭据、会话、权限、问题和 PTY 等主题。（来源：本地 `http://127.0.0.1:14096/doc` 实测）

### 1.1 基础能力与元数据

| 路径                           | 方法  | operationId         | 摘要                  | 说明             |
| ---------------------------- | --- | ------------------- | ------------------- | -------------- |
| `/api/health`                | GET | `v2.health.get`     | Check server health | 检查服务健康状态。      |
| `/api/location`              | GET | `v2.location.get`   | Get location        | 获取当前实例位置信息。    |
| `/api/agent`                 | GET | `v2.agent.list`     | List agents         | 列出可用 agents。   |
| `/api/command`               | GET | `v2.command.list`   | List commands       | 列出可用 commands。 |
| `/api/model`                 | GET | `v2.model.list`     | List models         | 列出可用模型。        |
| `/api/reference`             | GET | `v2.reference.list` | List references     | 列出 references。 |
| `/api/skill`                 | GET | `v2.skill.list`     | List skills         | 列出 skills。     |
| `/api/provider`              | GET | `v2.provider.list`  | List providers      | 列出 providers。  |
| `/api/provider/{providerID}` | GET | `v2.provider.get`   | Get provider        | 获取单个 provider。 |

### 1.2 文件系统与事件

| 路径               | 方法  | operationId          | 摘要                  | 说明      |
| ---------------- | --- | -------------------- | ------------------- | ------- |
| `/api/event`     | GET | `v2.event.subscribe` | Subscribe to events | 订阅事件流。  |
| `/api/fs/find`   | GET | `v2.fs.find`         | Find files          | 查找文件。   |
| `/api/fs/list`   | GET | `v2.fs.list`         | List directory      | 列出目录内容。 |
| `/api/fs/read/*` | GET | `v2.fs.read`         | Read file           | 读取文件内容。 |

### 1.3 集成与凭据

| 路径                                               | 方法     | operationId                       | 摘要                        | 说明             |
| ------------------------------------------------ | ------ | --------------------------------- | ------------------------- | -------------- |
| `/api/integration`                               | GET    | `v2.integration.list`             | List integrations         | 列出集成项。         |
| `/api/integration/{integrationID}`               | GET    | `v2.integration.get`              | Get integration           | 获取单个集成详情。      |
| `/api/integration/{integrationID}/connect/key`   | POST   | `v2.integration.connect.key`      | Connect with key          | 使用 key 建立集成连接。 |
| `/api/integration/{integrationID}/connect/oauth` | POST   | `v2.integration.connect.oauth`    | Begin OAuth connection    | 发起 OAuth 连接。   |
| `/api/integration/attempt/{attemptID}`           | GET    | `v2.integration.attempt.status`   | Get OAuth attempt status  | 查询 OAuth 尝试状态。 |
| `/api/integration/attempt/{attemptID}`           | DELETE | `v2.integration.attempt.cancel`   | Cancel OAuth connection   | 取消 OAuth 连接尝试。 |
| `/api/integration/attempt/{attemptID}/complete`  | POST   | `v2.integration.attempt.complete` | Complete OAuth connection | 完成 OAuth 连接。   |
| `/api/credential/{credentialID}`                 | PATCH  | `v2.credential.update`            | Update credential         | 更新凭据。          |
| `/api/credential/{credentialID}`                 | DELETE | `v2.credential.remove`            | Remove credential         | 删除凭据。          |

### 1.4 会话主流程

| 路径                                 | 方法   | operationId           | 摘要                   | 说明        |
| ---------------------------------- | ---- | --------------------- | -------------------- | --------- |
| `/api/session`                     | GET  | `v2.session.list`     | List sessions        | 列出会话。     |
| `/api/session`                     | POST | `v2.session.create`   | Create session       | 创建会话。     |
| `/api/session/{sessionID}`         | GET  | `v2.session.get`      | Get session          | 获取单个会话。   |
| `/api/session/{sessionID}/compact` | POST | `v2.session.compact`  | Compact session      | 压缩会话上下文。  |
| `/api/session/{sessionID}/context` | GET  | `v2.session.context`  | Get session context  | 获取会话上下文。  |
| `/api/session/{sessionID}/message` | GET  | `v2.session.messages` | Get session messages | 获取会话消息。   |
| `/api/session/{sessionID}/prompt`  | POST | `v2.session.prompt`   | Send message         | 向会话发送消息。  |
| `/api/session/{sessionID}/wait`    | POST | `v2.session.wait`     | Wait for session     | 等待会话状态推进。 |

### 1.5 权限与问题

| 路径                                                      | 方法     | operationId                   | 摘要                                  | 说明         |
| ------------------------------------------------------- | ------ | ----------------------------- | ----------------------------------- | ---------- |
| `/api/permission/request`                               | GET    | `v2.permission.request.list`  | List pending permission requests    | 列出待处理权限请求。 |
| `/api/permission/saved`                                 | GET    | `v2.permission.saved.list`    | List saved permissions              | 列出已保存权限。   |
| `/api/permission/saved/{id}`                            | DELETE | `v2.permission.saved.remove`  | Remove saved permission             | 删除已保存权限。   |
| `/api/session/{sessionID}/permission`                   | GET    | `v2.session.permission.list`  | List session permission requests    | 列出会话级权限请求。 |
| `/api/session/{sessionID}/permission/{requestID}/reply` | POST   | `v2.session.permission.reply` | Reply to pending permission request | 回复权限请求。    |
| `/api/question/request`                                 | GET    | `v2.question.request.list`    | List pending question requests      | 列出待回答问题。   |
| `/api/session/{sessionID}/question`                     | GET    | `v2.session.question.list`    | List session question requests      | 列出会话级问题请求。 |
| `/api/session/{sessionID}/question/{requestID}/reply`   | POST   | `v2.session.question.reply`   | Reply to pending question request   | 回复问题请求。    |
| `/api/session/{sessionID}/question/{requestID}/reject`  | POST   | `v2.session.question.reject`  | Reject pending question request     | 拒绝问题请求。    |

### 1.6 PTY

| 路径                               | 方法     | operationId           | 摘要                         | 说明                      |
| -------------------------------- | ------ | --------------------- | -------------------------- | ----------------------- |
| `/api/pty`                       | GET    | `v2.pty.list`         | List PTY sessions          | 列出 PTY 会话。              |
| `/api/pty`                       | POST   | `v2.pty.create`       | Create PTY session         | 创建 PTY 会话。              |
| `/api/pty/{ptyID}`               | GET    | `v2.pty.get`          | Get PTY session            | 获取 PTY 会话。              |
| `/api/pty/{ptyID}`               | PUT    | `v2.pty.update`       | Update PTY session         | 更新 PTY 会话。              |
| `/api/pty/{ptyID}`               | DELETE | `v2.pty.remove`       | Remove PTY session         | 删除 PTY 会话。              |
| `/api/pty/{ptyID}/connect`       | GET    | `v2.pty.connect`      | Connect to PTY session     | 连接 PTY 会话。              |
| `/api/pty/{ptyID}/connect-token` | POST   | `v2.pty.connectToken` | Create PTY WebSocket token | 创建 PTY WebSocket token。 |

## 二、经典 REST：实例、全局、配置与基础状态

经典 REST 的重点分组：`/global`、`/project`、`/path`、`/vcs`、`/instance`、`/config`、`/provider`、`/session`。（来源：https://learnopencode.com/5-advanced/09b-remote-api.html；本地 `http://127.0.0.1:14096/doc` 实测）

### 2.1 实例与本地能力状态

| 路径                  | 方法   | operationId        | 摘要                   | 说明               |
| ------------------- | ---- | ------------------ | -------------------- | ---------------- |
| `/agent`            | GET  | `app.agents`       | List agents          | 列出 agents。       |
| `/command`          | GET  | `command.list`     | List commands        | 列出 commands。     |
| `/formatter`        | GET  | `formatter.status` | Get formatter status | 获取 formatter 状态。 |
| `/lsp`              | GET  | `lsp.status`       | Get LSP status       | 获取 LSP 状态。       |
| `/path`             | GET  | `path.get`         | Get paths            | 获取路径信息。          |
| `/skill`            | GET  | `app.skills`       | List skills          | 列出 skills。       |
| `/instance/dispose` | POST | `instance.dispose` | Dispose instance     | 释放实例。            |
| `/vcs`              | GET  | `vcs.get`          | Get VCS info         | 获取 VCS 基本信息。     |

### 2.2 配置与全局管理

| 路径                  | 方法    | operationId            | 摘要                          | 说明                |
| ------------------- | ----- | ---------------------- | --------------------------- | ----------------- |
| `/config`           | GET   | `config.get`           | Get configuration           | 获取实例配置。           |
| `/config`           | PATCH | `config.update`        | Update configuration        | 更新实例配置。           |
| `/config/providers` | GET   | `config.providers`     | List config providers       | 列出配置中的 providers。 |
| `/global/config`    | GET   | `global.config.get`    | Get global configuration    | 获取全局配置。           |
| `/global/config`    | PATCH | `global.config.update` | Update global configuration | 更新全局配置。           |
| `/global/health`    | GET   | `global.health`        | Get health                  | 获取全局健康状态。         |
| `/global/event`     | GET   | `global.event`         | Get global events           | 获取全局事件流。          |
| `/global/dispose`   | POST  | `global.dispose`       | Dispose instance            | 释放全局实例。           |
| `/global/upgrade`   | POST  | `global.upgrade`       | Upgrade opencode            | 升级 opencode。      |

### 2.3 认证、日志与基础控制

| 路径                   | 方法     | operationId       | 摘要                      | 说明                |
| -------------------- | ------ | ----------------- | ----------------------- | ----------------- |
| `/auth/{providerID}` | PUT    | `auth.set`        | Set auth credentials    | 设置 provider 认证凭据。 |
| `/auth/{providerID}` | DELETE | `auth.remove`     | Remove auth credentials | 删除 provider 认证凭据。 |
| `/log`               | POST   | `app.log`         | Write log               | 写入日志。             |
| `/event`             | GET    | `event.subscribe` | Subscribe to events     | 订阅事件流。            |

## 三、经典 REST：项目、工作区、worktree 与同步

这一组接口覆盖项目选择、Git 初始化、工作区、worktree 与同步。（来源：本地 `http://127.0.0.1:14096/doc` 实测；https://learnopencode.com/5-advanced/09b-remote-api.html）

### 3.1 项目

| 路径                                 | 方法    | operationId           | 摘要                        | 说明          |
| ---------------------------------- | ----- | --------------------- | ------------------------- | ----------- |
| `/project`                         | GET   | `project.list`        | List all projects         | 列出全部项目。     |
| `/project/current`                 | GET   | `project.current`     | Get current project       | 获取当前项目。     |
| `/project/git/init`                | POST  | `project.initGit`     | Initialize git repository | 初始化 Git 仓库。 |
| `/project/{projectID}`             | PATCH | `project.update`      | Update project            | 更新项目。       |
| `/project/{projectID}/directories` | GET   | `project.directories` | List project directories  | 列出项目目录。     |

### 3.2 实验性项目复制

| 路径                                                     | 方法     | operationId                             | 摘要                         | 说明        |
| ------------------------------------------------------ | ------ | --------------------------------------- | -------------------------- | --------- |
| `/experimental/project/{projectID}/copy`               | POST   | `v2.projectCopy.create`                 | 本地 `/doc` 未给出摘要            | 创建项目副本。   |
| `/experimental/project/{projectID}/copy`               | DELETE | `v2.projectCopy.remove`                 | 本地 `/doc` 未给出摘要            | 删除项目副本。   |
| `/experimental/project/{projectID}/copy/generate-name` | POST   | `experimental.projectCopy.generateName` | Generate project copy name | 生成项目副本名称。 |
| `/experimental/project/{projectID}/copy/refresh`       | POST   | `v2.projectCopy.refresh`                | 本地 `/doc` 未给出摘要            | 刷新项目副本。   |

### 3.3 Workspace

| 路径                                  | 方法     | operationId                           | 摘要                          | 说明                     |
| ----------------------------------- | ------ | ------------------------------------- | --------------------------- | ---------------------- |
| `/experimental/workspace`           | GET    | `experimental.workspace.list`         | List workspaces             | 列出 workspaces。         |
| `/experimental/workspace`           | POST   | `experimental.workspace.create`       | Create workspace            | 创建 workspace。          |
| `/experimental/workspace/adapter`   | GET    | `experimental.workspace.adapter.list` | List workspace adapters     | 列出 workspace adapters。 |
| `/experimental/workspace/status`    | GET    | `experimental.workspace.status`       | Workspace status            | 获取 workspace 状态。       |
| `/experimental/workspace/sync-list` | POST   | `experimental.workspace.syncList`     | Sync workspace list         | 同步 workspace 列表。       |
| `/experimental/workspace/warp`      | POST   | `experimental.workspace.warp`         | Warp session into workspace | 将会话导入或切换到 workspace。   |
| `/experimental/workspace/{id}`      | DELETE | `experimental.workspace.remove`       | Remove workspace            | 删除 workspace。          |

### 3.4 Worktree 与同步

| 路径                             | 方法     | operationId         | 摘要                           | 说明                |
| ------------------------------ | ------ | ------------------- | ---------------------------- | ----------------- |
| `/experimental/worktree`       | GET    | `worktree.list`     | List worktrees               | 列出 worktrees。     |
| `/experimental/worktree`       | POST   | `worktree.create`   | Create worktree              | 创建 worktree。      |
| `/experimental/worktree`       | DELETE | `worktree.remove`   | Remove worktree              | 删除 worktree。      |
| `/experimental/worktree/reset` | POST   | `worktree.reset`    | Reset worktree               | 重置 worktree。      |
| `/sync/start`                  | POST   | `sync.start`        | Start workspace sync         | 启动 workspace 同步。  |
| `/sync/history`                | POST   | `sync.history.list` | List sync events             | 列出同步事件。           |
| `/sync/replay`                 | POST   | `sync.replay`       | Replay sync events           | 重放同步事件。           |
| `/sync/steal`                  | POST   | `sync.steal`        | Steal session into workspace | 将会话接管到 workspace。 |

## 四、经典 REST：Provider、MCP 与外部连接边界

注意区分三条链路：HTTP API、MCP 服务和插件 hook。仓库内已有方案是通过 HTTP 调用外部服务实现审计，而不是直接调用 MCP。（来源：`知识库/工作/项目/飞码Code/AI 代码快速审计.md`）

### 4.1 Provider

| 路径                                       | 方法   | operationId                | 摘要                        | 说明                    |
| ---------------------------------------- | ---- | -------------------------- | ------------------------- | --------------------- |
| `/provider`                              | GET  | `provider.list`            | List providers            | 列出 providers。         |
| `/provider/auth`                         | GET  | `provider.auth`            | Get provider auth methods | 获取 provider 认证方式。     |
| `/provider/{providerID}/oauth/authorize` | POST | `provider.oauth.authorize` | Start OAuth authorization | 发起 provider OAuth 授权。 |
| `/provider/{providerID}/oauth/callback`  | POST | `provider.oauth.callback`  | Handle OAuth callback     | 处理 provider OAuth 回调。 |

### 4.2 MCP

| 路径                              | 方法     | operationId             | 摘要                     | 说明               |
| ------------------------------- | ------ | ----------------------- | ---------------------- | ---------------- |
| `/mcp`                          | GET    | `mcp.status`            | Get MCP status         | 获取 MCP 状态。       |
| `/mcp`                          | POST   | `mcp.add`               | Add MCP server         | 添加 MCP server。   |
| `/mcp/{name}/auth`              | POST   | `mcp.auth.start`        | Start MCP OAuth        | 发起 MCP OAuth。    |
| `/mcp/{name}/auth`              | DELETE | `mcp.auth.remove`       | Remove MCP OAuth       | 删除 MCP OAuth 认证。 |
| `/mcp/{name}/auth/authenticate` | POST   | `mcp.auth.authenticate` | Authenticate MCP OAuth | 执行 MCP OAuth 认证。 |
| `/mcp/{name}/auth/callback`     | POST   | `mcp.auth.callback`     | Complete MCP OAuth     | 完成 MCP OAuth 回调。 |
| `/mcp/{name}/connect`           | POST   | `mcp.connect`           | 本地 `/doc` 未给出摘要        | 连接 MCP 服务。       |
| `/mcp/{name}/disconnect`        | POST   | `mcp.disconnect`        | 本地 `/doc` 未给出摘要        | 断开 MCP 服务。       |

### 4.3 实验资源

| 路径                       | 方法  | operationId                  | 摘要                | 说明           |
| ------------------------ | --- | ---------------------------- | ----------------- | ------------ |
| `/experimental/resource` | GET | `experimental.resource.list` | Get MCP resources | 获取 MCP 资源列表。 |

## 五、经典 REST：会话、消息、权限与问题

`/session` 是最核心的一组接口，覆盖创建、初始化、发送消息、命令、shell、fork、share、revert、summarize、todo、children、diff 以及消息片段级操作。（来源：https://learnopencode.com/5-advanced/09b-remote-api.html；本地 `http://127.0.0.1:14096/doc` 实测）

### 5.1 会话生命周期

| 路径                              | 方法     | operationId        | 摘要                   | 说明        |
| ------------------------------- | ------ | ------------------ | -------------------- | --------- |
| `/session`                      | GET    | `session.list`     | List sessions        | 列出会话。     |
| `/session`                      | POST   | `session.create`   | Create session       | 创建会话。     |
| `/session/status`               | GET    | `session.status`   | Get session status   | 获取会话状态总览。 |
| `/session/{sessionID}`          | GET    | `session.get`      | Get session          | 获取会话。     |
| `/session/{sessionID}`          | PATCH  | `session.update`   | Update session       | 更新会话。     |
| `/session/{sessionID}`          | DELETE | `session.delete`   | Delete session       | 删除会话。     |
| `/session/{sessionID}/init`     | POST   | `session.init`     | Initialize session   | 初始化会话。    |
| `/session/{sessionID}/abort`    | POST   | `session.abort`    | Abort session        | 中止会话。     |
| `/session/{sessionID}/fork`     | POST   | `session.fork`     | Fork session         | 分叉会话。     |
| `/session/{sessionID}/children` | GET    | `session.children` | Get session children | 获取会话子节点。  |
| `/session/{sessionID}/share`    | POST   | `session.share`    | Share session        | 分享会话。     |
| `/session/{sessionID}/share`    | DELETE | `session.unshare`  | Unshare session      | 取消分享会话。   |

### 5.2 消息与内容操作

| 路径                                                       | 方法     | operationId             | 摘要                        | 说明         |
| -------------------------------------------------------- | ------ | ----------------------- | ------------------------- | ---------- |
| `/session/{sessionID}/message`                           | GET    | `session.messages`      | Get session messages      | 获取消息列表。    |
| `/session/{sessionID}/message`                           | POST   | `session.prompt`        | Send message              | 发送消息。      |
| `/session/{sessionID}/prompt_async`                      | POST   | `session.prompt_async`  | Send async message        | 发送异步消息。    |
| `/session/{sessionID}/message/{messageID}`               | GET    | `session.message`       | Get message               | 获取单条消息。    |
| `/session/{sessionID}/message/{messageID}`               | DELETE | `session.deleteMessage` | Delete message            | 删除消息。      |
| `/session/{sessionID}/message/{messageID}/part/{partID}` | PATCH  | `part.update`           | 本地 `/doc` 未给出摘要           | 更新消息片段。    |
| `/session/{sessionID}/message/{messageID}/part/{partID}` | DELETE | `part.delete`           | 本地 `/doc` 未给出摘要           | 删除消息片段。    |
| `/session/{sessionID}/diff`                              | GET    | `session.diff`          | Get message diff          | 获取消息 diff。 |
| `/session/{sessionID}/revert`                            | POST   | `session.revert`        | Revert message            | 回滚消息。      |
| `/session/{sessionID}/unrevert`                          | POST   | `session.unrevert`      | Restore reverted messages | 恢复已回滚消息。   |
| `/session/{sessionID}/summarize`                         | POST   | `session.summarize`     | Summarize session         | 汇总会话。      |
| `/session/{sessionID}/todo`                              | GET    | `session.todo`          | Get session todos         | 获取会话待办。    |

### 5.3 命令、shell 与控制

| 路径                             | 方法   | operationId       | 摘要                | 说明                  |
| ------------------------------ | ---- | ----------------- | ----------------- | ------------------- |
| `/session/{sessionID}/command` | POST | `session.command` | Send command      | 向会话发送 command。      |
| `/session/{sessionID}/shell`   | POST | `session.shell`   | Run shell command | 在会话上下文中运行 shell 命令。 |

### 5.4 权限与问题请求

| 路径                                                | 方法   | operationId          | 摘要                            | 说明         |
| ------------------------------------------------- | ---- | -------------------- | ----------------------------- | ---------- |
| `/permission`                                     | GET  | `permission.list`    | List pending permissions      | 列出待处理权限。   |
| `/permission/{requestID}/reply`                   | POST | `permission.reply`   | Respond to permission request | 回复权限请求。    |
| `/question`                                       | GET  | `question.list`      | List pending questions        | 列出待处理问题。   |
| `/question/{requestID}/reply`                     | POST | `question.reply`     | Reply to question request     | 回复问题请求。    |
| `/question/{requestID}/reject`                    | POST | `question.reject`    | Reject question request       | 拒绝问题请求。    |
| `/session/{sessionID}/permissions/{permissionID}` | POST | `permission.respond` | Respond to permission         | 回复会话内权限请求。 |

## 六、文件、检索与 PTY

文件与终端能力同时存在于经典 REST 与新版 `/api/*`：经典侧有 `/file*`、`/find*`、`/pty*`，新版侧将文件浏览收敛为 `/api/fs/*`。（来源：本地 `http://127.0.0.1:14096/doc` 实测）

### 6.1 文件与检索

| 路径              | 方法  | operationId    | 摘要              | 说明      |
| --------------- | --- | -------------- | --------------- | ------- |
| `/file`         | GET | `file.list`    | List files      | 列出文件。   |
| `/file/content` | GET | `file.read`    | Read file       | 读取文件。   |
| `/file/status`  | GET | `file.status`  | Get file status | 获取文件状态。 |
| `/find`         | GET | `find.text`    | Find text       | 搜索文本。   |
| `/find/file`    | GET | `find.files`   | Find files      | 搜索文件。   |
| `/find/symbol`  | GET | `find.symbols` | Find symbols    | 搜索符号。   |

### 6.2 经典 PTY

| 路径                           | 方法     | operationId        | 摘要                         | 说明               |
| ---------------------------- | ------ | ------------------ | -------------------------- | ---------------- |
| `/pty`                       | GET    | `pty.list`         | List PTY sessions          | 列出 PTY 会话。       |
| `/pty`                       | POST   | `pty.create`       | Create PTY session         | 创建 PTY 会话。       |
| `/pty/shells`                | GET    | `pty.shells`       | List available shells      | 列出可用 shell。      |
| `/pty/{ptyID}`               | GET    | `pty.get`          | Get PTY session            | 获取 PTY 会话。       |
| `/pty/{ptyID}`               | PUT    | `pty.update`       | Update PTY session         | 更新 PTY 会话。       |
| `/pty/{ptyID}`               | DELETE | `pty.remove`       | Remove PTY session         | 删除 PTY 会话。       |
| `/pty/{ptyID}/connect`       | GET    | `pty.connect`      | Connect to PTY session     | 连接 PTY 会话。       |
| `/pty/{ptyID}/connect-token` | POST   | `pty.connectToken` | Create PTY WebSocket token | 创建 PTY 连接 token。 |

## 七、VCS

VCS 接口覆盖状态查询、diff、raw diff 和 patch apply。（来源：https://learnopencode.com/5-advanced/09b-remote-api.html；本地 `http://127.0.0.1:14096/doc` 实测）

| 路径              | 方法   | operationId    | 摘要               | 说明             |
| --------------- | ---- | -------------- | ---------------- | -------------- |
| `/vcs`          | GET  | `vcs.get`      | Get VCS info     | 获取 VCS 信息。     |
| `/vcs/status`   | GET  | `vcs.status`   | Get VCS status   | 获取 VCS 状态。     |
| `/vcs/diff`     | GET  | `vcs.diff`     | Get VCS diff     | 获取 VCS diff。   |
| `/vcs/diff/raw` | GET  | `vcs.diff.raw` | Get raw VCS diff | 获取原始 VCS diff。 |
| `/vcs/apply`    | POST | `vcs.apply`    | Apply VCS patch  | 应用 VCS patch。  |

## 八、实验性控制面、工具与 Console/TUI

这一组接口用于实验性控制流程、TUI 交互与工具元数据查询，不建议作为稳定集成入口。（来源：本地 `http://127.0.0.1:14096/doc` 实测）

### 8.1 实验性控制面与工具

| 路径                                             | 方法   | operationId                             | 摘要                   | 说明               |
| ---------------------------------------------- | ---- | --------------------------------------- | -------------------- | ---------------- |
| `/experimental/control-plane/move-session`     | POST | `experimental.controlPlane.moveSession` | Move session         | 移动会话。            |
| `/experimental/session`                        | GET  | `experimental.session.list`             | List sessions        | 列出实验性会话。         |
| `/experimental/session/{sessionID}/background` | POST | `experimental.session.background`       | Background subagents | 将 subagents 后台化。 |
| `/experimental/tool`                           | GET  | `tool.list`                             | List tools           | 列出工具。            |
| `/experimental/tool/ids`                       | GET  | `tool.ids`                              | List tool IDs        | 列出工具 ID。         |

### 8.2 Console

| 路径                             | 方法   | operationId                      | 摘要                                   | 说明                         |
| ------------------------------ | ---- | -------------------------------- | ------------------------------------ | -------------------------- |
| `/experimental/console`        | GET  | `experimental.console.get`       | Get active Console provider metadata | 获取当前 Console provider 元数据。 |
| `/experimental/console/orgs`   | GET  | `experimental.console.listOrgs`  | List switchable Console orgs         | 列出可切换 Console 组织。          |
| `/experimental/console/switch` | POST | `experimental.console.switchOrg` | Switch active Console org            | 切换当前 Console 组织。           |

### 8.3 TUI

| 路径                      | 方法   | operationId            | 摘要                   | 说明              |
| ----------------------- | ---- | ---------------------- | -------------------- | --------------- |
| `/tui/append-prompt`    | POST | `tui.appendPrompt`     | Append TUI prompt    | 追加 TUI prompt。  |
| `/tui/clear-prompt`     | POST | `tui.clearPrompt`      | Clear TUI prompt     | 清空 TUI prompt。  |
| `/tui/control/next`     | GET  | `tui.control.next`     | Get next TUI request | 获取下一个 TUI 请求。   |
| `/tui/control/response` | POST | `tui.control.response` | Submit TUI response  | 提交 TUI 响应。      |
| `/tui/execute-command`  | POST | `tui.executeCommand`   | Execute TUI command  | 执行 TUI command。 |
| `/tui/open-help`        | POST | `tui.openHelp`         | Open help dialog     | 打开帮助对话框。        |
| `/tui/open-models`      | POST | `tui.openModels`       | Open models dialog   | 打开模型对话框。        |
| `/tui/open-sessions`    | POST | `tui.openSessions`     | Open sessions dialog | 打开会话对话框。        |
| `/tui/open-themes`      | POST | `tui.openThemes`       | Open themes dialog   | 打开主题对话框。        |
| `/tui/publish`          | POST | `tui.publish`          | Publish TUI event    | 发布 TUI 事件。      |
| `/tui/select-session`   | POST | `tui.selectSession`    | Select session       | 选择会话。           |
| `/tui/show-toast`       | POST | `tui.showToast`        | Show TUI toast       | 显示提示消息。         |
| `/tui/submit-prompt`    | POST | `tui.submitPrompt`     | Submit TUI prompt    | 提交 TUI prompt。  |

## 九、经典 REST 与新版 `/api/*` 的关系与使用建议

OpenCode 当前同时暴露两套接口，且新版并未完全取代经典接口：

- 经典 REST：`/session`、`/project`、`/global`、`/provider`、`/vcs`、`/path`、`/config`
- 新版 `/api/*`：`/api/session`、`/api/provider`、`/api/fs/*`、`/api/permission/*`、`/api/question/*`、`/api/pty/*`

（来源：本地 `http://127.0.0.1:14096/doc` 实测）

### 使用建议

- 某主题在 `/api/*` 下有对应接口且满足需求时，优先用新版路径
- 项目管理、VCS、TUI、实验性控制面等能力仍大量在经典路径下，不要只看 `/api/*`
- 会话：新版 `/api/session/*` 偏基础流程，经典 `/session/*` 细粒度操作更多
- 文件：`/api/fs/*` 统一文件访问，`/file*` 与 `/find*` 补充状态与搜索
- HTTP API 不等于 MCP；插件 hook 审计链路可直接 HTTP 调用外部服务。（来源：`知识库/工作/项目/飞码Code/AI 代码快速审计.md`）

### 认证与文档入口提示

`/doc` 提供 OpenAPI 3.1 文档；若设置 `OPENCODE_SERVER_PASSWORD`，远程 API 需要 HTTP Basic Auth（此条为外部参考，未做本地复测）。（来源：https://learnopencode.com/5-advanced/09b-remote-api.html）

## 十、已知空缺与待补项

1. 本文未展开参数、请求体、响应体字段；需要字段级定义时，应直接回到本地 `/doc` 查看完整 schema。（来源：本地 `http://127.0.0.1:14096/doc` 实测）
2. 以下接口在本地 `/doc` 中存在，但 summary 为空，本文仅记录最小事实：
   - `/experimental/project/{projectID}/copy` `POST`
   - `/experimental/project/{projectID}/copy` `DELETE`
   - `/experimental/project/{projectID}/copy/refresh` `POST`
   - `/mcp/{name}/connect` `POST`
   - `/mcp/{name}/disconnect` `POST`
   - `/session/{sessionID}/message/{messageID}/part/{partID}` `PATCH`
   - `/session/{sessionID}/message/{messageID}/part/{partID}` `DELETE`
3. 经典 REST 与新版 `/api/*` 的一一映射关系还未完全整理；当前只能确认“两套接口并存”，不能据此断言谁已经完全取代谁。（来源：本地 `http://127.0.0.1:14096/doc` 实测）
4. 外部参考中的认证与远程访问说明尚未在本文中做环境级复测，不能直接当作当前实例配置事实。（来源：https://learnopencode.com/5-advanced/09b-remote-api.html）

## 十一、高价值接口的请求 / 响应 JSON 样例

本节收录“更适合直接接入或调试”的高价值接口样例，统一分两类标注：

- **已实测响应样例**：实际请求过并拿到响应；如有需要会做脱敏。
- **基于 OpenAPI schema 的结构示例**：来自本地 `/doc` 的 schema，仅展示结构，不代表示例值已逐项实测。

### 11.1 `GET /global/health`

用途：检查经典 REST 服务健康状态。

请求参数：无

URL 示例：

```text
GET /global/health
```

已实测响应样例：

```json
{
  "healthy": true,
  "version": "1.17.7"
}
```

结构要点：

- `healthy`：健康状态布尔值；当前实测值为 `true`
- `version`：当前服务版本号

（来源：本地 `http://127.0.0.1:14096/global/health` 实测；本地 `http://127.0.0.1:14096/doc` schema）

### 11.2 `GET /api/health`

用途：检查新版 `/api/*` 是否可用。

请求参数：无

URL 示例：

```text
GET /api/health
```

已实测响应样例：

```json
{
  "healthy": true
}
```

结构要点：

- 比经典 `/global/health` 更轻量
- 响应中只确认 `healthy` 字段

（来源：本地 `http://127.0.0.1:14096/api/health` 实测；本地 `http://127.0.0.1:14096/doc` schema）

### 11.3 `GET /project/current`

用途：读取当前项目上下文。

query 参数（均为可选）：

| 参数 | 类型 | 说明 |
|---|---|---|
| `directory` | string | 指定目录 |
| `workspace` | string | 指定 workspace |

URL 示例：

```text
GET /project/current?directory=E:/path/to/project&workspace=wrk_xxx
```

说明：上面展示的是 query 参数，不是请求 body；query 参数名与响应里的字段名不一定相同。

实测响应样例（当前环境，脱敏/摘要后）：

```json
{
  "id": "global",
  "worktree": "/",
  "time": {
    "created": 1775706079847,
    "updated": 1783949684934
  },
  "sandboxes": []
}
```

基于 OpenAPI schema 的完整结构示例：

```json
{
  "id": "global",
  "worktree": "/",
  "vcs": "git",
  "name": "示例项目",
  "icon": {
    "url": "https://example.com/icon.png",
    "override": "rocket",
    "color": "#4F46E5"
  },
  "commands": {
    "start": "python app.py"
  },
  "time": {
    "created": 1775706079847,
    "updated": 1783949684934,
    "initialized": 1775706080000
  },
  "sandboxes": []
}
```

（来源：本地 `http://127.0.0.1:14096/project/current` 实测；本地 `http://127.0.0.1:14096/doc` schema）

### 11.4 `GET /path`

用途：读取实例路径信息。

query 参数（均为可选）：

| 参数 | 类型 | 说明 |
|---|---|---|
| `directory` | string | 指定目录 |
| `workspace` | string | 指定 workspace |

URL 示例：

```text
GET /path?directory=E:/path/to/project&workspace=wrk_xxx
```

说明：上面展示的是 query 参数，不是请求 body；query 参数名与响应里的字段名不一定相同。

完整响应（当前环境实测，脱敏后）：

```json
{
  "home": "C:/Users/<user>",
  "state": "C:/Users/<user>/.local/state/opencode",
  "config": "C:/Users/<user>/.config/opencode",
  "worktree": "/",
  "directory": "C:/Users/<user>"
}
```

基于 OpenAPI schema 的结构示例：

```json
{
  "home": "C:/Users/<user>",
  "state": "C:/Users/<user>/.local/state/opencode",
  "config": "C:/Users/<user>/.config/opencode",
  "worktree": "/",
  "directory": "E:/path/to/project"
}
```

（来源：本地 `http://127.0.0.1:14096/path` 实测；本地 `http://127.0.0.1:14096/doc` schema）

### 11.5 `GET /session`

用途：读取经典 REST 会话列表。

query 参数（均为可选）：

| 参数 | 类型 | 说明 |
|---|---|---|
| `directory` | string | 指定目录 |
| `workspace` | string | 指定 workspace |
| `scope` | string | 当前 schema 允许值为 `project` |
| `path` | string | 指定路径 |
| `roots` | boolean/string | 是否仅返回根级结果 |
| `start` | number | 起始偏移 |
| `search` | string | 搜索关键词 |
| `limit` | number | 返回条数上限 |

URL 示例：

```text
GET /session?scope=project&limit=20&search=OpenCode
```

说明：上面展示的是 query 参数，不是请求 body。

已实测响应样例（脱敏后，保留一个数组元素）：

```json
[
  {
    "id": "ses_xxx",
    "slug": "curious-planet",
    "projectID": "global",
    "directory": "E:/path/to/project",
    "path": "E:/path/to/project",
    "summary": {
      "additions": 0,
      "deletions": 0,
      "files": 0
    },
    "cost": 0,
    "tokens": {
      "input": 232649,
      "output": 22132,
      "reasoning": 1076,
      "cache": {
        "read": 787456,
        "write": 0
      }
    },
    "title": "示例会话标题",
    "agent": "tech-doc-pm",
    "model": {
      "id": "gpt-5.4",
      "providerID": "codex",
      "variant": "default"
    },
    "version": "1.17.7",
    "time": {
      "created": 1783990000000,
      "updated": 1783990100000
    }
  }
]
```

基于 OpenAPI schema 的结构要点：

- 响应是 `Session[]`
- 常见字段包括 `id`、`slug`、`projectID`、`directory`、`title`、`version`、`time`
- 还可能包含 `workspaceID`、`parentID`、`share`、`metadata`、`permission`、`revert`

（来源：本地 `http://127.0.0.1:14096/session` 实测；本地 `http://127.0.0.1:14096/doc` schema）

### 11.6 `POST /session`

用途：创建经典 REST 会话。

基于 OpenAPI schema 的请求体结构示例：

```json
{
  "parentID": "ses_parent",
  "title": "新会话标题",
  "agent": "tech-doc-pm",
  "model": {
    "id": "gpt-5.4",
    "providerID": "codex",
    "variant": "default"
  },
  "metadata": {
    "source": "manual"
  },
  "permission": {},
  "workspaceID": "wrk_xxx"
}
```

说明：

- `parentID`、`title`、`agent`、`model`、`metadata`、`permission`、`workspaceID` 都是 schema 中允许的字段
- `model.id` 与 `model.providerID` 是 `model` 对象中的必填字段

基于 OpenAPI schema 的响应体结构示例：

```json
{
  "id": "ses_xxx",
  "slug": "new-session",
  "projectID": "global",
  "workspaceID": "wrk_xxx",
  "directory": "E:/path/to/project",
  "path": "E:/path/to/project",
  "title": "新会话标题",
  "agent": "tech-doc-pm",
  "model": {
    "id": "gpt-5.4",
    "providerID": "codex",
    "variant": "default"
  },
  "version": "1.17.7",
  "time": {
    "created": 1783990000000,
    "updated": 1783990000000
  }
}
```

说明：这个接口会产生新会话，本文目前只给 schema 结构示例，不附带真实创建结果。（来源：本地 `http://127.0.0.1:14096/doc` schema）

### 11.7 `GET /api/session`

用途：读取新版 `/api/*` 会话列表，支持分页与 cursor。

query 参数（均为可选）：

| 参数 | 类型 | 说明 |
|---|---|---|
| `workspace` | string | workspace ID |
| `limit` | number | 返回条数上限 |
| `order` | string | `asc` / `desc` |
| `search` | string | 搜索关键词 |
| `directory` | string | 指定目录 |
| `project` | string | 指定项目 |
| `subpath` | string | 子路径 |
| `cursor` | string | 分页 cursor |

URL 示例：

```text
GET /api/session?limit=20&order=desc&search=OpenCode
```

说明：上面展示的是 query 参数，不是请求 body。

已实测响应样例（脱敏后，保留最小结构）：

```json
{
  "data": [
    {
      "id": "ses_xxx",
      "parentID": "ses_parent",
      "projectID": "global",
      "agent": "doc-architect",
      "model": {
        "id": "gpt-5.4",
        "providerID": "codex",
        "variant": "default"
      },
      "cost": 0,
      "tokens": {
        "input": 23031,
        "output": 2371,
        "reasoning": 638,
        "cache": {
          "read": 36352,
          "write": 0
        }
      },
      "time": {
        "created": 1783991343669,
        "updated": 1783991412855,
        "archived": null
      },
      "title": "示例子任务会话",
      "location": {
        "directory": "E:/path/to/project",
        "workspaceID": null
      },
      "subpath": "E:/path/to/project"
    }
  ],
  "cursor": {
    "previous": "cursor-prev",
    "next": "cursor-next"
  }
}
```

结构要点：

- 新版响应外层是对象，不是数组
- `data` 保存会话列表
- `cursor.previous` / `cursor.next` 用于分页

（来源：本地 `http://127.0.0.1:14096/api/session?limit=1` 实测；本地 `http://127.0.0.1:14096/doc` schema）

### 11.8 `POST /api/session`

用途：创建新版 `/api/*` 会话。

基于 OpenAPI schema 的请求体结构示例：

```json
{
  "id": "ses_xxx",
  "agent": "tech-doc-pm",
  "model": {
    "id": "gpt-5.4",
    "providerID": "codex",
    "variant": "default"
  },
  "location": {
    "directory": "E:/path/to/project",
    "workspaceID": "wrk_xxx"
  }
}
```

说明：`id` 出现在 schema 请求体中，但若你的调用场景不需要客户端显式指定会话 ID，可以省略该字段，优先只传 `agent`、`model` 与 `location`。（来源：本地 `http://127.0.0.1:14096/doc` schema）

基于 OpenAPI schema 的响应体结构示例：

```json
{
  "data": {
    "id": "ses_xxx",
    "projectID": "global",
    "agent": "tech-doc-pm",
    "model": {
      "id": "gpt-5.4",
      "providerID": "codex",
      "variant": "default"
    },
    "cost": 0,
    "tokens": {
      "input": 0,
      "output": 0,
      "reasoning": 0,
      "cache": {
        "read": 0,
        "write": 0
      }
    },
    "time": {
      "created": 1783990000000,
      "updated": 1783990000000,
      "archived": null
    },
    "title": "新会话标题",
    "location": {
      "directory": "E:/path/to/project",
      "workspaceID": "wrk_xxx"
    },
    "subpath": "E:/path/to/project"
  }
}
```

说明：新版创建接口的响应被包在 `data` 字段里，这一点与经典 `/session` 不同。（来源：本地 `http://127.0.0.1:14096/doc` schema）

### 11.9 `GET /provider`

用途：读取经典 provider 列表。

query 参数（均为可选）：

| 参数 | 类型 | 说明 |
|---|---|---|
| `directory` | string | 指定目录 |
| `workspace` | string | 指定 workspace |

URL 示例：

```text
GET /provider?directory=E:/path/to/project&workspace=wrk_xxx
```

说明：上面展示的是 query 参数，不是请求 body；query 参数名与响应里的字段名不一定相同。以下 JSON 为 **schema 结构示例**；实测仅用于确认外层字段形状与经典结构特征。

基于 OpenAPI schema 的响应体结构示例（脱敏后）：

```json
{
  "all": [
    {
      "id": "provider-a",
      "name": "示例 Provider",
      "source": "custom",
      "env": [
        "PROVIDER_API_KEY"
      ],
      "options": {},
      "models": {
        "model-a": {
          "id": "model-a",
          "providerID": "provider-a"
        }
      }
    }
  ],
  "default": {
    "chat": "model-a"
  },
  "connected": [
    "provider-a"
  ]
}
```

结构要点：

- 经典 `/provider` 的外层字段是 `all`、`default`、`connected`
- `all[*].models` 是一个对象映射，而不是数组

（来源：本地 `http://127.0.0.1:14096/doc` schema；本地 `http://127.0.0.1:14096/provider` 实测结构观察）

### 11.10 `GET /api/provider`

用途：读取新版 provider 列表。

query 参数（schema 视角）：

| 参数 | 类型 | 说明 |
|---|---|---|
| `location[directory]` | string | 指定目录 |
| `location[workspace]` | string | 指定 workspace |

URL 示例：

```text
GET /api/provider?location[directory]=E:/path/to/project&location[workspace]=wrk_xxx
```

说明：这里展示的是 deepObject 风格 query 参数，不是请求 body；query 参数名与响应里的字段名不一定相同。以下 JSON 为 **schema 结构示例**；实测仅用于确认外层字段是 `location` + `data`。

基于 OpenAPI schema 的响应体结构示例（脱敏后）：

```json
{
  "location": {
    "directory": "E:/path/to/project",
    "project": {
      "id": "global",
      "directory": "E:/path/to/project"
    }
  },
  "data": [
    {
      "id": "provider-a",
      "name": "示例 Provider",
      "disabled": false,
      "api": {
        "type": "aisdk",
        "package": "@ai-sdk/openai-compatible",
        "url": "https://example.invalid/v1",
        "settings": {}
      },
      "request": {
        "headers": {},
        "body": {}
      }
    }
  ]
}
```

结构要点：

- 新版 `/api/provider` 的外层字段是 `location` 和 `data`
- `data[*].api` 与 `data[*].request` 是新版结构的重点
- 这一组结构与经典 `/provider` 明显不同

（来源：本地 `http://127.0.0.1:14096/doc` schema；本地 `http://127.0.0.1:14096/api/provider` 实测结构观察）

### 11.11 `GET /question`（实测案例：查询待回答问题列表）

用途：查询当前实例所有待用户回答的问题（Agent 在会话中通过 ask 工具向用户提问后，问题会出现在这里）。

query 参数：

| 参数 | 类型 | 说明 |
|---|---|---|
| `directory` | string | 指定项目目录。**注意目录拼接规则，见下方备注** |

实测请求（curl）：

```bash
curl --location --request GET 'http://127.0.0.1:34096/question?directory=F:/Desktop/feima/sdd-demo-dsh/.worktree/1014'
```

已实测响应样例（200，数组；无待处理问题时返回 `[]`）：

```json
[
    {
        "id": "que_1385b54e9001SWJ3eNZw2xcUdr",
        "sessionID": "ses_ec7a4df0dffe6zP764BR3sqvv5",
        "questions": [
            {
                "question": "1+1=?",
                "header": "算术题",
                "options": [
                    {
                        "label": "2",
                        "description": "正确答案"
                    },
                    {
                        "label": "3",
                        "description": "干扰项"
                    },
                    {
                        "label": "4",
                        "description": "干扰项"
                    }
                ]
            }
        ],
        "tool": {
            "messageID": "msg_1385b22b9001XLgc1AQgvgH5SS",
            "callID": "call_7387792f4dee44e99371c05f"
        }
    }
]
```

结构要点：

- 响应是数组，每个元素对应一次提问请求
- `id`：问题请求 ID（`que_` 前缀），后续 reply / reject 都要用它
- `sessionID`：发起提问的会话 ID
- `questions[]`：一次请求可包含多个问题；每个问题有 `question`、`header`、`options[]`，`options[*].label` 是可回复的选项值，`description` 是选项说明
- `tool.messageID` + `tool.callID`：定位到会话消息里触发提问的那次工具调用，可用于关联消息上下文

典型调用链：

1. `GET /question?directory=<目录>` 轮询待回答问题
2. `POST /question/{requestID}/reply` 携带选中的 `options[*].label` 回复；或 `POST /question/{requestID}/reject` 拒绝

⚠️ **directory 参数拼接规则（实测备注）**：

- 未开启 workspace 时，`directory` 传项目根目录，如 `F:/Desktop/feima/sdd-demo-dsh`
- 开启 workspace 后，`directory` 需要拼接工作区路径，如 `F:/Desktop/feima/sdd-demo-dsh/.worktree/1014`（项目根目录 + `.worktree/<worktree 名>`）。传错层级会导致查不到该 workspace 会话下的问题

（来源：本地 `http://127.0.0.1:34096/question` 实测，注意该实例端口为 34096，与本文其他样例的 14096 不同——端口随实例启动而变化，调用前先用 `/global/health` 或 `/api/health` 确认）

## 十三、快速定位

- 想看新版统一入口：先查 `/api/session`、`/api/provider`、`/api/fs/*`、`/api/pty/*`
- 想看经典主流程：先查 `/session`、`/project`、`/global/config`、`/config`、`/path`、`/vcs`
- 想看终端与交互：查 `/pty*`、`/tui/*`
- 想看集成、MCP 与认证：查 `/provider*`、`/mcp*`、`/auth/*`、`/api/integration*`
- 想看实验性工作区能力：查 `/experimental/workspace*`、`/experimental/worktree*`、`/sync/*`