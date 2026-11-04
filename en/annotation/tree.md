# Tree View @Tree

The `@Tree` annotation displays data as a tree structure, suitable for hierarchical data such as organizational charts, category directories, and similar use cases.

## Usage

```java
@Erupt(
       name = "Tree",
       tree = @Tree(id = "id", label = "name", pid = "parent.id", expandLevel = 1)
)
public class Tree extends BaseModel {
    
    @EruptField(
            views = @View(title = "Name"),
            edit = @Edit(title = "Name")
    )
    private String name;

    @ManyToOne
    @JoinColumn(name = "parent")
    @EruptField(
            edit = @Edit(
                    title = "Parent Node",
                    type = EditType.REFERENCE_TREE,
                    referenceTreeType = @ReferenceTreeType(pid = "parent.id")
            )
    )
    private Tree parent;
    
}
```

After completing the configuration and starting the project, go to **System Management → Menu Management → Add → Menu Type = Tree**, and enter the class name as the type value to use the tree view.

## Annotation Definition

```java
public @interface Tree {

    String id() default "id"; // stored column

    String label() default "name"; // display column

    String pid() default ""; // if empty, renders as a flat list
    
    /**
     * Expand level. If the dataset is large, reduce this value for faster rendering.
     * Can efficiently render hundreds of thousands of tree nodes.
     */
    int expandLevel() default 999;

    /**
     * If the parent node id is null, Erupt treats it as a root node and starts rendering the tree.
     * To change this behavior, implement @Expr to dynamically return a root node id.
     * Recommended to use with filter to avoid leaking unneeded data to the frontend.
     */
    Expr rootPid() default @Expr;

    /**
     * Maximum depth. Roots are level 1; 0 means unlimited (2.3.0+).
     * Nodes at this level no longer offer "Add child", and the server refuses any save that would
     * place a node deeper (add, move, re-parent via cell edit, import, API).
     */
    int maxLevel() default 0;

}
```

## Limiting depth with maxLevel <Badge type="tip" text="v2.3.0+" />

Hierarchies usually have a business limit — an org chart no deeper than three levels, a category tree no deeper than two. `maxLevel` hands that limit to the framework:

```java
@Erupt(
        name = "Department",
        tree = @Tree(pid = "parent.id", maxLevel = 3)
)
public class Department extends BaseModel { ... }
```

- Roots are level 1, so `maxLevel = 3` allows at most three levels; the default `0` means unlimited
- Nodes that have reached the limit no longer show **Add child** in the tree
- The server enforces the same rule: add, drag-and-drop move, re-parenting through cell edit, import and direct API calls are all refused when they would place a node one level deeper

## Preview

![Tree view](/annotation/tree.png)
