# 匿名遥测 <Badge type="tip" text="v2.1.2+" />

Erupt 会在启动后上报一份**匿名的实例画像**，用来回答「该继续支持哪个 JDK / 数据库 / Spring Boot 版本」「哪些模块值得投入」这类问题——用真实数字，而不是靠猜。

本页把收集的内容、关闭方式和自建方案完整列出。**如果你不想上报，[跳到关闭方式](#关闭方式)。**

:::tip 一句话
默认开启，只上报非标识性的运行环境信息，**不包含**主机名、应用名、JDBC 连接串、IP、任何业务数据或用户数据。上报失败静默忽略，永远不阻塞你的应用。
:::

## 收集了什么

上报体由 `xyz.erupt.upms.telemetry.TelemetryPayload` 定义，全部字段如下，**没有第 16 个字段**：

| 字段 | 示例值 | 为什么收集 |
| --- | --- | --- |
| `schema` | `2` | 上报体版本号，字段增删时递增 |
| `eventType` | `boot` / `heartbeat` | 区分启动上报与心跳上报 |
| `instanceId` | 随机 UUID | **仅用于去重**，见下文「实例标识」 |
| `eruptVersion` | `2.1.2` | 版本分布，决定旧版本还要维护多久 |
| `modules` | `["erupt-jpa","erupt-ai"]` | 已装模块列表，决定哪些模块值得投入 |
| `eruptCount` | `37` | 注册的 `@Erupt` 类数量，区分真实部署与教程 demo |
| `javaVersion` | `17.0.11` | 决定 JDK 基线何时可以抬高 |
| `javaVendor` | `Eclipse Adoptium` | 同上 |
| `os` | `Linux` | 操作系统分布 |
| `osDistro` | `kylin` / `uos` / `openeuler` | Linux 发行版 id，`os.name` 永远是 `Linux`，不取它就看不到国产 OS 占比 |
| `arch` | `aarch64` | ARM 部署占比 |
| `containerized` | `true` | 是否跑在容器里，决定官方 Docker 镜像的投入 |
| `dbType` | `MySQL` | 指导跨数据库 SQL 兼容性的优先级 |
| `dbVersion` | `8.0` | **仅 major.minor**，粗到足够匿名，细到够用 |
| `springBootVersion` | `3.5.16` | 决定 Spring Boot 2.x 还要支持多久 |
| `locale` | `zh-CN` | 决定哪些语言的 i18n 值得投入 |
| `timezone` | `Asia/Shanghai` | 粗粒度地域分布，比留存 IP 干净 |

### 明确不收集

- ❌ 主机名、应用名、`spring.application.name`
- ❌ JDBC 连接串、数据库名、表名、字段名
- ❌ IP 地址（请求侧不记录）
- ❌ 用户账号、菜单名、任何业务数据
- ❌ 你的 `@Erupt` 类名（只上报**数量**）
- ❌ 环境变量、配置文件内容

`TelemetryPayload` 的类注释把这条写成了硬约束：

> Every field here must be non-identifying: no hostname, no application name, no JDBC url, no user data.

字段的取值逻辑全部在 `xyz.erupt.upms.telemetry.EruptTelemetry` 这一个类里（约 330 行），欢迎直接读源码核对。

## 上报时机

| 事件 | 时机 |
| --- | --- |
| `boot` | `ApplicationReadyEvent` 之后**延迟 15 秒**，避开启动期的网络与连接池 |
| `heartbeat` | 之后每 **24 小时**一次 |

技术细节：

- 跑在名为 `erupt-telemetry` 的**守护线程**上，永远不会拖住 JVM 退出；
- 连接与读取超时均为 **3 秒**；
- 任何异常（离线、内网、防火墙）**静默忽略**，不打错误日志、不重试；
- 一个 JVM 只上报一次 `boot`，Spring 上下文重复刷新不会重复计数。

## 实例标识

`instanceId` 是一个随机 UUID，持久化在 `.erupt/telemetry.id`。它的唯一作用是**去重**——否则每次重启都会被当成一个新用户，统计毫无意义。

它不与任何身份关联。如果这个文件写不进去（只读文件系统等），**Erupt 直接放弃上报**，而不是每次重启生成一个新身份去污染统计。

删除该文件即等同于换一个新身份。

## 关闭方式

三种任选其一，任意一种生效即完全不上报。

### 1. 配置文件

```yaml
erupt:
  telemetry:
    enabled: false
```

### 2. 环境变量

```bash
export ERUPT_TELEMETRY_DISABLED=1   # 或 true
```

适合不方便改 yaml 的容器 / K8S 场景。

### 3. CI 环境自动跳过

只要检测到 `CI` 环境变量非空，**自动跳过**，无需任何配置——构建流水线里的一次性实例会严重污染统计。

## 首次运行的提示

第一次创建 `.erupt/telemetry.id` 时（也只有这一次），启动日志会打印一行：

```
Erupt collects anonymous usage statistics (see README); disable with erupt.telemetry.enabled=false or ERUPT_TELEMETRY_DISABLED=1
```

之后每次重启都不再打印，避免刷屏。

## 自建 collector

如果你所在的组织有多个 Erupt 实例，想自己掌握内部的版本与模块分布，可以把 endpoint 指向自建服务：

```yaml
erupt:
  telemetry:
    endpoint: https://telemetry.your-company.internal/v1/ping
```

约定很简单：

- 请求：`POST`，`Content-Type: application/json`，请求体就是上表的 JSON；
- 请求头 `User-Agent: erupt/{版本号}`；
- 响应：返回 `200` 即可，响应体可为空。

### 可选：向运维回传一条提示

当 endpoint 返回 `200` 且响应体是如下结构时，Erupt 会把 `message` 打进日志——可用于推送版本升级或安全公告：

```json
{"level": "warn", "message": "2.1.0 存在一个已知问题，建议升级到 2.1.2"}
```

- `level` 为 `warn` 时以 `log.warn` 输出，其余情况 `log.info`；
- 响应体**最多读取 4KB**，`message` **截断到 300 字符**；
- 控制字符会被剥离——响应属于远程输入，不允许它伪造日志行。

## 配置项速查

```yaml
erupt:
  telemetry:
    # 是否上报匿名使用统计，默认 true
    enabled: true
    # 上报地址，默认 https://telemetry.erupt.xyz/v1/ping
    endpoint: https://telemetry.erupt.xyz/v1/ping
```

## 常见问题

**Q：erupt-cloud-node 会上报吗？**

不会。遥测代码放在 `erupt-upms` 而不是 `erupt-core`，正是因为 `erupt-cloud-node` 只依赖 `erupt-core`——这个模块边界就是节点不上报的保证。

**Q：内网 / 离线部署会不会报错或变慢？**

不会。3 秒超时、守护线程、静默失败，最坏情况是每 24 小时有一个后台线程等 3 秒然后放弃。

**Q：我关掉了，会影响功能吗？**

不会。遥测不参与任何功能逻辑，也不做任何形式的授权校验。

## 相关

- [参数配置](/zh/guide/configuration)
- [治理与许可承诺](/zh/guide/governance)
