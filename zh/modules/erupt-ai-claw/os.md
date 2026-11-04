# 🦞 执行 Shell 与文件操作

<img src="/ai-claw/os-1.png" width="803">

<img src="/ai-claw/os-2.png" width="739">

<img src="/ai-claw/os-3.png" width="632">


## Shell 执行防护

`execShell` 默认关闭，需通过 `erupt.ai.claw.enable-exec-shell: true` 显式开启，且建议仅授权管理员角色。开启后仍有多层防护按顺序生效：

1. **硬性禁令**：`rm -rf /`、fork 炸弹、`mkfs`、关机重启、写裸设备等灾难性命令一律拦截，不可配置放开；
2. **目录沙箱**：命令默认锚定在当前用户的沙箱目录 `~/.erupt/{account}` 内运行，其他目录须通过 `erupt.ai.claw.shell-allowed-paths` 显式加白；
3. **敏感环境变量剥离**：名称含 KEY / TOKEN / SECRET / PASSWORD 等的环境变量不会传给子进程；
4. **输出截断**：单条命令输出上限 64KB，超时上限 600 秒（默认 30 秒）。

文件读写工具（`readFile` / `writeFile` 等）同样限定在沙箱目录内，完整清单见 [@Tools 说明表](/zh/modules/erupt-ai-claw/tools)。
