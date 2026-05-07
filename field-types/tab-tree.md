# 多对多树引用 TAB_TREE

树形选择的多对多组件，适用于被关联数据具有层级结构的多对多（`@ManyToMany`）关系。

```java
@ManyToMany
@JoinTable(name = "relation_table",
    joinColumns = @JoinColumn(name = "main_id"),
    inverseJoinColumns = @JoinColumn(name = "tree_id"))
@EruptField(
    edit = @Edit(title = "多对多树引用", type = EditType.TAB_TREE,
                 tabTreeType = @TabTreeType(id = "id", label = "name", pid = "parent.id"))
)
private Set<TreeEntity> tabTree;
```
