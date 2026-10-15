---
title: 自定义 MCP
description: 在 OpenCode 中接入自定义 MCP 服务
sidebar_position: 6
---

# 自定义 MCP

## MCP 协议
见  MCP 协议

## spring_idea_plugin
### 配置 MCP

![Pasted image 20260512142449](imgs/Pasted%20image%2020260512142449.png)

IDEA 按项目级别开启，默认关闭

opencode 增加配置
```json
{
  "$schema" : "https://opencode.ai/config.json",
  "mcp" : {
    "sprong_idea" : {
      "type" : "remote",
      "url" : "http://127.0.0.1:19999/mcp"
    }
  }
}
```


### OpenCode MCP 初始化流程
> url: http://127.0.0.1:19999/mcp
> method: post

 1. initialize

- OpenCode 发起初始化请求，发起初始化请求
```json
{
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-25",
    "capabilities": {},
    "clientInfo": {
      "name": "opencode",
      "version": "1.14.41"
    }
  },
  "jsonrpc": "2.0",
  "id": 0
}
```
- 响应
```json
{
    "jsonrpc": "2.0",
    "id": 0,
    "result": {
        "protocolVersion": "2024-11-05",
        "serverInfo": {
            "name": "sprong_idea",
            "version": "1.1-MCP"
        },
        "capabilities": {
            "tools": {
                "listChanged": false
            },
            "prompts": {}
        }
    }
}
```

2.  notifications/initialized
```json
{
  "method": "notifications/initialized",
  "jsonrpc": "2.0"
}
```

不要求响应

3. 获取可用工具列表

```json
{
  "method": "tools/list",
  "jsonrpc": "2.0",
  "id": 1
}
```

响应:

```json
{
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
        "tools": [
            {
                "name": "get_file_problems",
                "description": "Returns visible IDE problems for a file",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "filePath": {
                            "type": "string",
                            "description": "Absolute file path in the current project"
                        },
                        "errorsOnly": {
                            "type": "boolean",
                            "description": "When true, only return error-level problems"
                        }
                    },
                    "required": [
                        "filePath"
                    ],
                    "additionalProperties": false
                }
            },
            {
                "name": "build",
                "description": "Runs an IDE-native project build for the current project",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "scope": {
                            "type": "string",
                            "description": "Build scope. Only 'project' is currently supported.",
                            "enum": [
                                "project"
                            ]
                        }
                    },
                    "additionalProperties": false
                }
            }
        ]
    }
}
```

4. 获取 prompt 列表

```json
{
  "method": "prompts/list",
  "jsonrpc": "2.0",
  "id": 2
}
```


5. OpenCode 效果
function 中会新增两个 tool

![Pasted image 20260512143353](imgs/Pasted%20image%2020260512143353.png)

6. 特殊说明
mcp 工具调用响应格式:
```json
{
    "jsonrpc": "2.0",
    "id": 5,
    "result": {
        "content": [
            {
                "type": "text",
                "text": "{\"project\":{\"name\":\"boperf-demo\",\"basePath\":\"F:/Desktop/飞码Code/hr/boperf-demo\"},\"problems\":[{\"message\":\"Cannot resolve symbol 'JSONUtils'\",\"kind\":\"ERROR\",\"file\":\"F:\\\\Desktop\\\\飞码Code\\\\hr\\\\boperf-demo\\\\src\\\\main\\\\java\\\\com\\\\hand\\\\boperf\\\\Application.java\",\"line\":18,\"column\":13},{\"message\":\"Cannot resolve symbol 'Application1'\",\"kind\":\"ERROR\",\"file\":\"F:\\\\Desktop\\\\飞码Code\\\\hr\\\\boperf-demo\\\\src\\\\main\\\\java\\\\com\\\\hand\\\\boperf\\\\Application.java\",\"line\":19,\"column\":35},{\"message\":\"String can be replaced with text block\",\"kind\":\"INFORMATION\",\"file\":\"F:\\\\Desktop\\\\飞码Code\\\\hr\\\\boperf-demo\\\\src\\\\main\\\\java\\\\com\\\\hand\\\\boperf\\\\Application.java\",\"line\":22,\"column\":26}]}"
            }
        ],
        "isError": false,
        "structuredContent": {
            "project": {
                "name": "boperf-demo",
                "basePath": "F:/Desktop/飞码Code/hr/boperf-demo"
            },
            "problems": [
                {
                    "message": "Cannot resolve symbol 'JSONUtils'",
                    "kind": "ERROR",
                    "file": "F:\\Desktop\\飞码Code\\hr\\boperf-demo\\src\\main\\java\\com\\hand\\boperf\\Application.java",
                    "line": 18,
                    "column": 13
                },
                {
                    "message": "Cannot resolve symbol 'Application1'",
                    "kind": "ERROR",
                    "file": "F:\\Desktop\\飞码Code\\hr\\boperf-demo\\src\\main\\java\\com\\hand\\boperf\\Application.java",
                    "line": 19,
                    "column": 35
                },
                {
                    "message": "String can be replaced with text block",
                    "kind": "INFORMATION",
                    "file": "F:\\Desktop\\飞码Code\\hr\\boperf-demo\\src\\main\\java\\com\\hand\\boperf\\Application.java",
                    "line": 22,
                    "column": 26
                }
            ]
        }
    }
}
```
- content: 必填，OpenCode 取 result.content[*].text （prompt.ts）
- structuredContent: 可选, 结构化数据，OpenCode 不会处理

