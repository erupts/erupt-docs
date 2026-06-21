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
| `calendarView` | Calendar view configuration, active when `type = CALENDAR` (2.0.0+) |
| `boardView` | Board view configuration, active when `type = BOARD` (2.0.0+) |
| `tplView` | Custom template configuration, active when `type = TPL` |

### Type Enum

| Value | Description |
|-------|-------------|
| `TABLE` | Table view (can be combined with field filtering) |
| `CARD` | Card / grid view |
| `GANTT` | Gantt chart |
| `CALENDAR` | Calendar view, used with `calendarView` (2.0.0+) |
| `BOARD` | Board / kanban view, used with `boardView` (2.0.0+) |
| `TPL` | Custom template view |

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
