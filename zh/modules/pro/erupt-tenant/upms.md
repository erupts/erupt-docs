# UPMS 多租户 <Badge type="tip" text="v2.4.0+" />

erupt-upms 本身支持多租户：租户的用户、角色、组织与平台共用同一套表，每张表带一个租户列 `tenant_id`。会话被绑定到某个租户后，框架自动给查询加上 `tenant_id = 当前租户`、给新增的行写入租户 ID，erupt 和你的代码里都不需要任何租户条件。

## 哪些表按租户隔离

| 表 | 内容 | 唯一约束 |
| --- | --- | --- |
| `e_upms_user` | 用户；`is_admin = true` 为租户管理员 | `uk_upms_user_account (tenant_id, account)` |
| `e_upms_user_role` · `e_upms_user_org_head` · `e_upms_user_org_division` | 用户的角色、负责组织、分管组织 | 跟随用户 |
| `e_upms_role` | 角色 | `uk_upms_role_code (tenant_id, code)` |
| `e_upms_role_menu` | 角色可用菜单 | 跟随角色 |
| `e_upms_org` | 组织（树形） | `uk_upms_org_code (tenant_id, code)` |
| `e_upms_post` | 岗位 | `uk_upms_post_code (tenant_id, code)` |
| `e_upms_login_log` · `e_upms_operate_log` | 登录日志（同时是在线用户的数据来源）、操作日志 | — |
| `e_upms_sso` · `e_upms_sso_bind` | erupt-sso 认证源与账号绑定 | `uk_upms_sso_code (tenant_id, code)` |
| `e_record_comment` · `e_record_revision` | 记录评论、修订记录 | — |

平台自己也是一个普通租户，`tenant_id = '0'`，而不是能看到所有数据的"根"：平台会话不会意外读到租户的行，租户会话也看不到平台的行。

**同一个账号、同一个编码可以在不同租户下各存在一次**，例如每个租户都可以有自己的 `admin` 用户。用户 ID 在平台与所有租户之间全局唯一。

以下数据**不分租户**，全平台只有一份：

| 表 | 说明 |
| --- | --- |
| `e_upms_menu` | 菜单，租户可见范围由套餐决定 |
| `e_dict` · `e_dict_item` | 数据字典 |
| `e_open_api` | 开放 API |

## 会话如何绑定租户

1. 租户用户登录后，服务端会话中记录其租户 ID，token 本身是不透明的随机串（租户 token 以 `t_` 开头）。
2. 每个请求开始时，`UpmsTenantIdentifierResolver` 从会话中读出租户 ID，绑定到本次数据访问；安全拦截器把它写入 `MetaContext` 的 `MetaUser`。
3. 之后同一请求内所有 JPA 查询都限定在该租户。

没有引入 erupt-tenant 时，解析器直接返回平台 `'0'`，不查询会话存储，单租户项目没有额外开销。

## 菜单范围

`TenantMenuScope` 实现了 erupt-upms 的 `UpmsMenuScope` SPI：

- 租户会话（包括租户管理员）的菜单树，只包含其 **已启用套餐** 内的菜单
- 租户的角色编辑器只能从这些菜单中分配权限
- 平台用户不受影响

因此租户后台的「用户维护」「角色维护」就是 erupt-upms 的原生页面，只要套餐里勾选了这些菜单即可。

## 登录与会话接口

租户用户登录后是一个普通的 erupt-upms 会话，只是数据限定在其租户内。修改密码、菜单、用户信息都使用平台接口，只有与租户本身相关的接口在 `/erupt-api/tenant` 下：

| 接口 | 说明 |
| --- | --- |
| `POST /erupt-api/tenant/login` | 租户登录：`tenantCode`（企业 ID）+ `account` + `pwd`（+ 验证码）；不存在、已锁定或已过期的租户被拒绝 |
| `GET /erupt-api/tenant/info` | 当前会话的租户 ID、名称、订阅状态、到期时间、已启用套餐 |
| `GET /erupt-api/tenant/domain-info?host=` | 按访问域名返回租户的企业 ID、名称与品牌配置，见 [域名与租户定制](/zh/modules/pro/erupt-tenant/domain) |
| `/erupt-api/change-pwd` · `/menu` · `/userinfo` | 平台接口，租户会话直接使用 |

租户用户的登录写入该租户自己的登录日志，租户只能看到自己的登录日志、操作日志与在线用户。

**单点登录**：`EruptTenantLoginService` 实现 erupt-upms 的 `UpmsTenantLogin` SPI。租户登录页带上企业 ID 调用 `GET /erupt-api/sso/providers?tenant=<企业 ID>`，只列出该租户自己配置的认证源；单点登录完成后同样检查租户是否锁定或过期，再开启租户会话。

## 在代码中以某个租户执行

请求线程的会话已经绑定了当前用户的租户。登录前（还没有会话）、超管端操作某个租户、定时任务遍历租户等场景，需要以另一个租户的身份访问数据，注入 erupt-upms 的 `UpmsTenantSessions`：

```java
@Resource
private UpmsTenantSessions sessions;

// callAs / runAs：拿到该租户的 EntityManager 直接做 JPA 操作，结束时自动提交
EruptUser admin = sessions.callAs(tenantId, em ->
        eruptDao.lambdaQuery(em, EruptUser.class).eq(EruptUser::getAccount, "admin").one());

// callBound / runBound：把该租户的会话绑定到当前线程，期间所有基于 EruptDao 的 service
// （包括 @Transactional 方法）都在该租户内运行，适合没有请求的调度线程
sessions.runBound(tenantId, () -> flowService.processFlow(instance, nodeId));
```

- `tenantId` 传 `null` 表示平台
- `runBound` / `callBound` 只能在没有会话的线程上使用；请求线程已经绑定了自己的租户，试图切换会抛出 `IllegalStateException`
- 需要跨所有租户查询时，在 `EruptDao.lambdaQuery(...)` 上调用 `.allTenants()`，只对这一次查询解除限定；按 ID 加载与新增仍然受会话租户约束

## 自定义 SQL 注意事项

框架的租户过滤只作用于 JPA 查询（`EruptDao` 等）。直接用 JDBC 或原生 SQL 读写上述表时：

- 查询需要自己加上 `tenant_id = ?` 条件
- 平台数据写入 `tenant_id = '0'`（列有默认值 `'0'`，不写也可）

## 编写支持多租户的模块

如果你的模块要像 UPMS 一样随租户隔离，有两种选择：

| 方式 | 适合 | 平台行 |
| --- | --- | --- |
| 实体字段加 `@TenantId`（`@ColumnDefault("'0'")`） | 框架级、通用模块；隔离在所有 JPA 查询上生效 | `'0'` |
| 实体加 `@EruptTenant` / 继承 `TenantBaseModel` | 业务模型；隔离由 erupt 数据代理在页面增删改查上生效 | `NULL` |

业务开发通常选后者，见 [业务表多租户](/zh/modules/pro/erupt-tenant/development)。
