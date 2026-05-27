# Empty Placeholder EMPTY

Occupies a component slot in the form without rendering any content. Used to control form layout alignment.

## Basic Usage

```java
@EruptField(
    edit = @Edit(title = "", type = EditType.EMPTY)
)
private String placeholder;
```

> Typically used together with the `@Layout` annotation. When the last field in a row needs to remain left-aligned, use EMPTY to fill the remaining slot.
