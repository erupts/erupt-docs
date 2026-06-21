# Single Select CHOICE

A dropdown single-select field, supporting both static enum values and dynamically fetched options from the backend.

## Basic Usage

```java
@EruptField(
    edit = @Edit(
        title = "Selector",
        type = EditType.CHOICE,
        choiceType = @ChoiceType(
            vl = {
                @VL(label = "Letter A", value = "A", color = "#0f0"),
                @VL(label = "Letter B", value = "B", disable = true),
                @VL(label = "Letter C", value = "C"),
            }
        )
    )
)
private String choice;
```

## Dynamic List

Implement `ChoiceFetchHandler<T>` to generate options dynamically. The generic `T` is the current Erupt entity class — override `fetchFilter` to read other form fields and drive linked selections:

```java
@EruptField(
    edit = @Edit(title = "City", type = EditType.CHOICE,
                 choiceType = @ChoiceType(fetchHandler = CityFetchHandler.class))
)
private String city;
```

```java
@Component
public class CityFetchHandler implements ChoiceFetchHandler<MyModel> {

    @Override
    public List<VLModel> fetch(String[] params) {
        // Called on initial load — return the full option list
        return cityService.findAll().stream()
            .map(c -> new VLModel(c.getCode(), c.getName()))
            .collect(toList());
    }

    @Override
    public List<VLModel> fetchFilter(MyModel model, String[] params) {
        // Called when a dependField value changes — model is the full form object
        String province = model.getProvince();
        return cityService.findByProvince(province).stream()
            .map(c -> new VLModel(c.getCode(), c.getName()))
            .collect(toList());
    }

}
```

:::tip
- `fetch` is called when the dropdown initialises.
- `fetchFilter` is triggered when the field declared in `dependField` changes; `model` is the entire current form object.
- Declare the watched field with `@ChoiceType(dependField = "province")`.
:::

## Configuration

```java
public @interface ChoiceType {

    Type type() default Type.SELECT; // Display mode

    VL[] vl() default {};            // Static option list

    String[] fetchHandlerParams() default {}; // Parameters passed to fetchHandler

    Class<? extends ChoiceFetchHandler>[] fetchHandler() default {}; // Dynamic option source

    boolean anewFetch() default false; // Whether to re-fetch options when editing (2.0.0+ adds an on-demand refresh button)

    String dependField() default ""; // Linked field name (in the same entity)

    enum Type {
        SELECT, // Dropdown select (default)
        RADIO,  // Radio button group
    }

}
```
