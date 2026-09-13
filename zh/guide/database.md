# 数据源支持

「数据在哪，后台就在哪」——同一套 `@Erupt` 注解模型，既能管关系型数据库，也能管 NoSQL、REST 接口、文件、对象存储乃至 SaaS 表格。

![数据源支持](/database/img.png)

Erupt 的数据接入分三层，按需选择：

| 层级 | 适用场景 | 怎么用 |
| --- | --- | --- |
| **关系型数据库（JPA）** | 绝大多数业务系统 | 引入 `erupt-data-jpa`，按下文配置数据库连接即可，本页主要讲这一层 |
| **[数据连接层](#数据连接层)** | MongoDB、ES、Redis、REST 接口、文件、K8s、S3… | 引入对应 `erupt-data-*` 模块，在 `@Erupt` 上声明 `dataProxy` 之外的数据源 |
| **[自定义数据源](#自定义数据源)** | 上面都不覆盖的私有协议、内部服务 | 实现 `IEruptDataService` 或继承 `EruptBeanDataService` |

> **注意：** 使用关系型数据库前需导入对应的 JDBC 驱动包！

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

## 数据连接层

关系型数据库之外的数据，由 **erupt-data** 数据连接层接入：统一的数据源接口之上，同一套注解模型即可完成增删改查、分页与检索，表格、表单、权限、导出等能力与 JPA 模型完全一致。

| 模块 | artifactId | 说明 |
| --- | --- | --- |
| [erupt-jpa](/zh/modules/erupt-jpa) | `erupt-data-jpa` | 关系型数据库，多数项目的默认选择 |
| [erupt-mongodb](/zh/modules/erupt-mongodb) | `erupt-data-mongodb` | MongoDB 文档数据源 |
| [erupt-jdbc](/zh/modules/erupt-jdbc) | `erupt-data-jdbc` | 纯 JDBC 单表数据源，无需 JPA 实体映射，适配 ClickHouse、Doris、TDengine、达梦等 |
| [erupt-http](/zh/modules/erupt-http) | `erupt-data-http` | REST 接口即数据源，把任意 HTTP 服务映射成后台表格 |
| [erupt-es](/zh/modules/erupt-es) | `erupt-data-es` | Elasticsearch 索引管理与全文检索 |
| [erupt-redis](/zh/modules/erupt-redis) | `erupt-data-redis` | Redis 键值数据的可视化管理 |
| [erupt-memory](/zh/modules/erupt-memory) | `erupt-data-memory` | 内存数据源，无需数据库即可管理数据 |
| [erupt-file](/zh/modules/erupt-file) | `erupt-data-file` | 文件即数据表，支持 CSV、JSONL、TSV、INI 等 |
| [erupt-k8s](/zh/modules/erupt-k8s) | `erupt-data-k8s` | Kubernetes 集群资源管理 |
| [erupt-ldap](/zh/modules/erupt-ldap) | `erupt-data-ldap` | LDAP / AD 目录服务 |
| [erupt-feishu](/zh/modules/erupt-feishu) | `erupt-data-feishu` | 飞书多维表格 |
| [erupt-notion](/zh/modules/erupt-notion) | `erupt-data-notion` | Notion 数据库 |
| [erupt-s3](/zh/modules/erupt-s3) | `erupt-data-s3` | S3 兼容对象存储 |

一个项目里可以同时引入多个数据源模块，不同 `@Erupt` 模型各自归属不同数据源，互不影响。

:::warning 能力边界
非 JPA 数据源受各自协议限制：例如文件与 REST 数据源没有事务，Redis / 内存数据源不支持复杂关联查询。各模块文档中列出了具体支持的查询与写入能力。
:::

## 自定义数据源

以上模块都不覆盖时，可自行实现数据源接入私有协议或内部服务：

- **`IEruptDataService`**：完整接口，查询、分页、下钻、增删改全部自行实现，对接能力最强
- **`EruptBeanDataService`**：只需实现一个 `data()` 方法返回全量数据，条件求值、排序、分页、下钻由基类完成——**大多数「只能把行整体捞出来」的数据源（文件、REST、SaaS 表格、目录服务、对象存储）用它就够了**

实现类通过 `DataProcessorManager.register(...)` 注册，再在模型上用 `@EruptDataProcessor` 指定即可生效，完整示例见 [自定义数据源（EruptDataService）](/zh/advanced/custom-datasource)。

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
