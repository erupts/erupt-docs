# Dynamic Form Control @Dynamic

## @Dynamic Annotation

Dynamically controls the current component based on the value of another component — including read-only state, visibility, and required validation.

> Supported in 1.13.1+. It is recommended to use the `onchange` configuration instead, as this feature may be changed or removed in a future release.

### Use Cases

- After filling in form field A, form field B becomes required.
- When field A has a certain value, field B is hidden.
- When a specific option is selected in field A, field B becomes read-only.

### Code Example

```java
@Enumerated(EnumType.STRING)
@EruptField(
        views = @View(title = "Edit Type"),
        edit = @Edit(title = "Edit Type",
                notNull = true, type = EditType.CHOICE,
                choiceType = @ChoiceType(type = ChoiceType.Type.RADIO, fetchHandler = GeneratorField.class))
)
private GeneratorType type = GeneratorType.INPUT;

// Dynamically make this field required based on the value of "type"
// (the framework also validates the required state server-side)
@EruptField(
        edit = @Edit(title = "Related Entity Class", 
                     dynamic = @Dynamic(
                        dependField = "type",
                        noMatch = Dynamic.Ctrl.HIDE,
                        match = Dynamic.Ctrl.NOTNULL,
                        condition = "value.indexOf('REFERENCE') != -1"
                     )
        )
)
private String linkClass;
```

### @Dynamic Annotation Attributes

| Attribute | Description |
|-----------|-------------|
| `dependField` | The name of the field to depend on — the current component reacts to changes in this field's value |
| `match` | Control behavior applied to the current component when the condition is met |
| `noMatch` | Control behavior applied to the current component when the condition is not met |
| `condition` | Condition expression in JavaScript syntax; `value` represents the dependent field's value |

### Control Behavior (Ctrl) Enum

- `SHOW`: Show the component
- `HIDE`: Hide the component
- `NOTNULL`: Mark the field as required
- `READONLY`: Mark the field as read-only

## @Readonly — Read-Only Control

```java
@EruptField(
            views = @View(title = "Add/Edit Permission"),
            edit = @Edit(title = "Add/Edit Permission",
                // add @Readonly and implement Readonly.ReadonlyHandle
                readonly = @Readonly(add = false, edit = false, exprHandler = DemoRead.class)
            )
    )
private String demo;
```

```java
@Service
public class DemoRead implements Readonly.ReadonlyHandler {
    
    @Resource
    private EruptUserService eruptUserService;
    
    @Override
    public boolean add(boolean add, String[] params) {
        // Example: only super admins can edit this field when adding
        return !eruptUserService.getCurrentEruptUser().getIsAdmin();
    }

    @Override
    public boolean edit(boolean edit, String[] params) {
        return true;
    }
}
```

### @Readonly Annotation Definition

```java
public @interface Readonly {
    boolean add() default true;

    boolean edit() default true;

    boolean allowChange() default true; // whether the value can be changed via API even when read-only on the frontend

    String[] params() default {};

    Class<? extends Readonly.ReadonlyHandler> exprHandler() default Readonly.ReadonlyHandler.class;

    public interface ReadonlyHandler {
        
        boolean add(boolean add, String[] params);

        boolean edit(boolean edit, String[] params);
    }
}
```

## Condition Expression Reference

Condition expressions use JavaScript syntax. Use the `value` variable to access the dependent field's value. Examples:

- `value == '1'` — when the dependent field equals the string `'1'`
- `value > 10` — when the dependent field's value is greater than 10
- `value.indexOf('REFERENCE') != -1` — when the dependent field's value contains the string `'REFERENCE'`
