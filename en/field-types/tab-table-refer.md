# Many-to-Many Table Reference TAB_TABLE_REFER

Displays options in a table selection panel. Checking rows establishes a many-to-many relationship, corresponding to JPA `@ManyToMany`. Suitable when options are best displayed as a list and there are a large number of them.

## Basic Usage

```java
@ManyToMany
@JoinTable(name = "rel_main_ref",
    joinColumns = @JoinColumn(name = "main_id"),
    inverseJoinColumns = @JoinColumn(name = "ref_id"))
@EruptField(
    edit = @Edit(title = "Related Table", type = EditType.TAB_TABLE_REFER)
)
private Set<RefEntity> items;
```

> `RefEntity` must be an entity class annotated with `@Erupt`. Erupt will automatically read its data to populate the selection table.
