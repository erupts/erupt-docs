# Erupt Tenant SaaS 多租户

erupt-tenant 提供 SaaS 多租户能力，支持基于数据隔离的多租户架构，适合 SaaS 产品开发场景。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-tenant</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 功能特性

- 租户管理（创建、激活、注销）
- 数据行级隔离
- 租户专属配置
- 与事件监听器集成，支持租户生命周期事件

## 使用场景

适合需要将同一套系统同时为多个客户提供服务的场景，每个客户（租户）的数据相互隔离。
