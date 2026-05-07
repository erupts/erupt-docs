# Markdown 编辑器 MARKDOWN

支持 Markdown 语法的编辑器，内容以 Markdown 字符串形式存储，适合文档、说明类内容。

## 基础用法

```java
@Lob
@EruptField(
    views = @View(title = "描述"),
    edit = @Edit(title = "描述", type = EditType.MARKDOWN)
)
private String markdown;
```

> 字段建议加 `@Lob` 注解，避免内容过长超出数据库默认列长度限制。
