# 数据源

:::warning 温馨提示
**数据量大于 100W 请务必使用 OLAP 数仓作为数据源！**
:::

支持市面上主流数仓及关系型数据库，无需额外适配即可接入，无论是 OLAP 分析场景还是 OLTP 业务场景，均可开箱即用。

| 类型 | 产品 |
| --- | --- |
| 分析型数仓（OLAP） | Apache Doris、StarRocks、ClickHouse、GreenPlum、Apache Hive、Presto、Trino、Impala、ADB |
| 关系型数据库（OLTP） | MySQL、PostgreSQL、Oracle、SQL Server、TiDB |
| 国产数据库 | 达梦（DM）、人大金仓（KingbaseES）、OceanBase |
| 云原生数仓 | 阿里云 MaxCompute、华为云 DWS |

## 配置方法

```yaml
erupt:
  cube:
    show-sql: true    # 打印生成的 SQL（默认 true）
    # 配置数据源
    datasource:
      h2:             # 数据源名称，@EruptCube 的 datasource 属性按此名称引用
        jdbc-url: jdbc:h2:file:./erupt
        driver-class-name: org.h2.Driver
        username: sa
        password:
        # ... 同 HikariConfig 配置
```

:::tip
可不配置额外的数据源，会将当前 Spring Boot 的默认数据源作为查询引擎（方言根据 jdbc-url 动态适配）。

数据源条目基于 HikariCP（`HikariConfig`），因此任意 HikariCP 连接池属性均可直接配置。
:::
