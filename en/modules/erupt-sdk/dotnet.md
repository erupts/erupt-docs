# C# / .NET SDK

The .NET SDK lets a .NET service act as an erupt-cloud node and turns models declared with C# attributes into erupt admin pages: models and data stay on the node, while the erupt server renders the UI and handles login and menu permissions. A node runs on its own Kestrel server or is mounted into an existing ASP.NET Core app.

> For the multi-language overview see [Erupt SDK](/en/modules/erupt-sdk/); for the node protocol and the server see [Cloud Server](/en/modules/cloud-server).

## Requirements

| Language version | Runtime dependencies | Package | Version |
| --- | --- | --- | --- |
| .NET 8+ (the library targets `net8.0` and runs on any newer runtime) | the ASP.NET Core shared framework only, no runtime NuGet dependencies | `Erupt.Sdk` (NuGet) | 0.1.0 |

The server must be erupt **2.4.0+**. `DbRepository` also needs the ADO.NET provider of your database (e.g. `Microsoft.Data.Sqlite`, `Npgsql`, `MySqlConnector`).

## Installation

```bash
dotnet add package Erupt.Sdk
dotnet add package Microsoft.Data.Sqlite      # the quick start uses SQLite
```

Without nuget.org, copy `dotnet/src/Erupt.Sdk/` (the `.csproj`, the sources and `Resources/`, which the project embeds) into your solution and reference it:

```bash
dotnet add reference third_party/Erupt.Sdk/Erupt.Sdk.csproj
```

Or run `dotnet pack dotnet/src/Erupt.Sdk -o ./packages` and add `./packages` as a local package source.

:::warning Upgrading a copied SDK
A copy does not update itself. When erupt changes the protocol or the annotation schema, replace the whole directory with the next release instead of merging by hand, and leave `EruptNode.Version` untouched: the server uses it to show which release the node runs.
:::

## Quick Start

A trimmed version of the blog example (`dotnet/examples/Blog`), one `Program.cs`:

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
node.Register<Category>(new DbRepository(Connect, "category") { AutoCreateSqlite = true });   // referenced models first
node.Register<Article>(new DbRepository(Connect, "article") { AutoCreateSqlite = true });

await node.RunAsync(int.Parse(Env("PORT") ?? "9090"));   // deregisters on Ctrl+C / SIGTERM

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

On the server (see [Cloud Server](/en/modules/cloud-server)):

1. Create node `blog` under Node Config and copy its access token
2. Add a menu of type `table` with value `blog.Article` (and `blog.Category` likewise)
3. Start the node. The server must reach `http://<node ip>:9090`; otherwise set `NodeOptions.Address`

## Declaring Models

Models are plain classes with attributes: `[EruptModel(title)]` marks the model, `[Pk]` the primary key, `[Field(title)]` a field and `[Choice(value, label)]` an option. The classes only declare; records travel as `Record` (a field name → value dictionary).

The name of a field on the wire and in storage is the snake_case property name (`PublishDate` → `publish_date`) unless `[Field(Name = ...)]` / `[Pk(Name = ...)]` sets it. The edit type follows the property type; `Type = EditType.XXX` overrides it:

| C# type | Edit type |
| --- | --- |
| `string` | INPUT |
| `int` / `long` / `short` / `byte` / `float` / `double` / `decimal` and other numbers | NUMBER |
| `bool` | BOOLEAN |
| `DateOnly` | DATE |
| `DateTime` / `DateTimeOffset` | DATE_TIME |
| another `[EruptModel]` class | REFERENCE_TABLE (REFERENCE_TREE with `Tree`) |
| a scalar with `[Choice]`s | CHOICE |
| a collection with `[Choice]`s (e.g. `List<string>`) | MULTI_CHOICE (stored as a JSON array) |
| any other collection / dictionary (e.g. `Dictionary<string, string>`) | a JSON value (with an editor such as `EditType.KEY_VALUE`) |

JSON fields cannot be searched or sorted. `[Field]` properties: `Name`, `Type`, `Search`, `NotNull`, `Sortable`, `Table`, `Form`, `Virtual`, `Ref`, `Label` (default `name`), `Tree`, `DependColumn`. `[EruptModel]` properties: `Name` (defaults to the class name), `OrderBy` (e.g. `"views desc, id"`, applied by the node), `DataProxy`.

### Raw annotation attributes

