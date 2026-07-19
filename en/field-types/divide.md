# Divider DIVIDE

Inserts a horizontal dividing line in the form to visually group fields. No data is stored.

![divide](/field-types/divide.png)

## Basic Usage

```java
@Transient
@EruptField(
    edit = @Edit(title = "-- Basic Information --", type = EditType.DIVIDE)
)
private String divide;
```
