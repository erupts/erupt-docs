# 多对多复选框 CHECKBOX

以复选框形式展示可选项，用户勾选后建立多对多关系，对应 JPA `@ManyToMany`。适合选项数量较少的场景。

## 基础用法

```java
@ManyToMany
@JoinTable(name = "rel_main_ref",
    joinColumns = @JoinColumn(name = "main_id"),
    inverseJoinColumns = @JoinColumn(name = "ref_id"))
@EruptField(
    edit = @Edit(title = "关联选项", type = EditType.CHECKBOX)
)
private Set<RefEntity> options;
```

> `RefEntity` 需是一个已被 `@Erupt` 注解修饰的实体类，Erupt 会自动读取其数据作为复选框选项。
