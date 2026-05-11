# Erupt 框架介绍

**Erupt 通用数据管理框架**

[![Maven Central](https://img.shields.io/maven-central/v/xyz.erupt/erupt)](https://search.maven.org/search?q=g:xyz.erupt) ![JDK 17+](https://img.shields.io/badge/JDK-17+-green.svg) ![License Apache 2](https://img.shields.io/badge/license-Apache%202-blue) ![GitHub Stars](https://img.shields.io/github/stars/erupts/erupt?style=social)

## 简介

Erupt 是一个低代码**全栈类**框架，它使用 **Java 注解**动态生成页面以及增、删、改、查、权限控制等后台功能。

零前端代码、零 CURD、自动建表，仅需**一个类文件** + 简洁的注解配置，快速开发企业级 Admin 管理后台。

提供企业级中后台管理系统的全栈解决方案，大幅压缩研发周期，专注核心业务。

| 特性 | 说明 |
| --- | --- |
| 操作系统支持 | Windows、Linux、Mac |
| JDK 支持 | 17+ |
| Spring Boot 支持 | 3.x |
| 数据源支持 | MySQL、PostgreSQL、SQL Server、Oracle、H2 等，支持 NoSQL 数据源 |
| 启动速度 | 2s ~ 5s |
| 终端适配 | PC、平板、手机 |
| 扩展模块 | 10+ |
| 组件支持 | 20+ |
| OSS 支持 | ✅ |
| 分布式支持 | erupt-cloud |

## 特性

- **易于上手**：会简单的 Spring Boot 基础知识即可
- **使用简单**：仅需了解 `@Erupt` 与 `@EruptField` 两个注解即可上手开发
- **代码简洁**：前端零代码，后端 template、controller、service、dao 都不需要，**仅需一个类文件**即可
- **敏捷开发**：仅单个 `.java` 文件即可实现后台管理功能，专注业务与核心功能的研发
- **快速迭代**：需求变更仅需修改或添加注解配置即可，迭代速度比需求讨论速度还快
- **功能强大**：动态条件处理，支持增删改查等功能代理接口，Session 存储机制选择，行为日志记录等
- **自动建表**：依托于 JPA 可自动帮你完成数据库建表相关工作
- **低侵入性**：几乎所有功能都围绕注解而展开，不影响 Spring Boot 其他功能或三方库的使用
- **多数据源**：支持 MySQL、Oracle、SQL Server、PostgreSQL、H2，甚至支持 MongoDB
- **大量组件**：滑动输入、时间选择、一对多、图片上传、代码编辑器、自动完成、树、多对多、地图等 23 类组件
- **丰富展示**：普通文本、二维码、链接、图片、HTML、代码段、iframe 等
- **代码生成**：erupt 代码已经足够简洁，代码生成器可进一步提升开发效率
- **高扩展性**：支持自定义数据源实现、自定义页面、动态权限管理、生命周期函数、自定义 OSS 等
- **界面美观**：每个交互都精心设计，产品思维打磨，只为了更好的操作体验
- **权限管理**：用户管理、角色管理、组织管理、菜单管理、登录日志、操作日志等
- **高安全性**：可靠的安全机制，登录白名单，权限验证，注解项检查，细颗粒度权限控制
- **前后端分离**：后端与前端可分开部署
- **响应式布局**：支持 PC 端手机端等各种规格的设备中使用
- **无需二次开发**：仅需引用 jar 包即可！
- **支持扩展页面**：可开发自定义页面，自定义弹出层，且支持原生 H5 / Freemarker / Thymeleaf 等方式渲染

## 在线体验

演示地址：[https://demo.erupt.xyz](https://demo.erupt.xyz)

账号密码：`guest / guest`

## 相关链接

- [Github 仓库](https://github.com/erupts/erupt)
- [Gitee 仓库](https://gitee.com/erupt/erupt)
- [官方网站](https://www.erupt.xyz/)

---

Copyright © 2019-2035 [erupt.xyz](https://erupt.xyz) All rights reserved.

**作者**：YuePeng / erupts@126.com
