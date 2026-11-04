# Hidden Field HIDDEN

Not displayed in the form, but the field value is submitted along with the form. Suitable for storing automatically generated data or values populated by the backend.

## Basic Usage

```java
@EruptField(
    edit = @Edit(title = "Hidden Field", type = EditType.HIDDEN)
)
private String hiddenField;
```
