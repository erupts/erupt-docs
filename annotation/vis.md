# @Vis 多视图

`@Vis` 允许在同一个 Erupt 实体上挂载多个视图，以 Tab 形式并排展示。通过 `visRawTable` 控制是否保留默认表格，`vis` 数组添加额外视图。

> **1.13.2 及以上版本支持**

## 基础用法

```java
@Erupt(
    name = "任务管理",
    visRawTable = true,
    vis = {
        @Vis(title = "卡片", type = Vis.Type.CARD, cardView = @CardView),
        @Vis(title = "甘特图", type = Vis.Type.GANTT,
             ganttView = @GanttView(startDateField = "startDate", endDateField = "endDate"))
    }
)
@Entity
public class Task extends BaseModel { ... }
```

## @Vis 属性说明

| 属性名 | 描述 |
|--------|------|
| `code` | 视图唯一标识，可选 |
| `title` | Tab 标签名称（必填） |
| `desc` | 视图描述 |
| `type` | 视图类型，默认 `TABLE`，见下方枚举 |
| `fieldVisibility` | 字段可见性模式：`INCLUDE`（仅显示）/ `EXCLUDE`（排除），默认 `EXCLUDE` |
| `fields` | 配合 `fieldVisibility` 使用的字段名列表 |
| `filter` | 该视图独立的数据过滤条件（`@Filter`） |
| `orderBy` | 该视图独立的排序规则（`@Sort`） |
| `show` | 动态控制 Tab 是否显示（`ExprBool`） |
| `cardView` | 卡片视图配置，`type = CARD` 时生效，详见 [卡片视图](/annotation/vis-card) |
| `ganttView` | 甘特图配置，`type = GANTT` 时生效，详见 [甘特图](/annotation/vis-gantt) |
| `tplView` | 自定义模板配置，`type = TPL` 时生效 |

### Type 枚举

| 值 | 描述 |
|----|------|
| `TABLE` | 表格视图（可配合字段过滤） |
| `CARD` | 卡片/网格视图 |
| `GANTT` | 甘特图 |
| `TPL` | 自定义模板视图 |

## visRawTable

`visRawTable = false` 时隐藏默认表格，仅显示 `vis` 中定义的视图：

```java
@Erupt(
    name = "任务看板",
    visRawTable = false,
    vis = {
        @Vis(title = "卡片", type = Vis.Type.CARD, cardView = @CardView)
    }
)
```

## TABLE 视图：字段过滤

`type = TABLE`（默认）时，通过 `fieldVisibility` + `fields` 对列进行筛选，无需额外定义实体类：

```java
@Erupt(
    name = "员工管理",
    vis = {
        @Vis(
            code = "summary", title = "摘要视图",
            fieldVisibility = Vis.FieldVisibility.INCLUDE,
            fields = {"name", "status"}          // 只展示这两列
        ),
        @Vis(
            code = "internal", title = "内部视图",
            fieldVisibility = Vis.FieldVisibility.EXCLUDE,
            fields = {"salary"}                  // 隐藏薪资列
        )
    }
)
```
