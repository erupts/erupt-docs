# Go SDK

The Go SDK turns any Go service into an erupt-cloud node that declares its structs as erupt admin pages: models and data stay in the Go process, while the erupt server renders the UI, logs users in and checks menus. It uses the standard library only at runtime; `Node` is an `http.Handler`, so it runs on its own or mounts into an existing Go HTTP server.

> For an overview of every language see [Erupt SDK](/en/modules/erupt-sdk/); for the node protocol and the server see [Cloud Server](/en/modules/cloud-server).

## Requirements

| Language version | Runtime dependencies | Package | Version |
| --- | --- | --- | --- |
| Go 1.21+ | None (standard library only; the SQLite driver `modernc.org/sqlite` is used by tests and examples only) | `github.com/erupt-io/erupt-sdk/go` (package `erupt`) | 0.1.0 |

## Installation

```bash
go get github.com/erupt-io/erupt-sdk/go
```

Go modules come straight from GitHub: a `go/vX.Y.Z` tag is the release, and `GOPROXY=direct` skips the module proxy.

To vendor it instead, copy `go/` (`go.mod`, the `.go` files and the two embedded `.json` files, without the tests) into your repository and redirect the import path:

```bash
go mod edit -replace github.com/erupt-io/erupt-sdk/go=./third_party/erupt
```

A copy does not update itself: when erupt changes the protocol or the annotation schema, replace it with the next release instead of merging by hand, and leave `Version` in `node.go` untouched so the server shows which release the node runs.

## Quick Start

A trimmed version of `examples/blog` from the repository: a Category and an Article model kept in SQLite through `database/sql` (run `go get modernc.org/sqlite`).

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

Then three steps on the erupt server (see [Cloud Server](/en/modules/cloud-server) for setting it up):

