# Ruby SDK

Declare models in Ruby and let the erupt server render them as admin pages. The SDK has zero gem dependencies and a node is itself a Rack application: run it on its built-in HTTP server, or mount it into Rails, Sinatra or any other Rack app. Models and data stay on the node; login, menus and permissions are handled by the erupt server.

> For an overview of all language SDKs see [Erupt SDK](/en/modules/erupt-sdk/); for the node protocol and the server see [Cloud Server](/en/modules/cloud-server).

## Requirements

| Language version | Runtime dependencies | Package | Version |
| --- | --- | --- | --- |
| Ruby 3.1+ | None (standard library only); SQL storage uses the driver gem of your choice | `erupt-sdk` (RubyGems) | 0.1.0 |

The server needs erupt **2.4.0+** with [erupt-cloud-server](/en/modules/cloud-server) enabled.

## Installation

```bash
gem install erupt-sdk
```

Or in a Gemfile:

```ruby
gem "erupt-sdk"
```

Straight from the repository, without RubyGems (Bundler):

```ruby
gem "erupt-sdk", git: "https://github.com/erupt-io/erupt-sdk", tag: "ruby/v0.1.0", glob: "ruby/*.gemspec"
```

You can also copy `ruby/lib/` (`erupt.rb` and the `erupt/` directory, including its `.json` files) onto your load path and `require "erupt"`.

:::warning Upgrading a copy
A copy does not update itself. When erupt changes the protocol or the annotation schema, replace the whole directory with the next release instead of merging by hand, and leave `Erupt::VERSION` untouched so the server shows which release the node runs.
:::

## Quick Start

