# 多对多树引用 TAB_TREE

以树形选择面板展示可选项，用户勾选节点后建立多对多关系，对应 JPA `@ManyToMany`。适合被关联数据具有层级结构的场景。

## 基础用法

```java
@ManyToMany
@JoinTable(name = "rel_main_tree",
    joinColumns = @JoinColumn(name = "main_id"),
    inverseJoinColumns = @JoinColumn(name = "tree_id"))
@EruptField(
    edit = @Edit(title = "关联树", type = EditType.TAB_TREE,
                 tabTreeType = @TabTreeType(id = "id", label = "name", pid = "parent.id"))
)
private Set<TreeEntity> treeItems;
```

## 配置项

```java
public @interface TabTreeType {

    String id() default "id";      // 用于存储的字段

    String label() default "name"; // 用于展示的字段

    String pid() default "";       // 父节点字段，不填则以列表展示

}
```
