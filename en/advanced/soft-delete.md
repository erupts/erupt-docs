# Soft Delete

Soft delete is essentially an **update operation**. Instead of physically removing a record, it marks a boolean field (`deleted`) or a status field (`status`) as deleted.

## Implementation

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

## How It Works

1. The `deleted` field acts as the soft-delete flag.
2. The `@SQLDelete` annotation overrides the default delete SQL.
3. The `filter` attribute filters out deleted records in all queries.
