# Erupt Terminal 服务终端

erupt-terminal 通过 WebSocket + PTY 技术，将服务器 Shell 直接桥接到浏览器，无需 SSH 客户端即可在后台管理界面中操作服务器终端。

:::warning 安全提示
Terminal 模块可执行任意 Shell 命令，权限等同于运行 Java 进程的系统用户。**仅应授权给受信任的管理员**，生产环境务必启用 HTTPS/WSS 加密。
:::

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-terminal</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

> 最低版本要求：**1.14.3**

引入后无需任何配置，模块通过 Spring Boot 自动装配生效，后台菜单中自动出现 **Terminal** 入口（图标 `fa fa-terminal`）。

## 功能特性

| 特性 | 说明 |
| --- | --- |
| 浏览器终端 | 基于 xterm.js，支持全色彩渲染、光标样式、滚动历史 |
| 多标签页 | 可同时开启多个独立终端会话（Alt+T 新建） |
| 终端尺寸自适应 | 窗口 resize 时自动同步 PTY 行列数 |
| 跨平台 | Unix/Linux 使用 `$SHELL` 或 `/bin/bash`，Windows 使用 `cmd.exe` |
| 空闲超时 | 30 分钟无操作自动断开，释放服务器资源 |
| 权限校验 | 集成 erupt-upms，通过 Token + 菜单权限双重验证 |
| 自动重连 | 网络中断后自动重试，最多 8 次，指数退避 |

## 效果预览

连接成功后，终端会展示当前主机名、操作系统、Java 版本等信息横幅，随后进入可交互的 Shell。左侧 TABS 面板管理多个并行会话：

![Erupt Terminal](/erupt-terminal/terminal.png)

```
───────────────────────────────────────
  Erupt Terminal  v1.14.3
  Host : my-server
  OS   : Linux 5.15.0  amd64
  Java : 17.0.9
───────────────────────────────────────
[root@my-server ~]$
```

## 与 erupt-remote 的区别

两个模块都把终端搬进了浏览器，但**连的不是同一台机器**：

| | [erupt-terminal](/zh/modules/erupt-terminal) | [erupt-remote](/zh/modules/erupt-remote) |
| --- | --- | --- |
| 连接目标 | **erupt 服务自身所在的主机**，固定，不可选择 | **受管的其他主机**，在「远程主机」表格中按条目维护 |
| 连接方式 | 本机 PTY（伪终端），直接 fork 一个 Shell 进程 | 网络协议：SSH（`jsch`）或 VNC（RFB） |
| 能力 | Shell 终端 | Shell 终端 + **图形桌面** |
| 身份 | 运行 Java 进程的系统用户，**无需填账号密码** | 每台主机各自的账号 / 密码 / 私钥，AES-GCM 加密存储 |
| 会话管理 | 多标签页，30 分钟空闲断开 | 一次性票据 + 全局并发上限 + 空闲回收 |
| 权限 | `terminal` 菜单权限 | `RemoteHost` 菜单权限（票据接口与 WebSocket 各校验一次） |
| WebSocket 路径 | `/erupt-terminal` | `/erupt-remote` |
| 目标主机准备 | 无需任何准备 | SSH 用系统自带 sshd；VNC 需目标主机运行 VNC 服务端 |

一句话选型：**运维 erupt 自己所在的那台机器**用 erupt-terminal；**管理一批服务器、或者需要图形桌面**用 erupt-remote。两者互不依赖，可同时引入。

## 权限配置

模块使用 erupt-upms 进行权限管控，访问时需同时满足：

1. **有效 Token** — 请求携带当前登录用户的 erupt-token
2. **菜单权限** — 用户角色已绑定 `terminal` 菜单

在角色管理中将 `Terminal` 菜单授权给对应角色即可控制访问范围。
