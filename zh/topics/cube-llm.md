---
title: "让 BI 看板自己回答'为什么变了'——Erupt Cube × LLM 的新姿势"
description: 传统 BI 工具给你"是什么"，Erupt Cube × LLM 给你"为什么"。@EruptCube 注解定义语义层，LLM 在领域模型旁边长出三只眼睛（cubeList → cubeMetadata → cubeQuery），自己写 SQL、出图、写归因。
outline: deep
---

# 第 04 期 · 让 BI 看板自己回答"为什么变了"

> 第 01 期我们讲了 Erupt 的 AI Harness——17 个 LLM、MCP、A2A、跨会话 Memory。
> 第 03 期我们讲了"注解派"——元数据 = UI = API = LLM Tool 同源。
> 这一期把这两条线缝到一起：**LLM 不再只是 admin 旁边的聊天框，它在领域模型旁边长出了三只眼睛，会自己写 SQL、出图、给归因**。
>
> _发布于 2026-05-28 · 阅读 ~11 min_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt 微信公众号" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · 公众号</div>
    <div class="topic-mp-qr__title">扫码关注 Erupt 公众号</div>
    <p class="topic-mp-qr__desc">每期专题首发于此，另有版本动态、源码解读、社区精选案例。</p>
  </div>
</div>

## 一、所有 BI 看板都有的一个老问题

你打开周一早会前 5 分钟的销售看板——

> "上周营收掉了 18%。"

然后呢？

Metabase 不会告诉你为什么。Superset 不会。帆软不会。Tableau 也不会。

它们给你**"是什么"**，没人给你**"为什么"**。

剩下的 30 分钟，运营在拖维度、加过滤、写 SQL、对比同比环比、切大区切产品切渠道——**手动追溯归因**。最后赶在 9:30 把 PPT 改完。

这一期讲的是——

**当 LLM 站在领域模型旁边，它能不能自己把这 30 分钟干完？**

我们不是说"装一个 ChatGPT 插件让它读 PNG 截图"——那是表演。我们要的是：**LLM 真的拿到 SQL 执行权、真的会写聚合查询、真的能配上可视化可交互图表、真的把归因结论吐回来**——而且**安全**。

Erupt Cube × LLM 就是这套东西。

## 二、整体架构：LLM 在领域模型旁边长出三只眼睛

先把全景图摆出来：

```
              ┌─────────────────────────────────┐
              │   Cube 语义定义（注解派）          │
              │   工程师写、跟着 Git 走             │
              │                                 │
              │   @EruptCube(...)                │
              │   @Dimension / @Measure          │
              │   @Explore / @Parameter          │
              └────────────┬────────────────────┘
                           │
                           │  cube 引擎扫描注册
                           │
            ┌──────────────┴──────────────┐
            │                              │
            ▼                              ▼
   ┌─────────────────┐         ┌────────────────────────────┐
   │  Dashboard UI    │         │  AI Tools                  │
   │ （业务用，拖拽）  │         │ （LLM 用，三只眼睛）         │
   │                 │         │                            │
   │ 选 cube / Explore │        │ ① cubeList                  │
   │ 配图表 / 发布     │        │ ② cubeMetadata             │
   │ 草稿 / 历史版本   │         │ ③ cubeQuery                 │
   └─────────────────┘         └────────────────────────────┘
                                          │
                                          │  结构化图表配置
                                          │  + 归因结论
                                          ▼
                                [可视化可交互图表]
```

注意——**人类用 dashboard 和 LLM 用 tools，看的是同一份 `@EruptCube` 元数据**。

这是 Erupt 一贯的赌注：**元数据是真理来源，UI 和 LLM 都只是元数据的不同消费者**。

### 先看一眼真实产品

口说无凭——下面这个嵌入页就是 Erupt Cube 的在线 demo，你可以直接在文章里**拖维度、配指标、切图表、看效果**：

