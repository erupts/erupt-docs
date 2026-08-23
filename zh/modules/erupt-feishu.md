# Erupt 飞书多维表格数据源

erupt-data-feishu 模块提供飞书多维表格（Bitable）数据源支持。将 `@Erupt` 模型绑定到一张多维表格，Erupt 通过飞书开放平台官方 REST API 直接管理记录——列表 / 详情 / 新增 / 修改 / 删除全部打通。适用于业务数据维护在飞书多维表格中、又希望在 Erupt 后台获得带权限控制的统一管理视图的团队。

使用 JDK 内置的 `HttpClient`，除 `erupt-core` 外无额外运行时依赖。`tenant_access_token` 自动获取并缓存，过期前自动刷新。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-feishu</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 凭证配置

凭证只存在于 Spring 配置中（`erupt.feishu.*`），不会出现在注解或源码里。需在[飞书开放平台](https://open.feishu.cn)创建自建应用，获取 `app_id` / `app_secret`，并为应用开通多维表格相关权限：

```yaml
erupt:
  feishu:
    app-id: cli_xxx
    app-secret: xxx
    # Lark（国际版）或代理场景可覆盖：
    # base-url: https://open.larksuite.com
```

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `erupt.feishu.app-id` | — | 自建应用 `app_id`，用于获取 `tenant_access_token` |
| `erupt.feishu.app-secret` | — | 自建应用 `app_secret` |
| `erupt.feishu.base-url` | `https://open.feishu.cn` | 开放平台地址，Lark 国际版或代理时覆盖 |

## @EruptFeishu 注解

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `baseToken` | — | 多维表格 Base 标识（`app_token`），如 `bascnXXXXXXXX` |
| `tableId` | — | Base 内的数据表标识，如 `tblXXXXXXXX` |

两个值均可在飞书网页端多维表格的 URL / 分享链接中直接看到。

## 使用示例

```java
@Getter
@Setter
@Erupt(name = "需求池", primaryKeyCol = "recordId")
@EruptFeishu(baseToken = "bascnABCDEFG", tableId = "tblHIJKLMN")
@EruptDataProcessor(EruptFeishuDataService.DATA_PROCESSOR)
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
        views = @View(title = "负责人"),
        edit = @Edit(title = "负责人")
    )
    private String owner;

    @EruptField(
        views = @View(title = "截止时间"),
        edit = @Edit(title = "截止时间", type = EditType.DATE)
    )
    private Date due;
}
```

模型字段名须与多维表格中的列名完全一致（区分大小写，以飞书中显示的名称为准）。

## 操作支持

- **列表**：游标分页拉取全表后在内存中筛选 / 排序 / 分页（LOCAL 模式），单页最多 500 条，总量上限 5000 条。
- **新增**：`POST .../records`，`record_id` 由飞书生成。
- **修改**：`PUT .../records/{recordId}`。
- **删除**：`DELETE .../records/{recordId}`。

字段值自动扁平化：数字 / 布尔等基础类型直接映射，多选返回列表，富文本 / 人员 / 链接（含 `text` / `name` / `link` 结构）拼接为字符串。

:::warning 注意
- 主键字段映射到多维表格的 `record_id`，新增时由飞书填充——表单中留空即可。
- LOCAL 查询模式每次拉取全表，适合配置 / 字典规模的数据（数百到数千行），不适合百万行级的多维表格。
- 飞书列类型（单选、多选、人员、附件）以原始 JSON 结构返回，建议在模型中声明为 `String` / `List<String>`，需要类型化访问时通过 `DataProxy` 后处理。
:::
