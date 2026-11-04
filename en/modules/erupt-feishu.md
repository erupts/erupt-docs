# Erupt Feishu Bitable Data Source

The erupt-data-feishu module provides a Feishu Bitable (多维表格) data source. Bind an `@Erupt` model to a Bitable table and Erupt manages records through the official Feishu open-platform REST API — list / detail / add / edit / delete are all wired up. It fits teams that maintain business data in Feishu Bitable and want a permissioned, unified admin view in the Erupt console.

Built on the JDK's built-in `HttpClient`, with no runtime dependency beyond `erupt-core`. The `tenant_access_token` is acquired automatically, cached, and refreshed shortly before it expires.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-feishu</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## Credential Configuration

Credentials live only in Spring configuration (`erupt.feishu.*`) — never in annotations or source code. Create a custom app on the [Feishu Open Platform](https://open.feishu.cn), obtain its `app_id` / `app_secret`, and grant the app the Bitable permissions:

```yaml
erupt:
  feishu:
    app-id: cli_xxx
    app-secret: xxx
    # For Lark (international) or a proxy, override:
    # base-url: https://open.larksuite.com
```

| Key | Default | Description |
| --- | --- | --- |
| `erupt.feishu.app-id` | — | Custom-app `app_id`, used to obtain a `tenant_access_token` |
| `erupt.feishu.app-secret` | — | Custom-app `app_secret` |
| `erupt.feishu.base-url` | `https://open.feishu.cn` | Open-platform base URL; override for Lark (international) or a proxy |

## The @EruptFeishu Annotation

| Attribute | Default | Description |
| --- | --- | --- |
| `baseToken` | — | Bitable base identifier (`app_token`), e.g. `bascnXXXXXXXX` |
| `tableId` | — | Table identifier within the base, e.g. `tblXXXXXXXX` |

Both values are visible in the URL / share link of the Bitable in the Feishu web client.

## Usage Example

```java
@Getter
@Setter
@Erupt(name = "Product Backlog", primaryKeyCol = "recordId")
@EruptFeishu(baseToken = "bascnABCDEFG", tableId = "tblHIJKLMN")
@EruptDataProcessor(EruptFeishuDataService.DATA_PROCESSOR)
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
        views = @View(title = "Owner"),
        edit = @Edit(title = "Owner")
    )
    private String owner;

    @EruptField(
        views = @View(title = "Due"),
        edit = @Edit(title = "Due", type = EditType.DATE)
    )
    private Date due;
}
```

Field names on the model must match Bitable column names exactly (case-sensitive, as displayed in Feishu).

## Supported Operations

- **List**: cursor-paged fetch of the whole table, then filtered / sorted / paged in memory (LOCAL mode). Up to 500 records per page, with an overall cap of 5000 records.
- **Add**: `POST .../records`; the `record_id` is assigned by Feishu.
- **Edit**: `PUT .../records/{recordId}`.
- **Delete**: `DELETE .../records/{recordId}`.

Field values are flattened automatically: numbers / booleans map directly, multi-select comes back as a list, and rich text / person / link values (structures carrying `text` / `name` / `link`) are joined into a string.

:::warning Note
- The primary key field maps to Bitable's `record_id` and is populated by Feishu on add — leave it empty in the form.
- LOCAL query mode fetches the full table on each list; suited to config / dictionary scale data (hundreds to low thousands of rows), not to million-row Bitables.
- Feishu column types (select, multi-select, person, attachment) come back as their raw JSON structures; model them as `String` / `List<String>` and post-process in a `DataProxy` if you need typed access.
:::
