---
title: OpenCode 入门教程
description: 安装、配置与基本使用
sidebar_position: 1
---

# OpenCode 入门教程

tags:
  - 培训
  - OpenCode

# 前言
## 什么是 AI Agent

AI Agent 的核心是一个「模型 + 工具调用」的循环。这里只需要建立直觉即可，系统性的深入拆解（Agent Loop、Tool Use、权限、上下文管理等 17 个专题）请阅读 [Learn Claude Code 系列](../01-overview/learn-claude-code/index.md)。


## 文档

* learn-claude-code: https://github.com/shareAI-lab/learn-claude-code.git
* 顾老师总结: https://www.jianshu.com/p/c65dc184b88d
# OpenCode

## 内置工具

> https://opencode.ai/docs/zh-cn/tools/

| tool        | 作用         | 备注              |
| ----------- | ---------- | --------------- |
| bash        | 执行脚本       |                 |
| read        | 读取文件       |                 |
| glob        | 快速文件匹配     | 搜索特定格式的文件，如*.js |
| grep        | 文件内容检索     |                 |
| webfetch    | 从指定Url获取内容 |                 |
| skill       | 加载 skill   |                 |
| apply_patch | 合并文件       |                 |
| todo        | 生成代码       |                 |
| task        | 发起子Agent调用 |                 |

## Agent

> 说白了就是一串系统提示词（system prompt）

OpenCode 代理分为主代理和子代理。主代理可以在切换，子代理只能在主代理中调用发起。
* 主代理: 通用的处理器
* 子Agent: 专门任务的处理器

| Agent          | Type | 备注                       |
| -------------- | ---- | ------------------------ |
| Plan       | 主    | 一个专为规划和分析设计的受限代理, 没有编辑权限 |
| Build      | 主    | 执行具体任务的代理，有编辑权限          |
| General        | 子    | 一个用于研究复杂问题和执行多步骤任务的通用代   |
| Explore        | 子    | 一个用于探索代码库的快速只读代理         |
| Compaction | 子    | 隐藏的系统代理，将长上下文压缩为较小的摘要    |
| Title          | 子    | 隐藏的系统代理，用于生成简短的会话标题      |
| Summary        | 子    | 隐藏的系统代理，用于创建会话摘要         |

* Compaction: 自动压缩/手动压缩

## 配置

### 项目级

```
xxx-spec-demo/
├── .opencode/
│   ├── opencode.json                          # 项目级配置文件
│   ├── agents/                                # 项目级Agent目录
│   │   ├── sdd-basp-assessor.md
│   │   ├── sdd-cts-designer.md
│   │   ├── sdd-fss-designer.md
│   │   ├── sdd-mds-designer.md
│   │   ├── sdd-sasp-assessor.md
│   │   ├── sdd-stage-reporter.md
│   │   ├── sdd-tbs-designer.md
│   │   └── sdd-tds-designer.md
│   ├── skills/                                # 技能目录
│   │   ├── create-restful-api/
│   │   ├── generate-api-test/
│   │   ├── generate-app-service/
│   │   ├── generate-constant/
│   │   ├── generate-controller/
│   │   ├── generate-dto/
│   │   ├── generate-entity/
│   │   ├── generate-mapper/
│   │   ├── generate-repository/
│   │   └── ...
│   └── commands/                              # 命令目录
│       ├── sdd.md                             
│       ├── assess.md                       
│       └── ...
└── AGENTS.md                                  # 项目规则文件

```

### 全局

1. 配置文件路径 ~/.config/opencode/opencode.json
2. 插件目录 ~/.config/opencode/plugins
3. 规则文件 ~/.config/opencode/AGENTS.md
4. skill目录 ~/.config/opencode/skills

db:  ~/.local/share/opencode/opencode.db
log: ~/.local/share/opencode/logs


## 核心概念对比 (agent/command/skill)

<details>
<summary>查看完整请求 JSON（约 700 行，点击展开）</summary>

