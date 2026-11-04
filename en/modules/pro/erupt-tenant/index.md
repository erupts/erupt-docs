# Erupt SaaS Multi-tenant

One codebase serving many enterprise customers: every tenant has its own users, roles, organizations, menus and data, fully isolated from the others, while the platform manages tenants, packages and subscriptions from the admin side.

erupt-tenant does not wrap a separate "tenant system" around your app — it makes **erupt-upms itself multi-tenant**: users, roles, organizations, posts and logs share the platform's tables and are isolated per tenant by the framework through a `tenant_id` column. The tenant backend uses erupt's native user, role and organization pages, and the platform's existing capabilities (single sign-on, notices, approval flows, reports, metrics) work inside tenants as-is.

:::tip Commercial Module
**Includes**: Full source code · All future version upgrades · Technical support · Priority Erupt-related support · Reasonable feature requests implemented for free · Continuous capability iteration
**License**: No License restrictions · Reusable across projects · No commercial restrictions
**Limitation**: Redistribution and secondary open-sourcing are prohibited
:::

<a href="https://www.erupt.xyz/?utm_source=docs&utm_medium=banner&utm_campaign=pro#!/pro" target="_blank">
  <img src="/pro/cta-en.svg" width="900" alt="View Erupt Pro pricing and purchase process">
</a>

