# Rust SDK

Declare models with a Rust builder API and let the erupt server render them as admin pages. The default build depends only on `serde`, `serde_json` and `ctrlc`; the SQLite / PostgreSQL / MySQL drivers are opt-in cargo features. The API is synchronous, and `Node::handle` is framework neutral, so a node can also live inside axum or another async server. Models and data stay on the node; login, menus and permissions are handled by the erupt server.

> For an overview of all language SDKs see [Erupt SDK](/en/modules/erupt-sdk/); for the node protocol and the server see [Cloud Server](/en/modules/cloud-server).

## Requirements

| Language version | Runtime dependencies | Package | Version |
| --- | --- | --- | --- |
| Rust 1.85+ (1.88+ with a database driver) | `serde`, `serde_json`, `ctrlc`; drivers behind features | `erupt-sdk` (crates.io), library name `erupt` | 0.1.0 |

Optional features (all off by default):

| Feature | Pulls in | Provides |
| --- | --- | --- |
| `sqlite` | `rusqlite` (bundled SQLite) | `SqliteExecutor` |
| `postgres` | `postgres` (sync client), `chrono` | `PostgresExecutor` |
| `mysql` | `mysql` | `MysqlExecutor` |

The server needs erupt **2.4.0+** with [erupt-cloud-server](/en/modules/cloud-server) enabled.

## Installation

```toml
[dependencies]
erupt-sdk = { version = "0.1", features = ["sqlite"] }   # or "postgres", "mysql"
serde_json = "1"
```

The crate is `erupt-sdk`; in code it is `erupt` (`use erupt::...`). Straight from the repository, without crates.io:

```toml
erupt-sdk = { git = "https://github.com/erupt-io/erupt-sdk", tag = "rust/v0.1.0", features = ["sqlite"] }
```

You can also copy `rust/` (`Cargo.toml`, `src/` and the two `.json` files, which are compiled in) into your workspace and use `path = "third_party/erupt-sdk"`.

:::warning Upgrading a copy
A copy does not update itself. When erupt changes the protocol or the annotation schema, replace the whole directory with the next release instead of merging by hand, and leave `VERSION` in `node.rs` untouched so the server shows which release the node runs.
:::

## Quick Start

A trimmed version of `examples/blog.rs` (needs the `sqlite` feature):

```rust
use erupt::types::RowOperationMode;
use erupt::{Dialect, Field, Model, Node, Operation, Record, SqlRepository, SqliteExecutor};
use serde_json::json;

fn main() -> erupt::Result<()> {
    let env = |name: &str, fallback: &str| std::env::var(name).unwrap_or_else(|_| fallback.to_string());

    let category = Model::new("Category", "Category")
        .field("id", Field::pk())
        .field("name", Field::input("Name").search().not_null().sortable())
        .field("parent", Field::number("Parent Id"))
        .build()?;
    let article = Model::new("Article", "Article")
        .order_by("id desc")
        .field("id", Field::pk())
        .field("title", Field::input("Title").search().not_null().sortable().edit(json!({"inputType": {"length": 60}})))
        .field("category", Field::reference(&category, "Category").search())
        .field("topic", Field::reference(&category, "Topic").tree("parent").hide_table())
        .field("status", Field::choice("Status", &[("draft", "Draft"), ("review", "In Review"), ("published", "Published")]).search())
        .field("featured", Field::boolean("Featured").search())
        .field("publish_date", Field::date("Publish Date").search())
        .operation(
            Operation::new("feature", "Feature")
                .mode(RowOperationMode::Single)
                .icon("fa fa-star")
                .confirm("Feature this article on the home page?")
                .handler(|op| {
                    let mut values = Record::new();
                    values.insert("featured".into(), json!(true));
                    op.repo.update(&op.rows[0]["id"], values)?;
                    Ok(None)
                }),
        )
        .build()?;

    let db = env("ERUPT_DB", "blog.db");
    let sqlite = |table: &str| -> erupt::Result<SqlRepository> {
        Ok(SqlRepository::new(SqliteExecutor::open(&db)?, table, Dialect::Sqlite).auto_create())
    };
    let mut node = Node::new(
        &env("ERUPT_NODE_NAME", "blog"),
        &env("ERUPT_ACCESS_TOKEN", ""),
        [env("ERUPT_SERVER", "http://localhost:8080")],
    );
    node.register(&category, sqlite("category")?)?;
    node.register(&article, sqlite("article")?)?;
    node.serve("0.0.0.0", env("PORT", "9090").parse().expect("PORT")) // blocks; SIGINT / SIGTERM deregister and exit
}
```

