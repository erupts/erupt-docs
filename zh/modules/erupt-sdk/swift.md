# Swift SDK

用 Swift 的结果构建器声明模型，由 erupt 服务端渲染成管理页面。`EruptSDK` 库只依赖 Foundation（自带 HTTP 服务、JSON 与 HMAC-SHA256），可选的 `EruptSQLite` 产品通过系统 libsqlite3 提供 SQLite 存储；`Node.handle(_:)` 与框架无关，可挂进 Vapor、Hummingbird。模型和数据留在节点上，登录、菜单与权限由 erupt 服务端负责。

> 多语言 SDK 总览见 [Erupt SDK](/zh/modules/erupt-sdk/)，节点协议与服务端见 [Cloud Server](/zh/modules/cloud-server)。

## 环境要求

| 语言版本 | 运行时依赖 | 包名 | 版本 |
| --- | --- | --- | --- |
| Swift 5.9+（macOS 13+ / Linux） | 仅 Foundation；`EruptSQLite` 需要系统 libsqlite3 | `EruptSDK`、`EruptSQLite`（SwiftPM，`github.com/erupt-io/erupt-sdk-swift`） | 0.1.0 |

在 Linux 上使用 `EruptSQLite` 需先安装 `libsqlite3-dev`（`apt install libsqlite3-dev`）。服务端需要 erupt **2.4.0+** 并启用 [erupt-cloud-server](/zh/modules/cloud-server)。

## 安装

在 `Package.swift` 中添加依赖：

```swift
.package(url: "https://github.com/erupt-io/erupt-sdk-swift", from: "0.1.0"),

.target(name: "App", dependencies: [
    .product(name: "EruptSDK", package: "erupt-sdk-swift"),
    .product(name: "EruptSQLite", package: "erupt-sdk-swift"),   // 需要 SQLite 存储时
]),
```

