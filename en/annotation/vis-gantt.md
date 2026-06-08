# Gantt Chart GANTT

Displays time-axis data as a Gantt chart, with support for grouping, hierarchy, progress, and color configuration. Used with `@Vis(type = Vis.Type.GANTT)`.

## Complete Example

```java
@Entity
@Table(name = "t_gantt")
@Erupt(
    name = "Gantt Demo",
    visRawTable = false,
    vis = {
        @Vis(
            title = "Gantt Chart",
            type = Vis.Type.GANTT,
            fieldVisibility = Vis.FieldVisibility.INCLUDE,
            fields = {"name", "type", "color", "progress"},
            ganttView = @GanttView(
                startDateField = "startDate",
                endDateField   = "endDate",
                pidField       = "parent.id",
                colorField     = "color",
                progressField  = "progress",
                groupField     = "type"
            )
        )
    }
)
public class GanttDemo extends BaseModel {

    @EruptField(
        views = @View(title = "Name"),
        edit = @Edit(title = "Name", notNull = true)
    )
    private String name;

    @EruptField(
        views = @View(title = "Group"),
        edit = @Edit(title = "Group", type = EditType.CHOICE, choiceType = @ChoiceType(vl = {
            @VL(label = "Group 1", value = "1"),
            @VL(label = "Group 2", value = "2")
        }))
    )
    private String type;

    @EruptField(
        views = @View(title = "Start Date", sortable = true),
        edit = @Edit(title = "Start Date", notNull = true)
    )
    private Date startDate;

    @EruptField(
        views = @View(title = "End Date", sortable = true),
        edit = @Edit(title = "End Date", notNull = true)
    )
    private Date endDate;

    @EruptField(
        views = @View(title = "Color"),
        edit = @Edit(title = "Color", type = EditType.COLOR)
    )
    private String color;

    @EruptField(
        views = @View(title = "Progress"),
        edit = @Edit(title = "Progress", type = EditType.SLIDER, sliderType = @SliderType(max = 100))
    )
    private Integer progress;

    // When using hierarchical Gantt, you must expose the parent.id field to the frontend
    // via a show = false @View, otherwise the frontend cannot build the tree structure.
    @ManyToOne
    @EruptField(
        views = @View(title = "pid", column = "id", show = false),
        edit = @Edit(
            title = "Parent Node",
            type = EditType.REFERENCE_TREE,
            referenceTreeType = @ReferenceTreeType(pid = "parent.id", expandLevel = 2)
        )
    )
    private GanttDemo parent;

}
```

## @GanttView Attributes

```java
public @interface GanttView {

    String startDateField(); // start date field (required)

    String endDateField();   // end date field (required)

    String groupField() default "";    // grouping field

    String pidField() default "";      // parent node field, used for hierarchical Gantt charts

    String progressField() default ""; // progress field, value range 0 ~ 100

    String colorField() default "";    // bar color field, value is a hex color code

}
```

| Attribute | Description |
|-----------|-------------|
| `startDateField` | Start date field name (required) |
| `endDateField` | End date field name (required) |
| `groupField` | Grouping field name; tasks with the same value are grouped together |
| `pidField` | Parent node field name; when set, renders a hierarchical tree-style Gantt chart |
| `progressField` | Progress field name; value range `0 ~ 100` |
| `colorField` | Bar color field name; value should be a hex color code (e.g. `#FF5733`) |

## Notes

When using a hierarchical Gantt chart (`pidField`), you must expose the parent node id to the frontend via a `show = false` `@View`. Without this, the frontend cannot build the tree structure:

```java
@ManyToOne
@EruptField(
    views = @View(title = "pid", column = "id", show = false), // key: hidden but exposed
    edit = @Edit(title = "Parent Node", type = EditType.REFERENCE_TREE,
                 referenceTreeType = @ReferenceTreeType(pid = "parent.id"))
)
private GanttDemo parent;
```
