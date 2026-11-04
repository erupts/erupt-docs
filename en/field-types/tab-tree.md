# Many-to-Many Tree Reference TAB_TREE

Displays options in a tree selection panel. Checking nodes establishes a many-to-many relationship, corresponding to JPA `@ManyToMany`. Suitable when the referenced data has a hierarchical structure.

![tab-tree](/field-types/tab-tree.png)

## Basic Usage

```java
@ManyToMany
@JoinTable(name = "rel_main_tree",
    joinColumns = @JoinColumn(name = "main_id"),
    inverseJoinColumns = @JoinColumn(name = "tree_id"))
@EruptField(
    edit = @Edit(title = "Related Tree", type = EditType.TAB_TREE)
)
private Set<TreeEntity> treeItems;
```

The referenced entity declares its own hierarchy through `@Erupt(tree = @Tree(...))`:

```java
@Entity
@Erupt(name = "Tree Entity", tree = @Tree(pid = "parent.id"))
public class TreeEntity extends BaseModel {

    @EruptField(
        views = @View(title = "Name"),
        edit = @Edit(title = "Name")
    )
    private String name;

    @ManyToOne
    private TreeEntity parent;
}
```

## Configuration

`TAB_TREE` has **no dedicated sub-annotation on `@Edit`**. Both the data source and the hierarchy come entirely from the referenced entity's own `@Erupt(tree = @Tree(...))`. The backend endpoint `/erupt-api/data/tab/tree/{erupt}/{field}` reads exactly that `@Tree` configuration.

`@Tree` options:

| Attribute | Type | Default | Description |
|------|------|--------|------|
| `id` | String | `"id"` | Tree node storage column |
| `label` | String | `"name"` | Tree node display column |
| `pid` | String | `""` | Parent node identifier column; if omitted the data is rendered as a flat list |
| `expandLevel` | int | `999` | Number of levels expanded by default |
| `rootPid` | @Expr | `@Expr` | Identifies what characteristic of `pid` marks a root node; must be used together with `filter` |

See [@Tree annotation](/en/annotation/tree) for details.

## Notes

:::warning
- The field must be a generic collection (e.g. `Set<TreeEntity>` / `List<TreeEntity>`); the framework extracts the referenced erupt entity from the generic type. Otherwise startup fails with `Component modification field is incorrect`.
- `TAB_TREE` does not support Excel import/export (`excelOperator = false`).
:::

Option filtering reuses `@Edit(filter = ...)`; each `value` (or the expression returned by `conditionHandler`, when configured) is appended as a query condition on the tree data endpoint:

```java
@ManyToMany
@EruptField(
    edit = @Edit(
        title = "Menu Permission",
        type = EditType.TAB_TREE,
        filter = @Filter(conditionHandler = RoleMenuFilter.class)
    )
)
private Set<EruptMenu> menus;
```

> A real built-in example is `EruptRole.menus`, whose referenced entity `EruptMenu` declares `tree = @Tree(pid = "parentMenu.id", expandLevel = 5)`.
