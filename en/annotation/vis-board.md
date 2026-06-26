# Board View BOARD

Displays data as a Kanban board — each distinct value of the group field becomes a column, and cards can be dragged between columns to automatically update and persist the grouped field. Used with `@Vis(type = Vis.Type.BOARD)`.

> **Supported in 2.0.0+**

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
            boardView = @BoardView(groupField = "status")
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
        views = @View(title = "Assignee"),
        edit = @Edit(title = "Assignee")
    )
    private String assignee;

}
```

## @BoardView Attributes

```java
public @interface BoardView {

    String groupField(); // grouping field (required)

}
```

| Attribute | Description |
|-----------|-------------|
| `groupField` | The field name used to split cards into columns (required). Each distinct value of this field becomes one board column. Supports `CHOICE`, `REFERENCE_TREE`, and `REFERENCE_TABLE` field types. |

## Notes

- Dragging a card to a different column automatically calls `DataProxy.beforeUpdate` / `afterUpdate` and persists the new `groupField` value.
- When `groupField` is a reference type (`REFERENCE_TREE` / `REFERENCE_TABLE`), the board column headings are the display names of the referenced objects.
- Use `visRawTable = true` to keep the default table view alongside the board view.
