# 多表单块 MULTI_FORM

一对多关系的另一种编辑形态：子表的每一行渲染为一个内联表单块（而非 TAB_TABLE_ADD 的表格形式），支持在编辑时增删表单块，查看时以只读表单展示。适合子表字段较多、以表单方式录入更直观的场景。

![multi-form](/field-types/multi-form.png)

## 基础用法

用法与 `TAB_TABLE_ADD` 一致，仅需将编辑类型改为 `EditType.MULTI_FORM`，对应 JPA `@OneToMany`，保存主表时子表数据同步级联保存：

```java
@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
@JoinColumn(name = "main_id")
@OrderBy
@EruptField(
    edit = @Edit(title = "子表数据", type = EditType.MULTI_FORM)
)
private Set<ChildTable> items;
```

子表实体类：

```java
@Entity
@Table(name = "t_child")
@Erupt(name = "子表")
public class ChildTable extends BaseModel {

    @EruptField(views = @View(title = "名称"), edit = @Edit(title = "名称", notNull = true))
    private String name;

    @EruptField(views = @View(title = "说明"), edit = @Edit(title = "说明", type = EditType.TEXTAREA))
    private String remark;

}
```

> **注意**：与 `TAB_TABLE_ADD` 相同，不要在子表实体上使用 Lombok 的 `@Data` 注解，否则 `Set` 的 `equals/hashCode` 实现会导致去重异常。

## 与 TAB_TABLE_ADD 的区别

| | TAB_TABLE_ADD | MULTI_FORM |
|---|---|---|
| 展现形式 | 表格行 | 内联表单块 |
| 编辑方式 | 弹窗编辑单行 | 直接在表单块内编辑 |
| 适用场景 | 子表字段少、行数多 | 子表字段多、行数少 |
