# OnChange 字段联动 <Badge type="tip" text="1.13.2+" />

根据用户在表单中的输入实时联动其他字段：既可以**修改其他字段的值**，也可以**动态调整其他字段的 `@Edit` 注解配置**（如标题、描述、必填等）。

## 基础用法

在字段的 `@Edit` 注解中通过 `onchange` 属性绑定处理类：

```java
@Erupt(name = "DEMO")
@Table(name = "t_demo")
@Entity
@Getter
@Setter
public class Demo extends BaseModel {

    @EruptField(
        views = @View(title = "Text"),
        edit = @Edit(title = "Text", onchange = DemoInputChange.class)
    )
    private String input;

    @EruptField(
        views = @View(title = "Text 2"),
        edit = @Edit(title = "Text 2", readonly = @Readonly)
    )
    private String input2;

}
```

```java
public class DemoInputChange implements OnChange<Demo> {

    // 通过表单 A 的变化，动态修改表单 B 的值
    @Override
    public Map<String, Object> populateForm(Demo demo, String[] params) {
        Map<String, Object> map = new HashedMap<>();
        map.put(LambdaSee.field(Demo::getInput2), demo.getInput());
        return map;
    }

    // 通过表单 A 的变化，动态修改表单 B 的注解配置
    @Override
    public Map<String, String> buildEditExpr(Demo demo, String[] params) {
        return Map.of(LambdaSee.field(Demo::getInput2),
                "edit.title = '" + demo.getInput() + "';" +
                    "edit.desc = '" + demo.getInput() + "';");
    }
}
```

## OnChange 接口定义

```java
public interface OnChange<MODEL> {

    // 根据用户输入联动其他表单，Key 表单字段名
    Map<String, Object> populateForm(MODEL model, String[] params);

    // 根据用户输入动态调整不同的字段的 @Edit 注解配置，可用变量：edit，语法 JS
    Map<String, String> buildEditExpr(MODEL model, String[] params);

}
```

:::tip 相关能力
- 下拉选项级联过滤见 [CHOICE 单选](/zh/field-types/choice) 的 `ChoiceFetchHandler.fetchFilter` 与 `dependField`
- 表单显隐、禁用等条件控制见 [@Dynamic 动态控制](/zh/annotation/dynamic)
:::
