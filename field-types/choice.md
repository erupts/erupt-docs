# 单选 CHOICE

下拉单选框，支持静态枚举值和动态从后端获取选项。

## 基础用法

静态选项：

```java
@EruptField(
    edit = @Edit(
        title = "选择器",
        type = EditType.CHOICE,
        choiceType = @ChoiceType(
            vl = {
                @VL(label = "字母A", value = "A", color = "#0f0"),
                @VL(label = "字母B", value = "B", disable = true),
                @VL(label = "字母C", value = "C"),
            }
        )
    )
)
private String choice;
```

## 配置项

```java
public @interface ChoiceType {

    Type type() default Type.SELECT; // 展示方式

    VL[] vl() default {};            // 静态选项列表

    String[] fetchHandlerParams() default {}; // 传递给 fetchHandler 的参数

    Class<? extends ChoiceFetchHandler>[] fetchHandler() default {}; // 动态选项来源

    boolean anewFetch() default false; // 编辑时是否重新拉取选项

    String dependField() default ""; // 联动字段名（本表字段）

    enum Type {
        SELECT, // 下拉选择（默认）
        RADIO,  // 单选按钮组
    }

}
```

## 示例：动态获取选项

实现 `ChoiceFetchHandler` 接口，从数据库或任意来源动态生成选项：

```java
@EruptField(
    edit = @Edit(title = "选择器", type = EditType.CHOICE,
                 choiceType = @ChoiceType(
                     fetchHandler = FetchHandlerImpl.class,
                     fetchHandlerParams = {"α", "β", "γ"} // 可通过 params 传参
                 ))
)
private String choice;
```

```java
@Component
public class FetchHandlerImpl implements ChoiceFetchHandler {

    @Override
    public List<VLModel> fetch(String[] params) {
        List<VLModel> list = new ArrayList<>();
        list.add(new VLModel("a", "A"));
        list.add(new VLModel("b", "B"));
        return list;
    }

}
```
