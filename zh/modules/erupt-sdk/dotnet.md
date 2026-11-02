# C# / .NET SDK

.NET SDK 让 .NET 服务以 erupt-cloud 节点的身份，把用 C# 特性（Attribute）声明的模型变成 erupt 管理页面：模型与数据留在节点上，erupt 服务端负责渲染界面、登录与菜单权限。节点既可以用自带的 Kestrel 独立运行，也可以挂载进已有的 ASP.NET Core 应用。

> 多语言 SDK 总览见 [Erupt SDK](/zh/modules/erupt-sdk/)，节点协议与服务端见 [Cloud Server](/zh/modules/cloud-server)。

## 环境要求

| 语言版本 | 运行时依赖 | 包名 | 版本 |
| --- | --- | --- | --- |
| .NET 8+（库面向 `net8.0`，可运行在更新的运行时上） | 仅 ASP.NET Core 共享框架，无 NuGet 运行时依赖 | `Erupt.Sdk`（NuGet） | 0.1.0 |

服务端需为 erupt **2.4.0+**。使用 `DbRepository` 时另需对应数据库的 ADO.NET 驱动（如 `Microsoft.Data.Sqlite`、`Npgsql`、`MySqlConnector`）。

## 安装

```bash
dotnet add package Erupt.Sdk
dotnet add package Microsoft.Data.Sqlite      # 快速开始使用 SQLite
```

不使用 nuget.org 时，把 `dotnet/src/Erupt.Sdk/`（`.csproj`、源码与项目内嵌的 `Resources/`）复制进解决方案并引用：

```bash
dotnet add reference third_party/Erupt.Sdk/Erupt.Sdk.csproj
```

或执行 `dotnet pack dotnet/src/Erupt.Sdk -o ./packages`，把 `./packages` 加为本地包源。

:::warning 复制源码的升级方式
复制的代码不会自动更新。erupt 修改协议或注解 Schema 后，请用新版本整体替换该目录，不要手工合并，也不要改动 `EruptNode.Version`，服务端依靠它显示节点运行的版本。
:::

## 快速开始

示例博客（`dotnet/examples/Blog`）的精简版，一个 `Program.cs`：

```csharp
using Erupt;
using Microsoft.Data.Sqlite;

static string? Env(string name) => Environment.GetEnvironmentVariable(name);

var node = new EruptNode(new NodeOptions
{
    Name = Env("ERUPT_NODE_NAME") ?? "blog",
    AccessToken = Env("ERUPT_ACCESS_TOKEN") ?? throw new InvalidOperationException("set ERUPT_ACCESS_TOKEN"),
    Servers = [Env("ERUPT_SERVER") ?? "http://localhost:8080"],
});

SqliteConnection Connect() => new($"Data Source={Env("ERUPT_DB") ?? "blog.db"}");
node.Register<Category>(new DbRepository(Connect, "category") { AutoCreateSqlite = true });   // 先注册被引用的模型
node.Register<Article>(new DbRepository(Connect, "article") { AutoCreateSqlite = true });

await node.RunAsync(int.Parse(Env("PORT") ?? "9090"));   // Ctrl+C / SIGTERM 时注销

[EruptModel("Category")]
internal sealed class Category
{
    [Pk] public long Id { get; set; }
    [Field("Name", Search = true, NotNull = true, Sortable = true)] public string? Name { get; set; }
    [Field("Parent Id")] public long? Parent { get; set; }
}

[EruptModel("Article", OrderBy = "id desc")]
internal sealed class Article
{
    [Pk] public long Id { get; set; }
    [Field("Title", Search = true, NotNull = true, Sortable = true)] public string? Title { get; set; }
    [Field("Category", Search = true)] public Category? Category { get; set; }
    [Field("Status", Search = true), Choice("draft", "Draft"), Choice("review", "In Review"), Choice("published", "Published")]
    public string? Status { get; set; }
    [Field("Views", Sortable = true)] public long? Views { get; set; }
    [Field("Featured", Search = true)] public bool? Featured { get; set; }
    [Field("Publish Date", Search = true)] public DateOnly? PublishDate { get; set; }
    [Field("Summary", Type = EditType.TEXTAREA, Table = false)] public string? Summary { get; set; }
}
```

```bash
ERUPT_ACCESS_TOKEN=<access-token> ERUPT_SERVER=http://localhost:8080 dotnet run
```

