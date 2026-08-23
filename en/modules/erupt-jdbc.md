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
@Erupt(name = "订单", primaryKeyCol = "id")
@EruptJdbc("t_order")
@EruptDataProcessor(EruptJdbcDataService.DATA_PROCESSOR)
public class Order {

    @EruptField(views = @View(title = "ID"))
    private Long id;

    @EruptField(
        views = @View(title = "订单号"),
        edit = @Edit(title = "订单号", notNull = true, search = @Search)
    )
    private String number;

    @EruptField(
        views = @View(title = "金额"),
        edit = @Edit(title = "金额", type = EditType.NUMBER)
    )
    private BigDecimal amount;

    @EruptField(
        views = @View(title = "下单时间"),
        edit = @Edit(title = "下单时间", type = EditType.DATE_TIME)
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
