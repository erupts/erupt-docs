# Database Design

erupt-tenant itself owns just four tables for tenants and packages; tenants' users, roles and organizations live in erupt-upms's tables, told apart by the `tenant_id` column. Tables are created on startup — no SQL scripts.

<img src="/tenant/er.svg" width="900" alt="erupt-tenant database design">

## Tenants and packages (admin-managed)

These four tables are maintained on the admin side only and have no tenant column.

| Table | Main columns |
| --- | --- |
| `e_tenant_config` | `tenant_id` tenant key (generated on creation, `ex` + 14 random characters) · `code` enterprise ID (unique) · `name` · `contact` · `status` enabled / locked · `expire_date` (empty = never) · `account` admin account · `domain` · `logo` · `css` · `js` · `remark` · audit columns |
| `e_tenant_config_package` | Tenant–package link: `tenant_id` → `e_tenant_config.id`, `package_id` → `e_tenant_package.id` |
| `e_tenant_package` | `code` (unique) · `name` · `sort` · `status` · `trial_days` · `remark` |
| `e_tenant_package_menu` | Package–menu link: `role_id` → `e_tenant_package.id`, `menu_id` → `e_upms_menu.id` |

`e_tenant_config.tenant_id` is the value written into the `tenant_id` column of the other tables.

## User directory (erupt-upms, per tenant)

Carry the tenant column `tenant_id`: `'0'` for the platform, the tenant key for a tenant; queries are restricted and inserts stamped automatically.

| Table | Unique constraint |
| --- | --- |
| `e_upms_user` | `(tenant_id, account)` |
| `e_upms_role` | `(tenant_id, code)` |
| `e_upms_org` | `(tenant_id, code)` |
| `e_upms_post` | `(tenant_id, code)` |
| `e_upms_user_role` · `e_upms_user_org_head` · `e_upms_user_org_division` · `e_upms_role_menu` | Link tables, following their user / role |
| `e_upms_login_log` · `e_upms_operate_log` | Login log, operate log |
| `e_upms_sso` · `e_upms_sso_bind` | SSO providers (unique `(tenant_id, code)`) and account bindings |

See [Multi-tenant UPMS](/en/modules/pro/erupt-tenant/upms) for details.

## Platform-wide

| Table | Description |
| --- | --- |
| `e_upms_menu` | One menu table, referenced by packages and roles |
| `e_dict` · `e_dict_item` · `e_open_api` | Data dictionaries, open API |

## Business tables

Business tables extending the `TenantBaseModel` family or annotated with `@EruptTenant` carry a tenant field (default `tenant_id`): the tenant key for tenant rows, `NULL` for platform rows, isolated by erupt's data proxy. Index the tenant field:

```java
@Table(name = "t_student", indexes = @Index(columnList = EruptTenant.TENANT_FIELD))
```

See [Multi-tenant Business Tables](/en/modules/pro/erupt-tenant/development#data-isolation-mechanism) for the behavior.

## Upgrading from 2.3.x

- `e_tenant_menu` and `t_e_upms_user` / `t_e_upms_user_role` / `t_e_upms_role` / `t_e_upms_role_menu` / `t_e_upms_org` are no longer used; migrate tenant user data into the `e_upms_*` tables
- Drop the old single-column unique indexes on `account` / `code` by hand, otherwise tenants cannot share accounts or codes

Steps and SQL are in the [Upgrade Guide](/en/guide/upgrade).
