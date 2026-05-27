# Sort @OrderBy

`@OrderBy` defines the default sort order for data, following HQL `ORDER BY` syntax.

## Usage

- Single-field sort: `ClassName.fieldName [asc|desc]`
- Multi-field sort: `ClassName.fieldName [asc|desc], ClassName.fieldName [asc|desc] ...`

```java
@Erupt(
       name = "Erupt",
       orderBy = "EruptTest.no desc"
)
public class EruptTest extends BaseModel {
    
    @EruptField(
            views = @View(title = "Number"),
            edit = @Edit(title = "Number")
    )
    private Integer no;
    
}
```

## Key Points

- **`orderBy` attribute**: Set on the `@Erupt` annotation to define the default sort behavior.
- **Class name qualifier**: To avoid column name conflicts in multi-table queries, the sort field must be prefixed with its class name (e.g. `EruptTest.no`).
- **Sort direction**: `asc` for ascending (default), `desc` for descending.
