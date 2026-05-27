# Multiple Data Sources

## Multiple Data Sources with @EruptDataSource

### Usage

1. Add the additional data source connection settings to `application.yml` (the primary data source config must remain):

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
        database-platform: org.hibernate.dialect.MySQL5InnoDBDialect
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
        database-platform: org.hibernate.dialect.Oracle10gDialect
      scanPackages: com.def.xxx
    # sqlServer
    - datasource:
        name: sqlServer
        url: jdbc:sqlserver://127.0.0.1\erupt:14433;sendStringParametersAsUnicode=false
        username: sa
        password: 123456
      jpa:
        show-sql: true
        database-platform: org.hibernate.dialect.SQLServer2008Dialect
      scanPackages: com.hig.xxx
```

> **Note: `scanPackages` is required and must not overlap with the primary data source or any other data source's scan path.**
>
> Reason: JPA uses package scan paths to determine which entity classes belong to which data source. Overlapping paths can cause the same entity to be managed by multiple data sources simultaneously, leading to table creation conflicts or data being written to the wrong data source.
>
> Recommended directory structure:
> ```
> com.example.model          ← Primary data source entities (@EntityScan points here)
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
    database-platform: org.hibernate.dialect.MySQL5InnoDBDialect
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
    database-platform: org.hibernate.dialect.Oracle10gDialect
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
    database-platform: org.hibernate.dialect.SQLServer2008Dialect
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
    database-platform: org.hibernate.dialect.PostgreSQL9Dialect
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
    database-platform: org.hibernate.dialect.H2Dialect
    generate-ddl: true
```

## Custom Data Source with @EruptDataProcessor

By implementing the `IEruptDataService` interface, you can define a custom data source to manage data from external APIs, Elasticsearch, MongoDB, and other non-relational sources.

See: [Custom Data Source](/en/advanced/custom-datasource)
