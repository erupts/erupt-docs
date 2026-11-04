# Quick Start

This page shows how to add erupt-tenant to an erupt project. For an overview see [Erupt SaaS Multi-tenant](/en/modules/pro/erupt-tenant/).

:::tip
erupt-tenant is a commercial module. After purchase, contact the author for access to the source repository.
:::

## Modules

| Module | Description | Depends on |
| --- | --- | --- |
| **erupt-tenant-core** | Business-table isolation: the `@EruptTenant` annotation, the isolating DataProxy, the tenant context `EruptTenantContext`, and the `TenantBaseModel` base classes | erupt-jpa |
| **erupt-tenant** | The tenant platform: tenant config, packages, subscriptions, tenant login and SSO, domain customization, menu scope; tenant users / roles / organizations come straight from erupt-upms | erupt-upms, erupt-tenant-core |

An erupt-cloud-node only needs `erupt-tenant-core`: the cloud server forwards the tenant identity with each request, so the node needs neither UPMS nor a session store.

## 1. Build the source and install it locally

Clone [https://github.com/erupt-io/erupt-tenant](https://github.com/erupt-io/erupt-tenant) and check out the tag matching your erupt version:

<img src="/tenant/release-tag.png" width="750">

From the project root:

```bash
mvn -D skipTests=true install
```

## 2. Add the dependency

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-tenant</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

## 3. Start the application

Tables and menus are created on startup — no SQL scripts:

- The admin side gets a **Tenant Management** menu with **Tenant Config** and **Tenant Package**
- The UPMS tables already carry a `tenant_id` column (platform rows are `'0'`); nothing to configure

:::warning Upgrading from 2.3.x
The unique constraints on users, roles, organizations and posts are now `(tenant_id, account)` / `(tenant_id, code)`. Drop the old single-column unique indexes by hand and migrate the old `t_e_upms_*` tenant user tables; see the [Upgrade Guide](/en/guide/upgrade).
:::

## 4. Set up packages

Create a package in **Tenant Package** and pick the platform menus tenants may use. Tenants have no menu table of their own, so to let a tenant administrator manage their team, include erupt-upms menus in the package:

- Users, Roles, Organizations, Posts
- Login Log, Operate Log, Online Users
- Your business menus (e.g. models using `@EruptTenant`)

Optionally set **Trial Days**: a new tenant without an expire date gets one computed from it.

## 5. Create a tenant

In **Tenant Config**, create a tenant: enterprise ID, name, admin account (default `admin`) and password, and its packages. Leave the expire date empty to derive it from the packages' trial days; if no package has trial days, the tenant never expires.

Saving generates the tenant id and creates the administrator user inside the tenant.

## 6. Sign in to the tenant system

```
http://your-host/#/passport/tenant
```

Enter the enterprise ID, admin account and password — or use the **Enter Tenant Backend** row action in Tenant Config to open it as the administrator directly.

Online demo: [https://demo.erupt.xyz/#/passport/tenant](https://demo.erupt.xyz/#/passport/tenant)

## Next steps

1. [Multi-tenant Business Tables](/en/modules/pro/erupt-tenant/development) — isolate a business table with one annotation
2. [Multi-tenant UPMS](/en/modules/pro/erupt-tenant/upms) — how the user directory is isolated, and how to switch tenants in code
3. [Packages & Subscription](/en/modules/pro/erupt-tenant/subscription) — trials, expiry and renewal
