# 看板视图 BOARD

以看板（Kanban）形式展示数据，数据按指定分组字段横向分列，支持拖拽卡片跨列移动并自动保存。配合 `@Vis(type = Vis.Type.BOARD)` 使用。

> **2.0.0 及以上版本支持**

![看板视图：按状态分列、按优先级分泳道](/annotation/vis-board-swimlane.png)

## 完整示例

```java
@Entity
@Table(name = "t_task")
@Erupt(
    name = "任务看板",
    visRawTable = true,
    vis = {
        @Vis(
            code = "board",
            title = "看板",
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
        views = @View(title = "任务名称"),
        edit = @Edit(title = "任务名称", notNull = true)
    )
    private String name;

    @EruptField(
        views = @View(title = "状态"),
        edit = @Edit(title = "状态", notNull = true, type = EditType.CHOICE,
            choiceType = @ChoiceType(vl = {
                @VL(value = "todo",  label = "待处理"),
                @VL(value = "doing", label = "进行中"),
                @VL(value = "done",  label = "已完成")
            }))
    )
    private String status;

    @EruptField(
        views = @View(title = "优先级"),
        edit = @Edit(title = "优先级", type = EditType.CHOICE,
            choiceType = @ChoiceType(vl = {
                @VL(value = "high", label = "高"),
                @VL(value = "low",  label = "低")
            }))
    )
    private String priority;

    @EruptField(
        views = @View(title = "故事点"),
        edit = @Edit(title = "故事点")
    )
    private Integer points;

    @EruptField(
        views = @View(title = "负责人"),
        edit = @Edit(title = "负责人")
    )
    private String assignee;

}
```

## @BoardView 属性说明

```java
public @interface BoardView {

    String groupField();                 // 分组字段（必填），每个值一列

    String swimlaneField() default "";   // 第二分组字段，每个值一条横向泳道（2.4.0+）

    String sumField() default "";        // 在列头汇总求和的数值字段（2.4.0+）

    int wipLimit() default 0;            // 每列的在制品上限，0 表示不限制（2.4.0+）

}
```

| 属性名 | 描述 |
|--------|------|
| `groupField` | 分组字段名（必填）。该字段的每个值将对应一列看板，字段类型支持 `CHOICE`、`REFERENCE_TREE`、`REFERENCE_TABLE` 等 |
| `swimlaneField` | 可选。第二分组字段名，每个值对应一条横向泳道，卡片在列与泳道之间都可拖动；字段类型与 `groupField` 相同 |
| `sumField` | 可选。数值字段名，每列列头在卡片数量旁显示该列所有卡片该字段的求和 |
| `wipLimit` | 可选。每列允许的卡片数上限（WIP 限制），某列卡片数超过时该列高亮提示；`0` 表示不限制 |

## 说明

- 将卡片从一列拖动到另一列时，系统会自动调用 `DataProxy.beforeUpdate` / `afterUpdate` 并持久化 `groupField` 的新值
- 配置了 `swimlaneField` 时，看板按泳道横向分行、按列纵向分栏；卡片拖到另一条泳道会同时写回 `groupField` 与 `swimlaneField` 两个字段
- `groupField` / `swimlaneField` 支持关联对象类型（`REFERENCE_TREE` / `REFERENCE_TABLE`），列头与泳道名由关联对象的展示名称决定
- 列头的计数与 `sumField` 求和随拖动即时更新，无需刷新
- 看板会一次性加载查询结果的全部记录并隐藏分页器
- 配合 `visRawTable = true` 可同时保留默认表格视图与看板视图
