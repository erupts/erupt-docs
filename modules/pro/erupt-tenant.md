# Erupt SaaS 多租户

使用 Erupt 注解低代码开发多租户能力，页面功能多租户复用且数据完全隔离，适合 SaaS 产品开发场景。

:::tip 付费插件
源码交付 · 技术支持 · 免费更新迭代 · 合理需求免费实现 · erupt 相关问题优先支持 · 无 License 限制 · 可多项目复用 · 禁止二次开源与分发
:::

演示：[https://demo.erupt.xyz/#/passport/tenant](https://demo.erupt.xyz/#/passport/tenant)

售前咨询请添加作者微信：

<img src="/me.jpg" width="240">

---

<img src="/tenant/login1.png" width="900">

<img src="/tenant/login2.png" width="900">

## 功能说明

### 租户管理

通过超管账号管理租户信息，支持一键跳转到租户应用、修改超管密码、定义域名、租户专属 JS/CSS 等：

<img src="/tenant/tenant-manage.png" width="900">

### 租户菜单

独立配置每个租户的功能菜单，配置形式与系统管理的菜单管理一致：

<img src="/tenant/tenant-menu.png" width="900">

### 租户套餐

配置租户有哪些菜单能力，不同租户下菜单数据完全隔离：

<img src="/tenant/tenant-package.png" width="900">

### 租户登录

<img src="/tenant/tenant-login.png" width="900">

### 用户 / 角色 / 组织管理

<img src="/tenant/user-manage.png" width="900">

<img src="/tenant/role-manage.png" width="900">

<img src="/tenant/org-manage.png" width="900">

## 数据隔离原理

采用**表级隔离**——所有租户数据存储在同一张表中，通过租户标识进行行级过滤，而非 schema 或独立数据库隔离。

优势：
- 数据集中存储，查询、备份、运维无需跨库操作
- 性能优化一次覆盖全部租户数据
- 无需处理多 schema 的兼容性与升级问题
- 无需为每个租户单独分配数据库资源，理论上支持无限租户数量

## 多租户开发

在 Erupt 类中添加对应注解即可实现：不同租户功能一致（也可根据租户信息动态渲染），数据完全隔离，一套代码服务多个企业客户。
