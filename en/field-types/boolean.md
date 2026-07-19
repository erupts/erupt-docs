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

}
```

## Examples

Custom labels with a default value:

```java
@EruptField(
    edit = @Edit(title = "Gender",
                 boolType = @BoolType(trueText = "Male", falseText = "Female"))
)
private Boolean sex = true;
```
