# Single-line Text INPUT

Single-line text input supporting regex validation, prefix/suffix dropdowns, password mode, and more.

![input](/field-types/input.png)

## Basic Usage

```java
@EruptField(
    edit = @Edit(title = "Input", inputType = @InputType)
)
private String input;
```

## Configuration

```java
public @interface InputType {

    int length() default DataLength.TEXT_LENGTH; // Maximum length

    String type() default "text"; // HTML input type, see table below

    boolean fullSpan() default false; // Whether to span the full row

    String regex() default ""; // Regex validation

    VL[] prefix() default {}; // Left-side dropdown selector

    VL[] suffix() default {}; // Right-side dropdown selector

    boolean autoTrim() default true; // Whether to auto-trim (1.12.10+)

}
```

**Available `type` values:**

| type value | Behavior |
|---|---|
| `text` | Text input (default) |
| `password` | Password field |
| `email` | Email input |
| `color` | Color picker |
| `date` | Date picker |
| `datetime` | Date-time picker |
| `month` | Month picker |
| `week` | Week picker |
| `time` | Time picker |
| `range` | Numeric slider |

## Examples

Password input field:

```java
@EruptField(
    edit = @Edit(title = "Password", inputType = @InputType(type = "password"))
)
private String password;
```