Officially produced and maintained by the open-source Erupt framework team ([GitHub 3k+ ★](https://github.com/erupts/erupt) · [Gitee 5k+ ★](https://gitee.com/erupt/erupt)). Delivered as source code, ready for deep customization.

Demo: [https://demo.erupt.xyz/#/passport/tenant](https://demo.erupt.xyz/#/passport/tenant)

:::info Documentation
[Quick Start](/en/modules/pro/erupt-tenant/quick-start) · [Multi-tenant UPMS](/en/modules/pro/erupt-tenant/upms) · [Multi-tenant Business Tables](/en/modules/pro/erupt-tenant/development) · [Packages & Subscription](/en/modules/pro/erupt-tenant/subscription) · [Domain & Customization](/en/modules/pro/erupt-tenant/domain) · [Database Design](/en/modules/pro/erupt-tenant/database)
:::

---

<img src="/tenant/login1.png" width="900">

<img src="/tenant/login2.png" width="900">

## Architecture

| Layer | Owner | How it is isolated |
| --- | --- | --- |
| **Tenants & packages** | Platform admin | `e_tenant_config` / `e_tenant_package` are maintained on the admin side only, with no tenant column |
| **User directory (UPMS)** | erupt-upms | Users, roles, organizations, posts, login / operate logs and online users share the platform's tables; the framework restricts every query and stamps every insert (platform rows are `'0'`) |
| **Menus** | Platform | One menu table (`e_upms_menu`); packages pick menus, and a tenant's menu tree and assignable menus are narrowed to its packages |
| **Business data** | Your `@Erupt` models | Add `@EruptTenant` or extend `TenantBaseModel`: inserts are stamped, queries filtered, cross-tenant writes refused |

When a request arrives, the security interceptor reads the tenant id from the session and data access is bound to that tenant — from then on UPMS queries only see that tenant's rows, business tables get their condition from `@EruptTenant`, and `${tenantId}` is available in report and metric SQL. See [Multi-tenant UPMS](/en/modules/pro/erupt-tenant/upms) and [Database Design](/en/modules/pro/erupt-tenant/database).

## Features

### Tenant management

The platform admin maintains tenants in **Tenant Config**: enterprise ID, name, contact, enabled / locked, expire date, admin account, packages, domain and branding. Row actions **reset the admin password** and **enter the tenant backend** (opening the tenant system as its administrator).

<img src="/tenant/tenant-manage.png" width="900">

Creating a tenant generates its tenant id and creates an administrator user (`is_admin = true`) inside that tenant; everything after that stays within the tenant.

### Packages

A package picks a set of menus from the platform's **Menu Management** and is assigned to tenants. All sessions of a tenant (its administrators included) only see the menus of its enabled packages, and the tenant's role editor can only grant those menus. Packages can also carry trial days. See [Packages & Subscription](/en/modules/pro/erupt-tenant/subscription).

<img src="/tenant/tenant-package.png" width="900">

### Tenant backend: native UPMS

Put erupt-upms menus such as **Users**, **Roles**, **Organizations**, **Posts**, **Login Log** and **Online Users** into a package, and the tenant administrator manages their own team — the pages are exactly the platform's, the data belongs only to the tenant. The same account can exist once in each tenant.

<img src="/tenant/user-manage.png" width="900">

<img src="/tenant/role-manage.png" width="900">

<img src="/tenant/org-manage.png" width="900">

### Tenant login and single sign-on

Tenant users sign in on the tenant login page (`/#/passport/tenant`) with enterprise ID, account and password; a tenant with its own domain skips the enterprise ID. With [erupt-sso](/en/modules/erupt-sso), every tenant configures its own SSO providers, the tenant login page lists only that tenant's providers, and signing on opens a tenant session.

<img src="/tenant/tenant-login.png" width="900">

### Subscription

A tenant's subscription is described by a single expire date: new tenants get one from their packages' trial days, an optional grace period follows, and sessions of an expired or locked tenant end on their next request. Renewal is done by your own billing code calling `TenantSubscriptionService#extend`. See [Packages & Subscription](/en/modules/pro/erupt-tenant/subscription).

### Domain and branding

Each tenant can bind its own domain with its own logo, CSS and JS, so one system wears a different brand per tenant — ideal for white-label delivery. See [Domain & Customization](/en/modules/pro/erupt-tenant/domain).

### Platform capabilities inside tenants

| Capability | Inside a tenant |
| --- | --- |
| erupt-sso single sign-on | Providers are isolated per tenant and configured by the tenant |
| erupt-flow approvals | Approvers, roles and organization heads resolve within the tenant |
| erupt-notice notices | Sent and received in tenant sessions |
| erupt-report / erupt-cube | `${tenantId}` in SQL — the same report shows each tenant its own data |
| Record comments, revisions | Isolated per tenant |
| erupt-share | A share link records its issuer's tenant; the admin view only lists the tenant's own links |
| erupt-cloud nodes | The tenant identity travels with the request; nodes only need `erupt-tenant-core` |

## Why not ShardingSphere / the MyBatis-Plus tenant plugin / a home-grown solution?

| Dimension | ShardingSphere | MyBatis-Plus tenant plugin | Home-grown | **Erupt Tenant** |
| --- | --- | --- | --- | --- |
| Data isolation | ✅ (database-layer strength) | ⚠️ SQL condition only | Depends | **✅ UPMS isolated by the framework + business tables by annotation** |
| Users / roles / orgs | ❌ | ❌ | Rebuild it all | **✅ Native UPMS, multi-tenant** |
| Menus and packages | ❌ | ❌ | Build it yourself | **✅ Packages pick platform menus** |
| Login / SSO / subscription | ❌ | ❌ | Build it yourself | **✅ Built in** |
| Learning curve | Steep | Flat | — | **Flat (one annotation per business table)** |
| Time to launch | 2–4 weeks | 1–2 weeks (business layer still missing) | 1–3 months | **1–2 days** |

ShardingSphere answers "how do I shard one schema by tenant" — a database question. It **does not address the business layer**: which tenant does this request belong to? How are users, roles and menus isolated per tenant? How does a tenant sign in, and when does it expire? All of that is left to you, and it is the work most often underestimated in home-grown multi-tenancy.

## Isolation model

**Shared tables with a tenant column**: all tenants' data lives in the same tables, filtered by the tenant column, rather than one schema or database per tenant.

- Centralized data: no cross-database queries, backups or operations
- One index or tuning effort covers every tenant
- No schema-sync or upgrade issues across tenant schemas
- No database resources per tenant, so the number of tenants is unbounded

## Use cases

- SaaS startups (one codebase for N enterprise customers)
- White-label delivery (one system, rebranded per customer: brand, domain, menus)
- Isolation across departments or subsidiaries of a group
- Multi-region / multi-brand operations

## FAQ

**Q1 · How does this differ from open-source erupt?**
Open-source erupt's UPMS already carries the tenant column and tenant isolation, but without erupt-tenant all data belongs to the platform (`'0'`), i.e. single-tenant. erupt-tenant adds tenants, packages, subscriptions, tenant login, domain customization and the business-table isolation annotation — a commercial module that will not be open-sourced.

**Q2 · How is it delivered?**
After payment, provide your GitHub username and the author adds you as a collaborator on the private repository `erupts/erupt-tenant`. You can clone, build and reference it directly, and you receive an integration guide.

**Q3 · Are future upgrades charged?**
No. One purchase gives you the current and all future versions. The private repository's master is continuously updated — just git pull.

**Q4 · Project count / commercial use / transfer?**
- **Reusable across projects**: internal company projects and outsourced projects, deploy as many as you like
- **No commercial restrictions**: usable in commercial products (including reselling your finished product, but not the erupt-tenant source itself)
- **Transfer**: no secondary open-sourcing or source redistribution; a company rename or change of entity can apply for a license transfer

**Q5 · Trial / refund?**
The [online demo](https://demo.erupt.xyz/#/passport/tenant) has every feature enabled — please evaluate it thoroughly first. Delivery is complete once repository access is granted; no refunds after that.

---

For anything not listed here, visit the [pricing and purchase page](https://www.erupt.xyz/#!/pro) to contact the author.
