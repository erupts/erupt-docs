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

    // step-by-step form wizard mode (2.1.1+)
    boolean formSteps() default false;

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

    // collapse the row's view-details, edit, and delete buttons into a dropdown menu (2.0.0+)
    boolean collapseActionButton() default false;

    // truncate a cell that overflows its column with an ellipsis; false wraps it instead and keeps every button of the operation column visible (2.3.0+)
    boolean tableTruncate() default true;

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

## formSteps Step Wizard <Badge type="tip" text="v2.1.1+" />

When `formSteps = true`, the form is rendered as a **step-by-step wizard**, with `DIVIDE` fields acting as step boundaries.

See the dedicated page: [Step Form formSteps](/en/annotation/form-steps)

## collapseActionButton <Badge type="tip" text="v2.0.0+" />

When `collapseActionButton = true`, the per-row **view details, edit, and delete** buttons are collapsed into a dropdown menu, reducing the width of the action column and making the table more compact.

```java
@Erupt(
    name = "Example",
    layout = @Layout(collapseActionButton = true)
)
```

## tableTruncate Wrapping Cells <Badge type="tip" text="v2.3.0+" />

By default a cell that overflows its column is cut off with an ellipsis and the full value shows on hover. With `tableTruncate = false` cells **wrap** instead, so long text, many tags or many buttons are visible at once:

```java
@Erupt(
    name = "Example",
    layout = @Layout(tableTruncate = false)
)
```

- Data columns drop their `nowrap` / ellipsis and wrap with the content
- The operation column is sized for one row of icons and the remaining buttons flow onto the next line — a model with many row actions no longer loses the tail of them behind an ellipsis
- Row height varies with the content, so fixed-height virtual scrolling stays off for these tables; keep the default on models with very large result sets

## Fixed Columns

Use `tableLeftFixed` and `tableRightFixed` to pin columns on either side of the table so they remain visible during horizontal scrolling, improving the data browsing experience.
