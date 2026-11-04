# Chained Queries (LambdaQuery)

> Write queries using lambda expressions with strong typing and clean syntax. Supported since 1.12.11+.

```java
@Service
public class EruptLambdaQuery {

    @Resource
    private EruptDao eruptDao;

    public void select() {
        List<EruptUser> list = eruptDao.lambdaQuery(EruptUser.class)
            .like(EruptUser::getName, "e")
            .isNull(EruptUser::getWhiteIp)
            .in(EruptUser::getId, 1, 2, 3, 4)
            .ge(EruptUser::getCreateTime, "2023-01-01")
            .list();
    }

    public void one() {
        EruptUser eruptUser = eruptDao.lambdaQuery(EruptUser.class)
            .isNull(EruptUser::getWhiteIp)
            .one();
    }

    public void orderBy() {
        List<EruptUser> eruptUser = eruptDao.lambdaQuery(EruptUser.class)
            .addCondition("whiteIp is null") // Raw JPQL condition; use Java property names (camelCase)
            .isNotNull(EruptUser::getCreateTime)
            .offset(1).limit(2)
            .orderBy(EruptUser::getCreateTime)
            .orderByDesc(EruptUser::getCreateTime)
            .list();
    }

    // Supported since 1.12.13+
    public void aggr() {
        Long count = eruptDao.lambdaQuery(EruptUser.class).count();

        Object max = eruptDao.lambdaQuery(EruptUser.class)
            .like(EruptUser::getName, "e")
            .max(EruptUser::getCreateTime);
    }

    // Query specific fields (supported since 1.12.15+)
    public void selectFields() {
        // Query a single field
        List<String> accounts = eruptDao.lambdaQuery(EruptUser.class).listSelect(EruptUser::getName);
        // Query multiple specific fields
        List<EruptUser> eruptUsers = eruptDao.lambdaQuery(EruptUser.class)
            .listSelect(EruptUser.class, EruptUser::getName, EruptUser::getExpireDate, EruptUser::getAccount);
        // Query specific fields and return a single result
        EruptUser eruptUser = eruptDao.lambdaQuery(EruptUser.class)
            .eq(EruptUser::getAccount, "erupt")
            .oneSelect(EruptUser.class, EruptUser::getName, EruptUser::getAccount);
    }

    // Lambda Delete (supported since 1.12.23+)
    @Transactional // Note: @Transactional is required
    public void lambdaDelete() {
        eruptDao.lambdaQuery(EruptUser.class)
            .in(EruptUser::getId, 1, 2, 3, 4)
            .ge(EruptUser::getCreateTime, "2023-01-01")
            .isNull(EruptUser::getWhiteIp)
            .delete();
    }

    // Paginated query (supported since 1.13.2+)
    public void page() {
        SimplePage<EruptUser> users = eruptDao.lambdaQuery(EruptUser.class)
            .in(EruptUser::getId, 1, 2, 3, 4)
            .page(10, 0);
        Long total = users.getTotal();
        List<EruptUser> list = users.getList();
    }

    // OR query (supported since 2.0.0+)
    public void orQuery() {
        List<EruptUser> list = eruptDao.lambdaQuery(EruptUser.class)
            .or(q -> q.eq(EruptUser::getAccount, "admin")
                      .eq(EruptUser::getAccount, "guest"))
            .list();
    }
}
```

## Many-to-One Query (with Syntax)

> Supported since 1.12.20+. `with` is a domain function that navigates to a related object and opens a query on it.

```java
eruptDao.lambdaQuery(Network.class)
    .isNull(Network::isDeleted)
    .with(Network::getTag).eq(Tag::name, "name")
    .with().orderBy(Network::getCreateTime)
    .list();
```

Related entity definition:

```java
@ManyToOne
@JoinColumn(
    foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT) // Non-foreign key association
)
private Tag tag;
```

## Dynamic Conditions: the `boolean condition` First-Parameter Overload

**Almost every condition method has an overload whose first parameter is a `boolean condition`.** When `condition` is `false` the condition is skipped entirely and the chain continues. This means you never need an `if` statement to build a dynamic query:

```java
// Traditional style: the chain has to be broken up
EruptLambdaQuery<EruptUser> query = eruptDao.lambdaQuery(EruptUser.class);
if (StringUtils.isNotBlank(name)) {
    query.like(EruptUser::getName, name);
}
if (null != status) {
    query.eq(EruptUser::getStatus, status);
}
List<EruptUser> list = query.list();

// Recommended: the condition overload keeps everything chained
List<EruptUser> list = eruptDao.lambdaQuery(EruptUser.class)
    .like(StringUtils.isNotBlank(name), EruptUser::getName, name)
    .eq(null != status, EruptUser::getStatus, status)
    .in(null != ids && !ids.isEmpty(), EruptUser::getId, ids)
    .orderByDesc(sortByTime, EruptUser::getCreateTime)
    .list();
```

