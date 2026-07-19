# Star Rating RATE

A star-rating component. Users select a rating value by clicking stars, suitable for satisfaction scores, rankings, and similar scenarios. Search support (filter by rating value) was added in 2.0.0.

![rate](/field-types/rate.png)

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
