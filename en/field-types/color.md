# Color Picker COLOR

A color picker component. Users select a color via a palette, and the value is stored as a hexadecimal string (e.g. `#ff0000`).

![color](/field-types/color.png)

## Basic Usage

```java
@EruptField(
    views = @View(title = "Color"),
    edit = @Edit(title = "Color", type = EditType.COLOR)
)
private String color;
```

## Configuration <Badge type="tip" text="v2.1.1+" />

```java
public @interface ColorType {

    boolean alpha() default false; // Allow the alpha (transparency) channel

    String[] presets() default {}; // Preset color swatches shown in the picker panel, e.g. {"#F5222D", "#1890FF"}

    boolean showText() default true; // Show the color value text next to the swatch

}
```

## Example

Preset swatches with alpha channel:

```java
@EruptField(
    edit = @Edit(title = "Theme Color", type = EditType.COLOR,
                 colorType = @ColorType(alpha = true, presets = {"#F5222D", "#1890FF", "#52C41A"}))
)
private String themeColor;
```
