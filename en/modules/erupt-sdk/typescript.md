# TypeScript / Node.js SDK

The TypeScript / Node.js SDK turns any Node.js service into an erupt-cloud node that declares its data as erupt admin pages with `model()` and `field.*`: models and data stay in the Node.js process, while the erupt server renders the UI, logs users in and checks menus. It has no runtime dependencies and ships a `node:http` server, `node:sqlite` storage, and SQL storage that adapts PostgreSQL, MySQL and SQL Server drivers through executors.

> For an overview of every language see [Erupt SDK](/en/modules/erupt-sdk/); for the node protocol and the server see [Cloud Server](/en/modules/cloud-server).

## Requirements

| Language version | Runtime dependencies | Package | Version |
| --- | --- | --- | --- |
| Node.js 22+ (22.5+ for `SqliteRepository`), TypeScript optional | None | `erupt-sdk` (npm, ESM) | 0.1.0 |

## Installation

```bash
npm install erupt-sdk
```

npm cannot install a subdirectory of a git repository, so without npm build a tarball from a repository tag:

```bash
git clone --depth 1 -b ts/v0.1.0 https://github.com/erupt-io/erupt-sdk && cd erupt-sdk/ts
npm ci && npm pack                       # erupt-sdk-0.1.0.tgz
npm install /path/to/erupt-sdk-0.1.0.tgz # in your project
```

Or copy `ts/src/` into your project and compile it with your own sources: it needs Node 22+, TypeScript 5.3+, `"module": "nodenext"` and `"resolveJsonModule": true`, and keeps `schema.json` and `defaults.json` next to the code. A copy does not update itself: when erupt changes the protocol or the annotation schema, replace it with the next release instead of merging by hand, and leave `VERSION` in `node.ts` untouched so the server shows which release the node runs.

## Quick Start

A trimmed version of `examples/blog.ts` from the repository: a Category and an Article model stored in SQLite (an ES module, so top-level `await` works).

```ts
import { field, model, Node, operation, SqliteRepository } from "erupt-sdk";

const Category = model("Category", {
  id: field.pk(),
  name: field.input("Name", { search: true, notNull: true, sortable: true }),
  parent: field.number("Parent Id"),
});

const PublishForm = model("PublishForm", {
  publish_date: field.date("Publish Date", { notNull: true }),
}, { title: "Publish Options" });

const Article = model("Article", {
  id: field.pk(),
  title: field.input("Title", { search: true, notNull: true, sortable: true, edit: { inputType: { length: 60 } } }),
  summary: field.textarea("Summary", { table: false }),
  category: field.ref(Category, "Category", { search: true }),
  topic: field.ref(Category, "Topic", { tree: "parent", table: false }),
  status: field.choice("Status", { draft: "Draft", review: "In Review", published: "Published" }, { search: true }),
  views: field.number("Views", { sortable: true }),
  featured: field.boolean("Featured", { search: true }),
  publish_date: field.date("Publish Date", { search: true }),
}, {
  orderBy: "id desc",
  operations: {
    publish: operation("Publish", { icon: "fa fa-paper-plane", form: PublishForm, ifExpr: "item.status !== 'published'" },
      async (op) => {
        for (const row of op.rows) await op.repo.update(row.id, { status: "published", publish_date: op.param!.publish_date });
      }),
  },
});

const env = process.env;
const db = env.ERUPT_DB ?? "blog.db";
const node = new Node(env.ERUPT_NODE_NAME ?? "blog", env.ERUPT_ACCESS_TOKEN!, env.ERUPT_SERVER ?? "http://localhost:8080");
node.register(Category, new SqliteRepository(db, "category"));
node.register(Article, new SqliteRepository(db, "article"));
await node.serve(Number(env.PORT ?? 9090));
```

Then three steps on the erupt server (see [Cloud Server](/en/modules/cloud-server) for setting it up):

