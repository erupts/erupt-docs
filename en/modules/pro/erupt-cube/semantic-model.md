# Semantic Modeling

EruptCube is the **zero-code data analysis capability** of the Erupt framework. By adding annotations to a Java class, you automatically get an analysis view with multi-dimensional drill-down and metric aggregation — no frontend code required.

## Quick Start

Three steps to a working analysis module:

**Step 1: create a Cube class and bind a data source**

```java
@EruptCube(name = "Order Analysis", sql = "order_info", sqlType = SqlType.TABLE_NAME)
public class OrderCube {
    // ...
}
```

**Step 2: declare dimensions (for grouping and filtering)**

```java
@Dimension(title = "Channel")
private String channel;

@Dimension(title = "Order Time")
private Date createTime;
```

**Step 3: declare measures (aggregations)**

```java
@Measure(title = "Order Count", sql = "count(*)")
private Long orderCount;

@Measure(title = "Total Amount", sql = "sum(amount)")
private Double totalAmount;
```

On startup, Erupt automatically registers the class as an analysis view and renders it in the UI.

## Annotation Reference

### @EruptCube — declare a data cube

Placed on the class; defines the data source and base configuration.

```java
@EruptCube(
    name        = "Display Name",       // required
    sql         = "SQL or table name",  // required
    sqlType     = SqlType.SUB_QUERY,    // default; use TABLE_NAME for a single table
    description = "",
    explores    = { @Explore(code = "overview", name = "Overview") },
    tags        = {},
    dataProxy   = {}
)
```

| Attribute | Description | Default |
| --- | --- | --- |
| `name` | Display name in UI | required |
| `sql` | Sub-query SQL or table name | required |
| `sqlType` | Source type, see below | `SUB_QUERY` |
| `description` | Description text | `""` |
| `explores` | Exposed query views | overview |
| `tags` | Tags for UI grouping | `{}` |
| `dataProxy` | Data proxy handlers | `{}` |
| `datasource` | Target data source (multi-datasource setups) | `""` |

**Choosing sqlType:**

| Scenario | sqlType | What to put in `sql` |
| --- | --- | --- |
| Single table, no JOIN | `SqlType.TABLE_NAME` | Table name, e.g. `"order_info"` |
| Multi-table JOIN or complex query | `SqlType.SUB_QUERY` (default) | Full SELECT statement |

### @Dimension — declare a dimension

Placed on a field; describes a categorical column used for grouping and filtering.

```java
@Dimension(
    title = "Channel",   // required, display name
    sql   = "channel",   // SQL column; falls back to the field name when empty
    type  = FieldType.AUTO
)
private String channel;
```

| Attribute | Description | Default |
| --- | --- | --- |
| `title` | Display name in UI | required |
| `sql` | SQL column or expression | `""` (field name) |
| `type` | Data type, see below | `AUTO` |
| `hidden` | Hide in UI | `false` |
| `tags` | Tags | `{}` |

:::warning Note
In multi-table JOIN scenarios, if a column has an alias (`column AS alias`), `sql` must be the alias, not the original column name.
:::

### @Measure — declare a measure

Placed on a field; must use an aggregate function.

```java
@Measure(
    title = "Order Count",  // required, display name
    sql   = "count(*)"      // required, aggregate SQL expression
)
private Long orderCount;
```

| Attribute | Description | Default |
| --- | --- | --- |
| `title` | Display name in UI | required |
| `sql` | Aggregate expression | required |
| `type` | Data type | `AUTO` |
| `hidden` | Hide in UI | `false` |

**Common aggregate expressions:**

```java
sql = "count(*)"                                       // row count
sql = "count(distinct user_id)"                        // distinct count
sql = "sum(amount)"                                    // sum
sql = "avg(duration)"                                  // average
sql = "max(score)"                                     // max
sql = "min(price)"                                     // min
sql = "sum(case when success then 1 else 0 end)"       // conditional count (successes)
sql = "sum(case when not success then 1 else 0 end)"   // conditional count (failures)
sql = "round(sum(amount) / count(*), 2)"               // compound expression (avg order value)
```

### @Parameter — declare a query parameter

Placed on a field; passes a filter value at runtime, injected into the SQL WHERE clause automatically.

```java
@Parameter(
    title = "Status",
    type  = FieldType.STRING,
    vl    = {
        @VL(value = "1", label = "Done"),
        @VL(value = "0", label = "Pending")
    }
)
private String status;
```

### FieldType — data types

With `type = FieldType.AUTO`, the framework infers the type from the Java field type:

| Java type | Inferred as |
| --- | --- |
| `Short` / `Integer` / `Long` / `Double` / `Float` | `NUMBER` |
| `Date` / `LocalDateTime` / `LocalDate` | `DATE` |
| Others (`String`, `Boolean`, enums, ...) | `STRING` |

### @Explore — query views

Configured in the `explores` attribute of `@EruptCube`; defines multiple analysis views from different angles.

```java
@EruptCube(
    name = "Order Analysis",
    sql  = "order_info",
    sqlType = SqlType.TABLE_NAME,
    explores = {
        @Explore(code = "all",      name = "All Orders"),
        @Explore(code = "finished", name = "Completed", where = "status = 1"),
        @Explore(code = "failed",   name = "Cancelled", where = "status = 0")
    }
)
```

| Attribute | Description | Default |
| --- | --- | --- |
| `code` | Unique identifier | required |
| `name` | Display name in UI | required |
| `where` | Extra WHERE condition (ANDed automatically) | `""` |
| `parameters` | Fixed view parameters, see `@ExploreParameter` | `{}` |
| `joins` | Joins to other cubes | `{}` |
| `dimensions` | Dimensions shown in this view; empty = all | `{}` |
| `measures` | Measures shown in this view; empty = all | `{}` |

## Complete Examples

### Example 1: single table reference

```java
@EruptCube(
    name    = "User Login Log",
    sql     = "e_upms_login_log",
    sqlType = SqlType.TABLE_NAME
)
public class LoginLogCube {

    @Dimension(title = "Username", sql = "user_name")
    private String userName;

    @Dimension(title = "IP Address", sql = "ip")
    private String ip;

    @Dimension(title = "Browser", sql = "browser")
    private String browser;

    @Dimension(title = "Login Time", sql = "login_time")
    private Date loginTime;

    @Measure(title = "Login Count", sql = "count(*)")
    private Long count;
}
```

### Example 2: multi-table JOIN sub-query

```java
@EruptCube(
    name = "Notification Log Analysis",
    sql  = """
        select detail.status,
               detail.success,
               detail.create_time,
               detail.channel,
               detail.receive_user_id,
               log.title,
               scene.name
        from e_notice_log_detail detail
               inner join e_notice_log log on detail.notice_log_id = log.id
               inner join e_notice_scene scene on log.notice_scene_id = scene.id
        """
)
public class NoticeLogCube {

    @Dimension(title = "Scene", sql = "name")   // use the alias/column name, not the field name
    private String name;

    @Dimension(title = "Channel", sql = "channel")
    private String channel;

    @Dimension(title = "Success", sql = "success")
    private Boolean success;

    @Dimension(title = "Create Time", sql = "create_time")
    private Date createTime;

    @Measure(title = "Total", sql = "count(*)")
    private Long count;

    @Measure(title = "Successes", sql = "sum(case when success then 1 else 0 end)")
    private Long successCount;

    @Measure(title = "Failures", sql = "sum(case when not success then 1 else 0 end)")
    private Long failCount;

    @Measure(title = "Unique Receivers", sql = "count(distinct receive_user_id)")
    private Long uniqueReceivers;
}
```

### Example 3: sharing a class with an @Erupt entity

When a table needs both a CRUD management page and an analysis view, put both annotations on the same class:

```java
@Entity
@Table(name = "e_upms_operate_log")
@Erupt(name = "Operation Log", ...)
@EruptCube(name = "Operation Log Analysis", sql = "e_upms_operate_log", sqlType = SqlType.TABLE_NAME)
public class EruptOperateLog extends BaseModel {

    // @Dimension and @EruptField can annotate the same field
    @Dimension(title = "Operator", sql = "operate_user")
    @EruptField(views = @View(title = "Operator"), ...)
    private String operateUser;

    // in a JPA entity, measure fields must be @Transient to avoid ORM mapping
    @Transient
    @Measure(title = "Operation Count", sql = "count(*)")
    private Long count;

    @Transient
    @Measure(title = "Max Request Time", sql = "max(total_time)")
    private Long maxDuration;
}
```

## Defining Cubes in YAML / JSON Files <Badge type="tip" text="v2.4.0+" />

Besides Java annotations, a cube can be written as a YAML or JSON file, so analysis models can be added or adjusted without compiling. On startup, after the annotation scan, every file matching `cube/**/*.yml`, `*.yaml` and `*.json` on the classpath is loaded; the locations are configurable (Spring resource patterns, `classpath*:` and `file:` both work):

```yaml
erupt:
  cube:
    models:
      - classpath*:cube/**/*.yml
      - classpath*:cube/**/*.yaml
      - classpath*:cube/**/*.json
      - file:/opt/app/cubes/*.yml
```