<iframe
  src="https://www.erupt.xyz/#!/cube"
  width="100%"
  height="640"
  frameborder="0"
  style="border-radius: 12px; border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-soft);"
  loading="lazy"
  title="Erupt Cube 在线 Demo"
></iframe>

<p style="font-size: 13px; color: var(--vp-c-text-3); text-align: center; margin-top: 8px;">
  ↑ 拖左侧维度 / 指标到中间区域 · 切换图表类型 · 加过滤条件——这就是装配层<br>
  打不开？直接访问 <a href="https://www.erupt.xyz/#!/cube" target="_blank">erupt.xyz/#!/cube</a>
</p>

## 三、用 `@EruptCube` 写一个真实的销售 Cube

直接看代码——

```java
@EruptCube(
    datasource = "ch",
    name = "Sales",
    description = "销售订单事实表，按订单维度",
    sql = "SELECT * FROM fact_sales",
    explores = {
        @Explore(code = "overview", name = "总览"),
        @Explore(code = "by_region", name = "按区域",
                 dimensions = {"region", "create_date"},
                 measures = {"revenue", "order_count"}),
        @Explore(code = "by_channel", name = "按渠道",
                 dimensions = {"channel"},
                 measures = {"revenue", "aov"})
    }
)
public class SalesCube {

    @Dimension(title = "区域", description = "订单所属销售大区")
    private String region;

    @Dimension(title = "渠道", description = "线上 / 线下 / 经销商")
    private String channel;

    @Dimension(title = "下单日期", sql = "toDate(create_time)")
    private String create_date;

    @Measure(title = "营收", sql = "sum(amount)")
    private BigDecimal revenue;

    @Measure(title = "订单数", sql = "count(*)")
    private Long order_count;

    @Measure(title = "客单价", sql = "sum(amount) / nullIf(count(distinct user_id), 0)")
    private BigDecimal aov;

    @Parameter(title = "默认时间窗口", defaultValue = "30")
    private Integer date_window;
}
```

**关键点：**

- `@EruptCube` 的 `sql` 是**整个 cube 的底表**（可以是 view、子查询、JOIN），背后会被模板再加 WHERE / GROUP BY / HAVING
- `@Measure` 的 `sql` 是**真 SQL 聚合表达式**——`sum(amount)` / `count(distinct ...)` 你想怎么写就怎么写，不是平台 DSL
- `@Dimension` 可以挂自己的 `sql`（比如把时间戳转成日期）
- `@Explore` 定义"这个 cube 对外的 N 种查询视图"——比如"按区域看营收"和"按渠道看客单价"是两个不同 explore
- `@Parameter` 是 **模板变量**——SQL 里可以写 `WHERE create_time >= now() - INTERVAL $date_window DAY`，参数在查询时注入

启动后 cube 引擎自动扫描注册，Dashboard UI 和 LLM 看的是同一份元数据。

### 装配是另一回事：把维度和指标拖出来组成一个完整看板

要分清两层——

- **语义层（cube）**：注解定义，由工程师管，跟着 Git 走 code review。这是数据的"真理来源"，所有维度和指标的口径都在这里。
- **装配层（dashboard）**：admin 里**全可视化拖拽**——**把 cube 里定义好的「维度」和「指标」拖出来，组合配置成一个完整的 Dashboard 看板**。工作流大致是：

    1. 选一个 cube + 一个 Explore（数据视角）
    2. 从左侧字段面板把要看的**维度（Dimension）**拖到 X 轴
    3. 把要算的**指标（Measure）**拖到 Y 轴
    4. 加过滤条件（时间窗口、地区、渠道等）
    5. 挑图表类型（柱 / 线 / 饼 / 漏斗 / 词云 …）
    6. 拖布局（同一个看板可以放多张图、设联动）
    7. 草稿保存 / 版本发布 / 历史回滚

    全是点点拖拖——**业务零代码自助**。

