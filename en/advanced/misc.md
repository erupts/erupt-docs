# Miscellaneous

## Hot Build (Modify Annotations Without Restarting)

With hot build enabled, changes to Erupt annotations take effect immediately after refreshing the page — no project restart required.

**Version support**: 1.12.14+

### Limitations

1. Currently only **IntelliJ IDEA** is supported; other IDEs require manual exploration.
2. Adding new **classes** or **fields** does not support hot build — only modifications to existing Erupt annotation values are supported.

### Setup Steps

1. Go to Settings and enable **Reload Class after compilation**
2. Enable **On Frame deactivation → Update Classes and resources**
3. Enable the hot build configuration:

```yaml
erupt:
  # Do not enable in production
  hot-build: true
```

4. Start the application in **debug** mode (required — run mode will not work)
5. Modify an annotation value (e.g., change a name or add sorting), then refresh the page to see the effect (hot build typically takes 2–6 seconds)

## Soft Delete (Logical Delete)

Soft delete is essentially an **update operation**. Instead of physically removing a record, it marks a boolean field (`deleted`) or a status field (`status`) as deleted.

### Implementation

```java
@Erupt(
        name = "Soft Delete",
        filter = @Filter("deleted = false"),
)
@SQLDelete(sql="update test set deleted = true, deleteTime = now() where id = ?")
@Table(name = "test")
@Entity
public class Test extends BaseModel {

    @EruptField(
            views = @View(title = "xxx"),
            edit = @Edit(title = "xxx")
    )
    private String name;
    
    private Date deleteTime;
    
    private Boolean deleted = false;
    
}
```

### How It Works

1. The `deleted` field acts as the soft-delete flag.
2. The `@SQLDelete` annotation overrides the default delete SQL.
3. The `filter` attribute filters out deleted records in all queries.
