# 数据源管理

通过多数据源可以连接到不同的数据库做更广泛的多维数据分析。内置以下数据库的分页方言：

**MySQL、MariaDB、PostgreSQL、TiDB、Oracle、SQLServer 2012、达梦（DaMeng）、人大金仓（KingBase）、ClickHouse、Impala、StarRocks**

不在列表中的数据库（如 Apache Druid、Presto 等）选择 **Other**，通过自定义分页语句构造方言即可兼容。

:::tip
如果仅使用当前 Spring Boot 配置的默认数据源，则无需进行额外配置，直接跳过该步骤即可（默认按 MySQL 方言分页）
:::

![](/report/datasource-list.png)

![](/report/datasource-edit.png)

## 配置项说明

| 配置项 | 说明 |
| --- | --- |
| 编码 | 保持唯一即可 |
| 名称 | 数据源名称 |
| 驱动 | JDBC 驱动，填写前请确认当前项目添加了对应数据库的驱动依赖 |
| 数据库类型 | 决定分页方言，如果你使用的数据库不在下拉列表中，请选择 Other，且自定义分页语句来构造方言 |
| 连接字符串 | 数据库连接字符串 |
| 用户名 | 数据库用户名 |
| 密码 | 数据库密码 |
| 测试连接 | 保存前可点击按钮验证连接是否可用 |
| 分页语句 | 在数据库类型选择为 Other 时必填 |
| 连接池配置 | HikariCP 参数，`key=value` 格式，每行一项<br/>暂不支持保存后立即生效，需要重启 |
| 备注 | |

## 自定义分页语句

分页语句支持如下占位变量：

| 变量 | 说明 |
| --- | --- |
| `@sql` | 原始查询 SQL |
| `@size` | 每页条数 |
| `@skip` | 跳过的行数 |
| `@sort` | 排序字段 |

例（MySQL 风格的通用方言）：

```sql
select * from (@sql) _t @sort limit @size offset @skip
```
