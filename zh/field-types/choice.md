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

## 动态列表 <Badge type="tip" text="MyModel 2.0.0+" />

实现 `ChoiceFetchHandler<T>` 接口，从数据库或任意来源动态生成选项。泛型 `T` 为当前 Erupt 实体类（约定命名为 `MyModel`），可在 `fetchFilter` 方法中读取同表单其他字段的值实现联动：

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

    String dependField() default ""; // 联动字段名（本表字段）

    enum Type {
        SELECT, // 下拉选择（默认）
        RADIO,  // 单选按钮组
    }

}
```

## @VL 选项属性

`@VL` 注解用于在 `ChoiceType.vl` / `MultiChoiceType.vl` 中静态声明选项，`VLModel` 是其对应的动态返回类型。

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `value` | `String` | 必填 | 选项存储值 |
| `label` | `String` | 必填 | 选项显示文本 |
| `color` | `String` | `""` | 选项颜色（十六进制，如 `#f00`） |
| `disable` | `boolean` | `false` | 是否禁用该选项（不可选择） |
| `desc` | `String` | `""` | 选项描述（鼠标悬停提示） |
| `extra` | `String` | `""` | 自定义扩展值，可在 `VLModel.extra` 中读取 |

`VLModel` 动态构建示例：

```java
new VLModel("1", "启用")                          // value + label
new VLModel("2", "禁用", true)                    // 禁用选项
new VLModel("3", "待审核", "等待管理员审核")        // 带描述
new VLModel("4", "已拒绝", "审核不通过", "#f00", false) // 完整构造
```

## RowChoiceFetchHandler — 行内下拉联动

`RowChoiceFetchHandler<T>` 用于**表格行内编辑**场景，每一行的下拉选项可根据该行数据动态生成，泛型 `T` 为行数据对象。

```java
// 字段声明
@EruptField(
    views = @View(title = "状态"),
    edit = @Edit(title = "状态", type = EditType.CHOICE,
                 choiceType = @ChoiceType(fetchHandler = StatusRowFetchHandler.class))
)
private String status;
```

```java
@Component
public class StatusRowFetchHandler implements RowChoiceFetchHandler<MyModel> {

    @Override
    public List<VLModel> fetch(MyModel row, String[] params) {
        // row 为当前行的完整数据对象，可据此动态决定可选项
        if ("DRAFT".equals(row.getStatus())) {
            return List.of(new VLModel("SUBMIT", "提交审核"), new VLModel("CANCEL", "取消"));
        }
        return List.of(new VLModel("REVOKE", "撤回"), new VLModel("CLOSE", "关闭"));
    }

}
```

:::tip
- `RowChoiceFetchHandler` 在行内编辑时触发，每行独立调用一次
- 与 `ChoiceFetchHandler.fetchFilter` 的区别：前者基于**行数据**，后者基于**表单字段变化**
:::
