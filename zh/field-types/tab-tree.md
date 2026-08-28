# 多对多树引用 TAB_TREE

以树形选择面板展示可选项，用户勾选节点后建立多对多关系，对应 JPA `@ManyToMany`。适合被关联数据具有层级结构的场景。

![tab-tree](/field-types/tab-tree.png)

## 基础用法

```java
@ManyToMany
@JoinTable(name = "rel_main_tree",
    joinColumns = @JoinColumn(name = "main_id"),
    inverseJoinColumns = @JoinColumn(name = "tree_id"))
@EruptField(
    edit = @Edit(title = "关联树", type = EditType.TAB_TREE)
)
private Set<TreeEntity> treeItems;
```

被关联的实体自身通过 `@Erupt(tree = @Tree(...))` 声明层级结构：

```java
@Entity
@Erupt(name = "树实体", tree = @Tree(pid = "parent.id"))
public class TreeEntity extends BaseModel {

    @EruptField(
        views = @View(title = "名称"),
        edit = @Edit(title = "名称")
    )
    private String name;

    @ManyToOne
    private TreeEntity parent;
}
```

## 配置项

`TAB_TREE` **在 `@Edit` 上没有专属的子注解**，树的取数与层级完全由「被引用实体」自身的 `@Erupt(tree = @Tree(...))` 决定。后端接口 `/erupt-api/data/tab/tree/{erupt}/{field}` 读取的正是被引用实体的 `@Tree` 配置。

`@Tree` 可配置项：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `id` | String | `"id"` | 树节点存储列 |
| `label` | String | `"name"` | 树节点展示列 |
| `pid` | String | `""` | 父节点标识列，不配置则以平铺列表展示 |
| `expandLevel` | int | `999` | 默认展开层级数 |
| `rootPid` | @Expr | `@Expr` | 标识 pid 满足何种特征为根节点，需与 filter 配合使用 |

详见 [@Tree 注解](/zh/annotation/tree)。

## 注意事项

:::warning
- 字段必须是带泛型的集合（如 `Set<TreeEntity>` / `List<TreeEntity>`），框架通过泛型提取被引用的 erupt 实体；否则启动时抛出 `Component modification field is incorrect`。
- `TAB_TREE` 不支持 Excel 导入导出（`excelOperator = false`）。
:::

可选项的过滤复用 `@Edit(filter = ...)`，其 `value`（若配置了 `conditionHandler`，则为 handler 返回的表达式）会作为查询条件拼接到树数据接口上：

```java
@ManyToMany
@EruptField(
    edit = @Edit(
        title = "菜单权限",
        type = EditType.TAB_TREE,
        filter = @Filter(conditionHandler = RoleMenuFilter.class)
    )
)
private Set<EruptMenu> menus;
```

> 框架内置的真实用例见 `EruptRole.menus`（被引用实体 `EruptMenu` 声明了 `tree = @Tree(pid = "parentMenu.id", expandLevel = 5)`）。
