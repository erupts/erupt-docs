# Code Editor CODE_EDITOR

A code editor with syntax highlighting (powered by Monaco) that supports multiple programming languages. Suitable for storing SQL, JSON, scripts, and other code content. Supports **keyword-triggered suggestions** (code completion).

![code-editor](/field-types/code-editor.png)

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

    String language(); // Language mode (required), e.g. sql / javascript / java / json / xml / yaml / text

    int height() default 300; // Editor height in pixels

    String[] hints() default {}; // Static suggestion list

    String[] hintParams() default {}; // Parameters passed to hintHandler

    Class<? extends CodeEditHintHandler>[] hintHandler() default {}; // Dynamic suggestion handler

}
```

## Keyword-Triggered Suggestions

As you type keywords in the editor, a suggestion (code completion) popup appears automatically.

:::warning
Suggestions are triggered by **`hintHandler`**: you **must configure a `hintHandler` for suggestions to work**. `hints` is an optional set of static supplementary words — it is only sent alongside the `hintHandler` output and cannot be used on its own.
:::

Suggestions come from two parts, merged into the final list:

- **Dynamic suggestions** `hintHandler` (required): returned at runtime by a backend `CodeEditHintHandler` implementation — ideal when suggestions must be computed dynamically from the database, configuration, or context.
- **Static suggestions** `hints` (optional): fixed candidate words hard-coded in the annotation, merged with the `hintHandler` output.

The backend **merges** `hints` with the output of every `hintHandler` and sends the combined list to the frontend, which caches it once and matches against your input.

### Dynamic Suggestion Handler

Implement the `CodeEditHintHandler` interface and register it as a Spring Bean:

```java
public interface CodeEditHintHandler {

    // Returns the suggestion list; params come from the annotation's hintParams
    List<String> hint(String[] params);

}
```

```java
@Service
public class TableColumnHint implements CodeEditHintHandler {

    @Resource
    private JdbcTemplate jdbcTemplate;

    @Override
    public List<String> hint(String[] params) {
        // params[0] is the table name; dynamically return its column names as suggestions
        return jdbcTemplate.queryForList(
                "select column_name from information_schema.columns where table_name = ?",
                String.class, params[0]);
    }
}
```

Enable it on a field:

```java
@EruptField(
    edit = @Edit(title = "SQL", type = EditType.CODE_EDITOR,
                 codeEditType = @CodeEditorType(
                         language = "sql",
                         hints = {"select", "from", "where", "group by", "order by"}, // static keywords
                         hintHandler = TableColumnHint.class,                          // dynamic column names
                         hintParams = {"sys_user"}                                     // parameters for the handler
                 ))
)
private String sql;
```

:::tip
`hintParams` is a compile-time constant (a static array) that tells the `hintHandler` which kind of suggestions to return; the actual dynamic data is queried inside the `hint()` method.
:::

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