Then, on the server:

1. In [Cloud Server](/en/modules/cloud-server), create node `blog` under Node Config and copy its access token.
2. Add menus of type `table` with values `blog.Article` and `blog.Category`, i.e. `<node>.<Model>`.
3. Run the node: `ERUPT_ACCESS_TOKEN=... cargo run`. The server must reach it at the detected address (IPv4 preferred); otherwise set `.address("http://10.0.0.12:9090")`, see [Running and Deploying](#running-and-deploying).

## Declaring Models

`Model::new(name, title)` returns a builder; `build()` turns it into an `Arc<Model>`. Every declaration error (an unknown attribute, a wrong reference, a duplicate field) surfaces from `build()` as `Error::Declaration`.

```rust
Model::new("Article", "Article")
    .order_by("id desc")                 // default table order, applied by the node
    .power(json!({"importable": true}))  // switch features on or off, e.g. {"delete": false}
    .raw(json!({"layout": {"pageSize": 30}}))  // any other @Erupt attribute
    .data_proxy(ArticleProxy)            // see DataProxy
```

Rust has no type annotations to infer from, so a field's edit type is chosen by its constructor:

| Constructor | Edit type |
| --- | --- |
| `Field::pk()` | integer primary key (hidden from table and form) |
| `Field::input(title)` | INPUT |
| `Field::textarea(title)` | TEXTAREA |
| `Field::number(title)` | NUMBER |
| `Field::boolean(title)` | BOOLEAN |
| `Field::date(title)` | DATE (`YYYY-MM-DD`) |
| `Field::date_time(title)` | DATE_TIME (`YYYY-MM-DDTHH:MM:SS.mmm`) |
| `Field::choice(title, &[(value, label)])` | CHOICE |
| `Field::multi_choice(title, &[(value, label)])` | MULTI_CHOICE |
| `Field::reference(&model, title)` | REFERENCE_TABLE; with `.tree(pid)` REFERENCE_TREE |
| `Field::checkbox` / `Field::tab_tree` / `Field::transfer(&model, title)` | CHECKBOX / TAB_TREE / TRANSFER, stored as the JSON list of the picked keys |
| `Field::of(EditType::…, title)` | any type: `Tags`, `AutoComplete`, `Attachment`, `HtmlEditor`, `Markdown`, `CodeEditor`, `Button`, `Color`, `Icon`, `Signature`, `Map`, `Hidden`, `Rate`, `Slider`, … |

Modifiers: `.search()`, `.not_null()`, `.sortable()`, `.hide_table()`, `.hide_form()`, `.label(field)`, `.tree(pid)`; `.json()` marks a JSON array or object (MULTI_CHOICE, KEY_VALUE; stored as JSON text by SQL repositories); `.transient()` marks a form-only element (DIVIDE, CALLOUT, EMPTY, GROUP) that is never read or written.

### Raw annotation attributes

`.edit(...)` / `.view(...)` on fields and `.raw(...)` on models and operations take `json!` or the generated types in `erupt::types` (`Edit`, `View`, `Erupt`, `RowOperation`, …). They are validated against erupt's annotation JSON Schema when `build()` runs: a misspelt key or enum value is an `Error::Declaration`, not a silent no-op in the browser.

```rust
.field("rating", Field::number("Rating").edit(json!({"type": "RATE", "rateType": {"count": 5, "allowHalf": true}})))
.field("meta", Field::textarea("Meta (JSON)").hide_table().edit(json!({"type": "CODE_EDITOR", "codeEditType": {"language": "json"}})))
```

Records are `erupt::Record` (`serde_json::Map<String, Value>`); dates are wall-clock text: DATE `YYYY-MM-DD`, DATE_TIME `YYYY-MM-DDTHH:MM:SS.mmm`.

### Views, trees and drills

```rust
let task = Model::new("Task", "Task")
    .raw(json!({"vis": [
        {"title": "Board", "type": "BOARD", "boardView": {"groupField": "status"}, "filter": "archived = 0"},
        {"title": "Recent", "type": "TABLE", "orderBy": "created desc"},
    ]}))
    // .field(...)
    .build()?;

Model::new("Author", "Author")
    .raw(json!({"drills": [{"title": "Books", "link": {"linkErupt": "Book", "joinColumn": "author"}}]}))
```

- A view's `filter` (one SQL string or a list, ANDed as written) and `orderBy` are SDK-only keys, applied by the node when that view is read and kept out of the build; the generated `types::Vis` has no such fields, so give them with `json!`. Like `before_fetch`, a filter needs a SQL repository.
- `.raw(json!({"tree": {"id": "id", "label": "name", "pid": "parent"}}))` shows the model as a tree; `{"linkTree": {"field": "category"}}` puts the tree of a reference field beside the table (`"dependNode": true` shows no rows until a node is picked).
- A drill opens `Book` filtered to the rows whose `author` holds the current row's `id` (`link.column`, `id` by default); `link.linkCondition` adds SQL as written. Both models must be on the node.

### Field code

A field can run its own code; the server calls it through the node's `invoke` endpoint with the form's values:

```rust
use erupt::types::EditType;

let order = Model::new("Order", "Order")
    .field("id", Field::pk())
    .field("status", Field::choice("Status", &[])
        .fetch(|_form| Ok(vec![("new".into(), "New".into()), ("paid".into(), "Paid".into())])))
    .field("qty", Field::number("Qty")
        .onchange(|form| Ok(json!({"formData": {"total": form.get("qty").and_then(|v| v.as_f64()).unwrap_or(0.0) * 9.0}, "editExpr": {}}))))
    .field("city", Field::of(EditType::AutoComplete, "City").complete(|_form, typed| Ok(lookup(typed))))
    .field("total", Field::number("Total"))
    .field("recalc", Field::of(EditType::Button, "Recalc")
        .click(|_form| Ok(json!({"eval": "alert('done')", "formData": {}}))))
    .build()?;
```

`fetch` belongs to CHOICE / MULTI_CHOICE, `fetch_tags` (a `Vec<String>`) to TAGS, `complete` to AUTO_COMPLETE, `click` to BUTTON, and `onchange` to any field; anywhere else `build()` fails. Return `Err(Error::fail(msg))` to refuse with a message.

## References

`Field::reference(&model, title)` points at another built model (registered on the same node). The repository stores the referenced primary key and the UI shows `.label(field)` (default `name`); the server resolves labels, flattened columns and trees.

```rust
.field("category", Field::reference(&category, "Category").search())   // table picker
.field("topic", Field::reference(&category, "Topic").tree("parent"))   // tree picker over Category.parent
```

A reference table depending on another field: `.edit(json!({"referenceTableType": {"dependField": "province", "dependColumn": "province"}}))`; the server keeps the picked model's rows whose `dependColumn` holds that field's value.

## Row Operations

```rust
let publish_form = Model::new("PublishForm", "Publish Options")   // a form-only model needs no primary key and is not registered
    .field("publish_date", Field::date("Publish Date").not_null())
    .build()?;

// on the Article builder:
.operation(
    Operation::new("publish", "Publish")
        .icon("fa fa-paper-plane")
        .form(&publish_form)
        .if_expr("item.status !== 'published'")
        .handler(|op| {
            let date = op.param.as_ref().and_then(|p| p.get("publish_date")).cloned().unwrap_or_default();
            for row in &op.rows {
                let mut values = Record::new();
                values.insert("status".into(), json!("published"));
                values.insert("publish_date".into(), date.clone());
                op.repo.update(&row["id"], values)?;
            }
            Ok(None)
        }),
)
```

- `OpContext` gives `op.rows` (selected records; empty in BUTTON mode), `op.param` (form values, `None` without a form), `op.repo`, `op.model` and `op.user`.
- `.mode(RowOperationMode::Single | Multi | MultiOnly | Button)`, `Multi` by default.
- `.no_confirm()` skips the confirm dialog, `.confirm(text)` replaces its text; `.if_expr(js)` is browser-side JavaScript over `item`; `.tip(text)` and `.raw(...)` pass other `@RowOperation` attributes.
- `.show(|user| ...)` hides the operation from other users and refuses to run it for them.

:::warning
A handler returning `Ok(Some(script))` has the script run as JavaScript in the browser, so return only code you wrote. `Err(Error::fail(msg))` shows `msg` to the user.
:::

## DataProxy

Hooks around a model's reads and writes, as erupt's Java `DataProxy`. Implement the methods of the `erupt::DataProxy` trait you need (the rest have defaults); return `Err(Error::fail(msg))` to refuse with a message the user sees.

```rust
use erupt::{current_user, Cond, DataProxy, Error, Filter, Record};
use serde_json::json;

struct ArticleProxy;

impl DataProxy for ArticleProxy {
    fn add_behavior(&self, record: &mut Record) -> erupt::Result<()> {   // the new form's values
        record.insert("status".into(), json!("draft"));
        Ok(())
    }

    fn validate(&self, record: &Record) -> erupt::Result<()> {          // before every add and update
        match record.get("title").and_then(|t| t.as_str()) {
            Some(t) if t.contains("spam") => Err(Error::fail("no spam")),
            _ => Ok(()),
        }
    }

    fn before_fetch(&self, _conditions: &[Cond]) -> erupt::Result<Option<Filter>> {  // ANDed to the WHERE, values bound
        let uid = current_user().map(|u| u["uid"].clone()).unwrap_or_default();
        Ok(Some(Filter::new("owner = ?", vec![uid])))
    }
}

let article = Model::new("Article", "Article")
    .data_proxy(ArticleProxy)   // call again to add more; they run in that order
    // .field(...)
    .build()?;
```

| Hook | Runs |
| --- | --- |
| `search_condition(condition)` | building the model: default values of the search bar |
| `before_fetch(conditions)` | before a table page is read: `"sql".into()` or `Filter::new("sql ?", values)`, ANDed to its WHERE as written; SQL repositories only, `MemoryRepository` refuses it |
| `after_fetch(rows)` | after a table page is read |
| `add_behavior(record)` | for the new record form (`init-value`) |
| `edit_behavior(record)` | after a record is read by its key (edit form, detail view) |
| `validate(record)` | before an add or an update |
| `before_add` / `after_add(record)` | around `repository.add` |
| `before_update` / `after_update(record)` | around `repository.update`, with the submitted values |
| `before_delete` / `after_delete(record)` | around `repository.delete`, once per record as stored |

## Storage

The `Repository` trait (`bind`, `page`, `get`, `add`, `update`, `delete`) puts a model on anything. Shipped:

- `MemoryRepository::new()` / `MemoryRepository::seeded(records)`: in memory, for tests and demos.
- `SqlRepository::new(executor, table, dialect)`: over a two-method `SqlExecutor`, with a `Dialect` that decides placeholders, quoting and paging.

| Database | Feature | Executor | Dialect |
| --- | --- | --- | --- |
| SQLite | `sqlite` | `SqliteExecutor::open(path)` (`":memory:"` for an in-memory database) | `Dialect::Sqlite`, `.auto_create()` |
| PostgreSQL | `postgres` | `PostgresExecutor::connect("host=… user=… dbname=…")` (no TLS) | `Dialect::Postgres` |
| MySQL | `mysql` | `MysqlExecutor::connect("mysql://user@host:3306/db")` (pooled) | `Dialect::Mysql` |
| SQL Server, others | — | implement `SqlExecutor` | `Dialect::Mssql` (SQL Server 2012+) |

Each executor can also wrap an existing connection: `SqliteExecutor::from(rusqlite::Connection)`, `PostgresExecutor::from(postgres::Client)`, `MysqlExecutor::from(mysql::Pool)`.

- Columns are named like the fields and quoted; every value is bound; LIKE escapes with `ESCAPE '!'`. Without a sort, rows come back by primary key ascending.
- `.auto_create()` creates SQLite tables only; create production tables yourself.
- The PostgreSQL executor converts parameters to the types the server reports (PostgreSQL refuses text for date or integer columns).

A custom SQL driver implements two methods:

```rust
pub trait SqlExecutor: Send + Sync {
    fn query(&self, sql: &str, params: &[Value]) -> Result<Vec<Record>>;   // rows keyed by column name
    fn execute(&self, sql: &str, params: &[Value]) -> Result<()>;
}
```

A custom repository implements `Repository`: `page(&Query) -> Result<(u64, Vec<Record>)>` returns the total and the page; `Query` holds `conditions`, `sort`, `filters`, `offset` and `limit`. `filters` come from view filters and `before_fetch`; a repository must apply them or return an error, never ignore them.

## Running and Deploying

The SDK reads no environment variables itself; these are the convention of the examples:

| Variable | Meaning | Example default |
| --- | --- | --- |
| `ERUPT_NODE_NAME` | node name, as created under Node Config | `blog` |
| `ERUPT_ACCESS_TOKEN` | the node's access token | required |
| `ERUPT_SERVER` | the erupt server URL | `http://localhost:8080` |
| `PORT` | port the node listens on | `9090` |

`Node::new(name, access_token, servers)` takes one or more server URLs; registration and heartbeats rotate across them. Builder methods:

- `.address(url)`: where the server reaches the node; otherwise the local interface used to reach the first server (IPv4 preferred). `node.auto_address(port)` shows the guess.
- `.heartbeat_interval(Duration)`: the registration interval, 15 seconds by default.
- `.require_signature(true)`: refuse unsigned calls, see [Signatures and Power](#signatures-and-power).
- `.power_source(|token, erupt| ...)`: where per-user rights come from, for tests and custom hosting; an error denies every right.

`node.serve(host, port)` runs the built-in server (HTTP/1.1 on `std::net` with a thread pool, one request per connection, 64 KiB header and 16 MiB body limits, 30 s timeouts): HTTP first (the server probes `/node-health` while registering), then the heartbeat. On SIGINT / SIGTERM it deregisters and exits.

:::warning Calls back to the server are http only
Calls back to the erupt server (registration, per-user power) are plain `http://`. Put a TLS-terminating proxy in front of an https server.
:::

### Mounting in axum and other frameworks

`Node::handle(&Request) -> Response` is framework neutral and blocking; under an async runtime call it through `spawn_blocking`. When you mount it yourself, register with `start_heartbeat()` and call `deregister()` on shutdown:

```rust
let node = Arc::new(node.address("http://10.0.0.12:9090"));
node.start_heartbeat();                  // and call node.deregister() on shutdown
let app = Router::new().fallback(move |method: Method, uri: Uri, headers: HeaderMap, body: Bytes| {
    let node = node.clone();
    async move {
        let mut request = erupt::http::Request::new(method.as_str(), &uri.to_string()).body(body.to_vec());
        for (name, value) in &headers {
            request = request.header(name.as_str(), value.to_str().unwrap_or(""));
        }
        let response = tokio::task::spawn_blocking(move || node.handle(&request)).await.unwrap();
        (StatusCode::from_u16(response.status).unwrap(), [("content-type", response.content_type)], response.body)
    }
});
```

A mounted node must have `.address(...)` set: only `serve` detects the address, and registration fails without one.

### Server config and user info

`node.config()` and `node.group_config()` return the config text set for the node and its group on the server; `node.user_info()` returns the acting user's full info (roles, org, post) on the thread serving a request.

## Signatures and Power

- **Origin**: a request carrying an `Origin` header gets 403; a node only answers server-to-server calls.
- **Authentication**: an unsigned call must carry the `Access-Token`, compared in constant time. A call with `Erupt-Signature` is verified as HMAC-SHA256 keyed by the access token, within a 300-second window, and only then is `Erupt-Enforced` trusted. `.require_signature(true)` refuses every unsigned call. The algorithm is public in `erupt::signature` (`sign`, `verify`).
- **Per-user power**: the node asks the server's `erupt-power` (or the `.power_source`) with the request's session token and ANDs the answer onto the model's declared `power` (add, edit, delete, viewDetails, export, importable), cached for 5 seconds; without an answer nothing is allowed. When a signed `Erupt-Enforced` lists `power`, the callback is skipped.
- Features the SDK does not serve yet (`print`, `ai`) are always off; a row operation hidden by `.show(...)` answers 403 to that user.

## Examples and Conformance

- `examples/blog.rs`: the blog model of [SHOWCASE](https://github.com/erupt-io/erupt-sdk/blob/main/SHOWCASE.md) (Category, Article, Component), stored in the SQLite file `ERUPT_DB` (default `blog.db`).

  ```bash
  ERUPT_ACCESS_TOKEN=... ERUPT_SERVER=http://localhost:8080 cargo run --features sqlite --example blog
  ```

- `examples/conformance.rs`: the conformance fixture, run with `conformance/run.py` playing the server:

  ```bash
  (cd rust && cargo build --release --example conformance) && python conformance/run.py -- rust/target/release/examples/conformance
  ```

- Unit tests: `cargo test --all-features` (real databases: see `tests/databases.rs`).

## Limitations

- Not yet: sub-tables (`TAB_TABLE_*`) and other nested models, TPL operations; `print` and `ai` are hidden in the UI.
- `Field::of` takes only the types the SDK has a field template for; `Password`, `Tpl`, `TabTableRefer` / `TabTableAdd`, `MultiForm` and `Combine` fail at `build()`. DIVIDE, CALLOUT, GROUP, KEY_VALUE and the like are declared through `.edit(json!({"type": ...}))`.
- Field types are explicit constructors and models need `build()`; the API is synchronous.
- Calls back to the server are `http://` only.
- A request body that is not a JSON object counts as empty.
- `before_fetch` and view filters need a SQL repository; `MemoryRepository` refuses them.
