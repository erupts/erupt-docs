# Auto Complete AUTO_COMPLETE

A text field with input suggestion support. As the user types, candidate options are matched dynamically. Options are provided by implementing `AutoCompleteHandler`.

![auto-complete](/field-types/auto-complete.png)

## Basic Usage

```java
@EruptField(
    edit = @Edit(title = "Auto Complete", type = EditType.AUTO_COMPLETE,
                 autoCompleteType = @AutoCompleteType(
                     handler = MyAutoCompleteHandler.class
                 ))
)
private String autoComplete;
```

## Dynamic List

Implement `AutoCompleteHandler<T>` to provide candidates. The generic `T` is the current Erupt entity class (conventionally named `MyModel`) — read `model` to access other form fields for linked filtering <Badge type="tip" text="MyModel 2.0.0+" />:

```java
@Component
public class MyAutoCompleteHandler implements AutoCompleteHandler<MyModel> {

    @Override
    public List<Object> completeHandler(MyModel model, String val, String[] param) {
        // val: the user's current input
        // model: the full form object — read other fields for linked filtering
        String category = model.getCategory();
        return productService.searchByCategory(category, val);
    }

}
```

> **2.0.0+**: A refresh button is displayed next to AUTO_COMPLETE fields in the edit form, allowing candidates to be re-fetched on demand.

## Static Candidates <Badge type="tip" text="v2.2.0+" />

When the candidate list is fixed there is no need for a handler — list them in `values`, matched **case-insensitively** against the input:

```java
@EruptField(
    views = @View(title = "Country"),
    edit = @Edit(title = "Country", type = EditType.AUTO_COMPLETE,
                 autoCompleteType = @AutoCompleteType(values = {"China", "United States", "Japan", "Germany"}))
)
private String country;
```

`values` and `handler` can be combined; the final list is the two merged. As of 2.2.0 `handler` is no longer required.

## Configuration

```java
public @interface AutoCompleteType {

    // Predefined candidates, matched case-insensitively, merged with handler results (2.2.0+)
    String[] values() default {};

    // Candidate handler; optional as of 2.2.0 (the default AutoCompleteHandler.class means no handler)
    Class<? extends AutoCompleteHandler> handler() default AutoCompleteHandler.class;

    String[] param() default {}; // Parameters passed to the handler

    int triggerLength() default 1; // Minimum input length to trigger suggestions

}
```
