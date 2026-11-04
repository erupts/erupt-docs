# Inherited Proxy (@PreDataProxy)

`@PreDataProxy` binds a piece of `DataProxy` logic to a **type**: any Erupt class that extends the annotated parent class (or implements the annotated interface) runs that logic automatically. It is the right tool for cross-cutting concerns such as audit-field population and row-level data permissions.

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Documented
public @interface PreDataProxy {

    Class<? extends DataProxy<?>> value();

    // This value can be retrieved via DataProxyContext.params() inside the dataProxy
    String[] params() default {};

}
```

`@PreDataProxy` supports multi-level inheritance and can also be placed on interfaces.

## Execution Order

`DataProxyInvoke.invoke()` calls the matching hook in the following order (each step sets up `DataProxyContext` before the call and clears it right after):

1. **Annotation containers** — registered custom annotations placed on the Erupt class (see [Annotation Containers](#annotation-containers-registerannotationcontainer) below)
2. `@PreDataProxy` on **parent classes and parent interfaces** (walking down the inheritance chain)
3. `@PreDataProxy` on **the class itself and the interfaces it directly implements**
4. The proxies declared in `@Erupt(dataProxy = {...})`
5. Global proxies registered through `PostDataProxy` (see [Global Proxy](/en/advanced/post-data-proxy))

## Code Example

Take "auto-populate audit fields": move the `createBy` / `createTime` write logic onto a base class.

```java
@Getter
@Setter
@MappedSuperclass
@PreDataProxy(AuditDataProxy.class)
public class AuditModel extends BaseModel {

    @EruptField(
            views = @View(title = "Created By", width = "100px"),
            edit = @Edit(title = "Created By", readonly = @Readonly)
    )
    private String createBy;

    @EruptField(
            views = @View(title = "Create Time", sortable = true),
            edit = @Edit(title = "Create Time", readonly = @Readonly,
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

From now on, every Erupt class extending `AuditModel` runs `AuditDataProxy.beforeAdd` automatically:

```java
@Entity
@Erupt(name = "Test Model")
public class TestModel extends AuditModel {

}
```

### A Real Framework Use Case

The data-permission base classes in erupt-upms are implemented with `@PreDataProxy` — a useful reference:

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

In an Erupt class extending `LookerSelf`, non-admin users only see the rows they created. `LookerOrg` (filter by organization) and `LookerPostLevel` (filter by post level) work the same way.

::: warning Audit base classes are NOT built on @PreDataProxy
Neither of the two audit-field base classes shipped with the framework uses `@PreDataProxy`. They rely on the JPA `@PrePersist` / `@PreUpdate` lifecycle callbacks, so the values are populated without any DataProxy at all:

| Base class | Module | Fields | Notes |
| --- | --- | --- | --- |
| `xyz.erupt.jpa.model.MetaModelVo` | erupt-data-jpa | `createBy` / `createTime` / `updateBy` / `updateTime` | Stores the user's **display name as a string**; no association to the user table |
| `xyz.erupt.upms.model.base.HyperModel` | erupt-upms | `createUser` / `createTime` / `updateUser` / `updateTime` | `createUser` / `updateUser` are `@ManyToOne` **associations to `EruptUserVo`**, so the user entity can be joined |

Which to pick: use `MetaModelVo` when you do not want a dependency on the user table (e.g. a module that must stay independent of upms); use the `HyperModel` family when you need to join or filter by creator. Do not mix both in the same inheritance chain.
:::

## Passing Parameters: `params` and `DataProxyContext`

A single DataProxy implementation often needs to behave differently per annotated class. `params` carries that static configuration. The built-in `RedisNotifyDataProxy` (erupt-toolkit) works exactly this way — it lets the caller declare the Redis channel name:

```java
@Entity
@Erupt(name = "My Job")
@PreDataProxy(value = RedisNotifyDataProxy.class, params = "erupt:job:topic")
public class MyJob extends BaseModel {
    // ...
}
```

Inside the DataProxy the value is read with `DataProxyContext.params()` (this is what `RedisNotifyDataProxy` actually does):

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

The same applies to your own proxies:

```java
@Service
public class TenantDataProxy implements DataProxy<Object> {

    @Override
    public String beforeFetch(List<Condition> conditions) {
        String[] params = DataProxyContext.params();
        if (params.length == 0) return null;
        // params[0] is declared by the annotated class, e.g. the tenant column name
        return DataProxyContext.currentClass().getSimpleName()
                + "." + params[0] + " = " + TenantHolder.currentTenantId();
    }

}
```

`DataProxyContext` is a `ThreadLocal` that `DataProxyInvoke` sets before invoking each DataProxy and clears afterwards:

| Method | Returns | Description |
| --- | --- | --- |
| `DataProxyContext.params()` | `String[]` | The `params` belonging to the DataProxy currently executing; an **empty array** (not `null`) when none were declared |
| `DataProxyContext.currentClass()` | `Class<?>` | The Erupt class being processed — the **subclass**, not the parent class carrying `@PreDataProxy` |
| `DataProxyContext.get()` | `DataProxyContext.Data` | Gives access to both `eruptModel` and `params` |

::: tip Where params come from
- For `@PreDataProxy`, the value is that annotation's `params`.
- For `@Erupt(dataProxy = ...)`, the value is `@Erupt(dataProxyParams = {...})`.
- Global proxies registered via `PostDataProxy` also read `@Erupt(dataProxyParams = {...})`.
:::

## Annotation Containers (registerAnnotationContainer)

Everything above requires the business class to **extend** a base class. When you would rather enable a piece of DataProxy logic by simply **applying a custom annotation**, use the annotation-container mechanism.

It takes two steps.

**1. Define an annotation that is itself annotated with `@PreDataProxy`**

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@PreDataProxy(value = RedisNotifyDataProxy.class, params = "erupt:notify:topic")
public @interface RedisNotify {
}
```

**2. Register that annotation at startup**

```java
@Component
public class MyModule implements EruptModule {

    static {
        DataProxyInvoke.registerAnnotationContainer(RedisNotify.class);
    }

    // ...
}
```

Signature:

```java
public static void registerAnnotationContainer(Class<? extends Annotation> annotationClass)
```

Registration verifies that the annotation itself carries `@PreDataProxy`; otherwise it throws `RuntimeException("register error not found @PreDataProxy")`.

Once registered, any Erupt class marked with `@RedisNotify` runs `RedisNotifyDataProxy` and can read the `params` declared on the annotation:

```java
@Entity
@Erupt(name = "Goods")
@RedisNotify
public class Goods extends BaseModel {
    // ...
}
```

::: warning Caveats
- The container mechanism **only looks at annotations present on the Erupt class itself** — it does not walk up the inheritance chain.
- Proxies coming from annotation containers run **first** in the whole chain, before any parent-class `@PreDataProxy`.
- Registration must happen before the Erupt classes are resolved; a static initializer inside an `EruptModule` implementation is the safest place.
:::
