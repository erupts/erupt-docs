# Search @Search

The `@Search` annotation configures whether a field appears in the search bar at the top of the list page, and how the search is matched.

## Usage

```java
@EruptField(
    views = @View(title = "Name"),
    edit = @Edit(title = "Name", search = @Search)
)
private String name;
```

## Configuration

```java
public @interface Search {

    boolean value() default true; // whether search is enabled

    boolean notNull() default false; // whether this is a required search field

    // Default query operator (2.0.2+), applied when the search condition does not carry one
    // AUTO resolves by edit type (e.g. INPUT defaults to LIKE, NUMBER defaults to EQ)
    QueryExpression operator() default QueryExpression.AUTO;

    // Lock the operator (2.1.1+): hide the operator selector on the frontend and force
    // the configured operator server-side, ignoring any client-supplied one — so crafted
    // requests cannot bypass query restrictions
    boolean lockOperator() default false;

}
```

**Specifying a default operator (2.0.2+):**

```java
@EruptField(
    views = @View(title = "Name"),
    edit = @Edit(title = "Name", search = @Search(operator = QueryExpression.EQ))
)
private String name;
```

**Locking the operator (2.1.1+):**

```java
@EruptField(
    views = @View(title = "Status"),
    edit = @Edit(title = "Status", search = @Search(operator = QueryExpression.EQ, lockOperator = true))
)
private String status;
```

:::tip
The `vague` property was removed in 2.0.0. Advanced search (range queries, fuzzy matching, etc.) is now the default behaviour for each component — no extra configuration needed.
:::

## Multi-Select Search with IN / NOT_IN <Badge type="tip" text="v2.1.1+" />

Choice fields (`CHOICE`) and reference fields (`REFERENCE_TABLE`, `REFERENCE_TREE`) support multi-select values in the search bar when the `IN` / `NOT_IN` operator is selected, matching multiple options in a single query.

## QueryExpression Operators

`QueryExpression` is the enum used when building `Condition` objects inside `DataProxy.beforeFetch`, and is also the operator type carried by search conditions sent from the frontend.

| Operator | Description |
|----------|-------------|
| `EQ` | Equals |
| `NEQ` | Not equals |
| `GT` | Greater than (2.0.0+) |
| `GTE` | Greater than or equal (2.0.0+) |
| `LT` | Less than (2.0.0+) |
| `LTE` | Less than or equal (2.0.0+) |
| `LIKE` | Contains (fuzzy match) |
| `NOT_LIKE` | Does not contain |
| `RANGE` | Range query (between) |
| `IN` | In collection |
| `NOT_IN` | Not in collection (2.0.0+) |
| `NULL` | Is null |
| `NOT_NULL` | Is not null |

**Usage example inside `beforeFetch`:**

```java
@Override
public String beforeFetch(List<Condition> conditions) {
    // Exclude records with specific statuses
    conditions.add(new Condition("status", "deleted", QueryExpression.NOT_IN));
    return null;
}
```
