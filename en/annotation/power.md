# Permission Control @Power

The `@Power` annotation gives fine-grained control over which CRUD operations are enabled on an Erupt UI — add, delete, edit, query, import, and export.

> Controls the capabilities of an Erupt class: add, edit, delete, import, export, and more.

## Usage

```java
@Erupt(
       name = "Erupt",
       power = @Power(add = true, delete = true, 
                      edit = true, query = true, 
                      importable = false, export = false)
)
public class EruptTest extends BaseModel {
    
}
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `add` | boolean | true | Whether adding data is allowed |
| `delete` | boolean | true | Whether deleting data is allowed |
| `edit` | boolean | true | Whether editing data is allowed |
| `query` | boolean | true | Whether querying data is allowed |
| `viewDetails` | boolean | true | Whether viewing record details is allowed |
| `export` | boolean | false | Whether exporting data is allowed |
| `importable` | boolean | false | Whether importing data is allowed |
| `copy` | boolean | true | Whether to allow one-click row copy (2.0.0+) |
| `powerHandler` | Class | - | Implement this interface to control permissions dynamically |

## Annotation Definition

```java
public @interface Power {
    boolean add() default true; // add data

    boolean delete() default true; // delete data

    boolean edit() default true; // edit data

    boolean query() default true; // query data

    boolean viewDetails() default true; // view record details

    boolean export() default false; // export data

    boolean importable() default false; // import data

    boolean copy() default true; // one-click row copy (2.0.0+)

    // implement this interface to control permissions dynamically
    Class<? extends PowerHandler> powerHandler() default PowerHandler.class;
}
```

```java
public interface PowerHandler {

    /**
     * Dynamically control feature permissions
     * @param power  a simple POJO representing add/delete/edit/query capabilities
     */
    void handler(PowerObject power);

}
```

## Notes

When a user accesses the page, both **menu permissions** and annotation values are checked. If a feature is enabled in `@Power` but still not visible, verify that the corresponding menu permission is complete — any missing permissions must be added manually.
