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
| `orderBy` | Sort rule, HQL `ORDER BY` syntax; only applicable when the field is a related object |
| `filter` | Filter condition, HQL `WHERE` syntax; only applicable when the field is a related object |
| `prompt` | AI agent prompt — injected as field-level context when erupt-ai invokes this field's tool, added in 2.0.0 |

## Component Types (EditType)

`type` supports 30+ component types. For detailed configuration options and examples for each type, see the [Field Types overview](/en/field-types/).
