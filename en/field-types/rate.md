# Star Rating RATE

A star-rating component. Users select a rating value by clicking stars, suitable for satisfaction scores, rankings, and similar scenarios.

## Basic Usage

```java
@EruptField(
    views = @View(title = "Rating"),
    edit = @Edit(title = "Rating", type = EditType.RATE,
                 rateType = @RateType)
)
private Integer rate;
```

## Configuration

```java
public @interface RateType {

    String character() default ""; // Custom character; defaults to a star

    boolean allowHalf() default false; // Whether to allow half-star selection

    int count() default 5; // Total number of stars

}
```
