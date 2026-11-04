# OnChange Field Linkage <Badge type="tip" text="1.13.2+" />

Reacts to user input in the form in real time: you can **update the values of other fields**, or **dynamically adjust the `@Edit` annotation configuration** of other fields (such as title, description, required, etc.).

## Basic Usage

Bind a handler class via the `onchange` attribute of the field's `@Edit` annotation:

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

    // Dynamically update the value of form field B when form field A changes
    @Override
    public Map<String, Object> populateForm(Demo demo, String[] params) {
        Map<String, Object> map = new HashedMap<>();
        map.put(LambdaSee.field(Demo::getInput2), demo.getInput());
        return map;
    }

    // Dynamically update the annotation configuration of form field B when form field A changes
    @Override
    public Map<String, String> buildEditExpr(Demo demo, String[] params) {
        return Map.of(LambdaSee.field(Demo::getInput2),
                "edit.title = '" + demo.getInput() + "';" +
                    "edit.desc = '" + demo.getInput() + "';");
    }
}
```

## OnChange Interface Definition

```java
public interface OnChange<MODEL> {

    // Populate other form fields based on user input. Key is the field name.
    Map<String, Object> populateForm(MODEL model, String[] params);

    // Dynamically adjust the @Edit annotation config of other fields based on user input.
    // Available variable: edit. Syntax: JavaScript.
    Map<String, String> buildEditExpr(MODEL model, String[] params);

}
```

## Full Example: Show / Hide Fields + Value Linkage

After an order type is picked, the discount is filled in and either VIP Level or Group Size is shown:

```java
@Erupt(name = "Order")
@Table(name = "t_order")
@Entity
@Getter
@Setter
public class Order extends BaseModel {

    @EruptField(
            views = @View(title = "Order Type"),
            edit = @Edit(
                    title = "Order Type",
                    type = EditType.CHOICE,
                    choiceType = @ChoiceType(vl = {
                            @VL(value = "normal", label = "Normal"),
                            @VL(value = "vip", label = "VIP"),
                            @VL(value = "group", label = "Group Buy")
                    }),
                    notNull = true,
                    onchange = OrderTypeOnChange.class
            )
    )
    private String orderType;

    @EruptField(
            views = @View(title = "Product"),
            edit = @Edit(title = "Product", notNull = true)
    )
    private String productName;

    @EruptField(
            views = @View(title = "Quantity"),
            edit = @Edit(title = "Quantity", type = EditType.NUMBER, notNull = true)
    )
    private Integer quantity;

    @EruptField(
            views = @View(title = "VIP Level"),
            edit = @Edit(title = "VIP Level", type = EditType.CHOICE,
                    choiceType = @ChoiceType(vl = {
                            @VL(value = "1", label = "Silver"),
                            @VL(value = "2", label = "Gold"),
                            @VL(value = "3", label = "Diamond")
                    })
            )
    )
    private String vipLevel;

    @EruptField(
            views = @View(title = "Group Size"),
            edit = @Edit(title = "Group Size", type = EditType.NUMBER)
    )
    private Integer groupSize;

    @EruptField(
            views = @View(title = "Discount"),
            edit = @Edit(title = "Discount", type = EditType.NUMBER, readonly = @Readonly)
    )
    private BigDecimal discount;

}
```

```java
@Component
public class OrderTypeOnChange implements OnChange<Order> {

    @Override
    public Map<String, Object> populateForm(Order order, String[] params) {
        // Fill in the discount by order type
        BigDecimal discount = switch (String.valueOf(order.getOrderType())) {
            case "vip" -> new BigDecimal("0.85");
            case "group" -> new BigDecimal("0.80");
            default -> BigDecimal.ONE;
        };
        return Map.of(LambdaSee.field(Order::getDiscount), discount);
    }

    @Override
    public Map<String, String> buildEditExpr(Order order, String[] params) {
        // Show / hide fields by order type: decide on the server and put only true / false into the expression
        String type = order.getOrderType();
        return Map.of(
                LambdaSee.field(Order::getVipLevel), "edit.show = " + "vip".equals(type) + ";",
                LambdaSee.field(Order::getGroupSize), "edit.show = " + "group".equals(type) + ";"
        );
    }
}
```

:::warning
- Expressions returned by `buildEditExpr` run as JS in the browser. Never concatenate user input into them; decide on the server and concatenate only known values (like `true` / `false` above).
- When `buildEditExpr` controls a field's visibility, do not also use [@Dynamic](/en/annotation/dynamic) on that field, or the frontend may fire onchange requests in a loop.
:::

:::tip Related capabilities
- For cascading dropdown option filtering, see `ChoiceFetchHandler.fetchFilter` and `dependField` in [CHOICE](/en/field-types/choice)
- For conditional show/hide and disabling of form fields, see [@Dynamic](/en/annotation/dynamic)
:::
