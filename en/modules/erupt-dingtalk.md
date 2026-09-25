# Erupt DingTalk Notable Data Source <Badge type="tip" text="v2.3.0+" />

The erupt-data-dingtalk module provides a DingTalk Notable (钉钉多维表) data source. Bind an `@Erupt` model to a Notable sheet and Erupt manages records through the official DingTalk open-platform `/v1.0/notable` REST API — list / detail / add / edit / delete are all wired up. It fits teams that maintain business data in DingTalk Notable and want a permissioned, unified admin view in the Erupt console alongside their JPA / Mongo models.

Built on the JDK's built-in `HttpClient`, with no runtime dependency beyond `erupt-core`. Access tokens are acquired automatically, cached, and refreshed shortly before they expire.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-dingtalk</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## Credential Configuration

Credentials live only in Spring configuration (`erupt.dingtalk.*`) — never in annotations or source code. Create an enterprise-internal app on the [DingTalk Open Platform](https://open.dingtalk.com), obtain its Client ID / Client Secret (older consoles call them AppKey / AppSecret), and grant the app the Notable permissions (`Notable.Data.Read` / `Notable.Data.Write` or equivalent):

```yaml
erupt:
  dingtalk:
    client-id: dingxxxxxxxx
    client-secret: xxx
    # union id of the user API calls act on behalf of (required by Notable)
    operator-id: xxxxxxxx
    # For a proxy, override:
    # base-url: https://api.dingtalk.com
```

| Key | Default | Description |
| --- | --- | --- |
| `erupt.dingtalk.client-id` | — | Enterprise-internal app Client ID (AppKey), used to obtain an access token |
| `erupt.dingtalk.client-secret` | — | Enterprise-internal app Client Secret (AppSecret) |
| `erupt.dingtalk.operator-id` | — | Union id of the user Notable calls are made on behalf of; required on every request. Can be overridden per model on the annotation |
| `erupt.dingtalk.base-url` | `https://api.dingtalk.com` | Open-platform base URL; override for a proxy |

The operator (`operator-id`) must have access to the target base.

## The @EruptDingTalk Annotation

| Attribute | Default | Description |
| --- | --- | --- |
| `baseId` | — | Notable base identifier (`baseId`), visible in the document URL |
| `sheet` | — | Sheet identifier within the base, or its display name |
| `operatorId` | `erupt.dingtalk.operator-id` | Per-model override of the operator union id; empty falls back to the global setting |

## Usage Example

```java
@Getter
@Setter
@Erupt(name = "Product Backlog", primaryKeyCol = "recordId")
@EruptDingTalk(baseId = "abc123", sheet = "Backlog")
@EruptDataProcessor(EruptDingTalkDataService.DATA_PROCESSOR)
public class BacklogItem {

    @EruptField(views = @View(title = "Record ID"))
    private String recordId;

    @EruptField(
        views = @View(title = "Title"),
        edit = @Edit(title = "Title", notNull = true, search = @Search(vague = true))
    )
    private String title;

    @EruptField(
        views = @View(title = "Priority"),
        edit = @Edit(title = "Priority")
    )
    private String priority;

    @EruptField(
        views = @View(title = "Due"),
        edit = @Edit(title = "Due", type = EditType.DATE)
    )
    private Date due;
}
```

Field names on the model must match Notable column names exactly (case-sensitive, as displayed in DingTalk).

## Supported Operations

- **List**: `POST .../sheets/{sheet}/records/list`, cursor-paged fetch of the whole sheet, then filtered / sorted / paged in memory (LOCAL mode). 100 records per page, with an overall cap of 5000 records.
- **Add**: `POST .../records` with `{ records: [{ fields }] }`; the `recordId` is assigned by DingTalk.
- **Edit**: `PUT .../records` with `{ records: [{ id, fields }] }`.
- **Delete**: `POST .../records/delete` with `{ recordIds }`.

:::warning Note
- The primary key field maps to the Notable record `id` and is populated by DingTalk on add — leave it empty in the form.
- Every Notable call requires an operator union id; set it globally or on the model annotation, otherwise the request is refused.
- LOCAL query mode fetches the full sheet on each list; suited to config / dictionary scale data (hundreds to low thousands of rows), not to million-row sheets.
- DingTalk column types (select, multi-select, person, attachment) come back as their raw JSON structures; model them as `String` / `List<String>` and post-process in a `DataProxy` if you need typed access.
:::
