# DataProxy 动态逻辑扩展

提供增、删、改、查、导入、导出、数据初始化等事件触发逻辑接口，**相当于传统开发中的 service 层**。

可以实现如：缓存写入、消息推送、数据校验、RPC 调用、动态赋值等功能！

## 使用方法

在 `@Erupt` 注解中添加 dataProxy 配置，重写其中的方法即可：

```java
@Erupt(name = "Erupt", dataProxy = EruptTestDataProxy.class)
public class EruptTest extends BaseModel{
    
    @EruptField(
            views = @View(title = "名称"),
            edit = @Edit(title = "名称")
    )
    private String name;
    
}
```

定义实现 DataProxy 接口的类：

```java
@Service // 添加此注解可使用依赖注入相关功能
public class EruptTestDataProxy implements DataProxy<EruptTest>{
    
    @Override
    public void beforeAdd(EruptTest eruptTest) {
        // 数据校验
        if("张三".equals(eruptTest.getName())){
            throw new EruptApiErrorTip("名称禁止为张三！");
        }
    }

    @Override
    public void beforeUpdate(EruptTest eruptTest) {
        // 动态写数据
        eruptTest.setName(eruptTest.getName() + "xxxxxxx");
    }
    
    @Override
    public void afterFetch(Collection<Map<String, Object>> list) {
        // TODO 查询结果动态处理
    }

    @Override
    public Alert alert(List<Condition> conditions) {
        return Alert.info("页面提示信息");
    }
    
}
```

## DataProxy 接口定义

```java
public interface DataProxy<MODEL> {
    
    /**
     * 数据检验能力，如果校验不通过可抛出 EruptException 异常，1.13.1 及以上版本支持
     */
    default void validate(MODEL model) throws EruptException { }

    /** 新增前 */
    default void beforeAdd(MODEL model) { }

    /** 新增后 */
    default void afterAdd(MODEL model) { }

    /** 修改前 */
    default void beforeUpdate(MODEL model) { }

    /** 修改后 */
    default void afterUpdate(MODEL model) { }

    /** 删除前 */
    default void beforeDelete(MODEL model) { }

    /** 删除后 */
    default void afterDelete(MODEL model) { }

    /**
     * 查询前动态注入条件
     * @param conditions 前端已传递条件
     * @return 自定义查询条件(HQL语句)
     */
    default String beforeFetch(List<Condition> conditions) { return null; }

    /** 全局页面提示 */
    default Alert alert(List<Condition> conditions) { return null; }

    /**
     * 查询结果后置处理
     * @param list 查询结果
     */
    default void afterFetch(Collection<Map<String, Object>> list) { }

}
```

## DataProxy 上下文信息获取

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest>{
    
    @Override
    public void afterFetch(Collection<Map<String, Object>> list) {
        // 获取当前操作的类信息：EruptTest
        Class<?> clazz = DataProxyContext.currentClass();
        // 获取 dataProxy 中定义的 params 参数的值
        DataProxyContext.params();
    }
    
}
```

## 单元格着色

> 1.12.16 及以上版本支持

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest>{

    @Override
    public void afterFetch(Collection<Map<String, Object>> list) {
        int i = 0;
        for (Map<String, Object> map : list) {
            i++;
            if (i % 2 != 0) {
                EruptTableStyle.cellColor(map, "text", "#09f");
            }
        }
    }
    
}
```

## 表格行按钮显示控制

> 1.12.16 及以上版本支持

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest>{

    @Override
    public void afterFetch(Collection<Map<String, Object>> list) {
        int i = 0;
        for (Map<String, Object> map : list) {
            // 参数说明：行数据，查看详情是否显示，编辑按钮是否显示，删除按钮是否显示
            EruptTableStyle.rowPower(map, ++i % 2 == 0, true, true);
        }
    }
    
}
```

---

## PostDataProxy 全局拦截器

拦截所有 erupt 类的数据行为，包括：导出、查询、新增、修改、删除等。

**版本支持**：1.13.1 及以上版本

```java
@Component
public class FlowPostDataProxy implements DataProxy<Object> {

    @Resource
    private EruptDao eruptDao;

    // 注册全局拦截器
    @PostConstruct
    public void post() {
        PostDataProxy.register(FlowPostDataProxy.class);
    }

    @Override
    public void afterFetch(Collection<Map<String, Object>> list) {
        EruptModel eruptModel = DataProxyContext.get().getEruptModel();
        for (Annotation annotation : eruptModel.getClazz().getDeclaredAnnotations()) {
            if (EruptFlow.class == annotation.annotationType()) {
                // TODO
            }
        }
    }

    // 其他 dataProxy 的回调参考 DataProxy 接口定义

}
```

---

## 通用继承 @PreDataProxy

在 erupt 中可以通过继承，获取父类的组件的能力，也支持通过继承执行父组件预定义的方法。

```java
public @interface PreDataProxy {

    Class<? extends DataProxy<?>> value();

}
```

`PreDataProxy` 支持多级继承，也可以修饰在接口上。

### 代码示例

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
