# Cloud Node Mode

erupt-cube supports distributed semantic models built on [erupt-cloud](/en/modules/erupt-cloud): **semantic models can be defined in different business projects (nodes) while the cube server discovers, manages, and queries them centrally** — no need to gather every model into a single codebase.

:::tip Use cases
- Business lines develop and deploy independently, but modeling, dashboards, and AI query happen on one unified analytics platform
- Semantic models live next to their data sources (model and data deployed in the same project), avoiding cross-database data pulls
- The platform team governs model assets centrally, while business teams only write `@EruptCube` classes in their own projects
:::

## Architecture

```
┌────────────────────────────┐     Heartbeat registration (modules + model list)
│  Cube Server               │◄─────────────────────────────┐
│  erupt-cube-puzzle         │                              │
│  erupt-cloud-server        │     Query passthrough        │
│  (modeling / analysis /    │     (AccessToken)            │
│   AI query)                │─────────────────────────────►│
└────────────────────────────┘                              │
                                              ┌─────────────┴─────────────┐
                                              │  Business Nodes (many)    │
                                              │  erupt-cube-semantic      │
                                              │  erupt-cloud-node-jpa     │
                                              │  @EruptCube models        │
                                              └───────────────────────────┘
```

- **Nodes** register their modules and hosted semantic models with the server via erupt-cloud heartbeats
- The **server** automatically discovers nodes carrying the `erupt-cube-semantic` module and exposes them as selectable model sources
- Query requests are forwarded from the server to the node with the node's AccessToken; multi-instance nodes get automatic load balancing and failover
- SQL is generated and executed **on the node side** (data never leaves the node project's data sources); the server only receives result sets

## Server Setup

The server is a standard erupt-cube project plus the erupt-cloud server capability:

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

:::warning Note
`erupt-cloud-server` requires Redis — configure `spring.data.redis` on the server.
:::

After startup, create a node under the **Node Config** menu and note the generated `AccessToken` for node registration.

## Node Setup

Add the semantic layer and cloud node dependencies to the business project:

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
  # Local cube data sources on the node (models execute node-side)
  cube:
    datasource:
      node_mysql:
        jdbc-url: jdbc:mysql://localhost:3306/erupt
        username: root
        password: xxx
        driver-class-name: com.mysql.cj.jdbc.Driver
  # Register with the cube server
  cloud-node:
    server-addresses: [ 'http://cube-server:9999' ]   # server address
    access-token: QWROXUZ2MSAIPUZO                    # token generated in the server's Node Config
    node-name: sales-node                             # node name
    host-address: [ 'http://localhost:8899' ]         # address the server uses to reach this node
    heartbeat-time: 15000
```

Then define semantic models in the node as usual:

```java
@EruptCube(
        datasource = "node_mysql",
        name = "Node Sales Analysis",
        sql = "SELECT region, category, amount, order_date FROM fact_sales"
)
public class NodeSalesCube {

    @Dimension(title = "Region")
    private String region;

    @Dimension(title = "Category")
    private String category;

    @Measure(title = "Revenue", sql = "sum(amount)")
    private Double total_amount;
}
```

## Usage

Once a node registers, a **model source** dropdown appears wherever the server selects models (visual modeling, visual analysis, etc.):

- `local`: models defined locally on the cube server
- Node name: models hosted on that node — metadata and queries are transparently forwarded to the node

On the erupt-cloud server's **Node Config** list, click **Model Count** to browse all resources hosted by a node; the **Cube** tab shows the semantic models the node reported.

:::tip Version requirements
Both server and nodes require erupt `2.1.0+` and erupt-cube `2.1.0+`. Older nodes can still register and serve passthrough queries, but they won't report their cube model list on the node management page.
:::
