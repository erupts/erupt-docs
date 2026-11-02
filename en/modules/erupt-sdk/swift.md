# Swift SDK

Declare models with a Swift result builder and let the erupt server render them as admin pages. The `EruptSDK` library depends on nothing but Foundation (it brings its own HTTP server, JSON and HMAC-SHA256); the optional `EruptSQLite` product adds SQLite storage through the system libsqlite3. `Node.handle(_:)` is framework neutral, so a node can also live inside Vapor or Hummingbird. Models and data stay on the node; login, menus and permissions are handled by the erupt server.

> For an overview of all language SDKs see [Erupt SDK](/en/modules/erupt-sdk/); for the node protocol and the server see [Cloud Server](/en/modules/cloud-server).

## Requirements

| Language version | Runtime dependencies | Package | Version |
| --- | --- | --- | --- |
| Swift 5.9+ (macOS 13+ / Linux) | Foundation only; `EruptSQLite` needs the system libsqlite3 | `EruptSDK`, `EruptSQLite` (SwiftPM, `github.com/erupt-io/erupt-sdk-swift`) | 0.1.0 |

On Linux, `EruptSQLite` needs `libsqlite3-dev` (`apt install libsqlite3-dev`). The server needs erupt **2.4.0+** with [erupt-cloud-server](/en/modules/cloud-server) enabled.

## Installation

Add the dependency to `Package.swift`:

```swift
.package(url: "https://github.com/erupt-io/erupt-sdk-swift", from: "0.1.0"),

.target(name: "App", dependencies: [
    .product(name: "EruptSDK", package: "erupt-sdk-swift"),
    .product(name: "EruptSQLite", package: "erupt-sdk-swift"),   // for SQLite storage
]),
```

