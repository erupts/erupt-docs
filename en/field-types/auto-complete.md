# Auto Complete AUTO_COMPLETE

A text field with input suggestion support. As the user types, candidate options are matched dynamically. Options are provided by implementing `AutoCompleteHandler`.

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

Implement `AutoCompleteHandler` to provide candidates:

```java
@Component
public class MyAutoCompleteHandler implements AutoCompleteHandler {

    @Override
    public List<String> fetch(String val, String[] params) {
        // val is the user's current input; return matching candidates based on it
        return List.of("Option 1", "Option 2");
    }

}
```

## Configuration

```java
public @interface AutoCompleteType {

    Class<? extends AutoCompleteHandler> handler(); // Candidate handler (required)

    String[] param() default {}; // Parameters passed to the handler

    int triggerLength() default 1; // Minimum input length to trigger suggestions

}
```
