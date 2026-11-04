# 空占位 EMPTY

在表单中占据一个组件位置但不渲染任何内容，用于控制表单布局对齐。

## 基础用法

```java
@EruptField(
    edit = @Edit(title = "", type = EditType.EMPTY)
)
private String placeholder;
```

> 通常配合 `@Layout` 注解使用，当某行最后一个字段需要保持左对齐时，用 EMPTY 补位。
