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

## 综合示例：字段显隐 + 数据联动

选择订单类型后，自动填充折扣率，并按类型显示 VIP 等级或团购人数：

```java
@Erupt(name = "订单")
@Table(name = "t_order")
@Entity
@Getter
@Setter
public class Order extends BaseModel {

    @EruptField(
            views = @View(title = "订单类型"),
            edit = @Edit(
                    title = "订单类型",
                    type = EditType.CHOICE,
                    choiceType = @ChoiceType(vl = {
                            @VL(value = "normal", label = "普通订单"),
                            @VL(value = "vip", label = "VIP 订单"),
                            @VL(value = "group", label = "团购订单")
                    }),
                    notNull = true,
                    onchange = OrderTypeOnChange.class
            )
    )
    private String orderType;

    @EruptField(
            views = @View(title = "商品名称"),
            edit = @Edit(title = "商品名称", notNull = true)
    )
    private String productName;

    @EruptField(
            views = @View(title = "数量"),
            edit = @Edit(title = "数量", type = EditType.NUMBER, notNull = true)
    )
    private Integer quantity;

    @EruptField(
            views = @View(title = "VIP 等级"),
            edit = @Edit(title = "VIP 等级", type = EditType.CHOICE,
                    choiceType = @ChoiceType(vl = {
                            @VL(value = "1", label = "银卡"),
                            @VL(value = "2", label = "金卡"),
                            @VL(value = "3", label = "钻石卡")
                    })
            )
    )
    private String vipLevel;

    @EruptField(
            views = @View(title = "团购人数"),
            edit = @Edit(title = "团购人数", type = EditType.NUMBER)
    )
    private Integer groupSize;

    @EruptField(
            views = @View(title = "折扣率"),
            edit = @Edit(title = "折扣率", type = EditType.NUMBER, readonly = @Readonly)
    )
    private BigDecimal discount;

}
```

```java
@Component
public class OrderTypeOnChange implements OnChange<Order> {

    @Override
    public Map<String, Object> populateForm(Order order, String[] params) {
        // 根据订单类型自动填充折扣率
        BigDecimal discount = switch (String.valueOf(order.getOrderType())) {
            case "vip" -> new BigDecimal("0.85");
            case "group" -> new BigDecimal("0.80");
            default -> BigDecimal.ONE;
        };
        return Map.of(LambdaSee.field(Order::getDiscount), discount);
    }

    @Override
    public Map<String, String> buildEditExpr(Order order, String[] params) {
        // 根据订单类型控制字段显隐：判断在服务端完成，只把 true / false 拼进表达式
        String type = order.getOrderType();
        return Map.of(
                LambdaSee.field(Order::getVipLevel), "edit.show = " + "vip".equals(type) + ";",
                LambdaSee.field(Order::getGroupSize), "edit.show = " + "group".equals(type) + ";"
        );
    }
}
```

:::warning
- `buildEditExpr` 返回的表达式会在浏览器中以 JS 执行，不要把用户输入直接拼进表达式，应在服务端完成判断后只拼接确定的值（如上例的 `true` / `false`）。
- 使用 `buildEditExpr` 控制字段显隐时，不要对同一字段再使用 [@Dynamic](/zh/annotation/dynamic)，否则可能导致前端循环触发 onchange 请求。
:::

:::tip 相关能力
- 下拉选项级联过滤见 [CHOICE 单选](/zh/field-types/choice) 的 `ChoiceFetchHandler.fetchFilter` 与 `dependField`
- 表单显隐、禁用等条件控制见 [@Dynamic 动态控制](/zh/annotation/dynamic)
:::
