# Python SDK

The Python SDK turns any Python service into an erupt-cloud node that declares its classes as erupt admin pages: models and data stay in the Python process, while the erupt server renders the UI, logs users in and checks menus. It uses the standard library only and ships an HTTP server, SQLite storage and SQL storage over any DB-API 2.0 driver.

> For an overview of every language see [Erupt SDK](/en/modules/erupt-sdk/); for the node protocol and the server see [Cloud Server](/en/modules/cloud-server).

## Requirements

| Language version | Runtime dependencies | Package | Version |
| --- | --- | --- | --- |
| Python 3.9+ | None (standard library only) | `erupt-sdk` (PyPI, imported as `erupt`) | 0.1.0 |

## Installation

```bash
pip install erupt-sdk
```

Without PyPI, install straight from a repository tag:

```bash
pip install "erupt-sdk @ git+https://github.com/erupt-io/erupt-sdk@python/v0.1.0#subdirectory=python"
```

Or copy the whole `python/src/erupt/` directory into your project as the package `erupt` (keep the two `.json` files next to the code). A copy does not update itself: when erupt changes the protocol or the annotation schema, replace the directory with the next release instead of merging by hand, and leave `__version__` in `node.py` untouched so the server shows which release the node runs.

## Quick Start

A trimmed version of `examples/blog.py` from the repository: a Category and an Article model stored in SQLite.

```python
import datetime
import os

from erupt import Field, Node, SqliteRepository, erupt, operation


@erupt("Category")
class Category:
    id: int = Field(pk=True)
    name: str = Field("Name", search=True, not_null=True, sortable=True)
    parent: int = Field("Parent Id")


@erupt("Publish Options")
class PublishForm:                       # an operation form only: no primary key needed
    publish_date: datetime.date = Field("Publish Date", not_null=True)


@erupt("Article", order_by="id desc")
class Article:
    id: int = Field(pk=True)
    title: str = Field("Title", search=True, not_null=True, sortable=True, edit={"inputType": {"length": 60}})
    summary: str = Field("Summary", type="TEXTAREA", table=False)
    category: Category = Field("Category", search=True)
    topic: Category = Field("Topic", tree="parent", table=False)
    status: str = Field("Status", choices={"draft": "Draft", "review": "In Review", "published": "Published"}, search=True)
    views: int = Field("Views", sortable=True)
    featured: bool = Field("Featured", search=True)
    publish_date: datetime.date = Field("Publish Date", search=True)

    @operation("Publish", icon="fa fa-paper-plane", form=PublishForm, if_expr="item.status !== 'published'")
    def publish(op):
        for row in op.rows:
            op.repo.update(row["id"], {"status": "published", "publish_date": op.param["publish_date"]})


if __name__ == "__main__":
    db = os.environ.get("ERUPT_DB", "blog.db")
    node = Node(os.environ.get("ERUPT_NODE_NAME", "blog"), os.environ["ERUPT_ACCESS_TOKEN"],
                os.environ.get("ERUPT_SERVER", "http://localhost:8080"))
    node.register(Category, SqliteRepository(db, "category"))
    node.register(Article, SqliteRepository(db, "article"))
    node.serve(port=int(os.environ.get("PORT", 9090)))
```

Then three steps on the erupt server (see [Cloud Server](/en/modules/cloud-server) for setting it up):

