# Erupt Cloud Distributed Configuration Center

:::tip
Use Erupt's data management capabilities in a distributed architecture to build a universal cloud configuration center that manages any service in the cluster!

Zero frontend code — pure annotation-based configuration management for different microservices, with no frontend integration or interface exposure required.

Compared to traditional solutions like Apollo, Erupt-Cloud offers much higher customization in terms of configuration shape, permission granularity, and business extension, making microservice configurations truly "visible, controllable, and editable", and significantly improving the controllability and operational efficiency of distributed systems.
:::

## Application Scenarios

> No need to worry about the upper-level Erupt architecture — database and resource isolation are achieved naturally.
>
> In a distributed architecture, different microservices manage different configurations based on their capabilities. Visual configuration can be implemented according to a service's capabilities, for example:

- **Notification Service**: Provides notification template configuration, channel configuration, sending rule configuration, etc.
- **App Service**: Provides configuration for each version of the app, such as update files, update methods, version numbers, update content, etc.
- **Gateway Service**: Provides gateway configuration for different services, such as timeout settings, forwarding paths, rate-limiting rules, etc.
- **Tracking Service**: Manages tracking events, tracking strategies, tracking methods, tracking paths, etc.
- **Message Service**: Manages topic creation and subscription, push strategy configurations, etc.
- **Algorithm Service**: Manages GPT agent prompts, fuzzy matching rules for algorithms, etc.
- **Logistics Service**: Manages external logistics provider information, such as carrier names, API integration methods, keys, feature lists, etc.
- **Data Service**: Metric management, data model management, data relationship configuration, etc.

## Comparison with Erupt Admin

|  | Erupt-Admin | Erupt-Cloud |
|---|---|---|
| Use Case | Single machine | Distributed cluster |
| Architecture Advantage | Simple development, single-machine deployment | Resource isolation, business isolation, suitable for medium-to-large team collaboration |
| Database Dependencies | User, role, and menu-related business tables | Distributed nodes have no table dependencies |
| Internal Dependencies | Depends on erupt-upms, erupt-security, erupt-web, etc. | Only requires erupt-node; lightweight Erupt usage |
| Capabilities | Full Erupt capabilities, extensible via plugins | Core Erupt capabilities, including: custom buttons, DataProxy, internationalization, etc. |

## Comparison with Traditional Distributed Admin Backends

|  | Traditional Admin Backend | Erupt Cloud |
|---|---|---|
| Development Approach | Interface development + frontend integration + gateway routing | Register node + no need to manage gateway |
| Frontend Integration | Draw UI, API debugging, permission configuration, etc. | No frontend integration needed; configure menu permissions only |
| Permission Control | Additional permission control code, or gateway-level control | erupt-cloud-server comes with a complete permission system; permissions can be freely managed and extended in menus |
| Data Security | Controlled via gateway or frontend; internally may use token control | Supports data isolation at table, row, column, and button levels |

## Comparison with Configuration Centers

|  | Nacos / Apollo / Spring Config | Erupt Cloud |
|---|---|---|
| Data Management Method | Configuration descriptor files, suitable for basic-format data | Has row/column structure, suitable for more complex multi-row data |
| Data Rollback | Version-based, arbitrary rollback | Audit-based; all operations leave a trace on the platform |
| Permission Control | User role-based permission control | User role permission control, down to row, column, and button level |
| Target Audience | R&D | R&D, Operations, Product |
| Focus | Compile-time or runtime configuration based on yml/json/prop formats | Runtime configuration based on database tables |

> The use cases and focus areas are different; can coexist with Nacos, Apollo, and other middleware, each serving its own purpose.

## Overall Architecture

:::info
**Advantages**: Small package size, low intrusion, smooth upgrades, business isolation, fast startup — ideal for large-scale team development collaboration

**Deployment**: No dependency on Nacos or Eureka; very simple deployment

**Containers**: Kubernetes-friendly; supports IP migration and k8s svc mapping

**Resource Isolation**: Database connection pool isolation, code logic isolation
:::

### Call Sequence Diagram

<img src="/cloud/sequence.jpeg">

### Cluster Architecture Diagram

:::danger
Any service in the cluster can integrate erupt-node to implement internal configuration management for that service, enabling multi-dimensional configuration, real-time updates, collaborative management, and permission checks.
:::

<img src="/cloud/cluster.jpeg">

### High-Availability Architecture Diagram

Each node in the diagram below can be understood as a service that has integrated erupt-node to manage its own internal configuration.

<img src="/cloud/ha.jpeg">

:::info
Used to manage node instances, responsible for service registry, request scheduling, and load distribution.
:::

## Quick Start

- [erupt-cloud-server Deployment](/en/modules/cloud-server)
- [erupt-cloud-node Deployment](/en/modules/cloud-node)

- **erupt-cloud-server**: The main server, responsible for scheduling and managing all node instances
- **erupt-cloud-node**: A micro-node that can be deployed on different servers and is centrally managed by the server

## Adding the Dependency

Server side:

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-cloud-server</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

Node side:

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-cloud-node</artifactId>
  <version>${erupt.version}</version>
</dependency>
```
