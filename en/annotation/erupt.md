# Core @Erupt

## Usage

Add the `@Erupt` annotation to a class definition:

```java
@Erupt(
       name = "Erupt",              // feature name
       desc = "Erupt Engine",       // description
       orderBy = "id desc",         // sort expression
       .....
)
public class EruptTest extends BaseModel {
    
    // TODO
    
}
```

## Annotation Attributes

| Attribute | Description |
| --- | --- |
| `primaryKeyCol` | Primary key column name, defaults to `id` |
| `name` | Feature name |
| `desc` | Feature description |
| `layout` | Page layout configuration, see [@Layout](/en/annotation/layout) |
| `authVerify` | Whether access requires authorization |
| `orderBy` | Sort rule, follows HQL `ORDER BY` syntax, see [@OrderBy](/en/annotation/order-by) |
| `power` | Controls add/delete/edit/query/import/export capabilities, see [@Power](/en/annotation/power) |
| `filter` | Data display filter conditions, follows HQL `WHERE` syntax, see [@Filter](/en/annotation/filter) |
| `tree` | Tree node configuration, see [@Tree](/en/annotation/tree) |
| `linkTree` | Left-tree right-table layout, see [@LinkTree](/en/annotation/link-tree) |
| `drills` | Custom drill-down associated views, see [@Drill](/en/annotation/drill) |
| `rowOperation` | Custom action buttons, see [@RowOperation](/en/annotation/row-operation) |
| `dataProxy` | Service-layer logic extension (extending existing logic), see [DataProxy](/en/advanced/data-proxy) |
| `dataProxyParams` | Custom parameters, accessible inside `dataProxy` via `DataProxyContext.get()` |
| `visRawTable` | Whether to keep the default table view, defaults to `true`; set to `false` to show only the views defined in `vis` |
| `vis` | Additional view configurations (card, Gantt, kanban, etc.), see [@Vis Multi-View](/en/annotation/vis) |
| `param` | Custom parameters |
| `prompt` | AI agent prompt — injected as context when erupt-ai invokes this entity's tool, added in 2.0.0 |

## Annotation Definition

```java
public @interface Erupt {

    String primaryKeyCol() default "id"; // primary key column name, defaults to id

    String name(); // feature name

    String desc() default ""; // feature description

    boolean authVerify() default true; // whether access requires authorization

    Power power() default @Power; // controls add/delete/edit/query/import/export

    RowOperation[] rowOperation() default {}; // custom action buttons

    Drill[] drills() default {}; // custom drill-down associated views

    Filter[] filter() default {}; // data filtering

    String orderBy() default ""; // sort rule

    Class<? extends DataProxy>[] dataProxy() default {}; // proxy callback interface methods

    String[] dataProxyParams() default {}; // accessible inside dataProxy via DataProxyContext.get()

    Tree tree() default @Tree; // tree node configuration

    LinkTree linkTree() default @LinkTree(field = ""); // left-tree right-table configuration

    Layout layout() default @Layout; // page layout configuration

    KV[] param() default {}; // custom parameters

    String prompt() default ""; // AI agent prompt (2.0.0+)
}
```
