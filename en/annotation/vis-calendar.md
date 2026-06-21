# Calendar View CALENDAR

Displays data as a monthly calendar — each record appears as an event on its corresponding date. Supports multi-day spanning events, color coding, and drag-to-reschedule (date is automatically persisted). Used with `@Vis(type = Vis.Type.CALENDAR)`.

> **Supported in 2.0.0+**

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
                colorField   = "color"
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

}
```

| Attribute | Description |
|-----------|-------------|
| `dateField` | The event date field name (required) — determines which day the event appears on |
| `endDateField` | Optional. The end date field name — when set, the event spans multiple days on the calendar |
| `colorField` | Optional. The color field name; value must be a hex color string (e.g. `#FF5733`) — useful for distinguishing event types |

## Notes

- Dragging an event to a different day automatically calls `DataProxy.beforeUpdate` / `afterUpdate` and persists the new date.
- Supported date field types: `Date`, `LocalDate`, `LocalDateTime`.
- Use `visRawTable = true` to keep the default table view alongside the calendar view.
