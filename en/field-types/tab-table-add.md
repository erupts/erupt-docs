# One-to-Many Inline Add TAB_TABLE_ADD

Allows adding and editing child table data directly within the parent record's edit dialog. Corresponds to JPA `@OneToMany`. Child table data is cascaded and saved when the parent record is saved.

![tab-table-add](/field-types/tab-table-add.png)

## Basic Usage

```java
@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
@JoinColumn(name = "main_id")
@OrderBy
@EruptField(
    edit = @Edit(title = "Child Data", type = EditType.TAB_TABLE_ADD)
)
private Set<ChildTable> items;
```

> **Note**: Do not use Lombok's `@Data` annotation on the child entity class. Its `equals/hashCode` implementation on `Set` can cause deduplication issues.

Child entity class:

```java
@Entity
@Table(name = "t_child")
@Erupt(name = "Child Table")
public class ChildTable extends BaseModel {

    @EruptField(views = @View(title = "Sort"), edit = @Edit(title = "Sort"))
    private Integer sort;

    @EruptField(views = @View(title = "Name"), edit = @Edit(title = "Name"))
    private String name;

}
```

## Example: Store as a JSON Field

Suitable for scenarios where no relational queries are needed and JSON storage is sufficient. Hibernate 6 (Spring Boot 3) supports JSON mapping natively — simply annotate the field with `@JdbcTypeCode(SqlTypes.JSON)`, no extra dependency required:

```java
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@JdbcTypeCode(SqlTypes.JSON)
@EruptField(
    edit = @Edit(title = "Child Data", type = EditType.TAB_TABLE_ADD)
)
private Set<ChildTable> items;
```
