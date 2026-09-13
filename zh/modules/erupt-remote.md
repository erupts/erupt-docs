# Erupt Remote 远程访问

erupt-remote 把远程主机桥接到浏览器：VNC 桌面用 noVNC 渲染，SSH 终端用 xterm.js 渲染，二者共用一条 WebSocket 通道，无需在客户端安装任何工具。

> 最低版本要求：**2.2.0**

:::warning 安全提示
远程访问等同于把主机控制权交到浏览器里。**仅应授权给受信任的管理员**，生产环境务必启用 HTTPS/WSS。
:::

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-remote</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

引入后自动装配生效，菜单中出现 **远程主机**（`RemoteHost`）表格入口。

## 使用流程

1. 在 **远程主机** 表格中新建一条记录，填写主机地址、端口与协议。
2. 点击行按钮 **连接**，在应用内路由 `/remote/{id}` 打开桌面或终端页面。
3. 服务端把二进制 WebSocket（`/erupt-remote`）桥接到目标主机端口。

**VNC 远程桌面（Windows）**

![VNC 远程桌面 - Windows](/erupt-remote/vnc-windows.png)

**VNC 远程桌面（macOS）**

![VNC 远程桌面 - macOS](/erupt-remote/vnc-macos.png)

**SSH 终端**

![SSH 终端](/erupt-remote/ssh-terminal.png)

## 操作工具栏

桌面与终端页面顶部提供一致的操作栏，会话状态（连接中 / 已连接 / 已断开）以左上角圆点标识。

**VNC 桌面**

| 按钮 | 说明 |
| --- | --- |
| Keys | 发送本地无法直接传递的组合键：`Ctrl + Alt + Del`、`Alt + Tab`、`Tab`、`Esc`、`Print Screen` |
| Paste | 把本地剪贴板内容发送到远程桌面 |
| Shot | 截取当前画面并下载 |
| Quality | 画质与带宽档位：Low bandwidth（低带宽）、Balanced（均衡）、Best quality（最佳画质） |
| Power | 远程电源操作：Reboot（重启）、Reset（强制重启）、Shut down（关机） |
| View only | 只读模式，仅观看不发送任何输入 |
| Fit | 画面缩放适应窗口 |
| Fullscreen | 全屏 |
| Disconnect | 断开会话；断开后按钮变为 Reconnect |

**SSH 终端**

| 按钮 | 说明 |
| --- | --- |
| Ctrl+C | 向远程进程发送中断信号 |
| Paste | 粘贴本地剪贴板内容 |
| Clear | 清屏 |
| Fullscreen | 全屏 |
| Disconnect | 断开会话；断开后按钮变为 Reconnect |

## 主机配置项

| 配置项 | 说明 |
| --- | --- |
| 主机名称 | 列表展示名 |
| 协议 | `VNC`（桌面）或 `SSH`（终端） |
| 主机 | erupt 服务端可达的 IP 或域名 |
| 端口 | VNC 默认 5900，SSH 默认 22 |
| 用户名 | SSH 登录用户，选择 SSH 时显示 |
| 密码 | VNC：服务端密码（取前 8 位）；SSH：登录密码，或私钥的 passphrase |
| 私钥 | SSH 公钥认证用的 PEM 私钥，优先级高于密码 |
| 是否启用 | 关闭后不可连接 |

凭据以 **AES-GCM 加密**存储，密钥由 `erupt.remote.secret-key` 指定，未配置时自动生成一次并写入 `.erupt/remote.key`。

## 安全模型

| 环节 | 做法 |
| --- | --- |
| 目标地址 | 由服务端按记录 id 查出，浏览器无法自行指定连接目标 |
| 鉴权 | erupt-upms token + `RemoteHost` 菜单权限（票据接口与 WebSocket 各校验一次）+ 一次性票据 |
| VNC 密码 | 已存密码时由服务端代答 RFB 认证，凭据不下发到浏览器；未存密码（或服务器只支持其他安全类型，如 macOS ARD 认证）时透传握手，由 noVNC 提示用户输入 |
| SSH 主机密钥 | 首次连接信任（TOFU），记录在 `.erupt/remote_known_hosts`，密钥变更直接拒绝连接 |
| 会话 | 全局并发上限 + 空闲回收 |

## 参数配置

```yaml
erupt:
  remote:
    # 凭据加密密钥，建议用环境变量注入；多节点部署必须共用同一个值
    secret-key: ${ERUPT_REMOTE_SECRET_KEY}
    # 全局并发会话上限
    max-sessions: 20
    # 无浏览器输入超过该时长的会话将被关闭（分钟）
    idle-timeout-minutes: 30
    # 连接远程主机的 TCP 超时（秒）
    connect-timeout-seconds: 5
```

