# Callout CALLOUT <Badge type="tip" text="2.0.2+" />

Renders a block of static guidance content (HTML supported) inside the form — ideal for filling instructions or notices. The field is display-only: **its value is never collected by the form nor persisted to the database**, so it should be marked `@Transient`.

## Basic Usage

```java
@Transient
@EruptField(
    edit = @Edit(title = "Filling Guide", type = EditType.CALLOUT,
        calloutType = @CalloutType(value = "Fields marked with <b>*</b> are required.", style = CalloutType.Style.INFO))
)
private String callout;
```

## Configuration @CalloutType

```java
public @interface CalloutType {

    String value() default ""; // callout content, supports HTML

    Style style() default Style.CARD; // display style

    enum Style {
        CARD,    // bordered card panel
        INFO,    // info alert banner
        SUCCESS, // success alert banner
        WARNING, // warning alert banner
        ERROR    // error alert banner
    }

}
```

:::tip
The `CARD` style renders a bordered panel; the other styles render an alert banner in the corresponding color.
:::
