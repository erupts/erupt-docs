# Go SDK

Go SDK 让任何 Go 服务以 erupt-cloud 节点的身份，把自己的结构体声明成 erupt 管理页面：模型与数据留在 Go 进程里，erupt 服务端负责界面、登录与菜单权限。运行时只依赖标准库；`Node` 是一个 `http.Handler`，既可以独立运行，也可以挂进已有的 Go HTTP 服务。

> 多语言 SDK 总览见 [Erupt SDK](/zh/modules/erupt-sdk/)，节点协议与服务端见 [Cloud Server](/zh/modules/cloud-server)。

## 环境要求

| 语言版本 | 运行时依赖 | 包名 | 版本 |
| --- | --- | --- | --- |
| Go 1.21+ | 无（仅标准库；SQLite 驱动 `modernc.org/sqlite` 只用于测试与示例） | `github.com/erupt-io/erupt-sdk/go`（包名 `erupt`） | 0.1.0 |

## 安装

```bash
go get github.com/erupt-io/erupt-sdk/go
```

Go 模块直接从 GitHub 获取，`go/vX.Y.Z` tag 即发布版本，`GOPROXY=direct` 可跳过模块代理。

也可以把 `go/` 目录（`go.mod`、`.go` 文件与两个被 embed 的 `.json` 文件，不含测试）复制到自己的仓库，再重定向导入路径：

```bash
go mod edit -replace github.com/erupt-io/erupt-sdk/go=./third_party/erupt
```

复制的代码不会自动更新：erupt 的协议或注解 Schema 变化后，请用新版本整体替换，不要手工合并，也不要改动 `node.go` 中的 `Version`，服务端靠它显示节点运行的版本。

## 快速开始

下面是仓库中 `examples/blog` 的精简版：分类 + 文章两个模型，用 `database/sql` 存在 SQLite（需要 `go get modernc.org/sqlite`）。

```go
package main

import (
	"database/sql"
	"log"
	"os"
	"time"

	erupt "github.com/erupt-io/erupt-sdk/go"
	_ "modernc.org/sqlite"
)

type Category struct {
	ID     int64  `json:"id" erupt:"pk"`
	Name   string `json:"name" erupt:"title=Name;search;notNull;sortable"`
	Parent *int64 `json:"parent" erupt:"title=Parent Id"`
}

type PublishForm struct {
	PublishDate time.Time `json:"publish_date" erupt:"title=Publish Date;type=DATE;notNull"`
}

type Article struct {
	ID          int64     `json:"id" erupt:"pk"`
	Title       string    `json:"title" erupt:"title=Title;search;notNull;sortable"`
	Summary     string    `json:"summary" erupt:"title=Summary;type=TEXTAREA;hideTable"`
	Category    int64     `json:"category" erupt:"title=Category;ref=Category;search"`
	Topic       int64     `json:"topic" erupt:"title=Topic;ref=Category;tree=parent;hideTable"`
	Status      string    `json:"status" erupt:"title=Status;choices=draft:Draft,review:In Review,published:Published;search"`
	Views       int64     `json:"views" erupt:"title=Views;sortable"`
	Featured    bool      `json:"featured" erupt:"title=Featured;search"`
	PublishDate time.Time `json:"publish_date" erupt:"title=Publish Date;type=DATE;search"`
}

func main() {
	category := must(erupt.NewModel(Category{}, "Category"))
	publishForm := must(erupt.NewModel(PublishForm{}, "Publish Options"))
	article := must(erupt.NewModel(Article{}, "Article", erupt.WithOrderBy("id desc"),
		erupt.WithFieldEdit("title", erupt.M{"inputType": erupt.M{"length": 60}}),
		erupt.WithOperations(erupt.Operation{
			Code: "publish", Title: "Publish", Icon: "fa fa-paper-plane", Form: publishForm,
			IfExpr: "item.status !== 'published'",
			Handler: func(op *erupt.OpContext) (string, error) {
				for _, row := range op.Rows {
					change := erupt.Record{"status": "published", "publish_date": op.Param["publish_date"]}
					if err := op.Repo.Update(op.Context, row["id"], change); err != nil {
						return "", err
					}
				}
				return "", nil
			},
		})))

	db := must(sql.Open("sqlite", envOr("ERUPT_DB", "blog.db")))
	db.SetMaxOpenConns(1) // SQLite: one writer
	node := must(erupt.NewNode(erupt.Config{Name: envOr("ERUPT_NODE_NAME", "blog"),
		AccessToken: os.Getenv("ERUPT_ACCESS_TOKEN"), Servers: []string{envOr("ERUPT_SERVER", "http://localhost:8080")}}))
	check(node.Register(category, &erupt.SQLRepository{DB: db, Table: "category", AutoCreate: true}))
	check(node.Register(article, &erupt.SQLRepository{DB: db, Table: "article", AutoCreate: true}))
	check(node.ListenAndServe(":" + envOr("PORT", "9090")))
}

func envOr(name, fallback string) string {
	if v := os.Getenv(name); v != "" {
		return v
	}
	return fallback
}

func must[T any](v T, err error) T {
	check(err)
	return v
}

func check(err error) {
	if err != nil {
		log.Fatal(err)
	}
}
```

