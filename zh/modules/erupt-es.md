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

## 能力边界与限制

:::warning 数量上限与深翻页
- **导出 / 下拉 / OLAP 取数最多 10000 条。** 这些场景走 `queryColumn`，底层的 `data()` 固定设置 `setMaxResults(10000)`（源码常量 `MAX_FETCH_SIZE = 10000`）。超出部分会被**静默截断**，没有任何提示。需要全量导出请改用 ES 自身的 `scroll` / `search_after` 或专用导出链路。
- **列表分页用的是 `from + size`。** `queryList` 直接把 `pageIndex` / `pageSize` 交给 `PageRequest`，因此翻到 `from + size` 超过索引 `index.max_result_window`（ES 默认 10000）的页码时，ES 会直接报错而不是返回空页。深翻页场景请通过筛选条件收窄结果集，或调大该索引设置（会增加协调节点内存开销）。
- **条件已下推，基础引擎不再二次过滤。** `EruptEsDataService` 覆写了 `conditionsPushedDown()` 返回 `true`，所有筛选完全依赖 ES 的查询语义。这意味着 `LIKE` 走的是 ES 的 `contains`（受分析器影响），与 JPA 数据源下的 SQL `like` 行为并不完全一致。
:::
