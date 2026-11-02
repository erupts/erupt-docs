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
PUT    {value}/{id}    修改（editMethod = PATCH 时为 PATCH）
DELETE {value}/{id}    删除
```

端点与约定不一致——另一种响应信封、另一套分页参数名、按用户签发的令牌——都不需要改端点：信封与分页由注解属性描述，其余交给一个[适配器](#适配器钩子-erupthttpadapter)类。

## @EruptHttp 注解

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `value` | — | 资源基础 URL，支持[模板表达式](#请求模板与表达式) |
| `headers` | `{}` | 额外请求头，格式 `"Name: Value"`，值支持模板表达式 |
| `queryMode` | `LOCAL` | `LOCAL` 拉取全量后本地筛选；`REMOTE` 分页下推到端点 |
| `paging` | `PAGE_SIZE` | `REMOTE` 模式的分页参数名：`PAGE_SIZE`（`pageIndex` / `pageSize`）、`PAGE_PER_PAGE`（`page` / `per_page`）、`OFFSET_LIMIT`（`offset` / `limit`） |
| `listPath` | `""` | 列表响应中记录数组的点号路径，如 `data.items`；为空接受纯数组或 `list` 属性 |
| `totalPath` | `""` | 列表响应中总数的点号路径，如 `meta.count`；为空读 `total`，没有则取数组长度 |
| `itemPath` | `""` | 单对象响应中记录的点号路径，如 `data`；为空取整个响应体 |
| `editMethod` | `PUT` | 修改使用的 HTTP 方法：`PUT` 或 `PATCH` |
| `adapter` | `EruptHttpAdapter.class` | 适配器类，处理属性表达不了的差异；默认值表示不使用适配器 |
| `timeout` | `10` | 请求超时秒数 |

### queryMode 查询模式

- **`LOCAL`** —— 一次 `GET` 拉取全量列表，然后在内存中筛选 / 排序 / 分页。适用于不具备查询能力的端点。
- **`REMOTE`** —— 将 `paging` 指定的分页参数、`sort`（形如 `field asc, field2 desc`）及等值条件作为查询参数附加到请求，响应按 `listPath` / `totalPath` 读取。

## 请求模板与表达式

`value` 与每个请求头的值都是模板，在**每次请求时**解析，因此令牌、租户等会变化的内容不必写成编译期常量：

| 语法 | 解析为 |
| --- | --- |
| `${github.token}` | Spring 配置属性，密钥留在配置文件或环境变量中 |
| `#{user.tenantId}` | SpEL 表达式，根对象里的 `user` 是当前会话的 `MetaUser`（`uid`、`account`、`name`、`tenantId`），请求上下文之外为 `null` |
| `#{@oauth.accessToken()}` | SpEL 调用任意 Spring Bean，例如一个带缓存、会自动刷新的 OAuth 令牌服务 |

```java
@EruptHttp(
    value = "https://api.example.com/tenants/#{user.tenantId}/orders",
    headers = {
        "Authorization: Bearer #{@oauth.accessToken()}",
        "X-Api-Key: ${example.api-key}"
    }
)
```

:::tip
- 不含占位符的字符串原样通过；`${}` 在 `#{}` 之前解析，所以 `#{}` 里可以引用已替换的属性值。
- SpEL 表达式按模板文本缓存，只解析一次，之后每次请求只重新求值。
- `user` 可能为 `null`（定时任务等无会话场景），用安全导航写法 `#{user?.tenantId ?: ''}` 可避免报错。
:::

## 分页与响应信封

### 分页参数

`REMOTE` 模式下，`paging` 决定页码与页大小以什么名字写入查询串：

| `paging` | 写入的参数 | 适用 |
| --- | --- | --- |
| `PAGE_SIZE` | `pageIndex=1&pageSize=20`（页码从 1 开始） | Erupt 自身约定 |
| `PAGE_PER_PAGE` | `page=1&per_page=20` | GitHub、GitLab 及多数 REST API |
| `OFFSET_LIMIT` | `offset=0&limit=20`（`offset = (pageIndex - 1) * pageSize`） | 偏移量分页的 API |

页码之外还会附加 `sort=field asc, field2 desc` 与等值条件 `key=value`。其他分页方式（游标、`Link` 头）在适配器的 `query()` / `total()` 钩子中处理。

### 响应信封

`listPath` / `totalPath` / `itemPath` 用点号路径从响应中取出记录，路径上任一段缺失即视为没有。对如下响应：

```json
{
  "code": 0,
  "data": {
    "items": [ { "id": 1 }, { "id": 2 } ],
    "meta": { "count": 42 }
  }
}
```

```java
@EruptHttp(
    value = "https://api.example.com/users",
    queryMode = EruptHttp.QueryMode.REMOTE,
    listPath = "data.items",
    totalPath = "data.meta.count",
    itemPath = "data"
)
```

路径为空时的默认行为：

- **列表**：响应体是纯数组，或含 `list` 数组的对象；
- **总数**：读 `total`，没有则取当前页数组长度；
- **单条**：整个响应体即记录。

记录数组找不到，或响应不是 JSON，会抛出「响应格式不符合预期」。

### 错误信息

HTTP 状态码不在 2xx 区间即视为失败。错误信息包含状态码、请求方法与 URL，若响应体是 JSON 对象，还会附上其中第一个 `message` / `msg` / `error` / `error_description` 字段的值，让后台用户直接看到远端给出的原因：

```
请求失败 → 401 GET https://api.github.com/users → Bad credentials
```

