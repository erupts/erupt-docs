# 多租户开发

为业务表接入租户数据隔离只需一个注解或一次继承，下面两种方式任选其一即可。

## 方式一：注解实现多租户

在修饰 `@Erupt` 注解的类中增加 `@EruptTenant` 注解，使用 `tenantField` 属性指定租户字段名（默认为 `tenantId`），适合想用非 tenantId 名称作为租户字段的场景。租户会话下，租户字段值会自动填充与应用。

```java
@Erupt
@Table(name = "t_tenant_test")
@EruptTenant(tenantField = "tenantId")
public class TenantDemo extends BaseModel {

    @Column(length = 50)
    private String tenantId;

    @EruptField(
        views = @View(title = "姓名"),
        edit = @Edit(title = "姓名", notNull = true)
    )
    private String name;

}
```

## 方式二：继承实现多租户

`@EruptTenant` 注解带有 `@Inherited` 元注解 —— 只要父类中存在 `@EruptTenant`，子类会自动继承租户字段与注解处理逻辑：

```java
@Entity
@Table(
        name = "t_tenant_demo",
        indexes = @Index(columnList = EruptTenant.TENANT_FIELD) // indexes 表示为租户字段创建索引，建议保留
)
@Erupt(name = "租户数据管理")
public class StudentTenant extends TenantMetaModel {

    @EruptField(
            views = @View(title = "姓名"),
            edit = @Edit(title = "姓名", notNull = true)
    )
    private String name;

    @EruptField(
            views = @View(title = "性别"),
            edit = @Edit(title = "性别",
                    boolType = @BoolType(trueText = "男", falseText = "女"))
    )
    private Boolean sex;

}
```

上面继承的 `TenantMetaModel` 可自动维护租户信息与审计信息，更多可继承父类如下：

| 类名 | 功能 |
| --- | --- |
| TenantBaseModel | 自动管理租户 ID 字段与主键自增 ID |
| TenantMetaModel | 继承自 TenantBaseModel，自动管理创建与更新信息 |
| TenantMetaModelCreateVo | 继承自 TenantMetaModel，显示创建人与创建时间 |
| TenantMetaModelUpdateVo | 继承自 TenantMetaModel，显示更新人与更新时间 |

## 数据隔离机制

`@EruptTenant` 内部通过 `@PreDataProxy(EruptTenantDataProxy.class)` 在数据操作的各个环节自动完成租户隔离：

| 操作 | 隔离行为 |
| --- | --- |
| 新增 | 自动将当前会话的租户 ID 写入租户字段，无需手动赋值 |
| 查询 | 自动追加 `租户字段 = 当前租户 ID` 查询条件；非租户会话（超管端）下条件为 `租户字段 is null` |
| 修改 / 删除 | 校验数据的租户字段与当前租户一致，不一致直接抛出 `Cross-tenant permissions` 异常，杜绝越权操作 |

也就是说，业务代码中完全不需要出现任何租户过滤逻辑，注解即隔离。

## 获取 TenantId

业务代码中如需感知当前租户，注入 `EruptTenantContext` 即可：

```java
@Service
public class TextService {

    // 注入租户上下文对象
    @Resource
    private EruptTenantContext eruptTenantContext;

    public void test() {
        // 获取当前请求租户tenantId
        String tenantId = eruptTenantContext.getTenantId();
    }

}
```

:::info 实现原理
租户登录成功后签发的 token 是一个免签 JWT，租户 ID 存放在 JWT 的 `audience` 中。`EruptTenantContext.getTenantId()` 从请求头 `token` 中解析出租户 ID；非租户会话（如超管端登录）返回 `null`。
:::

同时 `TenantInterceptor` 拦截器会将 `tenantId` 注册为 `erupt-api` 请求的上下文变量，动态 SQL 等场景可直接引用。

## 结合 erupt-bi

:::info
1.12.17 及以上版本支持
:::

erupt-bi 支持动态 SQL 能力，任意出现 SQL 的地方都可以使用 `:tenantId` 或 `${tenantId}` 获取当前租户的 ID，达到租户内 BI 数据隔离的能力，同样的报表在不同的租户展示不同的分析结果。
