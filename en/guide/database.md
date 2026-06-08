# Database Support

Erupt supports all mainstream relational databases, MongoDB, and custom data sources.

![Database support](/database/img.png)

> **Note:** Import the corresponding JDBC driver dependency before use.

The snippets below are minimal templates — adjust the values to your environment. The configuration for each database in `application.yml` is as follows.

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
    database-platform: org.hibernate.dialect.MySQL5InnoDBDialect
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
    database-platform: org.hibernate.dialect.Oracle10gDialect
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
    database-platform: org.hibernate.dialect.SQLServer2008Dialect
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
    database-platform: org.hibernate.dialect.PostgreSQL9Dialect
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
    database-platform: org.hibernate.dialect.H2Dialect
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
    database-platform: org.hibernate.dialect.DB2Dialect
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
<!-- The artifact suffix depends on Erupt's bundled JPA / Hibernate version. If versions change, look up the correct one at https://central.sonatype.com/search?q=DmDialect-for-hibernate&smo=true -->
<dependency>
  <groupId>com.dameng</groupId>
  <artifactId>DmDialect-for-hibernate5.6</artifactId>
  <version>8.1.3.140</version>
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

| RDBMS | Dialect |
| :---: | :---: |
| DB2 | org.hibernate.dialect.DB2Dialect |
| DB2 AS/400 | org.hibernate.dialect.DB2400Dialect |
| DB2 OS390 | org.hibernate.dialect.DB2390Dialect |
| PostgreSQL | org.hibernate.dialect.PostgreSQLDialect |
| MySQL | org.hibernate.dialect.MySQLDialect |
| MySQL with InnoDB | org.hibernate.dialect.MySQLInnoDBDialect |
| MySQL with MyISAM | org.hibernate.dialect.MySQLMyISAMDialect |
| Oracle (any version) | org.hibernate.dialect.OracleDialect |
| Oracle 9i/10g | org.hibernate.dialect.Oracle9Dialect |
| Sybase | org.hibernate.dialect.SybaseDialect |
| Sybase Anywhere | org.hibernate.dialect.SybaseAnywhereDialect |
| Microsoft SQL Server | org.hibernate.dialect.SQLServerDialect |
| SAP DB | org.hibernate.dialect.SAPDBDialect |
| Informix | org.hibernate.dialect.InformixDialect |
| HypersonicSQL | org.hibernate.dialect.HSQLDialect |
| Ingres | org.hibernate.dialect.IngresDialect |
| Progress | org.hibernate.dialect.ProgressDialect |
| Mckoi SQL | org.hibernate.dialect.MckoiDialect |
| Interbase | org.hibernate.dialect.InterbaseDialect |
| Pointbase | org.hibernate.dialect.PointbaseDialect |
| FrontBase | org.hibernate.dialect.FrontbaseDialect |
| Firebird | org.hibernate.dialect.FirebirdDialect |
