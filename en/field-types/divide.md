# Divider DIVIDE

Inserts a horizontal dividing line in the form to visually group fields. No data is stored.

## Basic Usage

```java
@Transient
@EruptField(
    edit = @Edit(title = "-- Basic Information --", type = EditType.DIVIDE)
)
private String divide;
```
