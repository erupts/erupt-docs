# ifRender Dynamic Rendering <Badge type="tip" text="1.11.1+" />

Both `@View` and `@Edit` support the `ifRender` attribute. Through an `@ExprBool` expression you can decide at runtime whether a column or form component is rendered — e.g., control field visibility based on the current user's role.

## Dynamic Columns

Configure `ifRender` on `@View` to dynamically control whether a table column is displayed:

```java
@Erupt(name = "Dynamic Columns")
@Table(name = "t_test")
@Entity
public class Simple extends BaseModel {

    @EruptField(
        views = @View(
            title = "Dynamic Column",
            ifRender = @ExprBool(exprHandler = DynamicView.class)
        )
    )
    private String dynamic;

}
```

```java
import xyz.erupt.annotation.expr.ExprBool;

@Component
public class DynamicView implements ExprBool.ExprHandler {

    @Override
    public boolean handler(boolean expr, String[] params) {
        // TODO: dynamic control logic, e.g., show/hide based on the current logged-in user
        return false;
    }
    
}
```

## Dynamic Form Fields

Configure `ifRender` on `@Edit` to dynamically control whether a form component is rendered:

```java
@Erupt(name = "Dynamic Form")
@Table(name = "t_test")
@Entity
public class Simple extends BaseModel {

    @EruptField(
            edit = @Edit(
                    title = "Dynamic Field",
                    ifRender = @ExprBool(exprHandler = DynamicEdit.class)
            )
    )
    private String dynamic;

}
```

```java
import xyz.erupt.annotation.expr.ExprBool;

@Component
public class DynamicEdit implements ExprBool.ExprHandler {

    @Override
    public boolean handler(boolean expr, String[] params) {
        // TODO: dynamic control logic, e.g., show/hide based on the current logged-in user
        return false;
    }
    
}
```

## Related Capabilities

- Controlling component state based on another field's value: [@Dynamic](/en/annotation/dynamic)
- Updating other fields in real time on value change: [OnChange Field Linkage](/en/annotation/on-change)
