# Data Sources

:::warning Note
**If your dataset exceeds 1 million rows, always use an OLAP warehouse as the data source!**
:::

All mainstream data warehouses and relational databases are supported out of the box — no extra adaptation needed, whether for OLAP analytics or OLTP business scenarios.

| Type | Products |
| --- | --- |
| Analytical warehouses (OLAP) | Apache Doris, StarRocks, ClickHouse, GreenPlum, Apache Hive, Presto, Trino, Impala, ADB |
| Relational databases (OLTP) | MySQL, PostgreSQL, Oracle, SQL Server, TiDB |
| Chinese databases | DM (Dameng), KingbaseES, OceanBase |
| Cloud-native warehouses | Alibaba Cloud MaxCompute, Huawei Cloud DWS |

## Configuration

```yaml
erupt:
  cube:
    show-sql: true    # log generated SQL (default true)
    # configure data sources
    datasource:
      h2:             # datasource name, referenced by the datasource attribute of @EruptCube
        jdbc-url: jdbc:h2:file:./erupt
        driver-class-name: org.h2.Driver
        username: sa
        password:
        # ... any HikariConfig property
```

:::tip
If no extra data source is configured, the current Spring Boot default data source is used as the query engine (the SQL dialect is detected dynamically from the jdbc-url).

Datasource entries are based on HikariCP (`HikariConfig`), so any HikariCP connection pool property is valid.
:::
