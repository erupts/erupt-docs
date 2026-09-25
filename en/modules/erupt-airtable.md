# Erupt Airtable Data Source <Badge type="tip" text="v2.3.0+" />

The erupt-data-airtable module provides an Airtable data source. Bind an `@Erupt` model to an Airtable table and Erupt manages records through the Airtable Web API (`/v0/{baseId}/{table}`) — list / detail / add / edit / delete are all wired up. It fits teams that maintain business data in Airtable and want a permissioned, unified admin view in the Erupt console alongside their JPA / Mongo models.

Built on the JDK's built-in `HttpClient`, with no runtime dependency beyond `erupt-core`.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-airtable</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## Credential Configuration

The token lives only in Spring configuration (`erupt.airtable.*`) — never in annotations or source code. Create a personal access token at [airtable.com/create/tokens](https://airtable.com/create/tokens) with the `data.records:read` and `data.records:write` scopes and access to the bound bases:

```yaml
erupt:
  airtable:
    token: patXXXXXXXX.XXXXXXXX
    # For a proxy, override:
    # base-url: https://api.airtable.com
```

| Key | Default | Description |
| --- | --- | --- |
| `erupt.airtable.token` | — | Personal access token (or OAuth access token) with the `data.records:read` / `data.records:write` scopes |
| `erupt.airtable.base-url` | `https://api.airtable.com` | REST base URL; override for a proxy |

## The @EruptAirtable Annotation

| Attribute | Default | Description |
| --- | --- | --- |
| `baseId` | — | Base identifier, e.g. `appXXXXXXXXXXXXXX` |
| `table` | — | Table identifier (`tblXXXXXXXXXXXXXX`) or its display name |

Both values are visible in the table URL in the Airtable web client.

## Usage Example

```java
@Getter
@Setter
@Erupt(name = "Product Backlog", primaryKeyCol = "recordId")
@EruptAirtable(baseId = "appABCDEFGHIJKLMN", table = "Backlog")
@EruptDataProcessor(EruptAirtableDataService.DATA_PROCESSOR)
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

Field names on the model must match Airtable column names exactly (case-sensitive, as displayed in Airtable).

## Supported Operations

- **List**: `GET /v0/{baseId}/{table}?pageSize=100`, offset-paged fetch of the whole table, then filtered / sorted / paged in memory (LOCAL mode), with an overall cap of 5000 records.
- **Add**: `POST /v0/{baseId}/{table}`; the `recordId` is assigned by Airtable.
- **Edit**: `PATCH /v0/{baseId}/{table}/{recordId}` — only the sent fields change.
- **Delete**: `DELETE /v0/{baseId}/{table}/{recordId}`.

Writes are sent with `typecast: true`, so a plain string is accepted by select / date / linked-record fields.

:::warning Note
- The primary key field maps to the Airtable record `id` (`recXXXX`) and is populated by Airtable on add — leave it empty in the form.
- Airtable rate-limits to 5 requests per second per base; LOCAL mode issues one request per 100 rows.
- LOCAL query mode fetches the full table on each list; suited to config / dictionary scale data (hundreds to low thousands of rows), not to large tables.
- Attachments and collaborators flatten to their `url` / `name`; linked records come back as a list of `recXXXX` ids. Model them as `String` / `List<String>` and post-process in a `DataProxy` if you need typed access.
:::
