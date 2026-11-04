---
title: "Let Your BI Dashboard Answer 'Why Did It Drop' — Erupt Cube × LLM"
description: Traditional BI tools give you "what." Erupt Cube × LLM gives you "why." The @EruptCube annotation defines a semantic layer; the LLM grows three eyes next to your domain model (cubeList → cubeMetadata → cubeQuery), writes its own SQL, produces interactive charts, and delivers attribution analysis.
outline: deep
---

# Issue 04 · Let Your BI Dashboard Answer "Why Did It Drop"

> In Issue 01 we covered Erupt's AI Harness — 17 LLMs, MCP, A2A cross-agent, cross-session Memory.
> In Issue 03 we covered the "annotation approach" — metadata = UI = API = LLM Tool, all from the same source.
> This issue stitches those two threads together: **the LLM is no longer just a chat box next to the admin panel — it grows three eyes next to your domain model, writes its own aggregation queries, produces charts, and delivers attribution analysis**.
>
> _Published 2026-05-28 · ~11 min read_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt WeChat Official Account" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · Official Account</div>
    <div class="topic-mp-qr__title">Follow Erupt on WeChat</div>
    <p class="topic-mp-qr__desc">Each issue is published here first, along with release notes, source code walkthroughs, and community case studies.</p>
  </div>
</div>

## 1. The One Old Problem Every BI Dashboard Has

You open the sales dashboard five minutes before Monday's standup —

> "Revenue dropped 18% last week."

And then?

Metabase won't tell you why. Superset won't. FineReport won't. Tableau won't.

They all give you **"what"** — nobody gives you **"why"**.

The next 30 minutes: the ops team is dragging dimensions, adding filters, writing SQL, comparing week-over-week and year-over-year, slicing by region, by product, by channel — **manually tracing attribution**. By 9:30 the slide deck is updated.

This issue is about —

**When an LLM stands next to your domain model, can it do that 30 minutes of work itself?**

We're not talking about "install a ChatGPT plugin and have it read a PNG screenshot" — that's theater. What we want is: **the LLM actually has SQL execution rights, actually writes aggregation queries, actually produces interactive visual charts, actually delivers attribution conclusions** — and is **secure**.

Erupt Cube × LLM is exactly that.

## 2. Architecture: The LLM Grows Three Eyes Next to the Domain Model

Here's the complete picture:

```
              ┌─────────────────────────────────┐
              │   Cube semantic definition       │
              │   (annotation-driven)            │
              │   Written by engineers, in Git    │
              │                                 │
              │   @EruptCube(...)                │
              │   @Dimension / @Measure          │
              │   @Explore / @Parameter          │
              └────────────┬────────────────────┘
                           │
                           │  Scanned & registered by the cube engine
                           │
            ┌──────────────┴──────────────┐
            │                              │
            ▼                              ▼
   ┌─────────────────┐         ┌────────────────────────────┐
   │  Dashboard UI    │         │  AI Tools                  │
   │ (for business    │         │ (for the LLM — three eyes) │
   │  users, drag-    │         │                            │
   │  and-drop)       │         │ ① cubeList                 │
   │                 │         │ ② cubeMetadata             │
   │ Pick cube/Explore│        │ ③ cubeQuery                 │
   │ Configure charts │         │                            │
   │ Draft / publish  │         │                            │
   │ Version history  │         │                            │
   └─────────────────┘         └────────────────────────────┘
                                          │
                                          │  Structured chart config
                                          │  + attribution conclusion
                                          ▼
                            [Interactive visual chart]
```

Notice — **the human-facing dashboard and the LLM-facing tools both read the same `@EruptCube` metadata**.

This is Erupt's consistent bet: **metadata is the source of truth; the UI and the LLM are simply different consumers of that same metadata**.

### Take a look at the real product first

Talk is cheap — the embedded page below is the live Erupt Cube demo. You can **drag dimensions, configure measures, switch chart types, and see results** right here in the article:

