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
PUT    {value}/{id}    update (PATCH when editMethod = PATCH)
DELETE {value}/{id}    delete
```

Anything that differs from this — another response envelope, other paging parameter names, per-user tokens — needs no change on the endpoint: the envelope and paging are described by annotation attributes, and everything else goes into one [adapter](#adapter-hooks-erupthttpadapter) class.

## The @EruptHttp Annotation

| Attribute | Default | Description |
| --- | --- | --- |
| `value` | — | Base URL of the resource; a [template](#request-templates-and-expressions) |
| `headers` | `{}` | Extra request headers, in the form `"Name: Value"`; values are templates |
| `queryMode` | `LOCAL` | `LOCAL` fetches the full list and filters locally; `REMOTE` pushes paging down to the endpoint |
| `paging` | `PAGE_SIZE` | Parameter names used in `REMOTE` mode: `PAGE_SIZE` (`pageIndex` / `pageSize`), `PAGE_PER_PAGE` (`page` / `per_page`), `OFFSET_LIMIT` (`offset` / `limit`) |
| `listPath` | `""` | Dotted path to the record array in a list response, e.g. `data.items`; empty accepts a plain array or a `list` property |
| `totalPath` | `""` | Dotted path to the total count in a list response, e.g. `meta.count`; empty reads `total`, falling back to the array size |
| `itemPath` | `""` | Dotted path to the record in a single-object response, e.g. `data`; empty takes the whole body |
| `editMethod` | `PUT` | HTTP method used for edit: `PUT` or `PATCH` |
| `adapter` | `EruptHttpAdapter.class` | Adapter class for whatever the attributes cannot express; the default means no adapter |
| `timeout` | `10` | Request timeout in seconds |

### queryMode

- **`LOCAL`** — a single `GET` fetches the full list, then filtering / sorting / pagination happen in memory. Suited to endpoints with no query capability.
- **`REMOTE`** — the paging pair chosen by `paging`, `sort` (as `field asc, field2 desc`) and equality conditions are appended as query parameters; the response is read through `listPath` / `totalPath`.

## Request Templates and Expressions

`value` and every header value are templates resolved on **each request**, so tokens, tenant ids and anything else that changes between calls never has to be a compile-time constant:

| Syntax | Resolves to |
| --- | --- |
| `${github.token}` | A Spring property — keep secrets in configuration or environment variables |
| `#{user.tenantId}` | SpEL; `user` on the root object is the current session's `MetaUser` (`uid`, `account`, `name`, `tenantId`), `null` outside a request |
| `#{@oauth.accessToken()}` | SpEL calling any Spring bean, e.g. a cached, self-refreshing OAuth token service |

```java
@EruptHttp(
    value = "https://api.example.com/tenants/#{user.tenantId}/orders",
    headers = {
        "Authorization: Bearer #{@oauth.accessToken()}",
        "X-Api-Key: ${example.api-key}"
    }
)
```

:::tip
- Strings without a placeholder pass through untouched; `${}` is resolved before `#{}`, so an expression may use an already substituted property value.
- SpEL expressions are parsed once per template text and cached; only the evaluation runs on each request.
- `user` can be `null` (scheduled jobs and other session-less contexts); the safe-navigation form `#{user?.tenantId ?: ''}` avoids an error there.
:::

## Paging and Response Envelope

### Paging parameters

In `REMOTE` mode, `paging` decides under which names the page index and size are written to the query string:

| `paging` | Parameters written | Typical for |
| --- | --- | --- |
| `PAGE_SIZE` | `pageIndex=1&pageSize=20` (1-based) | Erupt's own convention |
| `PAGE_PER_PAGE` | `page=1&per_page=20` | GitHub, GitLab and most REST APIs |
| `OFFSET_LIMIT` | `offset=0&limit=20` (`offset = (pageIndex - 1) * pageSize`) | Offset-based APIs |

Besides the page, `sort=field asc, field2 desc` and equality conditions as `key=value` are appended. Other schemes (cursors, `Link` headers) are handled in the adapter's `query()` / `total()` hooks.

### Response envelope

`listPath` / `totalPath` / `itemPath` pull records out of the response by dotted path; a missing segment anywhere on the path counts as absent. For a response like

```json
{
  "code": 0,
  "data": {
    "items": [ { "id": 1 }, { "id": 2 } ],
    "meta": { "count": 42 }
  }
}
```

```java
@EruptHttp(
    value = "https://api.example.com/users",
    queryMode = EruptHttp.QueryMode.REMOTE,
    listPath = "data.items",
    totalPath = "data.meta.count",
    itemPath = "data"
)
```

With the paths left empty:

- **list**: the body is a plain array, or an object with a `list` array;
- **total**: `total` is read, otherwise the size of the current page's array is used;
- **item**: the whole body is the record.

If the record array cannot be found, or the body is not JSON, an "unexpected response" error is raised.

### Error messages

Any HTTP status outside 2xx is a failure. The message carries the status, request method and URL, and — when the body is a JSON object — the value of the first `message` / `msg` / `error` / `error_description` field, so the admin user sees the reason the remote service gave:

```
Request failed → 401 GET https://api.github.com/users → Bad credentials
```

