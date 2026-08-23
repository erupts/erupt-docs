# Erupt Elasticsearch 数据源

erupt-data-es 模块基于 Spring Data Elasticsearch 提供 ES 数据源支持。将 `@Erupt` 模型绑定到 ES 索引后，筛选、排序、分页均下推到 `_search` 执行，钻取与条件串解析由基础引擎处理。

`spring-boot-starter-data-elasticsearch` 会被自动传递引入。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-es</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 配置

使用标准 Spring Boot 配置项：

```yaml
spring:
  elasticsearch:
    uris: http://localhost:9200
    username: elastic
    password: changeme
```

## 使用示例

模型通过 Spring Data 原生的 `@Document(indexName = ...)` 注解绑定索引：

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

## 操作支持

完整 CRUD：列表 / 详情 / 新增 / 修改 / 删除。新增与修改均走 Spring Data 的 `save`，即基于文档 `_id` 的 upsert。

:::warning 注意
- **需要精确筛选或排序的字符串列请使用 `FieldType.Keyword`（或 multi-field）**，`FieldType.Text` 会被分词，等值查询无法命中。
- 文档 `_id` 映射到模型的 `@Id` 字段（或名为 `id` 的字段），请显式声明。
- 写操作后服务会主动执行索引 `refresh`，保证管理页面重新查询立即可见；生产环境热点索引如需关闭此行为，可继承服务类自行调整。
:::
