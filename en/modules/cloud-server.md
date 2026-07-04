# Erupt Cloud Server

> Distributed node management center. Replaces traditional configuration center yml files with database tables; manages node configurations, service registration, and request scheduling through a visual interface.

## Core Capabilities

Traditional microservice configuration centers (Nacos, Apollo, etc.) rely on yml/properties files for configuration management, and changes require re-publishing or restarting services. Erupt Cloud stores configurations in database tables, enabling visual editing through the admin interface. Nodes pull updates in real time with no additional configuration center infrastructure to maintain.

| Traditional Config Center | Erupt Cloud |
| --- | --- |
| yml / properties files | Database tables (visual management) |
| Requires deploying Nacos / Apollo | Reuses the existing database |
| Nodes must be notified to refresh after changes | Nodes pull actively; changes take effect immediately |
| Configurations scattered across project repositories | Centrally maintained on the Server side |

## Usage

### 1. Create an Erupt Project

Refer to [Quick Start](/en/guide/quick-start)

### 2. Add Maven Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-cloud-server</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

### 3. Add Redis Configuration and Enable redis-session

```yaml
spring:
  redis:
    database: 0
    timeout: 10000
    host: 127.0.0.1
erupt:
  redis-session: true
```

### 4. Start the Project

<img src="/cloud/server-start.png" width="900">

After logging in, node management menus appear:

<img src="/cloud/server-menu.png" width="900">

**Deployment successful!**

## Optional Configuration

```yaml
erupt:
  cloud-server:
    # Cloud key namespace (optional)
    cloud-name-space: 'erupt-cloud:'
    # Node persistence duration, in ms
    node-expire-time: 60000
    # Node liveness check interval, in ms
    node-survive-check-time: 120000
    # Whether to validate node access-token, default true (supported from 1.11.4+)
    validate-access-token: true
```

## Docker Deployment

The Server side supports Docker deployment. New features only require developing Node instances:

```bash
docker pull erupts/erupt:version
```

The image version matches the Erupt version number. Version information: [https://hub.docker.com/repository/docker/erupts/erupt/general](https://hub.docker.com/repository/docker/erupts/erupt/general)

Refer to the [Changelog](/en/guide/changelog) for the latest version number.
