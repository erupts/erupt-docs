# Many-to-Many Checkbox CHECKBOX

Displays options as checkboxes. Checking items establishes a many-to-many relationship, corresponding to JPA `@ManyToMany`. Suitable for scenarios with a small number of options.

![checkbox](/field-types/checkbox.png)

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

## Configuration

Use the `checkboxType` attribute of `@Edit` to control which columns of the related entity supply the option values:

```java
public @interface CheckboxType {

    String id() default "id";      // Column in the related entity used for storage (primary key)

    String label() default "name"; // Column in the related entity used for display

    String remark() default "";    // Column in the related entity used as the option description

}
```

```java
@ManyToMany
@JoinTable(name = "rel_main_ref",
    joinColumns = @JoinColumn(name = "main_id"),
    inverseJoinColumns = @JoinColumn(name = "ref_id"))
@EruptField(
    edit = @Edit(title = "Related Options", type = EditType.CHECKBOX,
        checkboxType = @CheckboxType(id = "id", label = "title", remark = "intro"))
)
private Set<RefEntity> options;
```
