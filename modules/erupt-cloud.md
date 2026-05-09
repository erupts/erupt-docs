# Erupt Cloud 分布式

:::tip
分布式架构中使用 erupt 数据管理能力，构建通用云配中心，管理集群内任意服务！

0 前端代码，纯注解实现不同微服务的配置管理，无需前端对接与接口暴露。

对比 Apollo 等传统方案，Erupt-Cloud 在配置形态、权限粒度、业务扩展等方面提供极高定制空间，让微服务配置真正"看得见、管得住、改得动"，显著提升分布式系统的可控性与运维效率。
:::

## ⭐️ 应用场景

> 无需关注上层 erupt 架构，天然实现数据库隔离、资源隔离。
>
> 分布式架构中，根据微服务能力不同，管理不同的配置，可根据服务的能力实现各种可视化配置，如：

- **通知服务**：提供通知模板配置、通道配置、发送规则配置等
- **APP 服务**：提供 APP 各个版本的配置，如更新文件、更新方式、版本号、更新内容等
- **网关服务**：提供不同服务的网关配置，如超时时间、转发路径、限流规则等
- **埋点服务**：管理埋点事件、埋点策略、埋点方式、埋点路径等
- **消息服务**：管理 topic 的创建与监听、推送策略等配置
- **算法服务**：管理 GPT 智能体的 prompt、算法模糊匹配规则等
- **快递服务**：管理外部物流服务商信息，如快递公司名称、接口对接方式、密钥、功能列表等
- **数据服务**：指标管理、数据模型管理、数据关系配置等

## 与 Erupt Admin 的区别

|  | Erupt-Admin | Erupt-Cloud |
|---|---|---|
| 应用场景 | 单机 | 分布式集群 |
| 架构优势 | 开发简单，单机部署 | 资源隔离，业务隔离，适合中大型团队协作开发 |
| 数据库依赖 | 用户、角色、菜单相关业务表 | 分布式节点无表依赖 |
| 内部依赖 | 依赖 erupt-upms、erupt-security、erupt-web 等 | 仅需依赖 erupt-node 即可，轻量级使用 erupt |
| 能力 | 全部 erupt 能力，根据插件扩充边界 | 拥有 erupt 核心能力，包括：自定义按钮、DataProxy、国际化等 |

## 与传统分布式后台的区别

|  | 传统管理后台 | Erupt Cloud |
|---|---|---|
| 开发方式 | 接口开发 + 前端对接 + 网关请求 | 注册节点 + 无需关注网关 |
| 前端对接 | 绘制界面 UI，接口联调，权限配置等 | 无需前端对接，配置菜单权限即可 |
| 权限控制 | 额外的权限控制代码，或网关整体控制 | erupt-cloud-server 自带完整的权限体系，权限可在菜单中自由管理与扩展 |
| 数据安全 | 通过网关或前端控制，服务内部可能通过 token 控制 | 支持：表、行、列、按钮等层级的数据隔离控制 |

## 与配置中心的能力差异

|  | Nacos / Apollo / Spring Config | Erupt Cloud |
|---|---|---|
| 管理数据的方式 | 配置型描述文件，适合管理基础格式的数据 | 有行列关系，适合更加复杂的多行数据 |
| 数据回溯 | 基于版本，可任意回退 | 基于审计，任何操作都会在平台中留下痕迹 |
| 权限控制 | 用户角色的权限控制 | 用户角色权限控制，可精细到行、列、按钮 |
| 面向群体 | 研发 | 研发、运营、产品 |
| 关注点 | 基于 yml / json / prop 等格式的编译时或运行时配置 | 基于数据表的运行时配置 |

> 应用场景与关注点不同，可以与 Nacos、Apollo 等中间件同时存在，各司其职。

## 整体架构

:::info
**优势**：打包体积小，低侵入性，平滑升级，业务隔离，快速启动，适合大规模团队的开发协作

**部署**：不依赖 Nacos，不依赖 Eureka，部署非常简单

**容器**：对 k8s 友好，支持 ip 漂移、k8s svc 映射

**资源隔离**：数据库连接池隔离，代码逻辑隔离
:::

### 调用时序图

<img src="/cloud/sequence.jpeg">

### 集群架构图

:::danger
集群内任意服务都可接入 erupt-node 实现该服务内部的配置管理，可做到多维配置、实时变更、协作管理、权限检查等。
:::

<img src="/cloud/cluster.jpeg">

### 高可用架构图

下图每个 node 都可以理解为一个服务，它接入了 erupt-node 来管理本服务内的配置信息。

<img src="/cloud/ha.jpeg">

:::info
用于管理 node 节点，负责服务注册中心，请求调度与负载分发。
:::

## 快速开始

- [erupt-cloud-server 部署](/modules/cloud-server)
- [erupt-cloud-node 部署](/modules/cloud-node)

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
