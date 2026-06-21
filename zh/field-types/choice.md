# 单选 CHOICE

下拉单选框，支持静态枚举值和动态从后端获取选项。

## 基础用法

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

## 动态列表

实现 `ChoiceFetchHandler<T>` 接口，从数据库或任意来源动态生成选项。泛型 `T` 为当前 Erupt 实体类，可在 `fetchFilter` 方法中读取同表单其他字段的值实现联动：

```java
@EruptField(
    edit = @Edit(title = "城市", type = EditType.CHOICE,
                 choiceType = @ChoiceType(fetchHandler = CityFetchHandler.class))
)
private String city;
```

```java
@Component
public class CityFetchHandler implements ChoiceFetchHandler<MyModel> {

    @Override
    public List<VLModel> fetch(String[] params) {
        // 页面初始加载时调用，返回全量选项
        return cityService.findAll().stream()
            .map(c -> new VLModel(c.getCode(), c.getName()))
            .collect(toList());
    }

    @Override
    public List<VLModel> fetchFilter(MyModel model, String[] params) {
        // dependField 指定的字段值变化时触发，model 为当前整个表单对象
        String province = model.getProvince();
        return cityService.findByProvince(province).stream()
            .map(c -> new VLModel(c.getCode(), c.getName()))
            .collect(toList());
    }

}
```

:::tip
- `fetch` 在下拉框初始化时调用
- `fetchFilter` 在 `dependField` 指定的字段值变化时触发，`model` 为当前整个表单对象，可访问任意字段
- 通过 `@ChoiceType(dependField = "province")` 声明监听的联动字段
:::

## 配置项

```java
public @interface ChoiceType {

    Type type() default Type.SELECT; // 展示方式

    VL[] vl() default {};            // 静态选项列表

    String[] fetchHandlerParams() default {}; // 传递给 fetchHandler 的参数

    Class<? extends ChoiceFetchHandler>[] fetchHandler() default {}; // 动态选项来源

    boolean anewFetch() default false; // 编辑时是否重新拉取选项（2.0.0 起支持页面级刷新按钮）

    String dependField() default ""; // 联动字段名（本表字段）

    enum Type {
        SELECT, // 下拉选择（默认）
        RADIO,  // 单选按钮组
    }

}
```
