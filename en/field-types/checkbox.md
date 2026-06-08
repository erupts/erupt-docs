# Many-to-Many Checkbox CHECKBOX

Displays options as checkboxes. Checking items establishes a many-to-many relationship, corresponding to JPA `@ManyToMany`. Suitable for scenarios with a small number of options.

## Basic Usage

```java
@ManyToMany
@JoinTable(name = "rel_main_ref",
    joinColumns = @JoinColumn(name = "main_id"),
    inverseJoinColumns = @JoinColumn(name = "ref_id"))
@EruptField(
    edit = @Edit(title = "Related Options", type = EditType.CHECKBOX)
)
private Set<RefEntity> options;
```

> `RefEntity` must be an entity class annotated with `@Erupt`. Erupt will automatically read its data to populate the checkbox options.
