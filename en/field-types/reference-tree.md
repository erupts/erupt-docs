# Many-to-One Tree Reference REFERENCE_TREE

Opens a tree selector for the user to select a related record. Corresponds to the JPA `@ManyToOne` relationship. Suitable when the referenced data has a hierarchical structure.

![reference-tree](/field-types/reference-tree.png)
![reference-tree-dialog](/field-types/reference-tree-dialog.png)

## Basic Usage

```java
@ManyToOne
@JoinColumn(name = "tree_id")
@EruptField(
    edit = @Edit(
        title = "Tree Reference",
        type = EditType.REFERENCE_TREE,
        referenceTreeType = @ReferenceTreeType(
            id = "id", label = "name",
            pid = "parent.id" // If pid is omitted, data is displayed as a list
        )
    )
)
private Tree tree;
```

Referenced tree entity class:

```java
@Entity
@Table(name = "t_tree")
@Erupt(name = "Tree", tree = @Tree(pid = "parent.id"))
public class Tree extends BaseModel {

    @EruptField(views = @View(title = "Name"), edit = @Edit(title = "Name"))
    private String name;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    @EruptField(
        edit = @Edit(title = "Parent Node", type = EditType.REFERENCE_TREE,
                     referenceTreeType = @ReferenceTreeType(pid = "parent.id"))
    )
    private Tree parent;

}
```

## Configuration

```java
public @interface ReferenceTreeType {

    String id() default "id";       // Field used for storage

    String label() default "name";  // Field used for display

    String pid() default "";        // Parent node field; if omitted, data is displayed as a list

    Expr rootPid() default @Expr;   // Root node pid condition

    int expandLevel() default 999;  // Default expansion level

    String dependField() default ""; // Field name in the current table that this field depends on

    String dependColumn() default "id"; // The column in the dependency field used for matching

}
```
