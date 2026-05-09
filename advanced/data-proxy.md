# DataProxy 数据代理

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
     * @return 自定义查询条件（JPQL WHERE 子句，不含 WHERE 关键字）
     */
    default String beforeFetch(List<Condition> conditions) { return null; }

    /**
     * 全局页面提示，每次打开页面时触发，返回 null 则不显示提示
     * Alert 支持 info / warning / error / success 四种类型
     */
    default Alert alert(List<Condition> conditions) { return null; }

    /**
     * 查询结果后置处理
     * @param list 查询结果
     */
    default void afterFetch(Collection<Map<String, Object>> list) { }

}
```

## beforeFetch 条件注入

`beforeFetch` 返回值为 JPQL（HQL）的 WHERE 子句，**不包含 `WHERE` 关键字**，框架会自动拼接。

```java
@Override
public String beforeFetch(List<Condition> conditions) {
    // 只查询当前登录用户自己的数据
    String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
    return "createBy = '" + currentUser + "'";
}
```

支持的语法示例：

| 场景 | 返回值示例 |
| --- | --- |
| 等于 | `"status = 1"` |
| 范围 | `"age between 18 and 60"` |
| 模糊 | `"name like '%张%'"` |
| IN | `"id in (1, 2, 3)"` |
| 关联属性 | `"dept.id = 10"` |
| 多条件 | `"status = 1 and deleteFlag = 0"` |
| 子查询 | `"id in (select userId from t_order where amount > 100)"` |

> 注意：这里是 JPQL 而非原生 SQL，字段名应使用 Java 实体属性名（驼峰），而非数据库列名。

## validate() 与 before* 的区别

| | `validate()` | `beforeAdd()` / `beforeUpdate()` |
|---|---|---|
| 用途 | 数据校验，不通过则拒绝操作 | 在保存前修改数据或执行业务逻辑 |
| 适用版本 | 1.13.1+ | 全版本 |
| 推荐场景 | 格式校验、业务规则校验 | 自动填充字段、调用外部服务 |

```java
@Override
public void validate(EruptTest model) throws EruptException {
    // 推荐：用于纯校验逻辑，不修改数据
    if (model.getEndDate().before(model.getStartDate())) {
        throw new EruptApiErrorTip("结束时间不能早于开始时间");
    }
}

@Override
public void beforeAdd(EruptTest model) {
    // 推荐：用于修改/补充数据
    model.setCreateBy(getCurrentUser());
}
```

## DataProxy 上下文信息获取

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest>{
    
    @Override
    public void afterFetch(Collection<Map<String, Object>> list) {
        // 获取当前操作的 Erupt 类信息（如 EruptTest.class）
        Class<?> clazz = DataProxyContext.currentClass();
        // 获取 @Erupt dataProxy 中 params 参数传入的值（字符串数组）
        String[] params = DataProxyContext.params();
        // 获取当前 HTTP 请求对象
        HttpServletRequest request = DataProxyContext.get(HttpServletRequest.class);
    }
    
}
```

`DataProxyContext` 主要方法：

| 方法 | 返回值 | 说明 |
| --- | --- | --- |
| `currentClass()` | `Class<?>` | 当前 Erupt 实体类 |
| `params()` | `String[]` | `@Erupt(dataProxy = {X.class, params = {"a","b"}})` 中的 params |
| `get(Class<T>)` | `T` | 从 Spring 上下文获取 Bean |

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
