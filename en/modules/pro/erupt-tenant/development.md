# Multi-tenant Business Tables

The UPMS user directory is already isolated by the framework (see [Multi-tenant UPMS](/en/modules/pro/erupt-tenant/upms)). Your business tables need one annotation or one base class to be isolated per tenant — pick either.

## Option 1: extend a tenant base class

```java
@Entity
@Table(
        name = "t_student",
        indexes = @Index(columnList = EruptTenant.TENANT_FIELD) // index the tenant field, recommended
)
@Erupt(name = "Students")
public class Student extends TenantMetaModel {

    @EruptField(
            views = @View(title = "Name"),
            edit = @Edit(title = "Name", notNull = true)
    )
    private String name;

    @EruptField(
            views = @View(title = "Gender"),
            edit = @Edit(title = "Gender", boolType = @BoolType(trueText = "Male", falseText = "Female"))
    )
    private Boolean sex;

}
```

| Base class | Provides |
| --- | --- |
| `TenantBaseModel` | Auto-increment id + tenant field `tenantId` |
| `TenantMetaModel` | `TenantBaseModel` plus creator, create time, updater and update time |
| `TenantMetaModelCreateVo` | Same, showing creator and create time in the list |
| `TenantMetaModelUpdateVo` | Same, showing updater and update time in the list |

## Option 2: the `@EruptTenant` annotation

If you already have your own base class, or want a different tenant field name, add `@EruptTenant` to the model and name the field with `tenantField` (default `tenantId`):

```java
@Entity
@Table(name = "t_order")
@Erupt(name = "Orders")
@EruptTenant(tenantField = "orgTenant")
public class Order extends BaseModel {

    @Column(length = 64)
    private String orgTenant;

    @EruptField(
            views = @View(title = "Order No."),
            edit = @Edit(title = "Order No.", notNull = true)
    )
    private String orderNo;

}
```

`@EruptTenant` is `@Inherited`: a subclass of an annotated class is isolated too — that is how the `TenantBaseModel` family works.

## Data Isolation Mechanism

`@EruptTenant` isolates every data operation through `@PreDataProxy(EruptTenantDataProxy.class)`:

| Operation | Behavior |
| --- | --- |
| Insert | Writes the session's tenant id into the tenant field, no manual assignment |
| Query | Adds `tenant field = current tenant id`; a platform (admin) session adds `tenant field is null` |
| Update / delete | Checks the row's tenant field against the session; a mismatch throws `Cross-tenant permissions` |
| Sub-table rows (`TAB_TABLE_ADD`) | A row without a primary key is new and gets the current tenant |

Your business code never contains tenant filtering.

:::info Platform rows are NULL
On business tables, rows written by a platform session carry a `NULL` tenant field, while UPMS platform rows are `'0'`. They do not interfere: business tables are isolated by erupt's data proxy, UPMS by the framework at the data-access layer.
:::

:::warning Scope of isolation
`@EruptTenant` covers CRUD through erupt's pages and APIs. When your own services reach business tables through `EruptDao`, JPA or SQL, add the tenant condition yourself (get the tenant id from `EruptTenantContext`).
:::

## Getting the current tenant

```java
@Service
public class OrderService {

    @Resource
    private EruptTenantContext eruptTenantContext;

    public void test() {
        // the tenant id in a tenant session, null in a platform session
        String tenantId = eruptTenantContext.getTenantId();
    }

}
```

The tenant id comes from the server-side session: the security interceptor writes it into `MetaContext`'s `MetaUser` after verifying the token, and `TenantInterceptor` registers it as the request variable `tenantId`.

## `${tenantId}` in SQL

Wherever erupt-report, erupt-cube or erupt-bi accept dynamic SQL you can reference the current tenant, so the same report shows each tenant its own data:

```sql
select status, count(*) as cnt
from t_order
where tenant_id = '${tenantId}'
group by status
```

erupt-bi also accepts the `:tenantId` parameter form.

## erupt-cloud nodes

erupt-cloud-server forwards `MetaUser` (tenant id included) with every request, so a node only needs `erupt-tenant-core` — no UPMS, no session store — and `@EruptTenant` and `EruptTenantContext` work on the node as usual.