1. In Node Config create the node `blog` and copy its access token.
2. Add a menu of type `table` with the value `blog.Article` (and `blog.Category` the same way).
3. Compile and run the node: `ERUPT_ACCESS_TOKEN=<token> ERUPT_SERVER=http://<erupt server>:8080 node dist/blog.js`. The server must reach the node on `http://<node ip>:9090`; otherwise see `address` under [Running and Deploying](#running-and-deploying).

## Declaring Models

`model(name, fields, options?)` declares a model; `name` is the model part of `<node>.<Model>` that the server addresses. TypeScript has no runtime types, so the field factory decides the edit type:

| Field factory | Edit type |
| --- | --- |
| `field.pk()` | primary key |
| `field.input(title)` | INPUT |
| `field.textarea(title)` | TEXTAREA |
| `field.number(title)` | NUMBER |
| `field.boolean(title)` | BOOLEAN |
| `field.date(title)` | DATE |
| `field.dateTime(title)` | DATE_TIME (the DATE component with a date-time picker) |
| `field.choice(title, { value: label })` | CHOICE |
| `field.json(title, options?, choices?)` | MULTI_CHOICE with `choices` (or `fetch`), otherwise a JSON value (e.g. KEY_VALUE); stored as JSON text |
| `field.ref(target, title, { tree? })` | REFERENCE_TABLE; REFERENCE_TREE with `tree` |
| `field.checkbox` / `field.transfer` / `field.tabTree(target, title)` | CHECKBOX / TRANSFER / TAB_TREE, stored as the JSON list of the picked keys |
| `field.button(title, click)` | BUTTON (form only) |
| `field.of(editType, title)` | the rest: `TAGS`, `AUTO_COMPLETE`, `ATTACHMENT` (the erupt server stores the upload, the node keeps its path), `HTML_EDITOR`, `MARKDOWN`, `CODE_EDITOR`, `COLOR`, `ICON`, `SIGNATURE`, `MAP`, `HIDDEN`, `RATE`, `SLIDER` |

Field options: `search`, `notNull`, `sortable`, `table` (shown as a table column, default `true`), `form` (shown in the form, default `true`), `virtual` (form-only elements such as DIVIDE, CALLOUT, EMPTY, GROUP that are never read or written), and raw `view` / `edit`. Model options: `title`, `power` (`{ delete: false }`), `orderBy` (the default order, applied by the node, e.g. `"views desc, id"`), `erupt`, `operations`, `dataProxy`.

Dates are stored as wall-clock strings: DATE `2026-01-05`, DATE_TIME `2026-01-05T10:30:00.000`.

**Raw annotation attributes pass through**: a field's `view` / `edit`, the model's `erupt` and an operation's `raw` are merged into the build as raw `@View` / `@Edit` / `@Erupt` / `@RowOperation` attributes. They are typed by the generated `View`, `Edit`, `Erupt` and `RowOperation` interfaces and validated against the annotation JSON Schema generated by erupt when the model is declared, so a misspelt key or enum value throws at startup instead of silently doing nothing in the browser.

```ts
const Article = model("Article", {
  id: field.pk(),
  tags: field.input("Tags", { edit: { type: "TAGS", tagsType: { allowExtension: true, joinSeparator: "," } } }),
  rating: field.number("Rating", { edit: { type: "RATE", rateType: { count: 5, allowHalf: true } } }),
}, { erupt: { layout: { pageSize: 30 } } });
```

This is how the blog example does it: declare the field with the factory of the type it stores (text or number) and switch the widget with `edit.type`.

## References

`field.ref(target, title, options)` references a record of another model, which must be registered on the same node. The repository stores the referenced primary key; the UI shows `label` (default `name`). Labels, flattened columns and reference trees are resolved by the erupt server, so the node serves no extra endpoint for them.

```ts
const Category = model("Category", { id: field.pk(), name: field.input("Name", { search: true }), parent: field.number("Parent Id") });

const Article = model("Article", {
  id: field.pk(),
  category: field.ref(Category, "Category", { search: true }),    // table picker
  topic: field.ref(Category, "Topic", { tree: "parent" }),        // tree picker over Category.parent
});
```

A table picker that depends on another field takes `edit: { referenceTableType: { dependField: "province", dependColumn: "province" } }`: the server lists only the records whose `dependColumn` holds the depend field's value.

## Row Operations

Declare them in the model option `operations`; the key is the operation code. The handler (may be async) receives an `OperationContext`: `rows` (the selected records), `param` (the form values, `null` without a form), `repo`, `model` and `user`.

```ts
model("Article", { /* ... */ }, {
  operations: {
    publish: operation("Publish", { icon: "fa fa-paper-plane", form: PublishForm, ifExpr: "item.status !== 'published'" },
      async (op) => {
        for (const row of op.rows) await op.repo.update(row.id, { status: "published", publish_date: op.param!.publish_date });
      }),
    feature: operation("Feature", { mode: "SINGLE", icon: "fa fa-star", confirm: "Feature this article on the home page?" },
      async (op) => {
        await op.repo.update(op.rows[0].id, { featured: true });
      }),
  },
});
```

| Option | Meaning |
| --- | --- |
| `mode` | `SINGLE` (row button), `MULTI` (default, row and toolbar), `MULTI_ONLY` (toolbar), `BUTTON` (toolbar, no rows) |
| `form` | a model whose fields are asked for before running; a form model needs no primary key and is not registered |
| `confirm` | `false` skips the confirm dialog, a string replaces its text |
| `show` | `(user) => boolean`; when false, the operation is hidden from that user and refused |
| `ifExpr` | browser-side JS over `item` that disables the row button |
| `code` / `icon` / `tip` / `raw` | operation code (the key by default), icon, tooltip, raw `@RowOperation` attributes |

A returned string is executed as JavaScript in the browser, so return only code you wrote. Throw `new Fail("...")` to show the user a message.

A field can also run its own code (sync or async), which the server calls through the node's `invoke` endpoint: `fetch` (dynamic options of CHOICE / MULTI_CHOICE / TAGS), `onchange` (any field), `complete` (AUTO_COMPLETE) and `click` (BUTTON).

```ts
const Order = model("Order", {
  id: field.pk(),
  status: field.choice("Status", {}, { fetch: (form) => ({ new: "New", paid: "Paid" }) }),
  qty: field.number("Qty", { onchange: (form) => ({ formData: { total: form.qty * 9 }, editExpr: {} }) }),
  total: field.number("Total"),
  recalc: field.button("Recalc", (form) => ({ eval: "alert('done')", formData: {} })),
});
```

## DataProxy

The counterpart of Java's `DataProxy`: implement the hooks you need (each may be async) and throw `Fail` to refuse with a message the user sees.

```ts
import { currentUser, type DataProxy, Fail } from "erupt-sdk";

const articleProxy: DataProxy = {
  addBehavior(record) {           // the new form's values
    record.status = "draft";
  },
  validate(record) {              // before every add and update
    if (String(record.title ?? "").includes("spam")) throw new Fail("no spam");
  },
  beforeFetch(conditions) {       // SQL ANDed to the table's WHERE, values bound
    return ["owner = ?", [currentUser()!.uid]];
  },
};

model("Article", { /* ... */ }, { dataProxy: articleProxy });   // one proxy or an array
```

| Hook | Runs |
| --- | --- |
| `searchCondition(condition)` | building the model: default values of the search bar |
| `beforeFetch(conditions)` | before a table page is read: return `"sql"` or `["sql with ?", [values]]`, ANDed to the WHERE as written; SQL repositories only, `MemoryRepository` refuses it |
| `afterFetch(rows)` | after a table page is read |
| `addBehavior(record)` | the new record form (`init-value`) |
| `editBehavior(record)` | after a record is read by its key (edit form, detail view) |
| `validate(record)` | before an add or an update |
| `beforeAdd` / `afterAdd(record)` | around `repository.add` |
| `beforeUpdate` / `afterUpdate(record)` | around `repository.update`, with the submitted values |
| `beforeDelete` / `afterDelete(record)` | around `repository.delete`, once per record |

## Storage

Storage is any `Repository`: `bind`, `page`, `get`, `add`, `update`, `delete`, sync or async. Three ship with the SDK:

| Repository | Notes |
| --- | --- |
| `new MemoryRepository(seed?)` | in process, for tests and demos; cannot apply SQL filters (`beforeFetch`, a view `filter`) |
| `new SqliteRepository(path, table)` | over `node:sqlite` (Node 22.5+), creates the table when missing |
| `new SqlRepository(executor, table, { dialect, quote?, autoCreate? })` | any SQL database; `dialect` is `sqlite`, `postgres`, `mysql` or `mssql` and picks placeholders, identifier quotes and paging |

The SDK depends on no database driver: wrap the one you already use in an executor, `pgExecutor` (node-postgres), `mysqlExecutor` (mysql2/promise), `mssqlExecutor` (mssql) or `sqliteExecutor` (node:sqlite).

```ts
import { mysqlExecutor, pgExecutor, SqlRepository } from "erupt-sdk";

import pg from "pg";                               // node-postgres
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
node.register(Article, new SqlRepository(pgExecutor(pool), "article", { dialect: "postgres" }));

import mysql from "mysql2/promise";
const db = mysql.createPool({ uri: process.env.DATABASE_URL, dateStrings: true });
node.register(Article, new SqlRepository(mysqlExecutor(db), "article", { dialect: "mysql" }));
```

Any other driver works through a two-method object: `{ query(sql, params) => rows, execute(sql, params) }`. Create the tables yourself (`autoCreate` is SQLite only), with columns named like the fields. Every value is bound, LIKE escapes with `!`, and PostgreSQL searches with `ILIKE` so every database matches case-insensitively. Without a sort, every repository returns rows by primary key ascending.

:::tip Date columns
The SDK reads and writes DATE / DATE_TIME as wall-clock strings, so store them in columns without a time zone (`date`, `timestamp`, `datetime`) and prefer drivers that return them as strings: mysql2 `dateStrings: true`; node-postgres `pg.types.setTypeParser(1082, String)` and `(1114, String)`; mssql `options: { useUTC: false }`.
:::

A custom repository's `page(query)` returns `[total, records]`, where `query` carries `conditions`, `sort` (`[field, descending]`), `filters`, `offset` and `limit`. `query.filters` come from views and `beforeFetch`; a repository that cannot apply them must throw, never ignore them. `currentUser()` returns the acting user inside repository and operation calls.

## Running and Deploying

```ts
new Node(name, accessToken, servers, { address?, heartbeat?, requireSignature? })
await node.serve(port = 9090, host = "0.0.0.0")
```

`serve()` starts HTTP first (the server probes `/node-health` while registering), then the heartbeat (every 15 seconds by default). `servers` is one URL or an array, used round robin.

- **Environment variables**: the SDK reads none itself; your entry point passes them in. The examples all use `ERUPT_NODE_NAME` (default `blog`), `ERUPT_ACCESS_TOKEN`, `ERUPT_SERVER`, `PORT` (default 9090) and `ERUPT_DB` (SQLite file, default `blog.db`).
- **Node address**: defaults to `http://<local interface ip facing the server>:<port>`. Behind containers, NAT or a reverse proxy, when the server cannot reach that address, pass `{ address: "http://node.example.com:9090" }`.
- **Graceful deregistration**: on SIGINT or SIGTERM `serve()` tells the server to drop the instance and closes the HTTP server.
- **Inside an existing server**: `node.listener` is a plain `(req, res)` handler for any `node:http` server. Then pass `address`, call `node.startHeartbeat()` once it listens and `node.deregister()` on shutdown.

```ts
import { createServer } from "node:http";

const node = new Node("blog", process.env.ERUPT_ACCESS_TOKEN!, "http://erupt-server:8080", { address: "http://node.example.com:9090" });
const server = createServer(node.listener);
server.listen(9090, () => node.startHeartbeat());
process.once("SIGTERM", async () => {
  await node.deregister();
  server.close();
});
```

`node.config()` / `node.groupConfig()` return the config text set on the server for the node and its group; `node.userInfo()`, called while a request is served, returns the acting user's full info (roles, org, post).

## Signatures and Power

- **Request signatures**: when a forwarded call carries `Erupt-Signature`, the node verifies it as an HMAC-SHA256 keyed by the access token (300-second window); without a signature it checks the plain `Access-Token` header. With `requireSignature: true` only signed calls pass (servers sign since erupt 2.3.x). `signRequest` / `verifySignature` are exported too.
- **Erupt-Enforced** is trusted only under a valid signature. With `power` in it, the node skips the power callback and applies only the model's declared `power`; with `query`, it trusts the conditions the server already checked (such as those a dependent picker adds).
- **Power callback**: otherwise the node calls the server's `/erupt-cloud-api/erupt-power` with the user's session token and ANDs `add`, `edit`, `delete`, `viewDetails`, `export` and `importable` onto the declared `power`, cached 5 seconds per token and model. Without the server's answer nothing is allowed (fail closed).
- **Per-user visibility**: an operation's `show` removes it from that user's build and refuses a direct call (403). `currentUser()` returns `{ uid, account, name, tenantId }` for filtering data per user in repositories, hooks and operations.
- A call carrying an `Origin` header (a browser reaching the node directly) is always refused with 403; the node takes server-to-server calls only.

## Examples and Conformance

The blog example implements the full model of [SHOWCASE.md](https://github.com/erupt-io/erupt-sdk/blob/main/SHOWCASE.md) (Category, Article, Component). After creating node `blog` on the erupt server, run it from the repository's `ts/` directory:

```bash
npm install && npm run build
ERUPT_ACCESS_TOKEN=<token> ERUPT_SERVER=http://localhost:8080 node dist/examples/blog.js
```

The conformance suite, where `conformance/run.py` plays the server, runs with `npm run conformance` in `ts/` (it builds first), or after a build from the repository root:

```bash
python conformance/run.py -- node ts/dist/examples/conformance.js
```

Unit tests: `npm test` in `ts/`.

## Limitations

- Not yet: sub-tables (TAB_TABLE_*), TPL operations, i18n of messages.
- Print and AI endpoints are not served: the node switches `print` and `ai` off in its power, so the UI hides them.
- `SqlRepository` has no Oracle dialect.
- Trees, file upload and Excel import / export are done by the erupt server; the node implements none of them.
- Model nesting is not supported yet (a parent can only be the model itself).