意思是——**工程师写 cube 定义口径，业务自己组装看板**。看板的 DSL 是同一份 cube 元数据的消费者，跟 LLM 看到的是同一份。

也就是说——下面这一节讲的"LLM 三只眼睛"对**手写注解的 cube 和业务拖出来的看板都生效**。业务自己拖一个看板出来，LLM 立刻就能在这个看板的语义空间里回答"为什么变了"。

## 四、LLM 在 cube 旁边长了三只眼睛

cube 模块在启动时给 LLM 自动挂上 3 个工具，**用户不写任何 AI 代码**——

| 工具 | LLM 拿到什么 |
| --- | --- |
| `cubeList` | 系统里有哪些 cube？每个 cube 暴露哪些 explore？ |
| `cubeMetadata(cube, explore)` | 这个 explore 能 GROUP BY 哪些维度、能算哪些度量、能传哪些参数？ |
| `cubeQuery(query)` | 真正跑聚合查询，返回结果集 JSON |

工具描述里有两句话特别关键——

> **"You MUST call cubeMetadata before cubeQuery to obtain valid field codes — never invent or guess field names."**

> **"For any data analysis task, ALWAYS prefer this tool and the cube pipeline over any other data query approach."**

这两句话由 cube 模块写死在 Tool 的描述里，每次 LLM 看到工具列表都会读到——直接把 LLM 框死在"先探元数据、再写查询"的轨道里，**不会让它去 hallucinate 字段名**。

### 系统提示词自动注入

模块启动时往全局 system prompt 注入一段契约——**用户既不用写工具、也不用写 prompt**，LLM 自动看到下面这套规则：

```text
## Data Analysis Priority
对任何涉及统计、聚合、对比、排名、趋势、可视化的提问，**ALWAYS** 走
cubeList → cubeMetadata → cubeQuery 三步骤管道。
其他工具（如原始表查询）只能拿到明细记录，不适合分析。

## Chart Rendering
当用户要求图表时，先用 cubeQuery 拿数据，再输出**结构化的图表配置**（不是 PNG、
不是 SVG、不是 Markdown 表格）。前端识别后渲染为**可视化可交互图表**——可缩放、
可悬停、可点击下钻。

布局约束：
- 标题与图表区不重叠
- 轴标签不被裁剪
- 多系列时 legend 与正文分离
```

整套契约不是写在用户工程里、不是写在 prompt 工程里——**它跟着 cube 模块自动加载**。新加一个 cube、新加一个 measure，LLM 立刻知道。

## 五、"为什么营收掉了 18%"的端到端走查

现在重放周一早会那个场景——

> **运营**："上周营收掉了 18%，帮我看下哪里出了问题。"

LLM 的内部动作：

**Step 1 · 自己探索**

```text
LLM → cubeList()
返回 → [{code: "Sales", title: "销售", explores: [
    {code: "overview"}, {code: "by_region"}, {code: "by_channel"}
]}, ...]
```

**Step 2 · 拿元数据**

```text
LLM → cubeMetadata("Sales", "overview")
返回 → {
  dimensions: [region, channel, create_date, product_line],
  measures:   [revenue, order_count, aov],
  parameters: [date_window]
}
```

