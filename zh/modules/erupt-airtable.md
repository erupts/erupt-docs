# Erupt Airtable 数据源 <Badge type="tip" text="v2.3.0+" />

erupt-data-airtable 模块提供 Airtable 数据源支持。将 `@Erupt` 模型绑定到一张 Airtable 表，Erupt 通过 Airtable Web API（`/v0/{baseId}/{table}`）直接管理记录——列表 / 详情 / 新增 / 修改 / 删除全部打通。适用于业务数据维护在 Airtable 中、又希望在 Erupt 后台与 JPA / Mongo 模型并列获得带权限控制的统一管理视图的团队。

使用 JDK 内置的 `HttpClient`，除 `erupt-core` 外无额外运行时依赖。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-airtable</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 凭证配置

令牌只存在于 Spring 配置中（`erupt.airtable.*`），不会出现在注解或源码里。在 [airtable.com/create/tokens](https://airtable.com/create/tokens) 创建个人访问令牌（Personal Access Token），勾选 `data.records:read` 与 `data.records:write` 权限范围，并授予对目标 Base 的访问：

```yaml
erupt:
  airtable:
    token: patXXXXXXXX.XXXXXXXX
    # 代理场景可覆盖：
    # base-url: https://api.airtable.com
```

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `erupt.airtable.token` | — | 个人访问令牌（或 OAuth 访问令牌），需具备 `data.records:read` / `data.records:write` 范围 |
| `erupt.airtable.base-url` | `https://api.airtable.com` | REST 地址，代理时覆盖 |

## @EruptAirtable 注解

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `baseId` | — | Base 标识，如 `appXXXXXXXXXXXXXX` |
| `table` | — | 表标识（`tblXXXXXXXXXXXXXX`）或其显示名称 |

两个值均可在 Airtable 网页端的表 URL 中直接看到。

## 使用示例

```java
@Getter
@Setter
@Erupt(name = "需求池", primaryKeyCol = "recordId")
@EruptAirtable(baseId = "appABCDEFGHIJKLMN", table = "Backlog")
@EruptDataProcessor(EruptAirtableDataService.DATA_PROCESSOR)
public class BacklogItem {

    @EruptField(views = @View(title = "记录 ID"))
    private String recordId;

    @EruptField(
        views = @View(title = "标题"),
        edit = @Edit(title = "标题", notNull = true, search = @Search(vague = true))
    )
    private String title;

    @EruptField(
        views = @View(title = "优先级"),
        edit = @Edit(title = "优先级")
    )
    private String priority;

    @EruptField(
        views = @View(title = "截止时间"),
        edit = @Edit(title = "截止时间", type = EditType.DATE)
    )
    private Date due;
}
```

模型字段名须与 Airtable 表中的列名完全一致（区分大小写，以 Airtable 中显示的名称为准）。

## 操作支持

- **列表**：`GET /v0/{baseId}/{table}?pageSize=100`，按 offset 分页拉取全表后在内存中筛选 / 排序 / 分页（LOCAL 模式），总量上限 5000 条。
- **新增**：`POST /v0/{baseId}/{table}`，`recordId` 由 Airtable 生成。
- **修改**：`PATCH /v0/{baseId}/{table}/{recordId}`，仅更新提交的字段。
- **删除**：`DELETE /v0/{baseId}/{table}/{recordId}`。

写入请求带 `typecast: true`，因此单选 / 日期 / 关联记录等字段可以直接接受普通字符串。

:::warning 注意
- 主键字段映射到 Airtable 记录的 `id`（`recXXXX`），新增时由 Airtable 填充——表单中留空即可。
- Airtable 对每个 Base 限流每秒 5 次请求；LOCAL 模式每 100 行发起一次请求。
- LOCAL 查询模式每次拉取全表，适合配置 / 字典规模的数据（数百到数千行），不适合大表。
- 附件与协作者字段扁平化为其 `url` / `name`，关联记录返回 `recXXXX` id 列表。建议在模型中声明为 `String` / `List<String>`，需要类型化访问时通过 `DataProxy` 后处理。
:::
