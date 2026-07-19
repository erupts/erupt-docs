# Inherited Proxy (@PreDataProxy)

In Erupt, you can leverage a parent class's component capabilities through inheritance. Inherited proxy methods defined via `@PreDataProxy` will also be executed automatically.

```java
public @interface PreDataProxy {

    Class<? extends DataProxy<?>> value();

}
```

`PreDataProxy` supports multi-level inheritance and can also be placed on interfaces.

## Code Example

Extending `HyperModel` not only provides creator, create time, updater, and update time fields — it also auto-populates them. This works because the `HyperModel` class is annotated with `@PreDataProxy`:

```java
@PreDataProxy(HyperDataProxy.class)
@MappedSuperclass
public class MetaModelVo extends BaseModel {

    @EruptField(
            views = @View(title = "Created By", width = "100px"),
            edit = @Edit(title = "Created By", readonly = @Readonly)
    )
    private String createBy;

    @EruptField(
            views = @View(title = "Create Time", sortable = true),
            edit = @Edit(title = "Create Time", readonly = @Readonly, dateType = @DateType(type = DateType.Type.DATE_TIME))
    )
    private LocalDateTime createTime;

    // ... more fields
}
```

```java
@Service
public class HyperDataProxy implements DataProxy<HyperModel> {

    @Autowired
    private EruptUserService eruptUserService;

    @Override
    public void beforeAdd(HyperModel hyperModel) {
        hyperModel.setCreateTime(new Date());
        hyperModel.setCreateUser(new EruptUser(eruptUserService.getCurrentUid()));
    }

    @Override
    public void beforeUpdate(HyperModel hyperModel) {
        hyperModel.setUpdateTime(new Date());
        hyperModel.setUpdateUser(new EruptUser(eruptUserService.getCurrentUid()));
    }
}
```

When `TestModel` is used, the corresponding `HyperDataProxy` methods will be invoked automatically:

```java
@Entity
@Erupt
public class TestModel extends MetaModelVo {
    
}
```
