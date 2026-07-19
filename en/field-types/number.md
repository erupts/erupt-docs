# Numeric Input NUMBER

Numeric input field. When the field type is `Integer`, `Float`, or `Double`, the type is automatically inferred — no need to explicitly specify `type`.

![number](/field-types/number.png)

## Basic Usage

```java
@EruptField(
    edit = @Edit(title = "Number Input", numberType = @NumberType)
)
private Integer number;
```

## Configuration

```java
public @interface NumberType {

    long max() default Integer.MAX_VALUE; // Maximum value

    long min() default -Integer.MAX_VALUE; // Minimum value

}
```

## Examples

Restrict to positive integers:

```java
@EruptField(
    edit = @Edit(title = "Positive Integer", numberType = @NumberType(min = 0))
)
private Integer number;
```

Floating-point input:

```java
@EruptField(
    edit = @Edit(title = "Float", numberType = @NumberType)
)
private Float number;
```