**Step 3 · 上周 vs 上上周对比**

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
返回 → 7 行日营收数据
```

**Step 4 · 维度下钻——按区域看哪里掉了**

```text
LLM → cubeQuery({
  cube: "Sales",
  explore: "by_region",
  dimensions: ["region"],
  measures: ["revenue"],
  customMeasures: [
    { code: "wow",
      title: "周环比",
      expression: "sum(if(create_date >= '2026-05-19', amount, 0)) / sum(if(create_date < '2026-05-19', amount, 0)) - 1" }
  ],
  filters: [
    { field: "create_date", operator: "BETWEEN",
      value: ["2026-05-12", "2026-05-25"] }
  ],
  sorts: [{ field: "wow", order: "ASC" }]
})
返回 → 8 个区域的周环比，华东 -34%、华北 -22%、其他正常
```

**Step 5 · 继续下钻——华东掉在哪个渠道**

```text
LLM → cubeQuery({
  cube: "Sales",
  explore: "by_channel",
  dimensions: ["channel"],
  measures: ["revenue", "order_count", "aov"],
  filters: [
    { field: "region", operator: "EQ", value: "华东" },
    { field: "create_date", operator: "BETWEEN",
      value: ["2026-05-12", "2026-05-25"] }
  ]
})
返回 → 华东线下渠道掉了 51%，线上 / 经销商持平
```

**Step 6 · 出图 + 写结论**

LLM 在聊天框里直接返回——

```text
华东线下渠道是主要拖累，营收周环比 -51%（其他渠道持平）。

[📊 可视化交互图表：华东三个渠道上周 vs 上上周营收对比柱状图
 · 标题、坐标轴、图例、tooltip 全自动配置
 · 鼠标悬停看具体数值，可点击下钻到日级别]