**One file is one cube**, and the structure mirrors the annotations: the `@EruptCube` attributes at the top level, plus `code` (the registry code, defaults to the file name) and three maps keyed by field name — `dimensions` / `measures` / `parameters` — whose values are the attributes of the matching annotation (`@Dimension` / `@Measure` / `@Parameter`).

`src/main/resources/cube/ProductCube.yml`:

```yaml
# yaml-language-server: $schema=https://docs.erupt.xyz/schema/erupt-cube.schema.json
name: Product Stock
datasource: test            # omit to use the primary datasource
sql: |
  SELECT * FROM (
      SELECT 'AS' AS region_code, 'Phone' AS product, 3 AS qty UNION ALL
      SELECT 'EU',                'Laptop',           2        UNION ALL
      SELECT 'NA',                'Phone',            5
  ) t_stock
  #if($query.parameter && $query.parameter.min_qty)
  WHERE qty >= $query.parameter.min_qty
  #end
explores:
  - code: overview
    name: Overview
  - code: with_region
    name: With Region
    joins:
      - cube: RegionCube    # the join target is a cube code, annotated or file-defined
        type: left join
        on: ProductCube.region_code = RegionCube.region_code
        dimensions: [ continent ]
dimensions:
  region_code: { title: Region Code }
  product: { title: Product }
measures:
  qty: { title: Quantity, sql: sum(qty) }
parameters:
  min_qty: { title: Min Quantity, type: NUMBER }
```

The same kind of cube in JSON (the `$schema` key is for the IDE only and ignored by the loader):

```json
{
  "$schema": "https://docs.erupt.xyz/schema/erupt-cube.schema.json",
  "code": "ChannelCube",
  "name": "Channel Traffic",
  "sql": "SELECT 'web' AS channel, 120 AS visits UNION ALL SELECT 'app', 80",
  "dimensions": {
    "channel": { "title": "Channel" }
  },
  "measures": {
    "visits": { "title": "Visits", "sql": "sum(visits)" }
  }
}
```

**IDE completion and validation**: a JSON Schema generated from the cube annotations is published at [https://docs.erupt.xyz/schema/erupt-cube.schema.json](https://docs.erupt.xyz/schema/erupt-cube.schema.json). Add the `# yaml-language-server: $schema=...` comment as the first line of a YAML file or a `"$schema"` key to a JSON file, and VS Code (YAML extension) or IntelliJ provide attribute completion, enum hints and required-attribute checks.

**Rules**: files are parsed and validated at startup; any error fails the startup and names the file and the reason:

- Attribute names are exactly the annotation attributes. `name` and `sql` are required, as are `@Measure.sql`, `@Explore.code` / `name` and `@Join.cube` / `on`; an attribute the annotation does not have is reported as `Unknown attribute`.
- Enums (`sqlType`, `type`, ...) take the enum name, case-insensitively: `TABLE_NAME` or `table_name`.
- `code` and the dimension / measure / parameter names must be identifiers (letters, digits, underscore, not starting with a digit): they become SQL aliases and template variable names. A code may not be duplicated between annotated and file-defined cubes.
- A dimension or parameter without `type` is `STRING`, a measure without `type` is `NUMBER` (there is no Java field to infer from).
- `cube` in `joins` is the target cube's code (the class name for an annotated cube), spelled exactly; join targets are verified once every cube is registered.
- `dataProxy` takes fully qualified class names implementing `CubeProxy`.
- YAML is read with 1.2 rules: only `true` / `false` are booleans, so `on:` (the join condition) stays an ordinary key; plain scalars are always strings, so `010`, `12:30` and `2026-01-05` are not rewritten; duplicate keys are rejected.
- A file with `expose: false` is skipped.

## FAQ

### Q: What if the field name differs from the SQL column name?

Set `@Dimension(sql = "column or alias")` to the actual column or `AS` alias in the SQL; the Java field name is free-form.

```java
// SQL: select create_time as ct from ...
@Dimension(title = "Create Time", sql = "ct", type = FieldType.DATE)
private Date createTime;  // field name is arbitrary; the sql attribute drives the mapping
```

### Q: Plain Cube class vs. JPA entity?

- **Plain Cube class** (no BaseModel, no @Entity): measure fields do **not** need `@Transient`
- **JPA entity** (with @Entity): measure fields **must** have `@Transient`, otherwise JPA tries to map the virtual column

### Q: Boolean dimension displays oddly?

With `FieldType.AUTO`, `Boolean` fields are inferred as `STRING` (grouped by the strings `"true"`/`"false"`). This is expected behavior — no action needed.

### Q: How do I define multiple analysis perspectives on the same data?

Configure multiple `@Explore` entries in `explores`; each view can carry its own `where` condition to implement fixed filters like "all", "successful", "failed".
