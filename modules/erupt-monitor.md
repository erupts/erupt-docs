# Erupt Monitor 服务监控

erupt-monitor 提供服务器与应用的实时监控能力，包括 CPU、内存、磁盘、JVM 状态、Redis 缓存以及在线用户管理。

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

### 在线用户

查看当前在线用户列表，支持强制下线操作，适用于安全管控场景：

<img src="/monitor/online.png" width="900">
