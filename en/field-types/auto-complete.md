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

## Configuration

```java
public @interface AutoCompleteType {

    Class<? extends AutoCompleteHandler> handler(); // Candidate handler (required)

    String[] param() default {}; // Parameters passed to the handler

    int triggerLength() default 1; // Minimum input length to trigger suggestions

}
```
