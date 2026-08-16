# 云端节点模式

erupt-cube 支持基于 [erupt-cloud](/zh/modules/erupt-cloud) 的分布式语义模型：**语义模型可以定义在不同的业务项目（节点）中，由 cube 服务端集中发现、统一管理与分析查询**，无需把所有模型集中在一个工程里。

:::tip 适用场景
- 各业务线独立开发部署，但希望在一个统一的分析平台上建模、看板、AI 问数
- 语义模型贴近业务数据源（模型与数据同项目部署），避免跨库拉数
- 平台团队集中治理模型资产，业务团队只需在自己项目中写 `@EruptCube`
:::

## 架构

```
┌────────────────────────────┐        心跳注册（模块 + 模型清单）
│  cube 服务端                │◄─────────────────────────────┐
│  erupt-cube-puzzle         │                              │
│  erupt-cloud-server        │        查询穿透（AccessToken）  │
│  （可视化建模/分析/AI 问数）  │─────────────────────────────►│
└────────────────────────────┘                              │
                                              ┌─────────────┴─────────────┐
                                              │  业务节点（可多个）          │
                                              │  erupt-cube-semantic      │
                                              │  erupt-cloud-node-jpa     │
                                              │  @EruptCube 语义模型       │
                                              └───────────────────────────┘
```

- **节点**通过 erupt-cloud 心跳向服务端注册自身模块与托管的语义模型
- **服务端**自动发现装有 `erupt-cube-semantic` 模块的节点，将其作为可选的模型来源（source）
- 查询请求由服务端携带节点 AccessToken 穿透转发至节点执行，多实例节点自动负载与故障转移
- SQL 在**节点侧**生成并执行（数据不出节点项目的数据源），服务端只接收结果集

## 服务端配置

服务端为标准的 erupt-cube 工程，额外引入 erupt-cloud 服务端能力：

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-cube-puzzle</artifactId>
    <version>${erupt-cube.version}</version>
</dependency>
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-cloud-server</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

:::warning 注意
`erupt-cloud-server` 依赖 Redis，需在服务端配置 `spring.data.redis`。
:::

启动后在 **节点配置** 菜单中新建节点，记录生成的 `AccessToken`，供节点注册使用。

## 节点配置

业务项目引入语义层与 cloud 节点依赖：

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-cube-semantic</artifactId>
    <version>${erupt-cube.version}</version>
</dependency>
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-cloud-node-jpa</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

```yaml
erupt:
  # 节点本地的 cube 数据源（模型在节点侧执行）
  cube:
    datasource:
      node_mysql:
        jdbc-url: jdbc:mysql://localhost:3306/erupt
        username: root
        password: xxx
        driver-class-name: com.mysql.cj.jdbc.Driver
  # 注册到 cube 服务端
  cloud-node:
    server-addresses: [ 'http://cube-server:9999' ]   # 服务端地址
    access-token: QWROXUZ2MSAIPUZO                    # 服务端节点配置中生成的 Token
    node-name: sales-node                             # 节点名称
    host-address: [ 'http://localhost:8899' ]         # 本节点可被服务端访问的地址
    heartbeat-time: 15000
```

节点中正常定义语义模型即可：

```java
@EruptCube(
        datasource = "node_mysql",
        name = "节点销售分析",
        sql = "SELECT region, category, amount, order_date FROM fact_sales"
)
public class NodeSalesCube {

    @Dimension(title = "地区")
    private String region;

    @Dimension(title = "品类")
    private String category;

    @Measure(title = "销售额", sql = "sum(amount)")
    private Double total_amount;
}
```

## 使用方式

节点注册成功后，服务端的可视化建模、可视化分析等模型选择处会出现 **模型来源（source）** 下拉：

- `local`：cube 服务端本地定义的模型
- 节点名称：该节点托管的模型，选择后元数据与查询自动穿透至节点执行

在 erupt-cloud 服务端的 **节点配置** 列表中，点击 **模型数量** 可查看节点托管的全部资源，其中 **Cube** 标签页即该节点上报的语义模型清单。

:::tip 版本要求
服务端与节点均需 erupt `2.1.0+`、erupt-cube `2.1.0+`。低版本节点仍可正常注册与被穿透查询，但不会在节点管理页上报 Cube 模型清单。
:::
