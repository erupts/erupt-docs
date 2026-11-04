# 多数据源（@EruptDataSource）

## 多数据源 @EruptDataSource

### 使用方法

1. 在 application.yml 中增加数据源的连接信息（原有主数据源的配置需要保留）：

::: tip 关于 database-platform
Erupt 2.x 基于 Hibernate 6，方言会根据 JDBC 连接自动探测，通常无需配置 `database-platform`。确需指定时，请使用 Hibernate 6 中真实存在的类名，参见[方言对照表](/zh/guide/database#方言对照表)。
:::

```yaml
erupt:
  dbs:
    # mysql
    - datasource:
        # name属性必须有，是区分不同数据源的标识
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

> **注：`scanPackages` 为必填项，且必须与主数据源及其他数据源的扫描路径不重叠。**
>
> 原因：JPA 通过包扫描路径判断哪些实体类属于哪个数据源，路径重叠会导致同一个实体被多个数据源同时管理，启动时建表冲突或数据写入错误的数据源。
> 推荐的目录结构：
> ```
> com.example.model.main     ← 主数据源实体（@EntityScan 指向此路径）
> com.example.model.mysql    ← MySQL 附加数据源实体（scanPackages 指向此路径）
> com.example.model.oracle   ← Oracle 附加数据源实体（scanPackages 指向此路径）
> ```

2. 修改入口类 `@EntityScan` 配置，细化包扫描路径：

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

3. 增加对应数据源的 JDBC 驱动依赖（Maven 坐标参考）：

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

4. 将实体类中增加 `@EruptDataSource` 注解：

```java
@EruptDataSource("xxxx") // 注解值应该配置文件中 erupt.dbs.datasource.name 的值
@Erupt(name = "其他数据源表", 
       power = @Power(add = false, delete = false, edit = false))
@Table(name = "help_topic")
@Entity
public class HelpTopic {

    @Id
    @Column(name = "help_topic_id")
    @EruptField
    private String id;

    @EruptField(
            views = @View(title = "名称")
    )
    private String name;

    @EruptField(
            views = @View(title = "描述", type = ViewType.HTML)
    )
    private String description;
    
}
```

### jpa 与 scanPackages 说明

- `erupt.dbs[*].jpa` 是一个完整的 Spring `JpaProperties`，因此 `show-sql`、`generate-ddl`、`database`、`database-platform`、`properties.*` 等键都可用。其中只有 `generateDdl`、`database`、`showSql`、`databasePlatform` 会传给 `HibernateJpaVendorAdapter`，其余通过 `properties` 原样传给 Hibernate。
- `erupt.dbs[*].scanPackages` 的类型是 **`String[]`**，可以写单个包名，也可以写 YAML 列表或逗号分隔的多个包名。该项**必填**：缺失时启动会抛出 `xxx DataSource not found 'scanPackages' configuration`。

### 连接池（HikariCP）配置

`erupt.dbs[*]` 的附加数据源由 Erupt 自行创建 `HikariDataSource`，连接池参数写在 `erupt.dbs[*].datasource.hikari.*` 下（主数据源仍走 Spring Boot 标准的 `spring.datasource.hikari.*`）：

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

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `pool-name` | String | 由 HikariCP 生成 | 连接池名称，便于日志与 JMX 定位 |
| `max-pool-size` | Integer | `10` | 最大连接数（HikariCP `maximumPoolSize`），填 `-1` 表示不覆盖 |
| `min-idle` | Integer | 同 `max-pool-size` | 最小空闲连接数，填 `-1` 表示不覆盖 |
| `connection-timeout` | Long（毫秒） | `30000`（30 秒） | 从池中获取连接的等待超时 |
| `validation-timeout` | Long（毫秒） | `5000`（5 秒） | 连接有效性校验超时 |
| `idle-timeout` | Long（毫秒） | `600000`（10 分钟） | 空闲连接回收时间 |
| `max-lifetime` | Long（毫秒） | `1800000`（30 分钟） | 连接最长存活时间 |
| `leak-detection-threshold` | Long（毫秒） | 不启用 | 连接泄漏检测阈值 |
| `initialization-fail-timeout` | Long（毫秒） | `1` | 启动时首连失败的处理策略 |
| `connection-init-sql` | String | 无 | 新连接建立后执行的初始化 SQL |
| `connection-test-query` | String | 无 | 存活探测 SQL，仅老驱动（不支持 JDBC4 `isValid`）需要 |
| `catalog` | String | 无 | 默认 catalog |
| `schema` | String | 无 | 默认 schema |
| `transaction-isolation-name` | String | 驱动默认 | 如 `TRANSACTION_READ_COMMITTED` |
| `data-source-class-name` | String | 无 | 使用 `DataSource` 实现类而非 `DriverManager` |
| `data-source-jndi-name` | String | 无 | 从 JNDI 获取数据源 |
| `is-auto-commit` | Boolean | `true` | **仅当显式设为 `false` 时生效** |
| `is-read-only` | Boolean | `false` | 只读连接池 |
| `is-isolate-internal-queries` | Boolean | `false` | 内部查询使用独立事务 |
| `is-register-mbeans` | Boolean | `false` | 注册 JMX MBean |
| `is-allow-pool-suspension` | Boolean | `false` | 允许挂起连接池 |
| `data-source-properties` | Properties | 无 | 透传给底层 `DataSource` 的属性 |
| `health-check-properties` | Properties | 无 | 健康检查属性 |

:::warning hikari 下的 url / username / password / driver-class-name 不生效
`HikariCpConfig` 虽然声明了 `jdbcUrl`、`username`、`password`、`driverClassName` 四个字段，但 `toHikariConfig()` 并不读取它们。连接信息请写在上一层的 `erupt.dbs[*].datasource.{url,username,password,driverClassName}`，这四项会在连接池配置构建完成后覆盖上去。
:::

:::tip 默认值来自 HikariCP 本身
上表中的默认值是 HikariCP 的内置默认值。Erupt 在构建配置时会跳过与默认值相等的项（不做任何设置），因此写与不写效果一致——只有改成不同的值才会真正生效。
:::

## 数据源支持

erupt 支持市面上所有主流数据库，甚至支持 MongoDB，也可自定义数据源。

> **使用前需导入数据库所依赖的 JDBC 包！**

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

## 自定义数据源 @EruptDataProcessor

通过实现 `IEruptDataService` 接口，可以自定义数据源，实现对外部 API、ES、MongoDB 等非关系型数据的管理。

详见：[自定义数据源](/zh/advanced/custom-datasource)
