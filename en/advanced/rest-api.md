# API Auth & Operation Logs

> Applies to **version 1.12.x and above**

## API Example

```java
@RestController
@RequestMapping(EruptRestPath.ERUPT_API + "/test") // resolves to /erupt-api/test
public class TestController {

    // Accessible when logged in
    @GetMapping("/api-a")
    @EruptLoginAuth
    public void api() {
        // TODO
    }

    // Accessible with the corresponding permission
    @GetMapping("/api-b")
    @EruptMenuAuth("xxx") // Matches the menu type value
    @EruptRecordOperate("Callable with menu permission") // Record operation log (optional)
    public void api2() {
        // TODO
    }

    @GetMapping("/api-x") // Public endpoint, no authentication required
    public void api3(String param) {
        // TODO
    }
}
```

> Operation log recording is only supported for endpoints whose root path starts with `/erupt-api`.

## API Requests

When calling endpoints annotated with `@EruptLoginAuth` or `@EruptMenuAuth`, the frontend must pass a token in the request header.

### How to Get the Token

```javascript
// Method 1: If using the tpl module, retrieve the token via the following JS snippet.
// Note: the token is only available after a successful login.
parent.getAppToken().token

// Method 2: Retrieve dynamically from a URL parameter
var token = new URLSearchParams(location.search).get("_token")
```

### Request Examples

Import the tpl module and call network requests from template files. The token must not be obtained cross-origin — it must be retrieved from within the application.

```javascript
axios.get("http://127.0.0.1/erupt-api/test/api-b", {
    headers: {
        token: parent.getAppToken().token
    }
}).then((res) => {
    console.log(res)
})
```

```javascript
$.ajax({
    type: "GET",
    url: "http://127.0.0.1/erupt-api/test/api-a",
    headers: {
        token: parent.getAppToken().token
    },
    success: function(result) {
        console.log(result);
    }
});
```

## Frontend-Backend Separation

If your frontend and backend are deployed separately, enable `redisSession`:

```yaml
erupt:
  redisSession: true
spring:
  data:
    redis:
      database: 0
      timeout: 10000
      host: 127.0.0.1
```

> Spring Boot 3 removed the `spring.redis.*` prefix — you must use `spring.data.redis.*`.

> **Note:** If testing with Postman and Redis Session is not enabled, you must pass both the token and the cookie.

## OpenAPI Specification <Badge type="tip" text="v2.4.0+" />

[`openapi/erupt.json`](https://github.com/erupts/erupt/blob/develop/openapi/erupt.json) in the repository is an **OpenAPI 3.1** specification of every `/erupt-api` endpoint in the core, upms, tpl and excel modules: every endpoint the admin UI calls, usable by any client. Import it into Swagger UI, Postman, Apifox or a code generator.

- **Authentication**: two `apiKey` security schemes, the `token` header and the `_token` query parameter for pages the browser opens directly (template pages, editor uploads). The token comes from `POST /erupt-api/login`; server-to-server callers use `GET /erupt-api/open-api/create-token`
- **The `erupt` header**: data, build, component, file and export endpoints are scoped to one `@Erupt` class. The `erupt` header carries its simple class name and must match the `{erupt}` path segment, or name the parent erupt when the path addresses a nested erupt (tab, sub-form, reference)
- **Errors**: business errors come back as HTTP 500 with an `R` body; `success` is false, `message` holds the text to show and `promptWay` tells the UI how to show it
- **Groups**: the tags are grouped into Account (session and user, MFA, Open API token, permission and app settings), Data (page build, data query, data modify, tab rows, form view, page scope), Widgets and files (form components, files, import and export), Views (board, calendar, gantt) and Platform (template pages, developer tools, framework)

The spec is generated from the controllers' Javadoc with [smart-doc](https://github.com/TongchengOpenSource/smart-doc), not written by hand. After changing a controller, regenerate it from the repository root:

```bash
mvn -pl erupt-test -Popenapi process-classes
```

### New Endpoints Worth Knowing for API Users

| Endpoint | Description |
| --- | --- |
| `POST /erupt-api/data/aggregate/{erupt}` | Column statistics: totals of the columns that declare `@View(statistic)`. Same body as the table query, aggregated over every row the query matches, not only the current page (v2.4.0+) |
| `POST /erupt-api/data/modify/{erupt}/update-cells` | Batch edit: set one field of several rows to the same value, body `{"ids": [...], "field": "status", "value": ...}`. Every row runs the full edit pipeline and the whole batch rolls back when any row is rejected; needs `@Power(batchEdit)` (v2.4.0+) |
| `GET /erupt-api/excel/formats` | The export formats on offer (`format` code and display name); built in are `xlsx`, `csv`, `json`, `jsonl` and `md` (v2.4.0+) |
| `POST /erupt-api/excel/export/{erupt}?format=csv` | Pick the export format with the `format` query parameter; Excel when absent. `ids` exports only the given primary keys |

The cell edit endpoint `POST /erupt-api/data/modify/{erupt}/update-cell` is described under [@Power cellEdit](/en/annotation/power#celledit-in-table-cell-editing), and the header scope endpoints `GET/POST /erupt-api/scope` under [@EruptScope](/en/annotation/erupt-scope#api).
