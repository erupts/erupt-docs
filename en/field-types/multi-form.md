# Multi Form Blocks MULTI_FORM

An alternative editing style for one-to-many relations: each child row is rendered as an inline form block (instead of the table layout used by TAB_TABLE_ADD). Blocks can be added and removed in edit mode, and are rendered read-only in view mode. Ideal when the child table has many fields and form-style entry is more intuitive.

![multi-form](/field-types/multi-form.png)

## Basic Usage

Usage is identical to `TAB_TABLE_ADD` — just change the edit type to `EditType.MULTI_FORM`. Corresponds to JPA `@OneToMany`; child data is cascaded and saved with the parent record:

```java
@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
@JoinColumn(name = "main_id")
@OrderBy
@EruptField(
    edit = @Edit(title = "Child Data", type = EditType.MULTI_FORM)
)
private Set<ChildTable> items;
```

Child entity class:

```java
@Entity
@Table(name = "t_child")
@Erupt(name = "Child Table")
public class ChildTable extends BaseModel {

    @EruptField(views = @View(title = "Name"), edit = @Edit(title = "Name", notNull = true))
    private String name;

    @EruptField(views = @View(title = "Remark"), edit = @Edit(title = "Remark", type = EditType.TEXTAREA))
    private String remark;

}
```

> **Note**: As with `TAB_TABLE_ADD`, do not use Lombok's `@Data` annotation on the child entity class. Its `equals/hashCode` implementation on `Set` can cause deduplication issues.

## Differences from TAB_TABLE_ADD

| | TAB_TABLE_ADD | MULTI_FORM |
|---|---|---|
| Presentation | Table rows | Inline form blocks |
| Editing | Row edited in a dialog | Edited directly inside the block |
| Best for | Few fields, many rows | Many fields, few rows |
