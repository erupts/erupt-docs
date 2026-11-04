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
| `ifRender` | Dynamically controls whether the component is rendered (`ExprBool`), see [ifRender Dynamic Rendering](/en/annotation/if-render) |
| `dynamic` | Dynamically controls the component state based on another field's value, see [@Dynamic](/en/annotation/dynamic) |
| `onchange` | Value-change linkage (1.13.2+), see [OnChange](/en/annotation/on-change) |
| `onchangeParams` | Parameters (`String[]`) passed to the `onchange` handler, readable inside the OnChange interface |
| `orderBy` | Sort rule, HQL `ORDER BY` syntax; only applicable when the field is a related object |
| `filter` | Filter condition, HQL `WHERE` syntax; only applicable when the field is a related object |
| `prompt` | AI prompt, added in 2.0.0 — injected as field-level context when erupt-ai invokes this field's tool, and used as the authoring guidance for the [AI writing assistant](/en/modules/erupt-ai/writing-assistant) |
| `cellEdit` | Whether this field may be edited directly in the table, defaults to `true` (2.2.0+), see [@Power cellEdit](/en/annotation/power#celledit-in-table-cell-editing) |
| `ai` | Whether the [AI writing assistant](/en/modules/erupt-ai/writing-assistant) is offered on this field, defaults to `true`; only text-bearing components carry it (2.2.0+) |

## Component Types (EditType)

`type` supports 30+ component types. For detailed configuration options and examples for each type, see the [Components overview](/en/field-types/).
