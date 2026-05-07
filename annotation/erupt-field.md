# @EruptField

`@EruptField` 注解标记在实体字段上，配置该字段的列表展示（`views`）、编辑器（`edit`）和搜索（`search`）行为。

## 结构

```java
@EruptField(
    views = @View(title = "字段标题"),
    edit  = @Edit(title = "字段标题", type = EditType.INPUT, notNull = true),
    sort  = @Sort(value = 10)
)
```

## 子注解

| 子注解 | 说明 |
|--------|------|
| `@View` | 控制列表页列的展示 |
| `@Edit` | 控制编辑表单中的字段 |
| `@Search` | 控制搜索栏中的字段 |
| `@Filter` | 配置数据过滤条件 |

::: tip
占位文档，详细属性说明待补充。
:::
