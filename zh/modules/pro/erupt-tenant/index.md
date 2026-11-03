# Erupt SaaS 多租户

一套代码服务多个企业客户：每个租户拥有自己的用户、角色、组织、菜单与数据，彼此完全隔离；平台方在超管端统一管理租户、套餐与订阅。

erupt-tenant 不是在业务层外面再包一层"租户系统"，而是让 **erupt-upms 本身支持多租户**：用户、角色、组织、岗位、日志与平台共用同一套表，由框架按 `tenant_id` 列自动隔离。租户后台用的就是 erupt 原生的用户、角色、组织页面，平台已有的能力（单点登录、通知、审批流、报表、指标）在租户里直接可用。

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
[快速开始](/zh/modules/pro/erupt-tenant/quick-start) · [UPMS 多租户](/zh/modules/pro/erupt-tenant/upms) · [业务表多租户](/zh/modules/pro/erupt-tenant/development) · [套餐与订阅](/zh/modules/pro/erupt-tenant/subscription) · [域名与租户定制](/zh/modules/pro/erupt-tenant/domain) · [数据库设计](/zh/modules/pro/erupt-tenant/database)
:::

---

<img src="/tenant/login1.png" width="900">

<img src="/tenant/login2.png" width="900">

## 整体架构

| 层 | 谁负责 | 怎么隔离 |
| --- | --- | --- |
| **租户与套餐** | 平台超管 | `e_tenant_config` / `e_tenant_package` 只在超管端维护，不带租户列 |
| **用户目录（UPMS）** | erupt-upms | 用户、角色、组织、岗位、登录 / 操作日志、在线用户与平台共用表，框架自动限定查询、自动填充租户（平台行为 `'0'`） |
| **菜单** | 平台 | 菜单只有一份（`e_upms_menu`），套餐勾选菜单，租户的菜单树与可分配菜单被收窄到套餐内 |
| **业务数据** | 你的 `@Erupt` 模型 | 加 `@EruptTenant` 或继承 `TenantBaseModel`，新增自动写入、查询自动过滤、跨租户修改直接拒绝 |

一个请求进来，安全拦截器从会话里拿到租户 ID，数据访问被绑定到这个租户 —— 从此 UPMS 表的查询只会看到本租户的行，业务表由 `@EruptTenant` 追加条件，`${tenantId}` 在报表、指标的 SQL 里同样可用。详见 [UPMS 多租户](/zh/modules/pro/erupt-tenant/upms) 与 [数据库设计](/zh/modules/pro/erupt-tenant/database)。

## 功能一览

### 租户管理

超管在「租户配置」中维护租户：企业 ID、名称、联系人、启用 / 锁定、到期时间、管理员账号、套餐、域名与品牌。行操作支持 **重置管理员密码**、**一键进入租户后台**（以该租户管理员身份打开租户系统）。

<img src="/tenant/tenant-manage.png" width="900">

新建租户时会生成租户 ID，并在该租户内创建一个管理员用户（`is_admin = true`），之后租户的一切数据都在租户自己的范围内。

### 套餐

套餐从平台「菜单管理」中勾选一组菜单，再分配给租户。租户全部会话（包括租户管理员）只能看到已启用套餐内的菜单，租户的角色编辑器也只能分配这些菜单。套餐还可以设置试用天数。详见 [套餐与订阅](/zh/modules/pro/erupt-tenant/subscription)。

<img src="/tenant/tenant-package.png" width="900">

### 租户后台：原生 UPMS

把 erupt-upms 的 **用户维护**、**角色维护**、**组织维护**、**岗位维护**、**登录日志**、**在线用户** 等菜单放进套餐，租户管理员就能自己管理团队 —— 页面与平台完全一样，数据只属于本租户。同一个账号可以在不同租户下各存在一次。

<img src="/tenant/user-manage.png" width="900">

<img src="/tenant/role-manage.png" width="900">

<img src="/tenant/org-manage.png" width="900">

### 租户登录与单点登录

