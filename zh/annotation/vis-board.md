# 看板视图 BOARD

以看板（Kanban）形式展示数据，数据按指定分组字段横向分列，支持拖拽卡片跨列移动并自动保存。配合 `@Vis(type = Vis.Type.BOARD)` 使用。

> **2.0.0 及以上版本支持**

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
            boardView = @BoardView(groupField = "status")
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
        views = @View(title = "负责人"),
        edit = @Edit(title = "负责人")
    )
    private String assignee;

}
```

## @BoardView 属性说明

```java
public @interface BoardView {

    String groupField(); // 分组字段（必填）

}
```

| 属性名 | 描述 |
|--------|------|
| `groupField` | 分组字段名（必填）。该字段的每个值将对应一列看板，字段类型支持 `CHOICE`、`REFERENCE_TREE`、`REFERENCE_TABLE` 等 |

## 说明

- 将卡片从一列拖动到另一列时，系统会自动调用 `DataProxy.beforeUpdate` / `afterUpdate` 并持久化 `groupField` 的新值
- `groupField` 支持关联对象类型（`REFERENCE_TREE` / `REFERENCE_TABLE`），看板列头由关联对象的展示名称决定
- 配合 `visRawTable = true` 可同时保留默认表格视图与看板视图
