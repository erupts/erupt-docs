# 甘特图 GANTT

以甘特图形式展示时间轴数据，支持分组、层级、进度、颜色、前置依赖与里程碑等配置。配合 `@Vis(type = Vis.Type.GANTT)` 使用。

![甘特图：进度、依赖连线与里程碑](/annotation/vis-gantt.png)

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
                groupField     = "type",
                dependencyField = "predecessors",
                milestoneField  = "milestone"
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

    // 前置任务：同一模型的多对多集合，也可以是 @ManyToOne 单个引用
    @ManyToMany
    @JoinTable(name = "t_gantt_dep",
        joinColumns = @JoinColumn(name = "task_id"),
        inverseJoinColumns = @JoinColumn(name = "predecessor_id"))
    @EruptField(
        views = @View(title = "前置任务", column = "name"),
        edit = @Edit(title = "前置任务", type = EditType.TAB_TABLE_REFER)
    )
    private Set<GanttDemo> predecessors;

    @EruptField(
        views = @View(title = "里程碑"),
        edit = @Edit(title = "里程碑", type = EditType.BOOLEAN)
    )
    private Boolean milestone;

}
```

## @GanttView 属性说明

```java
public @interface GanttView {

    String startDateField(); // 开始时间字段（必填）

    String endDateField();   // 结束时间字段（必填）

    String groupField() default "";      // 分组字段

    String pidField() default "";        // 父节点字段，用于层级结构甘特图

    String progressField() default "";   // 进度字段，值范围 0 ~ 100

    String colorField() default "";      // 条形颜色字段，值为十六进制色值

    String dependencyField() default ""; // 前置任务字段，绘制依赖连线（2.4.0+）

    String milestoneField() default "";  // 布尔字段，为 true 的行绘制为里程碑（2.4.0+）

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
| `dependencyField` | 前置任务字段名：指向同一模型的 `@ManyToOne` 单个引用，或 `@ManyToMany` 集合。前置任务与当前任务之间绘制「完成-开始」连线 |
| `milestoneField` | 布尔字段名，值为 `true` 的行不画条形，而是在其开始日期画一个菱形里程碑 |

## 依赖连线 <Badge type="tip" text="v2.4.0+" />

配置 `dependencyField` 后，甘特图把每个任务的前置任务画成「完成-开始」（finish-to-start）连线：

- 有编辑权限时，可以从一个条形拖到另一个条形新建连线，也可以点击连线删除它；变更会写回 `dependencyField`，并经过 `DataProxy.beforeUpdate` / `afterUpdate`
- 自己指向自己的连线、以及会形成环的连线（新前置任务已经直接或间接依赖当前任务）会被拒绝
- 字段为 `@ManyToOne` 时每个任务只有一个前置任务，新建连线会替换旧的；为集合时可有多个前置任务

对应接口：

| 接口 | 说明 |
|------|------|
| `POST /erupt-api/data/modify/gantt/{erupt}/links` | 查询给定任务的前置任务，入参 `{visCode, pks}`，返回「任务主键 -> 前置任务主键列表」；未配置 `dependencyField` 时返回空 |
| `POST /erupt-api/data/modify/gantt/{erupt}/link` | 新增或删除一条连线，入参 `{visCode, pk, predecessorPk, remove}`，需要编辑权限 |
| `POST /erupt-api/data/modify/gantt/{erupt}/update_date` | 拖动 / 拉伸条形后保存新的起止时间，入参 `{visCode, pk, startDate, endDate}`，需要编辑权限 |

:::info
甘特图上的拖动（改日期、改连线）与表单编辑一样会发布 `EruptEditEvent` 并携带修改前的副本，因此操作日志、`erupt-revision` 等模块都能记录到这些变更。
:::

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