:::info 为什么是另一个仓库
`erupt-sdk-swift` 是 [erupt-sdk](https://github.com/erupt-io/erupt-sdk) 中 `swift/` 目录的只读拆分：SwiftPM 要求 `Package.swift` 位于仓库根目录，无法直接引用子目录。SwiftPM 直接读取 git 仓库，无需包注册中心。
:::

也可以把 `swift/Sources/EruptSDK/` 作为无依赖的 target 复制进自己的包（需要 SQLite 时同样复制 `EruptSQLite` 与 `CSQLite`）。

:::warning 复制源码的升级方式
复制的代码不会自动更新。erupt 的协议或注解 Schema 变化后，请用新版本整目录替换，不要手工合并；也不要改动 `Node.swift` 中的 `version`，服务端靠它显示节点运行的版本。
:::

## 快速开始

下面是 `Examples/Blog/main.swift` 的精简版：

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

然后在服务端完成三步：

1. 在 [Cloud Server](/zh/modules/cloud-server) 的「节点配置」中新建节点 `blog`，复制它的 access token。
2. 新增 `table` 类型的菜单，值为 `blog.Article`（以及 `blog.Category`），即 `<节点名>.<模型名>`。
3. 运行节点：`ERUPT_ACCESS_TOKEN=... swift run`。服务端必须能访问 `http://<节点 IP>:9090`，否则通过 `address:` 指定地址，见 [运行与部署](#运行与部署)。

## 声明模型

`Model(name, title:, power:, orderBy:, erupt:, dataProxy:, visQuery:, drillJoin:) { ... }` 在构建块中列出 `Field` 与 `RowAction`；声明错误（未知属性、错误的引用等）在构造时以 `throw` 抛出。

- `name` 是服务端寻址用的名字（菜单值 `<节点>.<name>`），`title` 默认同名。
- `power:` 开关功能，如 `["delete": false]`；`orderBy:` 是默认排序（`"views desc, id"`），由节点执行。
- `erupt:` 接受生成的 `Erupt(...)` 类型，承载其他 `@Erupt` 属性，如 `Erupt(layout: Layout(pageSize: 30))`。

`Field(name, title, kind, ...)` 按 `kind` 推断编辑类型，`type:` 可覆盖：

| Swift `FieldKind` | 编辑类型 |
| --- | --- |
| `.string`（默认） | INPUT |
| `.number` | NUMBER |
| `.bool` | BOOLEAN |
| `.date` | DATE（`2026-01-05`） |
| `.dateTime` | DATE_TIME（带时间选择的 DATE，`2026-01-05T10:30:00.000`） |
| 带 `choices:` | CHOICE |
| `.json` + `choices:` | MULTI_CHOICE（存为 JSON 数组） |
| `.json` | JSON 数组或对象（如 KEY_VALUE），SQL 存储中存为 JSON 文本 |
| `.ref(model, label:)` | REFERENCE_TABLE，见 [引用](#引用) |
| `.tree(model, pid:, label:)` | REFERENCE_TREE |

常用参数：`pk:`、`search:`、`notNull:`、`sortable:`、`table: false`（不在表格显示）、`form: false`（不在表单显示）、`virtual: true`（只出现在表单中的元素，如 DIVIDE、CALLOUT、EMPTY、GROUP，不读写存储）。

`type:` 还接受 `.tags`、`.autoComplete`、`.attachment`（上传由 erupt 服务端保存，节点只存路径）、`.htmlEditor`、`.markdown`、`.codeEditor`、`.button`（仅表单）、`.color`、`.icon`、`.signature`、`.map`、`.hidden`、`.rate`、`.slider`，以及配合 `.ref(model)` 的 `.checkbox` / `.tabTree` / `.transfer`（存为所选记录主键的 JSON 数组）。

### 原始注解属性

字段上的 `view:` / `edit:` 与模型上的 `erupt:` 使用从 erupt Schema 生成的强类型（`Edit`、`View`、`Erupt` 等），所有枚举值都是 Swift 枚举（`.textarea`、`.multiChoice`、`.single`）；生成的内容在声明模型时再按 Schema 校验一次。

```swift
Field("rating", "Rating", .number, sortable: true, edit: Edit(rateType: RateType(allowHalf: true, character: "", count: 5), type: .rate))
Field("publish_date", "Publish Date", .date, search: true, edit: Edit(search: Search(operator: .range)))
Field("notes", "Notes", table: false, edit: Edit(type: .markdown))
```

记录类型是 `Record`（即 `[String: JSON]`），`JSON` 支持字面量（`["status": "published", "views": 3]`）。

### 视图、树与钻取

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

- 视图的 `filter`（SQL，按原样 AND）与 `orderBy` 在 Java 中是 `@Transient`，不属于 `Vis`，因此通过 `visQuery` 按视图 code（无 code 时为标题）给出，由节点在读取该视图时执行；与 `beforeFetch` 一样需要 SQL 存储。
- `Erupt(tree: Tree(id: "id", label: "name", pid: "parent"))` 把模型显示为树；`Erupt(linkTree: LinkTree(field: "category"))` 在表格旁显示引用字段的树（`dependNode: true` 时未选节点不显示数据）。
- 钻取的 `column` / `joinColumn` 同样是 `@Transient`，通过 `drillJoin` 按钻取 code（无 code 时为标题）给出；`DrillJoin(column:)` 默认 `id`，`link.linkCondition` 按原样追加 SQL。两个模型都必须在同一节点上。

### 字段代码

字段可以挂自己的代码，由服务端通过节点的 `invoke` 接口携带表单值调用：

```swift
let order = try Model("Order") {
    Field("id", pk: true)
    Field("status", "Status", fetch: .options { form in [("new", "New"), ("paid", "Paid")] })  // TAGS 用 .tags { ... }
    Field("qty", "Qty", .number, onchange: { form in FormChange(formData: ["total": .int(form["qty"]!.int! * 9)]) })
    Field("city", "City", type: .autoComplete, complete: { form, typed in lookup(typed) })
    Field("total", "Total", .number)
    Field("recalc", "Recalc", type: .button, click: { form in FormChange(eval: "alert('done')") })
}
```

`fetch: .options` 属于 CHOICE / MULTI_CHOICE，`.tags` 属于 TAGS，`complete` 属于 AUTO_COMPLETE，`click` 属于 BUTTON，`onchange` 可用于任何字段；放在其他类型上会在声明时报错。抛出 `EruptFailure` 可向用户提示。

## 引用

把另一个模型（先声明、并注册在同一节点上）作为 `.ref` / `.tree` 的参数。存储里只保存被引用记录的主键，界面显示 `label`（默认 `name`）；标签、扁平列与树都由服务端解析。

```swift
Field("category", "Category", .ref(category), search: true)          // 表格选择器
Field("topic", "Topic", .tree(category, pid: "parent"))               // 基于 Category.parent 的树选择器
```

依赖另一个字段的引用表格：`edit: Edit(referenceTableType: ReferenceTableType(dependField: "province")), dependColumn: "province"`，服务端只列出 `dependColumn` 等于该字段值的记录。

## 行操作

```swift
let publishForm = try Model("PublishForm", title: "Publish Options") {   // 只做操作表单的模型无需主键，也不注册
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

- `OperationContext` 提供 `op.rows`（选中的记录，`.button` 模式为空）、`op.param`（表单值，无表单时为 `nil`）、`op.repo`、`op.model`、`op.user`。
- `mode:` 可选 `.single`、`.multi`（默认）、`.multiOnly`、`.button`。
- `confirm: false` 跳过确认框，字符串则替换确认文案；`ifExpr:` 是浏览器端针对 `item` 的表达式；`tip:`、`raw: RowOperation(...)` 透传其他 `@RowOperation` 属性。
- `show: { user in ... }` 对不满足条件的用户隐藏操作，并拒绝其执行。
- `User.current` 在处理请求的任何位置（包括存储内部）返回当前用户。

:::warning
处理器返回的字符串会作为 JavaScript 在浏览器中执行，只能返回你自己写的代码。需要提示用户时抛出 `EruptFailure("...")`。
:::

## DataProxy

与 Java 的 `DataProxy` 对应。实现 `DataProxy` 协议中需要的方法（其余默认为空实现），抛出 `EruptFailure` 即以提示信息拒绝。

```swift
struct ArticleProxy: DataProxy {
    func addBehavior(_ record: inout Record) {             // 新建表单的初始值
        record["status"] = "draft"
    }

    func validate(_ record: Record) throws {               // 每次新增与修改之前
        if record["title"]?.text.contains("spam") == true { throw EruptFailure("no spam") }
    }

    func beforeFetch(_ conditions: [Cond]) -> SQLFilter? {  // 追加到表格 WHERE 的 SQL，参数绑定
        SQLFilter("owner = ?", [.string(User.current?.account ?? "")])
    }
}

let article = try Model("Article", dataProxy: [ArticleProxy()]) { ... }   // 按顺序执行
```

| 钩子 | 触发时机 |
| --- | --- |
| `searchCondition(&condition)` | 构建模型时，搜索栏的默认值 |
| `beforeFetch(conditions)` | 读取表格页之前，返回 `"sql"` 或 `SQLFilter("sql ?", [values])`，按原样 AND 到 WHERE；仅 SQL 存储支持，`MemoryRepository` 会拒绝 |
| `afterFetch(&rows)` | 读取表格页之后 |
| `addBehavior(&record)` | 打开新建表单时（`init-value`） |
| `editBehavior(&record)` | 按主键读取记录后（编辑表单、详情） |
| `validate(record)` | 新增或修改之前 |
| `beforeAdd(&record)` / `afterAdd(record)` | `repository.add` 前后 |
| `beforeUpdate(&record)` / `afterUpdate(record)` | `repository.update` 前后，参数为提交的值 |
| `beforeDelete` / `afterDelete(record)` | `repository.delete` 前后，按存储中的记录逐条调用 |

## 存储

存储是任意实现 `Repository` 协议（`bind`、`page`、`get`、`add`、`update`、`delete`）的类，会被多个线程同时调用。内置：

- `MemoryRepository(records)`：内存存储，用于测试与演示。
- `SQLRepository(executor, table:, autoCreate:)`：PostgreSQL、MySQL、SQLite。核心库不依赖任何驱动，`SQLExecutor` 执行带绑定参数的语句。

```swift
import EruptSQLite                                    // SQLite，基于系统 libsqlite3
let repo = try SQLRepository(try SQLiteExecutor(path: "blog.db"), table: "article", autoCreate: true)

// 其他驱动：一个执行 (sql, params) 并返回以列名为键的行的闭包；方言为 .sqlite / .postgres / .mysql
let postgres = SQLClosureExecutor(.postgres) { sql, params in try runOnPostgres(sql, params) }
let articles = try SQLRepository(postgres, table: "article")
```

- 列名与字段名一致并加引号（PostgreSQL 区分大小写），所有值都是绑定参数，LIKE 使用 `ESCAPE '!'`；未指定排序时按主键升序返回。
- `autoCreate: true` 只创建 SQLite 表；生产环境的表请自行创建。
- `SQLiteExecutor` 使用单个连接，同一时刻只被一个线程使用。

自定义驱动实现 `SQLExecutor` 协议（`dialect` 属性与 `execute(_ sql:, _ params:) throws -> [[String: JSON]]`）。自定义存储实现 `Repository`：`page(_:)` 返回 `(total, records)`，`Query` 含 `conditions`、`sort`、`filters`、`offset`、`limit`；`filters` 来自视图 `filter` 与 `beforeFetch`，存储必须执行它们，做不到就抛出错误，不能忽略。

## 运行与部署

SDK 本身不读取环境变量，下面这些是示例程序的约定：

| 变量 | 含义 | 示例默认值 |
| --- | --- | --- |
| `ERUPT_NODE_NAME` | 节点名，与服务端「节点配置」一致 | `blog` |
| `ERUPT_ACCESS_TOKEN` | 节点的 access token | 必填 |
| `ERUPT_SERVER` | erupt 服务端地址 | `http://localhost:8080` |
| `PORT` | 节点监听端口 | `9090` |

`Node(name:, accessToken:, servers:, address: nil, heartbeat: 15, requireSignature: false, log: nil)`：

- `accessToken` 为空或 `servers` 为空时构造失败；注册与心跳在多个服务端之间轮换。
- `address:` 是服务端访问节点的地址；省略时按连向第一个服务端的本机网卡 IP 推断（`http://<ip>:<port>`）。容器、NAT 等场景请显式指定。
- `heartbeat:` 是注册心跳间隔（秒）；`log:` 接收 `(LogLevel, String)`，默认输出到 stderr。

`node.serve(host: "0.0.0.0", port: 9090)` 运行内置的多线程 HTTP/1.1 服务（POSIX socket，支持 keep-alive 与 chunked 请求体），先启动 HTTP（服务端注册时会探测 `/node-health`），再开始心跳；收到 SIGINT / SIGTERM 时注销节点后退出。

### 挂载到 Vapor / Hummingbird

`Node.handle(_:)` 处理一个 `NodeRequest`，`serve` 只是把它包进内置服务。要与应用共用端口，把节点路径路由给它，并调用 `start(port:)` 注册、`stop()` 注销：

```swift
// Vapor
for method in [HTTPMethod.GET, .POST] {
    app.on(method, "erupt-api", "**", body: .collect(maxSize: "32mb")) { req in try nodeResponse(req) }
}
app.get("node-health") { req in try nodeResponse(req) }
node.start(port: 8080)                       // 向服务端注册 http://<ip>:8080

func nodeResponse(_ req: Request) throws -> Response {
    var headers: [String: String] = [:]
    req.headers.forEach { headers[$0.name] = $0.value }
    let body = req.body.data.map { Array($0.readableBytesView) } ?? []
    let r = node.handle(NodeRequest(method: req.method.rawValue, target: req.url.string, headers: headers, body: body))
    return Response(status: .init(statusCode: r.status), headers: ["Content-Type": r.contentType], body: .init(data: Data(r.body)))
}
```

节点收到的路径必须是服务端签名时的原始路径（`/erupt-api/...`）：请挂在根路径，或在构造 `NodeRequest` 前去掉挂载前缀。

### 读取服务端配置

`node.config()` / `node.groupConfig()` 返回服务端为该节点及其分组设置的配置文本；`node.userInfo()` 在处理请求期间返回当前用户的完整信息（角色、组织、岗位）。

## 签名与权限

- **调用来源**：带 `Origin` 头的请求直接返回 403，节点只接受服务端到节点的调用。
- **认证**：未签名的请求按常量时间比对 `Access-Token`；带 `Erupt-Signature` 的请求按 HMAC-SHA256（以 access token 为密钥，时间窗 300 秒）校验，通过后才信任 `Erupt-Enforced`。`requireSignature: true` 拒绝所有未签名调用。
- **按用户权限**：节点用请求中的会话 token 调用服务端 `erupt-power`，把结果与模型声明的 `power` 取交集（add、edit、delete、viewDetails、export、importable），缓存 5 秒；服务端不可达时全部拒绝。签名的 `Erupt-Enforced` 含 `power` 时跳过此回调。
- 尚未实现的功能（`print`、`ai`）的权限始终关闭；`show:` 隐藏的行操作对该用户返回 403。

## 示例与一致性测试

- `Examples/Blog`：[SHOWCASE](https://github.com/erupt-io/erupt-sdk/blob/main/SHOWCASE.md) 中的博客模型（Category、Article、Component），存于 SQLite 文件 `ERUPT_DB`（默认 `blog.db`）。

  ```bash
  ERUPT_NODE_NAME=blog ERUPT_ACCESS_TOKEN=... ERUPT_SERVER=http://localhost:8080 swift run Blog
  ```

- `Examples/Conformance`：一致性测试夹具，由 `conformance/run.py` 扮演服务端运行：

  ```bash
  (cd swift && swift build -c release --product Conformance) && python conformance/run.py -- swift/.build/release/Conformance
  ```

- 单元测试：`swift test`（需要 Swift 6 工具链的 swift-testing）；`swift run erupt-gen-types ../schema --check` 检查生成代码是否与 `schema/` 一致。

## 能力边界

- 尚不支持：子表（`TAB_TABLE_*`）及其他嵌套模型、TPL 操作；`print` 与 `ai` 功能在界面上隐藏。
- `type:` 只接受 SDK 带有字段模板的类型；`.password`、`.tpl`、`.tabTableRefer` / `.tabTableAdd`、`.multiForm`、`.combine` 会在声明时报错。DIVIDE、CALLOUT、GROUP、KEY_VALUE 等通过 `edit: Edit(type: ...)` 声明。
- 平台为 macOS 13+ 与 Linux；`EruptSQLite` 依赖系统 libsqlite3。
- `beforeFetch` 与视图 `filter` 需要 SQL 存储，`MemoryRepository` 会拒绝。
