# 时间线视图 TIMELINE

以垂直时间线形式展示数据：按日期字段排序，每条记录是时间轴上的一个节点，并按天分段显示日期标题。适合动态、日志、工单进展等按时间推进的数据。配合 `@Vis(type = Vis.Type.TIMELINE)` 使用。

> **2.4.0 及以上版本支持**

![时间线视图](/annotation/vis-timeline.png)

## 完整示例

```java
@Entity
@Table(name = "t_activity")
@Erupt(
    name = "项目动态",
    visRawTable = true,
    vis = {
        @Vis(
            code = "timeline",
            title = "时间线",
            type = Vis.Type.TIMELINE,
            timelineView = @TimelineView(
                dateField  = "happenTime",
                colorField = "color",
                mode       = TimelineView.Mode.ALTERNATE
            )
        )
    }
)
public class Activity extends BaseModel {

    @EruptField(
        views = @View(title = "标题"),
        edit = @Edit(title = "标题", notNull = true)
    )
    private String title;

    @EruptField(
        views = @View(title = "发生时间", sortable = true),
        edit = @Edit(title = "发生时间", notNull = true)
    )
    private Date happenTime;

    @EruptField(
        views = @View(title = "操作人"),
        edit = @Edit(title = "操作人")
    )
    private String operator;

    @EruptField(
        views = @View(title = "颜色"),
        edit = @Edit(title = "颜色", type = EditType.COLOR)
    )
    private String color;

}
```

## @TimelineView 属性说明

```java
public @interface TimelineView {

    String dateField();                 // 排序日期字段（必填）

    String colorField() default "";     // 节点颜色字段，值为十六进制色值

    boolean descending() default true;  // 最新的记录排在最前

    Mode mode() default Mode.LEFT;      // 条目相对时间轴的位置

    enum Mode {
        LEFT,       // 条目在时间轴右侧，时间轴靠左（默认）
        ALTERNATE,  // 条目左右交替
        RIGHT       // 条目在时间轴左侧，时间轴靠右
    }

}
```

| 属性名 | 描述 |
|--------|------|
| `dateField` | 日期字段名（必填），决定条目在时间轴上的先后顺序与所属日期分组，支持 `Date`、`LocalDate`、`LocalDateTime` |
| `colorField` | 可选。节点颜色字段名，值为十六进制色值（如 `#FF5733`），用于区分不同类型的条目 |
| `descending` | 是否倒序，默认 `true`（最新的在最上面） |
| `mode` | 布局模式：`LEFT`（默认）/ `ALTERNATE`（左右交替）/ `RIGHT` |

## 展示规则

- 记录按 `dateField` 所在日期分段，每一天有一个日期标题，显示日期、星期与当天条数
- 可见列中的**第一列**作为条目标题，其余可见列作为条目下方的明细信息；`dateField` 本身作为时间轴标签，不重复出现在明细中
- `dateField` 为日期时间类型时，条目旁显示当天的具体时间；为纯日期类型时只有日期标题
- 点击条目打开该行的编辑 / 详情
- 配合 `fieldVisibility` + `fields` 可控制条目展示哪些列

:::tip
时间线视图沿用列表的分页，页码切换时时间线随之翻页；想一次展示更多记录可调大每页条数。
:::
