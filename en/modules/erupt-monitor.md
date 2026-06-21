# Erupt Monitor Service Monitoring

erupt-monitor provides real-time monitoring of server and application status, including CPU, memory, disk, JVM state & GC diagnostics, HikariCP connection pool, HTTP request statistics, Redis cache, and online user management.

> **Completely rewritten in 2.0.0**: a new diagnostics monitoring system covering JVM GC, API connection pool real-time stats, and HTTP request statistics. Upgrading from an older version requires manually deleting the `.erupt` directory and old "System Monitor" menus before restarting — see the [Upgrade Guide](/en/guide/upgrade#erupt-monitor-menu-rebuild).

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-monitor</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

After a successful import, restart the application to see the **System Monitoring** menu entries.

## Features

### Server Monitoring

Displays real-time server CPU usage, memory consumption, disk space, JVM heap memory, GC count, and other runtime metrics:

<img src="/monitor/server.png" width="900">

### JVM Diagnostics <Badge type="tip" text="v2.0.0+" />

Shows JVM thread states, GC pause times and frequency, and heap/non-heap memory region details — making it easy to spot memory leaks and GC pressure.

### HikariCP Connection Pool Monitoring <Badge type="tip" text="v2.0.0+" />

Real-time display of HikariCP metrics: active connections, pending queue size, maximum pool size, and more — letting you immediately see connection pool saturation.

### HTTP Request Statistics <Badge type="tip" text="v2.0.0+" />

Aggregates per-endpoint request counts, average response times, and error rates to support API performance analysis.

### Cache Monitoring

Visualize Redis cache data, with support for querying by key, viewing values, and deleting cache entries.

First configure the Redis connection in `application.yml`:

```yaml
spring:
  redis:
    database: 0
    timeout: 10000
    host: 127.0.0.1
    port: 6379
```

<img src="/monitor/redis.png" width="900">
