# 搜索 @Search

`@Search` 注解配置字段是否出现在列表页顶部搜索栏中，以及搜索的匹配方式。

## 使用方法

```java
@EruptField(
    views = @View(title = "名称"),
    edit = @Edit(title = "名称", search = @Search(vague = true))
)
private String name;
```

## 配置项

```java
public @interface Search {

    boolean value() default true; // 是否开启搜索

    boolean vague() default false; // 高级搜索（各组件有对应的高级查询策略，如范围、模糊等）

    boolean notNull() default false; // 是否为必填搜索项

}
```
