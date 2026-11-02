# Database Design

The module only owns the tenant and package tables; tenant users, roles and organizations reuse the erupt-upms tables. Tables and menus are created and initialized automatically on startup, with no SQL scripts to run.

<img src="/tenant/er.png" width="900">

## Shared Tenant Tables (maintained on the super-admin side)

| Table | Description |
| --- | --- |
| e_tenant_config | Tenant config: tenant ID, enterprise ID (unique), tenant name, contact, status (active / locked), expire date (empty means no end), admin account, domain, logo, tenant CSS / JS |
| e_tenant_config_package | Tenant–package association table |
| e_tenant_package | Tenant packages: code (unique), name, sort, status, trial days `trial_days` (a new tenant without an expire date takes the largest value among its enabled packages) |
| e_tenant_package_menu | Package–menu association table; `menu_id` points to the platform menu table `e_upms_menu` |

:::info
Since 2.4.0 the tables `e_tenant_menu` (tenant menus) and `t_e_upms_user`, `t_e_upms_user_role`, `t_e_upms_role`, `t_e_upms_role_menu`, `t_e_upms_org` (tenant-side users / roles / organizations) are no longer created.
:::

## Tenant Users / Roles / Organizations (reusing the erupt-upms tables) <Badge type="tip" text="v2.4.0+" />

The erupt-upms directory tables carry a Hibernate `@TenantId` column `tenant_id` (`'0'` for platform rows, the tenant ID for tenant rows), which Hibernate restricts on every query and stamps on every insert:

| Table | Description |
| --- | --- |
| e_upms_user | Users: unique constraint `uk_upms_user_account (tenant_id, account)`, so the same account may exist once per tenant; a tenant administrator is a user with `is_admin = true` |
| e_upms_user_role / e_upms_user_org_head / e_upms_user_org_division | The user's roles, responsible and supervising organizations; they follow the user's tenant |
| e_upms_role | Roles: unique constraint `uk_upms_role_code (tenant_id, code)`; the menus a tenant role may hold are narrowed to its packages by `TenantMenuScope` |
| e_upms_role_menu | Role–menu association table; menus come from the platform `e_upms_menu` |
| e_upms_org | Organizations: tree structure, unique constraint `uk_upms_org_code (tenant_id, code)` |
| e_upms_post | Posts: unique constraint `uk_upms_post_code (tenant_id, code)` |
| e_upms_login_log / e_upms_operate_log | Login and operation logs carry `tenant_id` as well, so a tenant only sees its own logs and online users |

:::warning Upgrading from 2.3.x
The single-column unique indexes older versions created on these tables (`account`, `code`) prevent two tenants from sharing an account or code. 2.4.0 no longer drops them at startup; drop them by hand with the SQL in the [upgrade guide](/en/guide/upgrade).
:::

## Business Tables

Business tables annotated with `@EruptTenant` or extending the `TenantBaseModel` family automatically carry the tenant field (default `tenant_id`), with row-level isolation handled by the framework. Creating an index on the tenant field is recommended:

```java
@Table(
    name = "t_tenant_demo",
    indexes = @Index(columnList = EruptTenant.TENANT_FIELD)
)
```

See [Multi-tenant Development](/en/modules/pro/erupt-tenant/development#data-isolation-mechanism) for isolation behavior details.
