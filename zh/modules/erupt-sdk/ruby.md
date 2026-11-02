# Ruby SDK

用 Ruby 声明模型，由 erupt 服务端渲染成管理页面。SDK 零 gem 依赖，节点本身就是一个 Rack 应用：既可以用内置的 HTTP 服务单独运行，也可以挂进 Rails、Sinatra 等现有应用；模型和数据留在节点上，登录、菜单与权限由 erupt 服务端负责。

> 多语言 SDK 总览见 [Erupt SDK](/zh/modules/erupt-sdk/)，节点协议与服务端见 [Cloud Server](/zh/modules/cloud-server)。

## 环境要求

| 语言版本 | 运行时依赖 | 包名 | 版本 |
| --- | --- | --- | --- |
| Ruby 3.1+ | 无（仅标准库）；SQL 存储使用你自己选择的驱动 gem | `erupt-sdk`（RubyGems） | 0.1.0 |

服务端需要 erupt **2.4.0+** 并启用 [erupt-cloud-server](/zh/modules/cloud-server)。

## 安装

```bash
gem install erupt-sdk
```

或写入 Gemfile：

```ruby
gem "erupt-sdk"
```

不经过 RubyGems，直接从仓库引用（Bundler）：

```ruby
gem "erupt-sdk", git: "https://github.com/erupt-io/erupt-sdk", tag: "ruby/v0.1.0", glob: "ruby/*.gemspec"
```

也可以把 `ruby/lib/`（`erupt.rb` 与 `erupt/` 目录，包括其中的 `.json` 文件）复制到加载路径后 `require "erupt"`。

:::warning 复制源码的升级方式
复制的代码不会自动更新。erupt 的协议或注解 Schema 变化后，请用新版本整目录替换，不要手工合并；也不要改动 `Erupt::VERSION`，服务端靠它显示节点运行的版本。
:::

## 快速开始

