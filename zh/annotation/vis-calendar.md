# 日历视图 CALENDAR

以月历形式展示数据，每条记录渲染为对应日期上的事件条目。支持多日跨度事件和颜色标注，拖拽事件可自动更新日期。配合 `@Vis(type = Vis.Type.CALENDAR)` 使用。

> **2.0.0 及以上版本支持**

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
                colorField   = "color"
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

}
```

| 属性名 | 描述 |
|--------|------|
| `dateField` | 事件日期字段名（必填），决定事件显示在哪一天 |
| `endDateField` | 可选。事件结束日期字段名，配置后该事件在日历上横跨多天显示 |
| `colorField` | 可选。事件颜色字段名，值为十六进制色值（如 `#FF5733`），用于区分不同类型的事件 |

## 说明

- 在日历上拖动事件到其他日期时，系统会自动调用 `DataProxy.beforeUpdate` / `afterUpdate` 并持久化新的日期值
- 字段类型支持 `Date`、`LocalDate`、`LocalDateTime` 等日期类型
- 配合 `visRawTable = true` 可同时保留默认表格视图与日历视图
