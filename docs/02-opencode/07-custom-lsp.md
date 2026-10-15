---
title: 自定义 LSP 支持
description: 为 OpenCode 配置自定义语言服务器
sidebar_position: 7
---

# 自定义 LSP 支持

# 前言

OpenCode 本身内置了多种 LSP 工具

|LSP 服务器|扩展名|要求|
|---|---|---|
|astro|.astro|为 Astro 项目自动安装|
|bash|.sh, .bash, .zsh, .ksh|自动安装 bash-language-server|
|clangd|.c, .cpp, .cc, .cxx, .c++, .h, .hpp, .hh, .hxx, .h++|为 C/C++ 项目自动安装|
|csharp|.cs|需要已安装 `.NET SDK`|
|clojure-lsp|.clj, .cljs, .cljc, .edn|需要 `clojure-lsp` 命令可用|
|dart|.dart|需要 `dart` 命令可用|
|deno|.ts, .tsx, .js, .jsx, .mjs|需要 `deno` 命令可用（自动检测 deno.json/deno.jsonc）|
|elixir-ls|.ex, .exs|需要 `elixir` 命令可用|
|eslint|.ts, .tsx, .js, .jsx, .mjs, .cjs, .mts, .cts, .vue|项目中需要 `eslint` 依赖|
|fsharp|.fs, .fsi, .fsx, .fsscript|需要已安装 `.NET SDK`|
|gleam|.gleam|需要 `gleam` 命令可用|
|gopls|.go|需要 `go` 命令可用|
|hls|.hs, .lhs|需要 `haskell-language-server-wrapper` 命令可用|
|jdtls|.java|需要已安装 `Java SDK (version 21+)`|
|julials|.jl|需要安装 `julia` and `LanguageServer.jl`|
|kotlin-ls|.kt, .kts|为 Kotlin 项目自动安装|
|lua-ls|.lua|为 Lua 项目自动安装|
|nixd|.nix|需要 `nixd` 命令可用|
|ocaml-lsp|.ml, .mli|需要 `ocamllsp` 命令可用|
|oxlint|.ts, .tsx, .js, .jsx, .mjs, .cjs, .mts, .cts, .vue, .astro, .svelte|项目中需要 `oxlint` 依赖|
|php intelephense|.php|为 PHP 项目自动安装|
|prisma|.prisma|需要 `prisma` 命令可用|
|pyright|.py, .pyi|需要已安装 `pyright` 依赖|
|ruby-lsp (rubocop)|.rb, .rake, .gemspec, .ru|需要 `ruby` 和 `gem` 命令可用|
|rust|.rs|需要 `rust-analyzer` 命令可用|
|sourcekit-lsp|.swift, .objc, .objcpp|需要已安装 `swift`（macOS 上为 `xcode`）|
|svelte|.svelte|为 Svelte 项目自动安装|
|terraform|.tf, .tfvars|从 GitHub releases 自动安装|
|tinymist|.typ, .typc|从 GitHub releases 自动安装|
|typescript|.ts, .tsx, .js, .jsx, .mjs, .cjs, .mts, .cts|项目中需要 `typescript` 依赖|
|vue|.vue|为 Vue 项目自动安装|
|yaml-ls|.yaml, .yml|自动安装 Red Hat yaml-language-server|
|zls|.zig, .zon|需要 `zig` 命令可用|
但是对于 java 语言，默认要求 JDK 21，本文主要介绍如何在 jdk 17 中也能集成


# 安装步骤

1. 下载 jdt-language-server: https://download.eclipse.org/jdtls/milestones/1.40.0/jdt-language-server-1.40.0-202409261450.tar.gz (注意版本不要高于1.40, 否则不支持 jdk17)
2. 解压(D:\software\jdtl)
```bash
$ ls
_/                 config_mac/           config_ss_mac/      configuration/
bin/               config_mac_arm/       config_ss_mac_arm/  features/
config_linux/      config_ss_linux/      config_ss_win/      
config_linux_arm/  config_ss_linux_arm/  config_win/         plugins/
```
3. opencode 增加配置 
```json
{
  "$schema": "https://opencode.ai/config.json",
  "disabled_providers": [],
  "lsp": {
    "jdtls": {
      "disabled": true
    },
    "custom-lsp": {
      "command": ["python", "D:\\software\\jdtl\\bin\\jdtls", "--jvm-arg=-Dlog.level=ALL  "],
      "extensions": [".java"],
      "env": {
        "JAVA_HOME": "D:\\Program Files\\Java\\jdk-17.0.13"
      },
      "initialization": {
        "settings": {
          "java": {
            "configuration": {
              "runtimes": [
                {
                  "name": "JavaSE-17",
                  "path": "D:\\Program Files\\Java\\jdk-17.0.13",
                  "default": true
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

4. 查看是否生效
* 检查 opencode 启动日志 （`opencode --print-logs --log-level DEBUG debug lsp diagnostics `） 
```
INFO  2026-04-23T08:54:17 +38ms service=lsp.client serverID=custom-lsp initialized
INFO  2026-04-23T08:54:17 +1ms service=bus type=lsp.updated publishing
```
* 当 opencode 修改代码时查看状态
![Pasted image 20260423174411](imgs/Pasted%20image%2020260423174411.png)
* 查看 opencode jdtl 日志 ($TEMP/jdtls-xxx文件夹)
```log
!ENTRY org.eclipse.jdt.ls.core 1 0 2026-04-23 17:13:08.301
!MESSAGE begin problem for /BusinessApplication.java
```
