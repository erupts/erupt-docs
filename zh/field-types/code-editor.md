# 代码编辑器 CODE_EDITOR

带语法高亮的代码编辑器（基于 Monaco），支持多种编程语言，适合存储 SQL、JSON、脚本等代码内容。支持**关键字触发联想词**（代码补全）。

![code-editor](/field-types/code-editor.png)

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

    String language(); // 语言模式（必填），如 sql / javascript / java / json / xml / yaml / text 等

    int height() default 300; // 编辑器高度（px）

    String[] hints() default {}; // 静态联想词列表

    String[] hintParams() default {}; // 传递给 hintHandler 的参数

    Class<? extends CodeEditHintHandler>[] hintHandler() default {}; // 动态联想词处理器

}
```

## 关键字触发联想

在编辑器中输入关键字时，会自动弹出联想词（代码补全）浮层。

:::warning
联想功能由 **`hintHandler`** 触发：**必须配置 `hintHandler`，联想才会生效**。`hints` 是可选的静态补充词，仅在配置了 `hintHandler` 时随其返回结果一并下发，不能单独使用。
:::

联想词来源有两部分，最终合并展示：

- **动态联想词** `hintHandler`（必需）：运行时由后端 `CodeEditHintHandler` 实现类返回，适合联想词需要从数据库、配置或上下文动态计算的场景。
- **静态联想词** `hints`（可选）：直接在注解中写死的固定候选词，与 `hintHandler` 的返回结果合并。

后端会将 `hints` 与所有 `hintHandler` 的返回结果**合并**后一并下发，前端缓存一次，输入时匹配。

### 动态联想词处理器

实现 `CodeEditHintHandler` 接口，并注册为 Spring Bean：

```java
public interface CodeEditHintHandler {

    // 返回联想词列表，params 即注解中的 hintParams
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
        // params[0] 为表名，动态返回该表的字段名作为联想词
        return jdbcTemplate.queryForList(
                "select column_name from information_schema.columns where table_name = ?",
                String.class, params[0]);
    }
}
```

在字段上启用：

```java
@EruptField(
    edit = @Edit(title = "SQL", type = EditType.CODE_EDITOR,
                 codeEditType = @CodeEditorType(
                         language = "sql",
                         hints = {"select", "from", "where", "group by", "order by"}, // 静态关键字
                         hintHandler = TableColumnHint.class,                          // 动态字段名
                         hintParams = {"sys_user"}                                     // 传给 handler 的参数
                 ))
)
private String sql;
```

:::tip
`hintParams` 是编译期常量（静态数组），用于告知 `hintHandler` 应返回哪一类联想词；真正的动态数据在 `hint()` 方法内查询获得。
:::

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