服务端配置（详见 [Cloud Server](/zh/modules/cloud-server)）：

1. 在服务端「节点管理」（Node Config）中创建节点 `blog`，复制它的 access-token
2. 新增类型为 `table` 的菜单，类型值填 `blog.Article`（同理可加 `blog.Category`）
3. 启动节点。服务端需能访问 `http://<节点 ip>:9090`，否则设置 `NodeOptions.Address`

## 声明模型

模型是带特性的普通类：`[EruptModel(title)]` 标记模型，`[Pk]` 标记主键，`[Field(title)]` 标记字段，`[Choice(value, label)]` 声明选项。类只负责声明，记录以 `Record`（字段名 → 值的字典）传递。

字段在接口与存储中的名字是属性名的 snake_case（`PublishDate` → `publish_date`），可用 `[Field(Name = ...)]` / `[Pk(Name = ...)]` 指定。编辑类型按属性类型推断，`Type = EditType.XXX` 可覆盖：

| C# 类型 | 编辑类型 |
| --- | --- |
| `string` | INPUT |
| `int` / `long` / `short` / `byte` / `float` / `double` / `decimal` 等数字 | NUMBER |
| `bool` | BOOLEAN |
| `DateOnly` | DATE |
| `DateTime` / `DateTimeOffset` | DATE_TIME |
| 另一个 `[EruptModel]` 类 | REFERENCE_TABLE（设置 `Tree` 时为 REFERENCE_TREE） |
| 带 `[Choice]` 的标量 | CHOICE |
| 带 `[Choice]` 的集合（如 `List<string>`） | MULTI_CHOICE（以 JSON 数组存储） |
| 其他集合 / 字典（如 `Dictionary<string, string>`） | JSON 值（配合 `EditType.KEY_VALUE` 等编辑器） |

JSON 字段不能搜索或排序。`[Field]` 属性：`Name`、`Type`、`Search`、`NotNull`、`Sortable`、`Table`、`Form`、`Virtual`、`Ref`、`Label`（默认 `name`）、`Tree`、`DependColumn`。`[EruptModel]` 属性：`Name`（默认类名）、`OrderBy`（如 `"views desc, id"`，由节点执行）、`DataProxy`。

### 原始注解属性

特性无法承载对象与代码，因此原始注解属性、权限、行操作与字段代码都在模型构建器 `EruptModel.Of<T>()` 上声明。原始对象是生成的 `Edit`、`View`、`EruptOptions`（即 `@Erupt`，为避免与命名空间冲突改名）、`RowOperation` 等类型，声明时按 erupt Schema 校验：

```csharp
node.Register(EruptModel.Of<Article>()
    .Power(new Power { Delete = false })
    .Options(new EruptOptions { Layout = new Layout { PageSize = 30 } })
    .Edit(a => a.Title, new Edit { InputType = new InputType { Length = 60 } })
    .Edit(a => a.Rating, new Edit { Type = EditType.RATE, RateType = new RateType { Count = 5, AllowHalf = true } })
    .Edit(a => a.Color, new Edit { Type = EditType.COLOR }), articles);   // Rating、Color 为示例博客中的属性
```

`Type =` 还可取 `TAGS`、`AUTO_COMPLETE`、`ATTACHMENT`（文件由服务端存储，节点只保存路径）、`HTML_EDITOR`、`MARKDOWN`、`CODE_EDITOR`、`COLOR`、`ICON`、`SIGNATURE`、`MAP`、`HIDDEN`（以上均为文本）、`RATE`、`SLIDER`（数字）、`BUTTON`（仅表单），以及配合 `Ref =` 的 `CHECKBOX` / `TAB_TREE` / `TRANSFER`（以被选记录主键的 JSON 列表存储）。DIVIDE、CALLOUT、EMPTY、GROUP 等布局元素用 `Virtual = true` 声明，再用 `.Edit` 指定类型，参与构建但从不读写存储。

### 视图与树

- `.Vis(new Vis { ... }, orderBy: ..., filter: ...)` 追加一个 `@Erupt(vis)` 视图。`filter`（SQL，原样 AND）与 `orderBy` 由节点在读取该视图时执行，不进入构建结果；`filter` 需要 SQL 仓储。`EruptOptions.Vis` 会替换此前声明的全部视图
- `.Options(new EruptOptions { Tree = new Tree { Id = "id", Label = "name", Pid = "parent" } })` 以树展示模型；`LinkTree = new LinkTree { Field = "category" }` 在表格旁显示引用字段的树。树由服务端基于节点的表格数据组装

