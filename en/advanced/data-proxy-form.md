# Form Behaviors (addBehavior / editBehavior)

- **`addBehavior`**: Triggered when the "add new" form opens. The framework instantiates an empty object then calls this method — use it to pre-populate default values.
- **`editBehavior`**: Triggered when the edit form opens, after the record is loaded from the database. Use it to pre-process or transform field values before rendering (changes are not persisted automatically).

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest> {

    @Override
    public void addBehavior(EruptTest model) {
        // Pre-fill defaults when the add form opens
        model.setStatus("DRAFT");
        model.setCreator(getCurrentUser());
    }

    @Override
    public void editBehavior(EruptTest model) {
        // Pre-process fields before the edit form renders (not persisted)
        if (model.getContent() != null) {
            model.setContent(decrypt(model.getContent()));
        }
    }
}
```

## Related Capabilities

- Standalone full-page forms (`formViewBehavior` / `formSave`): [Form View](/en/advanced/form-view)
