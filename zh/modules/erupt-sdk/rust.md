# Rust SDK

用 Rust 的构建器 API 声明模型，由 erupt 服务端渲染成管理页面。默认构建只依赖 `serde`、`serde_json` 与 `ctrlc`，SQLite / PostgreSQL / MySQL 驱动按 cargo feature 按需引入；API 为同步阻塞式，`Node::handle` 与框架无关，可挂进 axum 等异步服务。模型和数据留在节点上，登录、菜单与权限由 erupt 服务端负责。

> 多语言 SDK 总览见 [Erupt SDK](/zh/modules/erupt-sdk/)，节点协议与服务端见 [Cloud Server](/zh/modules/cloud-server)。

## 环境要求

| 语言版本 | 运行时依赖 | 包名 | 版本 |
| --- | --- | --- | --- |
| Rust 1.85+（启用数据库驱动时 1.88+） | `serde`、`serde_json`、`ctrlc`；驱动按 feature 引入 | `erupt-sdk`（crates.io），库名 `erupt` | 0.1.0 |

可选 feature（默认全部关闭）：

| feature | 引入的依赖 | 提供 |
| --- | --- | --- |
| `sqlite` | `rusqlite`（bundled，自带 SQLite） | `SqliteExecutor` |
| `postgres` | `postgres`（同步客户端）、`chrono` | `PostgresExecutor` |
| `mysql` | `mysql` | `MysqlExecutor` |

服务端需要 erupt **2.4.0+** 并启用 [erupt-cloud-server](/zh/modules/cloud-server)。

## 安装

```toml
[dependencies]
erupt-sdk = { version = "0.1", features = ["sqlite"] }   # 或 "postgres"、"mysql"
serde_json = "1"
```

crate 名为 `erupt-sdk`，代码中以 `erupt` 引用（`use erupt::...`）。不经过 crates.io，直接从仓库引用：

```toml
erupt-sdk = { git = "https://github.com/erupt-io/erupt-sdk", tag = "rust/v0.1.0", features = ["sqlite"] }
```

也可以把 `rust/`（`Cargo.toml`、`src/` 与两个会被编译进去的 `.json` 文件）复制进工作区，用 `path = "third_party/erupt-sdk"` 引用。

:::warning 复制源码的升级方式
复制的代码不会自动更新。erupt 的协议或注解 Schema 变化后，请用新版本整目录替换，不要手工合并；也不要改动 `node.rs` 中的 `VERSION`，服务端靠它显示节点运行的版本。
:::

## 快速开始

下面是 `examples/blog.rs` 的精简版（需要 `sqlite` feature）：

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
    node.serve("0.0.0.0", env("PORT", "9090").parse().expect("PORT")) // 阻塞；SIGINT / SIGTERM 时注销并退出
}
```

然后在服务端完成三步：

1. 在 [Cloud Server](/zh/modules/cloud-server) 的「节点配置」中新建节点 `blog`，复制它的 access token。
2. 新增 `table` 类型的菜单，值为 `blog.Article`、`blog.Category`，即 `<节点名>.<模型名>`。
3. 运行节点：`ERUPT_ACCESS_TOKEN=... cargo run`。服务端必须能访问节点自动探测到的地址（优先 IPv4），否则用 `.address("http://10.0.0.12:9090")` 指定，见 [运行与部署](#运行与部署)。

## 声明模型

`Model::new(name, title)` 返回构建器，最后调用 `build()` 得到 `Arc<Model>`；所有声明错误（未知属性、错误的引用、重复字段等）都在 `build()` 时以 `Error::Declaration` 返回。

```rust
Model::new("Article", "Article")
    .order_by("id desc")                 // 默认排序，由节点执行
    .power(json!({"importable": true}))  // 开关功能，如 {"delete": false}
    .raw(json!({"layout": {"pageSize": 30}}))  // 其他 @Erupt 属性
    .data_proxy(ArticleProxy)            // 见 DataProxy