:::info Why a separate repository
`erupt-sdk-swift` is the read-only split of `swift/` in [erupt-sdk](https://github.com/erupt-io/erupt-sdk): SwiftPM needs `Package.swift` at the repository root and cannot use a subdirectory. SwiftPM reads git repositories directly, so no registry is involved.
:::

You can also copy `swift/Sources/EruptSDK/` into your package as a target with no dependencies (add `EruptSQLite` and `CSQLite` the same way for SQLite).

:::warning Upgrading a copy
A copy does not update itself. When erupt changes the protocol or the annotation schema, replace the whole directory with the next release instead of merging by hand, and leave `version` in `Node.swift` untouched so the server shows which release the node runs.
:::

## Quick Start

A trimmed version of `Examples/Blog/main.swift`:

```swift
import EruptSDK
import EruptSQLite
import Foundation

let env = ProcessInfo.processInfo.environment

do {
    let category = try Model("Category") {
        Field("id", pk: true)
        Field("name", "Name", search: true, notNull: true, sortable: true)
        Field("parent", "Parent Id", .number)
    }

    let article = try Model("Article", orderBy: "id desc") {
        Field("id", pk: true)
        Field("title", "Title", search: true, notNull: true, sortable: true, edit: Edit(inputType: InputType(length: 60)))
        Field("category", "Category", .ref(category), search: true)
        Field("topic", "Topic", .tree(category, pid: "parent"), table: false)
        Field("status", "Status", search: true, choices: ["draft": "Draft", "review": "In Review", "published": "Published"])
        Field("featured", "Featured", .bool, search: true)
        Field("publish_date", "Publish Date", .date, search: true)

        RowAction("feature", "Feature", mode: .single, icon: "fa fa-star", confirm: "Feature this article on the home page?") { op in
            try op.repo.update(op.rows[0]["id"]!, ["featured": true])
            return nil
        }
    }

    let db = try SQLiteExecutor(path: env["ERUPT_DB"] ?? "blog.db")
    let node = try Node(
        name: env["ERUPT_NODE_NAME"] ?? "blog", accessToken: env["ERUPT_ACCESS_TOKEN"] ?? "",
        servers: [env["ERUPT_SERVER"] ?? "http://localhost:8080"])
    try node.register(category, SQLRepository(db, table: "category", autoCreate: true))
    try node.register(article, SQLRepository(db, table: "article", autoCreate: true))
    try node.serve(port: Int(env["PORT"] ?? "") ?? 9090)
} catch {
    FileHandle.standardError.write("\(error)\n".data(using: .utf8)!)
    exit(1)
}
```

Then, on the server:

1. In [Cloud Server](/en/modules/cloud-server), create node `blog` under Node Config and copy its access token.
2. Add a menu of type `table` with value `blog.Article` (and `blog.Category`), i.e. `<node>.<Model>`.
3. Run the node: `ERUPT_ACCESS_TOKEN=... swift run`. The server must reach it at `http://<node ip>:9090`; otherwise pass `address:`, see [Running and Deploying](#running-and-deploying).

## Declaring Models

`Model(name, title:, power:, orderBy:, erupt:, dataProxy:, visQuery:, drillJoin:) { ... }` lists `Field`s and `RowAction`s in its builder block; declaration errors (an unknown attribute, a wrong reference, …) are thrown by the initializer.

- `name` is what the server addresses (menu value `<node>.<name>`); `title` defaults to it.
- `power:` switches features off, e.g. `["delete": false]`; `orderBy:` is the default table order (`"views desc, id"`), applied by the node.
- `erupt:` takes the generated `Erupt(...)` type for any other `@Erupt` attribute, e.g. `Erupt(layout: Layout(pageSize: 30))`.

`Field(name, title, kind, ...)` infers the edit type from `kind`; `type:` overrides it:

| Swift `FieldKind` | Edit type |
| --- | --- |
| `.string` (default) | INPUT |
| `.number` | NUMBER |
| `.bool` | BOOLEAN |
| `.date` | DATE (`2026-01-05`) |
| `.dateTime` | DATE_TIME (DATE with a time picker, `2026-01-05T10:30:00.000`) |
| with `choices:` | CHOICE |
| `.json` + `choices:` | MULTI_CHOICE (stored as a JSON array) |
| `.json` | a JSON array or object (e.g. KEY_VALUE), stored as JSON text by SQL repositories |
| `.ref(model, label:)` | REFERENCE_TABLE, see [References](#references) |
| `.tree(model, pid:, label:)` | REFERENCE_TREE |

Common parameters: `pk:`, `search:`, `notNull:`, `sortable:`, `table: false` (hidden from the table), `form: false` (hidden from the form), `virtual: true` (a form-only element such as DIVIDE, CALLOUT, EMPTY or GROUP, never read or written).

`type:` also takes `.tags`, `.autoComplete`, `.attachment` (the erupt server stores the upload, the node keeps its path), `.htmlEditor`, `.markdown`, `.codeEditor`, `.button` (form only), `.color`, `.icon`, `.signature`, `.map`, `.hidden`, `.rate`, `.slider`, and `.checkbox` / `.tabTree` / `.transfer` with a `.ref(model)` kind (stored as the JSON list of the picked keys).

### Raw annotation attributes

`view:` / `edit:` on a field and `erupt:` on a model take the typed annotation attributes generated from the erupt schema (`Edit`, `View`, `Erupt`, …), with every value an enum (`.textarea`, `.multiChoice`, `.single`); what they produce is checked against the schema again when the model is declared.

```swift
Field("rating", "Rating", .number, sortable: true, edit: Edit(rateType: RateType(allowHalf: true, character: "", count: 5), type: .rate))
Field("publish_date", "Publish Date", .date, search: true, edit: Edit(search: Search(operator: .range)))
Field("notes", "Notes", table: false, edit: Edit(type: .markdown))
```

Records are `Record` (`[String: JSON]`); `JSON` takes literals (`["status": "published", "views": 3]`).

### Views, trees and drills

```swift
let task = try Model(
    "Task",
    erupt: Erupt(vis: [
        Vis(boardView: BoardView(groupField: "status"), title: "Board", type: .board),
        Vis(title: "Recent", type: .table),
    ]),
    visQuery: ["Board": VisQuery(filter: "archived = 0"), "Recent": VisQuery(orderBy: "created desc")]
) { ... }

let author = try Model(
    "Author", erupt: Erupt(drills: [Drill(link: Link(linkErupt: "Book"), title: "Books")]),
    drillJoin: ["Books": DrillJoin(joinColumn: "author")]
) { ... }
```

- A view's `filter` (SQL, ANDed as written) and `orderBy` are `@Transient` in Java and not `Vis` attributes, so they go in `visQuery`, keyed by the view's code (its title when it has none), and the node applies them when that view is read. Like `beforeFetch`, a filter needs a SQL repository.
- `Erupt(tree: Tree(id: "id", label: "name", pid: "parent"))` shows the model as a tree; `Erupt(linkTree: LinkTree(field: "category"))` puts the tree of a reference field beside the table (`dependNode: true` shows no rows until a node is picked).
- A drill's `column` / `joinColumn` are `@Transient` too, so they go in `drillJoin`, keyed by the drill's code (its title when it has none); `DrillJoin(column:)` defaults to `id`, and `link.linkCondition` adds SQL as written. Both models must be on the node.

### Field code

A field can run its own code; the server calls it through the node's `invoke` endpoint with the form's values:

```swift
let order = try Model("Order") {
    Field("id", pk: true)
    Field("status", "Status", fetch: .options { form in [("new", "New"), ("paid", "Paid")] })  // TAGS: .tags { ... }
    Field("qty", "Qty", .number, onchange: { form in FormChange(formData: ["total": .int(form["qty"]!.int! * 9)]) })
    Field("city", "City", type: .autoComplete, complete: { form, typed in lookup(typed) })
    Field("total", "Total", .number)
    Field("recalc", "Recalc", type: .button, click: { form in FormChange(eval: "alert('done')") })
}
```

`fetch: .options` belongs to CHOICE / MULTI_CHOICE, `.tags` to TAGS, `complete` to AUTO_COMPLETE, `click` to BUTTON, and `onchange` to any field; anywhere else it fails at declaration. Throw an `EruptFailure` to refuse with a message.

## References

Pass another model (declared before and registered on the same node) to `.ref` / `.tree`. The repository stores the referenced primary key and the UI shows `label` (default `name`); the server resolves labels, flattened columns and trees.

```swift
Field("category", "Category", .ref(category), search: true)          // table picker
Field("topic", "Topic", .tree(category, pid: "parent"))               // tree picker over Category.parent
```

A reference table depending on another field: `edit: Edit(referenceTableType: ReferenceTableType(dependField: "province")), dependColumn: "province"`; the server keeps the picked model's rows whose `dependColumn` holds that field's value.

## Row Operations

```swift
let publishForm = try Model("PublishForm", title: "Publish Options") {   // a form-only model needs no primary key and is not registered
    Field("publish_date", "Publish Date", .date, notNull: true)
}

let article = try Model("Article") {
    // ...
    RowAction("publish", "Publish", icon: "fa fa-paper-plane", form: publishForm, ifExpr: "item.status !== 'published'") { op in
        for row in op.rows {
            try op.repo.update(row["id"]!, ["status": "published", "publish_date": op.param!["publish_date"]!])
        }
        return nil
    }
}
```

- `OperationContext` gives `op.rows` (selected records; empty in `.button` mode), `op.param` (form values, `nil` without a form), `op.repo`, `op.model` and `op.user`.
- `mode:` is `.single`, `.multi` (default), `.multiOnly` or `.button`.
- `confirm: false` skips the confirm dialog, a string replaces its text; `ifExpr:` is browser-side JavaScript over `item`; `tip:` and `raw: RowOperation(...)` pass other `@RowOperation` attributes.
- `show: { user in ... }` hides the operation from other users and refuses to run it for them.
- `User.current` is the acting user anywhere a request is served, repositories included.

:::warning
A string returned from the handler is executed as JavaScript in the browser, so return only code you wrote. Throw `EruptFailure("...")` to show the user a message.
:::

## DataProxy

Hooks around a model's reads and writes, as erupt's Java `DataProxy`. Implement the `DataProxy` methods you need (the rest default to no-ops); throw `EruptFailure` to refuse with a message the user sees.

```swift
struct ArticleProxy: DataProxy {
    func addBehavior(_ record: inout Record) {             // the new form's values
        record["status"] = "draft"
    }

    func validate(_ record: Record) throws {               // before every add and update
        if record["title"]?.text.contains("spam") == true { throw EruptFailure("no spam") }
    }

    func beforeFetch(_ conditions: [Cond]) -> SQLFilter? {  // SQL ANDed to the table's WHERE, values bound
        SQLFilter("owner = ?", [.string(User.current?.account ?? "")])
    }
}

let article = try Model("Article", dataProxy: [ArticleProxy()]) { ... }   // run in order
```

| Hook | Runs |
| --- | --- |
| `searchCondition(&condition)` | building the model: default values of the search bar |
| `beforeFetch(conditions)` | before a table page is read: `"sql"` or `SQLFilter("sql ?", [values])`, ANDed to its WHERE as written; SQL repositories only, `MemoryRepository` refuses it |
| `afterFetch(&rows)` | after a table page is read |
| `addBehavior(&record)` | for the new record form (`init-value`) |
| `editBehavior(&record)` | after a record is read by its key (edit form, detail view) |
| `validate(record)` | before an add or an update |
| `beforeAdd(&record)` / `afterAdd(record)` | around `repository.add` |
| `beforeUpdate(&record)` / `afterUpdate(record)` | around `repository.update`, with the submitted values |
| `beforeDelete` / `afterDelete(record)` | around `repository.delete`, once per record as stored |

## Storage

Storage is any class implementing the `Repository` protocol (`bind`, `page`, `get`, `add`, `update`, `delete`); it is called from many threads at once. Shipped:

- `MemoryRepository(records)`: in memory, for tests and demos.
- `SQLRepository(executor, table:, autoCreate:)`: PostgreSQL, MySQL or SQLite. The core library depends on no driver; a `SQLExecutor` runs each statement with bound values.

```swift
import EruptSQLite                                    // SQLite, through the system libsqlite3
let repo = try SQLRepository(try SQLiteExecutor(path: "blog.db"), table: "article", autoCreate: true)

// any other driver: a closure that runs (sql, params) and returns rows keyed by column name;
// the dialect is .sqlite, .postgres or .mysql
let postgres = SQLClosureExecutor(.postgres) { sql, params in try runOnPostgres(sql, params) }
let articles = try SQLRepository(postgres, table: "article")
```

- Columns are named like the fields and quoted (case sensitive on PostgreSQL); every value is a bound parameter; LIKE escapes with `ESCAPE '!'`. Without a sort, rows come back by primary key ascending.
- `autoCreate: true` creates SQLite tables only; create production tables yourself.
- `SQLiteExecutor` holds one connection, used by one thread at a time.

A custom driver implements the `SQLExecutor` protocol (a `dialect` property and `execute(_ sql:, _ params:) throws -> [[String: JSON]]`). A custom repository implements `Repository`: `page(_:)` returns `(total, records)`, and `Query` holds `conditions`, `sort`, `filters`, `offset` and `limit`. `filters` come from view filters and `beforeFetch`; a repository must apply them or throw, never ignore them.

## Running and Deploying

The SDK reads no environment variables itself; these are the convention of the examples:

| Variable | Meaning | Example default |
| --- | --- | --- |
| `ERUPT_NODE_NAME` | node name, as created under Node Config | `blog` |
| `ERUPT_ACCESS_TOKEN` | the node's access token | required |
| `ERUPT_SERVER` | the erupt server URL | `http://localhost:8080` |
| `PORT` | port the node listens on | `9090` |

`Node(name:, accessToken:, servers:, address: nil, heartbeat: 15, requireSignature: false, log: nil)`:

- It throws on an empty `accessToken` or `servers`; registration and heartbeats rotate across the servers.
- `address:` is where the server reaches the node. Without it the node guesses `http://<ip>:<port>` from the local interface used to reach the first server; set it explicitly behind containers or NAT.
- `heartbeat:` is the registration interval in seconds; `log:` receives `(LogLevel, String)`, stderr by default.

`node.serve(host: "0.0.0.0", port: 9090)` runs the built-in threaded HTTP/1.1 server (POSIX sockets, keep-alive, chunked request bodies): HTTP first (the server probes `/node-health` while registering), then the heartbeat. On SIGINT / SIGTERM it deregisters before exiting.

### Mounting in Vapor / Hummingbird

`Node.handle(_:)` answers one `NodeRequest`; `serve` only wraps it in the built-in server. To share the application's port, route the node's paths to it and call `start(port:)` to register and `stop()` to deregister:

```swift
// Vapor
for method in [HTTPMethod.GET, .POST] {
    app.on(method, "erupt-api", "**", body: .collect(maxSize: "32mb")) { req in try nodeResponse(req) }
}
app.get("node-health") { req in try nodeResponse(req) }
node.start(port: 8080)                       // registers http://<ip>:8080 with the erupt server

func nodeResponse(_ req: Request) throws -> Response {
    var headers: [String: String] = [:]
    req.headers.forEach { headers[$0.name] = $0.value }
    let body = req.body.data.map { Array($0.readableBytesView) } ?? []
    let r = node.handle(NodeRequest(method: req.method.rawValue, target: req.url.string, headers: headers, body: body))
    return Response(status: .init(statusCode: r.status), headers: ["Content-Type": r.contentType], body: .init(data: Data(r.body)))
}
```

The path a node is handed must be the raw one the server signed (`/erupt-api/...`): mount it at the root, or strip the mount point before building the `NodeRequest`.

### Server config and user info

`node.config()` and `node.groupConfig()` return the config text set for the node and its group on the server; `node.userInfo()` returns the acting user's full info (roles, org, post) while a request is served.

## Signatures and Power

- **Origin**: a request carrying an `Origin` header gets 403; a node only answers server-to-server calls.
- **Authentication**: an unsigned call must carry the `Access-Token`, compared in constant time. A call with `Erupt-Signature` is verified as HMAC-SHA256 keyed by the access token, within a 300-second window, and only then is `Erupt-Enforced` trusted. `requireSignature: true` refuses every unsigned call.
- **Per-user power**: the node asks the server's `erupt-power` with the request's session token and ANDs the answer onto the model's declared `power` (add, edit, delete, viewDetails, export, importable), cached for 5 seconds; if the server cannot be reached, nothing is allowed. When a signed `Erupt-Enforced` lists `power`, the callback is skipped.
- Features the SDK does not serve yet (`print`, `ai`) are always off; a row operation hidden by `show:` answers 403 to that user.

## Examples and Conformance

- `Examples/Blog`: the blog model of [SHOWCASE](https://github.com/erupt-io/erupt-sdk/blob/main/SHOWCASE.md) (Category, Article, Component), stored in the SQLite file `ERUPT_DB` (default `blog.db`).

  ```bash
  ERUPT_NODE_NAME=blog ERUPT_ACCESS_TOKEN=... ERUPT_SERVER=http://localhost:8080 swift run Blog
  ```

- `Examples/Conformance`: the conformance fixture, run with `conformance/run.py` playing the server:

  ```bash
  (cd swift && swift build -c release --product Conformance) && python conformance/run.py -- swift/.build/release/Conformance
  ```

- Unit tests: `swift test` (needs the Swift 6 toolchain for swift-testing); `swift run erupt-gen-types ../schema --check` checks the generated code against `schema/`.

## Limitations

- Not yet: sub-tables (`TAB_TABLE_*`) and other nested models, TPL operations; `print` and `ai` are hidden in the UI.
- `type:` takes only the types the SDK has a field template for; `.password`, `.tpl`, `.tabTableRefer` / `.tabTableAdd`, `.multiForm` and `.combine` fail at declaration. DIVIDE, CALLOUT, GROUP, KEY_VALUE and the like are declared through `edit: Edit(type: ...)`.
- Platforms are macOS 13+ and Linux; `EruptSQLite` depends on the system libsqlite3.
- `beforeFetch` and view filters need a SQL repository; `MemoryRepository` refuses them.
