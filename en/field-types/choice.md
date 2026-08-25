# Single Select CHOICE

A dropdown single-select field, supporting both static enum values and dynamically fetched options from the backend.

![choice-select](/field-types/choice-select.png)
![choice-radio](/field-types/choice-radio.png)

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

## Dynamic List <Badge type="tip" text="MyModel 2.0.0+" />

Implement `ChoiceFetchHandler<T>` to generate options dynamically. The generic `T` is the current Erupt entity class (conventionally named `MyModel`) — override `fetchFilter` to read other form fields and drive linked selections:

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

## Dictionary Options

`erupt-upms` ships two built-in `ChoiceFetchHandler` implementations backed by **Dictionary Management** — no custom handler needed to use dictionary items as dropdown options. Pass the dictionary code via `fetchHandlerParams`:

| Handler | Stored value | Display label |
|---|---|---|
| `DictChoiceFetchHandler` | Dictionary item **id** | Dictionary item name |
| `DictCodeChoiceFetchHandler` | Dictionary item **code** | Dictionary item name |

```java
@EruptField(
    views = @View(title = "Education"),
    edit = @Edit(title = "Education", type = EditType.CHOICE,
                 choiceType = @ChoiceType(
                     fetchHandler = DictCodeChoiceFetchHandler.class,
                     fetchHandlerParams = "education" // dictionary code
                 ))
)
private String education;
```

:::tip
- `fetchHandlerParams[0]`: the dictionary code (required), matching `code` in Dictionary Management.
- `fetchHandlerParams[1]`: optional cache duration in milliseconds, default `3000`, e.g. `fetchHandlerParams = {"education", "60000"}`.
- Options are ordered by the dictionary item's `sort` field and cached via LRU.
- Prefer `DictCodeChoiceFetchHandler` — code-based stored values are unaffected by dictionary item id changes.
:::

## Configuration

```java
public @interface ChoiceType {

    Type type() default Type.SELECT; // Display mode

    VL[] vl() default {};            // Static option list

    String[] fetchHandlerParams() default {}; // Parameters passed to fetchHandler

    Class<? extends ChoiceFetchHandler>[] fetchHandler() default {}; // Dynamic option source

    String dependField() default ""; // Linked field name (in the same entity)

    enum Type {
        SELECT, // Dropdown select (default)
        RADIO,  // Radio button group
    }

}
```

## @VL Option Attributes

`@VL` is used to statically declare options in `ChoiceType.vl` / `MultiChoiceType.vl`. `VLModel` is the corresponding dynamic return type.

| Attribute | Type | Default | Description |
|---|---|---|---|
| `value` | `String` | required | The stored value |
| `label` | `String` | required | The display text |
| `color` | `String` | `""` | Option color (hex, e.g. `#f00`) |
| `disable` | `boolean` | `false` | Whether the option is disabled (unselectable) |
| `desc` | `String` | `""` | Option description (shown on hover) |
| `extra` | `String` | `""` | Custom extension value, readable via `VLModel.extra` |

`VLModel` construction examples:

```java
new VLModel("1", "Active")                               // value + label
new VLModel("2", "Disabled", true)                       // disabled option
new VLModel("3", "Pending", "Awaiting admin review")     // with description
new VLModel("4", "Rejected", "Review failed", "#f00", false) // full constructor
```

