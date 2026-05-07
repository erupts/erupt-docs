# 甘特图 GANTT

以甘特图形式展示时间轴数据，支持分组、层级、进度、颜色等配置。配合 `@Vis(type = Vis.Type.GANTT)` 使用。

## 完整示例

```java
@Entity
@Table(name = "t_gantt")
@Erupt(
    name = "甘特图演示",
    visRawTable = false,
    vis = {
        @Vis(
            title = "甘特图",
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
        views = @View(title = "名称"),
        edit = @Edit(title = "名称", notNull = true)
    )
    private String name;

    @EruptField(
        views = @View(title = "分组"),
        edit = @Edit(title = "分组", type = EditType.CHOICE, choiceType = @ChoiceType(vl = {
            @VL(label = "分组1", value = "1"),
            @VL(label = "分组2", value = "2")
        }))
    )
    private String type;

    @EruptField(
        views = @View(title = "开始时间", sortable = true),
        edit = @Edit(title = "开始时间", notNull = true)
    )
    private Date startDate;

    @EruptField(
        views = @View(title = "结束时间", sortable = true),
        edit = @Edit(title = "结束时间", notNull = true)
    )
    private Date endDate;

    @EruptField(
        views = @View(title = "颜色"),
        edit = @Edit(title = "颜色", type = EditType.COLOR)
    )
    private String color;

    @EruptField(
        views = @View(title = "进度"),
        edit = @Edit(title = "进度", type = EditType.SLIDER, sliderType = @SliderType(max = 100))
    )
    private Integer progress;

    // 使用层级甘特图时，必须通过 show = false 的 View 将 parent.id 暴露给前端
    @ManyToOne
    @EruptField(
        views = @View(title = "pid", column = "id", show = false),
        edit = @Edit(
            title = "上级节点",
            type = EditType.REFERENCE_TREE,
            referenceTreeType = @ReferenceTreeType(pid = "parent.id", expandLevel = 2)
        )
    )
    private GanttDemo parent;

}
```

## @GanttView 属性说明

```java
public @interface GanttView {

    String startDateField(); // 开始时间字段（必填）

    String endDateField();   // 结束时间字段（必填）

    String groupField() default "";    // 分组字段

    String pidField() default "";      // 父节点字段，用于层级结构甘特图

    String progressField() default ""; // 进度字段，值范围 0 ~ 100

    String colorField() default "";    // 条形颜色字段，值为十六进制色值

}
```

| 属性名 | 描述 |
|--------|------|
| `startDateField` | 开始时间字段名（必填） |
| `endDateField` | 结束时间字段名（必填） |
| `groupField` | 分组字段名，相同值的任务归为一组 |
| `pidField` | 父节点字段名，配置后呈层级树状甘特图 |
| `progressField` | 进度字段名，值范围 `0 ~ 100` |
| `colorField` | 条形颜色字段名，值为十六进制色值（如 `#FF5733`） |

## 注意事项

使用层级甘特图（`pidField`）时，必须通过 `show = false` 的 `@View` 将父节点 id 字段暴露给前端，否则前端无法构建树结构：

```java
@ManyToOne
@EruptField(
    views = @View(title = "pid", column = "id", show = false), // 关键：隐藏但暴露 id
    edit = @Edit(title = "上级节点", type = EditType.REFERENCE_TREE,
                 referenceTreeType = @ReferenceTreeType(pid = "parent.id"))
)
private GanttDemo parent;
```
