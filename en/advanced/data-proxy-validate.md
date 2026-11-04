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

## Server-side Enforcement of Declared Limits <Badge type="tip" text="v2.4.0+" />

Since 2.4.0 the limits an edit form declares in its annotations are **enforced on the server as well** (`EruptValueValidator`), not only by the page widgets: values arriving through a direct API call, a cell edit, a batch edit or an Excel import are checked against the same rules, and a failure names the field and the offending value.

| Component | What is checked |
|---|---|
| `INPUT` | length within `@InputType(length)` |
| `NUMBER` | `@NumberType(min / max)`, only where explicitly declared |
| `SLIDER` | `@SliderType(min / max)` |
| `RATE` | `0 .. count`, halves only with `allowHalf = true` |
| `TAGS` | no more than `maxTagCount`; with `allowExtension = false` every tag must come from `tags` or `fetchHandler` |
| `DATE` | the direction of `pickerMode` `FUTURE` / `HISTORY`, and the `min` / `max` range |
| `CHOICE` / `MULTI_CHOICE` | the value must be one of the options, see [Server-side Option Check](/en/field-types/choice#server-side-option-check) |
| `TAB_TABLE_ADD` | every row runs its sub model's own rules: required, regex, XSS, the sub model's `DataProxy.validate`, then the table above |

- Only fields **present in the submitted data** are checked, so a cell edit checks its one field
- On an edit a value equal to the stored one passes: data saved before a rule tightened (a retired option, a lowered maximum) never blocks editing the rest of that record
- This layer runs before `DataProxy.validate`; business rules still belong in `validate`

```java
@EruptField(
    edit = @Edit(title = "Discount", type = EditType.NUMBER,
                 numberType = @NumberType(min = 0, max = 100))
)
private Integer discount; // an API call submitting 120 is refused too
```
