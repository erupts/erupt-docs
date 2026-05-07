# 多对多表引用 TAB_TABLE_REFER

表格选择的多对多组件，适用于选项以列表形式展示的多对多（`@ManyToMany`）关系。

```java
@ManyToMany
@JoinTable(name = "relation_table",
    joinColumns = @JoinColumn(name = "main_id"),
    inverseJoinColumns = @JoinColumn(name = "ref_id"))
@EruptField(
    edit = @Edit(title = "多对多表格引用", type = EditType.TAB_TABLE_REFER)
)
private Set<RefEntity> tabTableRefer;
```
