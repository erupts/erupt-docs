# Erupt SaaS Multi-Tenancy

Use Erupt annotation-based low-code development to implement multi-tenancy capabilities. Page functionality is reused across tenants while data is completely isolated. Ideal for SaaS product development scenarios.

:::tip Commercial Module
**Includes**: Full source code · All future version upgrades · Technical support · Priority Erupt-related support · Reasonable feature requests implemented for free · Continuous capability iteration
**License**: No License restrictions · Multi-project reuse allowed · No commercial restrictions
**Limitation**: Redistribution and secondary open-sourcing are prohibited

👉 **[View Pricing and Purchase →](https://www.erupt.xyz/?utm_source=docs&utm_medium=tipblock&utm_campaign=pro#!/pro)**
:::

Officially produced and maintained by the open-source Erupt framework team ([GitHub 3k+ ★](https://github.com/erupts/erupt) · [Gitee 5k+ ★](https://gitee.com/erupt/erupt)). Source code delivered for deep customization with your business.

Demo: [https://demo.erupt.xyz/#/passport/tenant](https://demo.erupt.xyz/#/passport/tenant)

For pre-sales inquiries, add the author on WeChat:

<img src="/contact/me.jpg" width="240">

---

<img src="/tenant/login1.png" width="900">

<img src="/tenant/login2.png" width="900">

## Why Not Use ShardingSphere / Mybatis-Plus tenantId Plugin / Build Your Own?

| Dimension | ShardingSphere | Mybatis-Plus tenantId | Custom | **Erupt Tenant** |
| --- | --- | --- | --- | --- |
| Data Isolation | ✅ (database layer strength) | ⚠️ SQL field injection only | Depends on implementation | **✅ Table-level isolation + business-level isolation** |
| Business Isolation | ❌ | ❌ | Must be built custom | **✅ Tenant context injected automatically** |
| Request Routing | ❌ | ❌ | Must be built custom | **✅ Effective with configuration** |
| Per-Tenant Configuration | ❌ | ❌ | Must be built custom | **✅ Independent menus / packages / themes** |
| Permission Isolation | ❌ | ❌ | Must be reimplemented | **✅ Reuses UPMS with multi-tenant awareness** |
| Learning Curve | Steep | Gentle | — | **Gentle (annotations = multi-tenancy)** |
| Time to Go Live | 2–4 weeks | 1–2 weeks (business layer still needed) | 1–3 months | **1–2 days** |

ShardingSphere addresses the database problem of "how to shard by tenant in the same schema". It **does not address the business layer**: how does your service know which tenant a request belongs to? How are menus isolated per tenant? How is tenant-specific configuration implemented? All of this must be written manually — this is the most commonly underestimated effort in custom multi-tenancy work. erupt-tenant bundles data isolation + request routing + business context + configuration isolation + permission isolation in one package.

## Features

### Tenant Management

Manage tenant information via the super-admin account. Supports one-click jump to a tenant application, changing the super-admin password, defining domain names, and tenant-specific JS/CSS:

<img src="/tenant/tenant-manage.png" width="900">

### Tenant Menus

Configure the feature menus for each tenant independently. The configuration format is consistent with the Menu Management in system settings:

<img src="/tenant/tenant-menu.png" width="900">

### Tenant Packages

Configure which menu capabilities a tenant has. Menu data is completely isolated between different tenants:

<img src="/tenant/tenant-package.png" width="900">

### Tenant Login

<img src="/tenant/tenant-login.png" width="900">

### User / Role / Organization Management

<img src="/tenant/user-manage.png" width="900">

<img src="/tenant/role-manage.png" width="900">

<img src="/tenant/org-manage.png" width="900">

## Data Isolation Principle

Uses **table-level isolation** — all tenant data is stored in the same table, filtered at the row level by tenant identifier, rather than schema or separate database isolation.

Advantages:
- Centralized data storage; queries, backups, and operations require no cross-database work
- Performance optimizations cover all tenant data at once
- No compatibility or upgrade issues with multiple schemas
- No need to allocate separate database resources per tenant; theoretically supports unlimited tenants

## Multi-Tenant Development

Add the corresponding annotation to an Erupt class to achieve this: different tenants share the same functionality (which can also be dynamically rendered based on tenant information), with completely isolated data — one codebase serving multiple enterprise customers.

## Use Cases

- SaaS startups (one codebase serving N enterprise customers)
- White-label delivery (same system with per-customer branding, domain, and menus)
- Group-wide isolation across multiple departments / subsidiaries
- Multi-region / multi-brand operations

## FAQ

**Q1 · What is the difference from the open-source Erupt?**
Open-source Erupt is single-tenant architecture. erupt-tenant is a commercial module that introduces complete multi-tenancy infrastructure (data isolation + request routing + business context + configuration isolation + multi-tenant-aware permissions) — this is not included in the open-source version and will not be open-sourced in the future.

**Q2 · How is it delivered?**
After payment, provide your GitHub username. The author will add you as a collaborator to the private repository `erupts/erupt-tenant`. You can clone the source code directly, compile locally, reference as needed, and will receive an integration document.

**Q3 · Do I need to pay again for future version upgrades?**
No. One-time purchase = you have access to the current and all future versions. The private repository's master branch is continuously updated; just `git pull`.

**Q4 · What about project count / commercial use / reselling?**
- **Multi-project reuse allowed**: Deploy in as many internal or outsourced projects as you like
- **No commercial restrictions**: Can be used in commercial products (including selling your finished product, but you may not sell the erupt-tenant source code itself)
- **Reselling**: Redistribution and secondary open-sourcing are prohibited; company name or entity changes can apply for license migration

**Q5 · Trial / Refunds?**
The [online demo](https://demo.erupt.xyz/#/passport/tenant) has all features available. We recommend fully exploring it first. Once repository access is granted, delivery is considered complete and refunds are no longer supported.

---

For questions not listed above, scan the QR code above to contact the author on WeChat.
