# Erupt Cube BI 平台

借鉴 Google Looker 的语义层理念，为 Java 生态打造专业级大数据分析方案。数据工程师专注模型构建，数据分析师基于语义层自助完成可视化，无需多方协作，注解定义语义模型 + 拖拽完成可视化，开箱即用。

<iframe src="https://www.erupt.xyz/#!/cube" width="100%" height="600" frameborder="0" style="border-radius:8px"></iframe>

:::tip 付费插件
源码交付 · 技术支持 · 免费更新迭代 · 合理需求免费实现 · erupt 相关问题优先支持 · 无 License 限制 · 无项目数量限制 · 无商用限制 · 禁止二次开源与分发
:::

演示：[https://www.erupt.xyz/demo](https://www.erupt.xyz/demo) &nbsp; 账号：`cube` 密码：`cube`

售前咨询请添加作者微信：

<img src="/me.jpg" width="240">

---

<img src="/cube/overview.png" width="900">

<img src="/cube/semantic.png" width="739">

<img src="/cube/dashboard.png" width="900">

## 语义模型解决什么问题

| 问题 | 没有语义模型 | 有语义模型 |
| --- | --- | --- |
| 指标口径 | 每个人写的 SQL 不一样 | 统一定义，一处修改处处生效 |
| 使用门槛 | 必须懂 SQL | 拖拽即用 |
| 复用性 | 逻辑散落在各报表 | 集中定义，随处复用 |
| 可维护性 | 改表结构要改所有 SQL | 只改模型层即可 |

## 数据库支持

| 类型 | 产品 |
| --- | --- |
| 分析型数仓（OLAP） | Apache Doris、StarRocks、ClickHouse、GreenPlum、Apache Hive、Presto、Trino、Impala、ADB |
| 关系型数据库（OLTP） | MySQL、PostgreSQL、Oracle、SQL Server、TiDB |
| 国产数据库 | 达梦（DM）、人大金仓（KingbaseES）、OceanBase |
| 云原生数仓 | Redshift、Snowflake、BigQuery、Databricks、阿里云 MaxCompute、华为云 DWS |

## 与 Google Looker 的关系

Looker 将语义层理念做到极致，称之为 **LookML**，核心思想是：所有指标逻辑只定义一次，所有报表共享同一套语义层。Erupt Cube 用 **Java 注解**替代 LookML 的 DSL，对 Java 开发者更友好，无需学习新语言。
