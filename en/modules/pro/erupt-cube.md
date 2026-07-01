# Erupt Cube BI Platform

Inspired by Google Looker's semantic layer concept, built as a professional-grade big data analytics solution for the Java ecosystem. Data engineers focus on model construction; data analysts complete visualizations self-service based on the semantic layer — no multi-party collaboration required. Define semantic models with annotations, build visualizations with drag-and-drop, ready to use out of the box.

<iframe src="https://www.erupt.xyz/#!/cube" width="100%" height="600" frameborder="0" style="border-radius:8px"></iframe>

:::tip Commercial Module
**Includes**: Full source code · All future version upgrades · Technical support · Priority Erupt-related support · Reasonable feature requests implemented for free · Continuous capability iteration
**License**: No License restrictions · No project count limits · No commercial restrictions
**Limitation**: Redistribution and secondary open-sourcing are prohibited

👉 **[View Pricing and Purchase →](https://www.erupt.xyz/?utm_source=docs&utm_medium=tipblock&utm_campaign=pro#!/pro)**
:::

Officially produced and maintained by the open-source Erupt framework team ([GitHub 3k+ ★](https://github.com/erupts/erupt) · [Gitee 5k+ ★](https://gitee.com/erupt/erupt)). Avoids vendor lock-in and operational costs of solutions like Kylin / Looker.

Demo: [https://demo.erupt.xyz](https://demo.erupt.xyz) &nbsp; Username: `cube` Password: `cube`

For pre-sales inquiries, add the author on WeChat:

<img src="/contact/me.jpg" width="240">

---

<img src="/cube/overview.png" width="900">

<img src="/cube/semantic.png" width="900">

## What Problems Does the Semantic Model Solve?

| Problem | Without Semantic Model | With Semantic Model |
| --- | --- | --- |
| Metric consistency | Everyone writes different SQL | Defined once; changes propagate everywhere |
| Usage barrier | Must know SQL | Drag-and-drop ready |
| Reusability | Logic scattered across reports | Centrally defined, reusable anywhere |
| Maintainability | Table changes require updating all SQL | Only update the model layer |

## Two Modeling Approaches: Annotations + Visual Interface, Complementing Each Other

erupt-cube supports two semantic model definition methods simultaneously, covering different roles in the team:

| Approach | Target User | Capabilities | Use Case |
| --- | --- | --- | --- |
| **Java Annotation Modeling (Primary)** | Developers / Data Engineers | Full capabilities covering all dimensions, metrics, relationships, custom SQL, dynamic fields | Complex models; version-controlled with code; Code Review friendly |
| **Visual Interface Modeling (Secondary)** | Data Analysts / Business Users | Common dimensions, metrics, relationship configuration (slightly fewer capabilities than annotations) | Ad-hoc / exploratory modeling; quick iteration by non-Java roles |

Both approaches can coexist in the same project: define core complex models with annotations and manage them in git; business-side ad-hoc analysis uses visual modeling for quick validation, and stable models are later committed to annotations by developers.

> Recommended workflow: **Define core models with annotations → Use the visual interface for business self-service exploration → Stable models from exploration are converted back to annotations**.

## Annotation Modeling Reference (API)

A semantic model = one `@EruptCube` class. The class declares the base-table SQL and its exposed query views (Explores); fields declare dimensions and metrics with `@Dimension` / `@Measure`. Below is a complete, compilable example (from `xyz.erupt.project.cube.WorkItemStatsCube`):

```java
@Getter
@Setter
@EruptCube(
        name = "Work Item Statistics",
        sql = """
                select wi.type         as type,
                       wi.status       as status,
                       u.name          as assignee_name,
                       wi.story_points as story_points,
                       wi.due_date     as due_date
                from e_project_work_item wi
                         left join e_upms_user u on wi.assignee_id = u.id
                """
)
public class WorkItemStatsCube {

    @Dimension(title = "Assignee", sql = "assignee_name")
    private String assigneeName;

    @Dimension(title = "Status", sql = "status")
    private String status;

    @Dimension(title = "Due Date", sql = "due_date")
    private LocalDate dueDate;

    @Measure(title = "Work Item Count", sql = "count(*)")
    private Long workItemCount;

    @Measure(title = "Overdue Count",
             sql = "sum(case when status <> 'DONE' and due_date < current_date then 1 else 0 end)")
    private Long overdueCount;

    @Measure(title = "Story Points", sql = "sum(story_points)")
    private Double storyPoints;
}
```

### `@EruptCube` (class level)

| Attribute | Type | Description |
| --- | --- | --- |
| `name` | String | Model name (required) |
| `datasource` | String | Datasource key; blank uses the primary datasource |
| `description` | String | Model description |
| `sql` | String | Base-table SQL, interpreted as a sub-query or table name per `sqlType` (supports VTL templates) |
| `sqlType` | SqlType | `SUB_QUERY` (default) / `TABLE_NAME` |
| `explores` | Explore[] | Exposed query views; defaults to a single `overview` |
| `prompt` | String | Prompt supplied to the AI (markdown) |
| `tags` | String[] | Tags |
| `dataProxy` | Class&lt;? extends CubeProxy&gt;[] | Before/after query hooks |

### `@Dimension` (field level · dimension)

| Attribute | Type | Description |
| --- | --- | --- |
| `title` | String | Dimension display name (required) |
| `type` | FieldType | `AUTO` (default, inferred from field type) / `NUMBER` / `STRING` / `DATE` |
| `sql` | String | GROUP BY column expression; defaults to the field name (supports VTL) |
| `prompt` | String | AI prompt |
| `hidden` | boolean | Whether hidden |
| `tags` | String[] | Tags |

### `@Measure` (field level · metric)

| Attribute | Type | Description |
| --- | --- | --- |
| `title` | String | Metric display name (required) |
| `type` | FieldType | Same as above |
| `sql` | String | Aggregate SQL expression, e.g. `sum(amount)` (required) |
| `drillFields` | String[] | Detail dimension fields exposed when drilling down |
| `drillFilter` | String | Extra filter applied when drilling down |
| `prompt` | String | AI prompt |
| `hidden` | boolean | Whether hidden |
| `tags` | String[] | Tags |

### `@Explore` (query view)

Defines the query perspectives a cube exposes; each `code` maps to a set of available dimensions / metrics.

| Attribute | Type | Description |
| --- | --- | --- |
| `code` | String | Unique view code |
| `name` | String | View name |
| `where` | String | Fixed filter for this view |
| `dimensions` | String[] | Dimensions exposed by this view (blank = all) |
| `measures` | String[] | Metrics exposed by this view (blank = all) |
| `parameters` | ExploreParameter[] | Runtime parameters |
| `joins` | Join[] | Joins with other cubes |
| `hidden` | boolean | Whether hidden |

### `CubeProxy` (extension point)

Implement `xyz.erupt.annotation.fun.CubeProxy` and reference it via `@EruptCube(dataProxy = ...)` to hook in before the query expression is built and after results return (row-level permissions, tenant isolation, result post-processing):

```java
public interface CubeProxy {

    // Dynamically process the query expression before it is built
    default String beforeQuery(String expr, Map<String, Object> context) {
        return expr;
    }

    // Post-process the query result after it returns
    default void afterQuery(List<CubeResultRow> result, Map<String, Object> context) {
    }
}
```

## Why Not Use Looker / Metabase / Cube.dev / Build Your Own?

| Dimension | Looker (Google) | Metabase | Cube.dev | Custom SQL Stitching | **Erupt Cube** |
| --- | --- | --- | --- | --- | --- |
| Semantic Layer Definition | LookML (proprietary DSL) | Models (GUI configuration) | YAML / JS Schema | None (scattered in report SQL) | **Java annotations (primary) + visual interface (secondary)** |
| Language Ecosystem | LookML (requires separate learning) | Java / Clojure (closed-source core) | Node.js / TypeScript | Java | **Java (same stack as business project)** |
| Deployment | SaaS (closed-source) | Standalone service (Docker) | Standalone service | Integrated with business | **Integrated with business project** |
| Permission System Integration | Requires re-integration | Own user system requiring synchronization | No permissions included | Custom | **Reuses Erupt UPMS — zero cost** |
| Vendor Lock-In | Heavy (Google) | No (but community edition is limited) | No | No | **No (source code delivered)** |
| Domestic Database Support | Almost none | Fair | Fair | Depends on implementation | **Dameng / KingbaseES / OceanBase, etc.** |
| Price Range | $5,000+/month starting | Open source + enterprise edition fees | Open source + Cloud fees | 0 (excluding labor) | **One-time purchase · [View Pricing](https://www.erupt.xyz/?utm_source=docs&utm_medium=cmptable&utm_campaign=pro#!/pro)** |

## Database Support

| Type | Products |
| --- | --- |
| Analytical Data Warehouses (OLAP) | Apache Doris, StarRocks, ClickHouse, GreenPlum, Apache Hive, Presto, Trino, Impala, ADB |
| Relational Databases (OLTP) | MySQL, PostgreSQL, Oracle, SQL Server, TiDB |
| Domestic Databases | Dameng (DM), KingbaseES, OceanBase |
| Cloud-Native Data Warehouses | Redshift, Snowflake, BigQuery, Databricks, Alibaba Cloud MaxCompute, Huawei Cloud DWS |

## Relationship with Google Looker

Looker takes the semantic layer concept to the extreme with **LookML**: the core idea is that all metric logic is defined only once and all reports share the same semantic layer. Erupt Cube replaces LookML's DSL with **Java annotations**, which is more developer-friendly for Java developers — no new language to learn — and enables deep integration with Erupt's permission, menu, and tenant capabilities.

## Who Is This For?

- Mid-sized enterprise data teams (need BI but no dedicated data engineering headcount)
- Consulting firms / data delivery vendors (need to deliver dozens of dashboards per project)
- Traditional industry digital transformation teams (need OLAP but want to avoid Kylin / Looker pitfalls)
- Teams already using open-source Erupt (seamless upgrade; permissions inherited naturally)

## FAQ

**Q1 · What is the difference from the open-source Erupt?**
Open-source Erupt provides basic CRUD, forms, and simple report capabilities. erupt-cube is a commercial module that introduces a complete semantic layer + multi-data-source + drag-and-drop analysis + dashboard capabilities — this is not included in the open-source version and will not be open-sourced in the future.

**Q2 · What is the relationship between erupt-chart and erupt-cube?**
- **erupt-chart**: Configures charts directly with SQL; suitable for **developers with SQL skills** to quickly build fixed reports
- **erupt-cube**: A semantic layer-based BI platform; suitable for **data analysts doing self-service drag-and-drop analysis**, covering more complex OLAP scenarios

Both can be used independently or together (chart serves developers, cube serves business analysts). If the team is large with dedicated data analysts, going straight to cube is recommended.

**Q3 · How is it delivered?**
After payment, provide your GitHub username. The author will add you as a collaborator to the private repository `erupts/erupt-cube`. You can clone the source code directly, compile locally, reference as needed, and will receive an integration document.

**Q4 · Do I need to pay again for future version upgrades?**
No. One-time purchase = you have access to the current and all future versions. The private repository's master branch is continuously updated; just `git pull`.

**Q5 · What about project count / commercial use / reselling?**
- **No project count limits**: Deploy in as many internal or outsourced projects as you like
- **No commercial restrictions**: Can be used in commercial products (including selling your finished product, but you may not sell the erupt-cube source code itself)
- **Reselling**: Redistribution and secondary open-sourcing are prohibited; company name or entity changes can apply for license migration

**Q6 · Trial / Refunds?**
The [online demo](https://demo.erupt.xyz) has all features available (username `cube` / password `cube`). We recommend fully exploring it first. Once repository access is granted, delivery is considered complete and refunds are no longer supported.

---

For questions not listed above, scan the QR code above to contact the author on WeChat.
