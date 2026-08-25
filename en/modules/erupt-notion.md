# Erupt Notion Data Source

The erupt-data-notion module provides a Notion database data source. Bind an `@Erupt` model to a Notion database and Erupt manages pages through the Notion REST API — list / add / edit / delete (soft delete via archive). It fits teams that use Notion databases for CRM entries, docs indexes, editorial calendars, or configuration data, and want a permissioned, unified admin view in the Erupt console.

Built on the JDK's built-in `HttpClient`, with no runtime dependency beyond `erupt-core`. Notion's typed properties are flattened to plain scalars on read; on write they are re-wrapped by type, driven by the database schema (fetched once and cached).

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-notion</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## Credential Configuration

The integration token lives only in Spring configuration (`erupt.notion.*`) — never in annotations or source code. Create an internal integration at [notion.so/my-integrations](https://www.notion.so/my-integrations) to obtain the token, then share each target database with that integration:

```yaml
erupt:
  notion:
    token: secret_xxxxxxxxxxxxx
    version: "2022-06-28"               # default; override to pin a different API version
    # base-url: https://api.notion.com  # override for a proxy
```

| Key | Default | Description |
| --- | --- | --- |
| `erupt.notion.token` | — | Internal integration token (`secret_...`), sent as a Bearer token |
| `erupt.notion.version` | `2022-06-28` | Notion API version, sent in the `Notion-Version` header |
| `erupt.notion.base-url` | `https://api.notion.com` | API base URL; override for a proxy |

## The @EruptNotion Annotation

| Attribute | Default | Description |
| --- | --- | --- |
| `databaseId` | — | Notion database id (32-char id, with or without dashes) |

The database id is the segment of the database URL after your workspace slug.

## Usage Example

```java
@Getter
@Setter
@Erupt(name = "Content Calendar", primaryKeyCol = "pageId")
@EruptNotion(databaseId = "abcdef0123456789abcdef0123456789")
@EruptDataProcessor(EruptNotionDataService.DATA_PROCESSOR)
public class ContentEntry {

    @EruptField(views = @View(title = "Page ID"))
    private String pageId;

    @EruptField(
        views = @View(title = "Title"),
        edit = @Edit(title = "Title", notNull = true, search = @Search(vague = true))
    )
    private String title;

    @EruptField(
        views = @View(title = "Status"),
        edit = @Edit(title = "Status")
    )
    private String status;

    @EruptField(
        views = @View(title = "Author"),
        edit = @Edit(title = "Author")
    )
    private String author;

    @EruptField(
        views = @View(title = "Publish On"),
        edit = @Edit(title = "Publish On", type = EditType.DATE)
    )
    private Date publishOn;
}
```

Field names on the model must match Notion property names exactly (case-sensitive, as displayed in the database view).

## Supported Operations

- **List**: `POST /v1/databases/{databaseId}/query`, cursor-paged fetch of the whole database, then filtered / sorted / paged in memory (LOCAL mode), with an overall cap of 5000 pages.
- **Add**: `POST /v1/pages`; the page `id` is assigned by Notion.
- **Edit**: `PATCH /v1/pages/{pageId}`.
- **Delete**: `PATCH /v1/pages/{pageId}` with `archived: true` — Notion's API has no hard delete.

Writable property types: `title`, `rich_text`, `number`, `select`, `status`, `multi_select`, `checkbox`, `date`, `url`, `email`, `phone_number`. Computed / relational properties (`relation`, `people`, `files`, `created_time`, etc.) are read-only.

:::warning Note
- The primary key field maps to the Notion page `id` and is populated by Notion on add — leave it empty in the form.
- Delete is a soft delete (archive). Archived pages disappear from list results but remain in Notion; unarchive from the Notion UI if needed.
- LOCAL query mode fetches the whole database on each list; suited to config / editorial scale data (hundreds to low thousands of pages), not to huge databases.
- Model Notion property types (select, multi-select, relation, person, files) as `String` / `List<String>` and post-process in a `DataProxy` if you need typed access.
:::
