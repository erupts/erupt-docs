# Numeric Slider SLIDER

Input a value by dragging a slider, suitable for scenarios with bounded numeric ranges. Search support (range query) was added in 2.0.0.

![slider](/field-types/slider.png)

## Basic Usage

```java
@EruptField(
    edit = @Edit(title = "Slider",
                 type = EditType.SLIDER,
                 sliderType = @SliderType(max = 100))
)
private Integer slider;
```

## Configuration

```java
public @interface SliderType {

    int max();                    // Maximum value (required)

    int min() default 0;          // Minimum value

    float step() default 1;       // Step size

    boolean dots() default false; // Whether to snap only to tick marks

    float[] markPoints() default {}; // Array of tick mark positions

}
```

## Examples

Specify selectable tick marks:

```java
@EruptField(
    edit = @Edit(title = "Grid Columns",
                 type = EditType.SLIDER,
                 sliderType = @SliderType(max = 12, markPoints = {1f, 2f, 3f, 4f, 6f, 8f, 12f}, dots = true))
)
private Integer grid = 1;
```
