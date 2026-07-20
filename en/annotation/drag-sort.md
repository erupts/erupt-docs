# Row Drag Sort @DragSort <Badge type="tip" text="2.0.4+" />

`@DragSort` enables row drag-sort on the table via the `@Erupt` annotation. Once a numeric sort field is specified through `field`, table rows can be reordered by dragging, and the result is automatically persisted to that field. When no explicit sort is given, the field is used as the default query sort.

## Usage

```java
@Erupt(
    name = "Dict Item",
    dragSort = @DragSort(field = "sort")
)
public class DictItem extends BaseModel {

    @EruptField(
        views = @View(title = "Sort", sortable = true)
    )
    private Integer sort;

}
```

## Annotation Attributes

| Attribute | Description |
| --- | --- |
| `field` | Numeric field name that stores the row order value; drag sort is enabled when not empty |

## Annotation Definition

```java
public @interface DragSort {

    String field(); // numeric field that stores the row order value; drag sort is enabled when not empty

}
```

## Key Points

- **Numeric field**: the field referenced by `field` must be a numeric type (e.g. `Integer`) used to persist row order
- **Auto persistence**: after dragging a row, the framework automatically writes the new order to the field — no extra code needed
- **Default sort**: when no sort is specified via `orderBy` or otherwise, the field is used as the default query sort

:::tip
Initialize the sort value for new records via `DataProxy.beforeAdd`. Built-in features such as roles and dict items already have this capability enabled.
:::
