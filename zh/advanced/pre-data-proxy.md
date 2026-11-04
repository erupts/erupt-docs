# 通用继承（@PreDataProxy）

`@PreDataProxy` 用于把一段 `DataProxy` 逻辑绑定到**类型**上：任何继承了被标注的父类（或实现了被标注的接口）的 Erupt 类，都会自动执行这段逻辑。适合做审计字段填充、数据权限过滤等横切能力。

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Documented
public @interface PreDataProxy {

    Class<? extends DataProxy<?>> value();

    // 该值可在 dataProxy 内通过 DataProxyContext.params() 读取
    String[] params() default {};

}
```

`@PreDataProxy` 支持多级继承，也可以修饰在接口上。

## 执行顺序

`DataProxyInvoke.invoke()` 按以下顺序依次调用同名钩子（每一步都会先设置好 `DataProxyContext`，调用完立即清理）：

1. **注解容器**：Erupt 类上标注的、已注册到容器中的自定义注解（见下文「注解容器」）
2. **父类与父接口**上的 `@PreDataProxy`（沿继承链自上而下）
3. **当前类与其直接实现的接口**上的 `@PreDataProxy`
4. `@Erupt(dataProxy = {...})` 中声明的 DataProxy
5. 通过 `PostDataProxy` 注册的全局 DataProxy（见 [全局代理](/zh/advanced/post-data-proxy)）

## 代码示例

以「审计字段自动填充」为例，把 `createBy` / `createTime` 的写入逻辑放到父类上：

```java
@Getter
@Setter
@MappedSuperclass
@PreDataProxy(AuditDataProxy.class)
public class AuditModel extends BaseModel {

    @EruptField(
            views = @View(title = "创建人", width = "100px"),
            edit = @Edit(title = "创建人", readonly = @Readonly)
    )
    private String createBy;

    @EruptField(
            views = @View(title = "创建时间", sortable = true),
            edit = @Edit(title = "创建时间", readonly = @Readonly,
                         dateType = @DateType(type = DateType.Type.DATE_TIME))
    )
    private LocalDateTime createTime;

}
```

```java
@Service
public class AuditDataProxy implements DataProxy<AuditModel> {

    @Override
    public void beforeAdd(AuditModel model) {
        model.setCreateTime(LocalDateTime.now());
        Optional.ofNullable(MetaContext.getUser())
                .ifPresent(user -> model.setCreateBy(user.getName()));
    }

}
```

此后任何继承 `AuditModel` 的 Erupt 类都会自动执行 `AuditDataProxy.beforeAdd`：

```java
@Entity
@Erupt(name = "测试对象")
public class TestModel extends AuditModel {

}
```

### 框架内置的实际用例

erupt-upms 的数据权限基类就是靠 `@PreDataProxy` 实现的，可以作为参考：

```java
@MappedSuperclass
@PreDataProxy(LookerSelf.Comp.class)
public class LookerSelf extends HyperModelCreatorVo implements DataProxy<Void> {

    @Component
    static class Comp implements DataProxy<Void> {

        @Resource
        private EruptUserService eruptUserService;