```csharp
EruptModel.Of<TaskItem>()
    .Vis(new Vis { Title = "Board", Type = VisType.BOARD, BoardView = new BoardView { GroupField = "status" } }, filter: "archived = 0")
    .Vis(new Vis { Title = "Recent", Type = VisType.TABLE }, orderBy: "created desc");
```

### 字段代码

`Fetch`、`OnChange`、`Complete`、`Click` 按属性注册代码，服务端通过节点的 `invoke` 接口携带表单值调用；每个都接受同步或异步函数：

```csharp
node.Register(EruptModel.Of<Order>()
    .Fetch(o => o.Status, form => [("new", "New"), ("paid", "Paid")])          // TAGS: form => ["a", "b"]
    .OnChange(o => o.Qty, form => new FieldUpdate { FormData = new Record { ["total"] = (long)form["qty"]! * 9 } })
    .Complete(o => o.City, async (form, typed) => await LookupAsync(typed))
    .Click(o => o.Recalc, form => new FieldUpdate { Eval = "alert('done')" }), repository);
```

`Fetch` 用于 CHOICE / MULTI_CHOICE（value / label 对）与 TAGS（字符串），`Complete` 用于 AUTO_COMPLETE，`Click` 用于 BUTTON，`OnChange` 可用于任意字段；用错类型会在声明时抛异常。抛出 `EruptFailure` 可向用户提示。

## 引用

属性类型为另一个 `[EruptModel]` 类即为引用；属性只保存主键（如 `long?`）时用 `Ref = typeof(Category)` 指定。仓储只存被引用记录的主键，界面显示 `Label`（默认 `name`），标签与树由服务端解析。被引用模型须**先于**引用它的模型注册在同一节点上，否则 `Register` 会抛异常。

```csharp
[Field("Category", Search = true)] public Category? Category { get; set; }   // 表格选择器
[Field("Topic", Tree = "parent")] public Category? Topic { get; set; }        // 基于 Category.parent 的树选择器
```

依赖另一字段的引用表格：`[Field("Shelf", DependColumn = "province")]` 加上 `.Edit(x => x.Shelf, new Edit { ReferenceTableType = new ReferenceTableType { DependField = "province" } })`，服务端只保留被引用模型中 `DependColumn` 等于依赖字段值的行。

钻取：

```csharp
node.Register(EruptModel.Of<Author>()
    .Drill(new Drill { Title = "Books", Link = new Link { LinkErupt = "Book" } }, joinColumn: "author"), repository);
```

打开 `Book` 中 `author` 等于作者 `id`（`column:`，默认 `id`）的行；`Link.LinkCondition` 原样追加 SQL。两个模型须在同一节点上。

## 行操作

`.Operation(code, OperationOptions, handler)` 声明行操作，操作必须显式给出 `code`。示例博客的两个操作：

```csharp
[EruptModel("Publish Options")]
internal sealed class PublishForm                    // 操作表单无需 [Pk]，也不注册
{
    [Field("Publish Date", NotNull = true)] public DateOnly? PublishDate { get; set; }
}

node.Register(EruptModel.Of<Article>()
    .Operation("publish", new OperationOptions
    {
        Title = "Publish", Icon = "fa fa-paper-plane", Form = EruptModel.Of<PublishForm>(), IfExpr = "item.status !== 'published'",
    }, async op =>
    {
        foreach (var row in op.Rows)
            await op.Repo.UpdateAsync(row["id"]!, new Record { ["status"] = "published", ["publish_date"] = op.Param!["publish_date"] });
    })
    .Operation("feature", new OperationOptions
    {
        Title = "Feature", Mode = RowOperationMode.SINGLE, Icon = "fa fa-star", ConfirmText = "Feature this article on the home page?",
    }, op => op.Repo.UpdateAsync(op.Rows[0]["id"]!, new Record { ["featured"] = true })),
    articles);
```