```

Rust 没有可供推断的类型注解，字段类型由构造函数显式决定：

| 构造函数 | 编辑类型 |
| --- | --- |
| `Field::pk()` | 整数主键（表格与表单中隐藏） |
| `Field::input(title)` | INPUT |
| `Field::textarea(title)` | TEXTAREA |
| `Field::number(title)` | NUMBER |
| `Field::boolean(title)` | BOOLEAN |
| `Field::date(title)` | DATE（`YYYY-MM-DD`） |
| `Field::date_time(title)` | DATE_TIME（`YYYY-MM-DDTHH:MM:SS.mmm`） |
| `Field::choice(title, &[(value, label)])` | CHOICE |
| `Field::multi_choice(title, &[(value, label)])` | MULTI_CHOICE |
| `Field::reference(&model, title)` | REFERENCE_TABLE；加 `.tree(pid)` 为 REFERENCE_TREE |
| `Field::checkbox` / `Field::tab_tree` / `Field::transfer(&model, title)` | CHECKBOX / TAB_TREE / TRANSFER，存为所选主键的 JSON 数组 |
| `Field::of(EditType::…, title)` | 任意类型：`Tags`、`AutoComplete`、`Attachment`、`HtmlEditor`、`Markdown`、`CodeEditor`、`Button`、`Color`、`Icon`、`Signature`、`Map`、`Hidden`、`Rate`、`Slider` 等 |

修饰方法：`.search()`、`.not_null()`、`.sortable()`、`.hide_table()`、`.hide_form()`、`.label(field)`、`.tree(pid)`；`.json()` 表示 JSON 数组 / 对象（如 MULTI_CHOICE、KEY_VALUE，SQL 存储中存为 JSON 文本）；`.transient()` 表示只出现在表单中的元素（DIVIDE、CALLOUT、EMPTY、GROUP），不读写存储。

### 原始注解属性

字段上的 `.edit(...)` / `.view(...)`、模型与操作上的 `.raw(...)` 接受 `json!` 或 `erupt::types` 中生成的类型（`Edit`、`View`、`Erupt`、`RowOperation` 等），并在 `build()` 时按 erupt 注解 JSON Schema 校验：拼错的键或枚举值返回 `Error::Declaration`，而不是在浏览器里静默失效。

```rust
.field("rating", Field::number("Rating").edit(json!({"type": "RATE", "rateType": {"count": 5, "allowHalf": true}})))
.field("meta", Field::textarea("Meta (JSON)").hide_table().edit(json!({"type": "CODE_EDITOR", "codeEditType": {"language": "json"}})))
```

记录类型是 `erupt::Record`（即 `serde_json::Map<String, Value>`），日期以文本表示：DATE 为 `YYYY-MM-DD`，DATE_TIME 为 `YYYY-MM-DDTHH:MM:SS.mmm`。

### 视图、树与钻取

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

- 视图的 `filter`（SQL 字符串或数组，按原样 AND）与 `orderBy` 是 SDK 专用键，由节点在读取该视图时执行，不进入 build；生成的 `types::Vis` 没有这两个字段，所以要用 `json!` 给出。与 `before_fetch` 一样需要 SQL 存储。
- `.raw(json!({"tree": {"id": "id", "label": "name", "pid": "parent"}}))` 把模型显示为树；`{"linkTree": {"field": "category"}}` 在表格旁显示引用字段的树（`"dependNode": true` 时未选节点不显示数据）。
- 钻取打开 `Book` 中 `author` 等于当前行 `id` 的记录（`link.column` 默认 `id`），`link.linkCondition` 按原样追加 SQL。两个模型都必须在同一节点上。

### 字段代码

字段可以挂自己的代码，由服务端通过节点的 `invoke` 接口携带表单值调用：

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

`fetch` 属于 CHOICE / MULTI_CHOICE，`fetch_tags`（返回 `Vec<String>`）属于 TAGS，`complete` 属于 AUTO_COMPLETE，`click` 属于 BUTTON，`onchange` 可用于任何字段；放在其他类型上 `build()` 会失败。返回 `Err(Error::fail(msg))` 可向用户提示。

## 引用

`Field::reference(&model, title)` 引用另一个已 `build()` 的模型（需注册在同一节点上）。存储里只保存被引用记录的主键，界面显示 `.label(field)`（默认 `name`）；标签、扁平列与树都由服务端解析。

```rust
.field("category", Field::reference(&category, "Category").search())   // 表格选择器
.field("topic", Field::reference(&category, "Topic").tree("parent"))   // 基于 Category.parent 的树选择器
```

依赖另一个字段的引用表格：`.edit(json!({"referenceTableType": {"dependField": "province", "dependColumn": "province"}}))`，服务端只列出 `dependColumn` 等于该字段值的记录。

## 行操作

```rust
let publish_form = Model::new("PublishForm", "Publish Options")   // 只做操作表单的模型无需主键，也不注册
    .field("publish_date", Field::date("Publish Date").not_null())
    .build()?;

