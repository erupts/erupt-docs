# @Vis Multi-View

`@Vis` lets you attach multiple views to a single Erupt entity and display them as tabs side by side. Use `visRawTable` to control whether the default table view is kept, and the `vis` array to add extra views.

> **Supported in 1.13.2+**

## Basic Usage

```java
@Erupt(
    name = "Task Management",
    visRawTable = true,
    vis = {
        @Vis(title = "Cards", type = Vis.Type.CARD, cardView = @CardView),
        @Vis(title = "Gantt", type = Vis.Type.GANTT,
             ganttView = @GanttView(startDateField = "startDate", endDateField = "endDate"))
    }
)
@Entity
public class Task extends BaseModel { ... }
```

## @Vis Attributes

| Attribute | Description |
|-----------|-------------|
| `code` | Unique view identifier, optional |
| `title` | Tab label (required) |
| `desc` | View description |
| `type` | View type, defaults to `TABLE`, see enum below |
| `fieldVisibility` | Field visibility mode: `INCLUDE` (show only) / `EXCLUDE` (hide), defaults to `EXCLUDE` |
| `fields` | List of field names used with `fieldVisibility` |
| `filter` | Independent data filter for this view (`@Filter`) |
| `orderBy` | Independent sort rule for this view (`@Sort`) |
| `show` | Dynamically controls whether the tab is visible (`ExprBool`) |
| `cardView` | Card view configuration, active when `type = CARD`, see [Card View](/en/annotation/vis-card) |
| `ganttView` | Gantt chart configuration, active when `type = GANTT`, see [Gantt Chart](/en/annotation/vis-gantt) |
| `calendarView` | Calendar view configuration, active when `type = CALENDAR`, see [Calendar View](/en/annotation/vis-calendar) (2.0.0+) |
| `boardView` | Board view configuration, active when `type = BOARD`, see [Board View](/en/annotation/vis-board) (2.0.0+) |
| `tableView` | Table grouping configuration, active when `type = TABLE`, see [TABLE View: Grouping](#table-view-grouping) below (2.4.0+) |
| `timelineView` | Timeline configuration, active when `type = TIMELINE`, see [TIMELINE View](/en/annotation/vis-timeline) (2.4.0+) |
| `mapView` | Map configuration, active when `type = MAP`, see [MAP View](/en/annotation/vis-map) (2.4.0+) |
| `cubeView` | Chart grid configuration, active when `type = CUBE`, see [CUBE View](/en/annotation/vis-cube) (2.4.0+) |
| `tplView` | Custom template configuration, active when `type = TPL`, see [Custom View](/en/annotation/vis-tpl) |

### Type Enum

| Value | Description |
|-------|-------------|
| `TABLE` | Table view (can be combined with field filtering and `tableView` grouping) |
| `CARD` | Card / grid view, see [Card View](/en/annotation/vis-card) |
| `GANTT` | Gantt chart, see [Gantt Chart](/en/annotation/vis-gantt) |
| `CALENDAR` | Calendar view, used with `calendarView`, see [Calendar View](/en/annotation/vis-calendar) (2.0.0+) |
| `BOARD` | Board / kanban view, used with `boardView`, see [Board View](/en/annotation/vis-board) (2.0.0+) |
| `TIMELINE` | Timeline view, a vertical feed ordered by a date field, used with `timelineView`, see [TIMELINE View](/en/annotation/vis-timeline) (2.4.0+) |
| `MAP` | Map view, rows as markers on a map, used with `mapView`, see [MAP View](/en/annotation/vis-map) (2.4.0+) |
| `CUBE` | Chart grid over an `@EruptCube`, used with `cubeView`, see [CUBE View](/en/annotation/vis-cube) (2.4.0+, needs erupt-cube) |
| `TPL` | Custom template view, used with `tplView`, see [Custom View](/en/annotation/vis-tpl) |

:::info
The `BOARD`, `CALENDAR`, `MAP` and `CUBE` views load the full result set at once and hide the pager; the other views keep the list's pagination.
:::

## visRawTable

Setting `visRawTable = false` hides the default table and shows only the views defined in `vis`:

```java
@Erupt(
    name = "Task Board",
    visRawTable = false,
    vis = {
        @Vis(title = "Cards", type = Vis.Type.CARD, cardView = @CardView)
    }
)
```

## TABLE View: Field Filtering

When `type = TABLE` (the default), use `fieldVisibility` + `fields` to filter columns without defining a separate entity class:

```java
@Erupt(
    name = "Employee Management",
    vis = {
        @Vis(
            code = "summary", title = "Summary View",
            fieldVisibility = Vis.FieldVisibility.INCLUDE,
            fields = {"name", "status"}          // show only these two columns
        ),
        @Vis(
            code = "internal", title = "Internal View",
            fieldVisibility = Vis.FieldVisibility.EXCLUDE,
            fields = {"salary"}                  // hide the salary column
        )
    }
)
```

## TABLE View: Grouping <Badge type="tip" text="v2.4.0+" />

With `type = TABLE`, `tableView` can also split the rows into collapsible groups by a field: every group gets a header with its row count, and group headers and the table footer carry subtotals and the grand total.

![Grouped table: group counts, subtotals and the grand total](/annotation/vis-table-group.png)

```java
@Erupt(
    name = "Orders",
    vis = {
        @Vis(
            code = "byChannel", title = "By Channel",
            type = Vis.Type.TABLE,
            tableView = @TableView(groupField = "channel", collapsed = true)
        )
    }
)
public class Order extends BaseModel {

    @EruptField(
        views = @View(title = "Channel"),
        edit = @Edit(title = "Channel", type = EditType.CHOICE, choiceType = @ChoiceType(vl = {
            @VL(value = "online",  label = "Online"),
            @VL(value = "offline", label = "Offline")
        }))
    )
    private String channel;

    @EruptField(
        views = @View(title = "Amount", statistic = View.Statistic.SUM),
        edit = @Edit(title = "Amount")
    )
    private BigDecimal amount;

}
```

```java
public @interface TableView {

    String groupField() default "";    // group rows by this field; empty renders the plain table

    boolean collapsed() default false; // start with every group collapsed

}
```

| Attribute | Description |
|-----------|-------------|
| `groupField` | Grouping field name. Adjacent rows sharing the same value form one group whose header shows the value and the row count; `CHOICE`, `REFERENCE_TREE` / `REFERENCE_TABLE` fields group by their display value |
| `collapsed` | Whether every group starts collapsed, defaults to `false`; clicking a header expands / collapses it |

- Columns declaring `@View(statistic = ...)` show a per-group subtotal in each group header and the grand total over the whole query result in the table footer, see [@View statistic Column Statistics](/en/annotation/view#statistic-column-statistics)
- The grouped view keeps the list's pagination, so grouping applies to the rows of the current page; sort by the group field with `orderBy` to keep one value from being split across pages
