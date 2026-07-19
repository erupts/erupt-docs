# Markdown Editor MARKDOWN

An editor that supports Markdown syntax. Content is stored as a Markdown string, making it ideal for documentation and descriptive content.

![markdown](/field-types/markdown.png)

## Basic Usage

```java
@Lob
@EruptField(
    views = @View(title = "Description"),
    edit = @Edit(title = "Description", type = EditType.MARKDOWN)
)
private String markdown;
```

> It is recommended to annotate the field with `@Lob` to avoid content exceeding the default column length limit of the database.
