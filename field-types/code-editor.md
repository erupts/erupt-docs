# 代码编辑器 CODE_EDITOR

带语法高亮的代码编辑器，支持多种编程语言，适合存储 SQL、JSON、脚本等代码内容。

## 基础用法

```java
@EruptField(
    views = @View(title = "SQL"),
    edit = @Edit(title = "SQL", type = EditType.CODE_EDITOR,
                 codeEditType = @CodeEditorType(language = "sql"))
)
private String code;
```

## 配置项

```java
public @interface CodeEditorType {

    String language(); // 语言模式（必填），如 sql / javascript / java / json / xml / text 等

    int height() default 300; // 编辑器高度（px）

}
```

## 示例

JSON 编辑：

```java
@EruptField(
    edit = @Edit(title = "配置内容", type = EditType.CODE_EDITOR,
                 codeEditType = @CodeEditorType(language = "json"))
)
private String config;
```

自定义高度：

```java
@EruptField(
    edit = @Edit(title = "脚本", type = EditType.CODE_EDITOR,
                 codeEditType = @CodeEditorType(language = "javascript", height = 500))
)
private String script;
```