<iframe
  src="https://www.erupt.xyz/#!/cube"
  width="100%"
  height="640"
  frameborder="0"
  style="border-radius: 12px; border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-soft);"
  loading="lazy"
  title="Erupt Cube Live Demo"
></iframe>

<p style="font-size: 13px; color: var(--vp-c-text-3); text-align: center; margin-top: 8px;">
  ↑ Drag dimensions / measures from the left panel · Switch chart types · Add filters — this is the assembly layer<br>
  Embed not loading? Open <a href="https://www.erupt.xyz/#!/cube" target="_blank">erupt.xyz/#!/cube</a> directly
</p>

## 3. Writing a Real Sales Cube with `@EruptCube`

Here's the code directly —

```java
@EruptCube(
    datasource = "ch",
    name = "Sales",
    description = "Sales order fact table, by order dimension",
    sql = "SELECT * FROM fact_sales",
    explores = {
        @Explore(code = "overview", name = "Overview"),
        @Explore(code = "by_region", name = "By Region",
                 dimensions = {"region", "create_date"},
                 measures = {"revenue", "order_count"}),
        @Explore(code = "by_channel", name = "By Channel",
                 dimensions = {"channel"},
                 measures = {"revenue", "aov"})
    }
)
public class SalesCube {

    @Dimension(title = "Region", description = "Sales region the order belongs to")
    private String region;

    @Dimension(title = "Channel", description = "Online / Offline / Distributor")
    private String channel;

    @Dimension(title = "Order Date", sql = "toDate(create_time)")
    private String create_date;

    @Measure(title = "Revenue", sql = "sum(amount)")
    private BigDecimal revenue;

    @Measure(title = "Order Count", sql = "count(*)")
    private Long order_count;

    @Measure(title = "AOV", sql = "sum(amount) / nullIf(count(distinct user_id), 0)")
    private BigDecimal aov;

    @Parameter(title = "Default Time Window", defaultValue = "30")
    private Integer date_window;
}
```

**Key points:**

- `@EruptCube`'s `sql` is the **base table for the entire cube** (can be a view, subquery, or JOIN); the engine extends it with WHERE / GROUP BY / HAVING using a template
- `@Measure`'s `sql` is a **real SQL aggregation expression** — `sum(amount)` / `count(distinct ...)` — write it however you like, no platform DSL
- `@Dimension` can have its own `sql` (e.g., converting a timestamp to a date)
- `@Explore` defines the "N query views this cube exposes" — "view revenue by region" and "view AOV by channel" are two different explores
- `@Parameter` is a **template variable** — SQL can contain `WHERE create_time >= now() - INTERVAL $date_window DAY`, with the parameter injected at query time

At startup, the cube engine auto-scans and registers everything. The Dashboard UI and the LLM both read the same metadata.

### Assembly is a different layer: drag dimensions and measures into a complete dashboard

It helps to distinguish two layers —

- **Semantic layer (cube)**: annotation-defined, owned by engineers, lives in Git with code review. This is the source of truth — every dimension and measure definition lives here.
- **Assembly layer (dashboard)**: fully **drag-and-drop in admin** — **drag the dimensions and measures defined in the cube and compose them into a complete dashboard**. The workflow is roughly:

    1. Pick a cube + an Explore (data view)
    2. From the left field panel, drag the **Dimensions** you want to see onto the X axis
    3. Drag the **Measures** you want to aggregate onto the Y axis
    4. Add filters (time window, region, channel, etc.)
    5. Choose a chart type (bar / line / pie / funnel / word cloud …)
    6. Arrange the layout (multiple charts per dashboard, with cross-chart linking)
    7. Save draft / publish version / rollback history

    All point-and-click — **business users self-serve, no code required**.

In other words — **engineers write the cube to define the metrics; business users assemble the dashboards themselves**. The dashboard DSL consumes the same cube metadata that the LLM sees.

That means — the "three LLM eyes" we describe below work **both for hand-annotated cubes and for dashboards business users dragged together**. A business user can put together a dashboard, and the LLM will immediately be able to answer "why did it change" inside that dashboard's semantic space.

