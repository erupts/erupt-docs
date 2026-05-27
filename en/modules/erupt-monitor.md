# Erupt Monitor Service Monitoring

erupt-monitor provides real-time monitoring of server and application status, including CPU, memory, disk, JVM state, Redis cache, and online user management.

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

### Online Users

View the list of currently online users and force-log-out specific users. Ideal for security control scenarios:

<img src="/monitor/online.png" width="900">
