# Rich Text Editor HTML_EDITOR

A WYSIWYG rich text editor. Content is stored as an HTML string, suitable for long-form content with mixed text and images.

![html-editor](/field-types/html-editor.png)

## Basic Usage

```java
@Lob
@EruptField(
    views = @View(title = "Rich Text"),
    edit = @Edit(title = "Rich Text", type = EditType.HTML_EDITOR,
                 htmlEditorType = @HtmlEditorType(value = HtmlEditorType.Type.CKEDITOR))
)
private String htmlContent;
```

> It is recommended to add the `@Lob` annotation to the field to avoid content exceeding the default column length limit of the database.

## Configuration

```java
public @interface HtmlEditorType {

    Type value(); // Editor type (required)

    String path() default ""; // Storage sub-path for uploaded files

    enum Type {
        CKEDITOR, // CKEditor
        UEDITOR,  // UEditor (Baidu)
    }

}
```