If the endpoint's error envelope uses other field names, override the adapter's `error()` hook.

## Adapter Hooks: EruptHttpAdapter

For differences the templates and envelope attributes cannot express, implement `EruptHttpAdapter` and bind it with `adapter = MyAdapter.class`. Every method has a default, so override only the step your endpoint does differently. An adapter annotated `@Component` is taken from the Spring context and can inject services or cache tokens; any other class is instantiated once by reflection and reused.

The hooks, in the order a request goes through them:

| Hook | Default | Override for |
| --- | --- | --- |
| `url(url, model)` | unchanged | path rewriting, tenant prefixes, host switching |
| `request(builder, model)` | nothing | HMAC signatures, per-user tokens from `MetaContext` |
| `query(params, page, conditions, model)` | equality conditions as `key=value` | `name_like`, `filter=` expressions, cursor tokens |
| `body(object, method, model)` | `gson.toJson(object)` | `{ "data": {...} }` wrapping, dropping the id on POST, renaming fields |
| `list(response, model)` | reads `listPath` | non-JSON or irregular list shapes |
| `total(response, model)` | reads `totalPath`, `null` if absent | counts in headers such as `X-Total-Count` |
| `item(response, model)` | reads `itemPath` into the model class | irregular single-object shapes |
| `error(response, method, url)` | status + `message` / `msg` / `error` from the body | your API's own error envelope |

`url` and `request` see the final strings, with templates already resolved. `params` arrives in `query()` already holding the paging pair, `sort` and the equality conditions; amend or replace them freely, values are URL-encoded afterwards.

```java
@Component
public class GithubAdapter implements EruptHttpAdapter {

    // GitHub paginates through the Link header: report "one more page" while it has a next link
    @Override
    public Long total(HttpResponse<String> response, EruptModel model) {
        boolean hasNext = response.headers().firstValue("link")
                .filter(link -> link.contains("rel=\"next\"")).isPresent();
        return hasNext ? (long) Page.PAGE_MAX_DATA : null;
    }

    // Translate fuzzy searches into GitHub's q parameter
    @Override
    public void query(Map<String, String> params, Page page, List<Condition> conditions, EruptModel model) {
        conditions.stream()
                .filter(c -> QueryExpression.LIKE == c.getExpression())
                .forEach(c -> params.put("q", c.getValue() + " in:" + c.getKey()));
    }
}
```

## Usage Example

```java
@Getter
@Setter
@Erupt(name = "GitHub Users", primaryKeyCol = "id")
@EruptHttp(
    value = "https://api.github.com/users",
    headers = { "Accept: application/vnd.github+json", "Authorization: Bearer ${github.token}" },
    queryMode = EruptHttp.QueryMode.REMOTE,
    paging = EruptHttp.Paging.PAGE_PER_PAGE,
    adapter = GithubAdapter.class
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

```yaml
github:
  token: ${GITHUB_TOKEN}
```

## Supported Operations

Any endpoint that implements the convention above gets full CRUD. If the service is read-only, override `addData` / `editData` / `deleteData` in a subclass to throw a friendly error, or simply disable the corresponding permissions via `@Erupt(power = ...)`.

## Limits and Boundaries

:::warning REMOTE mode forwards equality conditions only, by default
When building the URL, the default adapter in `REMOTE` mode handles **`EQ` (equality) conditions only**. Every other expression — `LIKE` fuzzy search, `RANGE`, `IN` / `NOT_IN`, `GT` / `LT` comparisons, `NULL` / `NOT_NULL` — is **silently dropped**: it is neither pushed down to the endpoint nor re-applied locally. A user who types a fuzzy keyword into the search bar gets results that ignore that condition entirely, with no warning.

When you need those conditions, translate them into parameters the endpoint understands in the adapter's `query()` (see `GithubAdapter` above); otherwise declare `@Search` in `REMOTE` mode only on fields the endpoint is known to handle. Models that need fuzzy search or range filtering against an endpoint without them should use `LOCAL` mode, where the base engine fetches everything and evaluates all conditions in memory.
:::

:::warning Export / dropdown / drill-down receive the full, unfiltered data set
Excel export, dropdown options and OLAP fetches go through `queryColumn`, whose underlying `data()` is **always a plain, parameterless `GET {value}`** — regardless of `queryMode`, and carrying no filter or pagination parameters at all. That means:

- no matter how the list page is filtered, an export returns everything the endpoint hands back;
- if the endpoint has no built-in cap, a single export pulls the whole result set into the JVM.

For read-only endpoints backed by large data sets, turn export off with `@Erupt(power = @Power(export = false))`.
:::

:::warning Other behavioral notes
- **In `REMOTE` mode, when the response carries no total, `total` is the size of the current page** — not the overall row count — so the paginator's page count will be wrong. Have the endpoint return a total and point `totalPath` at it, or read it from a header in the adapter's `total()`.
- **The record array must be reachable through `listPath`** (a plain array or a `list` property when the path is empty), otherwise a parse error is raised.
- **Any HTTP status outside 2xx is treated as a failure**, raising an `EruptWebApiRuntimeException` whose message includes the status code, request method and the remote error message.
:::
