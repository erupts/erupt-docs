# 快速开始

本文介绍如何在 erupt 项目中接入 erupt-tenant 多租户模块，能力介绍详见 [Erupt SaaS 多租户](/zh/modules/pro/erupt-tenant/)。

:::tip
erupt-tenant 为商业模块，购买后联系作者开通源码仓库权限。
:::

## 源码

- 前端源码：[https://gitee.com/erupt/erupt-web](https://gitee.com/erupt/erupt-web)
- 后端源码：[https://github.com/erupt-io/erupt-tenant](https://github.com/erupt-io/erupt-tenant)

## 模块组成

erupt-tenant 由两个 Maven 模块组成：

| 模块 | 说明 | 依赖 |
| --- | --- | --- |
| **erupt-tenant-core** | 多租户核心能力：`@EruptTenant` 注解、数据隔离 DataProxy、租户上下文 `EruptTenantContext`、可继承租户基类 | erupt-jpa |
| **erupt-tenant** | 完整多租户管理：租户配置 / 租户菜单 / 租户套餐、租户端用户 / 角色 / 组织、租户登录接口 | erupt-upms + erupt-tenant-core |

## 1. 编译源代码，发布到本地仓库

:::info
1.12.16 及以上版本支持
:::

拉取 erupt-tenant github 源代码：[https://github.com/erupt-io/erupt-tenant](https://github.com/erupt-io/erupt-tenant)

切换 tag 到对应版本：[https://github.com/erupt-io/erupt-tenant/tags](https://github.com/erupt-io/erupt-tenant/tags)

<img src="/tenant/release-tag.png" width="750">

在项目根目录下执行如下 maven 打包命令，发布到本地中央仓库或私服即可：

```bash
mvn -D skipTests=true install
```

## 2. 加入 POM 依赖

:::warning
需要执行上一步，发布到本地仓库才可获取到下面的依赖。
:::

**erupt-tenant**：多租户权限控制模块，使用 erupt-admin 依赖的同时加入此依赖即可直接实现多租户的功能：

```xml
<dependencies>
  <dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-tenant</artifactId>
    <version>${erupt.version}</version>
  </dependency>
</dependencies>
```

**erupt-tenant-core**：多租户核心模块，提供多租户的基础功能，erupt-cloud-node 场景仅添加此依赖即可。

## 3. 启动应用

启动后模块会自动初始化菜单，无需任何 SQL 脚本：

- **超管端**：自动注册「租户管理」根菜单，包含 **租户配置**、**租户菜单**、**租户套餐** 三个功能
- **租户端**：自动初始化「系统管理」菜单，包含 **组织维护**、**角色维护**、**用户维护**，并按 erupt 类的 `power` 配置自动生成按钮级权限菜单

在「租户配置」中新建租户（企业 ID、租户名称、管理员账号密码、分配套餐）后，即可通过租户登录页进入租户系统：

```
http://your-host/#/passport/tenant
```

在线演示：[https://demo.erupt.xyz/#/passport/tenant](https://demo.erupt.xyz/#/passport/tenant)

接下来请阅读 [多租户开发](/zh/modules/pro/erupt-tenant/development)，为业务表接入租户数据隔离。
