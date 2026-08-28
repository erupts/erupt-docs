# Database Support

Erupt supports all mainstream relational databases, MongoDB, and custom data sources.

![Database support](/database/img.png)

> **Note:** Import the corresponding JDBC driver dependency before use.

The snippets below are minimal templates — adjust the values to your environment. The configuration for each database in `application.yml` is as follows.

:::tip About dialects
Erupt 2.x runs on Spring Boot 3.5.16, which brings **Hibernate 6.6**. Hibernate 6 **auto-detects the database dialect**
from JDBC metadata at startup, so **you normally do not need to set `spring.jpa.database-platform` at all** — none of
Erupt's own configurations (erupt-sample, erupt-test, erupt-docker) declare it.

Only set it explicitly when auto-detection picks the wrong dialect or you want to pin a specific implementation, and
**only use class names that actually exist in Hibernate 6** (see the [dialect reference](#dialect-reference) below).
Hibernate 3/4/5-era classes such as `MySQL5InnoDBDialect`, `Oracle10gDialect`, `SQLServer2008Dialect` and
`PostgreSQL9Dialect` were removed in Hibernate 6 — configuring them throws `ClassNotFoundException` on startup.
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

## Dameng (DM)

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
<!-- The DM dialect is published by Dameng; the artifactId suffix must match the Hibernate version Erupt uses (6.6).
     If Erupt bumps its Hibernate version, look up the matching artifact at https://central.sonatype.com/search?q=DmDialect-for-hibernate&smo=true -->
<dependency>
  <groupId>com.dameng</groupId>
  <artifactId>DmDialect-for-hibernate6.2</artifactId>
  <version>8.1.2.192</version>
</dependency>
```

## MongoDB

As a universal data-management framework, Erupt is not limited to relational databases and also supports MongoDB.

See: [NoSQL data source · erupt-mongodb](/en/modules/erupt-mongodb).

## Custom Data Source

Erupt is positioned as a universal data-management framework, so the custom data-source capability is open by design — we hope it unlocks endless possibilities for the Erupt ecosystem.

## Other Databases

Relational data management in Erupt is powered by Hibernate, which supports many more databases. The ones listed above are tested in production; others should work in principle.

## Dialect Reference

:::warning
Once more: **in almost every case you should not configure a dialect at all** — Hibernate 6 detects it automatically.
The table below is only for the rare cases where an explicit dialect is required.
:::

### Dialects Bundled with Hibernate 6.6

These ship in `hibernate-core` (package `org.hibernate.dialect`) and are available out of the box with Erupt:

| RDBMS | Dialect class | Minimum DB version |
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

### Community Dialects

Hibernate 6 moved the dialects that are no longer maintained by the Hibernate team out of `hibernate-core` into a
separate `org.hibernate.orm:hibernate-community-dialects` artifact (package `org.hibernate.community.dialect`).
Databases such as SQLite, Firebird, Informix, Ingres, CUBRID, Altibase, MimerSQL, Teradata, TimesTen, SingleStore and
Sybase Anywhere need this extra dependency:

```xml
<dependency>
  <groupId>org.hibernate.orm</groupId>
  <artifactId>hibernate-community-dialects</artifactId>
</dependency>
```

The version is managed by Spring Boot's dependency management — do not pin it manually.

:::danger
The following Hibernate 3/4/5-era class names **no longer exist** in Hibernate 6 and will throw
`ClassNotFoundException` at startup: `MySQL5InnoDBDialect`, `MySQLInnoDBDialect`, `MySQLMyISAMDialect`,
`Oracle9Dialect`, `Oracle10gDialect`, `SQLServer2008Dialect`, `PostgreSQL9Dialect`, `DB2390Dialect`,
`SAPDBDialect`, `MckoiDialect`, `InterbaseDialect`, `PointbaseDialect`, `FrontbaseDialect`, `ProgressDialect`.
:::

> The authoritative, complete list lives in the Hibernate docs: <https://docs.hibernate.org/orm/6.6/dialect/>
