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

### Row-Level Filtering by User Role

A common data-permission scenario: admins see everything, department managers see their own department, and regular staff see only the records they own.

```java
@Erupt(
        name = "Customer",
        filter = @Filter(conditionHandler = RoleDataFilter.class)
)
@Table(name = "customer")
@Entity
public class Customer extends BaseModel {

    @EruptField(
            views = @View(title = "Customer Name"),
            edit = @Edit(title = "Customer Name")
    )
    private String name;

    @EruptField(views = @View(title = "Department"))
    @ManyToOne
    private EruptOrg org;

    @EruptField(views = @View(title = "Owner"))
    @ManyToOne
    private EruptUser owner;

}
```

```java
@Service
public class RoleDataFilter implements FilterHandler {

    @Resource
    private EruptUserService eruptUserService;

    @Override
    public String filter(String condition, String[] params) {
        EruptUser user = eruptUserService.getCurrentEruptUser();
        // admins are unrestricted
        if (user.getIsAdmin()) return null;
        Set<String> roles = user.getRoles().stream()
                .map(EruptRole::getCode).collect(Collectors.toSet());
        // department manager: all records of their department
        if (roles.contains(RoleCode.MANAGER.name()) && null != user.getEruptOrg()) {
            return "org.id = " + user.getEruptOrg().getId();
        }
        // regular staff: only records they own
        return "owner.id = " + user.getId();
    }

}
```

:::tip
Returning `null` or an empty string from `filter` appends no condition at all, meaning all rows are visible.
:::

Always build conditions from numeric fields such as ids. If you must concatenate user-supplied strings, escape them or validate against a whitelist first to avoid HQL injection. Multiple roles can be combined with `or`:

```java
List<String> conditions = new ArrayList<>();
if (roles.contains(RoleCode.MANAGER.name())) {
    conditions.add("org.id = " + user.getEruptOrg().getId());
}
if (roles.contains(RoleCode.SALES.name())) {
    conditions.add("owner.id = " + user.getId());
}
return conditions.isEmpty() ? "1 = 2" : String.join(" or ", conditions);
```

## Notes

- Filter conditions must follow HQL syntax.
- Can be combined with the permission system to implement row-level access control.
- Parameterized queries are supported for improved security.
