# Database Design

Independent table design — existing erupt business tables are unaffected. Tables and menus are created and initialized automatically on startup, with no SQL scripts to run.

<img src="/tenant/er.png" width="900">

## Shared Tenant Tables (maintained on the super-admin side)

| Table | Description |
| --- | --- |
| e_tenant_config | Tenant config: enterprise ID (unique), tenant name, contact, status, expire date, admin account, domain, logo, tenant CSS / JS |
| e_tenant_config_package | Tenant–package association table |
| e_tenant_menu | Tenant menus: tree structure with unique menu codes; initialized automatically on startup with button-level menus generated per erupt class permissions |
| e_tenant_package | Tenant packages: define a set of menu capabilities granted to tenants per package |
| e_tenant_package_menu | Package–menu association table |

## In-tenant Tables (row-level isolation by tenant_id)

| Table | Description |
| --- | --- |
| t_e_upms_user | Tenant users: unique constraint on `tenant_id + account`; supports password encryption (MD5 + salt by default), IP whitelist, account expiry, and tenant-admin flag |
| t_e_upms_user_role | User–role association table |
| t_e_upms_role | Tenant roles: unique constraint on `tenant_id + code`; menu permissions can only be selected from menus in the tenant's active packages |
| t_e_upms_role_menu | Role–menu association table |
| t_e_upms_org | Tenant organizations: tree structure with unique constraint on `tenant_id + code` |

## Business Tables

Business tables annotated with `@EruptTenant` or extending the `TenantBaseModel` family automatically carry the tenant field (default `tenant_id`), with row-level isolation handled by the framework. Creating an index on the tenant field is recommended:

```java
@Table(
    name = "t_tenant_demo",
    indexes = @Index(columnList = EruptTenant.TENANT_FIELD)
)
```

See [Multi-tenant Development](/en/modules/pro/erupt-tenant/development#data-isolation-mechanism) for isolation behavior details.