// 在 Article 的构建器上：
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

- `OpContext` 提供 `op.rows`（选中的记录，BUTTON 模式为空）、`op.param`（表单值，无表单时为 `None`）、`op.repo`、`op.model`、`op.user`。
- `.mode(RowOperationMode::Single | Multi | MultiOnly | Button)`，默认 `Multi`。
- `.no_confirm()` 跳过确认框，`.confirm(text)` 替换确认文案；`.if_expr(js)` 是浏览器端针对 `item` 的表达式；`.tip(text)`、`.raw(...)` 透传其他 `@RowOperation` 属性。
- `.show(|user| ...)` 对不满足条件的用户隐藏操作，并拒绝其执行。

:::warning
处理器返回 `Ok(Some(script))` 时，脚本会作为 JavaScript 在浏览器中执行，只能返回你自己写的代码。返回 `Err(Error::fail(msg))` 向用户提示 `msg`。
:::

## DataProxy

与 Java 的 `DataProxy` 对应。实现 `erupt::DataProxy` trait 中需要的方法（其余均有默认实现），返回 `Err(Error::fail(msg))` 即以提示信息拒绝。

```rust
use erupt::{current_user, Cond, DataProxy, Error, Filter, Record};
use serde_json::json;

struct ArticleProxy;

impl DataProxy for ArticleProxy {
    fn add_behavior(&self, record: &mut Record) -> erupt::Result<()> {   // 新建表单的初始值
        record.insert("status".into(), json!("draft"));
        Ok(())
    }

    fn validate(&self, record: &Record) -> erupt::Result<()> {          // 每次新增与修改之前
        match record.get("title").and_then(|t| t.as_str()) {
            Some(t) if t.contains("spam") => Err(Error::fail("no spam")),
            _ => Ok(()),
        }
    }

    fn before_fetch(&self, _conditions: &[Cond]) -> erupt::Result<Option<Filter>> {  // 追加到 WHERE，参数绑定
        let uid = current_user().map(|u| u["uid"].clone()).unwrap_or_default();
        Ok(Some(Filter::new("owner = ?", vec![uid])))
    }
}

let article = Model::new("Article", "Article")
    .data_proxy(ArticleProxy)   // 可多次调用，按顺序执行
    // .field(...)
    .build()?;
```

| 钩子 | 触发时机 |
| --- | --- |
| `search_condition(condition)` | 构建模型时，搜索栏的默认值 |
| `before_fetch(conditions)` | 读取表格页之前，返回 `"sql".into()` 或 `Filter::new("sql ?", values)`，按原样 AND 到 WHERE；仅 SQL 存储支持，`MemoryRepository` 会拒绝 |
| `after_fetch(rows)` | 读取表格页之后 |
| `add_behavior(record)` | 打开新建表单时（`init-value`） |
| `edit_behavior(record)` | 按主键读取记录后（编辑表单、详情） |
| `validate(record)` | 新增或修改之前 |
| `before_add` / `after_add(record)` | `repository.add` 前后 |
| `before_update` / `after_update(record)` | `repository.update` 前后，参数为提交的值 |
| `before_delete` / `after_delete(record)` | `repository.delete` 前后，按存储中的记录逐条调用 |