## 4. The LLM Grows Three Eyes Next to the Cube

The cube module auto-registers 3 tools onto the LLM at startup — **you don't write any AI code** —

| Tool | What the LLM Gets |
| --- | --- |
| `cubeList` | What cubes exist in the system? What explores does each cube expose? |
| `cubeMetadata(cube, explore)` | Which dimensions can this explore GROUP BY? Which measures can it compute? Which parameters can it take? |
| `cubeQuery(query)` | Actually run the aggregation query, return JSON result set |

Two sentences in the tool descriptions are particularly critical —

> **"You MUST call cubeMetadata before cubeQuery to obtain valid field codes — never invent or guess field names."**

> **"For any data analysis task, ALWAYS prefer this tool and the cube pipeline over any other data query approach."**

These two lines are baked into the tool descriptions by the cube module — every time the LLM sees the tool list, it reads them. This locks the LLM into the "explore metadata first, then query" track — **preventing it from hallucinating field names**.

### System Prompt Auto-Injection

The module also injects a contract into the global system prompt at startup — **you don't write the tools, you don't write the prompt** — the LLM automatically sees these rules:

```text
## Data Analysis Priority
For any question involving statistics, aggregation, comparison, ranking,
trending, or visualization, **ALWAYS** use the cubeList → cubeMetadata →
cubeQuery three-step pipeline. Other tools (like raw table queries) only
return detail records and are not suitable for analysis.

## Chart Rendering
When the user requests a chart, fetch data via cubeQuery first, then output
a **structured chart configuration** (not PNG, not SVG, not a Markdown
table). The frontend renders it as an **interactive visual chart** —
zoomable, hoverable, drillable.

Layout constraints:
- Title and chart area must not overlap
- Axis labels must not be clipped
- Multi-series legends must be separated from the body
```

The whole contract isn't written in your project, isn't written in a prompt engineering file — **it loads automatically with the cube module**. Add a new cube, add a new measure, and the LLM knows immediately.

## 5. End-to-End Walkthrough: "Why Did Revenue Drop 18%"

Now let's replay the Monday standup scenario —

> **Ops team**: "Revenue dropped 18% last week. Help me figure out what went wrong."

The LLM's internal actions:

**Step 1 · Self-discovery**

```text
LLM → cubeList()
Returns → [{code: "Sales", title: "Sales", explores: [
    {code: "overview"}, {code: "by_region"}, {code: "by_channel"}
]}, ...]
```

**Step 2 · Get metadata**

```text
LLM → cubeMetadata("Sales", "overview")
Returns → {
  dimensions: [region, channel, create_date, product_line],
  measures:   [revenue, order_count, aov],
  parameters: [date_window]
}
```

**Step 3 · Last week vs. the week before**

```text
LLM → cubeQuery({
  cube: "Sales",
  explore: "overview",
  dimensions: ["create_date"],
  measures: ["revenue"],
  filters: [
    { field: "create_date", operator: "BETWEEN",
      value: ["2026-05-19", "2026-05-25"] }
  ]
})
Returns → 7 rows of daily revenue data
```

**Step 4 · Dimension drill-down — which region dropped**

```text
LLM → cubeQuery({
  cube: "Sales",
  explore: "by_region",
  dimensions: ["region"],
  measures: ["revenue"],
  customMeasures: [
    { code: "wow",
      title: "Week-over-Week",
      expression: "sum(if(create_date >= '2026-05-19', amount, 0)) / sum(if(create_date < '2026-05-19', amount, 0)) - 1" }
  ],
  filters: [
    { field: "create_date", operator: "BETWEEN",
      value: ["2026-05-12", "2026-05-25"] }
  ],
  sorts: [{ field: "wow", order: "ASC" }]
})
Returns → Week-over-week for 8 regions: East China -34%, North China -22%, rest normal
```

**Step 5 · Continue drilling — which channel dropped in East China**

