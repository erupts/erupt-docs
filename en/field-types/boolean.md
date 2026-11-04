# Boolean Toggle BOOLEAN

A yes/no toggle switch. When the field type is `Boolean`, the type is automatically inferred — no need to explicitly specify `type`.

![boolean](/field-types/boolean.png)

## Basic Usage

```java
@EruptField(
    edit = @Edit(title = "Enabled", boolType = @BoolType)
)
private Boolean enabled;
```

## Configuration

```java
public @interface BoolType {

    String trueText() default "Y";  // Text when checked

    String falseText() default "N"; // Text when unchecked

    Type type() default Type.AUTO;  // Form widget (2.3.0+)

    enum Type {
        AUTO,   // Switch when the field is notNull, radio buttons otherwise; resolved server side
        RADIO,  // Radio buttons; keeps an explicit unset state
        SWITCH, // Switch; an unset value is submitted as false
    }

}
```

## Widget Type <Badge type="tip" text="v2.3.0+" />

| Type | Description |
| --- | --- |
| `AUTO` | The default. Renders a switch when the field is `@Edit(notNull = true)`, radio buttons otherwise; the server resolves the concrete widget and sends it down, the frontend does not guess |
| `RADIO` | Two radio buttons labelled `trueText` / `falseText`; the field may stay unset |
| `SWITCH` | A switch with `trueText` / `falseText` shown inside the knob; new records and legacy `null` values are seeded as `false` |

```java
@EruptField(
    edit = @Edit(title = "Status",
                 boolType = @BoolType(type = BoolType.Type.SWITCH, trueText = "Enabled", falseText = "Disabled"))
)
private Boolean status;
```

The BOOLEAN field panel in erupt-designer offers the same widget picker.

## Examples

Custom labels with a default value:

```java
@EruptField(
    edit = @Edit(title = "Gender",
                 boolType = @BoolType(trueText = "Male", falseText = "Female"))
)
private Boolean sex = true;
```
