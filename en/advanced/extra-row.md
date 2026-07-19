# Custom Rows (extraRow)

Append custom rows to the table via the `extraRow` method of [DataProxy](/en/advanced/data-proxy) — commonly used for totals and summaries.

## Bind the DataProxy Interface

```java
@Erupt(name = "Erupt", dataProxy = ExtraRowHandler.class)
public class EruptTest extends BaseModel{
    
    @EruptField(
            views = @View(title = "Name"),
            edit = @Edit(title = "Name")
    )
    private String name;
    
}
```

## Custom Row Implementation

```java
@Component
public class ExtraRowHandler implements DataProxy<EruptTest> {

    @Override
    public List<Row> extraRow(List<Condition> conditions) {
        // Row object
        List<Row> rows = new ArrayList<>();
        // Column objects
        List<Column> columns = new ArrayList<>();

        columns.add(Column.builder().value("Custom Row").colspan(2).build());
        columns.add(Column.builder().value(100 + "").colspan(6).className("text-red").build());

        rows.add(Row.builder().columns(columns).build());
        return rows;
    }	

}
```

## Row and Column Object Structure

```java
public class Row {

    private List<Column> columns;

    private String className; // CSS class name, can be defined in app.css

}

public class Column {

    private String value;        // Display value in the table

    private int colspan = 1;     // Number of columns to span

    private String className;    // CSS class name, can be defined in app.css

}
```
