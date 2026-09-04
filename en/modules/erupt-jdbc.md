# Erupt JDBC Single-Table Data Source

The erupt-data-jdbc module provides a pure JDBC data source, binding an `@Erupt` model to a single database table without JPA or entity mapping. It fits scenarios where you don't want to bring in Hibernate, need to work with legacy tables, or use databases that only ship a JDBC driver (ClickHouse, Doris, TDengine, TiDB, DM, KingbaseES, etc.).

Filtering, sorting, and pagination are all pushed down to SQL (built on Spring's `NamedParameterJdbcTemplate`). Condition values are always bound as named parameters, and condition fields and sort fields must be fields declared in the model — together these prevent SQL injection.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-jdbc</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

You must add the JDBC driver for your target database yourself, and provide a `DataSource` (either the primary data source auto-configured by Spring Boot via `spring.datasource.*`, or a custom named bean).

## The @EruptJdbc Annotation

| Attribute | Default | Description |
| --- | --- | --- |
| `value` | — | Table name |
| `datasource` | `""` | Bean name of an alternate `DataSource`; empty uses the primary data source |

## Usage Example

```java
@Getter
@Setter
@Erupt(name = "Order", primaryKeyCol = "id")
@EruptJdbc("t_order")
@EruptDataProcessor(EruptJdbcDataService.DATA_PROCESSOR)
public class Order {

    @EruptField(views = @View(title = "ID"))
    private Long id;

    @EruptField(
        views = @View(title = "Order No."),
        edit = @Edit(title = "Order No.", notNull = true, search = @Search)
    )
    private String number;

    @EruptField(
        views = @View(title = "Amount"),
        edit = @Edit(title = "Amount", type = EditType.NUMBER)
    )
    private BigDecimal amount;

    @EruptField(
        views = @View(title = "Placed At"),
        edit = @Edit(title = "Placed At", type = EditType.DATE_TIME)
    )
    private LocalDateTime placedAt;
}
```

### Secondary Data Source

Register any `DataSource` bean and reference it by name:

```java
@Configuration
public class ReadOnlyDataSourceConfig {
    @Bean("reporting")
    public DataSource reportingDataSource() { /* build a HikariDataSource */ }
}

@EruptJdbc(value = "v_daily_sales", datasource = "reporting")
public class DailySales { ... }
```

## Supported Operations

Full CRUD: list / detail / add / edit / delete. Pagination uses the `LIMIT / OFFSET` syntax, supported by MySQL, PostgreSQL, H2, SQLite, and MariaDB.

The table is aliased in SQL by the Erupt class name, so drill (Drill) and `@Filter` condition strings (e.g. `Order.number = 'x'`) work exactly the same as they do under the JPA implementation.

:::warning Note
- **Column name = field name.** Java field names must match database column names exactly.
- Conversion between JDBC's `Number` / `Timestamp` / `Date` and Java types (`Integer`, `LocalDateTime`, `LocalDate`, `BigDecimal`, etc.) happens automatically.
:::

## Limits and Boundaries

:::warning Check every one of these before going to production
- **`queryColumn` is an unbounded `select *`.** Excel export, dropdown options and OLAP fetches all go through `queryColumn`, which appends the `where` clause and its parameters but **no row limit whatsoever**. One export click against a ten-million-row table is a full table scan plus the entire result set loaded into the JVM. Narrow the scope first with `@Erupt(filter = ...)`, `DataProxy.beforeFetch()` or a database view — or turn export off with `@Erupt(power = @Power(export = false))`.
- **The model must have a no-arg constructor.** Detail lookups instantiate the model reflectively via `getDeclaredConstructor().newInstance()`, so a class with only a parameterized constructor throws as soon as the detail / edit dialog opens. With Lombok, make sure you didn't add `@AllArgsConstructor` without `@NoArgsConstructor`.
- **`null` fields are dropped on insert.** `addData` removes every field whose value is `null` before building the `insert`, so those columns fall back to the database `DEFAULT`. A `NOT NULL` column with no default will fail the insert outright.
- **`null` fields are written on update.** The opposite of insert: `editData` puts every non-primary-key field — including `null` ones — into the `set` clause. Fields not shown or not filled in on the form get overwritten with `NULL`, so be careful with models that expose only a subset of the table's columns.
- **The pagination syntax is not portable.** Paging always concatenates `limit {pageSize} offset {offset}`, which works on MySQL, MariaDB, PostgreSQL, H2, SQLite and ClickHouse, but **Oracle and SQL Server do not accept it** — list queries fail with a SQL syntax error. Use the JPA data source for those, or put a compatible view in front.
- **`conditionStrings` are concatenated into the SQL verbatim.** Condition strings from `@Filter` and `@Link` drill-down are appended as-is (their values are not bound as parameters). They originate from server-side annotations rather than user input, but never put a user-controlled string into a `@Filter` expression. Frontend search conditions are unaffected: condition fields are validated against the model's field list, and condition values are always bound as named parameters.
:::
