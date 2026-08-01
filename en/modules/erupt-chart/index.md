# Erupt Chart

Erupt Chart is the general-purpose reporting and charting module of the erupt ecosystem. Define reports and charts with pure SQL and perform multi-dimensional data analysis with zero frontend code. Charts are rendered by [G2Plot](https://g2plot.antv.antgroup.com/), with 20+ chart types, a dozen query dimension components, column drill-down, chart-dimension linkage, Excel export, and report caching.

:::warning 🎉 Open Source Notice
Erupt Chart is open-sourced from the commercial **erupt-report** module (formerly erupt-bi), with the official release expected in **mid-August 2026**. Stay tuned.
:::

:::info Repository
[https://github.com/erupts/erupt/tree/master/erupt-report](https://github.com/erupts/erupt/tree/master/erupt-report)
:::

Live demo: [https://demo.erupt.xyz](https://demo.erupt.xyz) &nbsp; Username: `bi` Password: `bi`

<img src="/bi/demo1.png" width="900">

<img src="/bi/demo2.png" width="900">

<img src="/bi/demo3.png" width="900">

## Why not DataEase / Superset / in-house?

| Dimension | In-house ECharts | DataEase / Superset | **Erupt Chart** |
| --- | --- | --- | --- |
| Deployment cost | 0 (embedded in your app) | Separate BI server + database | **0 (embedded in your app)** |
| Tech stack | Frontend + backend to maintain | Java/Vue + Python/Node stacks | **Pure Java + SQL** |
| Permissions | Reimplement from scratch | Separate user system to sync | **Reuses Erupt UPMS, zero extra work** |
| Drill-down / linkage | 1–2 weeks each to build | High configuration barrier | **Available out of the box** |
| Time to production | Weeks | Days + cross-team coordination | **30 minutes** |

## Getting Started

### Add the dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-chart</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

:::tip
The module targets **Java 17** and works with erupt 2.x. It depends on `erupt-upms` (permissions) and `erupt-tpl` (template pages), and bundles the standalone `nashorn-core` JS engine — no extra dependency needed.
:::

## Configuration

```yaml
erupt:
  bi:
    enable-cache: true                    # enable report cache
    query-log: true                       # log query SQL
    super-admin-publish: false            # restrict publishing to super admins
    page-size: 10                         # default page size
    page-size-options: [10, 30, 50, 100]  # selectable page sizes
    single-max-result-num: 500            # max rows per backend-pagination query
```

## Feature Guide

| Feature | Description |
| --- | --- |
| [Data Sources](./datasource) | Configure multiple data sources to analyze data across different databases |
| [Report Handlers](./handler) | Dynamically process report SQL and query results with Java code |
| [Reference Dimensions](./dimension) | Generate dropdown lists or trees as query conditions from SQL results |
| [Function Management](./function) | Mix JS functions into SQL for dynamic SQL capabilities |
| [Report Configuration](./report-config) | Core configuration: reports, charts, query dimensions, dynamic columns, drill-down |
| [Publishing Reports](./publish) | Publish configured reports as system menus |
| [FAQ](./faq) | ES6 syntax, default values, and more |
