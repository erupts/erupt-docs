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

连接成功后，终端会展示当前主机名、操作系统、Java 版本等信息横幅，随后进入可交互的 Shell：

```
───────────────────────────────────────
  Erupt Terminal  v1.14.3
  Host : my-server
  OS   : Linux 5.15.0  amd64
  Java : 17.0.9
───────────────────────────────────────
[root@my-server ~]$
```

## 权限配置

模块使用 erupt-upms 进行权限管控，访问时需同时满足：

1. **有效 Token** — 请求携带当前登录用户的 erupt-token
2. **菜单权限** — 用户角色已绑定 `terminal` 菜单

在角色管理中将 `Terminal` 菜单授权给对应角色即可控制访问范围。
