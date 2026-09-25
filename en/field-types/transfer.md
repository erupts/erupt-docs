# Many-to-Many Transfer TRANSFER <Badge type="tip" text="v2.3.0+" />

Displays options as a searchable two-list transfer: candidates on the left, selected items on the right. Moving items across establishes a many-to-many relationship, corresponding to JPA `@ManyToMany`. Suits option sets too large for a checkbox group.

`TRANSFER` shares the option shape and the `/checkbox/{field}` endpoint with [CHECKBOX](/en/field-types/checkbox) and only swaps the widget, so switching an existing `CHECKBOX` field to `TRANSFER` means replacing the `type` and its configuration annotation; storage and permission logic stay the same.

## Basic Usage

```java
@ManyToMany
@JoinTable(name = "rel_main_ref",
    joinColumns = @JoinColumn(name = "main_id"),
    inverseJoinColumns = @JoinColumn(name = "ref_id"))
@EruptField(
    edit = @Edit(title = "Related Options", type = EditType.TRANSFER)
)
private Set<RefEntity> options;
```

> `RefEntity` must be an entity class annotated with `@Erupt`. Erupt will automatically read its data to populate the transfer options.

## Configuration

Use the `transferType` attribute of `@Edit` to control which columns of the related entity supply the option values:

```java
public @interface TransferType {

    String id() default "id";      // Column in the related entity used for storage (primary key)

    String label() default "name"; // Column in the related entity used for display

    String remark() default "";    // Column in the related entity used as the description, shown as a tooltip on each item

}
```

```java
@ManyToMany
@JoinTable(name = "rel_main_ref",
    joinColumns = @JoinColumn(name = "main_id"),
    inverseJoinColumns = @JoinColumn(name = "ref_id"))
@EruptField(
    edit = @Edit(title = "Related Options", type = EditType.TRANSFER,
        transferType = @TransferType(id = "id", label = "title", remark = "intro"))
)
private Set<RefEntity> options;
```

:::tip
Value lists (not entity relations) can use the transfer widget too: `MULTI_CHOICE` with `@MultiChoiceType(type = MultiChoiceType.Type.TRANSFER)`, see [MULTI_CHOICE](/en/field-types/multi-choice).
:::

## Example

Assigning permissions to a role, where there are many permissions and users need to search by name:

```java
@ManyToMany
@JoinTable(name = "rel_role_permission",
    joinColumns = @JoinColumn(name = "role_id"),
    inverseJoinColumns = @JoinColumn(name = "permission_id"))
@EruptField(
    views = @View(title = "Permissions", type = ViewType.TAB_VIEW),
    edit = @Edit(title = "Permissions", type = EditType.TRANSFER,
        transferType = @TransferType(label = "name", remark = "description"))
)
private Set<Permission> permissions;
```