> Note: `or(...)` and `addParam(...)` have no `condition` overload.

## Method Reference

Every method in the table below has at least two overloads: the plain one, and a dynamic one whose first parameter is a `boolean condition`.

### Query Condition Methods

| Signature | Description |
| --- | --- |
| `eq(SFunction field, Object val)`<br>`eq(boolean condition, SFunction field, Object val)` | Equals — `field = :val` |
| `ne(SFunction field, Object val)`<br>`ne(boolean condition, SFunction field, Object val)` | Not equals — `field <> :val` |
| `gt(SFunction field, Object val)`<br>`gt(boolean condition, SFunction field, Object val)` | Greater than |
| `ge(SFunction field, Object val)`<br>`ge(boolean condition, SFunction field, Object val)` | Greater than or equal |
| `lt(SFunction field, Object val)`<br>`lt(boolean condition, SFunction field, Object val)` | Less than |
| `le(SFunction field, Object val)`<br>`le(boolean condition, SFunction field, Object val)` | Less than or equal |
| `isNull(SFunction field)`<br>`isNull(boolean condition, SFunction field)` | `field is null` |
| `isNotNull(SFunction field)`<br>`isNotNull(boolean condition, SFunction field)` | `field is not null` |
| `between(SFunction field, Object val1, Object val2)`<br>`between(boolean condition, SFunction field, Object val1, Object val2)` | `field between :val1 and :val2` |
| `notBetween(SFunction field, Object val1, Object val2)`<br>`notBetween(boolean condition, SFunction field, Object val1, Object val2)` | `field not between :val1 and :val2` |
| `in(SFunction field, Collection<?> val)`<br>`in(SFunction field, Object... val)`<br>`in(boolean condition, SFunction field, Collection<?> val)`<br>`in(boolean condition, SFunction field, Object... val)` | `field in (...)` |
| `notIn(SFunction field, Collection<?> val)`<br>`notIn(SFunction field, Object... val)`<br>`notIn(boolean condition, SFunction field, Collection<?> val)`<br>`notIn(boolean condition, SFunction field, Object... val)` | `field not in (...)` |
| `like(SFunction field, Object val)`<br>`like(boolean condition, SFunction field, Object val)` | Contains match — **the framework wraps the value in `%` automatically**, so `"abc"` becomes `%abc%` |
| `likeValue(SFunction field, Object val)`<br>`likeValue(boolean condition, SFunction field, Object val)` | Like match — **the value is used verbatim, you supply the wildcards**, e.g. `"abc%"` for a prefix match |
| `or(Consumer<EruptLambdaQuery<T>> consumer)` | Joins the sub-query's conditions with `or`, wraps them in parentheses, and appends the group to the current WHERE clause |

`like` vs `likeValue`:

```java
// Contains match: generates name like '%erupt%'
.like(EruptUser::getName, "erupt")

// Prefix match: generates name like 'erupt%'
.likeValue(EruptUser::getName, "erupt%")
```

### Custom Conditions and Parameters

| Signature | Description |
| --- | --- |
| `addCondition(String expr, Map<String, Object> params)` | **Recommended.** Appends a custom JPQL condition; reference values from `params` with `:placeholder` in `expr`. Parameter-bound, injection-safe |
| `addCondition(boolean condition, String expr, Map<String, Object> params)` | Same, skipped when `condition` is `false` |
| `addCondition(String expr)` | Appends the string verbatim — **no parameter binding at all** |
| `addCondition(boolean condition, String expr)` | Same, skipped when `condition` is `false` |
| `addParam(String key, Object val)` | Only puts a value into the parameter map; adds no WHERE condition. Use it to fill placeholders declared in an earlier `addCondition(String)` |

### Domain Functions (Association Queries)

| Signature | Description |
| --- | --- |
| `with(SFunction field)` | Switches the scope of subsequent conditions/sorts to the associated object |
| `with()` | Clears the scope, returning to the root entity |

### Aggregate Function Methods

| Signature | Returns | Description |
| --- | --- | --- |
| `count()` | `Long` | `count(*)` |
| `count(SFunction field)` | `Long` | `count(field)` — rows where the field is null are not counted |
| `sum(SFunction field)` | `Object` | Sum |
| `avg(SFunction field)` | `Double` | Average |
| `min(SFunction field)` | `Object` | Minimum value |
| `max(SFunction field)` | `Object` | Maximum value |

> Aggregate methods generate SQL without an `order by` clause.

### Sorting, Pagination and Deduplication

| Signature | Description |
| --- | --- |
| `orderBy(SFunction field)` / `orderBy(boolean condition, SFunction field)` | Ascending sort |
| `orderByAsc(SFunction field)` / `orderByAsc(boolean condition, SFunction field)` | Ascending sort — a semantic alias for `orderBy` with identical behaviour |
| `orderByDesc(SFunction field)` / `orderByDesc(boolean condition, SFunction<T, ?> field)` | Descending sort |
| `limit(Integer limit)` | Maximum number of rows returned |
| `offset(Integer offset)` | Starting offset |
| `page(int limit, int offset)` | Paginated query returning `SimplePage<T>` (with `total` and `list`); the list query is skipped when `total` is 0 |
| `distinct()` | Deduplicate results |