租户用户通过租户登录页（`/#/passport/tenant`）输入企业 ID、账号、密码登录；绑定了域名的租户无需输入企业 ID。接入 [erupt-sso](/zh/modules/erupt-sso) 后，每个租户可配置自己的 SSO 认证源，租户登录页只列出该租户的认证源，单点登录后开启的仍是租户会话。

<img src="/tenant/tenant-login.png" width="900">

### 订阅

租户的订阅只用一个到期时间描述：新租户按套餐试用天数自动计算到期日，到期后可配置宽限期，过期或被锁定的租户在下一次请求时即下线；续期由你的支付逻辑调用 `TenantSubscriptionService#extend` 完成。详见 [套餐与订阅](/zh/modules/pro/erupt-tenant/subscription)。

### 域名与品牌

每个租户可绑定独立域名，并配置 logo、CSS、JS，同一套系统按租户呈现不同的品牌形象，适合白标交付。详见 [域名与租户定制](/zh/modules/pro/erupt-tenant/domain)。

### 平台能力租户内可用

| 能力 | 租户内表现 |
| --- | --- |
| erupt-sso 单点登录 | 认证源按租户隔离，租户自己配置 |
| erupt-flow 审批流 | 审批人、角色、组织负责人按租户解析 |
| erupt-notice 通知 | 租户会话中正常收发 |
| erupt-report / erupt-cube | SQL 中使用 `${tenantId}`，同一张报表在不同租户展示各自的数据 |
| 记录评论、修订记录 | 按租户隔离 |
| erupt-share 分享 | 分享链接记录签发人所在租户，管理端只看到本租户的链接 |
| erupt-cloud 节点 | 租户身份随请求转发到节点，节点只需依赖 `erupt-tenant-core` |

## 为什么不用 ShardingSphere / MyBatis-Plus 租户插件 / 自研？

| 维度 | ShardingSphere | MyBatis-Plus 租户插件 | 自研 | **Erupt Tenant** |
| --- | --- | --- | --- | --- |
| 数据隔离 | ✅（数据库层强项） | ⚠️ 仅 SQL 追加条件 | 看实现 | **✅ UPMS 框架级隔离 + 业务表注解隔离** |
| 用户 / 角色 / 组织 | ❌ | ❌ | 需要重做一遍 | **✅ 原生 UPMS 直接多租户** |
| 菜单与套餐 | ❌ | ❌ | 需要自己做 | **✅ 套餐勾选平台菜单** |
| 登录 / SSO / 订阅 | ❌ | ❌ | 需要自己做 | **✅ 内置** |
| 学习曲线 | 陡 | 平 | — | **平（一个注解接入业务表）** |
| 上线时间 | 2–4 周 | 1–2 周（仍需补业务层） | 1–3 月 | **1–2 天** |

ShardingSphere 解决的是「同一个 schema 怎么按租户分库分表」的数据库问题，**不解决业务层**：当前请求属于哪个租户？用户、角色、菜单怎么按租户隔离？租户怎么登录、怎么到期？这些都得自己写 —— 这是自研多租户最容易低估的工作量。

## 数据隔离方式

采用**共享表 + 租户列**：所有租户的数据存在同一张表中，按租户列过滤，而不是每个租户一个 schema 或数据库。

- 数据集中存储，查询、备份、运维无需跨库
- 加索引、调优一次覆盖全部租户
- 没有多 schema 的结构同步与升级问题
- 不需要为每个租户分配数据库资源，租户数量不受限

## 适用场景

- SaaS 创业团队（同一套代码服务 N 个企业客户）
- 白标交付（同一套系统，按客户换品牌、域名、菜单）
- 集团内部多部门 / 多子公司隔离
- 多区域 / 多品牌运营

## 常见问题

**Q1 · 和开源版 erupt 有什么差异？**
开源 erupt 的 UPMS 已经带有租户列与租户隔离能力，但不引入 erupt-tenant 时所有数据都属于平台（`'0'`），等同单租户。erupt-tenant 提供租户、套餐、订阅、租户登录、域名定制与业务表隔离注解 —— 这部分是商业模块，不会开源。

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
