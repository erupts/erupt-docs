# AI 问数

`erupt-cube-puzzle` 模块内置一组面向大模型的分析工具：AI Agent 可以自主发现语义模型、读取维度与指标元数据、执行聚合查询，并将结果直接渲染为图表。指标口径与数据权限依然由语义层统一收口 —— 大模型查到的每个数字都出自治理过的 Cube，而不是"编"出来的。

:::tip 为什么让 AI 查语义层，而不是直接写 SQL 查底表
让大模型直接面对底表，既要把全部表结构塞进上下文，又无法保证聚合逻辑与指标口径一致。AI 问数走的是 `cubeList → cubeMetadata → cubeQuery` 管线：聚合语义、GROUP BY 逻辑、行级数据权限全部由 Cube 层保证，答案可信、可复现，且对大规模 OLAP 查询效率远高于逐行扫描明细。
:::

## 快速开始

### 1. 添加依赖

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-cube-puzzle</artifactId>
    <version>${LATEST-VERSION}</version>
</dependency>
```

AI 问数基于 [erupt-ai](/zh/modules/erupt-ai) 提供的 LLM 接入能力（OpenAI、Claude、Gemini、DeepSeek、Qwen、Ollama 本地模型等 17+ 提供商），请确保项目已引入 `erupt-ai` 并在管理端配置好大模型。

### 2. 直接提问

打开后台的 AI 助手，用自然语言提问：

> 上季度各品类的营收 Top 3 是哪些？环比表现如何？

Agent 会自动完成工具链调用：

```
cubeList()                    → 发现可用的语义模型
cubeMetadata("SalesCube", …)  → 读取维度 / 指标 / 参数的字段代码
cubeQuery({ … })              → 执行聚合查询
```

若要求图表，Agent 会输出 ` ```echarts ` 代码块，前端 AI 对话组件会将其渲染为**可交互的 ECharts 图表**。

## 工具集

`EruptCubeAiTools`（标注 `@AiToolbox`）在应用启动时自动注册，无需任何配置。它向大模型暴露三个工具：

| 工具 | 作用 |
| --- | --- |
| `cubeList()` | 列出全部可用的 Cube 及其 Explore 视图（code、title、description） |
| `cubeMetadata(cube, explore)` | 读取指定 Cube 的维度、指标、参数元数据及字段代码 |
| `cubeQuery(query)` | 执行聚合查询，返回分组结果行 |

工具描述中内置了严格的调用约束：字段代码**必须**来自 `cubeMetadata` 的返回值，Explore 代码**必须**来自 `cubeList` 的返回值 —— 从机制上阻止大模型编造字段名。

### cubeQuery 查询结构

| 字段 | 说明 |
| --- | --- |
| `cube` | 必填，Cube 代码（来自 `cubeList`） |
| `explore` | Explore 视图代码，不确定时用 `overview` |
| `dimensions` | 分组维度字段代码，省略则返回总计行 |
| `measures` | 预定义指标字段代码 |
| `customMeasures` | 临时指标 `{code, title, expression}`，expression 须为 SQL 聚合表达式 |
| `filters` | 过滤条件 `{field, operator, value}`，支持 16+ 算子：`EQ` / `NEQ` / `LIKE` / `IN` / `BETWEEN` / `FEW_DAYS`（近 N 天）/ `FUTURE_DAYS` 等 |
| `sorts` | 排序 `{field, order}`（ASC / DESC） |
| `parameter` | `@Parameter` 声明的 Velocity 模板变量 |
| `limit` / `offset` | 分页 |
| `dryRun` | 为 `true` 时只返回生成的 SQL，不执行 |

## 内置系统提示词

`EruptCubeAiTools` 同时注册了一段系统提示词，约束 Agent 的分析行为：

- **数据分析优先级** —— 凡涉及统计、聚合、对比、排名、趋势、可视化的问题，一律优先走 Cube 查询管线，而不是查原始明细表；
- **图表渲染规范** —— 要求图表以 ` ```echarts ` 代码块输出完整的 ECharts option JSON，并内置标题、图例、坐标轴的布局规则，保证渲染质量。

## MCP Server：向外部 Agent 开放问数能力

`erupt-ai` 内置 MCP（Model Context Protocol）Server，`@AiToolbox` 标注的工具会**自动暴露为 MCP tools**：

```yaml
erupt:
  ai:
    mcp:
      server-enabled: true   # 默认 false
      name: erupt-mcp        # MCP Server 名称
```

- SSE 端点：`/mcp/sse`
- 鉴权：请求头 `Authorization: Bearer {token}`，token 为 Erupt OpenApi 的 secret

Claude Desktop、Cursor 等任何 MCP 客户端接入后，即可直接调用 `cubeList` / `cubeMetadata` / `cubeQuery` 问数。

## 口径与权限保证

- 三个工具全部经由语义层查询接口执行，与页面拖拽分析走**同一条链路**：行级数据权限继续生效；
- 指标聚合逻辑来自 `@Measure` 的预定义语义，AI 无法绕过口径自行计算；
- 查询是只读的，不存在写入风险。

## 典型场景

| 场景 | 说明 |
| --- | --- |
| 后台 ChatBI | 业务人员在管理后台用自然语言问数，即问即答、即答即图 |
| 外部 AI Agent | 通过 MCP Server 将问数能力接入 Claude Desktop、Cursor 或自研 Agent |
| SQL 型 Agent | 习惯写 SQL 的 Agent 也可通过 [SQL 查询端口](/zh/modules/pro/erupt-cube/sql) 以 JDBC/psql 直连语义层 |
