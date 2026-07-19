# 通用继承（@PreDataProxy）

在 erupt 中可以通过继承，获取父类的组件的能力，也支持通过继承执行父组件预定义的方法。

```java
public @interface PreDataProxy {

    Class<? extends DataProxy<?>> value();

}
```

`PreDataProxy` 支持多级继承，也可以修饰在接口上。

## 代码示例

继承 `HyperModel` 不仅可以使用创建人、创建时间、修改人、修改时间字段，还可以自动的将这些值注入，原理是 `HyperModel` 类上存在有 `@PreDataProxy` 注解：

```java
@PreDataProxy(HyperDataProxy.class)
@MappedSuperclass
public class MetaModelVo extends BaseModel {

    @EruptField(
            views = @View(title = "创建人", width = "100px"),
            edit = @Edit(title = "创建人", readonly = @Readonly)
    )
    private String createBy;

    @EruptField(
            views = @View(title = "创建时间", sortable = true),
            edit = @Edit(title = "创建时间", readonly = @Readonly, dateType = @DateType(type = DateType.Type.DATE_TIME))
    )
    private LocalDateTime createTime;

    // ... 更多字段
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

调用 TestModel 则会自动执行 HyperDataProxy 的对应方法：

```java
@Entity
@Erupt
public class TestModel extends MetaModelVo {
    
}
```
