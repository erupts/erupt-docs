# Query Conditions (beforeFetch / searchCondition)

Control query behavior with `beforeFetch` and `searchCondition`: the former dynamically injects filter conditions before a query, the latter pre-sets default search values.

## beforeFetch Condition Injection

The return value of `beforeFetch` is a JPQL (HQL) WHERE clause **without the `WHERE` keyword** — the framework appends it automatically.

```java
@Override
public String beforeFetch(List<Condition> conditions) {
    // Only query data belonging to the currently logged-in user
    String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
    return "createBy = '" + currentUser + "'";
}
```

Supported syntax examples:

| Scenario | Return value example |
| --- | --- |
| Equals | `"status = 1"` |
| Range | `"age between 18 and 60"` |
| Like | `"name like '%John%'"` |
| IN | `"id in (1, 2, 3)"` |
| Association property | `"dept.id = 10"` |
| Multiple conditions | `"status = 1 and deleteFlag = 0"` |
| Subquery | `"id in (select userId from t_order where amount > 100)"` |

> Note: This is JPQL, not native SQL. Use Java entity property names (camelCase), not database column names.

## searchCondition Default Search Values

Triggered when the page loads to pre-set default search field values. Map keys are entity field names; values are the default search values passed to the frontend.

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest> {

    @Override
    public void searchCondition(Map<String, Object> condition) {
        // Default to the current user's own records
        condition.put("createBy", getCurrentUser());
        // Default status to "enabled"
        condition.put("status", 1);
    }
}
```
