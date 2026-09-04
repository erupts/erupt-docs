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

## 能力边界与限制

:::warning REMOTE 模式只转发等值条件
`REMOTE` 模式拼 URL 时**只处理 `EQ`（等值）条件**，其余表达式——`LIKE` 模糊查询、`RANGE` 区间、`IN` / `NOT_IN`、`GT` / `LT` 等大小比较、`NULL` / `NOT_NULL` 判空——会被**静默丢弃**：既不下推给端点，也不在本地补做过滤。用户在搜索栏输入模糊关键字后看到的是未经该条件过滤的结果，且没有任何提示。

因此，`REMOTE` 模式下建议只对确定会被端点识别的字段声明 `@Search`；需要模糊搜索、区间筛选的模型请改用 `LOCAL` 模式（拉全量后由基础引擎在内存中完整求值所有条件）。
:::

:::warning 导出 / 下拉 / 钻取拿到的是未过滤的全量数据
Excel 导出、下拉选项、OLAP 取数走的是 `queryColumn`，其底层的 `data()` **永远是一次无参 `GET {value}`**，与 `queryMode` 无关，也不携带任何筛选条件或分页参数。这意味着：

- 无论列表页当前筛选到几条，导出得到的都是端点返回的全量数据；
- 端点若不自带分页上限，一次导出就会把全量结果拉进 JVM。

只读大数据量端点建议用 `@Erupt(power = @Power(export = false))` 关闭导出。
:::

:::warning 其他行为差异
- **`REMOTE` 模式下端点返回纯数组时，`total` = 该数组长度**，即当前页条数，而不是数据总量，分页器的总页数会因此不准。要正确分页请让端点返回 `{ "total": n, "list": [...] }`。
- **响应格式必须是数组或含 `list` 数组的对象**，否则抛出解析异常；分页字段名固定为 `total` 与 `list`，暂不可配置。
- **HTTP 状态码不在 2xx 区间即视为失败**，抛出 `EruptWebApiRuntimeException` 并带上状态码与请求方法。
:::
