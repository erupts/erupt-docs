# Board View BOARD

Displays data as a Kanban board — each distinct value of the group field becomes a column, and cards can be dragged between columns to automatically update and persist the grouped field. Used with `@Vis(type = Vis.Type.BOARD)`.

> **Supported in 2.0.0+**

![BOARD view: columns by status, swimlanes by priority](/annotation/vis-board-swimlane.png)

## Complete Example

```java
@Entity
@Table(name = "t_task")
@Erupt(
    name = "Task Board",
    visRawTable = true,
    vis = {
        @Vis(
            code = "board",
            title = "Board",
            type = Vis.Type.BOARD,
            boardView = @BoardView(
                groupField    = "status",
                swimlaneField = "priority",
                sumField      = "points",
                wipLimit      = 5
            )
        )
    }
)
public class Task extends BaseModel {

    @EruptField(
        views = @View(title = "Task Name"),
        edit = @Edit(title = "Task Name", notNull = true)
    )
    private String name;

    @EruptField(
        views = @View(title = "Status"),
        edit = @Edit(title = "Status", notNull = true, type = EditType.CHOICE,
            choiceType = @ChoiceType(vl = {
                @VL(value = "todo",  label = "To Do"),
                @VL(value = "doing", label = "In Progress"),
                @VL(value = "done",  label = "Done")
            }))
    )
    private String status;

    @EruptField(
        views = @View(title = "Priority"),
        edit = @Edit(title = "Priority", type = EditType.CHOICE,
            choiceType = @ChoiceType(vl = {
                @VL(value = "high", label = "High"),
                @VL(value = "low",  label = "Low")
            }))
    )
    private String priority;

    @EruptField(
        views = @View(title = "Story Points"),
        edit = @Edit(title = "Story Points")
    )
    private Integer points;

    @EruptField(
        views = @View(title = "Assignee"),
        edit = @Edit(title = "Assignee")
    )
    private String assignee;

}
```

## @BoardView Attributes

```java
public @interface BoardView {

    String groupField();                 // grouping field (required), one column per value

    String swimlaneField() default "";   // second grouping, one horizontal lane per value (2.4.0+)

    String sumField() default "";        // numeric field summed in every column header (2.4.0+)

    int wipLimit() default 0;            // work-in-progress limit per column, 0 disables (2.4.0+)

}
```

| Attribute | Description |
|-----------|-------------|
| `groupField` | The field name used to split cards into columns (required). Each distinct value of this field becomes one board column. Supports `CHOICE`, `REFERENCE_TREE`, and `REFERENCE_TABLE` field types. |
| `swimlaneField` | Optional. A second grouping field: each distinct value becomes a horizontal swimlane, and cards can be dragged between lanes as well as between columns. Same field types as `groupField`. |
| `sumField` | Optional. A numeric field name; every column header shows the sum of this field over its cards next to the card count. |
| `wipLimit` | Optional. Maximum number of cards per column (WIP limit); a column holding more cards is highlighted. `0` disables the limit. |

## Notes

- Dragging a card to a different column automatically calls `DataProxy.beforeUpdate` / `afterUpdate` and persists the new `groupField` value.
- With `swimlaneField` set, the board is split into horizontal lanes and vertical columns; dropping a card into another lane writes back both `groupField` and `swimlaneField`.
- When `groupField` / `swimlaneField` is a reference type (`REFERENCE_TREE` / `REFERENCE_TABLE`), the column and lane headings are the display names of the referenced objects.
- Column counts and `sumField` sums update as cards are dragged, without a reload.
- The board loads the full result set at once and hides the pager.
- Use `visRawTable = true` to keep the default table view alongside the board view.
