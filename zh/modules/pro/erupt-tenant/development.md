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
租户 ID 保存在服务端登录会话中，token 本身是不透明随机串（租户 token 以 `t_` 前缀区分）。安全拦截器在校验会话后把租户 ID 写入 `MetaContext` 的 `MetaUser`，`EruptTenantContext.getTenantId()` 从中读取，并同步写入 `MetaContext` 变量 `tenantId`，erupt-report、erupt-cube 中可直接使用 `${tenantId}` 参数；非租户会话（如超管端登录）返回 `null`。erupt-cloud-server 转发请求时会把 `MetaUser` 一并传给节点，因此 erupt-cloud-node 只需依赖 erupt-tenant-core，无需 upms 或会话存储即可完成租户隔离。
:::

同时 `TenantInterceptor` 拦截器会将 `tenantId` 注册为 `erupt-api` 请求的上下文变量，动态 SQL 等场景可直接引用。

## 租户用户与共享的 UPMS 表 <Badge type="tip" text="v2.4.0+" />

租户的用户、角色、组织不再有一套独立的实体，而是与平台共用 erupt-upms 的 `e_upms_user` / `e_upms_role` / `e_upms_org` 表：这些实体带有 Hibernate 的 `@TenantId` 列，平台行的值为 `'0'`，租户行的值为其 `tenantId`。每个 JPA 会话被绑定到一个租户，查询自动限定到该租户、插入自动盖上租户 ID，业务代码中不需要任何过滤条件。

由此带来的变化：

| 2.3.x | 2.4.0 |
| --- | --- |
| `TenantUpmsUser` / `TenantUpmsUserSimple` / `TenantUpmsRole` / `TenantUpmsOrg` 及其 DataProxy、handler | 已删除，直接使用 `EruptUser` / `EruptRole` / `EruptOrg` |
| `EruptTenantMenu`（独立的租户菜单表） | 已删除，套餐从平台的 `e_upms_menu` 中勾选 |
| 租户端自带「系统管理」菜单 | 由套餐授权 erupt-upms 的用户 / 角色 / 组织菜单 |
| 新建租户时写入 `t_e_upms_user` 的管理员 | 在该租户的会话中写入一条 `EruptUser`（`isAdmin = true`） |

**菜单范围**：`TenantMenuScope` 实现 erupt-upms 的 `UpmsMenuScope` SPI，把租户会话（含租户管理员）的菜单树以及角色编辑器可分配的菜单，收窄到该租户已启用套餐内的菜单；平台用户不受影响。

**在指定租户下执行代码**：会话与租户一一绑定，登录（尚无会话）、超管端重置租户管理员密码、定时任务遍历租户等场景需要以另一个租户的身份访问数据，注入 erupt-upms 的 `UpmsTenantSessions` 即可：

```java
@Resource
private UpmsTenantSessions sessions;

// callAs / runAs：拿到该租户的 EntityManager 做直接的 JPA 操作，自动提交
EruptUser admin = sessions.callAs(tenantId, em ->
        eruptDao.lambdaQuery(em, EruptUser.class).eq(EruptUser::getAccount, "admin").one());

// callBound / runBound：把该租户的会话绑定到当前线程，期间所有基于 EruptDao 的 service
// （含 @Transactional 方法）都在该租户内运行，适合没有会话的调度线程
sessions.runBound(tenantId, () -> flowService.processFlow(instance, nodeId));
```

`tenantId` 传 `null` 代表平台。`runBound` 只能在没有会话的线程上切换租户；请求线程已绑定了自己的租户，试图以其他租户执行会抛出 `IllegalStateException`。需要跨所有租户扫描数据时，可在 `EruptDao.lambdaQuery` 上调用 `.allTenants()` 解除限定。

**登录与会话接口**：租户用户登录后就是一个普通的 erupt-upms 会话，只是数据被限定在其租户内，因此修改密码、菜单、用户信息都走平台接口，只有与租户本身有关的接口留在 `/erupt-api/tenant` 下：

| 接口 | 说明 |
| --- | --- |
| `GET /erupt-api/tenant/domain-info?host=` | 按域名返回租户的企业 ID、名称、logo、JS、CSS，见 [域名与租户定制](/zh/modules/pro/erupt-tenant/domain) |
| `POST /erupt-api/tenant/login` | 租户登录：企业 ID + 账号 + 密码（+ 验证码），锁定或到期的租户被拒绝 |
| `GET /erupt-api/tenant/info` | 当前会话的租户 ID、名称、订阅状态、到期时间、已启用套餐 |
| ~~`/tenant/change-pwd`、`/tenant/menu`、`/tenant/userinfo`~~ | 已删除，租户会话直接使用平台的 `/change-pwd`、`/menu`、`/userinfo` |
| ~~`/tenant/subscription`~~ | 更名为 `/tenant/info` |

租户用户的登录会写入该租户自己的登录日志（`e_upms_login_log` 同样带租户列），erupt-notice 的通知在租户会话中同样可用。单点登录由 `EruptTenantLoginService` 实现 erupt-upms 的 `UpmsTenantLogin` SPI：erupt-sso 通过它把企业 ID 解析成租户、拒绝锁定或到期的租户、打开租户会话。

:::warning 升级自 2.3.x
用户 / 角色 / 组织的唯一约束已变为 `(tenant_id, account)` 与 `(tenant_id, code)`。旧的单列唯一索引不再在启动时自动删除，需要手工执行 SQL 删除，否则两个租户无法使用相同的账号或编码，见 [升级指南](/zh/guide/upgrade)。
:::

## 结合 erupt-bi

:::info
1.12.17 及以上版本支持
:::

erupt-bi 支持动态 SQL 能力，任意出现 SQL 的地方都可以使用 `:tenantId` 或 `${tenantId}` 获取当前租户的 ID，达到租户内 BI 数据隔离的能力，同样的报表在不同的租户展示不同的分析结果。
