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
@Erupt(name = "GitHub 用户", primaryKeyCol = "id")
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
        views = @View(title = "登录名"),
        edit = @Edit(title = "登录名", search = @Search)
    )
    private String login;

    @EruptField(views = @View(title = "类型"))
    private String type;

    @EruptField(views = @View(title = "头像"))
    private String avatar_url;
}
```

## Supported Operations

Any endpoint that implements the convention above gets full CRUD. If the service is read-only, override `addData` / `editData` / `deleteData` in a subclass to throw a friendly error, or simply disable the corresponding permissions via `@Erupt(power = ...)`.
