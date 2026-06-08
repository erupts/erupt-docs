# Auto Inference AUTO

When `type` is not specified, Erupt automatically infers which edit component to use based on the Java field type.

| Field Type | Mapped Component |
|:---:|:---:|
| `Integer` / `Float` / `Double` | `EditType.NUMBER` |
| `Boolean` | `EditType.BOOLEAN` |
| `Date` | `EditType.DATE` |
| Others | `EditType.INPUT` |

## Basic Usage

```java
@EruptField(
    edit = @Edit(title = "Text Input") // equivalent to type = EditType.INPUT
)
private String input;

@EruptField(
    edit = @Edit(title = "Numeric Input") // equivalent to type = EditType.NUMBER
)
private Integer number;

@EruptField(
    edit = @Edit(title = "Boolean Toggle") // equivalent to type = EditType.BOOLEAN
)
private Boolean bool;

@EruptField(
    edit = @Edit(title = "Date Picker") // equivalent to type = EditType.DATE
)
private Date date;
```
