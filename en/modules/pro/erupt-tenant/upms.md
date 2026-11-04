# Multi-tenant UPMS <Badge type="tip" text="v2.4.0+" />

erupt-upms is multi-tenant by itself: tenants' users, roles and organizations share the platform's tables, each carrying a tenant column `tenant_id`. Once a session is bound to a tenant, the framework adds `tenant_id = current tenant` to every query and stamps the tenant id on every insert — neither erupt nor your code contains a single tenant condition.

## Which tables are isolated

| Table | Content | Unique constraint |
| --- | --- | --- |
| `e_upms_user` | Users; `is_admin = true` marks the tenant administrator | `uk_upms_user_account (tenant_id, account)` |
| `e_upms_user_role` · `e_upms_user_org_head` · `e_upms_user_org_division` | A user's roles, headed and supervised organizations | Follow the user |
| `e_upms_role` | Roles | `uk_upms_role_code (tenant_id, code)` |
| `e_upms_role_menu` | Menus granted to a role | Follow the role |
| `e_upms_org` | Organizations (tree) | `uk_upms_org_code (tenant_id, code)` |
| `e_upms_post` | Posts | `uk_upms_post_code (tenant_id, code)` |
| `e_upms_login_log` · `e_upms_operate_log` | Login log (also the source of online users), operate log | — |
| `e_upms_sso` · `e_upms_sso_bind` | erupt-sso providers and account bindings | `uk_upms_sso_code (tenant_id, code)` |
| `e_record_comment` · `e_record_revision` | Record comments and revisions | — |

The platform is an ordinary tenant, `tenant_id = '0'`, not a root that sees everything: a platform session never meets a tenant's rows by accident, and a tenant session never sees the platform's.

**The same account or code can exist once in each tenant** — every tenant may have its own `admin` user. User ids are unique across the platform and every tenant.

These tables are **not** per tenant; the platform has one copy:

| Table | Description |
| --- | --- |
| `e_upms_menu` | Menus; what a tenant sees is decided by its packages |
| `e_dict` · `e_dict_item` | Data dictionaries |
| `e_open_api` | Open API |

## How a session is bound to a tenant

1. After a tenant user signs in, the server-side session records the tenant id; the token itself is an opaque random string (tenant tokens start with `t_`).
2. At the start of each request, `UpmsTenantIdentifierResolver` reads the tenant id from the session and binds it to the request's data access; the security interceptor writes it into `MetaContext`'s `MetaUser`.
3. Every JPA query in that request is then confined to the tenant.

Without erupt-tenant the resolver answers the platform `'0'` without touching the session store, so single-tenant projects pay nothing.

## Menu scope

`TenantMenuScope` implements erupt-upms's `UpmsMenuScope` SPI:

- A tenant session's menu tree (administrators included) contains only the menus of its **enabled packages**
- The tenant's role editor can only grant those menus
- Platform users are not narrowed

So the tenant's **Users** and **Roles** pages are erupt-upms's native pages — just include their menus in a package.

## Login and session endpoints

A signed-in tenant user is an ordinary erupt-upms session whose data is confined to its tenant. Changing the password, menus and user info use the platform endpoints; only tenant-specific endpoints live under `/erupt-api/tenant`:

| Endpoint | Description |
| --- | --- |
| `POST /erupt-api/tenant/login` | Tenant login: `tenantCode` (enterprise ID) + `account` + `pwd` (+ captcha); unknown, locked or expired tenants are refused |
| `GET /erupt-api/tenant/info` | The session's tenant id, name, subscription status, expire date and enabled packages |
| `GET /erupt-api/tenant/domain-info?host=` | Enterprise ID, name and branding of the tenant bound to a domain; see [Domain & Customization](/en/modules/pro/erupt-tenant/domain) |
| `/erupt-api/change-pwd` · `/menu` · `/userinfo` | Platform endpoints, used by tenant sessions directly |

A tenant user's sign-in is written to the tenant's own login log; a tenant only sees its own login log, operate log and online users.

**Single sign-on**: `EruptTenantLoginService` implements erupt-upms's `UpmsTenantLogin` SPI. The tenant login page calls `GET /erupt-api/sso/providers?tenant=<enterprise ID>` and lists only the tenant's own providers; after sign-on the tenant is again checked for being locked or expired before the tenant session opens.

## Running code as a tenant

A request thread's session is already bound to the user's tenant. Before login (no session yet), when the admin side acts on a tenant, or when a scheduler walks tenants, inject erupt-upms's `UpmsTenantSessions` to work as another tenant:

```java
@Resource
private UpmsTenantSessions sessions;

// callAs / runAs: an EntityManager of that tenant for direct JPA work, committed at the end
EruptUser admin = sessions.callAs(tenantId, em ->
        eruptDao.lambdaQuery(em, EruptUser.class).eq(EruptUser::getAccount, "admin").one());

// callBound / runBound: bind that tenant's session to the current thread; every EruptDao-based
// service (@Transactional methods included) runs inside the tenant — for scheduler threads
sessions.runBound(tenantId, () -> flowService.processFlow(instance, nodeId));
```

- `null` as `tenantId` means the platform
- `runBound` / `callBound` only work on a thread without a session; a request thread is already bound to its tenant, and switching throws `IllegalStateException`
- To query across all tenants, call `.allTenants()` on `EruptDao.lambdaQuery(...)`; it lifts the restriction for that query only — loading by id and inserting still follow the session's tenant

## Custom SQL

The framework's tenant filter only applies to JPA queries (`EruptDao` and the like). When reading or writing these tables with JDBC or native SQL:

- add the `tenant_id = ?` condition yourself
- write platform rows with `tenant_id = '0'` (the column defaults to `'0'`, so it may be omitted)

## Writing a multi-tenant module

To make your own module tenant-isolated like UPMS, pick one:

| Approach | Suits | Platform rows |
| --- | --- | --- |
| `@TenantId` on an entity field (`@ColumnDefault("'0'")`) | Framework-level, shared modules; isolation applies to every JPA query | `'0'` |
| `@EruptTenant` on the entity / extend `TenantBaseModel` | Business models; erupt's data proxy isolates page CRUD | `NULL` |

Business development usually takes the second; see [Multi-tenant Business Tables](/en/modules/pro/erupt-tenant/development).