A trimmed version of `examples/blog.rb` (the full blog model is described in [Examples and Conformance](#examples-and-conformance)):

```ruby
require "date"
require "erupt"

class Category
  extend Erupt::Model
  erupt "Category"
  field :id, pk: true
  field :name, "Name", search: true, not_null: true, sortable: true
  field :parent, "Parent Id", Integer
end

class Article
  extend Erupt::Model
  erupt "Article", order_by: "id desc"
  field :id, pk: true
  field :title, "Title", search: true, not_null: true, sortable: true, edit: { inputType: { length: 60 } }
  field :category, "Category", Category, search: true
  field :topic, "Topic", Category, tree: :parent, table: false
  field :status, "Status", choices: { draft: "Draft", review: "In Review", published: "Published" }, search: true
  field :featured, "Featured", :boolean, search: true
  field :publish_date, "Publish Date", Date, search: true

  operation :feature, "Feature", mode: Erupt::RowOperationMode::SINGLE, icon: "fa fa-star",
                                 confirm: "Feature this article on the home page?" do |op|
    op.repo.update(op.rows.first["id"], featured: true)
  end
end

node = Erupt::Node.new(ENV.fetch("ERUPT_NODE_NAME", "blog"), ENV.fetch("ERUPT_ACCESS_TOKEN"),
                       ENV.fetch("ERUPT_SERVER", "http://localhost:8080"))
node.register(Category, Erupt::MemoryRepository.new)
node.register(Article, Erupt::MemoryRepository.new)
node.serve(port: Integer(ENV.fetch("PORT", "9090")))
```

Then, on the server:

1. In [Cloud Server](/en/modules/cloud-server), create node `blog` under Node Config and copy its access token.
2. Add a menu of type `table` with value `blog.Article` (and `blog.Category`), i.e. `<node>.<Model>`.
3. Run the node: `ERUPT_ACCESS_TOKEN=... ruby app.rb`. The server must reach it at `http://<node ip>:9090`; otherwise pass `address:`, see [Running and Deploying](#running-and-deploying).

## Declaring Models

A class becomes a model with `extend Erupt::Model`; `erupt` declares the model, `field` its fields and `operation` its row operations.

```ruby
erupt "Article", order_by: "id desc", power: { importable: true }, layout: { pageSize: 30 }
```

- The first argument is the title; `name:` defaults to the class name and is what the server addresses (menu value `<node>.<name>`).
- `power:` switches features off, e.g. `{ delete: false }`; `order_by:` is the default table order (`"views desc, id"`), applied by the node.
- `data_proxy:` see [DataProxy](#dataproxy); any other keyword is a raw `@Erupt` attribute merged onto the defaults.

`field name, title, kind, **options` infers the edit type from `kind`; `type:` overrides it:

| Ruby type (`kind`) | Edit type |
| --- | --- |
| `String` or nothing | INPUT |
| `Integer` / `Float` (any `Numeric`) | NUMBER |
| `:boolean` | BOOLEAN |
| `Date` | DATE |
| `Time` / `DateTime` | DATE_TIME (DATE with a time picker) |
| with `choices:` | CHOICE |
| `Array` + `choices:` | MULTI_CHOICE (stored as a JSON array) |
| `Array` / `Hash` | a JSON value (e.g. KEY_VALUE), stored as JSON text by SQL repositories |
| another model class | REFERENCE_TABLE; with `tree:` REFERENCE_TREE, see [References](#references) |

Common options: `pk:`, `search:`, `not_null:`, `sortable:`, `table: false` (hidden from the table), `form: false` (hidden from the form), `virtual: true` (a form-only element such as DIVIDE, CALLOUT, EMPTY or GROUP, never read or written).

`type:` also takes `TAGS`, `AUTO_COMPLETE`, `ATTACHMENT` (the erupt server stores the upload, the node keeps its path), `HTML_EDITOR`, `MARKDOWN`, `CODE_EDITOR`, `BUTTON` (form only), and `CHECKBOX` / `TAB_TREE` / `TRANSFER` with `ref:` (stored as the JSON list of the picked keys). Every enum value has a constant, e.g. `Erupt::EditType::TEXTAREA`, `Erupt::RowOperationMode::SINGLE`.

### Raw annotation attributes

`view: {...}` / `edit: {...}` on a field and extra keywords on `erupt` pass through as annotation attributes and are validated against erupt's annotation JSON Schema when the model loads: a misspelt key or enum value fails at startup instead of silently doing nothing in the browser.

```ruby
field :rating, "Rating", Float, sortable: true, edit: { type: "RATE", rateType: { count: 5, allowHalf: true } }
field :meta, "Meta (JSON)", table: false, edit: { type: "CODE_EDITOR", codeEditType: { language: "json" } }
field :publish_date, "Publish Date", Date, search: true, edit: { search: { operator: "RANGE" } }
```

Records are hashes keyed by field name (`row["title"]`); hashes handed to a repository may use symbol keys.

### Views, trees and drills

```ruby
class Task
  extend Erupt::Model
  erupt "Task", vis: [
    { title: "Board", type: "BOARD", boardView: { groupField: "status" }, filter: "archived = 0" },
    { title: "Recent", type: "TABLE", orderBy: "created desc" }
  ]
end

erupt "Author", drills: [{ title: "Books", link: { linkErupt: "Book", joinColumn: "author" } }]
```

- A `vis:` entry's `filter` (one SQL string or an array, ANDed as written) and `orderBy` are applied by the node when that view is read and kept out of the build; like `before_fetch`, a filter needs a SQL repository. Dragging on a board, calendar or gantt view is saved by the server through the node's `get` / `update`.
- `tree: { id: "id", label: "name", pid: "parent" }` shows the model as a tree; `linkTree: { field: "category" }` puts the tree of a reference field beside the table (`dependNode: true` shows no rows until a node is picked). `linkTree.field` must be a reference field.
- `drills:` opens `Book` filtered to the rows whose `author` holds the current row's `id` (`link.column`, `id` by default); `link.linkCondition` adds SQL as written. Both models must be on the node.

### Field code

A field can run its own code; the server calls it through the node's `invoke` endpoint with the form's values:

```ruby
class Order
  extend Erupt::Model
  erupt "Order"
  field :id, pk: true
  field :status, "Status", fetch: ->(form) { { new: "New", paid: "Paid" } }
  field :qty, "Qty", Integer, onchange: ->(form) { { formData: { total: form["qty"] * 9 }, editExpr: {} } }
  field :city, "City", type: Erupt::EditType::AUTO_COMPLETE, complete: ->(form, typed) { lookup(typed) }
  field :total, "Total", Float
  field :recalc, "Recalc", type: Erupt::EditType::BUTTON, click: ->(form) { { eval: "alert('done')", formData: {} } }
end
```

`fetch` belongs to CHOICE / MULTI_CHOICE (`{ value => label }` or pairs) and TAGS (an array), `complete` to AUTO_COMPLETE, `click` to BUTTON, and `onchange` to any field; anywhere else it fails at declaration. Raise `Erupt::Fail` to refuse with a message.

## References

Pass another model class (declared earlier and registered on the same node) as the `kind`. The repository stores the referenced primary key and the UI shows `label:` (default `name`); the server resolves labels, flattened columns and trees.

```ruby
class Article
  # ...
  field :category, "Category", Category, search: true   # table picker
  field :topic, "Topic", Category, tree: :parent         # tree picker over Category.parent
end
```

A reference table depending on another field: `edit: { referenceTableType: { dependField: "province", dependColumn: "province" } }`; the server keeps the picked model's rows whose `dependColumn` holds that field's value.

## Row Operations

```ruby
class PublishForm                        # a form-only model needs no primary key and is not registered
  extend Erupt::Model
  erupt "Publish Options"
  field :publish_date, "Publish Date", Date, not_null: true
end

class Article
  # ...
  operation :publish, "Publish", icon: "fa fa-paper-plane", form: PublishForm, if_expr: "item.status !== 'published'" do |op|
    op.rows.each { |row| op.repo.update(row["id"], status: "published", publish_date: op.param["publish_date"]) }
  end
end
```

- The block gets `op.rows` (selected records; empty in BUTTON mode), `op.param` (form values, `nil` without a form), `op.repo`, `op.model` and `op.user`.
- `mode:` is `SINGLE`, `MULTI` (default), `MULTI_ONLY` or `BUTTON`.
- `confirm: false` skips the confirm dialog, a string replaces its text; `if_expr:` is browser-side JavaScript over `item` that disables the row button.
- `show: ->(user) { ... }` hides the operation from other users and refuses to run it for them.
- Other keywords pass through as raw `@RowOperation` attributes.

:::warning
A string returned from the block is executed as JavaScript in the browser, so return only code you wrote. Raise `Erupt::Fail` to show the user a message.
:::

## DataProxy

Hooks around a model's reads and writes, as erupt's Java `DataProxy`. Subclass `Erupt::DataProxy` and override what you need; raise `Erupt::Fail` to refuse with a message the user sees.

```ruby
class ArticleProxy < Erupt::DataProxy
  def add_behavior(record)               # the new form's values
    record["status"] = "draft"
  end

  def validate(record)                   # before every add and update
    raise Erupt::Fail, "no spam" if record["title"].to_s.include?("spam")
  end

  def before_fetch(conditions)           # SQL ANDed to the table's WHERE, values bound
    ["owner = ?", [Erupt.current_user["uid"]]]
  end
end

class Article
  extend Erupt::Model
  erupt "Article", data_proxy: ArticleProxy   # one or an array, classes or instances, run in order
end
```

| Hook | Runs |
| --- | --- |
| `search_condition(condition)` | building the model: default values of the search bar |
| `before_fetch(conditions)` | before a table page is read: `"sql"` or `["sql ?", [values]]`, ANDed to its WHERE as written; SQL repositories only, `MemoryRepository` refuses it |
| `after_fetch(rows)` | after a table page is read |
| `add_behavior(record)` | for the new record form (`init-value`) |
| `edit_behavior(record)` | after a record is read by its key (edit form, detail view) |
| `validate(record)` | before an add or an update |
| `before_add` / `after_add(record)` | around `repository.add` |
| `before_update` / `after_update(record)` | around `repository.update`, with the submitted values |
| `before_delete` / `after_delete(record)` | around `repository.delete`, once per record as stored |

## Storage

Storage is any `Erupt::Repository` subclass implementing `page`, `get`, `add`, `update` and `delete`. Two ship with the SDK:

- `Erupt::MemoryRepository`: in memory, for tests and demos; takes seed records, `MemoryRepository.new([{ name: "Tech" }])`.
- `Erupt::SqlRepository.new(executor, table, auto_create: false)`: PostgreSQL, MySQL or SQLite. The SDK depends on no driver; an `Erupt::SqlExecutor` runs each statement with bound values on the driver you hand it.

```ruby
require "pg"                                  # PostgreSQL (pg gem)
repo = Erupt::SqlRepository.new(Erupt::SqlExecutor.pg(PG.connect(ENV.fetch("DATABASE_URL"))), "article")

require "mysql2"                              # MySQL (mysql2 gem; statements are prepared)
repo = Erupt::SqlRepository.new(Erupt::SqlExecutor.mysql2(Mysql2::Client.new(**MYSQL)), "article")

require "sqlite3"                             # SQLite (sqlite3 gem)
repo = Erupt::SqlRepository.new(Erupt::SqlExecutor.sqlite3(SQLite3::Database.new("blog.db")), "article", auto_create: true)

require "connection_pool"                     # pooled: anything with `with` lends a connection per statement
repo = Erupt::SqlRepository.new(Erupt::SqlExecutor.pg(ConnectionPool.new(size: 5) { PG.connect(DSN) }), "article")

# any other library: a block that runs (sql, params) and returns rows as hashes keyed by column name;
# the dialect is :sqlite, :postgres or :mysql
executor = Erupt::SqlExecutor.new(:postgres) do |sql, params|
  ActiveRecord::Base.connection_pool.with_connection { |c| c.raw_connection.exec_params(sql, params).to_a }
end
```

- Columns are named like the fields (quoted, so case sensitive on PostgreSQL); every value is a bound parameter; LIKE escapes with `ESCAPE '!'`.
- `auto_create: true` creates SQLite tables only; create production tables yourself.
- A single connection is used by one thread at a time. Without a sort, rows come back by primary key ascending.
- `Erupt.current_user` returns the acting user inside a repository call.

A custom repository:

```ruby
class MyRepository < Erupt::Repository
  def page(query)          # query.conditions / sort / filters / offset / limit
    [total, records]       # the total and the records of this page
  end

  def get(pk); end         # a record hash, or nil
  def add(record); end
  def update(pk, record); end
  def delete(pks); end
end
```

`query.filters` come from view filters and `before_fetch`; a repository must apply them or raise, never ignore them.

## Running and Deploying

The SDK reads no environment variables itself; these are the convention of the examples:

| Variable | Meaning | Example default |
| --- | --- | --- |
| `ERUPT_NODE_NAME` | node name, as created under Node Config | `blog` |
| `ERUPT_ACCESS_TOKEN` | the node's access token | required |
| `ERUPT_SERVER` | the erupt server URL | `http://localhost:8080` |
| `PORT` | port the node listens on | `9090` |

`Erupt::Node.new(name, access_token, servers, address: nil, heartbeat: 15, require_signature: false, logger: nil)`:

- `servers` is one URL or an array; registration and heartbeats rotate across them.
- `address:` is where the server reaches the node. Without it the node guesses `http://<ip>:<port>` from the local interface used to reach the first server; set it explicitly behind containers or NAT.
- `heartbeat:` is the registration interval in seconds; `logger:` takes `Rails.logger` or any logger, stderr by default.

`node.serve(host: "0.0.0.0", port: 9090)` runs the built-in threaded HTTP/1.1 server (keep-alive, chunked request bodies): HTTP first (the server probes `/node-health` while registering), then the heartbeat. On SIGINT / SIGTERM it deregisters before exiting.

### Mounting in Rack / Rails

A node implements `call(env)`, so it can live inside any Rack server and share the application's port. Call `start(port:)` to register (with the port the server reaches it on) and `stop` to deregister:

```ruby
# config/initializers/erupt.rb
ERUPT_NODE = Erupt::Node.new("blog", ENV.fetch("ERUPT_ACCESS_TOKEN"), ENV.fetch("ERUPT_SERVER"), logger: Rails.logger)
ERUPT_NODE.register(Article, repo)
ERUPT_NODE.start(port: 3000)
at_exit { ERUPT_NODE.stop }

# config/routes.rb: mount at the root, the server calls /erupt-api/... and /node-health
mount ERUPT_NODE, at: "/"
```

### Server config and user info

`node.config` and `node.group_config` return the config text set for the node and its group on the server; `node.user_info` returns the acting user's full info (roles, org, post) while a request is served.

## Signatures and Power

- **Origin**: a request carrying an `Origin` header gets 403; a node only answers server-to-server calls.
- **Authentication**: an unsigned call must carry the `Access-Token`, compared in constant time. A call with `Erupt-Signature` is verified as HMAC-SHA256 keyed by the access token, within a 300-second window, and only then is `Erupt-Enforced` trusted. `require_signature: true` refuses every unsigned call.
- **Per-user power**: the node asks the server's `erupt-power` with the request's session token and ANDs the answer onto the model's declared `power` (add, edit, delete, viewDetails, export, importable), cached for 5 seconds; if the server cannot be reached, nothing is allowed. When a signed `Erupt-Enforced` lists `power`, the callback is skipped.
- Features the SDK does not serve yet (`print`, `ai`) are always off; a row operation hidden by `show:` answers 403 to that user.

## Examples and Conformance

- `examples/blog.rb`: the blog model of [SHOWCASE](https://github.com/erupt-io/erupt-sdk/blob/main/SHOWCASE.md) (Category, Article, Component). With the `sqlite3` gem installed records live in `ERUPT_DB` (default `blog.db`), otherwise in memory.

  ```bash
  ERUPT_NODE_NAME=blog ERUPT_ACCESS_TOKEN=... ERUPT_SERVER=http://localhost:8080 ruby examples/blog.rb
  ```

- `examples/conformance.rb`: the conformance fixture, run with `conformance/run.py` playing the server:

  ```bash
  python conformance/run.py -- ruby ruby/examples/conformance.rb
  ```

- Unit tests: `ruby -Ilib -e 'Dir["./test/test_*.rb"].each { |f| require f }'` (SQLite cases run where the `sqlite3` gem is installed; `ERUPT_TEST_DATABASES=1` with the `pg` and `mysql2` gems runs the real-database tests).

## Limitations

- Not yet: sub-tables (`TAB_TABLE_*`) and other nested models, TPL operations, i18n of messages; `print` and `ai` are hidden in the UI.
- `type:` takes only the types the SDK has a field template for; `PASSWORD`, `TPL`, `TAB_TABLE_REFER` / `TAB_TABLE_ADD`, `MULTI_FORM` and `COMBINE` fail at declaration. DIVIDE, CALLOUT, GROUP, KEY_VALUE and the like are declared through `edit: { type: ... }`.
- Trees, file upload and Excel import / export are done by the erupt server.
- `before_fetch` and view filters need a SQL repository; `MemoryRepository` refuses them.
