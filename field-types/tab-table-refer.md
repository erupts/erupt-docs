# 多对多表引用 TAB_TABLE_REFER

以表格选择面板展示可选项，用户勾选行后建立多对多关系，对应 JPA `@ManyToMany`。适合选项以列表形式展示且数量较多的场景。

## 基础用法

```java
@ManyToMany
@JoinTable(name = "rel_main_ref",
    joinColumns = @JoinColumn(name = "main_id"),
    inverseJoinColumns = @JoinColumn(name = "ref_id"))
@EruptField(
    edit = @Edit(title = "关联表格", type = EditType.TAB_TABLE_REFER)
)
private Set<RefEntity> items;
```

> `RefEntity` 需是一个已被 `@Erupt` 注解修饰的实体类，Erupt 会自动读取其数据填充到选择表格中。
