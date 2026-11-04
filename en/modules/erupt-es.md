# Erupt Elasticsearch Data Source

The erupt-data-es module provides an Elasticsearch data source built on Spring Data Elasticsearch. Once an `@Erupt` model is bound to an ES index, filtering, sorting, and pagination are all pushed down to `_search`, while drill and condition-string parsing are handled by the base engine.

`spring-boot-starter-data-elasticsearch` is pulled in transitively.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-es</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## Configuration

Use the standard Spring Boot configuration keys:

```yaml
spring:
  elasticsearch:
    uris: http://localhost:9200
    username: elastic
    password: changeme
```

## Usage Example

The model binds to an index via Spring Data's native `@Document(indexName = ...)` annotation:

```java
@Getter
@Setter
@Document(indexName = "product")
@Erupt(name = "Product", primaryKeyCol = "id")
@EruptDataProcessor(EruptEsDataService.DATA_PROCESSOR)
public class Product {

    @Id
    @EruptField(views = @View(title = "ID"))
    private String id;

    @Field(type = FieldType.Keyword)
    @EruptField(
        views = @View(title = "SKU"),
        edit = @Edit(title = "SKU", notNull = true, search = @Search)
    )
    private String sku;

    @Field(type = FieldType.Text, fielddata = true)
    @EruptField(
        views = @View(title = "Name"),
        edit = @Edit(title = "Name", search = @Search(vague = true))
    )
    private String name;

    @Field(type = FieldType.Double)
    @EruptField(views = @View(title = "Price"), edit = @Edit(title = "Price"))
    private Double price;

    @Field(type = FieldType.Date)
    @EruptField(views = @View(title = "Created At"))
    private Date createdAt;
}
```

## Supported Operations

Full CRUD: list / detail / add / edit / delete. Both add and edit go through Spring Data's `save`, i.e. an upsert keyed by the document `_id`.

:::warning Note
- **Use `FieldType.Keyword` (or a multi-field) for string columns that need exact filtering or sorting** — `FieldType.Text` gets analyzed, so equality queries won't match.
- The document `_id` maps to the model's `@Id` field (or a field named `id`); declare it explicitly.
- After write operations the service proactively issues an index `refresh`, so the admin page sees the change immediately on re-query. If you need to disable this for hot indices in production, extend the service class and adjust it yourself.
:::

## Limits and Boundaries

:::warning Fetch caps and deep paging
- **Export / dropdown / OLAP fetches are capped at 10,000 documents.** Those paths go through `queryColumn`, whose underlying `data()` always calls `setMaxResults(10000)` (the source constant is `MAX_FETCH_SIZE = 10000`). Anything beyond that is **silently truncated**, with no warning. For a genuine full export, use ES's own `scroll` / `search_after` or a dedicated export pipeline.
- **List pagination uses `from + size`.** `queryList` hands `pageIndex` / `pageSize` straight to `PageRequest`, so once `from + size` exceeds the index's `index.max_result_window` (10,000 by default in ES), Elasticsearch returns an error rather than an empty page. Narrow the result set with filters, or raise that index setting (at the cost of coordinating-node memory).
- **Conditions are pushed down, so the base engine does not re-filter.** `EruptEsDataService` overrides `conditionsPushedDown()` to return `true`, meaning all filtering relies on ES query semantics. In particular, `LIKE` maps to ES `contains` (analyzer-dependent), which does not behave identically to SQL `like` on a JPA data source.
:::
