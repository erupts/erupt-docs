# Erupt Monitor 服务监控

erupt-monitor 提供服务器与应用的实时监控能力，包括 CPU、内存、磁盘、JVM 状态与 GC 诊断、HikariCP 连接池、HTTP 请求统计、Redis 缓存与在线用户管理。

> **2.0.0 完全重写**：新增诊断监控体系，覆盖 JVM GC、API 连接池实时状态与 HTTP 请求统计。如从旧版升级，需手动删除 `.erupt` 目录和旧"系统监控"菜单后重启，详见[升级指南](/zh/guide/upgrade#第二步-手动删除受影响的旧菜单)。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-monitor</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

导入成功后重启即可看到**系统监控**相关菜单。

## 功能说明

### 服务监控

CPU、内存、JVM 三张环形卡片给出当前水位（核数、主频、系统/用户占比、总量/已用/剩余），下方 **Usage Trend** 按秒绘制 CPU 与内存走势，**IO Rate** 实时展示网络与磁盘读写速率。右上角可开关自动刷新、全屏、手动刷新。

<img src="/monitor/server.png" width="900">

### 诊断监控 <Badge type="tip" text="v2.0.0+" />

一页看完线程、类加载、GC、内存分区、连接池与接口性能：

<img src="/monitor/diagnosis.png" width="900">

- **线程（Threads）**：存活、守护、峰值、累计启动数四项计数，配合 `RUNNABLE` / `WAITING` / `TIMED_WAITING` 状态分布环图，线程堆积一眼可见。
- **类加载（Class Loading）**：当前已加载、累计加载与已卸载类数量，以及 JIT 编译器类型与累计编译耗时。
- **GC**：各收集器（如 G1 Young / Old Generation）的回收次数与累计耗时。
- **内存分区（Memory Pools）**：Metaspace、CodeCache、G1 Eden / Survivor / Old Gen、Compressed Class Space 的 `Used` 与 `Committed` 条形对比，下方表格再逐项列出 `USED` / `COMMITTED` / `MAX` 与使用率，使用率过高的分区以红色标注。
- **Thread Dump**：右上角一键导出线程快照，用于排查死锁与线程堆积。

再往下是连接池与接口性能：

<img src="/monitor/http-stats.png" width="900">

- **连接池（HikariCP）**：活跃、空闲、总数、等待、最大连接数与活跃占比，并带活跃趋势迷你图。
- **HTTP 统计**：按接口列出请求数、平均耗时、最大耗时与错误数（含错误率），耗时偏高的接口以橙色 / 红色标注；可按 **By Avg**（平均耗时）/ **By Count**（调用次数）/ **By Errors**（错误数）切换排序，**Reset** 清零重新统计。

:::tip Erupt 类注册表已迁至 erupt-atlas
2.2.0 起「Erupt 类注册表」及其字段下钻归入 [erupt-atlas](/zh/modules/erupt-atlas#类注册表)，与模型关系图同属「模型图谱」菜单；erupt-monitor 只保留系统监控。旧菜单的处理方式见[升级指南](/zh/guide/upgrade#_4-erupt-类注册表从-erupt-monitor-迁入-erupt-atlas)。
:::

### 缓存监控

Redis 运行状况一屏总览：连接数、Key 数量、已用内存、运行天数、当前 QPS、命中率、被驱逐 Key 数、内存峰值八张指标卡，配合 Redis 基础信息（版本、端口、是否集群、持久化方式、内存碎片率、RDB 状态）、命令分布饼图与 Key 数量趋势图。

需要先在 `application.yml` 中配置 Redis 连接：

```yaml
spring:
  data:
    redis:
      database: 0
      timeout: 10000
      host: 127.0.0.1
      port: 6379
      password:
```

:::warning
Spring Boot 3 起 Redis 配置前缀为 `spring.data.redis.*`，旧的 `spring.redis.*` 已失效。
:::

<img src="/monitor/redis.png" width="900">
