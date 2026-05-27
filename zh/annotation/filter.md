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

## 注意事项

- 过滤条件应符合 HQL 语法规范
- 可以结合权限系统实现数据级别的访问控制
- 支持参数化查询以提高安全性
