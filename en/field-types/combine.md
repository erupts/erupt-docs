# One-to-One Inline Add COMBINE

Manages the data of a one-to-one associated table directly within the parent record's edit dialog. Corresponds to JPA `@OneToOne`, with support for storing the associated object as a JSON field.

**Version requirement**: 1.11.4+

![combine](/field-types/combine.png)

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

Suitable for scenarios where no relational queries are needed and JSON storage is sufficient. Hibernate 6 (Spring Boot 3) supports JSON mapping natively — remove `@OneToOne` and `@JoinColumn`, then annotate the field with `@JdbcTypeCode(SqlTypes.JSON)`, no extra dependency required:

```java
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@JdbcTypeCode(SqlTypes.JSON)
@EruptField(
    edit = @Edit(title = "Extension Info", type = EditType.COMBINE)
)
private DemoExt ext;
```

In this case `DemoExt` no longer needs to be declared as an `@Entity` — the whole object is serialized as JSON and stored in a single column of the parent table.
