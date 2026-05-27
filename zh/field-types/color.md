# 颜色选择 COLOR

颜色拾取器，用户通过调色板选择颜色，值以十六进制字符串（如 `#ff0000`）存储。

## 基础用法

```java
@EruptField(
    views = @View(title = "颜色"),
    edit = @Edit(title = "颜色", type = EditType.COLOR)
)
private String color;
```