然后在 erupt 服务端完成三步（服务端的搭建见 [Cloud Server](/zh/modules/cloud-server)）：

1. 在「节点配置（Node Config）」中创建节点 `blog`，复制它的 access token。
2. 新增一个类型为 `table` 的菜单，值为 `blog.Article`（同理可加 `blog.Category`）。
3. 运行节点：`ERUPT_ACCESS_TOKEN=<token> ERUPT_SERVER=http://<erupt 服务端>:8080 go run .`。服务端必须能通过 `http://<节点 IP>:9090` 访问到节点，否则见 [运行与部署](#运行与部署) 中的 `Config.Address`。

## 声明模型

结构体只描述模型，记录以 `erupt.Record`（`map[string]any`）按字段名传递。字段名取 `json` tag（否则为 Go 字段名），只有带 `erupt` tag 的字段参与。`erupt.NewModel(结构体, 标题, 选项...)` 返回 `*erupt.Model`，模型名默认是结构体类型名，服务端通过 `<节点名>.<模型名>` 访问它。

| `erupt` tag | 含义 |
| --- | --- |
| `pk` | 主键 |
| `title=Title` | 表格列与表单的标题 |
| `search`、`notNull`、`sortable` | 可搜索、必填、可排序 |
| `hideTable`、`hideForm` | 不在表格 / 表单中显示 |
| `virtual` | 只在表单中出现、从不读写的元素（DIVIDE、CALLOUT、EMPTY、GROUP） |
| `type=TEXTAREA` | 指定编辑类型，否则按 Go 类型推断 |
| `choices=a:A,b:B` | CHOICE（切片字段为 MULTI_CHOICE） |
| `ref=Category`、`label=name`、`tree=parent` | 引用，见 [引用](#引用) |

| Go 类型 | 编辑类型 |
| --- | --- |
| `string` | INPUT |
| 整数、浮点数 | NUMBER |
| `bool` | BOOLEAN |
| `time.Time` | DATE_TIME（加 `type=DATE` 为日期） |
| 任意类型 + `choices=` | CHOICE |
| 切片 + `choices=` | MULTI_CHOICE（以 JSON 数组存储） |
| 切片 / map | JSON 值（如 KEY_VALUE，以 JSON 文本存储） |
| 任意类型 + `ref=` | REFERENCE_TABLE；带 `tree=` 时为 REFERENCE_TREE |

`type=` 还可取 `TAGS`、`AUTO_COMPLETE`、`ATTACHMENT`（文件由 erupt 服务端保存，节点只存路径）、`HTML_EDITOR`、`MARKDOWN`、`CODE_EDITOR`、`COLOR`、`ICON`、`SIGNATURE`、`MAP`、`HIDDEN`、`RATE`、`SLIDER`、`BUTTON`（仅表单），以及配合 `ref=` 的 `CHECKBOX` / `TAB_TREE` / `TRANSFER`（以被选记录主键的 JSON 数组存储）。

模型选项：`WithName`、`WithPower(map[string]bool{"delete": false})`、`WithOrderBy("views desc, id")`（由节点执行）、`WithRaw(...)`、`WithFieldEdit` / `WithFieldView`、`WithFieldCode`、`WithOperations(...)`、`WithDataProxy(...)`。

**原始注解属性透传**：`WithRaw` 传 `@Erupt` 属性，`WithFieldEdit(field, ...)` / `WithFieldView(field, ...)` 传字段的 `@Edit` / `@View` 属性。值可以是 `erupt.M`，也可以是生成的类型（如 `erupt.Edit{InputType: &erupt.InputType{Length: erupt.Ptr[int64](64)}}`）。它们在 `NewModel` 中按 erupt 生成的注解 JSON Schema 校验，拼错的键或枚举值会直接返回错误，而不是在浏览器里悄悄失效。

```go
erupt.NewModel(Article{}, "Article",
	erupt.WithRaw(erupt.M{"layout": erupt.M{"pageSize": 30}}),
	erupt.WithFieldEdit("tags", erupt.M{"type": "TAGS", "tagsType": erupt.M{"allowExtension": true, "joinSeparator": ","}}),
	erupt.WithFieldEdit("rating", erupt.M{"type": "RATE", "rateType": erupt.M{"count": 5, "allowHalf": true}}),
)
```

blog 示例就是这样做的：字段按存储类型（`string` / `float64`）声明，再用原始 `@Edit` 的 `type` 切换前端组件。

:::warning JSON 字段不能搜索
Go SDK 中切片 / map 字段（MULTI_CHOICE、KEY_VALUE 等 JSON 值）不能带 `search` 或 `sortable`，`NewModel` 会返回错误。
:::

## 引用

`ref=<模型名>` 引用另一个模型的记录，被引用模型必须先在同一节点上 `Register`。仓库只存被引用记录的主键，界面显示 `label`（默认 `name`）；`tree=<父字段>` 把选择器变成树。引用标签、扁平列与引用树都由 erupt 服务端解析，节点无需提供额外接口。

```go
type Article struct {
	ID       int64 `json:"id" erupt:"pk"`
	Category int64 `json:"category" erupt:"title=Category;ref=Category;search"`      // 表格选择器
	Topic    int64 `json:"topic" erupt:"title=Topic;ref=Category;tree=parent"`       // 以 Category.parent 组织的树选择器
}
```

依赖另一个字段的表格选择器写作 `erupt.WithFieldEdit("city", erupt.M{"referenceTableType": erupt.M{"dependField": "province", "dependColumn": "province"}})`，服务端只列出 `dependColumn` 等于依赖字段值的记录。

## 行操作

用 `erupt.WithOperations(erupt.Operation{...})` 声明。`Handler` 收到 `*erupt.OpContext`：`Context`、`Rows`（选中的记录）、`Param`（表单值，无表单时为 nil）、`Repo`、`Model`、`User`。

```go
erupt.WithOperations(
	erupt.Operation{Code: "publish", Title: "Publish", Icon: "fa fa-paper-plane", Form: publishForm,
		IfExpr: "item.status !== 'published'",
		Handler: func(op *erupt.OpContext) (string, error) {
			for _, row := range op.Rows {
				if err := op.Repo.Update(op.Context, row["id"], erupt.Record{"status": "published"}); err != nil {
					return "", err
				}
			}
			return "", nil
		}},
	erupt.Operation{Code: "feature", Title: "Feature", Mode: erupt.RowOperationModeSingle, Icon: "fa fa-star",
		Confirm: "Feature this article on the home page?",
		Handler: func(op *erupt.OpContext) (string, error) {
			return "", op.Repo.Update(op.Context, op.Rows[0]["id"], erupt.Record{"featured": true})
		}},
)
```

| 字段 | 说明 |
| --- | --- |
| `Code` | 必填，模型内唯一 |
| `Mode` | `RowOperationModeSingle`（行按钮）、`RowOperationModeMulti`（默认）、`RowOperationModeMultiOnly`（仅工具栏）、`RowOperationModeButton`（工具栏，不选行） |
| `Form` | 一个 `*erupt.Model`，执行前先让用户填写；表单模型不需要主键，也不注册 |
| `Confirm` / `NoConfirm` | 替换确认文案 / 跳过确认框 |
| `Show` | `func(*erupt.User) bool`，返回 false 时对该用户隐藏并拒绝执行 |
| `IfExpr` | 浏览器端基于 `item` 的 JS 表达式，控制行按钮是否可用 |
| `Icon` / `Tip` / `Raw` | 图标、提示、原始 `@RowOperation` 属性 |

返回的字符串会作为 JavaScript 在浏览器中执行，只能返回你自己写的代码。返回 `erupt.Fail("...")` 会把消息展示给用户，其他错误返回 500。

字段也可以带自己的代码，由服务端通过节点的 `invoke` 接口调用，用 `erupt.WithFieldCode(field, erupt.FieldCode{...})` 声明：`Fetch`（CHOICE / MULTI_CHOICE 的动态选项）、`Tags`（TAGS）、`Onchange`（任意字段）、`Complete`（AUTO_COMPLETE）、`Click`（BUTTON）。

```go
erupt.WithFieldCode("status", erupt.FieldCode{Fetch: func(ctx context.Context, form erupt.M) ([]erupt.Option, error) {
	return []erupt.Option{{Value: "new", Label: "New"}, {Value: "paid", Label: "Paid"}}, nil
}})
erupt.WithFieldCode("recalc", erupt.FieldCode{Click: func(ctx context.Context, form erupt.M) (erupt.Click, error) {
	return erupt.Click{Eval: "alert('done')"}, nil
}})
```

## DataProxy

与 Java 的 `DataProxy` 对应：嵌入 `erupt.BaseDataProxy`，只覆盖需要的钩子，返回 `erupt.Fail(...)` 拒绝并提示用户。

```go
type ArticleProxy struct{ erupt.BaseDataProxy }

func (ArticleProxy) AddBehavior(ctx context.Context, record erupt.Record) error { // 新增表单的初始值
	record["status"] = "draft"
	return nil
}

func (ArticleProxy) Validate(ctx context.Context, record erupt.Record) error { // 每次新增、修改前
	if title, _ := record["title"].(string); strings.Contains(title, "spam") {
		return erupt.Fail("no spam")
	}
	return nil
}

// 追加到表格 WHERE 的 SQL，值以参数绑定
func (ArticleProxy) BeforeFetch(ctx context.Context, conditions []erupt.Cond) (erupt.Filter, error) {
	return erupt.Filter{SQL: "owner = ?", Params: []any{erupt.UserFrom(ctx).Account}}, nil
}

article, err := erupt.NewModel(Article{}, "Article", erupt.WithDataProxy(ArticleProxy{})) // 一个或多个
```

| 钩子 | 执行时机 |
| --- | --- |
| `SearchCondition(ctx, condition)` | 构建模型时：搜索栏默认值 |
| `BeforeFetch(ctx, conditions)` | 读取表格页之前：返回 `Filter{SQL, Params}`，按原样 AND 到 WHERE；仅 SQL 仓库支持，`MemoryRepository` 会拒绝 |
| `AfterFetch(ctx, rows)` | 读取表格页之后 |
| `AddBehavior(ctx, record)` | 新增表单初始值（`init-value`） |
| `EditBehavior(ctx, record)` | 按主键读取记录之后（编辑表单、详情） |
| `Validate(ctx, record)` | 新增或修改之前 |
| `BeforeAdd` / `AfterAdd(ctx, record)` | `Repository.Add` 前后 |
| `BeforeUpdate` / `AfterUpdate(ctx, record)` | `Repository.Update` 前后，参数为提交的值 |
| `BeforeDelete` / `AfterDelete(ctx, record)` | `Repository.Delete` 前后，每条记录各一次 |

## 存储

存储是任意 `erupt.Repository`：`Page`、`Get`、`Add`、`Update`、`Delete`，每个方法都带 `context.Context`，当前用户通过 `erupt.UserFrom(ctx)` 取得。需要拿到模型的仓库可再实现 `Binder`（`Bind(*erupt.Model) error`），`Register` 时调用。内置两种：

| 仓库 | 说明 |
| --- | --- |
| `erupt.NewMemoryRepository(seed...)` | 进程内存储，并发安全，用于测试和演示；不支持 SQL 过滤（`BeforeFetch`、视图 `filter`） |
| `&erupt.SQLRepository{DB, Table, Dollar, Quote, AutoCreate}` | 基于 `database/sql`，任意驱动；分页使用 `LIMIT / OFFSET`（SQLite、PostgreSQL、MySQL、MariaDB） |

```go
&erupt.SQLRepository{DB: db, Table: "article", Dollar: true}  // PostgreSQL：$1, $2 占位符
&erupt.SQLRepository{DB: db, Table: "article", Quote: "`"}    // MySQL（未开启 ANSI_QUOTES）
&erupt.SQLRepository{DB: db, Table: "article", AutoCreate: true} // SQLite：注册时自动建表
```

标识符是声明时校验过的字段名并加引号（`Quote` 默认 `"`），所有值都以参数绑定，日期以 ISO 文本存储。`AutoCreate` 按 SQLite 类型建表，其他数据库请自行建表，列名与字段名一致。不指定排序时按主键升序返回。

自定义仓库的 `Page(ctx, q)` 返回 `(total, records, err)`，`Query` 带 `Conditions`、`Sort`、`Filters`、`Offset`、`Limit`；`Get` 找不到记录时返回 `nil, nil`。`Filters` 来自视图与 `BeforeFetch`，无法执行时必须返回错误，不能忽略。

## 运行与部署

```go
node, err := erupt.NewNode(erupt.Config{
	Name: "blog", AccessToken: token, Servers: []string{"http://erupt-server:8080"},
	Address: "",            // 服务端回调节点的地址，空则自动推导
	Heartbeat: 15 * time.Second,
	RequireSignature: false,
})
```

- **环境变量**：SDK 本身不读取环境变量，由你的入口代码传入 `Config`。示例统一使用 `ERUPT_NODE_NAME`（默认 `blog`）、`ERUPT_ACCESS_TOKEN`、`ERUPT_SERVER`、`PORT`（默认 9090）以及 `ERUPT_DB`（SQLite 文件，默认 `blog.db`）。
- **节点地址**：`ListenAndServe` 在 `Config.Address` 为空时使用 `http://<朝向服务端的本机网卡 IP>:<端口>`。在容器、NAT 或反向代理后面，服务端访问不到这个地址时，显式设置 `Config.Address`。
- **独立运行**：`node.ListenAndServe(":9090")` 先监听（服务端注册时会探测 `/node-health`），再开始心跳；收到 SIGINT 或 SIGTERM 时注销并在 30 秒内排空处理中的请求后返回。
- **挂进已有服务**：`Node` 是 `http.Handler`，可以挂到自己的 `http.Server` 或路由上，此时需设置 `Config.Address`，并自行运行 `go node.Heartbeat(ctx)`（ctx 结束即停止心跳），退出时调用 `node.Deregister()`。

```go
mux := http.NewServeMux()
mux.Handle("/", node)                     // 节点接口位于 /node-health 与 /erupt-api/
ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
defer stop()
go node.Heartbeat(ctx)
// ... 启动 http.Server，ctx 结束后：
_ = node.Deregister()
```

`node.NodeConfig(ctx)` / `node.GroupConfig(ctx)` 返回服务端为该节点及其分组设置的配置文本；`node.UserInfo(ctx)` 用请求的 ctx 取得当前用户的完整信息（角色、组织、岗位）。

## 签名与权限

- **请求签名**：服务端转发的请求带 `Erupt-Signature` 时，节点用 access token 按 HMAC-SHA256 校验（时间窗 300 秒），通过后才视为合法；不带签名时校验明文 `Access-Token` 头。`Config.RequireSignature` 为 true 时只接受签名请求（服务端自 erupt 2.3.x 起签名）。`erupt.Sign` / `erupt.VerifySignature` 也公开可用。
- **Erupt-Enforced**：只在签名校验通过后才信任。其中包含 `power` 时，节点不再回调服务端取权限，只应用模型自己声明的 power；包含 `query` 时，信任服务端已校验过的查询条件（如依赖选择器追加的条件）。
- **权限回调**：未被服务端代为校验时，节点用用户会话 token 调用服务端 `/erupt-cloud-api/erupt-power`，把 `add`、`edit`、`delete`、`viewDetails`、`export`、`importable` 与模型声明的 power 取交集，每个 token + 模型缓存 5 秒；拿不到服务端结果时一律视为无权限（fail closed）。
- **按用户可见**：`Operation.Show` 对该用户从构建结果中移除操作，直接调用也会被拒绝（403）。`erupt.UserFrom(ctx)` 返回 `*erupt.User`（`UID`、`Account`、`Name`、`TenantID`），可在仓库、钩子与操作中按用户过滤数据。
- 带 `Origin` 头的请求（即浏览器直接访问节点）一律 403；节点只接受服务端之间的调用。

## 示例与一致性测试

blog 示例实现了 [SHOWCASE.md](https://github.com/erupt-io/erupt-sdk/blob/main/SHOWCASE.md) 的完整模型（Category、Article、Component）。在 erupt 服务端创建节点 `blog` 后，于仓库的 `go/` 目录运行：

```bash
ERUPT_ACCESS_TOKEN=<token> ERUPT_SERVER=http://localhost:8080 go run ./examples/blog
```

一致性测试由 `conformance/run.py` 扮演服务端，于仓库根目录运行：

```bash
(cd go && go build -o /tmp/erupt-go-conformance ./examples/conformance) && python3 conformance/run.py -- /tmp/erupt-go-conformance
```

单元测试：在 `go/` 目录执行 `go test ./...`。

## 能力边界

- 尚不支持：子表（TAB_TABLE_*）、TPL 操作。
- 打印与 AI 功能的接口未实现，节点会在权限中关闭 `print` 与 `ai`，界面上不显示。
- JSON 字段（切片 / map）不能搜索或排序。
- `SQLRepository` 只生成 `LIMIT / OFFSET` 分页，不支持 SQL Server、Oracle 的分页语法。
- 树视图、文件上传与 Excel 导入导出由 erupt 服务端完成，节点无需实现。
- 尚不支持模型嵌套（父模型只能是自身）。
