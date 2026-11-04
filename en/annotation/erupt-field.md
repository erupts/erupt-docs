# @EruptField

A field-level annotation that configures how a field is displayed in the table (`@View`) and how it behaves in forms (`@Edit`).

## Attributes

| Attribute | Description |
|-----------|-------------|
| `views` | Table column configuration, accepts an array to support multiple columns; omit to hide the field from the table |
| `edit` | Edit component configuration; omit to exclude the field from forms — the framework will not trust any frontend-submitted value for this field |
| `sort` | Display order; lower numbers appear first, defaults to field declaration order |
| `params` | Custom extension parameters, passed through to the frontend |

## Example

```java
@EruptField(
    sort = 10,
    views = @View(title = "Name"),
    edit = @Edit(title = "Name", notNull = true)
)
private String name;
```

## Notes

- Omitting `views` hides the field from the table.
- Omitting `edit` prevents the field from being edited in forms, and the framework will not trust any value submitted by the frontend for this field.
