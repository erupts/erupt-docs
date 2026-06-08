# Color Picker COLOR

A color picker component. Users select a color via a palette, and the value is stored as a hexadecimal string (e.g. `#ff0000`).

## Basic Usage

```java
@EruptField(
    views = @View(title = "Color"),
    edit = @Edit(title = "Color", type = EditType.COLOR)
)
private String color;
```
