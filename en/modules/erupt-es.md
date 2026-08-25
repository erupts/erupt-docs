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
@Erupt(name = "商品", primaryKeyCol = "id")
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
        views = @View(title = "名称"),
        edit = @Edit(title = "名称", search = @Search(vague = true))
    )
    private String name;

    @Field(type = FieldType.Double)
    @EruptField(views = @View(title = "价格"), edit = @Edit(title = "价格"))
    private Double price;

    @Field(type = FieldType.Date)
    @EruptField(views = @View(title = "创建时间"))
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
