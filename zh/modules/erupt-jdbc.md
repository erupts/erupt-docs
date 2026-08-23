# Erupt JDBC 单表数据源

erupt-data-jdbc 模块提供纯 JDBC 数据源支持，无需 JPA / 实体映射即可将 `@Erupt` 模型绑定到单张数据库表。适用于不想引入 Hibernate、对接遗留库表，或使用只有 JDBC 驱动的数据库（ClickHouse、Doris、TDengine、TiDB、达梦、人大金仓等）的场景。

筛选、排序、分页均下推为 SQL 执行（基于 Spring 的 `NamedParameterJdbcTemplate`）。条件值始终以命名参数绑定，条件字段与排序字段必须是模型中声明的字段——两者共同防止 SQL 注入。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-jdbc</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

需自行添加目标数据库的 JDBC 驱动，并提供 `DataSource`（Spring Boot 通过 `spring.datasource.*` 自动配置的主数据源，或自定义的命名 Bean）。

## @EruptJdbc 注解

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `value` | — | 表名 |
| `datasource` | `""` | 备用 `DataSource` 的 Bean 名称，为空使用主数据源 |

## 使用示例

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

### 第二数据源

注册任意 `DataSource` Bean 并按名称引用：

```java
@Configuration
public class ReadOnlyDataSourceConfig {
    @Bean("reporting")
    public DataSource reportingDataSource() { /* 构建 HikariDataSource */ }
}

@EruptJdbc(value = "v_daily_sales", datasource = "reporting")
public class DailySales { ... }
```

## 操作支持

完整 CRUD：列表 / 详情 / 新增 / 修改 / 删除。分页使用 `LIMIT / OFFSET` 语法，MySQL、PostgreSQL、H2、SQLite、MariaDB 均支持。

表在 SQL 中以 Erupt 类名作为别名，因此钻取（Drill）与 `@Filter` 条件串（如 `Order.number = 'x'`）可与 JPA 实现下完全一致地使用。

:::warning 注意
- **列名 = 字段名**，Java 字段名需与数据库列名完全一致。
- JDBC 的 `Number` / `Timestamp` / `Date` 与 Java 类型（`Integer`、`LocalDateTime`、`LocalDate`、`BigDecimal` 等）之间的转换自动完成。
:::