```text
LLM → cubeQuery({
  cube: "Sales",
  explore: "by_channel",
  dimensions: ["channel"],
  measures: ["revenue", "order_count", "aov"],
  filters: [
    { field: "region", operator: "EQ", value: "East China" },
    { field: "create_date", operator: "BETWEEN",
      value: ["2026-05-12", "2026-05-25"] }
  ]
})
Returns → East China offline channel down 51%, online / distributors flat
```

**Step 6 · Render chart + write conclusion**

The LLM responds directly in the chat window —

```text
East China's offline channel is the main drag — revenue week-over-week
-51% (other channels flat).

[📊 Interactive chart: bar chart comparing last week vs. the week
 before across East China's three channels
 · Title, axes, legend, tooltip — all auto-configured
 · Hover for exact values; click to drill down to daily granularity]

Suggested checks: ① Were any East China offline stores closed or
taking inventory 5/19–5/25? ② Did a promotion end in East China
last week? ③ Was there any interruption in the offline POS
reporting system?
```

The "chart" the LLM returns is not a PNG screenshot or descriptive text — it's a **structured chart configuration**. The frontend renders it directly into a zoomable, hoverable, clickable interactive chart; the prose that follows serves as the attribution analysis.

**From the ops team's perspective, this is a single conversation** — but behind the scenes, the LLM is interacting with a secure, parameterized, annotation-defined semantic layer.

## 6. Why This System Won't "Hallucinate"

The greatest fear with LLM + SQL is — **the LLM gets a field name wrong, imagines the wrong table relationship, and runs SQL that looks reasonable but is actually a disaster**.

Erupt Cube × LLM uses 4 gates to compress this risk to near zero:

**Gate 1: The LLM Doesn't Write SQL**

The LLM outputs a structured query object (dimensions / measures / filters / sorts). The final SQL is **deterministically generated** by the cube engine using a template — the LLM never gets a chance to concatenate dangerous strings.

**Gate 2: Field Names Must Come from `cubeMetadata` First**

The tool description enforces "never invent field names," and the backend validates that every `dimensions` / `measures` code must exist in the metadata. If the LLM tries to use a nonexistent field, it's immediately rejected.

**Gate 3: All Filters Are Parameterized**

The 16 filter operators the cube exposes (EQ / IN / BETWEEN / FEW_DAYS / FUTURE_DAYS, etc.) are backed by **parameterized JDBC binding** — **SQL injection is structurally impossible**.

**Gate 4: The CubeProxy Hook Lets You Add Another Layer**

Implement a `CubeProxy` Bean — the cube engine calls it right before the final SQL leaves, **letting you add one more WHERE clause** (row-level security, tenant isolation, sensitive field filtering):

```java
@Component
public class SalesCubeProxy extends AbstractCubeProxy {
    @Override
    public void beforeQuery(CubeParseContext ctx) {
        // Sales staff can only see their own region
        Long uid = MetaContext.getUser().getId();
        ctx.addFilter("region IN (SELECT region FROM user_region WHERE user_id = " + uid + ")");
    }
}
```

This layer means Cube × LLM, admin, and API all run on the **same Erupt permission model** — not a separate one invented for AI.

## 7. Compared to Traditional BI

| Dimension | **Metabase / Superset** | **Tableau / FineReport** | **Erupt Cube × LLM** |
| --- | --- | --- | --- |
| Data definition | UI drag + write your own SQL | Drag dimensions / datasets | **`@EruptCube` annotations, Git-managed; dashboards assembled by drag-and-drop** |
| Field name drift | One schema change breaks everything | Dataset needs reconnecting | **Metadata scanning auto-syncs** |
| User capability required | Needs to drag + write SQL | 1–2 weeks of training | **Ask in natural language** |
| Chart generation | Drag controls | Drag controls | **LLM auto-generates interactive visual charts** |
| Attribution | Manual drill-down | Manual drill-down | **LLM drills down and writes conclusion** |
| Multiple data sources | Configure in UI | Configure in UI | **Configure multiple datasources, cubes reference by name** |
| Permissions | Platform built-in | Platform built-in | **`CubeProxy` + Erupt RBAC, same source** |
| LLM integration | Third-party plugins / screenshot to GPT | Same | **Cube module's built-in tool chain + structured chart output** |
| Best for | Data teams building dashboards | Enterprise BI | **Backend / internal systems + LLM-Native analytics** |

