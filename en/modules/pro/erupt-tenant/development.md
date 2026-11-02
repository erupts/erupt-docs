# Multi-tenant Development

Enabling tenant data isolation for a business table takes one annotation or one inheritance — pick either approach below.

## Option 1: Annotation-based Multi-tenancy

Add the `@EruptTenant` annotation to a class annotated with `@Erupt`, and use the `tenantField` attribute to specify the tenant field name (defaults to `tenantId`). This suits scenarios where you want a tenant field named something other than tenantId. Within a tenant session, the tenant field value is filled and applied automatically.

```java
@Erupt
@Table(name = "t_tenant_test")
@EruptTenant(tenantField = "tenantId")
public class TenantDemo extends BaseModel {

    @Column(length = 50)
    private String tenantId;

    @EruptField(
        views = @View(title = "Name"),
        edit = @Edit(title = "Name", notNull = true)
    )
    private String name;

}
```

## Option 2: Inheritance-based Multi-tenancy

`@EruptTenant` carries the `@Inherited` meta-annotation — as long as the parent class has `@EruptTenant`, subclasses automatically inherit the tenant field and the annotation's handling logic:

```java
@Entity
@Table(
        name = "t_tenant_demo",
        indexes = @Index(columnList = EruptTenant.TENANT_FIELD) // creates an index on the tenant field; recommended
)
@Erupt(name = "Tenant Data Management")
public class StudentTenant extends TenantMetaModel {

    @EruptField(
            views = @View(title = "Name"),
            edit = @Edit(title = "Name", notNull = true)
    )
    private String name;

    @EruptField(
            views = @View(title = "Gender"),
            edit = @Edit(title = "Gender",
                    boolType = @BoolType(trueText = "Male", falseText = "Female"))
    )
    private Boolean sex;

}
```

`TenantMetaModel` above automatically maintains tenant and audit information. More inheritable parent classes:

| Class | Function |
| --- | --- |
| TenantBaseModel | Manages the tenant ID field and auto-increment primary key |
| TenantMetaModel | Extends TenantBaseModel; manages creation and update metadata |
| TenantMetaModelCreateVo | Extends TenantMetaModel; displays creator and creation time |
| TenantMetaModelUpdateVo | Extends TenantMetaModel; displays updater and update time |

## Data Isolation Mechanism

`@EruptTenant` internally uses `@PreDataProxy(EruptTenantDataProxy.class)` to enforce tenant isolation at every data operation:

| Operation | Isolation Behavior |
| --- | --- |
| Add | Automatically writes the current session's tenant ID into the tenant field — no manual assignment needed |
| Query | Automatically appends a `tenantField = current tenant ID` condition; in non-tenant sessions (super-admin side) the condition becomes `tenantField is null` |
| Update / Delete | Verifies that the record's tenant field matches the current tenant; on mismatch a `Cross-tenant permissions` exception is thrown, eliminating cross-tenant access |

In other words, your business code never contains any tenant-filtering logic — annotation equals isolation.

## Getting the TenantId

To access the current tenant in business code, inject `EruptTenantContext`:

```java
@Service
public class TextService {

    // Inject the tenant context
    @Resource
    private EruptTenantContext eruptTenantContext;

    public void test() {
        // Get the tenantId of the current request
        String tenantId = eruptTenantContext.getTenantId();
    }

}
```

:::info How it works
The tenant ID lives in the server-side login session; the token itself is an opaque random string (tenant tokens carry a `t_` prefix). After validating the session, the security interceptor writes the tenant ID into the `MetaUser` of `MetaContext`; `EruptTenantContext.getTenantId()` reads it from there and also registers it as the `MetaContext` variable `tenantId`, so erupt-report and erupt-cube can use the `${tenantId}` parameter directly. Non-tenant sessions (e.g. super-admin login) return `null`. erupt-cloud-server forwards `MetaUser` to nodes together with the request, so an erupt-cloud-node only needs erupt-tenant-core — no upms or session store — to isolate tenant data.
:::

Additionally, the `TenantInterceptor` registers `tenantId` as a context variable for `erupt-api` requests, so dynamic SQL and similar scenarios can reference it directly.

## Tenant Users and the Shared UPMS Tables <Badge type="tip" text="v2.4.0+" />

