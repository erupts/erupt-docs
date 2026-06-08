# Code Editor CODE_EDITOR

A code editor with syntax highlighting that supports multiple programming languages. Suitable for storing SQL, JSON, scripts, and other code content.

## Basic Usage

```java
@EruptField(
    views = @View(title = "SQL"),
    edit = @Edit(title = "SQL", type = EditType.CODE_EDITOR,
                 codeEditType = @CodeEditorType(language = "sql"))
)
private String code;
```

## Configuration

```java
public @interface CodeEditorType {

    String language(); // Language mode (required), e.g. sql / javascript / java / json / xml / text

    int height() default 300; // Editor height in pixels

}
```

## Examples

JSON editing:

```java
@EruptField(
    edit = @Edit(title = "Configuration", type = EditType.CODE_EDITOR,
                 codeEditType = @CodeEditorType(language = "json"))
)
private String config;
```

Custom height:

```java
@EruptField(
    edit = @Edit(title = "Script", type = EditType.CODE_EDITOR,
                 codeEditType = @CodeEditorType(language = "javascript", height = 500))
)
private String script;
```
