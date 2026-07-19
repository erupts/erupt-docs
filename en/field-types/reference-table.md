# Many-to-One Table Reference REFERENCE_TABLE

Opens a table popup for the user to select a related record. Corresponds to the JPA `@ManyToOne` relationship. Suitable when the referenced data is best displayed in a list format.

![reference-table](/field-types/reference-table.png)
![reference-table-dialog](/field-types/reference-table-dialog.png)

## Basic Usage

```java
@ManyToOne
@JoinColumn(name = "table_id")
@EruptField(
    views = {
        @View(title = "Sort", column = "sort"),
        @View(title = "Name", column = "name")
    },
    edit = @Edit(title = "Reference Table", type = EditType.REFERENCE_TABLE,
        referenceTableType = @ReferenceTableType(id = "id", label = "name")
    )
)
private Table table;
```

Referenced entity class:

```java
@Entity
@Table(name = "t_table")
@Erupt(name = "Table")
public class Table extends BaseModel {

    @EruptField(views = @View(title = "Sort"), edit = @Edit(title = "Sort"))
    private Integer sort;

    @EruptField(views = @View(title = "Name"), edit = @Edit(title = "Name"))
    private String name;

}
```

## Configuration

```java
public @interface ReferenceTableType {

    String id() default "id";       // The field in the referenced table used for storage (primary key)

    String label() default "name";  // The field in the referenced table used for display

    String dependField() default ""; // The field name in the current table that this field depends on, used for cascading

    String dependColumn() default "id"; // The column in the dependency field used for matching

}
```

## Example: Province-City-District Cascading

```java
@ManyToOne
@JoinColumn(name = "province_id")
@EruptField(
    views = @View(title = "Province", column = "name"),
    edit = @Edit(title = "Province", type = EditType.REFERENCE_TABLE,
        referenceTableType = @ReferenceTableType(id = "id", label = "name"))
)
private Province province;

@ManyToOne
@JoinColumn(name = "city_id")
@EruptField(
    views = @View(title = "City", column = "name"),
    edit = @Edit(title = "City", type = EditType.REFERENCE_TABLE,
        referenceTableType = @ReferenceTableType(
            id = "id", label = "name",
            dependField = "province",
            dependColumn = "province.id"
        ))
)
private City city;
```
