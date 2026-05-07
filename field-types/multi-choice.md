# 多选 MULTI_CHOICE

下拉多选框或复选框组，选中的多个值以字符串形式存储（默认以 `|` 分隔）。

## 基础用法

静态选项：

```java
@EruptField(
    edit = @Edit(
        title = "多选",
        type = EditType.MULTI_CHOICE,
        multiChoiceType = @MultiChoiceType(
            vl = {
                @VL(label = "选项A", value = "A"),
                @VL(label = "选项B", value = "B"),
                @VL(label = "选项C", value = "C"),
            }
        )
    )
)
private String multiChoice;
```

## 配置项

```java
public @interface MultiChoiceType {

    Type type() default Type.CHECKBOX; // 展示方式

    VL[] vl() default {};              // 静态选项列表

    String[] fetchHandlerParams() default {}; // 传递给 fetchHandler 的参数

    Class<? extends ChoiceFetchHandler>[] fetchHandler() default {}; // 动态选项来源

    String dependField() default ""; // 联动字段名（本表字段）

    enum Type {
        SELECT,   // 下拉多选
        CHECKBOX, // 复选框组（默认）
    }

}
```

## 示例：动态获取选项

实现 `ChoiceFetchHandler` 接口，与 [CHOICE](/field-types/choice) 完全相同：

```java
@EruptField(
    edit = @Edit(title = "多选", type = EditType.MULTI_CHOICE,
                 multiChoiceType = @MultiChoiceType(fetchHandler = FetchHandlerImpl.class))
)
private String multiChoice;
```