下面是 `examples/blog.rb` 的精简版（完整的博客模型见 [示例与一致性测试](#示例与一致性测试)）：

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

然后在服务端完成三步：

1. 在 [Cloud Server](/zh/modules/cloud-server) 的「节点配置」中新建节点 `blog`，复制它的 access token。
2. 新增 `table` 类型的菜单，值为 `blog.Article`（以及 `blog.Category`），即 `<节点名>.<模型名>`。
3. 运行节点：`ERUPT_ACCESS_TOKEN=... ruby app.rb`。服务端必须能访问 `http://<节点 IP>:9090`，否则通过 `address:` 指定地址，见 [运行与部署](#运行与部署)。

## 声明模型

类通过 `extend Erupt::Model` 成为模型，`erupt` 声明模型本身，`field` 声明字段，`operation` 声明行操作。

```ruby
erupt "Article", order_by: "id desc", power: { importable: true }, layout: { pageSize: 30 }
```

- 第一个参数是标题；`name:` 默认为类名，是服务端寻址用的名字（菜单值 `<节点>.<name>`）。
- `power:` 开关功能，如 `{ delete: false }`；`order_by:` 是默认排序（`"views desc, id"`），由节点执行。
- `data_proxy:` 见 [DataProxy](#dataproxy)；其余关键字作为原始 `@Erupt` 属性合并到默认值上。

`field name, title, kind, **options` 按 `kind` 推断编辑类型，`type:` 可覆盖：

| Ruby 类型（`kind`） | 编辑类型 |
| --- | --- |
| `String` 或省略 | INPUT |
| `Integer` / `Float`（任何 `Numeric`） | NUMBER |
| `:boolean` | BOOLEAN |
| `Date` | DATE |
| `Time` / `DateTime` | DATE_TIME（带时间选择的 DATE） |
| 带 `choices:` | CHOICE |
| `Array` + `choices:` | MULTI_CHOICE（存为 JSON 数组） |
| `Array` / `Hash` | JSON 值（如 KEY_VALUE），SQL 存储中存为 JSON 文本 |
| 另一个模型类 | REFERENCE_TABLE；加 `tree:` 为 REFERENCE_TREE，见 [引用](#引用) |

常用选项：`pk:`、`search:`、`not_null:`、`sortable:`、`table: false`（不在表格显示）、`form: false`（不在表单显示）、`virtual: true`（只出现在表单中的元素，如 DIVIDE、CALLOUT、EMPTY、GROUP，不读写存储）。

`type:` 还接受 `TAGS`、`AUTO_COMPLETE`、`ATTACHMENT`（上传由 erupt 服务端保存，节点只存路径）、`HTML_EDITOR`、`MARKDOWN`、`CODE_EDITOR`、`BUTTON`（仅表单），以及配合 `ref:` 的 `CHECKBOX` / `TAB_TREE` / `TRANSFER`（存为所选记录主键的 JSON 数组）。枚举值都有常量，如 `Erupt::EditType::TEXTAREA`、`Erupt::RowOperationMode::SINGLE`。

### 原始注解属性

字段上的 `view: {...}` / `edit: {...}` 以及 `erupt` 上的多余关键字会原样透传为注解属性，并在模型加载时按 erupt 的注解 JSON Schema 校验：拼错的键或枚举值会在启动时报错，而不是在浏览器里静默失效。

```ruby
field :rating, "Rating", Float, sortable: true, edit: { type: "RATE", rateType: { count: 5, allowHalf: true } }
field :meta, "Meta (JSON)", table: false, edit: { type: "CODE_EDITOR", codeEditType: { language: "json" } }
field :publish_date, "Publish Date", Date, search: true, edit: { search: { operator: "RANGE" } }
```

记录是以字段名为键的 Hash（`row["title"]`），交给存储的 Hash 也可以用 Symbol 键。

### 视图、树与钻取

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

- `vis:` 的 `filter`（SQL 字符串或数组，按原样 AND）与 `orderBy` 由节点在读取该视图时执行，不进入 build；与 `before_fetch` 一样需要 SQL 存储。看板、日历、甘特图上的拖拽由服务端通过节点的 `get` / `update` 保存。
- `tree: { id: "id", label: "name", pid: "parent" }` 把模型显示为树；`linkTree: { field: "category" }` 在表格旁显示引用字段的树（`dependNode: true` 时未选节点不显示数据），`linkTree.field` 必须是引用字段。
- `drills:` 打开 `Book` 中 `author` 等于当前行 `id` 的记录（`link.column` 默认 `id`），`link.linkCondition` 按原样追加 SQL。两个模型都必须在同一节点上。

### 字段代码

字段可以挂自己的代码，由服务端通过节点的 `invoke` 接口携带表单值调用：

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

`fetch` 属于 CHOICE / MULTI_CHOICE（返回 `{ 值 => 标签 }` 或数组对）和 TAGS（返回数组），`complete` 属于 AUTO_COMPLETE，`click` 属于 BUTTON，`onchange` 可用于任何字段；放在其他类型上会在声明时报错。抛出 `Erupt::Fail` 可向用户返回提示。

## 引用

把另一个模型类（先声明、并注册在同一节点上）作为 `kind`。存储里只保存被引用记录的主键，界面显示 `label:`（默认 `name`）；标签、扁平列与树都由服务端解析。

```ruby
class Article
  # ...
  field :category, "Category", Category, search: true   # 表格选择器
  field :topic, "Topic", Category, tree: :parent         # 基于 Category.parent 的树选择器
end
```

依赖另一个字段的引用表格：`edit: { referenceTableType: { dependField: "province", dependColumn: "province" } }`，服务端只列出 `dependColumn` 等于该字段值的记录。

## 行操作

```ruby
class PublishForm                        # 只做操作表单的模型可以没有主键，也无需注册
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

- 块参数 `op` 提供 `op.rows`（选中的记录，BUTTON 模式为空）、`op.param`（表单值，无表单时为 `nil`）、`op.repo`、`op.model`、`op.user`。
- `mode:` 可选 `SINGLE`、`MULTI`（默认）、`MULTI_ONLY`、`BUTTON`。
- `confirm: false` 跳过确认框，字符串则替换确认文案；`if_expr:` 是浏览器端针对 `item` 的表达式，用于禁用行按钮。
- `show: ->(user) { ... }` 对不满足条件的用户隐藏操作，并拒绝其执行。
- 其余关键字作为原始 `@RowOperation` 属性透传。

:::warning
块返回的字符串会作为 JavaScript 在浏览器中执行，只能返回你自己写的代码。需要提示用户时抛出 `Erupt::Fail`。
:::

## DataProxy

与 Java 的 `DataProxy` 对应，在模型读写前后挂钩子。继承 `Erupt::DataProxy`，只覆盖需要的方法；抛出 `Erupt::Fail` 即以提示信息拒绝。

```ruby
class ArticleProxy < Erupt::DataProxy
  def add_behavior(record)               # 新建表单的初始值
    record["status"] = "draft"
  end

  def validate(record)                   # 每次新增与修改之前
    raise Erupt::Fail, "no spam" if record["title"].to_s.include?("spam")
  end

  def before_fetch(conditions)           # 追加到表格 WHERE 的 SQL，参数绑定
    ["owner = ?", [Erupt.current_user["uid"]]]
  end
end

class Article
  extend Erupt::Model
  erupt "Article", data_proxy: ArticleProxy   # 一个或数组，类或实例均可，按顺序执行
end
```

| 钩子 | 触发时机 |
| --- | --- |
| `search_condition(condition)` | 构建模型时，搜索栏的默认值 |
| `before_fetch(conditions)` | 读取表格页之前，返回 `"sql"` 或 `["sql ?", [values]]`，按原样 AND 到 WHERE；仅 SQL 存储支持，`MemoryRepository` 会拒绝 |
| `after_fetch(rows)` | 读取表格页之后 |
| `add_behavior(record)` | 打开新建表单时（`init-value`） |
| `edit_behavior(record)` | 按主键读取记录后（编辑表单、详情） |
| `validate(record)` | 新增或修改之前 |
| `before_add` / `after_add(record)` | `repository.add` 前后 |
| `before_update` / `after_update(record)` | `repository.update` 前后，参数为提交的值 |
| `before_delete` / `after_delete(record)` | `repository.delete` 前后，按存储中的记录逐条调用 |

## 存储

存储是任意 `Erupt::Repository` 子类，实现 `page`、`get`、`add`、`update`、`delete` 五个方法。内置两种：

- `Erupt::MemoryRepository`：内存存储，用于测试与演示，可传入初始记录 `MemoryRepository.new([{ name: "Tech" }])`。
- `Erupt::SqlRepository.new(executor, table, auto_create: false)`：PostgreSQL、MySQL、SQLite。SDK 不依赖任何驱动，`Erupt::SqlExecutor` 在你提供的驱动上执行带绑定参数的语句。

```ruby
require "pg"                                  # PostgreSQL（pg gem）
repo = Erupt::SqlRepository.new(Erupt::SqlExecutor.pg(PG.connect(ENV.fetch("DATABASE_URL"))), "article")

require "mysql2"                              # MySQL（mysql2 gem，语句预编译）
repo = Erupt::SqlRepository.new(Erupt::SqlExecutor.mysql2(Mysql2::Client.new(**MYSQL)), "article")

require "sqlite3"                             # SQLite（sqlite3 gem）
repo = Erupt::SqlRepository.new(Erupt::SqlExecutor.sqlite3(SQLite3::Database.new("blog.db")), "article", auto_create: true)

require "connection_pool"                     # 连接池：任何带 with 的对象，每条语句借一个连接
repo = Erupt::SqlRepository.new(Erupt::SqlExecutor.pg(ConnectionPool.new(size: 5) { PG.connect(DSN) }), "article")

# 其他库：一个执行 (sql, params) 并返回以列名为键的 Hash 数组的块；方言为 :sqlite / :postgres / :mysql
executor = Erupt::SqlExecutor.new(:postgres) do |sql, params|
  ActiveRecord::Base.connection_pool.with_connection { |c| c.raw_connection.exec_params(sql, params).to_a }
end
```

- 列名与字段名一致（带引号，PostgreSQL 区分大小写），所有值都是绑定参数，LIKE 使用 `ESCAPE '!'`。
- `auto_create: true` 只创建 SQLite 表；生产环境的表请自行创建。
- 单个连接同一时刻只被一个线程使用；未指定排序时按主键升序返回。
- 存储内部可用 `Erupt.current_user` 获取当前用户。

自定义存储：

```ruby
class MyRepository < Erupt::Repository
  def page(query)          # query.conditions / sort / filters / offset / limit
    [total, records]       # 总数与当前页记录
  end

  def get(pk); end         # 返回记录 Hash 或 nil
  def add(record); end
  def update(pk, record); end
  def delete(pks); end
end
```

`query.filters` 来自视图 `filter` 与 `before_fetch`，存储必须执行它们，做不到就抛出异常，不能忽略。

## 运行与部署

SDK 本身不读取环境变量，下面这些是示例程序的约定：

| 变量 | 含义 | 示例默认值 |
| --- | --- | --- |
| `ERUPT_NODE_NAME` | 节点名，与服务端「节点配置」一致 | `blog` |
| `ERUPT_ACCESS_TOKEN` | 节点的 access token | 必填 |
| `ERUPT_SERVER` | erupt 服务端地址 | `http://localhost:8080` |
| `PORT` | 节点监听端口 | `9090` |

`Erupt::Node.new(name, access_token, servers, address: nil, heartbeat: 15, require_signature: false, logger: nil)`：

- `servers` 可以是一个地址或数组，注册与心跳在多个服务端之间轮换。
- `address:` 是服务端访问节点的地址；省略时按连向第一个服务端的本机网卡 IP 自动推断（`http://<ip>:<port>`）。容器、NAT 等场景请显式指定。
- `heartbeat:` 是注册心跳间隔（秒）；`logger:` 可传 `Rails.logger` 等，默认输出到 stderr。

`node.serve(host: "0.0.0.0", port: 9090)` 运行内置的多线程 HTTP/1.1 服务（支持 keep-alive 与 chunked 请求体），先启动 HTTP（服务端注册时会探测 `/node-health`），再开始心跳；收到 SIGINT / SIGTERM 时注销节点后退出。

### 挂载到 Rack / Rails

节点实现了 `call(env)`，可以挂进任何 Rack 服务器，与现有应用共用端口。此时用 `start(port:)` 注册（传入服务端访问到的端口），`stop` 注销：

```ruby
# config/initializers/erupt.rb
ERUPT_NODE = Erupt::Node.new("blog", ENV.fetch("ERUPT_ACCESS_TOKEN"), ENV.fetch("ERUPT_SERVER"), logger: Rails.logger)
ERUPT_NODE.register(Article, repo)
ERUPT_NODE.start(port: 3000)
at_exit { ERUPT_NODE.stop }

# config/routes.rb：挂在根路径，服务端会调用 /erupt-api/... 与 /node-health
mount ERUPT_NODE, at: "/"
```

### 读取服务端配置

`node.config` / `node.group_config` 返回服务端为该节点及其分组设置的配置文本；`node.user_info` 在处理请求期间返回当前用户的完整信息（角色、组织、岗位）。

## 签名与权限

- **调用来源**：带 `Origin` 头的请求直接返回 403，节点只接受服务端到节点的调用。
- **认证**：未签名的请求按常量时间比对 `Access-Token`；带 `Erupt-Signature` 的请求按 HMAC-SHA256（以 access token 为密钥，时间窗 300 秒）校验，通过后才信任 `Erupt-Enforced`。`require_signature: true` 拒绝所有未签名调用。
- **按用户权限**：节点用请求中的会话 token 调用服务端 `erupt-power`，把结果与模型声明的 `power` 取交集（add、edit、delete、viewDetails、export、importable），缓存 5 秒；服务端不可达时全部拒绝。签名的 `Erupt-Enforced` 含 `power` 时跳过此回调。
- 尚未实现的功能（`print`、`ai`）的权限始终关闭；`show:` 隐藏的行操作对该用户返回 403。

## 示例与一致性测试

- `examples/blog.rb`：[SHOWCASE](https://github.com/erupt-io/erupt-sdk/blob/main/SHOWCASE.md) 中的博客模型（Category、Article、Component）。安装了 `sqlite3` gem 时数据存入 `ERUPT_DB`（默认 `blog.db`），否则存于内存。

  ```bash
  ERUPT_NODE_NAME=blog ERUPT_ACCESS_TOKEN=... ERUPT_SERVER=http://localhost:8080 ruby examples/blog.rb
  ```

- `examples/conformance.rb`：一致性测试夹具，由 `conformance/run.py` 扮演服务端运行：

  ```bash
  python conformance/run.py -- ruby ruby/examples/conformance.rb
  ```

- 单元测试：`ruby -Ilib -e 'Dir["./test/test_*.rb"].each { |f| require f }'`（安装了 `sqlite3` gem 时运行 SQLite 用例；设置 `ERUPT_TEST_DATABASES=1` 并安装 `pg`、`mysql2` 时运行真实数据库测试）。

## 能力边界

- 尚不支持：子表（`TAB_TABLE_*`）及其他嵌套模型、TPL 操作、消息国际化；`print` 与 `ai` 功能在界面上隐藏。
- `type:` 只接受 SDK 带有字段模板的类型；`PASSWORD`、`TPL`、`TAB_TABLE_REFER` / `TAB_TABLE_ADD`、`MULTI_FORM`、`COMBINE` 会在声明时报错。DIVIDE、CALLOUT、GROUP、KEY_VALUE 等通过 `edit: { type: ... }` 声明。
- 树、文件上传与 Excel 导入导出由 erupt 服务端完成。
- `before_fetch` 与视图 `filter` 需要 SQL 存储，`MemoryRepository` 会拒绝。
