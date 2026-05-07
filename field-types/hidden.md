# 隐藏字段 HIDDEN

隐藏字段，不在表单中显示，但值会随其他字段一起提交。

```java
@EruptField(
    edit = @Edit(title = "隐藏字段", type = EditType.HIDDEN)
)
private String hiddenField;
```
