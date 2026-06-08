# Many-to-Many Tree Reference TAB_TREE

Displays options in a tree selection panel. Checking nodes establishes a many-to-many relationship, corresponding to JPA `@ManyToMany`. Suitable when the referenced data has a hierarchical structure.

## Basic Usage

```java
@ManyToMany
@JoinTable(name = "rel_main_tree",
    joinColumns = @JoinColumn(name = "main_id"),
    inverseJoinColumns = @JoinColumn(name = "tree_id"))
@EruptField(
    edit = @Edit(title = "Related Tree", type = EditType.TAB_TREE,
                 tabTreeType = @TabTreeType(id = "id", label = "name", pid = "parent.id"))
)
private Set<TreeEntity> treeItems;
```

## Configuration

```java
public @interface TabTreeType {

    String id() default "id";      // Field used for storage

    String label() default "name"; // Field used for display

    String pid() default "";       // Parent node field; if omitted, data is displayed as a list

}
```
