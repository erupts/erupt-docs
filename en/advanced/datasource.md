# Multiple Data Sources (@EruptDataSource)

## Multiple Data Sources with @EruptDataSource

### Usage

1. Add the additional data source connection settings to `application.yml` (the primary data source config must remain):

::: tip About database-platform
Erupt 2.x runs on Hibernate 6, which auto-detects the dialect from the JDBC connection — `database-platform` is usually unnecessary. If you do need to set it, use a class name that actually exists in Hibernate 6; see the [Dialect Reference](/en/guide/database#dialect-reference).
:::

```yaml
erupt:
  dbs:
    # mysql
    - datasource:
        # The name attribute is required — it identifies each data source
        name: mysql_test
        url: jdbc:mysql://127.0.0.1:3306/mysql?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai
        username: root
        password: 123456
      jpa:
        show-sql: true
        database: mysql
      scanPackages: com.abc.xxx
    # oracle
    - datasource:
        name: oracle_test
        url: jdbc:oracle:thin:@//127.0.0.1:1521/erupt
        username: sys
        password: 123456
      jpa:
        show-sql: true
      scanPackages: com.def.xxx
    # sqlServer
    - datasource:
        name: sqlServer
        url: jdbc:sqlserver://127.0.0.1\erupt:14433;sendStringParametersAsUnicode=false
        username: sa
        password: 123456
      jpa:
        show-sql: true
      scanPackages: com.hig.xxx
```

> **Note: `scanPackages` is required and must not overlap with the primary data source or any other data source's scan path.**
>
> Reason: JPA uses package scan paths to determine which entity classes belong to which data source. Overlapping paths can cause the same entity to be managed by multiple data sources simultaneously, leading to table creation conflicts or data being written to the wrong data source.
>
> Recommended directory structure:
> ```
> com.example.model.main     ← Primary data source entities (@EntityScan points here)
> com.example.model.mysql    ← MySQL secondary data source entities (scanPackages points here)
> com.example.model.oracle   ← Oracle secondary data source entities (scanPackages points here)
> ```

2. Refine the `@EntityScan` configuration in the entry class:

```java
@EntityScan({"xyz.erupt.demo.model"})
@SpringBootApplication
@EruptScan
public class EruptDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(EruptDemoApplication.class, args);
    }

}
```

3. Add the JDBC driver dependency for the corresponding data source (Maven coordinates):

**MySQL**
```xml
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
</dependency>
```

**Oracle**
```xml
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc8</artifactId>
    <version>21.9.0.0</version>
</dependency>
```

**SQL Server**
```xml
<dependency>
    <groupId>com.microsoft.sqlserver</groupId>
    <artifactId>mssql-jdbc</artifactId>
</dependency>
```

**PostgreSQL**
```xml
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
</dependency>
```

4. Add the `@EruptDataSource` annotation to the entity class:

```java
@EruptDataSource("xxxx") // The value must match erupt.dbs.datasource.name in the config file
@Erupt(name = "Table from Secondary Data Source", 
       power = @Power(add = false, delete = false, edit = false))
@Table(name = "help_topic")
@Entity
public class HelpTopic {

    @Id
    @Column(name = "help_topic_id")
    @EruptField
    private String id;

    @EruptField(
            views = @View(title = "Name")
    )
    private String name;

    @EruptField(
            views = @View(title = "Description", type = ViewType.HTML)
    )
    private String description;
    
}
```

### About `jpa` and `scanPackages`

- `erupt.dbs[*].jpa` is a full Spring `JpaProperties`, so `show-sql`, `generate-ddl`, `database`, `database-platform`, `properties.*` and friends are all available. Only `generateDdl`, `database`, `showSql` and `databasePlatform` are handed to the `HibernateJpaVendorAdapter`; everything under `properties` is passed to Hibernate verbatim.
- `erupt.dbs[*].scanPackages` is a **`String[]`** — a single package name, a YAML list, or a comma-separated list all work. It is **required**: leaving it out fails startup with `xxx DataSource not found 'scanPackages' configuration`.

### Connection Pool (HikariCP) Configuration

Secondary data sources under `erupt.dbs[*]` get their own `HikariDataSource`, built by Erupt. Pool settings go under `erupt.dbs[*].datasource.hikari.*` (the primary data source still uses Spring Boot's standard `spring.datasource.hikari.*`):

```yaml
erupt:
  dbs:
    - datasource:
        name: mysql_test
        url: jdbc:mysql://127.0.0.1:3306/mysql
        username: root
        password: 123456
        hikari:
          pool-name: erupt-mysql-test
          max-pool-size: 20
          min-idle: 5
          connection-timeout: 10000
          idle-timeout: 300000
          max-lifetime: 900000
          leak-detection-threshold: 60000
          connection-test-query: select 1
      scanPackages: com.abc.xxx
```

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `pool-name` | String | generated by HikariCP | Pool name, useful for logs and JMX |
| `max-pool-size` | Integer | `10` | Maximum pool size (HikariCP `maximumPoolSize`); `-1` means "don't override" |
| `min-idle` | Integer | same as `max-pool-size` | Minimum idle connections; `-1` means "don't override" |
| `connection-timeout` | Long (ms) | `30000` (30s) | How long to wait for a connection from the pool |
| `validation-timeout` | Long (ms) | `5000` (5s) | Connection validation timeout |
| `idle-timeout` | Long (ms) | `600000` (10 min) | Idle connection retirement time |
| `max-lifetime` | Long (ms) | `1800000` (30 min) | Maximum lifetime of a connection |
| `leak-detection-threshold` | Long (ms) | disabled | Connection leak detection threshold |
| `initialization-fail-timeout` | Long (ms) | `1` | Behavior when the first connection attempt fails at startup |
| `connection-init-sql` | String | none | SQL executed on every new connection |
| `connection-test-query` | String | none | Liveness probe SQL; only needed for old drivers without JDBC4 `isValid` |
| `catalog` | String | none | Default catalog |
| `schema` | String | none | Default schema |
| `transaction-isolation-name` | String | driver default | e.g. `TRANSACTION_READ_COMMITTED` |
| `data-source-class-name` | String | none | Use a `DataSource` implementation instead of `DriverManager` |
| `data-source-jndi-name` | String | none | Look the data source up from JNDI |
| `is-auto-commit` | Boolean | `true` | **Only applied when explicitly set to `false`** |
| `is-read-only` | Boolean | `false` | Read-only pool |
| `is-isolate-internal-queries` | Boolean | `false` | Run internal queries in their own transaction |
| `is-register-mbeans` | Boolean | `false` | Register JMX MBeans |
| `is-allow-pool-suspension` | Boolean | `false` | Allow the pool to be suspended |
| `data-source-properties` | Properties | none | Properties passed through to the underlying `DataSource` |
| `health-check-properties` | Properties | none | Health check properties |

:::warning url / username / password / driver-class-name under `hikari` are ignored
`HikariCpConfig` declares `jdbcUrl`, `username`, `password` and `driverClassName`, but `toHikariConfig()` never reads them. Put connection details one level up, at `erupt.dbs[*].datasource.{url,username,password,driverClassName}` — those four are applied on top of the pool config after it is built.
:::

:::tip Defaults come from HikariCP itself
The defaults above are HikariCP's own built-in defaults. Erupt skips any value equal to the default when building the config (it simply doesn't call the setter), so setting a key to its default is indistinguishable from omitting it — only a different value has any effect.
:::

## Supported Databases

Erupt supports all mainstream databases, including MongoDB, and also supports custom data sources.

> **You must import the JDBC driver dependency for the database before use!**

### MySQL

```yaml
spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/erupt
    username: root
    password: 123456
  jpa:
    show-sql: true
    generate-ddl: true
    database: mysql
```

### Oracle

```yaml
spring:
  datasource:
    url: jdbc:oracle:thin:@//127.0.0.1:1521/erupt
    username: sys
    password: 123456
  jpa:
    show-sql: true
    generate-ddl: true
    database: oracle
```

### SQL Server

```yaml
spring:
  datasource:
    url: jdbc:sqlserver://127.0.0.1:1443;database=erupt
    username: sa
    password: 123456
  jpa:
    show-sql: true
    generate-ddl: true
    database: sql_server
```

### PostgreSQL

```yaml
spring:
  datasource:
    url: jdbc:postgresql://127.0.0.1:5432/erupt
    username: postgres
    password: 123456
  jpa:
    show-sql: true
    generate-ddl: true
    database: postgresql
```

### H2

```yaml
spring:
  datasource:
    url: jdbc:h2:file:./erupt;AUTO_SERVER=TRUE
    platform: h2
    username: sa
    password:
    driverClassName: org.h2.Driver
  jpa:
    show-sql: true
    generate-ddl: true
```

## Custom Data Source with @EruptDataProcessor

By implementing the `IEruptDataService` interface, you can define a custom data source to manage data from external APIs, Elasticsearch, MongoDB, and other non-relational sources.

See: [Custom Data Source](/en/advanced/custom-datasource)