Tenant users, roles and organizations no longer have entities of their own: they share erupt-upms's `e_upms_user` / `e_upms_role` / `e_upms_org` tables with the platform. These entities carry a Hibernate `@TenantId` column, `'0'` for platform rows and the tenant's `tenantId` for tenant rows. Every JPA session is bound to one tenant, so queries are confined to that tenant and inserts are stamped with its ID — business code needs no filter at all.

What changed as a result:

| 2.3.x | 2.4.0 |
| --- | --- |
| `TenantUpmsUser` / `TenantUpmsUserSimple` / `TenantUpmsRole` / `TenantUpmsOrg` with their data proxies and handlers | Removed; use `EruptUser` / `EruptRole` / `EruptOrg` directly |
| `EruptTenantMenu` (a separate tenant menu table) | Removed; packages pick from the platform's `e_upms_menu` |
| A tenant-side "System Management" menu of its own | Packages grant the erupt-upms user / role / organization menus |
| A new tenant's administrator written to `t_e_upms_user` | An `EruptUser` (`isAdmin = true`) written in a session of that tenant |

**Menu scope**: `TenantMenuScope` implements the erupt-upms `UpmsMenuScope` SPI. It narrows the menu tree of every tenant session (administrators included) and the menus a tenant's role editor may hand out to the menus of the tenant's enabled packages; platform users are not narrowed.

**Running code as a given tenant**: a session is bound to exactly one tenant, so a login (no session yet), a platform operator resetting a tenant administrator's password, or a scheduler walking through every tenant has to act for another tenant. Inject erupt-upms's `UpmsTenantSessions`:

```java
@Resource
private UpmsTenantSessions sessions;

// callAs / runAs: hands you the tenant's EntityManager for direct JPA work and commits it
EruptUser admin = sessions.callAs(tenantId, em ->
        eruptDao.lambdaQuery(em, EruptUser.class).eq(EruptUser::getAccount, "admin").one());

// callBound / runBound: binds the tenant's session to the current thread, so every
// EruptDao-based service (including @Transactional methods) runs inside that tenant;
// meant for threads without a session, such as schedulers
sessions.runBound(tenantId, () -> flowService.processFlow(instance, nodeId));
```

A `null` `tenantId` means the platform. `runBound` can only switch tenants on a thread that holds no session; a request thread is already bound to its own tenant, and acting as another throws `IllegalStateException`. To scan across every tenant, call `.allTenants()` on an `EruptDao.lambdaQuery`.

**Login and session endpoints**: once logged in, a tenant user is an ordinary erupt-upms session whose data is confined to its tenant, so changing the password, the menu and the user info go through the platform endpoints; only what concerns the tenant itself stays under `/erupt-api/tenant`:

| Endpoint | Description |
| --- | --- |
| `GET /erupt-api/tenant/domain-info?host=` | Enterprise ID, name, logo, JS and CSS of the tenant bound to the host, see [Domain & Tenant Customization](/en/modules/pro/erupt-tenant/domain) |
| `POST /erupt-api/tenant/login` | Tenant login: enterprise ID + account + password (+ captcha); a locked or expired tenant is refused |
| `GET /erupt-api/tenant/info` | The session's tenant ID, name, subscription status, expire date and enabled packages |
| ~~`/tenant/change-pwd`, `/tenant/menu`, `/tenant/userinfo`~~ | Removed; a tenant session uses the platform's `/change-pwd`, `/menu` and `/userinfo` |
| ~~`/tenant/subscription`~~ | Renamed to `/tenant/info` |

A tenant user's sign-in is written to the tenant's own login log (`e_upms_login_log` carries the tenant column as well), and erupt-notice notifications work in tenant sessions. Single sign-on goes through `EruptTenantLoginService`, which implements the erupt-upms `UpmsTenantLogin` SPI: erupt-sso uses it to resolve an enterprise ID to a tenant, refuse a locked or expired tenant and open the tenant session.

:::warning Upgrading from 2.3.x
The unique constraints on users / roles / organizations are now `(tenant_id, account)` and `(tenant_id, code)`. The old single-column unique indexes are no longer dropped automatically at startup; drop them by hand with SQL, otherwise two tenants cannot share an account or code. See the [upgrade guide](/en/guide/upgrade).
:::

## Working with erupt-bi

:::info
Supported in 1.12.17 and above
:::

erupt-bi supports dynamic SQL — anywhere SQL appears, you can use `:tenantId` or `${tenantId}` to get the current tenant's ID, achieving per-tenant BI data isolation: the same report shows different analytics in different tenants.
