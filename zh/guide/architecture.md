# 架构设计

## Erupt 类能力

<img src="/architecture/capability-zh.svg" width="900" alt="Erupt 类能力">

## 功能导图

<img src="/architecture/feature-map-zh.svg" width="900" alt="Erupt 功能导图">

## 功能架构

<img src="/architecture/arch-zh.svg" width="900" alt="Erupt 功能架构">

---

## 分层架构

Erupt 采用分层模块化设计，各层职责清晰，按需引入。

<img src="/architecture/layers-zh.svg" width="900" alt="Erupt 分层架构">

## 请求生命周期

一次 CRUD 请求在框架内的完整处理流程：

<img src="/architecture/request-seq-zh.svg" width="900" alt="Erupt 请求生命周期">

## DataProxy 生命周期

DataProxy 是 Erupt 的 Service 层，覆盖增删改查全部生命周期钩子：

<img src="/architecture/dataproxy-zh.svg" width="900" alt="DataProxy 生命周期">

## 注解驱动原理

从一个 Java 类到完整后台管理页面的自动化过程：

<img src="/architecture/annotation-zh.svg" width="900" alt="Erupt 注解驱动原理">

## 模块依赖关系

<img src="/architecture/modules-zh.svg" width="900" alt="Erupt 模块依赖关系">

## 分布式架构（erupt-cloud）

<img src="/architecture/cloud-zh.svg" width="900" alt="Erupt 分布式架构（erupt-cloud）">