## 存储

`Repository` trait（`bind`、`page`、`get`、`add`、`update`、`delete`）可以把模型放到任何存储上。内置：

- `MemoryRepository::new()` / `MemoryRepository::seeded(records)`：内存存储，用于测试与演示。
- `SqlRepository::new(executor, table, dialect)`：基于两个方法的 `SqlExecutor`，`Dialect` 决定占位符、引号与分页。

| 数据库 | feature | Executor | Dialect |
| --- | --- | --- | --- |
| SQLite | `sqlite` | `SqliteExecutor::open(path)`（`":memory:"` 为内存库） | `Dialect::Sqlite`，可用 `.auto_create()` |
| PostgreSQL | `postgres` | `PostgresExecutor::connect("host=… user=… dbname=…")`（无 TLS） | `Dialect::Postgres` |
| MySQL | `mysql` | `MysqlExecutor::connect("mysql://user@host:3306/db")`（连接池） | `Dialect::Mysql` |
| SQL Server 及其他 | — | 自行实现 `SqlExecutor` | `Dialect::Mssql`（SQL Server 2012+） |

各 Executor 也可以从已有连接构造：`SqliteExecutor::from(rusqlite::Connection)`、`PostgresExecutor::from(postgres::Client)`、`MysqlExecutor::from(mysql::Pool)`。

- 列名与字段名一致并加引号，所有值都是绑定参数，LIKE 使用 `ESCAPE '!'`；未指定排序时按主键升序返回。
- `.auto_create()` 只对 SQLite 建表；生产环境的表请自行创建。
- PostgreSQL Executor 会把参数转换为服务端报告的列类型（PostgreSQL 不接受把文本写入日期或整数列）。

自定义 SQL 驱动只需实现两个方法：

```rust
pub trait SqlExecutor: Send + Sync {
    fn query(&self, sql: &str, params: &[Value]) -> Result<Vec<Record>>;   // 以列名为键的行
    fn execute(&self, sql: &str, params: &[Value]) -> Result<()>;
}
```

自定义存储实现 `Repository`：`page(&Query) -> Result<(u64, Vec<Record>)>` 返回总数与当前页，`Query` 含 `conditions`、`sort`、`filters`、`offset`、`limit`。`filters` 来自视图 `filter` 与 `before_fetch`，存储必须执行它们，做不到就返回错误，不能忽略。

## 运行与部署

SDK 本身不读取环境变量，下面这些是示例程序的约定：

| 变量 | 含义 | 示例默认值 |
| --- | --- | --- |
| `ERUPT_NODE_NAME` | 节点名，与服务端「节点配置」一致 | `blog` |
| `ERUPT_ACCESS_TOKEN` | 节点的 access token | 必填 |
| `ERUPT_SERVER` | erupt 服务端地址 | `http://localhost:8080` |
| `PORT` | 节点监听端口 | `9090` |

`Node::new(name, access_token, servers)` 接受一个或多个服务端地址，注册与心跳在其间轮换；构建器方法：

