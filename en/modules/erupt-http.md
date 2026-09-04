# Erupt HTTP API Data Source

The erupt-data-http module provides a REST API data source. Bind an `@Erupt` model to a JSON HTTP endpoint and Erupt drives its list / add / edit / delete directly — the client needs no DAO or Spring proxy at all.

It uses the JDK's built-in `HttpClient`, so there are no runtime dependencies beyond `erupt-core`.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-http</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## Endpoint Convention

```
GET    {value}         → [ {...}, ... ]   or   { "total": n, "list": [ ... ] }
GET    {value}/{id}    → { ... }
POST   {value}         create
PUT    {value}/{id}    update
DELETE {value}/{id}    delete
```

## The @EruptHttp Annotation

| Attribute | Default | Description |
| --- | --- | --- |
| `value` | — | Base URL of the resource |
| `headers` | `{}` | Extra request headers, in the form `"Name: Value"` |
| `queryMode` | `LOCAL` | `LOCAL` fetches the full list and filters locally; `REMOTE` pushes pagination down to the endpoint |
| `timeout` | `10` | Request timeout in seconds |

### queryMode

- **`LOCAL`** — a single `GET` fetches the full list, then filtering / sorting / pagination happen in memory. Suited to endpoints with no query capability.
- **`REMOTE`** — `pageIndex`, `pageSize`, `sort`, and equality conditions are appended to the request as query parameters. The endpoint must return `{ "total": n, "list": [...] }` (a plain array is also accepted, with `total` = array length).

## Usage Example

```java
@Getter
@Setter
@Erupt(name = "GitHub Users", primaryKeyCol = "id")
@EruptHttp(
    value = "https://api.github.com/users",
    headers = { "Accept: application/vnd.github+json", "Authorization: Bearer ghp_xxx" },
    queryMode = EruptHttp.QueryMode.LOCAL,
    timeout = 15
)
@EruptDataProcessor(EruptHttpDataService.DATA_PROCESSOR)
public class GhUser {

    @EruptField(views = @View(title = "ID"))
    private Long id;

    @EruptField(
        views = @View(title = "Login"),
        edit = @Edit(title = "Login", search = @Search)
    )
    private String login;

    @EruptField(views = @View(title = "Type"))
    private String type;

    @EruptField(views = @View(title = "Avatar"))
    private String avatar_url;
}
```

## Supported Operations

Any endpoint that implements the convention above gets full CRUD. If the service is read-only, override `addData` / `editData` / `deleteData` in a subclass to throw a friendly error, or simply disable the corresponding permissions via `@Erupt(power = ...)`.

## Limits and Boundaries

:::warning REMOTE mode only forwards equality conditions
When building the URL, `REMOTE` mode handles **`EQ` (equality) conditions only**. Every other expression — `LIKE` fuzzy search, `RANGE`, `IN` / `NOT_IN`, `GT` / `LT` comparisons, `NULL` / `NOT_NULL` — is **silently dropped**: it is neither pushed down to the endpoint nor re-applied locally. A user who types a fuzzy keyword into the search bar gets results that ignore that condition entirely, with no warning.

So in `REMOTE` mode, declare `@Search` only on fields you know the endpoint understands. Models that need fuzzy search or range filtering should use `LOCAL` mode, where the base engine fetches everything and evaluates all conditions in memory.
:::

:::warning Export / dropdown / drill-down receive the full, unfiltered data set
Excel export, dropdown options and OLAP fetches go through `queryColumn`, whose underlying `data()` is **always a plain, parameterless `GET {value}`** — regardless of `queryMode`, and carrying no filter or pagination parameters at all. That means:

- no matter how the list page is filtered, an export returns everything the endpoint hands back;
- if the endpoint has no built-in cap, a single export pulls the whole result set into the JVM.

For read-only endpoints backed by large data sets, turn export off with `@Erupt(power = @Power(export = false))`.
:::

:::warning Other behavioral notes
- **In `REMOTE` mode, when the endpoint returns a bare array, `total` is set to that array's length** — i.e. the size of the current page, not the overall row count — so the paginator's total page count will be wrong. Return `{ "total": n, "list": [...] }` for correct pagination.
- **The response must be an array, or an object containing a `list` array**, otherwise a parse error is raised. The field names `total` and `list` are fixed and not currently configurable.
- **Any HTTP status outside 2xx is treated as a failure**, raising an `EruptWebApiRuntimeException` that includes the status code and request method.
:::
