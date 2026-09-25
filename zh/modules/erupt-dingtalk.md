# Erupt 钉钉多维表数据源 <Badge type="tip" text="v2.3.0+" />

erupt-data-dingtalk 模块提供钉钉多维表（Notable）数据源支持。将 `@Erupt` 模型绑定到多维表中的一张数据表，Erupt 通过钉钉开放平台官方 `/v1.0/notable` REST API 直接管理记录——列表 / 详情 / 新增 / 修改 / 删除全部打通。适用于业务数据维护在钉钉多维表中、又希望在 Erupt 后台与 JPA / Mongo 模型并列获得带权限控制的统一管理视图的团队。

使用 JDK 内置的 `HttpClient`，除 `erupt-core` 外无额外运行时依赖。访问令牌自动获取并缓存，过期前自动刷新。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-dingtalk</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 凭证配置

凭证只存在于 Spring 配置中（`erupt.dingtalk.*`），不会出现在注解或源码里。需在[钉钉开放平台](https://open.dingtalk.com)创建企业内部应用，获取 Client ID / Client Secret（旧版控制台显示为 AppKey / AppSecret），并为应用开通多维表相关权限（`Notable.Data.Read` / `Notable.Data.Write` 或同等权限）：

```yaml
erupt:
  dingtalk:
    client-id: dingxxxxxxxx
    client-secret: xxx
    # 所有接口调用所代表的用户 unionId（多维表接口必填）
    operator-id: xxxxxxxx
    # 代理场景可覆盖：
    # base-url: https://api.dingtalk.com
```

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `erupt.dingtalk.client-id` | — | 企业内部应用 Client ID（AppKey），用于获取访问令牌 |
| `erupt.dingtalk.client-secret` | — | 企业内部应用 Client Secret（AppSecret） |
| `erupt.dingtalk.operator-id` | — | 接口调用所代表的操作人 unionId，多维表每次请求都需要；可在注解上按模型覆盖 |
| `erupt.dingtalk.base-url` | `https://api.dingtalk.com` | 开放平台地址，代理时覆盖 |

操作人（`operator-id`）必须对目标多维表拥有访问权限。

## @EruptDingTalk 注解

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `baseId` | — | 多维表 Base 标识（`baseId`），可在文档 URL 中直接看到 |
| `sheet` | — | Base 内的数据表标识或其显示名称 |
| `operatorId` | `erupt.dingtalk.operator-id` | 按模型覆盖操作人 unionId，为空时回退到全局配置 |

## 使用示例

```java
@Getter
@Setter
@Erupt(name = "需求池", primaryKeyCol = "recordId")
@EruptDingTalk(baseId = "abc123", sheet = "需求池")
@EruptDataProcessor(EruptDingTalkDataService.DATA_PROCESSOR)
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

模型字段名须与多维表中的列名完全一致（区分大小写，以钉钉中显示的名称为准）。

## 操作支持

- **列表**：`POST .../sheets/{sheet}/records/list`，游标分页拉取全表后在内存中筛选 / 排序 / 分页（LOCAL 模式），单页 100 条，总量上限 5000 条。
- **新增**：`POST .../records`，请求体为 `{ records: [{ fields }] }`，`recordId` 由钉钉生成。
- **修改**：`PUT .../records`，请求体为 `{ records: [{ id, fields }] }`。
- **删除**：`POST .../records/delete`，请求体为 `{ recordIds }`。

:::warning 注意
- 主键字段映射到多维表记录的 `id`，新增时由钉钉填充——表单中留空即可。
- 每次多维表调用都需要操作人 unionId，请在全局配置或模型注解中至少设置一处，否则请求会被拒绝。
- LOCAL 查询模式每次拉取全表，适合配置 / 字典规模的数据（数百到数千行），不适合百万行级的多维表。
- 钉钉列类型（单选、多选、人员、附件）以原始 JSON 结构返回，建议在模型中声明为 `String` / `List<String>`，需要类型化访问时通过 `DataProxy` 后处理。
:::
