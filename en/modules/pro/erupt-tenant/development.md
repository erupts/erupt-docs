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
The token issued on tenant login is an unsigned JWT with the tenant ID stored in its `audience`. `EruptTenantContext.getTenantId()` parses the tenant ID from the `token` request header; non-tenant sessions (e.g. super-admin login) return `null`.
:::

Additionally, the `TenantInterceptor` registers `tenantId` as a context variable for `erupt-api` requests, so dynamic SQL and similar scenarios can reference it directly.

## Working with erupt-bi

:::info
Supported in 1.12.17 and above
:::

erupt-bi supports dynamic SQL — anywhere SQL appears, you can use `:tenantId` or `${tenantId}` to get the current tenant's ID, achieving per-tenant BI data isolation: the same report shows different analytics in different tenants.