- `OperationContext`：`Rows`（所选记录，BUTTON 模式为空）、`Param`（表单值，无表单时为 `null`）、`Repo`、`Model`、`User`、`CancellationToken`
- `OperationOptions`：`Title`、`Mode`（`SINGLE` / `MULTI`（默认）/ `MULTI_ONLY` / `BUTTON`）、`Icon`、`Tip`、`Confirm = false` 跳过确认框、`ConfirmText` 替换确认文案、`Form`、`Show = user => ...`（隐藏操作并拒绝执行）、`IfExpr`、`Raw`（`@RowOperation` 原始属性）
- 处理函数返回非空字符串时，它会在浏览器中作为 JavaScript 执行，只能返回你自己编写的代码
- 抛出 `EruptFailure` 向用户提示；请求内（包括仓储中）可用 `EruptNode.CurrentUser` 取当前用户（`Uid`、`Account`、`Name`、`TenantId`）

## DataProxy

实现 `IDataProxy`，只写需要的方法（其余为默认空实现）；抛出 `EruptFailure` 拒绝并提示用户。

```csharp
class ArticleProxy : IDataProxy
{
    public void AddBehavior(Record record) => record["status"] = "draft";        // 新增表单的初始值

    public void Validate(Record record)                                           // 每次新增与修改前
    {
        if ((record["title"] as string ?? "").Contains("spam")) throw new EruptFailure("no spam");
    }

    public SqlFilter? BeforeFetch(IReadOnlyList<Cond> conditions) =>             // AND 到 WHERE 的 SQL，值绑定
        new("owner = ?", EruptNode.CurrentUser?.Uid);

    public void AfterFetch(IReadOnlyList<JsonObject> rows)                       // 表格页发送前
    {
        foreach (var row in rows) row["title"] = row["title"]?.GetValue<string>().Trim();
    }
}

[EruptModel("Article", DataProxy = [typeof(ArticleProxy)])]                     // 可多个，按顺序执行
class Article { ... }
```

| 钩子 | 执行时机 |
| --- | --- |
| `SearchCondition(condition)` | 构建模型时：搜索栏默认值 |
| `BeforeFetch(conditions)` | 读取表格页前：返回 `"sql"` 或 `new SqlFilter("sql with ?", values)`，原样 AND 到 WHERE；仅 SQL 仓储支持，`MemoryRepository` 会拒绝 |
| `AfterFetch(rows)` | 读取表格页后 |
| `AddBehavior(record)` | 新增表单（`init-value`） |
| `EditBehavior(record)` | 按主键读取记录后（编辑表单、详情） |
| `Validate(record)` | 新增或修改前 |
| `BeforeAdd` / `AfterAdd(record)` | `AddAsync` 前后 |
| `BeforeUpdate` / `AfterUpdate(record)` | `UpdateAsync` 前后，参数为提交的值 |
| `BeforeDelete` / `AfterDelete(record)` | `DeleteAsync` 前后，每条记录一次 |

## 存储

内置两种仓储：

- **`DbRepository(Func<DbConnection> connect, string table)`**：任意 ADO.NET 驱动。标识符加引号，值参数化（`@pN`），LIKE 以 `ESCAPE '!'` 转义，日期存为 ISO 文本；`AutoCreateSqlite = true` 时在 SQLite 上自动建缺失的表，其他数据库需自行建表
- **`MemoryRepository(params Record[] seed)`**：进程内存储，主键从 1 递增，适合测试与演示；拒绝 `Query.Filters`

| 数据库 | `DbRepository` 设置 |
| --- | --- |
| SQLite、PostgreSQL | 默认 |
| MySQL | `` Quote = ("`", "`") `` |
| SQL Server 2012+ | `Quote = ("[", "]"), Paging = Paging.OffsetFetch` |
| Oracle 12c+ | `ParameterPrefix = ":", Paging = Paging.OffsetFetch` |

自定义存储实现 `IRepository`：

```csharp
public interface IRepository
{
    void Bind(EruptModel model);                                                   // 注册时调用一次
    Task<(long Total, IReadOnlyList<Record> Records)> PageAsync(Query query, CancellationToken ct = default);
    Task<Record?> GetAsync(object pk, CancellationToken ct = default);
    Task AddAsync(Record record, CancellationToken ct = default);
    Task UpdateAsync(object pk, Record record, CancellationToken ct = default);   // 只修改 record 中出现的字段
    Task DeleteAsync(IReadOnlyList<object> pks, CancellationToken ct = default);
}
```

`Query` 携带 `Conditions`（已按模型校验的 `Cond`）、`Sort`、`Offset`、`Limit` 与 `Filters`（`@Vis` 视图和 `BeforeFetch` 的 SQL）。无法执行 `Filters` 的仓储必须抛异常，不能忽略。未指定排序时按主键升序返回。

