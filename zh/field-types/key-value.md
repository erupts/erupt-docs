# 键值对 KEY_VALUE <Badge type="tip" text="v2.3.0+" />

键值对编辑器，以多行「键 / 值」输入框编辑一组文本对，底部可追加行。适合 HTTP 请求头、环境变量、扩展参数等结构不固定的配置。

字段类型有两种写法：

- `String`：保存 JSON 对象文本，如 `{"timeout":"30","retry":"3"}`
- `Map<String, String>`：配合 `@JdbcTypeCode(SqlTypes.JSON)` 映射到 JSON 列，直接接收对象

保存时会丢弃键为空的行；输入键时会根据 `keys` 给出自动补全建议；重复的键会被标记提示。

## 基础用法

```java
@JdbcTypeCode(SqlTypes.JSON)
@EruptField(
    views = @View(title = "参数"),
    edit = @Edit(title = "参数", type = EditType.KEY_VALUE)
)
private Map<String, String> params;
```

使用 `String` 字段存储 JSON 文本：

```java
@Column(length = 2000)
@EruptField(
    views = @View(title = "参数"),
    edit = @Edit(title = "参数", type = EditType.KEY_VALUE)
)
private String params;
```

:::warning
`String` 字段不要再加 `@JdbcTypeCode(SqlTypes.JSON)`，否则 Hibernate 会对 JSON 文本二次编码。代码生成器与设计器导出的代码统一采用 `Map<String, String>` + JSON 列的写法。
:::

## 配置项

```java
public @interface KeyValueType {

    String keyPlaceholder() default "";   // 键列占位文本，为空时使用内置多语言文案

    String valuePlaceholder() default ""; // 值列占位文本，为空时使用内置多语言文案

    int max() default 0;                  // 最大键值对数量，0 表示不限制

    String[] keys() default {};           // 输入键时的固定候选项，如 {"Content-Type", "Authorization"}

}
```

## 表格展示

`@View` 类型为 `AUTO` 时会自动解析为 `ViewType.KEY_VALUE`，表格列以 `键: 值` 标签逐对展示。

:::info
`KEY_VALUE` 不参与 Excel 导入导出。
:::

## 示例

带候选键与数量上限（来自 `erupt-sample` 的 `Demo`）：

```java
@JdbcTypeCode(SqlTypes.JSON)
@EruptField(
    views = @View(title = "参数"),
    edit = @Edit(title = "参数", type = EditType.KEY_VALUE,
                 keyValueType = @KeyValueType(keys = {"timeout", "retry", "region"}, max = 10))
)
private Map<String, String> paramsVal;
```
