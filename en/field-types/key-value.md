# Key-Value Pairs KEY_VALUE <Badge type="tip" text="v2.3.0+" />

A key-value pair editor: rows of key / value text inputs with an "add row" footer. Suits loosely structured settings such as HTTP headers, environment variables or extension parameters.

The field can be declared in two ways:

- `String`: holds the JSON object text, e.g. `{"timeout":"30","retry":"3"}`
- `Map<String, String>`: mapped to a JSON column with `@JdbcTypeCode(SqlTypes.JSON)`, receives the object directly

Rows with an empty key are dropped on save; key suggestions from `keys` are offered via autocomplete while typing; duplicate keys are flagged.

## Basic Usage

```java
@JdbcTypeCode(SqlTypes.JSON)
@EruptField(
    views = @View(title = "Params"),
    edit = @Edit(title = "Params", type = EditType.KEY_VALUE)
)
private Map<String, String> params;
```

Storing the JSON text in a `String` field:

```java
@Column(length = 2000)
@EruptField(
    views = @View(title = "Params"),
    edit = @Edit(title = "Params", type = EditType.KEY_VALUE)
)
private String params;
```

:::warning
Do not put `@JdbcTypeCode(SqlTypes.JSON)` on a `String` field: Hibernate would double-encode the JSON text. The code generator and the designer's code export always emit the `Map<String, String>` + JSON column form.
:::

## Configuration

```java
public @interface KeyValueType {

    String keyPlaceholder() default "";   // Placeholder of the key column; empty uses the built-in translated text

    String valuePlaceholder() default ""; // Placeholder of the value column; empty uses the built-in translated text

    int max() default 0;                  // Maximum number of pairs, 0 for unlimited

    String[] keys() default {};           // Fixed key suggestions offered while typing, e.g. {"Content-Type", "Authorization"}

}
```

## Table Display

When the `@View` type is `AUTO` it resolves to `ViewType.KEY_VALUE`, and the table column renders one `key: value` tag per pair.

:::info
`KEY_VALUE` is not included in Excel import / export.
:::

## Example

With key suggestions and a row cap (from `Demo` in `erupt-sample`):

```java
@JdbcTypeCode(SqlTypes.JSON)
@EruptField(
    views = @View(title = "Params"),
    edit = @Edit(title = "Params", type = EditType.KEY_VALUE,
                 keyValueType = @KeyValueType(keys = {"timeout", "retry", "region"}, max = 10))
)
private Map<String, String> paramsVal;
```