## Nginx 反向代理

与 erupt-terminal 同理，需要为 `/erupt-remote` 转发 WebSocket 升级请求：

```nginx
location /erupt-remote {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;
}
```

## 目标主机准备

erupt-remote 是 VNC **客户端**，目标主机上必须先运行一个 VNC 服务端（SSH 则用系统自带的 sshd，无需额外安装）。支持任意 RFB 3.3 / 3.7 / 3.8 服务端。

### Windows：需手动安装 VNC 服务端

Windows **不自带 VNC 服务端**——系统自带的「远程桌面」走的是 RDP 协议，与 VNC 不通用，因此必须另行安装：

| 软件 | 下载地址 | 说明 |
| --- | --- | --- |
| TightVNC | [tightvnc.com/download.php](https://www.tightvnc.com/download.php) | 免费、体积小，安装包自带服务端，推荐首选 |
| UltraVNC | [uvnc.com/downloads/ultravnc.html](https://uvnc.com/downloads/ultravnc.html) | 免费，功能更多（文件传输、多显示器） |
| TigerVNC | [github.com/TigerVNC/tigervnc/releases](https://github.com/TigerVNC/tigervnc/releases) | 开源，跨平台 |
| RealVNC Server | [realvnc.com/download/vnc](https://www.realvnc.com/en/connect/download/vnc/) | 商业软件，个人使用有免费额度 |

以 TightVNC 为例：

1. 下载对应位数的 MSI 安装包（64 位系统选 `tightvnc-x.x.x-gpl-setup-64bit.msi`）。
2. 安装时选择 **Typical**，确保勾选 **TightVNC Server** 组件。
3. 安装过程中会要求设置密码，在 **Password for Remote Access** 处填写，这就是 erupt 主机记录里要填的「密码」。
4. 安装完成后服务以 Windows 服务方式常驻，默认监听 **5900** 端口；托盘图标右键 → **Configuration** 可再次修改密码与端口。
5. 在 Windows Defender 防火墙中放行 5900 端口的入站连接（安装程序通常会提示自动添加规则）。

:::tip VNC 密码只有前 8 位有效
这是 RFB 协议本身的限制，与 erupt 无关。设置密码时请控制在 8 位以内，避免「密码填长了却连不上」的困惑。
:::

### macOS：开启系统自带的屏幕共享

macOS 内置 VNC 服务端，只需开启并允许密码访问：

1. 打开 **系统设置 → 通用 → 共享**（旧版本为 系统偏好设置 → 共享）。
2. 打开 **屏幕共享（Screen Sharing）** 开关。
3. 点击其右侧的 **ⓘ** 按钮 → **电脑设置（Computer Settings…）**。
4. 勾选 **「VNC 显示程序可以使用密码控制屏幕」（VNC viewers may control screen with password）**，并设置密码（同样只有前 8 位有效）。
5. 确认 **允许访问** 的用户范围包含你要使用的账户。

开启后主机记录填 macOS 的 IP、端口 `5900`、密码填上一步设置的 VNC 密码即可。

:::info 不设置 VNC 密码时
不勾选第 4 步时，macOS 只提供 Apple Remote Desktop 认证方式。此时服务端无法代答，erupt 会**透传握手**，由浏览器端的 noVNC 弹窗提示输入 macOS 的用户名与密码——连接同样可用，只是凭据不再由服务端保管。
:::

### Linux：安装 x11vnc 或 TigerVNC

- **共享已有物理桌面**：`x11vnc`，如 `sudo apt install x11vnc`，再执行 `x11vnc -display :0 -rfbauth ~/.vnc/passwd -forever`（`x11vnc -storepasswd` 生成密码文件）。
- **开独立虚拟桌面**：`tigervnc-standalone-server`，`vncpasswd` 设置密码后执行 `vncserver :1`，此时端口为 `5901`（端口 = 5900 + 显示号）。

纯命令行运维场景直接用 **SSH** 协议即可，无需安装任何 VNC 服务端。

:::tip 与 erupt-terminal 的区别
[erupt-terminal](/zh/modules/erupt-terminal) 打开的是 **erupt 服务自身所在主机**的 Shell；erupt-remote 连接的是**受管的其他主机**，按条目维护、按菜单授权，且支持图形桌面。逐项对比见 [erupt-terminal → 与 erupt-remote 的区别](/zh/modules/erupt-terminal#与-erupt-remote-的区别)。
:::
