# Erupt HTTP 接口数据源

erupt-data-http 模块提供 REST 接口数据源支持。将 `@Erupt` 模型绑定到一个 JSON HTTP 端点，Erupt 直接驱动其列表 / 新增 / 修改 / 删除，客户端无需任何 DAO 或 Spring 代理。

使用 JDK 内置的 `HttpClient`，除 `erupt-core` 外无额外运行时依赖。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-http</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 端点约定

```
GET    {value}         → [ {...}, ... ]   或   { "total": n, "list": [ ... ] }
GET    {value}/{id}    → { ... }
POST   {value}         新增
PUT    {value}/{id}    修改
DELETE {value}/{id}    删除
```

## @EruptHttp 注解

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `value` | — | 资源基础 URL |
| `headers` | `{}` | 额外请求头，格式 `"Name: Value"` |
| `queryMode` | `LOCAL` | `LOCAL` 拉取全量后本地筛选；`REMOTE` 分页下推到端点 |
| `timeout` | `10` | 请求超时秒数 |

### queryMode 查询模式

- **`LOCAL`** —— 一次 `GET` 拉取全量列表，然后在内存中筛选 / 排序 / 分页。适用于不具备查询能力的端点。
- **`REMOTE`** —— 将 `pageIndex`、`pageSize`、`sort` 及等值条件作为查询参数附加到请求。端点须返回 `{ "total": n, "list": [...] }`（返回纯数组也可接受，`total` = 数组长度）。

## 使用示例

```java
@Getter
@Setter
@Erupt(name = "GitHub 用户", primaryKeyCol = "id")
@EruptHttp(
    value = "https://api.github.com/users",
    headers = { "Accept: application/vnd.github+json", "Authorization: Bearer ghp_xxx" },
    queryMode = EruptHttp.QueryMode.LOCAL,
    timeout = 15
)
@EruptDataProcessor(EruptHttpDataService.DATA_PROCESSOR)
public class GhUser {

    @EruptField(views = @View(title = "ID"))
    private Long id;

    @EruptField(
        views = @View(title = "登录名"),
        edit = @Edit(title = "登录名", search = @Search)
    )
    private String login;

    @EruptField(views = @View(title = "类型"))
    private String type;

    @EruptField(views = @View(title = "头像"))
    private String avatar_url;
}
```

## 操作支持

端点实现上述约定即可获得完整 CRUD。若服务只读，可在子类中覆盖 `addData` / `editData` / `deleteData` 抛出友好错误，或直接通过 `@Erupt(power = ...)` 关闭对应权限。
