# Calendar View CALENDAR

Displays data as a calendar — each record appears as an event on its corresponding date. Offers month, week and year views, and supports multi-day spanning events, color coding, and drag-to-reschedule (the date is automatically persisted). Used with `@Vis(type = Vis.Type.CALENDAR)`.

> **Supported in 2.0.0+**

![CALENDAR view (week mode)](/annotation/vis-calendar.png)

## Complete Example

```java
@Entity
@Table(name = "t_event")
@Erupt(
    name = "Schedule",
    visRawTable = true,
    vis = {
        @Vis(
            code = "calendar",
            title = "Calendar",
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
        views = @View(title = "Title"),
        edit = @Edit(title = "Title", notNull = true)
    )
    private String name;

    @EruptField(
        views = @View(title = "Start Date"),
        edit = @Edit(title = "Start Date", notNull = true)
    )
    private Date startDate;

    @EruptField(
        views = @View(title = "End Date"),
        edit = @Edit(title = "End Date")
    )
    private Date endDate;

    @EruptField(
        views = @View(title = "Color"),
        edit = @Edit(title = "Color", type = EditType.COLOR)
    )
    private String color;

}
```

## @CalendarView Attributes

```java
public @interface CalendarView {

    String dateField();               // event date field (required)

    String endDateField() default ""; // end date field for multi-day events

    String colorField() default "";   // color field; value is a hex color string

    Mode mode() default Mode.MONTH;   // initial view; the user can switch between month, week and year (2.4.0+)

    enum Mode {
        MONTH, WEEK, YEAR
    }

}
```

| Attribute | Description |
|-----------|-------------|
| `dateField` | The event date field name (required) — determines which day the event appears on |
| `endDateField` | Optional. The end date field name — when set, the event spans multiple days on the calendar |
| `colorField` | Optional. The color field name; value must be a hex color string (e.g. `#FF5733`) — useful for distinguishing event types |
| `mode` | Initial view mode, defaults to `MONTH`; the user can switch between month / week / year at the top of the calendar at any time |

## View Modes <Badge type="tip" text="v2.4.0+" />

| Mode | Description |
|------|-------------|
| `MONTH` | A month grid, each day cell listing that day's events; busy days show the first few and a "more" hint |
| `WEEK` | A seven-day grid listing every event of each day, suited to dense schedules |
| `YEAR` | Twelve mini months; each day is shaded by its event count, and clicking a day jumps to that month |

![CALENDAR view: month mode](/annotation/vis-calendar-month.png)

![CALENDAR view: year mode, days shaded by event count](/annotation/vis-calendar-year.png)

`mode` only picks the view shown on open; once the user switches, their choice wins.

## Notes

- Events can be dragged to another date both in the month cells and in the week grid; the move automatically calls `DataProxy.beforeUpdate` / `afterUpdate` and persists the new date. An event with an `endDateField` keeps its duration and shifts as a whole.
- Supported date field types: `Date`, `LocalDate`, `LocalDateTime`.
- The calendar loads the full result set at once and hides the pager.
- Use `visRawTable = true` to keep the default table view alongside the calendar view.