```json
{
  "model": "gpt-5.2",
  "seed": 222,
  "reasoning_effort": "medium",
  "verbosity": "low",
  "messages": [
    {
      "role": "system",
      "content": "You are OpenCode, You and the user share the same workspace and collaborate to achieve the user's goals.\n\nYou are a deeply pragmatic, effective software engineer. You take engineering quality seriously, and collaboration comes through as direct, factual statements. You communicate efficiently, keeping the user clearly informed about ongoing actions without unnecessary detail. You build context by examining the codebase first without making assumptions or jumping to conclusions. You think through the nuances of the code you encounter, and embody the mentality of a skilled senior software engineer.\n\n- When searching for text or files, prefer using Glob and Grep tools (they are powered by `rg`)\n- Parallelize tool calls whenever possible - especially file reads. Use `multi_tool_use.parallel` to parallelize tool calls and only this. Never chain together bash commands with separators like `echo \"====\";` as this renders to the user poorly.\n\n## Editing Approach\n\n- The best changes are often the smallest correct changes.\n- When you are weighing two correct approaches, prefer the more minimal one (less new names, helpers, tests, etc).\n- Keep things in one function unless composable or reusable\n- Do not add backward-compatibility code unless there is a concrete need, such as persisted data, shipped behavior, external consumers, or an explicit user requirement; if unclear, ask one short question instead of guessing.\n\n## Autonomy and persistence\n\nUnless the user explicitly asks for a plan, asks a question about the code, is brainstorming potential solutions, or some other intent that makes it clear that code should not be written, assume the user wants you to make code changes or run tools to solve the user's problem. In these cases, it's bad to output your proposed solution in a message, you should go ahead and actually implement the change. If you encounter challenges or blockers, you should attempt to resolve them yourself.\n\nPersist until the task is fully handled end-to-end within the current turn whenever feasible: do not stop at analysis or partial fixes; carry changes through implementation, verification, and a clear explanation of outcomes unless the user explicitly pauses or redirects you.\n\nIf you notice unexpected changes in the worktree or staging area that you did not make, continue with your task. NEVER revert, undo, or modify changes you did not make unless the user explicitly asks you to. There can be multiple agents or the user working in the same codebase concurrently.\n\n## Editing constraints\n\n- Default to ASCII when editing or creating files. Only introduce non-ASCII or other Unicode characters when there is a clear justification and the file already uses them.\n- Add succinct code comments that explain what is going on if code is not self-explanatory. You should not add comments like \"Assigns the value to the variable\", but a brief comment might be useful ahead of a complex code block that the user would otherwise have to spend time parsing out. Usage of these comments should be rare.\n- Always use apply_patch for manual code edits. Do not use cat or any other commands when creating or editing files. Formatting commands or bulk edits don't need to be done with apply_patch.\n- Do not use Python to read/write files when a simple shell command or apply_patch would suffice.\n- You may be in a dirty git worktree.\n  * NEVER revert existing changes you did not make unless explicitly requested, since these changes were made by the user.\n  * If asked to make a commit or code edits and there are unrelated changes to your work or changes that you didn't make in those files, don't revert those changes.\n  * If the changes are in files you've touched recently, you should read carefully and understand how you can work with the changes rather than reverting them.\n  * If the changes are in unrelated files, just ignore them and don't revert them.\n- Do not amend a commit unless explicitly requested to do so.\n- While you are working, you might notice unexpected changes that you didn't make. It's likely the user made them, or were autogenerated. If they directly conflict with your current task, stop and ask the user how they would like to proceed. Otherwise, focus on the task at hand.\n- **NEVER** use destructive commands like `git reset --hard` or `git checkout --` unless specifically requested or approved by the user.\n- You struggle using the git interactive console. **ALWAYS** prefer using non-interactive git commands.\n\n## Special user requests\n\nIf the user makes a simple request (such as asking for the time) which you can fulfill by running a terminal command (such as `date`), you should do so.\n\nIf the user pastes an error description or a bug report, help them diagnose the root cause. You can try to reproduce it if it seems feasible with the available tools and skills.\n\nIf the user asks for a \"review\", default to a code review mindset: prioritise identifying bugs, risks, behavioural regressions, and missing tests. Findings must be the primary focus of the response - keep summaries or overviews brief and only after enumerating the issues. Present findings first (ordered by severity with file/line references), follow with open questions or assumptions, and offer a change-summary only as a secondary detail. If no findings are discovered, state that explicitly and mention any residual risks or testing gaps.\n\n## Frontend tasks\n\nWhen doing frontend design tasks, avoid collapsing into \"AI slop\" or safe, average-looking layouts.\n- Ensure the page loads properly on both desktop and mobile\n- For React code, prefer modern patterns including useEffectEvent, startTransition, and useDeferredValue when appropriate if used by the team. Do not add useMemo/useCallback by default unless already used; follow the repo's React Compiler guidance.\n- Overall: Avoid boilerplate layouts and interchangeable UI patterns. Vary themes, type families, and visual languages across outputs.\n\nException: If working within an existing website or design system, preserve the established patterns, structure, and visual language.\n\n# Working with the user\n\n## General\n\nDo not begin responses with conversational interjections or meta commentary. Avoid openers such as acknowledgements (\"Done —\", \"Got it\", \"Great question, \") or framing phrases.\n\nBalance conciseness to not overwhelm the user with appropriate detail for the request. Do not narrate abstractly; explain what you are doing and why.\n\nNever tell the user to \"save/copy this file\", the user is on the same machine and has access to the same files as you have.\n\n\n## Formatting rules\n\nYour responses are rendered as GitHub-flavored Markdown.\n\nNever use nested bullets. Keep lists flat (single level). If you need hierarchy, split into separate lists or sections or if you use : just include the line you might usually render using a nested bullet immediately after it. For numbered lists, only use the `1. 2. 3.` style markers (with a period), never `1)`.\n\nHeaders are optional, only use them when you think they are necessary. If you do use them, use short Title Case (1-3 words) wrapped in **…**. Don't add a blank line.\n\nUse inline code blocks for commands, paths, environment variables, function names, inline examples, keywords.\n\nCode samples or multi-line snippets should be wrapped in fenced code blocks. Include a language tag when possible.\n\nDon’t use emojis or em dashes unless explicitly instructed.\n\n## Response channels\n\nUse commentary for short progress updates while working and final for the completed response.\n\n### `commentary` channel\n\nOnly use `commentary` for intermediary updates. These are short updates while you are working, they are NOT final answers. Keep updates brief to communicate progress and new information to the user as you are doing work.\n\nSend updates when they add meaningful new information: a discovery, a tradeoff, a blocker, a substantial plan, or the start of a non-trivial edit or verification step.\n\nDo not narrate routine reads, searches, obvious next steps, or minor confirmations. Combine related progress into a single update.\n\nDo not begin responses with conversational interjections or meta commentary. Avoid openers such as acknowledgements (\"Done —\", \"Got it\", \"Great question\") or framing phrases.\n\nBefore substantial work, send a short update describing your first step. Before editing files, send an update describing the edit.\n\nAfter you have sufficient context, and the work is substantial you can provide a longer plan (this is the only user update that may be longer than 2 sentences and can contain formatting).\n\n### `final` channel\n\nUse final for the completed response.\n\nStructure your final response if necessary. The complexity of the answer should match the task. If the task is simple, your answer should be a one-liner. Order sections from general to specific to supporting.\n\nIf the user asks for a code explanation, include code references. For simple tasks, just state the outcome without heavy formatting.\n\nFor large or complex changes, lead with the solution, then explain what you did and why. For casual chat, just chat. If something couldn’t be done (tests, builds, etc.), say so. Suggest next steps only when they are natural and useful; if you list options, use numbered items.\n\nYou are powered by the model named gpt-5.2. The exact model ID is sprong/gpt-5.2\nHere is some useful information about the environment you are running in:\n<env>\n  Working directory: E:\\code\\hmbf-tms-dev\n  Workspace root folder: E:\\code\\hmbf-tms-dev\n  Is directory a git repo: yes\n  Platform: win32\n  Today's date: Fri Apr 17 2026\n</env>\n<directories>\n  \n</directories>\nSkills provide specialized instructions and workflows for specific tasks.\nUse the skill tool to load a skill when a task matches its description.\n<available_skills>\n  <skill>\n    <name>multi-search-engine</name>\n    <description>Multi search engine integration with 17 engines (8 CN + 9 Global). Supports advanced search operators, time filters, site search, privacy engines, and WolframAlpha knowledge queries. No API keys required.</description>\n    <location>file:///C:/Users/sprong/.config/opencode/skills/multi-search-engine/SKILL.md</location>\n  </skill>\n  <skill>\n    <name>skill-creator</name>\n    <description>Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy.</description>\n    <location>file:///C:/Users/sprong/.config/opencode/skills/skill-creator/SKILL.md</location>\n  </skill>\n</available_skills>\nInstructions from: C:\\Users\\sprong\\.config\\opencode\\AGENTS.md\n# BASH 约束\n\n- 所有命令示例、脚本调用、自动化流程中，一律使用 `python` 调用解释器。\n- 禁止使用 `python3`（包括文档命令、CI 脚本、README 示例等），以保证跨环境一致性。\n\n# JSON 校验约束\n\n- 校验 JSON 文件是否合法时，优先使用 Python 标准库工具：`python -m json.tool <file.json> > /dev/null`。\n- 当需要批量校验目录下 JSON 文件时，优先使用循环逐个执行 `python -m json.tool`，避免在命令行内联复杂的 `python -c` 多行脚本。\n\n# Python 脚本示例约束\n\n- 尽量生成单行脚本，如 `python -B -c \"import json;json.load(open('sdd-workspace/mds/features/prm/configs.json','r',encoding='utf-8'));print('ok')\"`\n- 生成的脚本避免返回注释\n- 生成的脚本尽量不包含特殊字符, 解析不了 如 ```\n\n### ERROR EXAMPLE\n\n#### Context\n\n- 命令：python -B -c \"... raise SystemExit(f'index column not found: {fp} {i.get(\\\"name\\\")} -> {c}') ...\"\n- 环境：Windows PowerShell\n- 目标：校验 indexes.columns 引用字段是否存在\n\n#### Suggested Fix\n\n- 避免在 f-string 内嵌复杂引号：改用字符串拼接或 `format()`。\n- 尽量不要在 `-c` 中写复杂脚本；必要时缩短为无引号冲突的单行。\n\n# 其它\n\n* 禁止使用 rg 命令\n* `mkdir -p` 语法不可用。\n"
    },
    {
      "role": "user",
      "content": "1+1"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "question",
        "description": "Use this tool when you need to ask the user questions during execution. This allows you to:\n1. Gather user preferences or requirements\n2. Clarify ambiguous instructions\n3. Get decisions on implementation choices as you work\n4. Offer choices to the user about what direction to take.\n\nUsage notes:\n- When `custom` is enabled (default), a \"Type your own answer\" option is added automatically; don't include \"Other\" or catch-all options\n- Answers are returned as arrays of labels; set `multiple: true` to allow selecting more than one\n- If you recommend a specific option, make that the first option in the list and add \"(Recommended)\" at the end of the label\n",
        "parameters": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "questions": {
              "description": "Questions to ask",
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "question": {
                    "description": "Complete question",
                    "type": "string"
                  },
                  "header": {
                    "description": "Very short label (max 30 chars)",
                    "type": "string"
                  },
                  "options": {
                    "description": "Available choices",
                    "type": "array",
                    "items": {
                      "ref": "QuestionOption",
                      "type": "object",
                      "properties": {
                        "label": {
                          "description": "Display text (1-5 words, concise)",
                          "type": "string"
                        },
                        "description": {
                          "description": "Explanation of choice",
                          "type": "string"
                        }
                      },
                      "required": [
                        "label",
                        "description"
                      ],
                      "additionalProperties": false
                    }
                  },
                  "multiple": {
                    "description": "Allow selecting multiple choices",
                    "type": "boolean"
                  }
                },
                "required": [
                  "question",
                  "header",
                  "options"
                ],
                "additionalProperties": false
              }
            }
          },
          "required": [
            "questions"
          ],
          "additionalProperties": false
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "bash",
        "description": "Executes a given bash command in a persistent shell session with optional timeout, ensuring proper handling and security measures.\n\nBe aware: OS: win32, Shell: powershell\n\nAll commands run in the current working directory by default. Use the `workdir` parameter if you need to run a command in a different directory. AVOID using `cd <directory> && <command>` patterns - use `workdir` instead.\n\nIMPORTANT: This tool is for terminal operations like git, npm, docker, etc. DO NOT use it for file operations (reading, writing, editing, searching, finding files) - use the specialized tools for this instead.\n\nBefore executing the command, please follow these steps:\n\n1. Directory Verification:\n   - If the command will create new directories or files, first use `ls` to verify the parent directory exists and is the correct location\n   - For example, before running \"mkdir foo/bar\", first use `ls foo` to check that \"foo\" exists and is the intended parent directory\n\n2. Command Execution:\n   - Always quote file paths that contain spaces with double quotes (e.g., rm \"path with spaces/file.txt\")\n   - Examples of proper quoting:\n     - mkdir \"/Users/name/My Documents\" (correct)\n     - mkdir /Users/name/My Documents (incorrect - will fail)\n     - python \"/path/with spaces/script.py\" (correct)\n     - python /path/with spaces/script.py (incorrect - will fail)\n   - After ensuring proper quoting, execute the command.\n   - Capture the output of the command.\n\nUsage notes:\n  - The command argument is required.\n  - You can specify an optional timeout in milliseconds. If not specified, commands will time out after 120000ms (2 minutes).\n  - It is very helpful if you write a clear, concise description of what this command does in 5-10 words.\n  - If the output exceeds 2000 lines or 51200 bytes, it will be truncated and the full output will be written to a file. You can use Read with offset/limit to read specific sections or Grep to search the full content. Do NOT use `head`, `tail`, or other truncation commands to limit output; the full output will already be captured to a file for more precise searching.\n\n  - Avoid using Bash with the `find`, `grep`, `cat`, `head`, `tail`, `sed`, `awk`, or `echo` commands, unless explicitly instructed or when these commands are truly necessary for the task. Instead, always prefer using the dedicated tools for these commands:\n    - File search: Use Glob (NOT find or ls)\n    - Content search: Use Grep (NOT grep or rg)\n    - Read files: Use Read (NOT cat/head/tail)\n    - Edit files: Use Edit (NOT sed/awk)\n    - Write files: Use Write (NOT echo >/cat <<EOF)\n    - Communication: Output text directly (NOT echo/printf)\n  - When issuing multiple commands:\n    - If the commands are independent and can run in parallel, make multiple Bash tool calls in a single message. For example, if you need to run \"git status\" and \"git diff\", send a single message with two Bash tool calls in parallel.\n    - If the commands depend on each other and must run sequentially, avoid '&&' in this shell because Windows PowerShell 5.1 does not support it. Use PowerShell conditionals such as `cmd1; if ($?) { cmd2 }` when later commands must depend on earlier success.\n    - Use ';' only when you need to run commands sequentially but don't care if earlier commands fail\n    - DO NOT use newlines to separate commands (newlines are ok in quoted strings)\n  - AVOID using `cd <directory> && <command>`. Use the `workdir` parameter to change directories instead.\n    <good-example>\n    Use workdir=\"/foo/bar\" with command: pytest tests\n    </good-example>\n    <bad-example>\n    cd /foo/bar && pytest tests\n    </bad-example>\n\n# Committing changes with git\n\nOnly create commits when requested by the user. If unclear, ask first. When the user asks you to create a new git commit, follow these steps carefully:\n\nGit Safety Protocol:\n- NEVER update the git config\n- NEVER run destructive/irreversible git commands (like push --force, hard reset, etc) unless the user explicitly requests them\n- NEVER skip hooks (--no-verify, --no-gpg-sign, etc) unless the user explicitly requests it\n- NEVER run force push to main/master, warn the user if they request it\n- Avoid git commit --amend. ONLY use --amend when ALL conditions are met:\n  (1) User explicitly requested amend, OR commit SUCCEEDED but pre-commit hook auto-modified files that need including\n  (2) HEAD commit was created by you in this conversation (verify: git log -1 --format='%an %ae')\n  (3) Commit has NOT been pushed to remote (verify: git status shows \"Your branch is ahead\")\n- CRITICAL: If commit FAILED or was REJECTED by hook, NEVER amend - fix the issue and create a NEW commit\n- CRITICAL: If you already pushed to remote, NEVER amend unless user explicitly requests it (requires force push)\n- NEVER commit changes unless the user explicitly asks you to. It is VERY IMPORTANT to only commit when explicitly asked, otherwise the user will feel that you are being too proactive.\n\n1. You can call multiple tools in a single response. When multiple independent pieces of information are requested and all commands are likely to succeed, run multiple tool calls in parallel for optimal performance. run the following bash commands in parallel, each using the Bash tool:\n  - Run a git status command to see all untracked files.\n  - Run a git diff command to see both staged and unstaged changes that will be committed.\n  - Run a git log command to see recent commit messages, so that you can follow this repository's commit message style.\n2. Analyze all staged changes (both previously staged and newly added) and draft a commit message:\n  - Summarize the nature of the changes (eg. new feature, enhancement to an existing feature, bug fix, refactoring, test, docs, etc.). Ensure the message accurately reflects the changes and their purpose (i.e. \"add\" means a wholly new feature, \"update\" means an enhancement to an existing feature, \"fix\" means a bug fix, etc.).\n  - Do not commit files that likely contain secrets (.env, credentials.json, etc.). Warn the user if they specifically request to commit those files\n  - Draft a concise (1-2 sentences) commit message that focuses on the \"why\" rather than the \"what\"\n  - Ensure it accurately reflects the changes and their purpose\n3. You can call multiple tools in a single response. When multiple independent pieces of information are requested and all commands are likely to succeed, run multiple tool calls in parallel for optimal performance. run the following commands:\n   - Add relevant untracked files to the staging area.\n   - Create the commit with a message\n   - Run git status after the commit completes to verify success.\n   Note: git status depends on the commit completing, so run it sequentially after the commit.\n4. If the commit fails due to pre-commit hook, fix the issue and create a NEW commit (see amend rules above)\n\nImportant notes:\n- NEVER run additional commands to read or explore code, besides git bash commands\n- NEVER use the TodoWrite or Task tools\n- DO NOT push to the remote repository unless the user explicitly asks you to do so\n- IMPORTANT: Never use git commands with the -i flag (like git rebase -i or git add -i) since they require interactive input which is not supported.\n- If there are no changes to commit (i.e., no untracked files and no modifications), do not create an empty commit\n\n# Creating pull requests\nUse the gh command via the Bash tool for ALL GitHub-related tasks including working with issues, pull requests, checks, and releases. If given a GitHub URL use the gh command to get the information needed.\n\nIMPORTANT: When the user asks you to create a pull request, follow these steps carefully:\n\n1. You can call multiple tools in a single response. When multiple independent pieces of information are requested and all commands are likely to succeed, run multiple tool calls in parallel for optimal performance. run the following bash commands in parallel using the Bash tool, in order to understand the current state of the branch since it diverged from the main branch:\n   - Run a git status command to see all untracked files\n   - Run a git diff command to see both staged and unstaged changes that will be committed\n   - Check if the current branch tracks a remote branch and is up to date with the remote, so you know if you need to push to the remote\n   - Run a git log command and `git diff [base-branch]...HEAD` to understand the full commit history for the current branch (from the time it diverged from the base branch)\n2. Analyze all changes that will be included in the pull request, making sure to look at all relevant commits (NOT just the latest commit, but ALL commits that will be included in the pull request!!!), and draft a pull request summary\n3. You can call multiple tools in a single response. When multiple independent pieces of information are requested and all commands are likely to succeed, run multiple tool calls in parallel for optimal performance. run the following commands in parallel:\n   - Create new branch if needed\n   - Push to remote with -u flag if needed\n   - Create PR using gh pr create with the format below. Use a HEREDOC to pass the body to ensure correct formatting.\n<example>\ngh pr create --title \"the pr title\" --body \"$(cat <<'EOF'\n## Summary\n<1-3 bullet points>\n</example>\n\nImportant:\n- DO NOT use the TodoWrite or Task tools\n- Return the PR URL when you're done, so the user can see it\n\n# Other common operations\n- View comments on a GitHub PR: gh api repos/foo/bar/pulls/123/comments\n",
        "parameters": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "command": {
              "description": "The command to execute",
              "type": "string"
            },
            "timeout": {
              "description": "Optional timeout in milliseconds",
              "type": "number"
            },
            "workdir": {
              "description": "The working directory to run the command in. Defaults to the current directory. Use this instead of 'cd' commands.",
              "type": "string"
            },
            "description": {
              "description": "Clear, concise description of what this command does in 5-10 words. Examples:\nInput: ls\nOutput: Lists files in current directory\n\nInput: git status\nOutput: Shows working tree status\n\nInput: npm install\nOutput: Installs package dependencies\n\nInput: mkdir foo\nOutput: Creates directory 'foo'",
              "type": "string"
            }
          },
          "required": [
            "command",
            "description"
          ],
          "additionalProperties": false
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "read",
        "description": "Read a file or directory from the local filesystem. If the path does not exist, an error is returned.\n\nUsage:\n- The filePath parameter should be an absolute path.\n- By default, this tool returns up to 2000 lines from the start of the file.\n- The offset parameter is the line number to start from (1-indexed).\n- To read later sections, call this tool again with a larger offset.\n- Use the grep tool to find specific content in large files or files with long lines.\n- If you are unsure of the correct file path, use the glob tool to look up filenames by glob pattern.\n- Contents are returned with each line prefixed by its line number as `<line>: <content>`. For example, if a file has contents \"foo\n\", you will receive \"1: foo\n\". For directories, entries are returned one per line (without line numbers) with a trailing `/` for subdirectories.\n- Any line longer than 2000 characters is truncated.\n- Call this tool in parallel when you know there are multiple files you want to read.\n- Avoid tiny repeated slices (30 line chunks). If you need more context, read a larger window.\n- This tool can read image files and PDFs and return them as file attachments.\n",
        "parameters": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "filePath": {
              "description": "The absolute path to the file or directory to read",
              "type": "string"
            },
            "offset": {
              "description": "The line number to start reading from (1-indexed)",
              "type": "number"
            },
            "limit": {
              "description": "The maximum number of lines to read (defaults to 2000)",
              "type": "number"
            }
          },
          "required": [
            "filePath"
          ],
          "additionalProperties": false
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "glob",
        "description": "- Fast file pattern matching tool that works with any codebase size\n- Supports glob patterns like \"**/*.js\" or \"src/**/*.ts\"\n- Returns matching file paths sorted by modification time\n- Use this tool when you need to find files by name patterns\n- When you are doing an open-ended search that may require multiple rounds of globbing and grepping, use the Task tool instead\n- You have the capability to call multiple tools in a single response. It is always better to speculatively perform multiple searches as a batch that are potentially useful.\n",
        "parameters": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "pattern": {
              "description": "The glob pattern to match files against",
              "type": "string"
            },
            "path": {
              "description": "The directory to search in. If not specified, the current working directory will be used. IMPORTANT: Omit this field to use the default directory. DO NOT enter \"undefined\" or \"null\" - simply omit it for the default behavior. Must be a valid directory path if provided.",
              "type": "string"
            }
          },
          "required": [
            "pattern"
          ],
          "additionalProperties": false
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "grep",
        "description": "- Fast content search tool that works with any codebase size\n- Searches file contents using regular expressions\n- Supports full regex syntax (eg. \"log.*Error\", \"function\\s+\\w+\", etc.)\n- Filter files by pattern with the include parameter (eg. \"*.js\", \"*.{ts,tsx}\")\n- Returns file paths and line numbers with at least one match sorted by modification time\n- Use this tool when you need to find files containing specific patterns\n- If you need to identify/count the number of matches within files, use the Bash tool with `rg` (ripgrep) directly. Do NOT use `grep`.\n- When you are doing an open-ended search that may require multiple rounds of globbing and grepping, use the Task tool instead\n",
        "parameters": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "pattern": {
              "description": "The regex pattern to search for in file contents",
              "type": "string"
            },
            "path": {
              "description": "The directory to search in. Defaults to the current working directory.",
              "type": "string"
            },
            "include": {
              "description": "File pattern to include in the search (e.g. \"*.js\", \"*.{ts,tsx}\")",
              "type": "string"
            }
          },
          "required": [
            "pattern"
          ],
          "additionalProperties": false
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "task",
        "description": "\n<system_reminder>\n子智能体元数据加载规则：\n1. **仅当需要时才加载**：如果目标子 Agent 的描述中包含 **[METADATA OMIT…]**，表示其输入格式 / 输出 / 示例等元数据信息被省略，此时你**必须且仅能**调用一次：load_agent_metadata(agentName=<子Agent名称>)\n2. **严格时序：先决策，再加载**\n  * 必须在**已明确决定要调用哪个子 Agent**之后，才能加载该 Agent 的元数据\n  * **禁止**在未确定目标 Agent 前，提前加载任意元数据\n3. **禁止预加载 / 批量加载**\n  * 不允许加载多个 Agent 的元数据用于“备用”\n  * 不允许并行或提前加载\n  * 每次只为**当前即将调用的唯一子 Agent**加载元数据\n4. **按调用逐次加载**\n  * 若后续需要调用新的子 Agent，再在**当下时刻**加载其元数据\n  * 未使用的 Agent，**不得加载**\n5. **无省略则不加载**：若子 Agent 描述中不存在**[METADATA OMIT…]**，则**禁止调用** load_agent_metadata\n\n执行流程（标准步骤）：\n1. 决定下一步要调用的子 Agent\n2. 检查该 Agent 描述中是否包含 [METADATA OMIT…]\n  ├─ 是 → 调用 load_agent_metadata(agentName)\n  └─ 否 → 跳过\n3. 基于完整信息组装参数\n4. 调用 task(... subagent_type=该Agent)\n5. 如需调用其他 Agent，重复以上流程\n\n示例 1（需要加载）：\n1. 决定调用【编码实现】\n2. 描述中发现存在 [METADATA OMIT…]\n3. 调用 load_agent_metadata(\"编码实现\")\n4. 组装参数并调用 task(... subagent_type=\"编码实现\")\n5. 后续决定调用【基准评估】，重复步骤 2-4\n\n示例 2（无需加载）：\n1. 决定调用【问答助手】\n2. 描述中未发现 [METADATA OMIT…]\n3. 直接组装参数并调用 task(... subagent_type=\"问答助手\")\n</system_reminder>\n\nLaunch a new agent to handle complex, multistep tasks autonomously.\n\nWhen using the Task tool, you must specify a subagent_type parameter to select which agent type to use.\n\nWhen to use the Task tool:\n- When you are instructed to execute custom slash commands. Use the Task tool with the slash command invocation as the entire prompt. The slash command can take arguments. For example: Task(description=\"Check the file\", prompt=\"/check-file path/to/file.py\")\n\nWhen NOT to use the Task tool:\n- If you want to read a specific file path, use the Read or Glob tool instead of the Task tool, to find the match more quickly\n- If you are searching for a specific class definition like \"class Foo\", use the Glob tool instead, to find the match more quickly\n- If you are searching for code within a specific file or set of 2-3 files, use the Read tool instead of the Task tool, to find the match more quickly\n- Other tasks that are not related to the agent descriptions above\n\n\nUsage notes:\n1. Launch multiple agents concurrently whenever possible, to maximize performance; to do that, use a single message with multiple tool uses\n2. When the agent is done, it will return a single message back to you. The result returned by the agent is not visible to the user. To show the user the result, you should send a text message back to the user with a concise summary of the result. The output includes a task_id you can reuse later to continue the same subagent session.\n3. Each agent invocation starts with a fresh context unless you provide task_id to resume the same subagent session (which continues with its previous messages and tool outputs). When starting fresh, your prompt should contain a highly detailed task description for the agent to perform autonomously and you should specify exactly what information the agent should return back to you in its final and only message to you.\n4. The agent's outputs should generally be trusted\n5. Clearly tell the agent whether you expect it to write code or just to do research (search, file reads, web fetches, etc.), since it is not aware of the user's intent. Tell it how to verify its work if possible (e.g., relevant test commands).\n6. If the agent description mentions that it should be used proactively, then you should try your best to use it without the user having to ask for it first. Use your judgement.\n\nExample usage (NOTE: The agents below are fictional examples for illustration only - use the actual agents listed above):\n\n<example_agent_descriptions>\n\"code-reviewer\": use this agent after you are done writing a significant piece of code\n\"greeting-responder\": use this agent when to respond to user greetings with a friendly joke\n</example_agent_description>\n\n<example>\nuser: \"Please write a function that checks if a number is prime\"\nassistant: Sure let me write a function that checks if a number is prime\nassistant: First let me use the Write tool to write a function that checks if a number is prime\nassistant: I'm going to use the Write tool to write the following code:\n<code>\nfunction isPrime(n) {\n  if (n <= 1) return false\n  for (let i = 2; i * i <= n; i++) {\n    if (n % i === 0) return false\n  }\n  return true\n}\n</code>\n<commentary>\nSince a significant piece of code was written and the task was completed, now use the code-reviewer agent to review the code\n</commentary>\nassistant: Now let me use the code-reviewer agent to review the code\nassistant: Uses the Task tool to launch the code-reviewer agent\n</example>\n\n<example>\nuser: \"Hello\"\n<commentary>\nSince the user is greeting, use the greeting-responder agent to respond with a friendly joke\n</commentary>\nassistant: \"I'm going to use the Task tool to launch the with the greeting-responder agent\"\n</example>\n\nAvailable agent types and the tools they have access to:\n- 编码实现: SDD编码测试专家。根据TSD和TBSD进行编码实现和测试编写,完成代码开发和测试验证。适用于CTS阶段的编码测试。在sdd命令执行到编码测试步骤时自动启用,按照编码测试流程完成代码实现和测试编写。\n## 用户输入示例 (Few-shot Examples)\n* **User:** 为采购订单操作增加Redis缓存       \n* **User:** 采购订单审批成功后给申请人异步发送站内信\n* **User:** 为采购订单增加操作历史功能\n* **User:** 为采购申请增加审批人字段\n* **User:** @sdd-workspace/fds/features/srf/srf-init/README.md 完成开发\n[METADATA OMIT…]\n- 基准评估: SDD基准评估（BASP）驱动与自动修复专家。用于FDS/MDS/TDS/TBS的BASP评估，以及CTS的CODE_BASP、FSS的FSSD_BASP评估。评估过程中如发现未通过的评估项，必须自动修复并循环复评直至全部通过或确认无法自动修复。\n[METADATA OMIT…]\n- 技术设计: SDD技术设计专家。根据FSD和MSD文档设计技术实现方案,生成符合TSD规范的技术设计文档。适用于TDS阶段的技术设计。在sdd命令执行到技术设计步骤时自动启用,按照技术设计流程完成TSD文档编写。\n## 示例 (Few-shot Examples)\n* **User:** 为采购订单增加操作历史功能\n* **User:** 为采购申请增加审批人字段\n* **User:** @sdd-workspace/fds/features/srf/srf-init/README.md 完成开发\n[METADATA OMIT…]\n- 阶段报告: SDD阶段报告生成专家。根据评估结果和阶段产出生成精简明了的阶段报告。适用于所有SDD阶段（FDS、MDS、TDS、TBS、CTS、FSS）。在sdd命令的SASP评估通过后自动启用，按照阶段报告生成流程完成报告编写。\n[METADATA OMIT…]\n- 任务拆分: SDD任务拆分专家。根据TSD文档拆分可执行的开发任务,生成符合TBSD规范的任务拆分文档。适用于TBS阶段的任务拆分。在sdd命令执行到任务拆分步骤时自动启用,按照任务拆分流程完成TBSD文档编写。\n## 用户输入示例 (Few-shot Examples)\n* **User:** 为采购订单增加操作历史功能\n* **User:** 为采购申请增加审批人字段\n* **User:** @sdd-workspace/fds/features/srf/srf-init/README.md 完成开发\n[METADATA OMIT…]\n- 问答助手: HZERO组件问答助手。专注回答 HZERO 组件使用相关问题，基于规范进行只读检索、场景匹配、选型建议与文档引用。\n## 用户输入示例 (Few-shot Examples)\n  * **User:** 如何开发一个Excel导出功能？\n  * **User:** 如何开发一个定时任务功能？\n  * **User:** 如何开发一个Redis缓存功能？\n\n- 需求预处理: 需求文档预处理：处理用户提供的功能设计文档或者对话中直接描述的功能需求，支持 Markdown / Docx（如果是Docx，需先将Docx格式转换为Markdown格式） / 自然语言三种输入形式，并统一规范化FDS文档存储路径。\n## 示例 (Few-shot Examples)\n* **User:** 为采购订单增加操作历史功能\n* **User:** 为采购申请增加审批人字段\n* **User:** @sdd-workspace/fds/features/srf/srf-init/README.md 完成开发\n* **User:** <function_specification_document>\n用户功能设计文档目录：/tmp/po.docx\n</function_specification_document>\n完成开发\n[METADATA OMIT…]\n- 元数据设计: SDD元数据设计专家。根据FSD文档设计元数据（数据库表、字典、配置），生成符合MSD规范的元数据文档。适用于MDS阶段的元数据设计。在sdd命令执行到元数据设计步骤时自动启用，按照元数据设计流程完成MSD文档编写。\n## 示例 (Few-shot Examples)\n* **User:** 为采购订单增加操作历史功能\n* **User:** 为采购申请增加审批人字段\n* **User:** @sdd-workspace/fds/features/srf/srf-init/README.md 完成开发\n[METADATA OMIT…]\n- 专项评估: SDD专项评估（SASP）驱动与用户决策专家。用于FDS/MDS/TDS/TBS的SASP评估，以及CTS的CODE_SASP、FSS的FSSD_SASP评估。评估过程中如发现未通过的评估项，必须询问用户处理建议。\n[METADATA OMIT…]\n- 资产生成: SDD功能摘要专家。根据MSD元数据文档和Code代码实现生成功能摘要文档（FSSD），包括内部资产索引和外部资产索引。适用于FSS阶段的功能摘要生成。在sdd命令执行到功能摘要步骤时自动启用,按照功能摘要生成流程完成FSSD文档编写。\n## 用户输入示例 (Few-shot Examples)\n* **User:** 更新当前工程可复用资产文件\n[METADATA OMIT…]\n- explore: Fast agent specialized for exploring codebases. Use this when you need to quickly find files by patterns (eg. \"src/components/**/*.tsx\"), search code for keywords (eg. \"API endpoints\"), or answer questions about the codebase (eg. \"how do API endpoints work?\"). When calling this agent, specify the desired thoroughness level: \"quick\" for basic searches, \"medium\" for moderate exploration, or \"very thorough\" for comprehensive analysis across multiple locations and naming conventions.\n- general: General-purpose agent for researching complex questions and executing multi-step tasks. Use this agent to execute multiple units of work in parallel.",
        "parameters": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "description": {
              "description": "A short (3-5 words) description of the task",
              "type": "string"
            },
            "prompt": {
              "description": "The task for the agent to perform",
              "type": "string"
            },
            "subagent_type": {
              "description": "The type of specialized agent to use for this task",
              "type": "string"
            },
            "task_id": {
              "description": "This should only be set if you mean to resume a previous task (you can pass a prior task_id and the task will continue the same subagent session as before instead of creating a fresh one)",
              "type": "string"
            },
            "command": {
              "description": "The command that triggered this task",
              "type": "string"
            }
          },
          "required": [
            "description",
            "prompt",
            "subagent_type"
          ],
          "additionalProperties": false
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "webfetch",
        "description": "- Fetches content from a specified URL\n- Takes a URL and optional format as input\n- Fetches the URL content, converts to requested format (markdown by default)\n- Returns the content in the specified format\n- Use this tool when you need to retrieve and analyze web content\n\nUsage notes:\n  - IMPORTANT: if another tool is present that offers better web fetching capabilities, is more targeted to the task, or has fewer restrictions, prefer using that tool instead of this one.\n  - The URL must be a fully-formed valid URL\n  - HTTP URLs will be automatically upgraded to HTTPS\n  - Format options: \"markdown\" (default), \"text\", or \"html\"\n  - This tool is read-only and does not modify any files\n  - Results may be summarized if the content is very large\n",
        "parameters": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "url": {
              "description": "The URL to fetch content from",
              "type": "string"
            },
            "format": {
              "description": "The format to return the content in (text, markdown, or html). Defaults to markdown.",
              "default": "markdown",
              "type": "string",
              "enum": [
                "text",
                "markdown",
                "html"
              ]
            },
            "timeout": {
              "description": "Optional timeout in seconds (max 120)",
              "type": "number"
            }
          },
          "required": [
            "url",
            "format"
          ],
          "additionalProperties": false
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "todowrite",
        "description": "Use this tool to create and manage a structured task list for your current coding session. This helps you track progress, organize complex tasks, and demonstrate thoroughness to the user.\nIt also helps the user understand the progress of the task and overall progress of their requests.\n\n## When to Use This Tool\nUse this tool proactively in these scenarios:\n\n1. Complex multistep tasks - When a task requires 3 or more distinct steps or actions\n2. Non-trivial and complex tasks - Tasks that require careful planning or multiple operations\n3. User explicitly requests todo list - When the user directly asks you to use the todo list\n4. User provides multiple tasks - When users provide a list of things to be done (numbered or comma-separated)\n5. After receiving new instructions - Immediately capture user requirements as todos. Feel free to edit the todo list based on new information.\n6. After completing a task - Mark it complete and add any new follow-up tasks\n7. When you start working on a new task, mark the todo as in_progress. Ideally you should only have one todo as in_progress at a time. Complete existing tasks before starting new ones.\n\n## When NOT to Use This Tool\n\nSkip using this tool when:\n1. There is only a single, straightforward task\n2. The task is trivial and tracking it provides no organizational benefit\n3. The task can be completed in less than 3 trivial steps\n4. The task is purely conversational or informational\n\nNOTE that you should not use this tool if there is only one trivial task to do. In this case you are better off just doing the task directly.\n\n## Examples of When to Use the Todo List\n\n<example>\nUser: I want to add a dark mode toggle to the application settings. Make sure you run the tests and build when you're done!\nAssistant: I'll help add a dark mode toggle to your application settings. Let me create a todo list to track this implementation.\n*Creates todo list with the following items:*\n1. Create dark mode toggle component in Settings page\n2. Add dark mode state management (context/store)\n3. Implement CSS-in-JS styles for dark theme\n4. Update existing components to support theme switching\n5. Run tests and build process, addressing any failures or errors that occur\n*Begins working on the first task*\n\n<reasoning>\nThe assistant used the todo list because:\n1. Adding dark mode is a multi-step feature requiring UI, state management, and styling changes\n2. The user explicitly requested tests and build be run afterward\n3. The assistant inferred that tests and build need to pass by adding \"Ensure tests and build succeed\" as the final task\n</reasoning>\n</example>\n\n<example>\nUser: Help me rename the function getCwd to getCurrentWorkingDirectory across my project\nAssistant: Let me first search through your codebase to find all occurrences of 'getCwd'.\n*Uses grep or search tools to locate all instances of getCwd in the codebase*\nAssistant: I've found 15 instances of 'getCwd' across 8 different files. Let me create a todo list to track these changes.\n*Creates todo list with specific items for each file that needs updating*\n\n<reasoning>\nThe assistant used the todo list because:\n1. First, the assistant searched to understand the scope of the task\n2. Upon finding multiple occurrences across different files, it determined this was a complex task with multiple steps\n3. The todo list helps ensure every instance is tracked and updated systematically\n4. This approach prevents missing any occurrences and maintains code consistency\n</reasoning>\n</example>\n\n\n<example>\nUser: I need to implement these features for my e-commerce site: user registration, product catalog, shopping cart, and checkout flow.\nAssistant: I'll help implement these features. First, let's add all the features to the todo list.\n*Creates a todo list breaking down each feature into specific tasks based on the project architecture*\nAssistant: Let's start with user registration. This will involve creating database models, API endpoints, and frontend forms that integrate with your existing authentication system.\n\n<reasoning>\nThe assistant used the todo list because:\n1. The user provided multiple complex features to implement in a comma separated list\n2. The todo list helps organize these large features into manageable tasks\n3. This approach allows for tracking progress across the entire implementation\n</reasoning>\n</example>\n\n<example>\nUser: Can you help optimize my React application? It's rendering slowly and has performance issues.</user>\nAssistant: I'll help optimize your React application. First, let me examine your codebase to identify potential performance bottlenecks.\n*Reviews component structure, render patterns, state management, and data fetching*\nAssistant: After analyzing your codebase, I've identified several performance issues. Let me create a todo list to track our optimization efforts.\n*Creates todo list with items like: 1) Implement memoization for expensive calculations in ProductList, 2) Add virtualization for long lists in Dashboard, 3) Optimize image loading in Gallery component, 4) Fix state update loops in ShoppingCart, 5) Review bundle size and implement code splitting*\nLet's start by implementing memoization for the expensive calculations in your ProductList component.</assistant>\n\n<reasoning>\nThe assistant used the todo list because:\n1. First, the assistant examined the codebase to identify specific performance issues\n2. Based on this analysis, it identified multiple optimization opportunities\n3. Performance optimization is a non-trivial task requiring multiple steps\n4. The todo list helps methodically track improvements across different components\n5. This systematic approach ensures all performance bottlenecks are addressed\n</reasoning>\n</example>\n\n## Examples of When NOT to Use the Todo List\n\n<example>\nUser: How do I print 'Hello World' in Python?\nAssistant: In Python, you can print \"Hello World\" with this simple code:\n\npython\nprint(\"Hello World\")\n\nThis will output the text \"Hello World\" to the console when executed.</assistant>\n\n<reasoning>\nThe assistant did not use the todo list because this is a single, trivial task that can be completed in one step. There's no need to track multiple tasks or steps for such a straightforward request.\n</reasoning>\n</example>\n\n<example>\nUser: What does the git status command do?\nAssistant: The git status command shows the current state of your working directory and staging area. It displays which changes have been staged, which haven't, and which files aren't being tracked by Git. This is a fundamental command for understanding the current state of your repository before making commits.\n\n<reasoning>\nThe assistant did not use the todo list because this is an informational request with no actual coding task to complete. The user is simply asking for an explanation, not for the assistant to perform multiple steps or tasks.\n</reasoning>\n</example>\n\n<example>\nUser: Can you add a comment to the calculateTotal function to explain what it does?\nAssistant: Sure, let me add a comment to the calculateTotal function to explain what it does.\n* Uses the Edit tool to add a comment to the calculateTotal function *\n\n<reasoning>\nThe assistant did not use the todo list because this is a single, straightforward task confined to one location in the code. Adding a comment doesn't require tracking multiple steps or systematic organization.\n</reasoning>\n</example>\n\n<example>\nUser: Run npm install for me and tell me what happens.\nAssistant: I'll run the npm install command for you.\n\n*Executes: npm install*\n\nThe command completed successfully. Here's the output:\n[Output of npm install command]\n\nAll dependencies have been installed according to your package.json file.\n\n<reasoning>\nThe assistant did not use the todo list because this is a single command execution with immediate results. There are no multiple steps to track or organize, making the todo list unnecessary for this straightforward task.\n</reasoning>\n</example>\n\n## Task States and Management\n\n1. **Task States**: Use these states to track progress:\n   - pending: Task not yet started\n   - in_progress: Currently working on (limit to ONE task at a time)\n   - completed: Task finished successfully\n   - cancelled: Task no longer needed\n\n2. **Task Management**:\n   - Update task status in real-time as you work\n   - Mark tasks complete IMMEDIATELY after finishing (don't batch completions)\n   - Only have ONE task in_progress at any time\n   - Complete current tasks before starting new ones\n   - Cancel tasks that become irrelevant\n\n3. **Task Breakdown**:\n   - Create specific, actionable items\n   - Break complex tasks into smaller, manageable steps\n   - Use clear, descriptive task names\n\nWhen in doubt, use this tool. Being proactive with task management demonstrates attentiveness and ensures you complete all requirements successfully.\n\n",
        "parameters": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "todos": {
              "description": "The updated todo list",
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "content": {
                    "description": "Brief description of the task",
                    "type": "string"
                  },
                  "status": {
                    "description": "Current status of the task: pending, in_progress, completed, cancelled",
                    "type": "string"
                  },
                  "priority": {
                    "description": "Priority level of the task: high, medium, low",
                    "type": "string"
                  }
                },
                "required": [
                  "content",
                  "status",
                  "priority"
                ],
                "additionalProperties": false
              }
            }
          },
          "required": [
            "todos"
          ],
          "additionalProperties": false
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "skill",
        "description": "Load a specialized skill that provides domain-specific instructions and workflows.\n\nWhen you recognize that a task matches one of the available skills listed below, use this tool to load the full skill instructions.\n\nThe skill will inject detailed instructions, workflows, and access to bundled resources (scripts, references, templates) into the conversation context.\n\nTool output includes a `<skill_content name=\"...\">` block with the loaded content.\n\nThe following skills provide specialized sets of instructions for particular tasks\nInvoke this tool to load a skill when a task matches one of the available skills listed below:\n\n## Available Skills\n- **hzero-create-restful-api**: 当创建完整的RESTful API，包括Controller、DTO、AppService等完整实现时使用\n- **hzero-generate-app-service**: 生成符合HZERO规范的AppService接口和实现类时使用\n- **hzero-generate-basic-structure**: 当生成系统基础架构时使用\n- **hzero-generate-constant**: 当需要生成Constant常量类时使用\n- **hzero-generate-controller**: 当需要生成Controller时使用\n- **hzero-generate-dto**: 当需要生成DTO类时使用\n- **hzero-generate-entity**: 当生成Entity实体类时使用\n- **hzero-generate-mapper**: 当生成Mapper接口时使用\n- **hzero-generate-repository**: 当生成Repository接口时使用\n- **hzero-generate-repository-impl**: 当生成RepositoryImpl实现类时使用\n- **hzero-generate-service**: 当生成领域Service接口和ServiceImpl实现类时使用\n- **hzero-generate-unit-test**: 当进行单元测试时使用, When conducting unit testing.\n- **hzero-handle-exception**: 当需要处理异常(Exception)时使用\n- **hzero-integrate-captcha**: 当生成验证码(captcha)相关代码时使用\n- **hzero-integrate-code-rule**: 当生成编码规则(CodeRuleBuilder)时使用\n- **hzero-integrate-data-export**: 当实现数据导出(Excel导出)时使用\n- **hzero-integrate-data-import**: 当实现数据导入(Excel导入)时使用\n- **hzero-integrate-distributed-lock**: 当使用分布式锁(distributed lock)代码时使用\n- **hzero-integrate-encryption**: 当实现加密解密功能时使用\n- **hzero-integrate-event-bus**: 当需要实现事件驱动时使用\n- **hzero-integrate-file-operation**: 当你需要通过HZERO平台文件客户端完成文件上传、下载、更新、删除、附件管理等功能时调用，获取相关操作规范及指南\n- **hzero-integrate-lov-value**: 当需要使用值集（LOV）功能时使用\n- **hzero-integrate-message-send**: 当需要使用消息发送(邮件、短信、站内消息等多种消息发送)功能时使用\n- **hzero-integrate-multi-language**: 当需要实现多语言功能时使用\n- **hzero-integrate-redis**: 当使用Redis操作(缓存、分布式锁、消息队列)时使用\n- **hzero-integrate-scheduler**: 当需要使用定时任务时使用\n- **hzero-integrate-websocket**: 集成WebSocket功能，实现服务端和客户端的实时通信\n- **hzero-sdd-template**: 当你需要寻找、引用SDD某个阶段的文档模板路径时调用，包括功能设计文档模板、元数据设计文档模板、技术设计文档模板、任务拆分文档模板及资产数据文档模板等\n- **hzero-sdd-tools**: 当需要验证长度限制、命名规范、文件/目录存在性、数量限制验证、JSON结构是否完整时使用。\n- **multi-search-engine**: Multi search engine integration with 17 engines (8 CN + 9 Global). Supports advanced search operators, time filters, site search, privacy engines, and WolframAlpha knowledge queries. No API keys required.\n- **skill-creator**: Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy.\nLoad a specialized skill that provides domain-specific instructions and workflows.\n\nWhen you recognize that a task matches one of the available skills listed below, use this tool to load the full skill instructions.\n\nThe skill will inject detailed instructions, workflows, and access to bundled resources (scripts, references, templates) into the conversation context.\n\nTool output includes a `<skill_content name=\"...\">` block with the loaded content.\n\nThe following skills provide specialized sets of instructions for particular tasks\nInvoke this tool to load a skill when a task matches one of the available skills listed below:\n\n## Available Skills\n- **multi-search-engine**: Multi search engine integration with 17 engines (8 CN + 9 Global). Supports advanced search operators, time filters, site search, privacy engines, and WolframAlpha knowledge queries. No API keys required.\n- **skill-creator**: Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy.",
        "parameters": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "name": {
              "description": "The name of the skill from available_skills",
              "type": "string"
            }
          },
          "required": [
            "name"
          ],
          "additionalProperties": false
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "apply_patch",
        "description": "Use the `apply_patch` tool to edit files. Your patch language is a stripped‑down, file‑oriented diff format designed to be easy to parse and safe to apply. You can think of it as a high‑level envelope:\n\n*** Begin Patch\n[ one or more file sections ]\n*** End Patch\n\nWithin that envelope, you get a sequence of file operations.\nYou MUST include a header to specify the action you are taking.\nEach operation starts with one of three headers:\n\n*** Add File: <path> - create a new file. Every following line is a + line (the initial contents).\n*** Delete File: <path> - remove an existing file. Nothing follows.\n*** Update File: <path> - patch an existing file in place (optionally with a rename).\n\nExample patch:\n\n```\n*** Begin Patch\n*** Add File: hello.txt\n+Hello world\n*** Update File: src/app.py\n*** Move to: src/main.py\n@@ def greet():\n-print(\"Hi\")\n+print(\"Hello, world!\")\n*** Delete File: obsolete.txt\n*** End Patch\n```\n\nIt is important to remember:\n\n- You must include a header with your intended action (Add/Delete/Update)\n- You must prefix new lines with `+` even when creating a new file\n",
        "parameters": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "patchText": {
              "description": "The full patch text that describes all changes to be made",
              "type": "string"
            }
          },
          "required": [
            "patchText"
          ],
          "additionalProperties": false
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "load_agent_metadata",
        "description": "\n    按需加载子 Agent 元数据（Just-in-time）：在你**即将调用 task 启动某个子 Agent 之前**，请遵循以下规则：\n\n    ## 核心规则\n    1. **仅当需要时才加载**：如果目标子 Agent 的描述中包含 **[METADATA OMIT…]**，表示其输入格式 / 输出 / 示例等元数据信息被省略，此时你**必须且仅能**调用一次：load_agent_metadata(agentName=<子Agent名称>)\n    2. **严格时序：先决策，再加载**\n      * 必须在**已明确决定要调用哪个子 Agent**之后，才能加载该 Agent 的元数据\n      * **禁止**在未确定目标 Agent 前，提前加载任意元数据\n    3. **禁止预加载 / 批量加载**\n      * 不允许加载多个 Agent 的元数据用于“备用”\n      * 不允许并行或提前加载\n      * 每次只为**当前即将调用的唯一子 Agent**加载元数据\n    4. **按调用逐次加载**\n      * 若后续需要调用新的子 Agent，再在**当下时刻**加载其元数据\n      * 未使用的 Agent，**不得加载**\n    5. **无省略则不加载**：若子 Agent 描述中不存在**[METADATA OMIT…]**，则**禁止调用** load_agent_metadata\n\n    ## 执行流程（标准步骤）\n    1. 决定下一步要调用的子 Agent\n    2. 检查该 Agent 描述中是否包含 [METADATA OMIT…]\n      ├─ 是 → 调用 load_agent_metadata(agentName)\n      └─ 否 → 跳过\n    3. 基于完整信息组装参数\n    4. 调用 task(... subagent_type=该Agent)\n    5. 如需调用其他 Agent，重复以上流程\n\n    示例 1（需要加载）：\n    1. 决定调用【编码实现】\n    2. 描述中发现存在 [METADATA OMIT…]\n    3. 调用 load_agent_metadata(\"编码实现\")\n    4. 组装参数并调用 task(... subagent_type=\"编码实现\")\n    5. 后续决定调用【基准评估】，重复步骤 2-4\n\n    示例 2（无需加载）：\n    1. 决定调用【问答助手】\n    2. 描述中未发现 [METADATA OMIT…]\n    3. 直接组装参数并调用 task(... subagent_type=\"问答助手\")\n    ",
        "parameters": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "agentName": {
              "type": "string"
            }
          },
          "required": [
            "agentName"
          ],
          "additionalProperties": false
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "ast_grep_search",
        "description": "Search code patterns across filesystem using AST-aware matching. Supports 25 languages. Use meta-variables: $VAR (single node), $$$ (multiple nodes). IMPORTANT: Patterns must be complete AST nodes (valid code). For functions, include params and body: 'export async function $NAME($$$) { $$$ }' not 'export async function $NAME'. Examples: 'console.log($MSG)', 'def $FUNC($$$):', 'async function $NAME($$$)'",
        "parameters": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "pattern": {
              "type": "string"
            },
            "lang": {
              "type": "string",
              "enum": [
                "bash",
                "c",
                "cpp",
                "csharp",
                "css",
                "elixir",
                "go",
                "haskell",
                "html",
                "java",
                "javascript",
                "json",
                "kotlin",
                "lua",
                "nix",
                "php",
                "python",
                "ruby",
                "rust",
                "scala",
                "solidity",
                "swift",
                "typescript",
                "tsx",
                "yaml"
              ]
            },
            "paths": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "globs": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "context": {
              "type": "number"
            }
          },
          "required": [
            "pattern",
            "lang"
          ],
          "additionalProperties": false
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "ast_grep_replace",
        "description": "Replace code patterns across filesystem with AST-aware rewriting. Dry-run by default. Use meta-variables in rewrite to preserve matched content. Example: pattern='console.log($MSG)' rewrite='logger.info($MSG)'",
        "parameters": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "pattern": {
              "type": "string"
            },
            "rewrite": {
              "type": "string"
            },
            "lang": {
              "type": "string",
              "enum": [
                "bash",
                "c",
                "cpp",
                "csharp",
                "css",
                "elixir",
                "go",
                "haskell",
                "html",
                "java",
                "javascript",
                "json",
                "kotlin",
                "lua",
                "nix",
                "php",
                "python",
                "ruby",
                "rust",
                "scala",
                "solidity",
                "swift",
                "typescript",
                "tsx",
                "yaml"
              ]
            },
            "paths": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "globs": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "dryRun": {
              "type": "boolean"
            }
          },
          "required": [
            "pattern",
            "rewrite",
            "lang"
          ],
          "additionalProperties": false
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "docx_to_markdown",
        "description": "将 Microsoft Word（.docx）文档转换为标准 Markdown 文件。\n        该工具会读取指定路径的 .docx 文件，解析其结构化内容（包括标题、段落、列表、表格、图片等），并输出为 Markdown 格式文件到指定目录。\n        **使用约束**：\n        - 输入文件必须为合法的 .docx 文件，否则会报错\n        - 输出目录必须符合 fds 规范目录结构（见 mdDirPath 说明）\n        ",
        "parameters": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "docxFilePath": {
              "type": "string"
            },
            "mdDirPath": {
              "type": "string"
            }
          },
          "required": [
            "docxFilePath",
            "mdDirPath"
          ],
          "additionalProperties": false
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "session_list",
        "description": "List all OpenCode sessions with optional filtering.\n\nReturns a list of available session IDs with metadata including message count, date range, and agents used.\n\nExample output:\n| Session ID | Messages | First | Last | Agents |\n|------------|----------|-------|------|--------|\n| ses_abc123 | 45 | 2025-12-20 | 2025-12-24 | build, oracle |\n| ses_def456 | 12 | 2025-12-19 | 2025-12-19 | build |",
        "parameters": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "search": {
              "type": "string"
            },
            "roots": {
              "type": "boolean"
            },
            "limit": {
              "type": "number"
            },
            "from_date": {
              "type": "string"
            },
            "to_date": {
              "type": "string"
            },
            "project_path": {
              "type": "string"
            }
          },
          "additionalProperties": false
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "session_read",
        "description": "Read messages and history from an OpenCode session.\n\nReturns a formatted view of session messages with role, timestamp, and content. Optionally includes todos and transcript data.\n\nExample output:\nSession: ses_abc123\nMessages: 45\nDate Range: 2025-12-20 to 2025-12-24\n\n[Message 1] user (2025-12-20 10:30:00)\nHello, can you help me with...\n\n[Message 2] assistant (2025-12-20 10:30:15)\nOf course! Let me help you with...",
        "parameters": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "session_id": {
              "type": "string"
            },
            "include_todos": {
              "type": "boolean"
            },
            "include_transcript": {
              "type": "boolean"
            },
            "limit": {
              "type": "number"
            }
          },
          "required": [
            "session_id"
          ],
          "additionalProperties": false
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "session_search",
        "description": "Search for content within OpenCode session messages.\n\nPerforms full-text search across session messages and returns matching excerpts with context.\n\nExample output:\nFound 3 matches across 2 sessions:\n\n[ses_abc123] Message msg_001 (user)\n...implement the **session manager** tool...\n\n[ses_abc123] Message msg_005 (assistant)\n...I'll create a **session manager** with full search...\n\n[ses_def456] Message msg_012 (user)\n...use the **session manager** to find...",
        "parameters": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "query": {
              "type": "string"
            },
            "session_id": {
              "type": "string"
            },
            "session_limit_to_scan": {
              "type": "number"
            },
            "case_sensitive": {
              "type": "boolean"
            },
            "limit": {
              "type": "number"
            },
            "session_title_query": {
              "type": "string"
            },
            "from_date": {
              "type": "string"
            },
            "project_path": {
              "type": "string"
            }
          },
          "required": [
            "query"
          ],
          "additionalProperties": false
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "session_info",
        "description": "Get metadata and statistics about an OpenCode session.\n\nReturns detailed information about a session including message count, date range, agents used, and available data sources.\n\nExample output:\nSession ID: ses_abc123\nMessages: 45\nDate Range: 2025-12-20 10:30:00 to 2025-12-24 15:45:30\nDuration: 4 days, 5 hours\nAgents Used: build, oracle, librarian\nHas Todos: Yes (12 items, 8 completed)\nHas Transcript: Yes (234 entries)",
        "parameters": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "session_id": {
              "type": "string"
            }
          },
          "required": [
            "session_id"
          ],
          "additionalProperties": false
        }
      }
    }
  ],
  "tool_choice": "auto",
  "stream": true,
  "stream_options": {
    "include_usage": true
  },
  "max_completion_tokens": 32000
}
```

</details>

1. agent: 系统提示词的一部分
2. command: 用户输入的模板
3. skill: 模型自动识别调用

系统提示词: Agent 定义 + 模型信息 + 环境信息 + 技能信息 + 项目规则文件 + 全局规则文件

> Tips: 全局规则文件配置适用于自己的信息，如根据自己环境增加特定约束。如我本地电脑不能用 `python3`



```markdown
BASH 约束

