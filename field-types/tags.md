# 标签选择 TAGS

标签形式的多选组件，适合打标签、分类等场景，支持静态标签列表和动态获取。

## 基础用法

```java
@EruptField(
    views = @View(title = "标签"),
    edit = @Edit(title = "标签", type = EditType.TAGS,
                 tagsType = @TagsType(
                     fetchHandler = MyTagsFetchHandler.class
                 ))
)
private String tags;
```

实现 `TagsFetchHandler` 提供选项：

```java
@Component
public class MyTagsFetchHandler implements TagsFetchHandler {

    @Override
    public List<String> fetch(String[] params) {
        return List.of("Java", "Python", "Go");
    }

}
```

## 配置项

```java
public @interface TagsType {

    String joinSeparator() default "|"; // 多标签存储时的分隔符

    boolean allowExtension() default true; // 是否允许用户输入自定义标签

    int maxTagCount() default 9999; // 最多可选标签数量

    String[] tags() default {}; // 静态标签列表

    String[] fetchHandlerParams() default {}; // 传递给 fetchHandler 的参数

    Class<? extends TagsFetchHandler>[] fetchHandler() default {}; // 动态标签来源

}
```

## 示例

静态标签列表：

```java
@EruptField(
    edit = @Edit(title = "技术栈", type = EditType.TAGS,
                 tagsType = @TagsType(tags = {"Java", "Python", "Go"}, allowExtension = false))
)
private String techStack;
```
