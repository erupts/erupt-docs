# Dynamic Forms

## Dynamic Columns

> Note: Supported since 1.11.1+

```java
@Erupt(name = "Dynamic Columns")
@Table(name = "t_test")
@Entity
public class Simple extends BaseModel {

    @EruptField(
        views = @View(
            title = "Dynamic Column",
            ifRender = @ExprBool(exprHandler = DynamicView.class)
        )
    )
    private String dynamic;

}
```

```java
import xyz.erupt.annotation.expr.ExprBool;

@Component
public class DynamicView implements ExprBool.ExprHandler {

    @Override
    public boolean handler(boolean expr, String[] params) {
        // TODO: dynamic control logic, e.g., show/hide based on the current logged-in user
        return false;
    }
    
}
```

## Dynamic Form Fields

```java
@Erupt(name = "Dynamic Form")
@Table(name = "t_test")
@Entity
public class Simple extends BaseModel {

    @EruptField(
            edit = @Edit(
                    title = "Dynamic Field",
                    ifRender = @ExprBool(exprHandler = DynamicEdit.class)
            )
    )
    private String dynamic;

}
```

```java
import xyz.erupt.annotation.expr.ExprBool;

@Component
public class DynamicEdit implements ExprBool.ExprHandler {

    @Override
    public boolean handler(boolean expr, String[] params) {
        // TODO: dynamic control logic, e.g., show/hide based on the current logged-in user
        return false;
    }
    
}
```

## Virtual Columns

> If you want to display a non-database field on the page, virtual columns are the answer. Fields annotated with `@Transient` will not generate a database column at startup — they are purely a UI display mechanism. You can populate virtual column values using `DataProxy`.

```java
@Erupt(name = "Virtual Column", dataProxy = VirtualDemo.class)
@Table(name = "virtual_demo")
@Entity
public class VirtualDemo extends BaseModel implements DataProxy<VirtualDemo> {

    // Text input
    @EruptField(
            views = @View(title = "Text"),
            edit = @Edit(title = "Text")
    )
    private String field;
    
    
    @Transient
    @EruptField(
        views = @View(title = "Virtual Column (non-database field)")
    )
    private String virtualColumn;
    
    @Override
    public void afterFetch(Collection<Map<String, Object>> list) {
        for (Map<String, Object> map : list) {
            map.put("virtualColumn", "Custom virtual column value");
        }
    }
    
}
```

## Virtual Form Fields

> Fields annotated with `@Transient` will not generate a database column at startup — they are purely a form display mechanism. You can use `DataProxy` to process virtual form values.

```java
@Erupt(name = "Virtual Form", dataProxy = VirtualDemo.class)
@Table(name = "virtual_demo")
@Entity
@Setter
public class VirtualDemo extends BaseModel implements DataProxy<VirtualDemo> {

    @EruptField(
            views = @View(title = "Text"),
            edit = @Edit(title = "Text")
    )
    private String text;
    
    
    @Transient
    @EruptField(
        edit = @Edit(title = "Virtual Form Field")
    )
    private String virtualForm;

    
    @Override
    public void afterAdd(VirtualDemo virtualDemo) {
        // Combine the virtual field value into the persisted field on add
        this.text = this.text + this.virtualForm;
    }
    
}
```

## Row Filtering

See: [Data Filtering @Filter](/en/annotation/filter)

## Custom Rows (Summary Row)

### Bind the DataProxy Interface

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

### Custom Row Implementation

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

### Row and Column Object Structure

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
