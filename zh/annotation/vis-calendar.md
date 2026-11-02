# 日历视图 CALENDAR

以日历形式展示数据，每条记录渲染为对应日期上的事件条目。提供月、周、年三种视图，支持多日跨度事件和颜色标注，拖拽事件可自动更新日期。配合 `@Vis(type = Vis.Type.CALENDAR)` 使用。

> **2.0.0 及以上版本支持**

![日历视图（周视图）](/annotation/vis-calendar.png)

## 完整示例

```java
@Entity
@Table(name = "t_event")
@Erupt(
    name = "日程管理",
    visRawTable = true,
    vis = {
        @Vis(
            code = "calendar",
            title = "日历",
            type = Vis.Type.CALENDAR,
            calendarView = @CalendarView(
                dateField    = "startDate",
                endDateField = "endDate",
                colorField   = "color",
                mode         = CalendarView.Mode.WEEK
            )
        )
    }
)
public class Event extends BaseModel {

    @EruptField(
        views = @View(title = "标题"),
        edit = @Edit(title = "标题", notNull = true)
    )
    private String name;

    @EruptField(
        views = @View(title = "开始日期"),
        edit = @Edit(title = "开始日期", notNull = true)
    )
    private Date startDate;

    @EruptField(
        views = @View(title = "结束日期"),
        edit = @Edit(title = "结束日期")
    )
    private Date endDate;

    @EruptField(
        views = @View(title = "颜色"),
        edit = @Edit(title = "颜色", type = EditType.COLOR)
    )
    private String color;

}
```

## @CalendarView 属性说明

```java
public @interface CalendarView {

    String dateField();              // 事件日期字段（必填）

    String endDateField() default ""; // 结束日期字段，用于多日跨度事件

    String colorField() default "";   // 颜色字段，值为十六进制色值

    Mode mode() default Mode.MONTH;   // 初始视图，用户可在月 / 周 / 年之间切换（2.4.0+）

    enum Mode {
        MONTH, WEEK, YEAR
    }

}
```

| 属性名 | 描述 |
|--------|------|
| `dateField` | 事件日期字段名（必填），决定事件显示在哪一天 |
| `endDateField` | 可选。事件结束日期字段名，配置后该事件在日历上横跨多天显示 |
| `colorField` | 可选。事件颜色字段名，值为十六进制色值（如 `#FF5733`），用于区分不同类型的事件 |
| `mode` | 初始视图模式，默认 `MONTH`；用户可随时在日历顶部切换月 / 周 / 年 |

## 视图模式 <Badge type="tip" text="v2.4.0+" />

| 模式 | 说明 |
|------|------|
| `MONTH` | 月历网格，每个日期格显示当天的事件；事件较多时只显示前几条并提示剩余数量 |
| `WEEK` | 一周七天的网格，逐天列出全部事件，适合查看密集的日程 |
| `YEAR` | 一年十二个迷你月历，日期按当天事件数量显示热度，点击某天跳转到对应的月视图 |

![日历视图：月视图](/annotation/vis-calendar-month.png)

![日历视图：年视图，日期按事件数量显示热度](/annotation/vis-calendar-year.png)

`mode` 只决定打开时的初始视图，用户在界面上切换后以用户选择为准。

## 说明

- 在月视图的日期格和周视图的网格中，都可以把事件拖到其他日期，系统会自动调用 `DataProxy.beforeUpdate` / `afterUpdate` 并持久化新的日期值；配置了 `endDateField` 的事件会保持原有时长整体平移
- 字段类型支持 `Date`、`LocalDate`、`LocalDateTime` 等日期类型
- 日历会一次性加载查询结果的全部记录并隐藏分页器
- 配合 `visRawTable = true` 可同时保留默认表格视图与日历视图
