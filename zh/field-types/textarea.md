# 多行文本框 TEXTAREA

多行文本输入，适合存储较长内容。

## 基础用法

```java
@Column(length = 2000) // 也可用 @Lob 支持更大内容
@EruptField(
    views = @View(title = "多行文本"),
    edit = @Edit(title = "多行文本", type = EditType.TEXTAREA)
)
private String textarea;
```