端点的错误信封不在上述字段之列时，覆盖适配器的 `error()` 钩子。

## 适配器钩子 EruptHttpAdapter

模板与信封属性表达不了的差异，实现 `EruptHttpAdapter` 接口，再用 `adapter = MyAdapter.class` 绑定到模型。接口的每个方法都有默认实现，只覆盖端点与约定不同的那一步。带 `@Component` 的适配器从 Spring 容器取，可以注入服务、缓存令牌；否则按类反射实例化一次并复用。

钩子按一次请求经过的顺序排列：

| 钩子 | 默认行为 | 适合覆盖的场景 |
| --- | --- | --- |
| `url(url, model)` | 原样返回 | 改写路径、加租户前缀、切换主机 |
| `request(builder, model)` | 不做处理 | HMAC 签名、按用户从 `MetaContext` 取令牌 |
| `query(params, page, conditions, model)` | 等值条件写成 `key=value` | `name_like`、`filter=` 表达式、游标参数 |
| `body(object, method, model)` | `gson.toJson(object)` | 包一层 `{ "data": {...} }`、POST 时去掉 id、改字段名 |
| `list(response, model)` | 按 `listPath` 读取 | 非 JSON 或不规则的列表结构 |
| `total(response, model)` | 按 `totalPath` 读取，没有返回 `null` | 总数在 `X-Total-Count` 等响应头中 |
| `item(response, model)` | 按 `itemPath` 读取并转成模型类 | 不规则的单对象结构 |
| `error(response, method, url)` | 状态码 + 响应体中的 `message` / `msg` / `error` | 端点自有的错误信封 |

`url` 与 `request` 拿到的是模板已解析后的最终字符串。`params` 传入 `query()` 时已含分页参数、`sort` 与等值条件，可以增删改；值之后统一做 URL 编码。

```java
@Component
public class GithubAdapter implements EruptHttpAdapter {

    // GitHub 通过 Link 头翻页：还有下一页就报一个「再多一页」的总数
    @Override
    public Long total(HttpResponse<String> response, EruptModel model) {
        boolean hasNext = response.headers().firstValue("link")
                .filter(link -> link.contains("rel=\"next\"")).isPresent();
        return hasNext ? (long) Page.PAGE_MAX_DATA : null;
    }

    // 把模糊查询翻译成 GitHub 的 q 参数
    @Override
    public void query(Map<String, String> params, Page page, List<Condition> conditions, EruptModel model) {
        conditions.stream()
                .filter(c -> QueryExpression.LIKE == c.getExpression())
                .forEach(c -> params.put("q", c.getValue() + " in:" + c.getKey()));
    }
}
```

## 使用示例

```java
@Getter
@Setter
@Erupt(name = "GitHub 用户", primaryKeyCol = "id")
@EruptHttp(
    value = "https://api.github.com/users",
    headers = { "Accept: application/vnd.github+json", "Authorization: Bearer ${github.token}" },
    queryMode = EruptHttp.QueryMode.REMOTE,
    paging = EruptHttp.Paging.PAGE_PER_PAGE,
    adapter = GithubAdapter.class
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

```yaml
github:
  token: ${GITHUB_TOKEN}
```

## 操作支持

端点实现上述约定即可获得完整 CRUD。若服务只读，可在子类中覆盖 `addData` / `editData` / `deleteData` 抛出友好错误，或直接通过 `@Erupt(power = ...)` 关闭对应权限。

## 能力边界与限制

:::warning REMOTE 模式默认只转发等值条件
`REMOTE` 模式拼 URL 时，默认适配器**只处理 `EQ`（等值）条件**，其余表达式——`LIKE` 模糊查询、`RANGE` 区间、`IN` / `NOT_IN`、`GT` / `LT` 等大小比较、`NULL` / `NOT_NULL` 判空——会被**静默丢弃**：既不下推给端点，也不在本地补做过滤。用户在搜索栏输入模糊关键字后看到的是未经该条件过滤的结果，且没有任何提示。

需要这些条件时，在适配器的 `query()` 中把它们翻译成端点认识的参数（见上方 `GithubAdapter`）；否则 `REMOTE` 模式下只对确定会被端点识别的字段声明 `@Search`。需要模糊搜索、区间筛选而端点又不支持的模型请改用 `LOCAL` 模式（拉全量后由基础引擎在内存中完整求值所有条件）。
:::

:::warning 导出 / 下拉 / 钻取拿到的是未过滤的全量数据
Excel 导出、下拉选项、OLAP 取数走的是 `queryColumn`，其底层的 `data()` **永远是一次无参 `GET {value}`**，与 `queryMode` 无关，也不携带任何筛选条件或分页参数。这意味着：

- 无论列表页当前筛选到几条，导出得到的都是端点返回的全量数据；
- 端点若不自带分页上限，一次导出就会把全量结果拉进 JVM。

只读大数据量端点建议用 `@Erupt(power = @Power(export = false))` 关闭导出。
:::

:::warning 其他行为差异
- **`REMOTE` 模式下响应里没有总数时，`total` = 当前页条数**，而不是数据总量，分页器的总页数会因此不准。要正确分页请让端点返回总数并用 `totalPath` 指向它，或在适配器 `total()` 中从响应头读取。
- **记录数组必须能通过 `listPath` 找到**（路径为空时为纯数组或 `list` 属性），否则抛出解析异常。
- **HTTP 状态码不在 2xx 区间即视为失败**，抛出 `EruptWebApiRuntimeException`，信息中带状态码、请求方法与远端错误信息。
:::
