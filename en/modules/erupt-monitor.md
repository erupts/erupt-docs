# Erupt Monitor Service Monitoring

erupt-monitor provides real-time monitoring of server and application status, including CPU, memory, disk, JVM state & GC diagnostics, HikariCP connection pool, HTTP request statistics, Redis cache, online user management, and the Erupt class registry.

> **Completely rewritten in 2.0.0**: a new diagnostics monitoring system covering JVM GC, API connection pool real-time stats, and HTTP request statistics. Upgrading from an older version requires manually deleting the `.erupt` directory and old "System Monitor" menus before restarting — see the [Upgrade Guide](/en/guide/upgrade#step-2-manually-delete-stale-menus).

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

### Erupt Class Registry <Badge type="tip" text="v2.1.0+" />

A read-only registry of every `@Erupt` model loaded in the current process, fed directly from runtime memory (EruptCoreService) rather than a database table — giving you an at-a-glance view of all models in the system.

<img src="/monitor/erupt-register.png" width="900">

**List columns**:

| Column | Description |
| --- | --- |
| Source | The module/source the model belongs to, filterable |
| Class Name / Display Name | The model class name and its `@Erupt(name)`, with fuzzy search |
| Multi-language | Whether the model is annotated with `@EruptI18n` |
| Field Count | Number of `@EruptField` fields in the model |
| Data Processor | The data-source processor used (JPA, MongoDB, JDBC, etc.) |
| Runtime Registered | Whether the model was registered dynamically at runtime (e.g. erupt-cloud remote models) |
| Published | Whether the model has been published as a menu |

**Key capabilities**:

- **Field drill-down**: drill into any row to inspect the model's full field details
- **Model JSON**: the detail view shows the complete JSON structure resolved from class-level annotations
- **Publish to menu in one click**: unpublished models can be published as a TABLE menu directly, auto-generating the full set of function-permission buttons (add, edit, delete, export, etc.) and refreshing the menu cache — no manual configuration needed

### Cache Monitoring

Visualize Redis cache data, with support for querying by key, viewing values, and deleting cache entries.

First configure the Redis connection in `application.yml`:

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
Since Spring Boot 3, the Redis configuration prefix is `spring.data.redis.*`. The legacy `spring.redis.*` prefix no longer works.
:::

<img src="/monitor/redis.png" width="900">
