# Virtual Fields (@Transient)

Fields annotated with JPA `@Transient` will not generate a database column at startup — they are purely a UI display mechanism. Use [DataProxy](/en/advanced/data-proxy) to populate or consume virtual field values.

## Virtual Columns

Display a non-database field in the table and populate its value via `DataProxy.afterFetch`:

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

Show a non-database field in the form and consume its value in `DataProxy` after submission:

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