1. In Node Config create the node `blog` and copy its access token.
2. Add a menu of type `table` with the value `blog.Article` (and `blog.Category` the same way).
3. Run the node: `ERUPT_ACCESS_TOKEN=<token> ERUPT_SERVER=http://<erupt server>:8080 go run .`. The server must reach the node on `http://<node ip>:9090`; otherwise see `Config.Address` under [Running and Deploying](#running-and-deploying).

## Declaring Models

The struct only describes the model; records travel as `erupt.Record` (`map[string]any`) keyed by field name, which is the `json` tag name (else the Go field name). Only fields with an `erupt` tag take part. `erupt.NewModel(struct, title, options...)` returns an `*erupt.Model`; the model name defaults to the struct type name and is what the server addresses as `<node>.<Model>`.

| `erupt` tag | Meaning |
| --- | --- |
| `pk` | primary key |
| `title=Title` | table column and form label |
| `search`, `notNull`, `sortable` | searchable, required, sortable |
| `hideTable`, `hideForm` | leave out of the table / the form |
| `virtual` | a form-only element that is never read or written (DIVIDE, CALLOUT, EMPTY, GROUP) |
| `type=TEXTAREA` | the edit type; otherwise inferred from the Go type |
| `choices=a:A,b:B` | CHOICE (MULTI_CHOICE on a slice) |
| `ref=Category`, `label=name`, `tree=parent` | a reference, see [References](#references) |

| Go type | Edit type |
| --- | --- |
| `string` | INPUT |
| integers, floats | NUMBER |
| `bool` | BOOLEAN |
| `time.Time` | DATE_TIME (`type=DATE` for a date) |
| any type + `choices=` | CHOICE |
| slice + `choices=` | MULTI_CHOICE (stored as a JSON array) |
| slice / map | a JSON value (e.g. KEY_VALUE, stored as JSON text) |
| any type + `ref=` | REFERENCE_TABLE; REFERENCE_TREE with `tree=` |

`type=` also takes `TAGS`, `AUTO_COMPLETE`, `ATTACHMENT` (the erupt server stores the upload, the node keeps its path), `HTML_EDITOR`, `MARKDOWN`, `CODE_EDITOR`, `COLOR`, `ICON`, `SIGNATURE`, `MAP`, `HIDDEN`, `RATE`, `SLIDER`, `BUTTON` (form only), and `CHECKBOX` / `TAB_TREE` / `TRANSFER` with `ref=` (stored as the JSON list of the picked keys).

Model options: `WithName`, `WithPower(map[string]bool{"delete": false})`, `WithOrderBy("views desc, id")` (applied by the node), `WithRaw(...)`, `WithFieldEdit` / `WithFieldView`, `WithFieldCode`, `WithOperations(...)`, `WithDataProxy(...)`.

**Raw annotation attributes pass through**: `WithRaw` takes `@Erupt` attributes, `WithFieldEdit(field, ...)` / `WithFieldView(field, ...)` a field's `@Edit` / `@View` attributes. Each is an `erupt.M` or a generated type (`erupt.Edit{InputType: &erupt.InputType{Length: erupt.Ptr[int64](64)}}`). `NewModel` validates them against the annotation JSON Schema generated by erupt, so a misspelt key or enum value is an error there instead of a silent no-op in the browser.

```go
erupt.NewModel(Article{}, "Article",
	erupt.WithRaw(erupt.M{"layout": erupt.M{"pageSize": 30}}),
	erupt.WithFieldEdit("tags", erupt.M{"type": "TAGS", "tagsType": erupt.M{"allowExtension": true, "joinSeparator": ","}}),
	erupt.WithFieldEdit("rating", erupt.M{"type": "RATE", "rateType": erupt.M{"count": 5, "allowHalf": true}}),
)
```

This is how the blog example does it: declare the field as the type it stores (`string` / `float64`) and switch the widget with the raw `@Edit` `type`.

:::warning JSON fields cannot be searched
In the Go SDK a slice / map field (a JSON value such as MULTI_CHOICE or KEY_VALUE) cannot take `search` or `sortable`; `NewModel` returns an error.
:::

## References

`ref=<Model>` references a record of another model, which must be registered on the same node first. The repository stores the referenced primary key; the UI shows `label` (default `name`); `tree=<parent field>` turns the picker into a tree. Labels, flattened columns and reference trees are resolved by the erupt server, so the node serves no extra endpoint for them.

```go
type Article struct {
	ID       int64 `json:"id" erupt:"pk"`
	Category int64 `json:"category" erupt:"title=Category;ref=Category;search"`      // table picker
	Topic    int64 `json:"topic" erupt:"title=Topic;ref=Category;tree=parent"`       // tree picker over Category.parent
}
```

A table picker that depends on another field takes `erupt.WithFieldEdit("city", erupt.M{"referenceTableType": erupt.M{"dependField": "province", "dependColumn": "province"}})`: the server lists only the records whose `dependColumn` holds the depend field's value.

## Row Operations

Declare them with `erupt.WithOperations(erupt.Operation{...})`. `Handler` receives an `*erupt.OpContext`: `Context`, `Rows` (the selected records), `Param` (the form values, nil without a form), `Repo`, `Model` and `User`.

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

| Field | Meaning |
| --- | --- |
| `Code` | required, unique within the model |
| `Mode` | `RowOperationModeSingle` (row button), `RowOperationModeMulti` (default), `RowOperationModeMultiOnly` (toolbar), `RowOperationModeButton` (toolbar, no rows) |
| `Form` | an `*erupt.Model` whose fields are asked for before running; it needs no primary key and is not registered |
| `Confirm` / `NoConfirm` | replace the confirm text / skip the dialog |
| `Show` | `func(*erupt.User) bool`; when false, the operation is hidden from that user and refused |
| `IfExpr` | browser-side JS over `item` that disables the row button |
| `Icon` / `Tip` / `Raw` | icon, tooltip, raw `@RowOperation` attributes |

A returned string is executed as JavaScript in the browser, so return only code you wrote. Return `erupt.Fail("...")` to show the user a message; any other error answers 500.

A field can also run its own code, which the server calls through the node's `invoke` endpoint. Declare it with `erupt.WithFieldCode(field, erupt.FieldCode{...})`: `Fetch` (dynamic options of CHOICE / MULTI_CHOICE), `Tags` (TAGS), `Onchange` (any field), `Complete` (AUTO_COMPLETE) and `Click` (BUTTON).

```go
erupt.WithFieldCode("status", erupt.FieldCode{Fetch: func(ctx context.Context, form erupt.M) ([]erupt.Option, error) {
	return []erupt.Option{{Value: "new", Label: "New"}, {Value: "paid", Label: "Paid"}}, nil
}})
erupt.WithFieldCode("recalc", erupt.FieldCode{Click: func(ctx context.Context, form erupt.M) (erupt.Click, error) {
	return erupt.Click{Eval: "alert('done')"}, nil
}})
```

## DataProxy

The counterpart of Java's `DataProxy`: embed `erupt.BaseDataProxy`, override only the hooks you need, and return `erupt.Fail(...)` to refuse with a message the user sees.

```go
type ArticleProxy struct{ erupt.BaseDataProxy }

func (ArticleProxy) AddBehavior(ctx context.Context, record erupt.Record) error { // the new form's values
	record["status"] = "draft"
	return nil
}

func (ArticleProxy) Validate(ctx context.Context, record erupt.Record) error { // before every add and update
	if title, _ := record["title"].(string); strings.Contains(title, "spam") {
		return erupt.Fail("no spam")
	}
	return nil
}

// SQL ANDed to the table's WHERE, values bound
func (ArticleProxy) BeforeFetch(ctx context.Context, conditions []erupt.Cond) (erupt.Filter, error) {
	return erupt.Filter{SQL: "owner = ?", Params: []any{erupt.UserFrom(ctx).Account}}, nil
}

article, err := erupt.NewModel(Article{}, "Article", erupt.WithDataProxy(ArticleProxy{})) // one or several
```

| Hook | Runs |
| --- | --- |
| `SearchCondition(ctx, condition)` | building the model: default values of the search bar |
| `BeforeFetch(ctx, conditions)` | before a table page is read: `Filter{SQL, Params}` ANDed to its WHERE as written; SQL repositories only, `MemoryRepository` refuses it |
| `AfterFetch(ctx, rows)` | after a table page is read |
| `AddBehavior(ctx, record)` | the new record form (`init-value`) |
| `EditBehavior(ctx, record)` | after a record is read by its key (edit form, detail view) |
| `Validate(ctx, record)` | before an add or an update |
| `BeforeAdd` / `AfterAdd(ctx, record)` | around `Repository.Add` |
| `BeforeUpdate` / `AfterUpdate(ctx, record)` | around `Repository.Update`, with the submitted values |
| `BeforeDelete` / `AfterDelete(ctx, record)` | around `Repository.Delete`, once per record |

## Storage

Storage is any `erupt.Repository`: `Page`, `Get`, `Add`, `Update`, `Delete`, each with a `context.Context`; the acting user is `erupt.UserFrom(ctx)`. A repository that needs its model also implements `Binder` (`Bind(*erupt.Model) error`), called by `Register`. Two ship with the SDK:

| Repository | Notes |
| --- | --- |
| `erupt.NewMemoryRepository(seed...)` | in process, safe for concurrent use, for tests and demos; cannot apply SQL filters (`BeforeFetch`, a view `filter`) |
| `&erupt.SQLRepository{DB, Table, Dollar, Quote, AutoCreate}` | over `database/sql` with any driver; pages with `LIMIT / OFFSET` (SQLite, PostgreSQL, MySQL, MariaDB) |

```go
&erupt.SQLRepository{DB: db, Table: "article", Dollar: true}     // PostgreSQL: $1, $2 placeholders
&erupt.SQLRepository{DB: db, Table: "article", Quote: "`"}       // MySQL without ANSI_QUOTES
&erupt.SQLRepository{DB: db, Table: "article", AutoCreate: true} // SQLite: create the table on Register
```

Identifiers are field names checked at declaration and quoted (`Quote`, default `"`); every value is a bound parameter; dates are stored as ISO text. `AutoCreate` creates the table with SQLite types; create the tables yourself on other databases, with columns named like the fields. Without a sort, rows come back by primary key ascending.

A custom repository's `Page(ctx, q)` returns `(total, records, err)`, where `Query` carries `Conditions`, `Sort`, `Filters`, `Offset` and `Limit`; `Get` returns `nil, nil` for a missing record. `Filters` come from views and `BeforeFetch`; a repository that cannot apply them must return an error, never ignore them.

## Running and Deploying

```go
node, err := erupt.NewNode(erupt.Config{
	Name: "blog", AccessToken: token, Servers: []string{"http://erupt-server:8080"},
	Address: "",            // the URL the server calls the node on; derived when empty
	Heartbeat: 15 * time.Second,
	RequireSignature: false,
})
```

- **Environment variables**: the SDK reads none itself; your entry point fills `Config`. The examples all use `ERUPT_NODE_NAME` (default `blog`), `ERUPT_ACCESS_TOKEN`, `ERUPT_SERVER`, `PORT` (default 9090) and `ERUPT_DB` (SQLite file, default `blog.db`).
- **Node address**: with an empty `Config.Address`, `ListenAndServe` uses `http://<local interface ip facing the server>:<port>`. Behind containers, NAT or a reverse proxy, when the server cannot reach that address, set `Config.Address`.
- **On its own**: `node.ListenAndServe(":9090")` listens first (the server probes `/node-health` while registering), then starts the heartbeat; on SIGINT or SIGTERM it deregisters, drains in-flight requests for up to 30 seconds and returns.
- **Inside an existing server**: `Node` is an `http.Handler`, so mount it on your own `http.Server` or router. Then set `Config.Address`, run `go node.Heartbeat(ctx)` yourself (it stops when ctx is done) and call `node.Deregister()` on shutdown.

```go
mux := http.NewServeMux()
mux.Handle("/", node)                     // the node answers /node-health and /erupt-api/
ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
defer stop()
go node.Heartbeat(ctx)
// ... start the http.Server; once ctx is done:
_ = node.Deregister()
```

`node.NodeConfig(ctx)` / `node.GroupConfig(ctx)` return the config text set on the server for the node and its group; `node.UserInfo(ctx)`, with the ctx of a request being served, returns the acting user's full info (roles, org, post).

## Signatures and Power

- **Request signatures**: when a forwarded call carries `Erupt-Signature`, the node verifies it as an HMAC-SHA256 keyed by the access token (300-second window); without a signature it checks the plain `Access-Token` header. With `Config.RequireSignature` only signed calls pass (servers sign since erupt 2.3.x). `erupt.Sign` / `erupt.VerifySignature` are exported too.
- **Erupt-Enforced** is trusted only under a valid signature. With `power` in it, the node skips the power callback and applies only the model's declared power; with `query`, it trusts the conditions the server already checked (such as those a dependent picker adds).
- **Power callback**: otherwise the node calls the server's `/erupt-cloud-api/erupt-power` with the user's session token and ANDs `add`, `edit`, `delete`, `viewDetails`, `export` and `importable` onto the declared power, cached 5 seconds per token and model. Without the server's answer nothing is allowed (fail closed).
- **Per-user visibility**: `Operation.Show` removes the operation from that user's build and refuses a direct call (403). `erupt.UserFrom(ctx)` returns an `*erupt.User` (`UID`, `Account`, `Name`, `TenantID`) for filtering data per user in repositories, hooks and operations.
- A call carrying an `Origin` header (a browser reaching the node directly) is always refused with 403; the node takes server-to-server calls only.

## Examples and Conformance

The blog example implements the full model of [SHOWCASE.md](https://github.com/erupt-io/erupt-sdk/blob/main/SHOWCASE.md) (Category, Article, Component). After creating node `blog` on the erupt server, run it from the repository's `go/` directory:

```bash
ERUPT_ACCESS_TOKEN=<token> ERUPT_SERVER=http://localhost:8080 go run ./examples/blog
```

The conformance suite, where `conformance/run.py` plays the server, runs from the repository root:

```bash
(cd go && go build -o /tmp/erupt-go-conformance ./examples/conformance) && python3 conformance/run.py -- /tmp/erupt-go-conformance
```

Unit tests: `go test ./...` in `go/`.

## Limitations

- Not yet: sub-tables (TAB_TABLE_*), TPL operations.
- Print and AI endpoints are not served: the node switches `print` and `ai` off in its power, so the UI hides them.
- JSON fields (slices / maps) cannot be searched or sorted.
- `SQLRepository` pages with `LIMIT / OFFSET` only; SQL Server and Oracle paging is not generated.
- Trees, file upload and Excel import / export are done by the erupt server; the node implements none of them.
- Model nesting is not supported yet (a parent can only be the model itself).
