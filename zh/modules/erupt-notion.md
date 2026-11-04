# Erupt Notion 数据源

erupt-data-notion 模块提供 Notion 数据库（Database）数据源支持。将 `@Erupt` 模型绑定到一个 Notion 数据库，Erupt 通过 Notion REST API 直接管理页面——列表 / 新增 / 修改 / 删除（归档式软删除）。适用于用 Notion 数据库维护 CRM 条目、文档索引、内容排期或配置数据，又希望在 Erupt 后台获得带权限控制的统一管理视图的团队。

使用 JDK 内置的 `HttpClient`，除 `erupt-core` 外无额外运行时依赖。读取时 Notion 的类型化属性自动扁平化为普通标量；写入时根据数据库 Schema（获取一次后缓存）自动按类型重新包装。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-notion</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 凭证配置

集成令牌只存在于 Spring 配置中（`erupt.notion.*`），不会出现在注解或源码里。在 [notion.so/my-integrations](https://www.notion.so/my-integrations) 创建内部集成（Internal Integration）获取令牌，然后将每个目标数据库共享给该集成：

```yaml
erupt:
  notion:
    token: secret_xxxxxxxxxxxxx
    version: "2022-06-28"               # 默认值；可覆盖以固定其他 API 版本
    # base-url: https://api.notion.com  # 代理场景可覆盖
```

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `erupt.notion.token` | — | 内部集成令牌（`secret_...`），以 Bearer Token 发送 |
| `erupt.notion.version` | `2022-06-28` | Notion API 版本，通过 `Notion-Version` 请求头发送 |
| `erupt.notion.base-url` | `https://api.notion.com` | API 地址，代理时覆盖 |

## @EruptNotion 注解

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `databaseId` | — | Notion 数据库 ID（32 位字符，带不带连字符均可） |

数据库 ID 即数据库 URL 中工作区标识之后的那段字符。

## 使用示例

```java
@Getter
@Setter
@Erupt(name = "内容排期", primaryKeyCol = "pageId")
@EruptNotion(databaseId = "abcdef0123456789abcdef0123456789")
@EruptDataProcessor(EruptNotionDataService.DATA_PROCESSOR)
public class ContentEntry {

    @EruptField(views = @View(title = "页面 ID"))
    private String pageId;

    @EruptField(
        views = @View(title = "标题"),
        edit = @Edit(title = "标题", notNull = true, search = @Search(vague = true))
    )
    private String title;

    @EruptField(
        views = @View(title = "状态"),
        edit = @Edit(title = "状态")
    )
    private String status;

    @EruptField(
        views = @View(title = "作者"),
        edit = @Edit(title = "作者")
    )
    private String author;

    @EruptField(
        views = @View(title = "发布日期"),
        edit = @Edit(title = "发布日期", type = EditType.DATE)
    )
    private Date publishOn;
}
```

模型字段名须与 Notion 属性名完全一致（区分大小写，以数据库视图中显示的名称为准）。

## 操作支持

- **列表**：`POST /v1/databases/{databaseId}/query`，游标分页拉取全库后在内存中筛选 / 排序 / 分页（LOCAL 模式），总量上限 5000 条。
- **新增**：`POST /v1/pages`，页面 `id` 由 Notion 生成。
- **修改**：`PATCH /v1/pages/{pageId}`。
- **删除**：`PATCH /v1/pages/{pageId}` 并设置 `archived: true`——Notion API 不支持物理删除。

可写属性类型：`title`、`rich_text`、`number`、`select`、`status`、`multi_select`、`checkbox`、`date`、`url`、`email`、`phone_number`；计算类 / 关联类属性（`relation`、`people`、`files`、`created_time` 等）只读。

:::warning 注意
- 主键字段映射到 Notion 页面 `id`，新增时由 Notion 填充——表单中留空即可。
- 删除为软删除（归档）。归档页面会从列表中消失，但仍保留在 Notion 中，可在 Notion 端取消归档恢复。
- LOCAL 查询模式每次拉取全库，适合配置 / 内容排期规模的数据（数百到数千页），不适合超大数据库。
- Notion 属性类型（单选、多选、关联、人员、文件）建议在模型中声明为 `String` / `List<String>`，需要类型化访问时通过 `DataProxy` 后处理。
:::
