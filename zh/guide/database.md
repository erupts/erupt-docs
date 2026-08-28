# 数据源支持

erupt 支持市面上所有主流数据库，甚至支持 MongoDB，也可自定义数据源。

![数据源支持](/database/img.png)

> **注意：** 使用前需导入数据库所依赖的 JDBC 包！

以下示例仅提供基础的使用模板，具体参数值需通过实际情况修改，各数据库在 `application.yml` 中的配置如下：

:::tip 关于方言（dialect）
erupt 2.x 基于 Spring Boot 3.5.16，底层为 **Hibernate 6.6**。Hibernate 6 会在启动时根据 JDBC 元数据**自动探测数据库方言**，
因此**通常无需手动配置 `spring.jpa.database-platform`**——erupt 自带的 erupt-sample、erupt-test、erupt-docker 三套配置文件均未配置该项。

仅在自动探测结果不符合预期，或需要固定某个方言实现时才显式指定，且**必须使用 Hibernate 6 中真实存在的类名**（见文末[方言对照表](#方言对照表)）。
Hibernate 3/4/5 时代的 `MySQL5InnoDBDialect`、`Oracle10gDialect`、`SQLServer2008Dialect`、`PostgreSQL9Dialect` 等类
在 Hibernate 6 中已被删除，继续配置会导致启动时抛出 `ClassNotFoundException`。
:::

## MySQL

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

## Oracle

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

## SQL Server

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

## PostgreSQL

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

## H2

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
    database: h2
```

## DB2

```yaml
spring:
  datasource:
    url: jdbc:db2://127.0.0.1:50000/erupt
    username: admin
    password: 123456
  jpa:
    show-sql: true
    generate-ddl: true
    database: db2
```

## 达梦

```yaml
spring:
  datasource:
    url: jdbc:dm://127.0.0.1:6236/erupt
    username: SYSDBA
    password: SYSDBA
  jpa:
    show-sql: true
    generate-ddl: true
    database-platform: org.hibernate.dialect.DmDialect
```

```xml
<dependency>
  <groupId>com.dameng</groupId>
  <artifactId>DmJdbcDriver18</artifactId>
  <version>8.1.3.140</version>
</dependency>
<!-- 达梦方言由达梦官方提供，达梦目前发布到 hibernate6.2（兼容 Hibernate 6.x），版本号请以官方最新为准。
     如 erupt 升级了 Hibernate 版本请参考：https://central.sonatype.com/search?q=DmDialect-for-hibernate&smo=true -->
<dependency>
  <groupId>com.dameng</groupId>
  <artifactId>DmDialect-for-hibernate6.2</artifactId>
  <version>8.1.2.192</version>
</dependency>
```

## MongoDB

erupt 作为通用数据管理框架，不限于仅支持关系型数据库，也支持 MongoDB。

详见：[NoSQL数据源 erupt-mongodb](/zh/modules/erupt-mongodb)

## 自定义数据源

erupt 定位是通用数据管理框架，所以将自定义数据源能力开放，希望此功能能为 erupt 生态创建无限可能！

## 其他数据库

erupt 关系型数据库管理是通过 hibernate 实现的，hibernate 所支持的数据库众多，以上几种数据库已实际验证无问题，其他数据库应该也可以兼容。

## 方言对照表

:::warning
再次强调：**绝大多数场景无需配置方言**，Hibernate 6 会自动探测。下表仅供必须显式指定时查阅。
:::

### Hibernate 6.6 内置方言

以下方言由 `hibernate-core` 提供（包名 `org.hibernate.dialect`），随 erupt 依赖开箱可用：

| RDBMS | 方言类名 | 最低数据库版本 |
| :--- | :--- | :---: |
| MySQL | `org.hibernate.dialect.MySQLDialect` | 8.0 |
| MariaDB | `org.hibernate.dialect.MariaDBDialect` | 10.4 |
| TiDB | `org.hibernate.dialect.TiDBDialect` | 5.4 |
| PostgreSQL | `org.hibernate.dialect.PostgreSQLDialect` | 12.0 |
| EDB Postgres Plus | `org.hibernate.dialect.PostgresPlusDialect` | 12.0 |
| CockroachDB | `org.hibernate.dialect.CockroachDialect` | 22.2 |
| Oracle | `org.hibernate.dialect.OracleDialect` | 19.0 |
| Microsoft SQL Server | `org.hibernate.dialect.SQLServerDialect` | 11.0 |
| Azure SQL | `org.hibernate.dialect.AzureSQLServerDialect` | 11.0 |
| DB2 | `org.hibernate.dialect.DB2Dialect` | 10.5 |
| DB2 for IBM i | `org.hibernate.dialect.DB2iDialect` | 7.1 |
| DB2 for z/OS | `org.hibernate.dialect.DB2zDialect` | 12.1 |
| H2 | `org.hibernate.dialect.H2Dialect` | 2.1.214 |
| HSQLDB | `org.hibernate.dialect.HSQLDialect` | 2.6.1 |
| Apache Derby | `org.hibernate.dialect.DerbyDialect` | 10.15.2 |
| SAP HANA | `org.hibernate.dialect.HANADialect` | — |
| Sybase | `org.hibernate.dialect.SybaseDialect` | 16.0 |
| Sybase ASE | `org.hibernate.dialect.SybaseASEDialect` | 16.0 |
| Google Spanner | `org.hibernate.dialect.SpannerDialect` | — |

### 社区方言

Hibernate 6 将不再由 Hibernate 团队维护的方言迁出了 `hibernate-core`，改为放在独立的
`org.hibernate.orm:hibernate-community-dialects` 依赖中（包名 `org.hibernate.community.dialect`）。
如需 SQLite、Firebird、Informix、Ingres、CUBRID、Altibase、MimerSQL、Teradata、TimesTen、SingleStore、Sybase Anywhere
等数据库的方言，需额外引入该依赖：

```xml
<dependency>
  <groupId>org.hibernate.orm</groupId>
  <artifactId>hibernate-community-dialects</artifactId>
</dependency>
```

该依赖的版本由 Spring Boot 的依赖管理统一控制，无需手动指定。

:::danger
Hibernate 3/4/5 时代的以下类名在 Hibernate 6 中**已全部删除**，配置后启动会抛 `ClassNotFoundException`：
`MySQL5InnoDBDialect`、`MySQLInnoDBDialect`、`MySQLMyISAMDialect`、`Oracle9Dialect`、`Oracle10gDialect`、
`SQLServer2008Dialect`、`PostgreSQL9Dialect`、`DB2390Dialect`、`SAPDBDialect`、`MckoiDialect`、
`InterbaseDialect`、`PointbaseDialect`、`FrontbaseDialect`、`ProgressDialect` 等。
:::

> 完整方言清单以 Hibernate 官方文档为准：<https://docs.hibernate.org/orm/6.6/dialect/>
