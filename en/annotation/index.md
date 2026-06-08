# Annotations Overview

An index of Erupt's core annotations, with details on every major feature.

## Class-level Annotations

| Annotation | Link | Description |
|---|---|---|
| `@Erupt` | [@Erupt](/en/annotation/erupt) | Core annotation that defines the entity behavior |
| `@OrderBy` | [@OrderBy](/en/annotation/order-by) | Sort rules |
| `@Layout` | [@Layout](/en/annotation/layout) | Page layout and pagination |
| `@Power` | [@Power](/en/annotation/power) | Permission control for CRUD actions |
| `@RowOperation` | [@RowOperation](/en/annotation/row-operation) | Custom row-action buttons |
| `@Filter` | [@Filter](/en/annotation/filter) | Conditional data filters |
| `@Tree` | [@Tree](/en/annotation/tree) | Tree-based data display |
| `@LinkTree` | [@LinkTree](/en/annotation/link-tree) | Tree-on-the-left, table-on-the-right layout |
| `@Drill` | [@Drill](/en/annotation/drill) | Data drilldown (one-to-many without foreign keys) |
| `@Vis` | [@Vis](/en/annotation/vis) | Switch between card, gantt, kanban, and other views |

## Field-level Annotations

| Annotation | Link | Description |
|---|---|---|
| `@EruptField` | [@EruptField](/en/annotation/erupt-field) | Field declaration (contains `views` and `edit`) |
| `@Edit` | [@Edit](/en/annotation/edit) | Edit-form configuration |
| `@View` | [@View](/en/annotation/view) | Table-column display configuration |
| `@Search` | [@Search](/en/annotation/search) | Search bar configuration |
| `@Dynamic` | [@Dynamic](/en/annotation/dynamic) | Dynamic component control (1.13.1+) |

## Recommendations

1. Start with the basics — understand `@Erupt` first, then move on to feature annotations.
2. Permissions first — configure `@Power` to keep your data safe.
3. Polish your layout with `@Layout` for a better UX.
4. Master `@Drill` and `@LinkTree` to model complex data relationships.
5. Combine `@View` and `@Edit` for fine-grained control over display and editing.
6. Use `@Dynamic` to build conditional, interactive forms.
