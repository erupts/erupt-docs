# Data Dictionary

Dictionaries hold simple key-value data that changes often: ethnicity, country, order status, lead source, HTTP method. Moving them out of enums in code and into a dictionary lets operations staff add and edit options themselves, with no release.

## Structure

Two levels:

| Level | Field | Description |
| --- | --- | --- |
| Dictionary | Code | Unique key, referenced from code to load the whole option set |
| | Name / Remark | Purpose |
| Dict Item | Code | Unique within the dictionary, recommended as the stored value |
| | Name | Display text |
| | Value | Extra payload such as a color or number |
| | Sort | Order in the dropdown |

Open **Dict Item** from the row operation on the dictionary list. Dictionaries export; items import and export, which makes moving them between environments easy.

## As Dropdown Options

Reference the dictionary code through `ChoiceType.fetchHandler` in `@Edit`, and the field renders as a dropdown fed live from the dictionary:

```java
@EruptField(
    views = @View(title = "Lead Source"),
    edit = @Edit(
        title = "Lead Source",
        type = EditType.CHOICE,
        choiceType = @ChoiceType(
            fetchHandler = DictCodeChoiceFetchHandler.class,
            fetchHandlerParams = "customer_source"   // dictionary code
        )
    )
)
private String source;
```

| Handler | Value stored |
| --- | --- |
| `DictCodeChoiceFetchHandler` | Item **code** (recommended, immune to id changes) |
| `DictChoiceFetchHandler` | Item **id** |

Options are cached; a second entry in `fetchHandlerParams` sets the cache time in milliseconds. Multi-select fields work the same way, see [CHOICE → Dictionary options](/en/field-types/choice#dictionary-options).