1. In Node Config create the node `blog` and copy its access token.
2. Add a menu of type `table` with the value `blog.Article` (and `blog.Category` the same way).
3. Run the node: `ERUPT_ACCESS_TOKEN=<token> ERUPT_SERVER=http://<erupt server>:8080 python blog.py`. The server must reach the node on `http://<node ip>:9090`; otherwise see `address` under [Running and Deploying](#running-and-deploying).

## Declaring Models

Decorate a class with `@erupt(title, ...)`; its `Field(...)` attributes are the fields. The model name defaults to the class name and is what the server addresses as `<node>.<Model>`; `name=` renames it.

| Python annotation | Edit type |
| --- | --- |
| `str` | INPUT |
| `int` / `float` | NUMBER |
| `bool` | BOOLEAN |
| `datetime.date` | DATE |
| `datetime.datetime` | DATE_TIME (the DATE component with a date-time picker) |
| any type + `choices={...}` | CHOICE |
| `list` + `choices={...}` | MULTI_CHOICE (stored as a JSON array) |
| `list` / `dict` | a JSON value (e.g. KEY_VALUE, stored as JSON text) |
| another `@erupt` class | REFERENCE_TABLE; REFERENCE_TREE with `tree=` |

An explicit `type=` wins over inference: `TEXTAREA`, `TAGS`, `AUTO_COMPLETE`, `ATTACHMENT` (the erupt server stores the upload, the node keeps its path), `HTML_EDITOR`, `MARKDOWN`, `CODE_EDITOR`, `COLOR`, `ICON`, `SIGNATURE`, `MAP`, `HIDDEN`, `RATE`, `SLIDER`, `BUTTON` (form only), and `CHECKBOX` / `TAB_TREE` / `TRANSFER` with `ref=` (stored as the JSON list of the picked keys).

Common `Field` arguments: `pk`, `search`, `not_null`, `sortable`, `table` (shown as a table column, default `True`), `form` (shown in the form, default `True`), `virtual=True` (form-only elements such as DIVIDE, CALLOUT, EMPTY, GROUP that are never read or written). `@erupt` arguments: `power` (`{"delete": False}` switches deleting off), `order_by` (the default order, applied by the node, e.g. `"views desc, id"`), `data_proxy`.

**Raw annotation attributes pass through**: `view={...}` / `edit={...}` on a field, and the remaining keyword arguments of `@erupt(...)` and `@operation(...)`, are merged into the build as raw `@View` / `@Edit` / `@Erupt` / `@RowOperation` attributes. They are validated against the annotation JSON Schema generated by erupt when the model is declared, so a misspelt key or enum value fails at import instead of silently doing nothing in the browser.

```python
@erupt("Article", layout={"pageSize": 30})
class Article:
    id: int = Field(pk=True)
    tags: str = Field("Tags", edit={"type": "TAGS", "tagsType": {"allowExtension": True, "joinSeparator": ","}})
    rating: float = Field("Rating", edit={"type": "RATE", "rateType": {"count": 5, "allowHalf": True}})
```

This is how the blog example does it: declare the field as the type it stores (`str` / `float`) and switch the widget with `edit={"type": ...}`. `src/erupt/_types.py` holds TypedDicts and Literals for every annotation attribute, for editor hints.

## References

Annotate a field with another `@erupt` class (declared earlier and registered on the same node). The repository stores the referenced primary key; the UI shows `label` (default `name`). Labels, flattened columns and reference trees are resolved by the erupt server, so the node serves no extra endpoint for them.

```python
@erupt("Category")
class Category:
    id: int = Field(pk=True)
    name: str = Field("Name", search=True)
    parent: int = Field("Parent Id")


@erupt("Article")
class Article:
    id: int = Field(pk=True)
    category: Category = Field("Category", search=True)       # table picker
    topic: Category = Field("Topic", tree="parent")           # tree picker over Category.parent
```

`ref=Category` names the target explicitly and `label="title"` changes the shown column. A table picker that depends on another field takes `edit={"referenceTableType": {"dependField": "province", "dependColumn": "province"}}`: the server lists only the records whose `dependColumn` holds the depend field's value.

## Row Operations

Decorate a function inside the model class with `@operation`. It receives an `OperationContext`: `op.rows` (the selected records), `op.param` (the form values, `None` without a form), `op.repo` and `op.user`.

```python
@erupt("Article")
class Article:
    ...

    @operation("Publish", icon="fa fa-paper-plane", form=PublishForm, if_expr="item.status !== 'published'")
    def publish(op):
        for row in op.rows:
            op.repo.update(row["id"], {"status": "published", "publish_date": op.param["publish_date"]})

    @operation("Feature", mode="SINGLE", icon="fa fa-star", confirm="Feature this article on the home page?")
    def feature(op):
        op.repo.update(op.rows[0]["id"], {"featured": True})
```

| Argument | Meaning |
| --- | --- |
| `mode` | `SINGLE` (row button), `MULTI` (default, row and toolbar), `MULTI_ONLY` (toolbar), `BUTTON` (toolbar, no rows) |
| `form` | an `@erupt` class whose fields are asked for before running; a form model needs no primary key and is not registered |
| `confirm` | `False` skips the confirm dialog, a string replaces its text |
| `show` | `show=lambda user: ...`; when false, the operation is hidden from that user and refused |
| `if_expr` | browser-side JS over `item` that disables the row button |
| `code` / `icon` / `tip` | operation code (the function name by default), icon, tooltip |

A returned string is executed as JavaScript in the browser, so return only code you wrote. Raise `Fail("...")` to show the user a message.

A field can also run its own code, which the server calls through the node's `invoke` endpoint: `fetch` (dynamic options of CHOICE / MULTI_CHOICE / TAGS), `onchange` (any field), `complete` (AUTO_COMPLETE) and `click` (BUTTON).

```python
@erupt("Order")
class Order:
    id: int = Field(pk=True)
    status: str = Field("Status", fetch=lambda form: {"new": "New", "paid": "Paid"})
    qty: int = Field("Qty", onchange=lambda form: {"formData": {"total": form["qty"] * 9}, "editExpr": {}})
    total: float = Field("Total")
    recalc = Field("Recalc", type="BUTTON", click=lambda form: {"eval": "alert('done')", "formData": {}})
```

## DataProxy

The counterpart of Java's `DataProxy`: subclass `DataProxy`, override only the hooks you need, and raise `Fail` to refuse with a message the user sees.

```python
from erupt import DataProxy, Fail, current_user


class ArticleProxy(DataProxy):
    def add_behavior(self, record):      # the new form's values
        record["status"] = "draft"

    def validate(self, record):          # before every add and update
        if "spam" in (record.get("title") or ""):
            raise Fail("no spam")

    def before_fetch(self, conditions):  # SQL ANDed to the table's WHERE, values bound
        return "owner = ?", [current_user()["uid"]]


@erupt("Article", data_proxy=ArticleProxy)   # one proxy or a list, classes or instances
class Article: ...
```

| Hook | Runs |
| --- | --- |
| `search_condition(condition)` | building the model: default values of the search bar |
| `before_fetch(conditions)` | before a table page is read: return `"sql"` or `("sql with ?", [values])`, ANDed to the WHERE as written; SQL repositories only, `MemoryRepository` refuses it |
| `after_fetch(rows)` | after a table page is read |
| `add_behavior(record)` | the new record form (`init-value`) |
| `edit_behavior(record)` | after a record is read by its key (edit form, detail view) |
| `validate(record)` | before an add or an update |
| `before_add` / `after_add(record)` | around `repository.add` |
| `before_update` / `after_update(record)` | around `repository.update`, with the submitted values |
| `before_delete` / `after_delete(record)` | around `repository.delete`, once per record |

## Storage

Storage is any `Repository` with five methods: `page`, `get`, `add`, `update`, `delete` (`bind(model)` has a default). Three ship with the SDK:

| Repository | Notes |
| --- | --- |
| `MemoryRepository(records=())` | in process, for tests and demos; cannot apply SQL filters (`before_fetch`, a view `filter`) |
| `SqliteRepository(path, table)` | standard-library `sqlite3`, creates the table when missing, one connection per thread |
| `SqlRepository(connect, table, dialect=..., release=..., paramstyle=...)` | any DB-API 2.0 driver; `dialect` is `sqlite`, `postgres`, `mysql`, `mssql` or `oracle` and decides identifier quotes and paging; the driver's paramstyle is detected |

```python
import psycopg                      # PostgreSQL
repo = SqlRepository(lambda: psycopg.connect(DSN), "article", dialect="postgres")

from psycopg_pool import ConnectionPool
pool = ConnectionPool(DSN)          # pooled: hand connections back instead of closing them
repo = SqlRepository(pool.getconn, "article", dialect="postgres", release=pool.putconn)

import pymysql                      # MySQL
repo = SqlRepository(lambda: pymysql.connect(**MYSQL), "article", dialect="mysql")
```

Create `SqlRepository` tables yourself (`auto_create` only applies to SQLite), with columns named like the fields. Every value is a bound parameter and LIKE escapes with `ESCAPE '!'`. Without a sort, every repository returns rows by primary key ascending.

A custom repository subclasses `Repository`: `page(query)` returns `(total, [record, ...])`, where `query` carries `conditions` (a list of `Cond(field, op, value)`), `sort`, `filters`, `offset` and `limit`. `query.filters` come from views and `before_fetch`; a repository that cannot apply them must raise, never ignore them. `current_user()` returns the acting user inside a repository call.

## Running and Deploying

```python
Node(name, access_token, servers, *, address=None, heartbeat=15, require_signature=False)
node.serve(host="0.0.0.0", port=9090)
```

`serve()` starts HTTP first (the server probes `/node-health` while registering), then the heartbeat. `servers` is one URL or a list, used round robin.

- **Environment variables**: the SDK reads none itself; your entry point passes them in. The examples all use `ERUPT_NODE_NAME` (default `blog`), `ERUPT_ACCESS_TOKEN`, `ERUPT_SERVER`, `PORT` (default 9090) and `ERUPT_DB` (SQLite file, default `blog.db`).
- **Node address**: defaults to `http://<local interface ip facing the server>:<port>`. Behind containers, NAT or a reverse proxy, when the server cannot reach that address, pass `address="http://node.example.com:9090"`.
- **Inside an existing server**: a `Node` is itself a WSGI application, but only `serve()` starts registration and the heartbeat, and the SDK has no public method to start them on their own, so run the node with `serve()`.
- **Graceful deregistration**: on `KeyboardInterrupt` (SIGINT / Ctrl+C) `serve()` stops the heartbeat and tells the server to drop the instance.

:::warning SIGTERM in containers
`serve()` handles SIGINT only. Docker and Kubernetes stop a container with SIGTERM, so the node does not deregister and the server drops it only when the heartbeat times out. To drop it at once, turn SIGTERM into a `KeyboardInterrupt` in your entry point, e.g. `signal.signal(signal.SIGTERM, signal.default_int_handler)`.
:::

`node.config()` / `node.group_config()` return the config text set on the server for the node and its group; `node.user_info()`, called while a request is served, returns the acting user's full info (roles, org, post).

## Signatures and Power

- **Request signatures**: when a forwarded call carries `Erupt-Signature`, the node verifies it as an HMAC-SHA256 keyed by the access token (300-second window); without a signature it checks the plain `Access-Token` header. `require_signature=True` accepts signed calls only (servers sign since erupt 2.3.x).
- **Erupt-Enforced** is trusted only under a valid signature. With `power` in it, the node skips the power callback and applies only the model's declared `power`; with `query`, it trusts the conditions the server already checked (such as those a dependent picker adds).
- **Power callback**: otherwise the node calls the server's `/erupt-cloud-api/erupt-power` with the user's session token and ANDs `add`, `edit`, `delete`, `viewDetails`, `export` and `importable` onto the declared `power`, cached 5 seconds per token and model. Without the server's answer nothing is allowed (fail closed).
- **Per-user visibility**: `@operation(show=...)` removes the operation from that user's build and refuses a direct call (403). `current_user()` returns `{"uid", "account", "name", "tenantId"}` for filtering data per user in repositories, hooks and operations.
- A call carrying an `Origin` header (a browser reaching the node directly) is always refused with 403; the node takes server-to-server calls only.

## Examples and Conformance

The blog example implements the full model of [SHOWCASE.md](https://github.com/erupt-io/erupt-sdk/blob/main/SHOWCASE.md) (Category, Article, Component). After creating node `blog` on the erupt server, run it from the repository's `python/` directory:

```bash
PYTHONPATH=src ERUPT_ACCESS_TOKEN=<token> ERUPT_SERVER=http://localhost:8080 python examples/blog.py
```

The conformance suite, where `conformance/run.py` plays the server, runs from the repository root:

```bash
python conformance/run.py -- python3 python/examples/conformance.py
```

Unit tests: `PYTHONPATH=src python -m unittest discover -s tests` in `python/`.

## Limitations

- Not yet: sub-tables (TAB_TABLE_*), TPL operations, i18n of messages.
- Print and AI endpoints are not served: the node switches `print` and `ai` off in its power, so the UI hides them.
- Trees, file upload and Excel import / export are done by the erupt server; the node implements none of them.
- Model nesting is not supported yet (a parent can only be the model itself).
