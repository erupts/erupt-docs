# 多对多复选框 CHECKBOX

复选框形式的多对多选择组件，适用于选项数量较少的多对多（`@ManyToMany`）关系。

```java
@ManyToMany
@JoinTable(name = "relation_table",
    joinColumns = @JoinColumn(name = "main_id"),
    inverseJoinColumns = @JoinColumn(name = "ref_id"))
@EruptField(
    edit = @Edit(title = "多对多复选框", type = EditType.CHECKBOX)
)
private Set<RefEntity> checkboxField;
```
