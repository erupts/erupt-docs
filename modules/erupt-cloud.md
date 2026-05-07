# Erupt Cloud 分布式云原生解决方案

erupt-cloud 提供分布式微服务架构支持，通过 cloud-server（服务端）和 cloud-node（微节点）实现分布式部署和集群管理。

## 架构说明

- **erupt-cloud-server**：主服务端，负责调度和管理所有 node 节点
- **erupt-cloud-node**：微节点，可部署在不同的服务器上，被 server 统一管理

## 引入方式

Server 端：

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-cloud-server</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

Node 端：

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-cloud-node</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 部署说明

详见：[部署文档](/deployment/cloud-server)