Attributes cannot hold objects or code, so raw annotation attributes, power, row operations and field code go on the model builder `EruptModel.Of<T>()`. The raw objects are the generated `Edit`, `View`, `EruptOptions` (`@Erupt`, renamed so it does not collide with the namespace), `RowOperation` and related types, checked against the erupt schema when declared:

```csharp
node.Register(EruptModel.Of<Article>()
    .Power(new Power { Delete = false })
    .Options(new EruptOptions { Layout = new Layout { PageSize = 30 } })
    .Edit(a => a.Title, new Edit { InputType = new InputType { Length = 60 } })
    .Edit(a => a.Rating, new Edit { Type = EditType.RATE, RateType = new RateType { Count = 5, AllowHalf = true } })
    .Edit(a => a.Color, new Edit { Type = EditType.COLOR }), articles);   // Rating and Color as in the blog example
```

`Type =` also takes `TAGS`, `AUTO_COMPLETE`, `ATTACHMENT` (the server stores the upload, the node keeps its path), `HTML_EDITOR`, `MARKDOWN`, `CODE_EDITOR`, `COLOR`, `ICON`, `SIGNATURE`, `MAP`, `HIDDEN` (all text), `RATE`, `SLIDER` (numbers), `BUTTON` (form only), and `CHECKBOX` / `TAB_TREE` / `TRANSFER` with `Ref =` (the picked records, stored as the JSON list of their keys). Layout elements such as DIVIDE, CALLOUT, EMPTY and GROUP are declared `Virtual = true` with their type set through `.Edit`: in the build, but never read or written.

### Views and trees

- `.Vis(new Vis { ... }, orderBy: ..., filter: ...)` appends one `@Erupt(vis)` view. Its `filter` (SQL, ANDed as written) and `orderBy` are applied by the node when the table is read for that view and kept out of the build; a `filter` needs a SQL repository. `EruptOptions.Vis` replaces every view declared so far
- `.Options(new EruptOptions { Tree = new Tree { Id = "id", Label = "name", Pid = "parent" } })` shows the model as a tree; `LinkTree = new LinkTree { Field = "category" }` puts the tree of a reference field beside the table. The server builds both trees from the node's table

```csharp
EruptModel.Of<TaskItem>()
    .Vis(new Vis { Title = "Board", Type = VisType.BOARD, BoardView = new BoardView { GroupField = "status" } }, filter: "archived = 0")
    .Vis(new Vis { Title = "Recent", Type = VisType.TABLE }, orderBy: "created desc");
```

### Field code

`Fetch`, `OnChange`, `Complete` and `Click` register code by property; the server calls it through the node's `invoke` endpoint with the form's values. Each takes a plain or an async function:

```csharp
node.Register(EruptModel.Of<Order>()
    .Fetch(o => o.Status, form => [("new", "New"), ("paid", "Paid")])          // TAGS: form => ["a", "b"]
    .OnChange(o => o.Qty, form => new FieldUpdate { FormData = new Record { ["total"] = (long)form["qty"]! * 9 } })
    .Complete(o => o.City, async (form, typed) => await LookupAsync(typed))
    .Click(o => o.Recalc, form => new FieldUpdate { Eval = "alert('done')" }), repository);
```

`Fetch` belongs to CHOICE / MULTI_CHOICE (value / label pairs) and TAGS (strings), `Complete` to AUTO_COMPLETE, `Click` to BUTTON, `OnChange` to any field; anything else throws at declaration. Throw `EruptFailure` to refuse with a message.

## References

A property typed with another `[EruptModel]` class is a reference; for a property that holds only the key (e.g. `long?`), name the model with `Ref = typeof(Category)`. The repository stores the referenced primary key and the UI shows `Label` (default `name`); the server resolves labels and trees. Register the referenced model on the same node **before** the models referencing it, or `Register` throws.

```csharp
[Field("Category", Search = true)] public Category? Category { get; set; }   // table picker
[Field("Topic", Tree = "parent")] public Category? Topic { get; set; }        // tree picker over Category.parent
```

A reference table depending on another field takes `[Field("Shelf", DependColumn = "province")]` plus `.Edit(x => x.Shelf, new Edit { ReferenceTableType = new ReferenceTableType { DependField = "province" } })`; the server keeps the referenced model's rows whose `DependColumn` holds the depend field's value.

Drills:

```csharp
node.Register(EruptModel.Of<Author>()
    .Drill(new Drill { Title = "Books", Link = new Link { LinkErupt = "Book" } }, joinColumn: "author"), repository);
```

