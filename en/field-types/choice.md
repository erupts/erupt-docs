# Single Select CHOICE

A dropdown single-select field, supporting both static enum values and dynamically fetched options from the backend.

## Basic Usage

Static options:

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

## Configuration

```java
public @interface ChoiceType {

    Type type() default Type.SELECT; // Display mode

    VL[] vl() default {};            // Static option list

    String[] fetchHandlerParams() default {}; // Parameters passed to fetchHandler

    Class<? extends ChoiceFetchHandler>[] fetchHandler() default {}; // Dynamic option source

    boolean anewFetch() default false; // Whether to re-fetch options when editing

    String dependField() default ""; // Linked field name (in the same entity)

    enum Type {
        SELECT, // Dropdown select (default)
        RADIO,  // Radio button group
    }

}
```

## Example: Dynamic Options

Implement the `ChoiceFetchHandler` interface to generate options dynamically from a database or any other source:

```java
@EruptField(
    edit = @Edit(title = "Selector", type = EditType.CHOICE,
                 choiceType = @ChoiceType(
                     fetchHandler = FetchHandlerImpl.class,
                     fetchHandlerParams = {"α", "β", "γ"} // pass parameters via params
                 ))
)
private String choice;
```

```java
@Component
public class FetchHandlerImpl implements ChoiceFetchHandler {

    @Override
    public List<VLModel> fetch(String[] params) {
        List<VLModel> list = new ArrayList<>();
        list.add(new VLModel("a", "A"));
        list.add(new VLModel("b", "B"));
        return list;
    }

}
```