        @Override
        public String beforeFetch(List<Condition> conditions) {
            if (eruptUserService.getCurrentEruptUser().getIsAdmin()) return null;
            return DataProxyContext.currentClass().getSimpleName()
                    + ".createUser.id = " + eruptUserService.getCurrentUid();
        }

    }

}
```

继承 `LookerSelf` 的 Erupt 类，非管理员用户只能看到自己创建的数据。同类的还有 `LookerOrg`（按组织过滤）与 `LookerPostLevel`（按岗位层级过滤）。

::: warning 审计字段基类 ≠ @PreDataProxy
框架提供的两个审计字段基类**都不是**用 `@PreDataProxy` 实现的，它们用的是 JPA 的 `@PrePersist` / `@PreUpdate` 生命周期回调，因此无需任何 DataProxy 即可自动赋值：

| 基类 | 所在模块 | 字段 | 说明 |
| --- | --- | --- | --- |
| `xyz.erupt.jpa.model.MetaModelVo` | erupt-data-jpa | `createBy` / `createTime` / `updateBy` / `updateTime` | 记录用户**名称字符串**，不与用户表建立关联 |
| `xyz.erupt.upms.model.base.HyperModel` | erupt-upms | `createUser` / `createTime` / `updateUser` / `updateTime` | `createUser` / `updateUser` 为 `@ManyToOne` **关联 `EruptUserVo`**，可反查用户实体 |

选型建议：不想引入用户表关联（例如模块要独立于 upms）用 `MetaModelVo`；需要按创建人做关联查询或数据权限过滤用 `HyperModel` 系列。两者请勿混用在同一条继承链上。
:::

## 传参：`params` 与 `DataProxyContext`

同一个 DataProxy 实现常常需要按被标注的类做差异化处理，此时用 `params` 传入静态参数。框架内置的 `RedisNotifyDataProxy`（erupt-toolkit）就是这么用的——它把 Redis 频道名交给使用方声明：

```java
@Entity
@Erupt(name = "定时任务")
@PreDataProxy(value = RedisNotifyDataProxy.class, params = "erupt:job:topic")
public class MyJob extends BaseModel {
    // ...
}
```

在 DataProxy 内通过 `DataProxyContext.params()` 读取（下面是 `RedisNotifyDataProxy` 的实际做法）：

```java
private void publish(DataAction action, Object data) {
    if (eruptProp.isRedisSession()) {
        if (DataProxyContext.params().length == 0 || null == DataProxyContext.params()[0]) {
            throw new EruptWebApiRuntimeException("DataProxy params[0] not found → redis channel");
        }
        stringRedisTemplate.convertAndSend(DataProxyContext.params()[0],
                GsonFactory.getGson().toJson(new NotifyData<>(action, data)));
    }
}
```

自定义 DataProxy 同理：

```java
@Service
public class TenantDataProxy implements DataProxy<Object> {

    @Override
    public String beforeFetch(List<Condition> conditions) {
        String[] params = DataProxyContext.params();
        if (params.length == 0) return null;
        // params[0] 由标注方声明，例如租户字段名
        return DataProxyContext.currentClass().getSimpleName()
                + "." + params[0] + " = " + TenantHolder.currentTenantId();
    }

}
```

`DataProxyContext` 是一个 `ThreadLocal`，由 `DataProxyInvoke` 在调用每个 DataProxy 前设置、调用后清理：

| 方法 | 返回值 | 说明 |
| --- | --- | --- |
| `DataProxyContext.params()` | `String[]` | 当前正在执行的这一个 DataProxy 所对应的 `params`；未声明时为**空数组**（不是 `null`） |
| `DataProxyContext.currentClass()` | `Class<?>` | 当前正在被处理的 Erupt 类（是**子类**，不是标注 `@PreDataProxy` 的父类） |
| `DataProxyContext.get()` | `DataProxyContext.Data` | 同时取到 `eruptModel` 与 `params` |

::: tip params 的来源
- 来自 `@PreDataProxy(params = {...})` 时，取的是该注解的 `params`。
- 来自 `@Erupt(dataProxy = ...)` 时，取的是 `@Erupt(dataProxyParams = {...})`。
- 通过 `PostDataProxy` 注册的全局代理，取的同样是 `@Erupt(dataProxyParams = {...})`。
:::

## 注解容器（registerAnnotationContainer）

上面的写法要求业务类**继承**某个父类。如果你希望以「打一个自定义注解」的方式启用某段 DataProxy 逻辑，可以使用注解容器机制。

做法分两步：

**1. 定义一个被 `@PreDataProxy` 标注的注解**

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@PreDataProxy(value = RedisNotifyDataProxy.class, params = "erupt:notify:topic")
public @interface RedisNotify {
}
```

**2. 在启动时注册这个注解**

```java
@Component
public class MyModule implements EruptModule {

    static {
        DataProxyInvoke.registerAnnotationContainer(RedisNotify.class);
    }

    // ...
}
```

方法签名：

```java
public static void registerAnnotationContainer(Class<? extends Annotation> annotationClass)
```

注册时会校验该注解自身是否标注了 `@PreDataProxy`，若未标注则直接抛出 `RuntimeException("register error not found @PreDataProxy")`。

注册完成后，任何 Erupt 类只要打上 `@RedisNotify`，就会执行 `RedisNotifyDataProxy`，并且能读到注解上声明的 `params`：

```java
@Entity
@Erupt(name = "商品")
@RedisNotify
public class Goods extends BaseModel {
    // ...
}
```

::: warning 注意
- 容器机制**只识别标注在 Erupt 类自身上的注解**，不会沿继承链向上查找。
- 注解容器中的代理在整个调用链中**最先执行**（早于父类的 `@PreDataProxy`）。
- 注册动作必须在 Erupt 类被解析前完成，放在 `EruptModule` 实现类的静态代码块中最稳妥。
:::
