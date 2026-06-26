# 标签选择 TAGS

标签形式的多选组件，适合打标签、分类等场景，支持静态标签列表和动态获取。

## 基础用法

```java
@EruptField(
    edit = @Edit(title = "技术栈", type = EditType.TAGS,
                 tagsType = @TagsType(tags = {"Java", "Python", "Go"}, allowExtension = false))
)
private String techStack;
```

## 动态列表 <Badge type="tip" text="MyModel 2.0.0+" />

字段声明：

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

实现 `TagsFetchHandler<T>` 提供选项。泛型 `T` 为当前 Erupt 实体类，可通过 `model` 读取同表单其他字段值实现联动：

```java
@Component
public class MyTagsFetchHandler implements TagsFetchHandler<MyModel> {

    @Override
    public List<String> fetchTags(MyModel model, String[] params) {
        // model 为当前表单对象，可读取其他字段值进行联动过滤
        String type = model.getType();
        return tagService.findByType(type);
    }

}
```

## 配置项

```java
public @interface TagsType {

    String joinSeparator() default "[]"; // 存储格式：默认 "[]" 为 JSON 数组（如 ["A","B"]），可改为 "," 等字符作为分隔符

    boolean allowExtension() default true; // 是否允许用户输入自定义标签

    int maxTagCount() default 9999; // 最多可选标签数量

    String[] tags() default {}; // 静态标签列表

    String[] fetchHandlerParams() default {}; // 传递给 fetchHandler 的参数

    Class<? extends TagsFetchHandler>[] fetchHandler() default {}; // 动态标签来源

}
```

> **2.0.0+**：编辑表单中 TAGS 字段旁新增刷新按钮，可按需重新拉取动态标签列表。

