# 快速开始

本文介绍如何在 erupt 项目中接入 erupt-tenant，能力介绍见 [Erupt SaaS 多租户](/zh/modules/pro/erupt-tenant/)。

:::tip
erupt-tenant 为商业模块，购买后联系作者开通源码仓库权限。
:::

## 模块组成

| 模块 | 说明 | 依赖 |
| --- | --- | --- |
| **erupt-tenant-core** | 业务表隔离：`@EruptTenant` 注解、隔离 DataProxy、租户上下文 `EruptTenantContext`、租户基类 `TenantBaseModel` 系列 | erupt-jpa |
| **erupt-tenant** | 租户平台：租户配置、套餐、订阅、租户登录与 SSO 接入、域名定制、菜单范围；租户的用户 / 角色 / 组织直接由 erupt-upms 提供 | erupt-upms、erupt-tenant-core |

erupt-cloud-node 节点只需引入 `erupt-tenant-core`：租户身份由 cloud-server 随请求转发，节点上不需要 UPMS 与会话存储。

## 1. 编译源码并发布到本地仓库

拉取源码：[https://github.com/erupt-io/erupt-tenant](https://github.com/erupt-io/erupt-tenant)，切换到与 erupt 版本一致的 tag：

<img src="/tenant/release-tag.png" width="750">

在项目根目录执行：

```bash
mvn -D skipTests=true install
```

## 2. 引入依赖

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-tenant</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

## 3. 启动应用

启动时自动建表、初始化菜单，不需要执行 SQL 脚本：

- 超管端出现「租户管理」菜单，包含 **租户配置**、**租户套餐**
- UPMS 表已带 `tenant_id` 列（平台行为 `'0'`），无需任何配置

:::warning 从 2.3.x 升级
用户、角色、组织、岗位的唯一约束已改为 `(tenant_id, account)` / `(tenant_id, code)`，旧版本的单列唯一索引需要手工删除，原 `t_e_upms_*` 租户用户表的数据需要迁移，见 [升级指南](/zh/guide/upgrade)。
:::

## 4. 配置套餐

在「租户套餐」中新建套餐，从平台菜单中勾选租户可用的功能。租户没有独立的菜单表，想让租户管理员自己管理团队，就把 erupt-upms 的菜单一起勾进套餐：

- 用户维护、角色维护、组织维护、岗位维护
- 登录日志、操作日志、在线用户
- 业务菜单（例如接入了 `@EruptTenant` 的业务模型）

可选填写 **试用天数**，新租户未指定到期时间时按它计算到期日。

## 5. 新建租户

在「租户配置」中新建租户：填写企业 ID、名称、管理员账号（默认 `admin`）与密码，选择套餐；到期时间留空则按套餐试用天数计算，套餐都没有试用天数则永不到期。

保存后会生成租户 ID，并在该租户内创建管理员用户。

## 6. 登录租户系统

```
http://your-host/#/passport/tenant
```

输入企业 ID、管理员账号与密码即可进入；也可在「租户配置」的行操作中点击 **进入租户后台** 直接以管理员身份打开。

在线演示：[https://demo.erupt.xyz/#/passport/tenant](https://demo.erupt.xyz/#/passport/tenant)

## 下一步

1. [业务表多租户](/zh/modules/pro/erupt-tenant/development) — 一个注解让业务表按租户隔离
2. [UPMS 多租户](/zh/modules/pro/erupt-tenant/upms) — 了解用户目录如何隔离，以及在代码中切换租户
3. [套餐与订阅](/zh/modules/pro/erupt-tenant/subscription) — 试用、到期、续期
