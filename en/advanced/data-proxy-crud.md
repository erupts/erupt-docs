# CRUD Interception (before* / after*)

Inject business logic around add, update, and delete operations: `before*` methods run before data is persisted and can modify data or abort the operation; `after*` methods run after successful persistence — ideal for side effects such as cache writes and message push.

## Hook Methods

| Method | Trigger | Typical use |
| --- | --- | --- |
| `beforeAdd(MODEL)` | Before an add is saved | Fill defaults, call external services |
| `afterAdd(MODEL)` | After an add is saved | Cache writes, message push |
| `beforeUpdate(MODEL)` | Before an update is saved | Rewrite data dynamically |
| `afterUpdate(MODEL)` | After an update is saved | Sync downstream systems |
| `beforeDelete(MODEL)` | Before a delete | Related-data checks, can abort the delete |
| `afterDelete(MODEL)` | After a delete | Clean up related resources |

> Pure validation logic belongs in `validate` — see [Form Validation (validate)](/en/advanced/data-proxy-validate).

## Code Example

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest> {

    @Override
    public void beforeAdd(EruptTest eruptTest) {
        // Supplement data before saving
        eruptTest.setCreateBy(getCurrentUser());
    }

    @Override
    public void beforeUpdate(EruptTest eruptTest) {
        // Dynamically modify data before saving
        eruptTest.setName(eruptTest.getName() + "xxxxxxx");
    }

    @Override
    public void beforeDelete(EruptTest eruptTest) {
        // Check before delete; throwing an exception aborts the operation
        if (hasRelatedOrder(eruptTest.getId())) {
            throw new EruptApiErrorTip("Related orders exist — deletion is not allowed");
        }
    }

    @Override
    public void afterAdd(EruptTest eruptTest) {
        // Push messages, write caches, etc. after a successful add
    }

}
```

:::tip
Throw `EruptApiErrorTip` (or `EruptException`) in any `before*` method to abort the operation and show the error message to the user.
:::
