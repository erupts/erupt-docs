# 扩展模块总览

Erupt 采用模块化设计，核心功能拆分为独立 Maven 模块，按需引入。

## 官方模块列表

| 模块 | 说明 | 文档 |
|------|------|------|
| `erupt-upms` | 用户权限管理系统（权限、角色、菜单、组织） | [详情](/modules/erupt-upms) |
| `erupt-job` | 定时任务管理 | [详情](/modules/erupt-job) |
| `erupt-monitor` | 服务监控（JVM、缓存、在线用户） | [详情](/modules/erupt-monitor) |
| `erupt-notice` | 通知模块（公告、站内信） | [详情](/modules/erupt-notice) |
| `erupt-jpa` | JPA 数据库能力高度扩展 | [详情](/modules/erupt-jpa) |
| `erupt-bi` | 低代码数据可视化 | [详情](/modules/erupt-bi) |
| `erupt-mongodb` | MongoDB NoSQL 数据源 | [详情](/modules/erupt-mongodb) |
| `erupt-magic-api` | 在线 IDE | [详情](/modules/erupt-magic-api) |
| `erupt-tpl` | 自定义页面 | [详情](/modules/erupt-tpl) |
| `erupt-ai` | 大模型深度集成 | [详情](/modules/erupt-ai) |
| `erupt-flow` | 通用流程引擎 | [详情](/modules/erupt-flow) |
| `erupt-tenant` | SaaS 多租户 | [详情](/modules/erupt-tenant) |
| `erupt-cloud` | 分布式云原生解决方案 | [详情](/modules/erupt-cloud) |
| `erupt-web` | 前端源码 | [详情](/modules/erupt-web) |
| `erupt-websocket` | WebSocket 实时交互 | [详情](/modules/erupt-websocket) |
| `erupt-generator` | 辅助代码生成 | [详情](/modules/erupt-generator) |

## 引入方式

所有模块的版本号与 erupt 核心版本保持一致，使用 `${erupt.version}` 统一管理：

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>模块名</artifactId>
  <version>${erupt.version}</version>
</dependency>
```
