# 多数据源

## 多数据源 @EruptDataSource

### 使用方法

1. 在 application.yml 中增加数据源的连接信息（原有主数据源的配置需要保留）：

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

> **注：`scanPackages` 为必填项，且必须与主数据源及其他数据源的扫描路径不重叠。**
>
> 原因：JPA 通过包扫描路径判断哪些实体类属于哪个数据源，路径重叠会导致同一个实体被多个数据源同时管理，启动时建表冲突或数据写入错误的数据源。
> 推荐的目录结构：
> ```
> com.example.model          ← 主数据源实体（@EntityScan 指向此路径）
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

## 自定义数据源 @EruptDataProcessor

通过实现 `IEruptDataService` 接口，可以自定义数据源，实现对外部 API、ES、MongoDB 等非关系型数据的管理。

详见：[自定义数据源](/advanced/custom-datasource)