- `.address(url)`：服务端访问节点的地址；省略时取连向第一个服务端的本机网卡地址（优先 IPv4），`node.auto_address(port)` 可查看推断结果。
- `.heartbeat_interval(Duration)`：注册心跳间隔，默认 15 秒。
- `.require_signature(true)`：拒绝未签名的调用，见 [签名与权限](#签名与权限)。
- `.power_source(|token, erupt| ...)`：自定义按用户权限的来源，用于测试或特殊部署；返回错误即拒绝所有权限。

`node.serve(host, port)` 运行内置服务（基于 `std::net` 的 HTTP/1.1 线程池，每个连接一个请求，请求头 64 KiB、请求体 16 MiB、超时 30 秒），先启动 HTTP（服务端注册时会探测 `/node-health`），再开始心跳；收到 SIGINT / SIGTERM 时注销节点后退出。

:::warning 回调服务端只支持 http
节点回调服务端（注册、按用户权限）使用明文 `http://`。服务端是 https 时，请在节点与服务端之间放一个终止 TLS 的代理。
:::

### 挂载到 axum 等框架

`Node::handle(&Request) -> Response` 与框架无关且是阻塞的，在异步运行时中请通过 `spawn_blocking` 调用。自行挂载时用 `start_heartbeat()` 注册，退出时调用 `deregister()`：

```rust
let node = Arc::new(node.address("http://10.0.0.12:9090"));
node.start_heartbeat();                  // 退出时调用 node.deregister()
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

挂载时必须设置 `.address(...)`：自行挂载的节点不会自动推断地址，未设置时注册会失败。

### 读取服务端配置

`node.config()` / `node.group_config()` 返回服务端为该节点及其分组设置的配置文本；`node.user_info()` 在处理请求的线程上返回当前用户的完整信息（角色、组织、岗位）。

## 签名与权限

- **调用来源**：带 `Origin` 头的请求直接返回 403，节点只接受服务端到节点的调用。
- **认证**：未签名的请求按常量时间比对 `Access-Token`；带 `Erupt-Signature` 的请求按 HMAC-SHA256（以 access token 为密钥，时间窗 300 秒）校验，通过后才信任 `Erupt-Enforced`。`.require_signature(true)` 拒绝所有未签名调用。签名算法在 `erupt::signature` 中公开（`sign`、`verify`）。
- **按用户权限**：节点用请求中的会话 token 调用服务端 `erupt-power`（或 `.power_source`），把结果与模型声明的 `power` 取交集（add、edit、delete、viewDetails、export、importable），缓存 5 秒；拿不到结果时全部拒绝。签名的 `Erupt-Enforced` 含 `power` 时跳过此回调。
- 尚未实现的功能（`print`、`ai`）的权限始终关闭；`.show(...)` 隐藏的行操作对该用户返回 403。

## 示例与一致性测试

- `examples/blog.rs`：[SHOWCASE](https://github.com/erupt-io/erupt-sdk/blob/main/SHOWCASE.md) 中的博客模型（Category、Article、Component），存于 SQLite 文件 `ERUPT_DB`（默认 `blog.db`）。

  ```bash
  ERUPT_ACCESS_TOKEN=... ERUPT_SERVER=http://localhost:8080 cargo run --features sqlite --example blog
  ```

- `examples/conformance.rs`：一致性测试夹具，由 `conformance/run.py` 扮演服务端运行：

  ```bash
  (cd rust && cargo build --release --example conformance) && python conformance/run.py -- rust/target/release/examples/conformance
  ```

- 单元测试：`cargo test --all-features`（真实数据库测试见 `tests/databases.rs`）。

## 能力边界

- 尚不支持：子表（`TAB_TABLE_*`）及其他嵌套模型、TPL 操作；`print` 与 `ai` 功能在界面上隐藏。
- `Field::of` 只接受 SDK 带有字段模板的类型；`Password`、`Tpl`、`TabTableRefer` / `TabTableAdd`、`MultiForm`、`Combine` 会在 `build()` 时报错。DIVIDE、CALLOUT、GROUP、KEY_VALUE 等通过 `.edit(json!({"type": ...}))` 声明。
- 字段类型需显式构造，模型必须 `build()`；API 为同步阻塞式。
- 回调服务端只支持 `http://`。
- 请求体不是 JSON 对象时按空对象处理。
- `before_fetch` 与视图 `filter` 需要 SQL 存储，`MemoryRepository` 会拒绝。
