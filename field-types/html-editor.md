# 富文本编辑器 HTML_EDITOR

所见即所得的富文本编辑器，内容以 HTML 字符串形式存储，适合图文混排的长文本内容。

## 基础用法

```java
@Lob
@EruptField(
    views = @View(title = "富文本"),
    edit = @Edit(title = "富文本", type = EditType.HTML_EDITOR,
                 htmlEditorType = @HtmlEditorType(value = HtmlEditorType.Type.CKEDITOR))
)
private String htmlContent;
```

> 字段建议加 `@Lob` 注解，避免内容过长超出数据库默认列长度限制。

## 配置项

```java
public @interface HtmlEditorType {

    Type value(); // 编辑器类型（必填）

    String path() default ""; // 上传文件的存储子路径

    enum Type {
        CKEDITOR, // CKEditor
        UEDITOR,  // UEditor（百度）
    }

}
```
