# Erupt SaaS 多租户

使用 Erupt 注解低代码开发多租户能力，页面功能多租户复用且数据完全隔离，适合 SaaS 产品开发场景。

:::tip 商业模块
**包含**：完整源码 · 全版本升级 · 技术支持 · erupt 相关问题优先支持 · 合理需求免费实现 · 能力持续迭代
**授权**：无 License 限制 · 可多项目复用 · 无商用限制
**限制**：禁止二次开源与分发
:::

<a href="https://www.erupt.xyz/?utm_source=docs&utm_medium=banner&utm_campaign=pro#!/pro" target="_blank">
  <img src="/pro/cta-zh.svg" width="900" alt="查看 Erupt Pro 定价与购买流程">
</a>

由开源 Erupt 框架团队官方出品与维护（[GitHub 3k+ ★](https://github.com/erupts/erupt) · [Gitee 5k+ ★](https://gitee.com/erupt/erupt)），源码交付，可与你的业务深度定制。

演示：[https://demo.erupt.xyz/#/passport/tenant](https://demo.erupt.xyz/#/passport/tenant)

:::info 使用文档
[快速开始](/zh/modules/pro/erupt-tenant/quick-start) · [多租户开发](/zh/modules/pro/erupt-tenant/development) · [域名与租户定制](/zh/modules/pro/erupt-tenant/domain) · [数据库设计](/zh/modules/pro/erupt-tenant/database)
:::

---

<img src="/tenant/login1.png" width="900">

<img src="/tenant/login2.png" width="900">

## 为什么不用 ShardingSphere / Mybatis-Plus tenantId 插件 / 自研？

| 维度 | ShardingSphere | Mybatis-Plus tenantId | 自研 | **Erupt Tenant** |
| --- | --- | --- | --- | --- |
| 数据隔离 | ✅（数据库层强项） | ⚠️ 仅 SQL 注入字段 | 看实现 | **✅ 表级隔离 + 业务级隔离** |
| 业务隔离 | ❌ | ❌ | 需要自己做 | **✅ 自动注入租户上下文** |
| 请求路由 | ❌ | ❌ | 需要自己做 | **✅ 配置即生效** |
| 按租户配置 | ❌ | ❌ | 需要自己做 | **✅ 菜单 / 套餐 / 主题独立** |
| 权限隔离 | ❌ | ❌ | 需要重做一遍 | **✅ 复用 UPMS，多租户感知** |
| 学习曲线 | 陡 | 平 | — | **平（注解即多租户）** |
| 上线时间 | 2–4 周 | 1–2 周（仍需补业务层） | 1–3 月 | **1–2 天** |

ShardingSphere 解决的是「同一个 schema 怎么按租户分库分表」的数据库问题，**不解决业务层**：你的服务怎么知道当前请求属于哪个租户？菜单怎么按租户隔离？租户专属配置怎么落地？这些都得自己写 —— 这是自研多租户最容易低估的工作量。erupt-tenant 把数据隔离 + 请求路由 + 业务上下文 + 配置隔离 + 权限隔离一站打包。

## 功能说明

### 租户管理

通过超管账号管理租户信息，支持一键跳转到租户应用、修改超管密码、定义域名、租户专属 JS/CSS 等：

<img src="/tenant/tenant-manage.png" width="900">

### 租户套餐

套餐从平台「菜单管理」中勾选一组菜单，再按套餐授权给租户。租户的全部会话（含租户管理员）只能看到其已启用套餐内的菜单，租户的角色编辑器也只能从这些菜单中分配权限：

<img src="/tenant/tenant-package.png" width="900">

:::info
2.4.0 起不再有独立的「租户菜单」：套餐直接引用平台菜单表 `e_upms_menu`，菜单只需在「菜单管理」维护一份。
:::

### 租户登录

<img src="/tenant/tenant-login.png" width="900">

接入 [erupt-sso](/zh/modules/erupt-sso) 后，租户登录页会列出该租户自己配置的 SSO 提供方（`GET /erupt-api/sso/providers?tenant=<企业 ID>`），单点登录后开启的仍是租户会话；已锁定或已到期的租户同样会被拒绝。

### 用户 / 角色 / 组织管理

租户端的用户、角色、组织就是 erupt-upms 的原生页面，数据与平台共用 `e_upms_user` / `e_upms_role` / `e_upms_org` 表，按 `tenant_id` 列由 Hibernate 自动隔离：

<img src="/tenant/user-manage.png" width="900">

<img src="/tenant/role-manage.png" width="900">

<img src="/tenant/org-manage.png" width="900">

## 订阅与试用

租户的订阅只有一个日期：**到期时间**（`expireDate`），为空表示永不到期。

- **试用**：新建租户时若未填写到期时间，取其已启用套餐中最长的「试用天数」（`EruptTenantPackage.trialDays`）作为到期时间；套餐都没有配置试用天数则不设到期。
- **状态**：`Active` / `Grace` / `Expired` 由到期时间与宽限天数在每次读取时推导，不落库。过了到期时间但仍在 `erupt.tenant.subscription.grace-days` 内为 `Grace`，仍可使用；超过宽限期为 `Expired`。
- **锁定**：租户配置中的「状态」开关独立于到期时间，锁定后无论是否到期都拒绝登录。
- **在线会话**：租户在用户已登录的情况下到期或被锁定，其会话在下一次请求时被注销并返回 `401`，前端回到租户登录页并显示原因。状态会缓存 `erupt.tenant.subscription.status-cache-seconds`（默认 30 秒），超管端修改租户后立即失效。
- **续期**：erupt 不负责收费。应用自己的支付逻辑在收款成功后调用 `TenantSubscriptionService#extend(tenantConfigId, Period, now)` 延长到期时间——从原到期时间顺延，已过期则从当前时间起算。

```yaml
erupt:
  tenant:
    subscription:
      grace-days: 7            # 到期后的宽限天数，默认 0
      status-cache-seconds: 30 # 订阅状态缓存秒数，默认 30
```

租户会话可通过 `GET /erupt-api/tenant/info` 查看自己的租户 ID、名称、订阅状态、到期时间与已启用的套餐。

## 数据隔离原理

采用**表级隔离**——所有租户数据存储在同一张表中，通过租户标识进行行级过滤，而非 schema 或独立数据库隔离。

优势：
- 数据集中存储，查询、备份、运维无需跨库操作
- 性能优化一次覆盖全部租户数据
- 无需处理多 schema 的兼容性与升级问题
- 无需为每个租户单独分配数据库资源，理论上支持无限租户数量

## 多租户开发

在 Erupt 类中添加对应注解即可实现：不同租户功能一致（也可根据租户信息动态渲染），数据完全隔离，一套代码服务多个企业客户。

## 适用场景

- SaaS 创业团队（同一套代码服务 N 个企业客户）
- 白标交付（同一套系统，按客户换品牌、域名、菜单）
- 集团内部多部门 / 多子公司隔离
- 多区域 / 多品牌运营

## 常见问题

**Q1 · 和开源版 erupt 有什么差异？**
开源 erupt 是单租户架构。erupt-tenant 是商业模块，引入了完整的多租户基建（数据隔离 + 请求路由 + 业务上下文 + 配置隔离 + 多租户感知权限）—— 这部分开源版不包含、且未来也不会开源。

**Q2 · 怎么交付？**
付款后，提供你的 GitHub 用户名，作者会把你加入私有仓库 `erupts/erupt-tenant` 的 collaborator，可直接 clone 源码、本地编译、按需引用，并发一份接入文档。

**Q3 · 后续版本升级要再付费吗？**
不需要。一次买断 = 你拥有当前及所有未来版本的访问权。私有仓库的 master 持续更新，git pull 即可。

**Q4 · 项目数量 / 商用 / 转手怎么算？**
- **可多项目复用**：公司内部、你接的外包项目，部署多少个都不限
- **无商用限制**：可用于商业产品（含二次销售你的成品，但不可直接卖 erupt-tenant 源码本身）
- **转手**：禁止二次开源、禁止源代码再分发；公司更名或主体变更可申请授权迁移

**Q5 · 试用 / 退款？**
[在线演示](https://demo.erupt.xyz/#/passport/tenant) 已开放完整功能，建议先充分体验。开通仓库权限后视为交付完成，不再支持退款。

---

如有未列出问题，请前往 [定价与购买页面](https://www.erupt.xyz/#!/pro) 联系作者咨询。
