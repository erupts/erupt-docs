# @Edit

Configures how a field behaves in the add/edit form, including the component type, required validation, search behavior, read-only state, and more.

## Attributes

| Attribute | Description |
|-----------|:-----------:|
| `title` | Form field label |
| `desc` | Description / hint text |
| `notNull` | Whether the field is required, defaults to `false` |
| `show` | Whether to display the component, defaults to `true` |
| `placeHolder` | Placeholder text for input components |
| `type` | Component type, defaults to `AUTO`, see the type table below |
| `search` | Search configuration, see [@Search](/en/annotation/search) |
| `readonly` | Read-only configuration, see [@Readonly](/en/annotation/dynamic) |
| `ifRender` | Dynamically controls whether the component is rendered (`ExprBool`) |
| `dynamic` | Dynamically controls the component state based on another field's value, see [@Dynamic](/en/annotation/dynamic) |
| `onchange` | Value-change linkage (1.13.2+), see [OnChange](/en/advanced/dynamic-form) |
| `orderBy` | Sort rule, HQL `ORDER BY` syntax; only applicable when the field is a related object |
| `filter` | Filter condition, HQL `WHERE` syntax; only applicable when the field is a related object |

## Component Types (EditType)

For detailed configuration options and examples for each type, see the [component type documentation](/en/field-types/).

### Basic Components

| Type | Description | Search | Advanced Search |
|------|-------------|:-------:|:---------------:|
| `AUTO` | Default, automatically inferred from field type | | |
| `INPUT` | Single-line text input | ✅ | ✅ |
| `NUMBER` | Numeric input | ✅ | ✅ |
| `SLIDER` | Numeric slider | ✅ | ✅ |
| `COLOR` | Color picker | ❌ | ❌ |
| `RATE` | Star rating | ✅ | ✅ |
| `DATE` | Date/time picker | ✅ | ✅ |
| `BOOLEAN` | Toggle switch | ✅ | ❌ |
| `CHOICE` | Single-select (radio) | ✅ | ✅ |
| `MULTI_CHOICE` | Multi-select (checkbox) | ❌ | ❌ |
| `TAGS` | Tag selector | ✅ | ❌ |
| `AUTO_COMPLETE` | Auto-complete input | ✅ | ❌ |
| `TEXTAREA` | Multi-line text area | ✅ | ✅ |
| `HTML_EDITOR` | Rich text editor | ✅ | ✅ |
| `CODE_EDITOR` | Code editor | ✅ | ✅ |
| `MARKDOWN` | Markdown editor | ❌ | ❌ |
| `ATTACHMENT` | File / image upload | ❌ | ❌ |
| `MAP` | Map picker | ❌ | ❌ |
| `SIGNATURE` | Handwritten signature | ❌ | ❌ |
| `DIVIDE` | Divider | ❌ | ❌ |
| `TPL` | Custom HTML template | ❌ | ❌ |
| `HIDDEN` | Hidden field | ❌ | ❌ |
| `EMPTY` | Empty placeholder (still occupies form space) | ❌ | ❌ |

### Relation Components

> Requires JPA relationship annotations

| Type | Description | Search |
|------|-------------|:------:|
| `COMBINE` | One-to-one inline embed | ❌ |
| `REFERENCE_TREE` | Many-to-one tree reference | ✅ |
| `REFERENCE_TABLE` | Many-to-one table reference | ✅ |
| `CHECKBOX` | Many-to-many checkbox | ❌ |
| `TAB_TREE` | Many-to-many tree reference | ❌ |
| `TAB_TABLE_REFER` | Many-to-many table reference | ❌ |
| `TAB_TABLE_ADD` | One-to-many add | ❌ |
