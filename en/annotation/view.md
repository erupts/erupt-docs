# @View

Configures how a field is displayed as a column in the list table, including the column title, width, display type, sorting, and more.

## Attributes

| Attribute | Description |
|-----------|-------------|
| `title` | Column header title |
| `desc` | Column description |
| `type` | Data display type, defaults to `AUTO`, see the type table below |
| `show` | Whether to display the column, defaults to `true` |
| `sortable` | Whether clicking the column header sorts the table, defaults to `false` |
| `export` | Whether to include in Excel exports, defaults to `true` |
| `width` | Column width with unit, e.g. `200px`, `20%` |
| `column` | When the field is an object type, specifies the property name to display (commonly used with `@ManyToOne`) |
| `className` | CSS class name applied to the column |
| `tpl` | Opens a custom template in a popup; the `row` variable is available inside the template to access current row data |
| `ifRender` | Dynamically controls whether the column is rendered (`ExprBool`) |
| `template` | Column value formatting template (a JS expression evaluated by `eval` on the frontend); available variables: `value` (current cell value), `item` (full row data), `item.xxx` (specific column value) |

## Display Types (ViewType)

| Type | Description |
|------|-------------|
| `AUTO` | Automatically inferred from the `@Edit` type or field type |
| `TEXT` | Plain text |
| `SAFE_TEXT` | Text containing scripts or tags is not rendered, preventing XSS (1.12.11+) |
| `IMAGE` | Image |
| `IMAGE_BASE64` | Base64-encoded image |
| `SWF` | Flash animation |
| `HTML` | Renders an HTML fragment |
| `MOBILE_HTML` | Renders HTML at mobile screen dimensions |
| `QR_CODE` | QR code |
| `LINK` | Opens a link in a new window |
| `LINK_DIALOG` | Opens a link in a dialog |
| `DOWNLOAD` | Direct download |
| `ATTACHMENT` | Opens an attachment in a new window |
| `ATTACHMENT_DIALOG` | Opens an attachment in a dialog |
| `DATE` | Date formatted display |
| `DATE_TIME` | Date-time formatted display |
| `BOOLEAN` | Boolean value display |
| `NUMBER` | Numeric display |
| `MAP` | Map display |
| `CODE` | Syntax-highlighted code display |
| `MARKDOWN` | Rendered Markdown display |
| `TAB_VIEW` | One-to-many / many-to-many sub-table display |
