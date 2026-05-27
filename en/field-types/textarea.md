# Multi-line Text TEXTAREA

Multi-line text input, suitable for storing longer content.

## Basic Usage

```java
@Column(length = 2000) // You can also use @Lob for larger content
@EruptField(
    views = @View(title = "Multi-line Text"),
    edit = @Edit(title = "Multi-line Text", type = EditType.TEXTAREA)
)
private String textarea;
```
