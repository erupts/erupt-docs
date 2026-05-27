# Page Layout @Layout

**Supported since**: `1.12.0`

The `@Layout` annotation configures page-level UI behavior such as form layout, pagination mode, column pinning, and more.

## Code Example

```java
@Erupt(
       name = "Erupt",
       orderBy = "EruptTest.no desc",
       layout = @Layout(
           // pin the first three columns
           tableLeftFixed = 3, 
           // use frontend pagination
           pagingType = Layout.PagingType.FRONT,
           // show 20 records per page
           pageSize = 20
        )
)
public class EruptTest extends BaseModel {
    
}
```

## Annotation Definition and Attributes

```java
public @interface Layout {

    // form size
    FormSize formSize() default FormSize.DEFAULT;

    // number of columns to pin on the left side of the table
    int tableLeftFixed() default 0;

    // number of columns to pin on the right side of the table
    int tableRightFixed() default 0;

    // pagination mode
    PagingType pagingType() default PagingType.BACKEND;

    // page size
    int pageSize() default 10;

    // available page sizes
    int[] pageSizes() default {10, 20, 30, 50, 100, 300, 500};

    // auto-refresh interval in milliseconds, -1 disables auto-refresh (supported in 1.12.13+)
    int refreshTime() default -1;

    // total table width; auto-calculated from field count if not set (supported in 1.12.20+)
    // example: tableWidth = "1000px"
    String tableWidth() default "";

    // action column width; auto-calculated if not set (supported in 1.12.21+)
    // example: tableOperatorWidth = "100px"
    String tableOperatorWidth() default "";

    enum FormSize {
        // default layout: up to three form components per row
        DEFAULT, 
        // full-line layout: one form component per row
        FULL_LINE
    }

    enum PagingType {
        // server-side pagination
        BACKEND,
        // client-side pagination
        FRONT,
        // no pagination; max records: pageSizes[pageSizes.length - 1] * 10
        NONE
    }

}
```

## FormSize

Controls the form component layout:

- **`DEFAULT`**: Default layout, up to three form components per row.
- **`FULL_LINE`**: Full-line layout, one form component per row taking the full width.

## PagingType

Defines the table pagination mode:

- **`BACKEND`**: Server-side pagination (default) — each page turn requests data from the server.
- **`FRONT`**: Client-side pagination — all data is loaded at once and paginated in the browser.
- **`NONE`**: No pagination.

## Fixed Columns

Use `tableLeftFixed` and `tableRightFixed` to pin columns on either side of the table so they remain visible during horizontal scrolling, improving the data browsing experience.
