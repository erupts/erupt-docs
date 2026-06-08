# Modules Overview

Erupt follows a modular design — core capabilities are split into independent Maven modules so you can pull in only what you need.

## Official Modules

| Module                | Description                                            | Docs                                |
|-----------------------|--------------------------------------------------------|-------------------------------------|
| `erupt-upms`          | User & permission management (permissions, roles, menus, orgs) | [Details](/en/modules/erupt-upms)      |
| `erupt-job`           | Scheduled jobs                                         | [Details](/en/modules/erupt-job)       |
| `erupt-monitor`       | Service monitoring (JVM, cache, online users)          | [Details](/en/modules/erupt-monitor)   |
| `erupt-notice`        | Notifications (announcements, in-app messages)         | [Details](/en/modules/erupt-notice)    |
| `erupt-jpa`           | Deeply enhanced JPA database layer                     | [Details](/en/modules/erupt-jpa)       |
| `erupt-mongodb`       | MongoDB NoSQL data source                              | [Details](/en/modules/erupt-mongodb)   |
| `erupt-magic-api`     | Online IDE                                             | [Details](/en/modules/erupt-magic-api) |
| `erupt-tpl`           | Custom pages                                           | [Details](/en/modules/erupt-tpl)       |
| `erupt-ai`            | Deep LLM integration                                   | [Details](/en/modules/erupt-ai)        |
| `erupt-cloud`         | Distributed cloud-native solution                      | [Details](/en/modules/erupt-cloud)     |
| `erupt-web`           | Frontend source                                        | [Details](/en/modules/erupt-web)       |
| `erupt-websocket`     | WebSocket real-time interactions                       | [Details](/en/modules/erupt-websocket) |
| `erupt-generator`     | Code-generation helper                                 | [Details](/en/modules/erupt-generator) |

## Commercial Plugins

| Module          | Description                       | Docs                                  |
|-----------------|-----------------------------------|---------------------------------------|
| `erupt-flow`    | Universal workflow engine         | [Details](/en/modules/pro/erupt-flow)    |
| `erupt-tenant`  | SaaS multi-tenancy                | [Details](/en/modules/pro/erupt-tenant)  |
| `erupt-chart`   | Low-code data visualization       | [Details](/en/modules/pro/erupt-chart)   |
| `erupt-cube`    | Semantic modeling + visualization | [Details](/en/modules/pro/erupt-cube)    |

## Third-party Plugins

Community-contributed extensions and tools — provided for reference.

| Name | Description | Link |
|---|---|---|
| `erupt-dsl` | ORM dynamic query — build complex conditions with a DSL | [GitHub](https://github.com/search?q=erupt-dsl) |
| `erupt-pf4j` | Dynamic plugin loading based on PF4J | [GitHub](https://github.com/search?q=erupt-pf4j) |
| EZDML | Database modeling tool — can directly generate Erupt entities | [Site](http://www.ezdml.com) |
| MP Crawler | Crawler and management plugin for WeChat Official Accounts | — |
| Erupt Vote | Voting plugin covering multiple voting scenarios | — |

## How to Add a Module

All module versions are kept in sync with the Erupt core version — manage them centrally with `${erupt.version}`:

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>module-name</artifactId>
    <version>${erupt.version}</version>
</dependency>
```
