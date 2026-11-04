# @Vis 多视图

`@Vis` 允许在同一个 Erupt 实体上挂载多个视图，以 Tab 形式并排展示。通过 `visRawTable` 控制是否保留默认表格，`vis` 数组添加额外视图。

> **1.13.2 及以上版本支持**

## 基础用法

```java
@Erupt(
    name = "任务管理",
    visRawTable = true,
    vis = {
        @Vis(title = "卡片", type = Vis.Type.CARD, cardView = @CardView),
        @Vis(title = "甘特图", type = Vis.Type.GANTT,
             ganttView = @GanttView(startDateField = "startDate", endDateField = "endDate"))
    }
)
@Entity
public class Task extends BaseModel { ... }
```

## @Vis 属性说明

| 属性名 | 描述 |
|--------|------|
| `code` | 视图唯一标识，可选 |
| `title` | Tab 标签名称（必填） |
| `desc` | 视图描述 |
| `type` | 视图类型，默认 `TABLE`，见下方枚举 |
| `fieldVisibility` | 字段可见性模式：`INCLUDE`（仅显示）/ `EXCLUDE`（排除），默认 `EXCLUDE` |
| `fields` | 配合 `fieldVisibility` 使用的字段名列表 |
| `filter` | 该视图独立的数据过滤条件（`@Filter`） |
| `orderBy` | 该视图独立的排序规则（`@Sort`） |
| `show` | 动态控制 Tab 是否显示（`ExprBool`） |
| `cardView` | 卡片视图配置，`type = CARD` 时生效，详见 [卡片视图](/zh/annotation/vis-card) |
| `ganttView` | 甘特图配置，`type = GANTT` 时生效，详见 [甘特图](/zh/annotation/vis-gantt) |
| `calendarView` | 日历视图配置，`type = CALENDAR` 时生效，详见 [日历视图](/zh/annotation/vis-calendar)（2.0.0+） |
| `boardView` | 看板视图配置，`type = BOARD` 时生效，详见 [看板视图](/zh/annotation/vis-board)（2.0.0+） |
| `tableView` | 表格分组配置，`type = TABLE` 时生效，见下方 [TABLE 视图：分组](#table-视图分组)（2.4.0+） |
| `timelineView` | 时间线配置，`type = TIMELINE` 时生效，详见 [时间线视图](/zh/annotation/vis-timeline)（2.4.0+） |
| `mapView` | 地图配置，`type = MAP` 时生效，详见 [地图视图](/zh/annotation/vis-map)（2.4.0+） |
| `cubeView` | 指标图表配置，`type = CUBE` 时生效，详见 [指标图表视图](/zh/annotation/vis-cube)（2.4.0+） |
| `tplView` | 自定义模板配置，`type = TPL` 时生效，详见 [自定义视图](/zh/annotation/vis-tpl) |

### Type 枚举

| 值 | 描述 |
|----|------|
| `TABLE` | 表格视图（可配合字段过滤与 `tableView` 分组） |
| `CARD` | 卡片/网格视图，详见 [卡片视图](/zh/annotation/vis-card) |
| `GANTT` | 甘特图，详见 [甘特图](/zh/annotation/vis-gantt) |
| `CALENDAR` | 日历视图，配合 `calendarView` 使用，详见 [日历视图](/zh/annotation/vis-calendar)（2.0.0+） |
| `BOARD` | 看板视图，配合 `boardView` 使用，详见 [看板视图](/zh/annotation/vis-board)（2.0.0+） |
| `TIMELINE` | 时间线视图，按日期字段排列的垂直信息流，配合 `timelineView` 使用，详见 [时间线视图](/zh/annotation/vis-timeline)（2.4.0+） |
| `MAP` | 地图视图，把记录渲染为地图标记，配合 `mapView` 使用，详见 [地图视图](/zh/annotation/vis-map)（2.4.0+） |
| `CUBE` | 指标图表视图，基于 `@EruptCube` 的图表网格，配合 `cubeView` 使用，详见 [指标图表视图](/zh/annotation/vis-cube)（2.4.0+，需 erupt-cube） |
| `TPL` | 自定义模板视图，配合 `tplView` 使用，详见 [自定义视图](/zh/annotation/vis-tpl) |

:::info
`BOARD`、`CALENDAR`、`MAP`、`CUBE` 四种视图会一次性加载查询结果的全部记录并隐藏分页器；其余视图沿用列表分页。
:::

## visRawTable

`visRawTable = false` 时隐藏默认表格，仅显示 `vis` 中定义的视图：

```java
@Erupt(
    name = "任务看板",
    visRawTable = false,
    vis = {
        @Vis(title = "卡片", type = Vis.Type.CARD, cardView = @CardView)
    }
)
```

## TABLE 视图：字段过滤

`type = TABLE`（默认）时，通过 `fieldVisibility` + `fields` 对列进行筛选，无需额外定义实体类：

```java
@Erupt(
    name = "员工管理",
    vis = {
        @Vis(
            code = "summary", title = "摘要视图",
            fieldVisibility = Vis.FieldVisibility.INCLUDE,
            fields = {"name", "status"}          // 只展示这两列
        ),
        @Vis(
            code = "internal", title = "内部视图",
            fieldVisibility = Vis.FieldVisibility.EXCLUDE,
            fields = {"salary"}                  // 隐藏薪资列
        )
    }
)
```

## TABLE 视图：分组 <Badge type="tip" text="v2.4.0+" />

`type = TABLE` 时还可以通过 `tableView` 按某个字段把行拆成可折叠的分组：每组有一个带条数的组头，组头与表格底部分别显示小计与合计。

![分组表格：组头条数、小计与合计](/annotation/vis-table-group.png)

```java
@Erupt(
    name = "订单",
    vis = {
        @Vis(
            code = "byChannel", title = "按渠道",
            type = Vis.Type.TABLE,
            tableView = @TableView(groupField = "channel", collapsed = true)
        )
    }
)
public class Order extends BaseModel {

    @EruptField(
        views = @View(title = "渠道"),
        edit = @Edit(title = "渠道", type = EditType.CHOICE, choiceType = @ChoiceType(vl = {
            @VL(value = "online",  label = "线上"),
            @VL(value = "offline", label = "线下")
        }))
    )
    private String channel;

    @EruptField(
        views = @View(title = "金额", statistic = View.Statistic.SUM),
        edit = @Edit(title = "金额")
    )
    private BigDecimal amount;

}
```

```java
public @interface TableView {

    String groupField() default "";    // 分组字段；为空时渲染普通表格

    boolean collapsed() default false; // 初始时是否折叠所有分组

}
```

| 属性名 | 描述 |
|--------|------|
| `groupField` | 分组字段名。相邻且该字段值相同的行归为一组，组头显示该值与组内条数；`CHOICE`、`REFERENCE_TREE` / `REFERENCE_TABLE` 等字段按展示值分组 |
| `collapsed` | 初始是否把所有分组折叠起来，默认 `false`；点击组头可展开 / 折叠 |

- 声明了 `@View(statistic = ...)` 的列在每个组头显示该组的小计，表格底部显示整个查询结果的合计，详见 [@View statistic 列统计](/zh/annotation/view#statistic-列统计)
- 分组视图仍按列表分页，分组只作用于当前页的行；配合 `orderBy` 按分组字段排序可避免同一个值被分页拆开