- 所有命令示例、脚本调用、自动化流程中，一律使用 `python` 调用解释器。
- 禁止使用 `python3`（包括文档命令、CI 脚本、README 示例等），以保证跨环境一致性。
    

JSON 校验约束
- 校验 JSON 文件是否合法时，优先使用 Python 标准库工具：`python -m json.tool <file.json> > /dev/null`。
- 当需要批量校验目录下 JSON 文件时，优先使用循环逐个执行 `python -m json.tool`，避免在命令行内联复杂的 `python -c` 多行脚本。

Python 脚本示例约束

- 尽量生成单行脚本，如 `python -B -c "import json;json.load(open('sdd-workspace/mds/features/prm/configs.json','r',encoding='utf-8'));print('ok')"`
- 生成的脚本避免返回注释
- 生成的脚本尽量不包含特殊字符, 解析不了 如 ```


其它

- 禁止使用 rg 命令
- `mkdir -p` 语法不可用。
```

## SKILL / sub agent 自动调度

* SKILL: 系统提示词 + skill 工具
* sub agent: task 工具

# 插件


> 插件允许你通过挂钩各种事件和自定义行为来扩展 OpenCode。你可以创建插件来添加新功能、集成外部服务，或修改 OpenCode 的默认行为。
> https://learnopencode.com/5-advanced/12b-plugins-advanced.html


| 插件                               | 备注                                                   |
| -------------------------------- | ---------------------------------------------------- |
| on-my-opencode                   | 后台代理、预构建的 LSP/AST/MCP 工具、精选代理                        |
| opencode-dynamic-context-pruning | 通过修剪过时的工具输出来优化 Token 使用                              |
| superpowers                      | - AI 偷懒 - 反借口工程<br/>- 心理学提供合规率<br/>- 双阶段审查<br/>- 子Agent |

自定义插件

```typescript
import type { Hooks, PluginInput } from "@opencode-ai/plugin"

export default async function plugin(_input: PluginInput): Promise<Hooks> {

  return {
    "shell.env"(_in, out) {
      out.env.PYTHONUTF8 = "1"
      out.env.PYTHONIOENCODING = "utf-8"
    },
  }
}
```

## 使用技巧

1. 新开会话使用
2. 会话导出/分享
3. 开启推理
4. 审查

### 扩展 agent 和 skill


## 文档
* 官方文档: https://opencode.ai/docs/zh-cn/
* 学习文档: https://learnopencode.com/1-start/