This opens `Book` filtered to the rows whose `author` holds the author's `id` (`column:`, `id` by default); `Link.LinkCondition` adds SQL as written. Both models must be on the node.

## Row Operations

`.Operation(code, OperationOptions, handler)` declares a row operation; the `code` is always explicit. The two operations of the blog example:

```csharp
[EruptModel("Publish Options")]
internal sealed class PublishForm                    // an operation form needs no [Pk] and is not registered
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

- `OperationContext`: `Rows` (the selected records, empty in BUTTON mode), `Param` (form values, `null` without a form), `Repo`, `Model`, `User`, `CancellationToken`
- `OperationOptions`: `Title`, `Mode` (`SINGLE` / `MULTI` (default) / `MULTI_ONLY` / `BUTTON`), `Icon`, `Tip`, `Confirm = false` to skip the dialog, `ConfirmText` to replace its text, `Form`, `Show = user => ...` (hides the operation and refuses to run it), `IfExpr`, `Raw` (raw `@RowOperation` attributes)
- A handler returning a non-empty string has it run as JavaScript in the browser, so return only code you wrote
- Throw `EruptFailure` to show the user a message; `EruptNode.CurrentUser` is the acting user (`Uid`, `Account`, `Name`, `TenantId`) anywhere in a request, repositories included

## DataProxy

Implement `IDataProxy` with only the methods you need (the others default to no-ops); throw `EruptFailure` to refuse with a message the user sees.

```csharp
class ArticleProxy : IDataProxy
{
    public void AddBehavior(Record record) => record["status"] = "draft";        // the new form's values

    public void Validate(Record record)                                           // before every add and update
    {
        if ((record["title"] as string ?? "").Contains("spam")) throw new EruptFailure("no spam");
    }

    public SqlFilter? BeforeFetch(IReadOnlyList<Cond> conditions) =>             // SQL ANDed to the WHERE, values bound
        new("owner = ?", EruptNode.CurrentUser?.Uid);

    public void AfterFetch(IReadOnlyList<JsonObject> rows)                       // a table page, before it is sent
    {
        foreach (var row in rows) row["title"] = row["title"]?.GetValue<string>().Trim();
    }
}

[EruptModel("Article", DataProxy = [typeof(ArticleProxy)])]                     // one or more, run in this order
class Article { ... }
```

| Hook | Runs |
| --- | --- |
| `SearchCondition(condition)` | building the model: default values of the search bar |
| `BeforeFetch(conditions)` | before a table page is read: `"sql"` or `new SqlFilter("sql with ?", values)`, ANDed to the WHERE as written; SQL repositories only, `MemoryRepository` refuses it |
| `AfterFetch(rows)` | after a table page is read |
| `AddBehavior(record)` | the new record form (`init-value`) |
| `EditBehavior(record)` | after a record is read by its key (edit form, detail view) |
| `Validate(record)` | before an add or an update |
| `BeforeAdd` / `AfterAdd(record)` | around `AddAsync` |
| `BeforeUpdate` / `AfterUpdate(record)` | around `UpdateAsync`, with the submitted values |
| `BeforeDelete` / `AfterDelete(record)` | around `DeleteAsync`, once per record |

## Storage

Two repositories are built in:

- **`DbRepository(Func<DbConnection> connect, string table)`**: any ADO.NET provider. Identifiers are quoted, values parameterized (`@pN`), LIKE escaped with `ESCAPE '!'`, dates stored as ISO text; `AutoCreateSqlite = true` creates a missing SQLite table, elsewhere create it yourself
- **`MemoryRepository(params Record[] seed)`**: in process memory, primary keys counting from 1, for tests and demos; refuses `Query.Filters`

| Database | `DbRepository` settings |
| --- | --- |
| SQLite, PostgreSQL | defaults |
| MySQL | `` Quote = ("`", "`") `` |
| SQL Server 2012+ | `Quote = ("[", "]"), Paging = Paging.OffsetFetch` |
| Oracle 12c+ | `ParameterPrefix = ":", Paging = Paging.OffsetFetch` |

Custom storage implements `IRepository`:

```csharp
public interface IRepository
{
    void Bind(EruptModel model);                                                   // once, when the model is registered
    Task<(long Total, IReadOnlyList<Record> Records)> PageAsync(Query query, CancellationToken ct = default);
    Task<Record?> GetAsync(object pk, CancellationToken ct = default);
    Task AddAsync(Record record, CancellationToken ct = default);
    Task UpdateAsync(object pk, Record record, CancellationToken ct = default);   // changes only the fields in record
    Task DeleteAsync(IReadOnlyList<object> pks, CancellationToken ct = default);
}
```

`Query` carries `Conditions` (`Cond`s checked against the model), `Sort`, `Offset`, `Limit` and `Filters` (the SQL of a `@Vis` view and of `BeforeFetch`). A repository that cannot apply `Filters` must throw rather than ignore them. Without a sort, rows come back by primary key ascending.

## Running and Deploying

Environment variables read by the examples:

| Variable | Meaning |
| --- | --- |
| `ERUPT_NODE_NAME` | node name, default `blog` |
| `ERUPT_ACCESS_TOKEN` | the access token the server generated for the node; never commit it |
| `ERUPT_SERVER` | server address, default `http://localhost:8080` |
| `PORT` | listening port, default `9090` |
| `ERUPT_DB` | SQLite file, default `blog.db` |

