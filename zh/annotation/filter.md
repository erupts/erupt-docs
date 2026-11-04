# 数据过滤 @Filter

`@Filter` 注解用于定义数据展示时的过滤条件，参照 HQL 语句的 where 语法。

## 使用方法

```java
@Erupt(
       name = "Test",
       filter = @Filter("EruptTest.name = '张三'"),
)
public class EruptTest extends BaseModel {
 
    @EruptField(
            views = @View(title = "名称"),
            edit = @Edit(title = "名称")
    )
    private String name;
    
}
```

## 配置项注解定义

```java
public @interface Filter {
    
    String value() default ""; // 条件表达式

    String[] params() default {}; // 回调参数

    // 动态控制过滤条件
    Class<? extends FilterHandler> conditionHandler() default FilterHandler.class; 
}
```

## 代码演示

### 动态控制查询条件

```java
@Erupt(
       name = "Test",
       filter = @Filter(value = "name = '123' or name ",
                        params = {"23333"},
                        conditionHandler = AutoFilter.class)
)
public class EruptTest extends BaseModel {
 
    @EruptField(
            views = @View(title = "名称"),
            edit = @Edit(title = "名称")
    )
    private String name;
    
}
```

```java
@Component
public class AutoFilter implements FilterHandler {
    
    /**
     * @param condition 条件表达式
     * @param params    注解参数
     * 
     * 结果：name = '123' or name = '23333'
     */
    @Override
    public String filter(String condition, String[] params) {
        // 生成新的过滤语句
        // return "name is null"
        
        // 拼接查询参数
        return condition + " = '" + params[0] + "'";
    }
    
}
```

### 根据用户角色过滤数据

常见的数据权限场景：管理员查看全部数据，部门主管只看本部门数据，普通员工只看自己创建的数据。

```java
@Erupt(
        name = "客户",
        filter = @Filter(conditionHandler = RoleDataFilter.class)
)
@Table(name = "customer")
@Entity
public class Customer extends BaseModel {

    @EruptField(
            views = @View(title = "客户名称"),
            edit = @Edit(title = "客户名称")
    )
    private String name;

    @EruptField(views = @View(title = "所属部门"))
    @ManyToOne
    private EruptOrg org;

    @EruptField(views = @View(title = "负责人"))
    @ManyToOne
    private EruptUser owner;

}
```

```java
@Service
public class RoleDataFilter implements FilterHandler {

    @Resource
    private EruptUserService eruptUserService;

    @Override
    public String filter(String condition, String[] params) {
        EruptUser user = eruptUserService.getCurrentEruptUser();
        // 管理员不受限制
        if (user.getIsAdmin()) return null;
        Set<String> roles = user.getRoles().stream()
                .map(EruptRole::getCode).collect(Collectors.toSet());
        // 部门主管：本部门全部数据
        if (roles.contains(RoleCode.MANAGER.name()) && null != user.getEruptOrg()) {
            return "org.id = " + user.getEruptOrg().getId();
        }
        // 普通员工：仅本人负责的数据
        return "owner.id = " + user.getId();
    }

}
```

:::tip
`filter` 返回 `null` 或空字符串表示不附加任何条件，即放行全部数据。
:::

拼接条件时务必使用 id 等数值型字段，若必须拼接用户输入的字符串，请先做转义或白名单校验，避免 HQL 注入。多角色叠加时也可以用 `or` 组合多个条件：

```java
List<String> conditions = new ArrayList<>();
if (roles.contains(RoleCode.MANAGER.name())) {
    conditions.add("org.id = " + user.getEruptOrg().getId());
}
if (roles.contains(RoleCode.SALES.name())) {
    conditions.add("owner.id = " + user.getId());
}
return conditions.isEmpty() ? "1 = 2" : String.join(" or ", conditions);
```

## 注意事项

- 过滤条件应符合 HQL 语法规范
- 可以结合权限系统实现数据级别的访问控制
- 支持参数化查询以提高安全性
