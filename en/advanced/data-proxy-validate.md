# Form Validation (validate) <Badge type="tip" text="1.13.1+" />

`validate` is triggered before add and update operations are saved, and is dedicated to data validation: throw `EruptException` (or its subclass `EruptApiErrorTip`) to reject the operation and show the error message to the user.

## Code Example

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest> {

    @Override
    public void validate(EruptTest model) throws EruptException {
        if ("John".equals(model.getName())) {
            throw new EruptApiErrorTip("Name 'John' is not allowed!");
        }
        if (model.getEndDate().before(model.getStartDate())) {
            throw new EruptApiErrorTip("End date cannot be earlier than start date");
        }
    }

}
```

## validate() vs before* Methods

| | `validate()` | `beforeAdd()` / `beforeUpdate()` |
|---|---|---|
| Purpose | Data validation — reject the operation if it fails | Modify data or execute business logic before saving |
| Since | 1.13.1+ | All versions |
| Recommended for | Format checks, business rule validation | Auto-filling fields, calling external services |

```java
@Override
public void validate(EruptTest model) throws EruptException {
    // Recommended: pure validation logic, do not modify data here
    if (model.getEndDate().before(model.getStartDate())) {
        throw new EruptApiErrorTip("End date cannot be earlier than start date");
    }
}

@Override
public void beforeAdd(EruptTest model) {
    // Recommended: modify or supplement data
    model.setCreateBy(getCurrentUser());
}
```