建议核查：①线下门店 5/19-5/25 是否有大面积闭店或盘点？
②上周华东是否有促销活动结束？③线下收银系统是否有上报中断？
```

LLM 返回的"图表"不是 PNG 截图、不是描述文字，是一段**结构化的图表配置**——前端直接渲染成可缩放、可悬停、可点击的交互式图表；后面的文字作为归因解读。

**整个过程对运营来说是一次对话**——但背后是 LLM 在跟一个安全、参数化、被注解定义的语义层在交互。

## 六、为什么这套不会"AI 胡说"

LLM + SQL 最大的恐惧是——**LLM 把字段名写错、把表关系想象错、跑出一个看似合理但实际灾难的 SQL**。

Erupt Cube × LLM 用 4 道闸把这个风险压到很低：

**第 1 道：LLM 不写 SQL**

LLM 输出的是一个结构化的查询对象（dimensions / measures / filters / sorts），最终 SQL 由 cube 引擎用模板**确定性生成**——LLM 没机会拼接危险字符串。

**第 2 道：字段必须先 `cubeMetadata` 拿到**

工具描述强制要求"never invent field names"，且后端会校验 `dimensions` / `measures` 里的 code 必须存在于 metadata。LLM 想用一个不存在的字段，直接被拒。

**第 3 道：过滤器全部参数化**

cube 暴露的 16 个过滤操作符（EQ / IN / BETWEEN / FEW_DAYS / FUTURE_DAYS 等）背后是**参数化 JDBC 绑定**——**SQL 注入在结构上不可能**。

**第 4 道：CubeProxy 钩子还能再加一层**

实现一个 `CubeProxy` Bean，cube 引擎在最终 SQL 出去之前会调它，**让你能再加一层 WHERE**（行级权限、租户隔离、敏感字段过滤）：

```java
@Component
public class SalesCubeProxy extends AbstractCubeProxy {
    @Override
    public void beforeQuery(CubeParseContext ctx) {
        // 销售只能看自己大区
        Long uid = MetaContext.getUser().getId();
        ctx.addFilter("region IN (SELECT region FROM user_region WHERE user_id = " + uid + ")");
    }
}
```

这一层让 Cube × LLM 跟 admin / API 走的是**同一套 Erupt 权限模型**——不是给 AI 额外发明一份。

## 七、对位传统 BI

| 维度 | **Metabase / Superset** | **Tableau / 帆软** | **Erupt Cube × LLM** |
| --- | --- | --- | --- |
| 数据定义 | UI 拖维度 + 自己写 SQL | 拖维度 / 数据集 | **`@EruptCube` 注解，Git 管理；看板装配再拖** |
| 字段名漂移 | 表 schema 改一改全炸 | 数据集要重新连 | **元数据扫描自动同步** |
| 用户能力 | 会拖会写 SQL 才行 | 培训 1-2 周 | **自然语言提问** |
| 出图 | 拖控件 | 拖控件 | **LLM 自动产出可视化交互图表** |
| 归因 | 人肉钻取 | 人肉钻取 | **LLM 自己下钻 + 写结论** |
| 多数据源 | UI 配 | UI 配 | **配置多个数据源，cube 按名称引用** |
| 权限 | 平台内置 | 平台内置 | **`CubeProxy` + Erupt RBAC 同源** |
| LLM 集成 | 第三方插件 / 截图 GPT | 同左 | **cube 模块内置工具链 + 结构化图表输出** |
| 适合场景 | 数据团队画看板 | 企业级 BI | **后台 / 内部系统 + LLM-Native 分析** |

我们不是说 Metabase / Superset / 帆软不好——它们各自的主场依然稳。

但**当你的数据已经在 Java 后端、领域模型已经在 `@Entity` / `@EruptCube` 注解里、用户已经在 admin 后台对话**——再多接一个独立 BI 工具就是双轨。Erupt Cube × LLM 让 BI 看板直接长在领域模型旁边，**让 LLM 在同一个语义空间里干活**。

## 八、和第 01 期、第 03 期的连接

回头看你会发现——

**第 01 期** 我们讲了 AI Harness：17 个 LLM provider、MCP 协议、A2A 跨 Agent、跨会话 Memory——把 Java 后端武装成 LLM-Native。

**第 03 期** 我们讲了"注解派"：`@Entity` + `@Erupt` 让元数据 = UI = API = LLM Tool 同源——LLM 直接 CRUD 任意 JPA 实体。

**这一期** 把两条线缝到一起——`@EruptCube` 让元数据 = 看板 = LLM 分析工具同源。LLM 不再只是 admin 旁的聊天框，它在领域模型旁边长出了**第三只眼睛**：**会写聚合查询、会出图、会写归因**。

> 元数据 = UI
> 元数据 = REST API
> 元数据 = LLM Tool（CRUD）
> 元数据 = LLM 分析视角（Cube）

这是 Erupt 最锋利的押注——**把 LLM 当成 Spring Bean、把元数据当成 LLM 的输入面，UI / API / Cube / LLM 都从同一份注解里长出来**。

## 九、5 分钟跑通

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

1. 写一个 `@EruptCube` 类（10 行起步）
2. 启动 → admin 里多出"看板"菜单，业务自己拖图表、配 Explore、发布版本
3. 打开 AI Chat → 问"上周营收哪里掉了"
4. LLM 自动 `cubeList → cubeMetadata → cubeQuery` 三连，回图 + 回结论

整个过程不超过 5 分钟。

## 十、写在最后

传统 BI 的世界观是——**人类问问题，工具画图，人类解读**。

Erupt Cube × LLM 的世界观是——**人类问问题，工具回答**。

中间那一步"画图 + 解读"被 LLM 接管了。这不是因为 LLM 突然变聪明，是因为——

- **确定性的语义层**（`@EruptCube` 注解定义的 cube / dimension / measure / explore）让 LLM 有一份明确的契约
- 工具描述强制 LLM 在这个语义层里**只走"先探后查"的轨道**
- 结构化图表输出契约让 LLM **跟前端用同一种语言**，渲染成可缩放、可悬停的交互式图表
- 权限模型（CubeProxy + Erupt RBAC）让 LLM **跟运营受同一套约束**

这套东西不是"给 BI 加个 ChatGPT 按钮"。这是把整个 BI 看板的"为什么"层，**用注解 + Spring Bean + LLM 三件套重写了一遍**。

下次周一早会前 5 分钟——

> "上周营收掉了 18%，帮我看下哪里出了问题。"

希望你能听到看板自己回答。

:::tip 想立刻动手
跟着 §九 4 个 step 就能跑通。卡住了？去 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 提问，或扫文首二维码加群。
:::
