# Erupt Monitor 服务监控

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

提供服务器 CPU、内存、磁盘使用情况及 JVM 运行状态的可视化监控面板。

<!-- TODO: 添加截图 -->

### 缓存监控

需要先配置 Redis 连接：

```yaml
spring:
  redis:
    database: 0
    timeout: 10000
    host: 127.0.0.1
```

<!-- TODO: 添加截图 -->

### 在线用户

查看当前在线用户列表，支持强制下线操作。

<!-- TODO: 添加截图 -->
