# 业务表多租户

UPMS 的用户目录已经由框架隔离（见 [UPMS 多租户](/zh/modules/pro/erupt-tenant/upms)），你的业务表只需一个注解或一次继承，即可按租户隔离。两种方式任选其一。

## 方式一：继承租户基类

```java
@Entity
@Table(
        name = "t_student",
        indexes = @Index(columnList = EruptTenant.TENANT_FIELD) // 为租户字段建索引，建议保留
)
@Erupt(name = "学生管理")
public class Student extends TenantMetaModel {

    @EruptField(
            views = @View(title = "姓名"),
            edit = @Edit(title = "姓名", notNull = true)
    )
    private String name;

    @EruptField(
            views = @View(title = "性别"),
            edit = @Edit(title = "性别", boolType = @BoolType(trueText = "男", falseText = "女"))
    )
    private Boolean sex;

}
```

| 基类 | 功能 |
| --- | --- |
| `TenantBaseModel` | 自增主键 + 租户字段 `tenantId` |
| `TenantMetaModel` | 在 `TenantBaseModel` 基础上自动维护创建人、创建时间、更新人、更新时间 |
| `TenantMetaModelCreateVo` | 同上，列表显示创建人与创建时间 |
| `TenantMetaModelUpdateVo` | 同上，列表显示更新人与更新时间 |

## 方式二：`@EruptTenant` 注解

已有自己的基类，或想换一个租户字段名时，直接在模型上加 `@EruptTenant`，用 `tenantField` 指定字段（默认 `tenantId`）：

```java
@Entity
@Table(name = "t_order")
@Erupt(name = "订单")
@EruptTenant(tenantField = "orgTenant")
public class Order extends BaseModel {

    @Column(length = 64)
    private String orgTenant;

    @EruptField(
            views = @View(title = "订单号"),
            edit = @Edit(title = "订单号", notNull = true)
    )
    private String orderNo;

}
```

`@EruptTenant` 带有 `@Inherited`，父类上有它，子类自动生效 —— `TenantBaseModel` 系列基类就是这样实现的。

## 数据隔离机制

`@EruptTenant` 通过 `@PreDataProxy(EruptTenantDataProxy.class)` 在每个数据操作环节完成隔离：

| 操作 | 行为 |
| --- | --- |
| 新增 | 把当前会话的租户 ID 写入租户字段，无需手动赋值 |
| 查询 | 追加条件 `租户字段 = 当前租户 ID`；平台会话（超管端）追加 `租户字段 is null` |
| 修改 / 删除 | 校验数据的租户字段与当前会话一致，不一致抛出 `Cross-tenant permissions` |
| 子表新增（`TAB_TABLE_ADD`） | 没有主键的子行视为新数据，写入当前租户 |

业务代码中不需要出现任何租户过滤逻辑。

:::info 平台数据为 NULL
业务表上平台会话写入的行租户字段为 `NULL`，而 UPMS 表上平台行为 `'0'`。两者互不影响：业务表隔离由 erupt 数据代理完成，UPMS 隔离由框架在数据访问层完成。
:::

:::warning 隔离范围
`@EruptTenant` 作用于 erupt 页面与接口的增删改查。你在自定义 Service 中用 `EruptDao`、JPA 或 SQL 直接访问业务表时，需要自己带上租户条件（通过 `EruptTenantContext` 获取租户 ID）。
:::

## 获取当前租户

```java
@Service
public class OrderService {

    @Resource
    private EruptTenantContext eruptTenantContext;

    public void test() {
        // 租户会话返回租户 ID，平台会话返回 null
        String tenantId = eruptTenantContext.getTenantId();
    }

}
```

租户 ID 来自服务端会话，安全拦截器校验 token 后写入 `MetaContext` 的 `MetaUser`；`TenantInterceptor` 再把它注册为请求上下文变量 `tenantId`。

## 在 SQL 中使用 `${tenantId}`

erupt-report、erupt-cube、erupt-bi 等支持动态 SQL 的地方都可以引用当前租户，同一张报表在不同租户中展示各自的数据：

```sql
select status, count(*) as cnt
from t_order
where tenant_id = '${tenantId}'
group by status
```

erupt-bi 也支持 `:tenantId` 参数写法。

## erupt-cloud 节点

erupt-cloud-server 转发请求时会把 `MetaUser`（含租户 ID）一并传给节点，因此节点只需引入 `erupt-tenant-core`，不需要 UPMS 或会话存储，`@EruptTenant` 与 `EruptTenantContext` 在节点上照常工作。
