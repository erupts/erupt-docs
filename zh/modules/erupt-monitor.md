# Erupt Monitor 服务监控

erupt-monitor 提供服务器与应用的实时监控能力，包括 CPU、内存、磁盘、JVM 状态与 GC 诊断、HikariCP 连接池、HTTP 请求统计、Redis 缓存以及在线用户管理。

> **2.0.0 完全重写**：新增诊断监控体系，覆盖 JVM GC、API 连接池实时状态与 HTTP 请求统计。如从旧版升级，需手动删除 `.erupt` 目录和旧"系统监控"菜单后重启，详见[升级指南](/zh/guide/upgrade#erupt-monitor-菜单重建)。

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

实时展示服务器 CPU 使用率、内存占用、磁盘空间及 JVM 堆内存、GC 次数等运行状态：

<img src="/monitor/server.png" width="900">

### JVM 诊断 <Badge type="tip" text="v2.0.0+" />

展示 JVM 线程状态、GC 停顿时间与频率、堆/非堆内存分区详情，帮助快速定位内存泄漏与 GC 压力。

### HikariCP 连接池监控 <Badge type="tip" text="v2.0.0+" />

实时展示 HikariCP 数据库连接池的活跃连接数、等待队列、最大连接数等指标，可直观判断连接池压力。

### HTTP 请求统计 <Badge type="tip" text="v2.0.0+" />

统计各接口的请求次数、平均响应时间、错误率等，辅助接口性能分析。

### 缓存监控

可视化查看 Redis 缓存数据，支持按 key 查询、查看值内容、删除缓存等操作。

需要先在 `application.yml` 中配置 Redis 连接：

```yaml
spring:
  redis:
    database: 0
    timeout: 10000
    host: 127.0.0.1
    port: 6379
```

<img src="/monitor/redis.png" width="900">
