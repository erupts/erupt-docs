# Data Filter @Filter

The `@Filter` annotation defines data display filter conditions, following HQL `WHERE` clause syntax.

## Usage

```java
@Erupt(
       name = "Test",
       filter = @Filter("EruptTest.name = '张三'"),
)
public class EruptTest extends BaseModel {
 
    @EruptField(
            views = @View(title = "Name"),
            edit = @Edit(title = "Name")
    )
    private String name;
    
}
```

## Annotation Definition

```java
public @interface Filter {
    
    String value() default ""; // filter condition expression

    String[] params() default {}; // callback parameters

    // dynamically control filter conditions
    Class<? extends FilterHandler> conditionHandler() default FilterHandler.class; 
}
```

## Code Examples

### Dynamic Filter Conditions

```java
@Erupt(
       name = "Test",
       filter = @Filter(value = "name = '123' or name ",
                        params = {"23333"},
                        conditionHandler = AutoFilter.class)
)
public class EruptTest extends BaseModel {
 
    @EruptField(
            views = @View(title = "Name"),
            edit = @Edit(title = "Name")
    )
    private String name;
    
}
```

```java
@Component
public class AutoFilter implements FilterHandler {
    
    /**
     * @param condition  filter condition expression
     * @param params     annotation parameters
     * 
     * Result: name = '123' or name = '23333'
     */
    @Override
    public String filter(String condition, String[] params) {
        // generate a new filter expression
        // return "name is null"
        
        // append query parameter
        return condition + " = '" + params[0] + "'";
    }
    
}
```

## Notes

- Filter conditions must follow HQL syntax.
- Can be combined with the permission system to implement row-level access control.
- Parameterized queries are supported for improved security.