We're not saying Metabase / Superset / FineReport are bad — they each hold their own ground firmly.

But **when your data is already in the Java backend, your domain model is already in `@Entity` / `@EruptCube` annotations, and your users are already conversing in the admin panel** — adding a separate BI tool creates a second track. Erupt Cube × LLM lets the BI dashboard grow directly alongside the domain model, **letting the LLM do its work inside the same semantic space**.

## 8. How This Connects to Issues 01 and 03

Looking back, you'll see —

**Issue 01** covered the AI Harness: 17 LLM providers, MCP protocol, A2A cross-agent, cross-session Memory — arming the Java backend as LLM-Native.

**Issue 03** covered the "annotation approach": `@Entity` + `@Erupt` makes metadata = UI = API = LLM Tool from the same source — the LLM can directly CRUD any JPA entity.

**This issue** stitches those two threads together — `@EruptCube` makes metadata = dashboard = LLM analytics tool from the same source. The LLM is no longer just a chat box next to admin; it has grown **a third eye** next to the domain model: **it writes aggregation queries, produces charts, and writes attribution analysis**.

> Metadata = UI
> Metadata = REST API
> Metadata = LLM Tool (CRUD)
> Metadata = LLM Analytics Perspective (Cube)

This is Erupt's sharpest bet — **treat the LLM as a Spring Bean, treat metadata as the LLM's input surface, and let UI / API / Cube / LLM all grow out of the same annotations**.

## 9. Running in 5 Minutes

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-cube-puzzle</artifactId>
</dependency>
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-ai-claw</artifactId>
</dependency>
```

```yaml
erupt:
  cube:
    show-sql: true
    datasource:
      ch:
        jdbc-url: jdbc:clickhouse://host:8123/db
        username: reader
        driver-class-name: ru.yandex.clickhouse.ClickHouseDriver
```

1. Write one `@EruptCube` class (10 lines minimum)
2. Start the app → a "Dashboard" menu appears in admin where business users drag charts, configure Explores, and publish versions
3. Open AI Chat → ask "where did last week's revenue drop?"
4. The LLM automatically runs `cubeList → cubeMetadata → cubeQuery`, returns a chart and a conclusion

The entire process takes under 5 minutes.

## 10. Closing Thoughts

The worldview of traditional BI: **humans ask questions, tools draw charts, humans interpret**.

The worldview of Erupt Cube × LLM: **humans ask questions, tools answer**.

The middle step — "draw chart + interpret" — is taken over by the LLM. Not because the LLM suddenly got smarter, but because —

- A **deterministic semantic layer** (`@EruptCube`-annotated cube / dimension / measure / explore) gives the LLM a clear contract
- Tool descriptions force the LLM to follow the **"explore first, then query" track** inside that semantic layer
- A structured chart output contract means the LLM **speaks the same language as the frontend** — renders into zoomable, hoverable interactive charts
- The permission model (`CubeProxy` + Erupt RBAC) means the LLM **operates under the same constraints as ops users**

This is not "add a ChatGPT button to BI." This is rewriting the entire "why" layer of the BI dashboard **with annotations + Spring Beans + LLM**.

Next Monday, five minutes before the standup —

> "Revenue dropped 18% last week. Help me figure out what went wrong."

Hopefully you'll hear the dashboard answer for itself.

:::tip Ready to Try It
Follow the 4 steps in §9 to get up and running. Stuck? Ask in [GitHub Discussions](https://github.com/erupts/erupt/discussions), or scan the QR code at the top of the article to join the community.
:::
