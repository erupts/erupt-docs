# Quick Start

This guide covers integrating the erupt-tenant multi-tenancy module into an erupt project. For a feature overview, see [Erupt SaaS Multi-tenant](/en/modules/pro/erupt-tenant/).

:::tip
erupt-tenant is a commercial module. After purchase, contact the author to get access to the source repository.
:::

## Source Code

- Frontend: [https://gitee.com/erupt/erupt-web](https://gitee.com/erupt/erupt-web)
- Backend: [https://github.com/erupt-io/erupt-tenant](https://github.com/erupt-io/erupt-tenant)

## Module Structure

erupt-tenant consists of two Maven modules:

| Module | Description | Depends On |
| --- | --- | --- |
| **erupt-tenant-core** | Multi-tenancy core: the `@EruptTenant` annotation, data-isolation DataProxy, tenant context `EruptTenantContext`, inheritable tenant base classes | erupt-jpa |
| **erupt-tenant** | Full tenant management: tenant config / tenant packages, tenant login and the subscription lifecycle; tenant-side users / roles / organizations reuse erupt-upms directly | erupt-upms + erupt-tenant-core |

## 1. Build the Source and Publish to Local Repository

:::info
Supported in 1.12.16 and above
:::

Clone the erupt-tenant source from GitHub: [https://github.com/erupt-io/erupt-tenant](https://github.com/erupt-io/erupt-tenant)

Switch to the tag matching your version: [https://github.com/erupt-io/erupt-tenant/tags](https://github.com/erupt-io/erupt-tenant/tags)

<img src="/tenant/release-tag.png" width="750">

Run the following maven command in the project root to publish to your local repository or private registry:

```bash
mvn -D skipTests=true install
```

## 2. Add the POM Dependency

:::warning
You must complete the previous step (publishing to your local repository) before the dependencies below become available.
:::

**erupt-tenant**: the multi-tenant permission control module. Add this dependency alongside erupt-admin to enable multi-tenancy directly:

```xml
<dependencies>
  <dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-tenant</artifactId>
    <version>${erupt.version}</version>
  </dependency>
</dependencies>
```

**erupt-tenant-core**: the multi-tenant core module providing base multi-tenancy features. For erupt-cloud-node scenarios, this dependency alone is sufficient.

## 3. Start the Application

On startup, the module initializes all menus automatically — no SQL scripts required:

- **Super-admin side**: registers a "Tenant Management" root menu containing **Tenant Config** and **Tenant Package**
- **Tenant side**: there is no separate menu table. The menus a tenant sees are the platform's own Menu Management entries, picked into a package and granted to the tenant; to let a tenant maintain its own users / roles / organizations, put the erupt-upms **User**, **Role** and **Organization** menus into the package

After creating a tenant in Tenant Config (enterprise ID, tenant name, admin account/password, assigned packages; leave the expire date empty to start with the packages' trial days), tenants can sign in via the tenant login page:

```
http://your-host/#/passport/tenant
```

Online demo: [https://demo.erupt.xyz/#/passport/tenant](https://demo.erupt.xyz/#/passport/tenant)

Next, read [Multi-tenant Development](/en/modules/pro/erupt-tenant/development) to enable tenant data isolation for your business tables.
