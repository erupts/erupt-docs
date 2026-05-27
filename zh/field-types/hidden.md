# 隐藏字段 HIDDEN

不在表单中显示，但字段值会随表单一起提交。适合存储自动生成或由后端填充的数据。

## 基础用法

```java
@EruptField(
    edit = @Edit(title = "隐藏字段", type = EditType.HIDDEN)
)
private String hiddenField;
```