::: warning When `distinct()` actually applies
`distinct()` is only emitted when a SELECT clause exists. It therefore has to be combined with `listSelect` / `oneSelect` / `selectByPath` or an aggregate method — a bare `.distinct().list()` produces no `distinct` keyword.
:::

### Fetching Results

| Signature | Returns | Description |
| --- | --- | --- |
| `list()` | `List<T>` | Returns a list of entities |
| `one()` | `T` | Returns a single entity, or `null` when there is no result; throws when more than one row matches |
| `listSelect(SFunction<T, S> field)` | `List<S>` | Selects one field and returns the list of its values |
| `oneSelect(SFunction<T, S> field)` | `S` | Selects one field and returns a single value, or `null` when there is no result |
| `listSelect(Class<R> requiredType, SFunction<T, ?>... fields)` | `List<R>` | Selects multiple fields and reflectively maps them onto `requiredType` instances |
| `oneSelect(Class<R> requiredType, SFunction<T, ?>... fields)` | `R` | Same but returns a single row, or `null` when there is no result |
| `selectByPath(Class<R> requiredType, String... fields)` | `List<R>` | Selects columns by **string property path**, supporting nested paths such as `dept.name` |
| `delete()` | `int` | Removes each matched row one by one and returns the count — **requires a transaction** |
| `deleteAndFlush()` | `int` | Runs `delete()` and then `flush()` immediately |

The single-field `oneSelect(SFunction)` is handy for fetching a scalar:

```java
// Fetch just the user name without loading the whole entity
String name = eruptDao.lambdaQuery(EruptUser.class)
    .eq(EruptUser::getAccount, "erupt")
    .oneSelect(EruptUser::getName);
```

::: warning `selectByPath` performs no object mapping
Unlike `listSelect(Class, SFunction...)`, the `requiredType` parameter of `selectByPath` is **only used for generic inference — no reflective assignment happens**. What you get back is the raw JPA result:

- With a **single** field path, the returned list holds that field's values (element type = field type).
- With **multiple** field paths, the returned list is really a `List<Object[]>`.

```java
// Single field: you get a list of String directly
List<String> names = eruptDao.lambdaQuery(EruptUser.class)
    .selectByPath(String.class, "name");

// Nested path + multiple fields: the elements are actually Object[]
List<Object[]> rows = eruptDao.lambdaQuery(EruptUser.class)
    .selectByPath(Object[].class, "name", "eruptOrg.name");
```
:::

## addCondition Syntax

`addCondition()` accepts raw JPQL (HQL) strings. The syntax follows the same rules as a JPQL WHERE clause:

- **Field names**: Use Java entity property names (camelCase), not database column names
- **Association properties**: Access with `.`, e.g., `dept.name = :deptName`
- **Placeholders**: Declared as `:name`, with values supplied via `params`

### Recommended: the parameterized form (injection-safe)

Whenever a condition contains external input (a search box, a request parameter, …), you **must** use the overload that takes `Map<String, Object> params` and bind the value as a parameter. Never concatenate it into the SQL string:

```java
Map<String, Object> params = new HashMap<>();
params.put("status", status);
params.put("start", startTime);

List<EruptUser> list = eruptDao.lambdaQuery(EruptUser.class)
    .addCondition("status = :status and createTime > :start", params)
    .list();
```

Combine it with the `condition` overload for dynamic parameterized conditions:

```java
List<EruptUser> list = eruptDao.lambdaQuery(EruptUser.class)
    .addCondition(null != keyword, "name like :kw or account like :kw",
                  Collections.singletonMap("kw", "%" + keyword + "%"))
    .list();
```

You can also keep the expression and its values apart, filling placeholders with `addParam`:

```java
List<EruptUser> list = eruptDao.lambdaQuery(EruptUser.class)
    .addCondition("createTime between :start and :end")
    .addParam("start", startTime)
    .addParam("end", endTime)
    .list();
```

### Not recommended: string concatenation

The parameterless `addCondition(String)` splices the string straight into the JPQL. **The moment external input is concatenated in, you have a SQL injection vulnerability.** Use it only for static conditions that are fully controlled by your code:

```java
// OK: fully static, no external input
.addCondition("whiteIp is null")
.addCondition("dept.id = 1")

// Forbidden: concatenating external input ❌
// .addCondition("name = '" + userInput + "'")

// Wrong: do not use database column names ❌
// .addCondition("white_ip is null")
// .addCondition("create_time > '2023-01-01'")
```

> Order of preference: type-safe chaining methods (`eq`, `like`, `between`, … — already parameterized internally) > `addCondition(expr, params)` > `addCondition(expr)`.