## 运行与部署

示例读取的环境变量：

| 变量 | 说明 |
| --- | --- |
| `ERUPT_NODE_NAME` | 节点名，默认 `blog` |
| `ERUPT_ACCESS_TOKEN` | 服务端为节点生成的 access-token，勿提交到代码库 |
| `ERUPT_SERVER` | 服务端地址，默认 `http://localhost:8080` |
| `PORT` | 监听端口，默认 `9090` |
| `ERUPT_DB` | SQLite 文件，默认 `blog.db` |

`NodeOptions`：`Name`、`AccessToken`、`Servers`（多个时轮询）、`Address`（服务端访问本节点的 URL）、`Heartbeat`（默认 15 秒）、`RequireSignature`。

- **独立运行**：`await node.RunAsync(port, host = "0.0.0.0")` 启动 Kestrel，开始监听后注册并心跳，收到 Ctrl+C / SIGTERM 时注销
- **挂载进 ASP.NET Core**：

```csharp
builder.Services.AddEruptNode(node);   // 应用开始监听后心跳，停止时注销
app.MapEruptNode();                    // /node-health 与 /erupt-api/**
```

- **地址**：未设置 `Address` 时，用应用实际监听的端口和通往服务端的网卡地址（优先 IPv4）注册；无法判断端口时请显式设置 `Address`
- **服务端配置与用户信息**：`node.ConfigAsync()`、`node.GroupConfigAsync()` 返回服务端为节点及其分组设置的配置文本；`node.UserInfoAsync()` 在请求内返回当前用户的完整信息（角色、组织、岗位）

## 签名与权限

- **调用认证**：服务端的调用携带明文 `Access-Token`，或携带 `Erupt-Signature`（以 access-token 为密钥的 HMAC-SHA256，时间窗口 300 秒）。签名必须校验通过；`RequireSignature = true` 后仅带明文 token 的调用一律返回 403
- **`Erupt-Enforced`** 只有在签名有效时才被信任；带 `Origin` 头的请求（浏览器直连节点）直接返回 403
- **权限**：节点把模型声明的 `Power` 与服务端按会话下发的权限（`erupt-power` 回调）做 AND，回调失败时视为无写权限，结果按会话与模型缓存 5 秒。服务端在签名中声明 `Erupt-Enforced: power` 时跳过回调，只执行模型自身的声明
- **白名单**：搜索字段必须声明 `Search`，排序字段必须声明 `Sortable`（或为主键），每页最多 1000 条；值始终参数化

## 示例与一致性测试

- `dotnet/examples/Blog`：示例博客（Category、Article、Component 三个模型，覆盖 [SHOWCASE](https://github.com/erupt-io/erupt-sdk/blob/main/SHOWCASE.md) 的全部组件），启动时为空库写入种子数据

```bash
cd dotnet
ERUPT_NODE_NAME=blog ERUPT_ACCESS_TOKEN=<access-token> ERUPT_SERVER=http://localhost:8080 dotnet run --project examples/Blog
```

- 单元测试：`dotnet test tests/Erupt.Sdk.Tests`
- 一致性测试（在 `dotnet/` 目录执行）：

```bash
dotnet build examples/Conformance -c Release
python3 ../conformance/run.py -- dotnet examples/Conformance/bin/Release/net8.0/Conformance.dll
```

## 能力边界

- 打印（`print`）与 AI（`ai`）权限始终关闭，界面中隐藏
- 尚不支持：子表（`TAB_TABLE_ADD` / `TAB_TABLE_REFER`）、`MULTI_FORM`、`COMBINE`、`TPL`、`PASSWORD`（需服务端先支持掩码），以及模型嵌套（`eruptParent` 只能指向自身）
- JSON 字段（集合、字典）不能搜索或排序；`BeforeFetch`、视图 `filter`、钻取 `LinkCondition` 需要 SQL 仓储
- 与 Python SDK 的差异：字段名默认是属性名的 snake_case；行操作必须显式给出 `code`；请求体不是 JSON 对象时返回失败的 R（`a JSON object is required`）而不是 500；`DbRepository` 将日期存为 ISO 文本，默认以 `LIMIT / OFFSET` 分页
- Excel、附件、单元格编辑、拖拽排序、看板 / 日历 / 甘特视图的写入等由服务端代为完成，见 [服务端代节点完成的工作](/zh/modules/cloud-server#服务端代节点完成的工作)