`NodeOptions`: `Name`, `AccessToken`, `Servers` (round-robin when several), `Address` (the URL the server reaches this node on), `Heartbeat` (default 15 seconds), `RequireSignature`.

- **Standalone**: `await node.RunAsync(port, host = "0.0.0.0")` starts Kestrel, registers and heartbeats once listening, and deregisters on Ctrl+C / SIGTERM
- **Inside ASP.NET Core**:

```csharp
builder.Services.AddEruptNode(node);   // heartbeat once the app listens, deregistration on shutdown
app.MapEruptNode();                    // /node-health and /erupt-api/**
```

- **Address**: without `Address`, the node registers the port the app actually listens on and the interface the server is reached through (IPv4 first); set `Address` when the port cannot be told
- **Server config and user info**: `node.ConfigAsync()` and `node.GroupConfigAsync()` return the config text set for the node and its group on the server; `node.UserInfoAsync()` returns the acting user's full info (roles, org, post) while a request is served

## Signatures and Power

- **Authentication**: server calls carry the plain `Access-Token` or an `Erupt-Signature` (HMAC-SHA256 keyed by the access token, 300-second window). A signature must verify; with `RequireSignature = true` a call with only the plain token gets 403
- **`Erupt-Enforced`** is trusted only under a valid signature; a request with an `Origin` header (a browser reaching the node directly) gets 403
- **Power**: the node ANDs the model's declared `Power` with the server's per-session verdict (the `erupt-power` callback); if the callback fails nothing is writable. The result is cached for 5 seconds per session and model. When the server lists `power` in `Erupt-Enforced` the callback is skipped and only the model's own declaration applies
- **Whitelists**: a searched field must be declared `Search`, a sorted field `Sortable` (or be the primary key), and a page holds at most 1000 rows; values are always parameterized

## Examples and Conformance

- `dotnet/examples/Blog`: the blog example (Category, Article and Component, covering every component of [SHOWCASE](https://github.com/erupt-io/erupt-sdk/blob/main/SHOWCASE.md)); it seeds an empty database on start

```bash
cd dotnet
ERUPT_NODE_NAME=blog ERUPT_ACCESS_TOKEN=<access-token> ERUPT_SERVER=http://localhost:8080 dotnet run --project examples/Blog
```

- Unit tests: `dotnet test tests/Erupt.Sdk.Tests`
- Conformance (from `dotnet/`):

```bash
dotnet build examples/Conformance -c Release
python3 ../conformance/run.py -- dotnet examples/Conformance/bin/Release/net8.0/Conformance.dll
```

## Limitations

- The `print` and `ai` powers are always off and hidden in the UI
- Not supported yet: sub-tables (`TAB_TABLE_ADD` / `TAB_TABLE_REFER`), `MULTI_FORM`, `COMBINE`, `TPL`, `PASSWORD` (needs server-side masking first), and nested models (`eruptParent` can only name the model itself)
- JSON fields (collections, dictionaries) cannot be searched or sorted; `BeforeFetch`, view `filter`s and drill `LinkCondition`s need a SQL repository
- Differences from the Python SDK: field names default to the snake_case property name; operations need an explicit `code`; a request body that is not a JSON object answers a failed R (`a JSON object is required`) instead of a 500; `DbRepository` stores dates as ISO text and pages with `LIMIT / OFFSET` unless told otherwise
- Excel, attachments, cell editing, drag sort and writes from board / calendar / gantt views are done by the server; see [What the Server Does for a Node](/en/modules/cloud-server#what-the-server-does-for-a-node)
