# One-to-One Inline Add COMBINE

Manages the data of a one-to-one associated table directly within the parent record's edit dialog. Corresponds to JPA `@OneToOne`, with support for storing the associated object as a JSON field.

**Version requirement**: 1.11.4+

## Basic Usage

```java
@OneToOne(cascade = CascadeType.ALL)
@JoinColumn
@EruptField(
    views = @View(title = "Extension Name", column = "name"),
    edit = @Edit(title = "Extension Info", type = EditType.COMBINE)
)
private DemoExt ext;
```

> **Note**: `@JoinColumn` does not currently support the `referencedColumnName` configuration.

Extension entity class:

```java
@Entity
@Table(name = "demo_ext")
@Erupt(name = "Extension Info")
public class DemoExt extends BaseModel {

    @EruptField(views = @View(title = "Name"), edit = @Edit(title = "Name", notNull = true))
    private String name;

    @EruptField(
        views = @View(title = "Gender"),
        edit = @Edit(title = "Gender", boolType = @BoolType(trueText = "Male", falseText = "Female"))
    )
    private Boolean sex;

}
```

## Example: Store as a JSON Field

The usage is the same as the JSON storage approach in [TAB_TABLE_ADD](/en/field-types/tab-table-add). Simply replace `@OneToOne` with the corresponding JSON annotation.
