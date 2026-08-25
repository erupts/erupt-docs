# AI Query

The `erupt-cube-puzzle` module ships a set of LLM-facing analysis tools: an AI agent can discover semantic models on its own, read dimension & measure metadata, run aggregate queries, and render the results as charts. Metric definitions and data permissions are still enforced by the semantic layer — every number the model sees comes from a governed Cube, not from hallucination.

:::tip Why let AI query the semantic layer instead of writing raw SQL
Pointing an LLM at raw tables means stuffing every schema into the context window with no guarantee of consistent aggregation logic or metric definitions. AI Query follows the `cubeList → cubeMetadata → cubeQuery` pipeline: aggregation semantics, GROUP BY logic, and row-level permissions are all guaranteed by the Cube layer — answers are trustworthy and reproducible, and far more efficient than scanning detail records for large-scale OLAP workloads.
:::

## Quick Start

### 1. Add the dependency

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-cube-puzzle</artifactId>
    <version>${LATEST-VERSION}</version>
</dependency>
```

AI Query builds on the LLM access provided by [erupt-ai](/en/modules/erupt-ai) (17+ providers: OpenAI, Claude, Gemini, DeepSeek, Qwen, local Ollama models, and more). Make sure `erupt-ai` is on the classpath and an LLM is configured in the admin console.

### 2. Just ask

Open the AI assistant in the admin console and ask in natural language:

> What were the top 3 categories by revenue last quarter, and how did they trend month-over-month?

The agent completes the tool chain automatically:

```
cubeList()                    → discover available semantic models
cubeMetadata("SalesCube", …)  → read field codes for dimensions / measures / parameters
cubeQuery({ … })              → run the aggregate query
```

When a chart is requested, the agent emits an ` ```echarts ` code block, which the AI chat component renders as an **interactive ECharts chart**.

## The Toolset

`EruptCubeAiTools` (annotated with `@AiToolbox`) registers itself automatically at startup — no configuration required. It exposes three tools to the LLM:

| Tool | Purpose |
| --- | --- |
| `cubeList()` | List every available Cube and its Explore views (code, title, description) |
| `cubeMetadata(cube, explore)` | Read a Cube's dimensions, measures, and parameters with their exact field codes |
| `cubeQuery(query)` | Execute an aggregate query and return grouped result rows |

The tool descriptions embed strict calling constraints: field codes **must** come from `cubeMetadata` results and Explore codes **must** come from `cubeList` results — mechanically preventing the model from inventing field names.

### cubeQuery structure

| Field | Description |
| --- | --- |
| `cube` | Required, the Cube code (from `cubeList`) |
| `explore` | Explore view code; use `overview` when uncertain |
| `dimensions` | Field codes to GROUP BY; omit for a single grand-total row |
| `measures` | Pre-defined measure field codes |
| `customMeasures` | Ad-hoc metrics `{code, title, expression}`; expression must be a SQL aggregation |
| `filters` | Filter conditions `{field, operator, value}` with 16+ operators: `EQ` / `NEQ` / `LIKE` / `IN` / `BETWEEN` / `FEW_DAYS` (last N days) / `FUTURE_DAYS`, etc. |
| `sorts` | Sorting `{field, order}` (ASC / DESC) |
| `parameter` | Velocity template variables declared with `@Parameter` |
| `limit` / `offset` | Pagination |
| `dryRun` | When `true`, return the generated SQL without executing |

## Built-in System Prompt

`EruptCubeAiTools` also registers a system prompt that governs the agent's analytical behavior:

- **Data analysis priority** — any question involving statistics, aggregation, comparison, ranking, trending, or visualization must go through the Cube query pipeline rather than raw detail tables;
- **Chart rendering rules** — charts are emitted as complete ECharts option JSON inside an ` ```echarts ` block, with built-in layout rules for titles, legends, and axes to guarantee rendering quality.

## MCP Server: Opening AI Query to External Agents

`erupt-ai` ships a built-in MCP (Model Context Protocol) server, and every `@AiToolbox` tool is **automatically exposed as an MCP tool**:

```yaml
erupt:
  ai:
    mcp:
      server-enabled: true   # default false
      name: erupt-mcp        # MCP server name
```

- SSE endpoint: `/mcp/sse`
- Auth: `Authorization: Bearer {token}` header, where the token is the Erupt OpenApi secret

Once connected, any MCP client — Claude Desktop, Cursor, or your own agent — can call `cubeList` / `cubeMetadata` / `cubeQuery` directly.

## Metric & Permission Guarantees

- All three tools execute through the semantic layer's query interface — the **same path** as drag-and-drop analysis, so row-level data permissions remain in force;
- Aggregation logic comes from the pre-defined semantics of `@Measure`; the AI cannot bypass metric definitions with its own math;
- Queries are read-only — there is no write risk.

## Typical Scenarios

| Scenario | Description |
| --- | --- |
| In-app ChatBI | Business users ask questions in natural language in the admin console — instant answers, instant charts |
| External AI agents | Expose AI Query to Claude Desktop, Cursor, or custom agents via the MCP server |
| SQL-oriented agents | Agents that prefer SQL can also connect to the semantic layer over JDBC/psql via the [SQL Port](/en/modules/pro/erupt-cube/sql) |
