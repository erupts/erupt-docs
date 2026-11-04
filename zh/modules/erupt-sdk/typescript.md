# TypeScript / Node.js SDK

TypeScript / Node.js SDK 让任何 Node.js 服务以 erupt-cloud 节点的身份，用 `model()` 与 `field.*` 把数据声明成 erupt 管理页面：模型与数据留在 Node.js 进程里，erupt 服务端负责界面、登录与菜单权限。它没有运行时依赖，内置 `node:http` 服务、`node:sqlite` 存储，以及通过执行器（executor）适配 PostgreSQL、MySQL、SQL Server 驱动的 SQL 存储。

> 多语言 SDK 总览见 [Erupt SDK](/zh/modules/erupt-sdk/)，节点协议与服务端见 [Cloud Server](/zh/modules/cloud-server)。

## 环境要求

| 语言版本 | 运行时依赖 | 包名 | 版本 |
| --- | --- | --- | --- |
| Node.js 22+（`SqliteRepository` 需 22.5+），TypeScript 可选 | 无 | `erupt-sdk`（npm，ESM） | 0.1.0 |

## 安装

```bash
npm install erupt-sdk
```

npm 不能安装 git 仓库的子目录，不经过 npm 时需要从仓库 tag 打包：

```bash
git clone --depth 1 -b ts/v0.1.0 https://github.com/erupt-io/erupt-sdk && cd erupt-sdk/ts
npm ci && npm pack                       # 生成 erupt-sdk-0.1.0.tgz
npm install /path/to/erupt-sdk-0.1.0.tgz # 在你的项目中安装
```

也可以把 `ts/src/` 复制进项目与自己的源码一起编译：需要 Node 22+、TypeScript 5.3+、`"module": "nodenext"` 与 `"resolveJsonModule": true`，并保留同目录下的 `schema.json` 与 `defaults.json`。复制的代码不会自动更新：erupt 的协议或注解 Schema 变化后，请用新版本整体替换，不要手工合并，也不要改动 `node.ts` 中的 `VERSION`，服务端靠它显示节点运行的版本。

## 快速开始

下面是仓库中 `examples/blog.ts` 的精简版：分类 + 文章两个模型，存储在 SQLite（ESM 模块，可使用顶层 `await`）。

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

然后在 erupt 服务端完成三步（服务端的搭建见 [Cloud Server](/zh/modules/cloud-server)）：

1. 在「节点配置（Node Config）」中创建节点 `blog`，复制它的 access token。
2. 新增一个类型为 `table` 的菜单，值为 `blog.Article`（同理可加 `blog.Category`）。
3. 编译并运行节点：`ERUPT_ACCESS_TOKEN=<token> ERUPT_SERVER=http://<erupt 服务端>:8080 node dist/blog.js`。服务端必须能通过 `http://<节点 IP>:9090` 访问到节点，否则见 [运行与部署](#运行与部署) 中的 `address`。

## 声明模型

`model(name, fields, options?)` 声明一个模型，`name` 就是服务端访问的 `<节点名>.<模型名>` 中的模型名。TypeScript 没有运行时类型信息，因此编辑类型由字段工厂决定：

| 字段工厂 | 编辑类型 |
| --- | --- |
| `field.pk()` | 主键 |
| `field.input(title)` | INPUT |
| `field.textarea(title)` | TEXTAREA |
| `field.number(title)` | NUMBER |
| `field.boolean(title)` | BOOLEAN |
| `field.date(title)` | DATE |
| `field.dateTime(title)` | DATE_TIME（DATE 组件的日期时间选择器） |
| `field.choice(title, { value: label })` | CHOICE |
| `field.json(title, options?, choices?)` | 带 `choices`（或 `fetch`）为 MULTI_CHOICE，否则为 JSON 值（如 KEY_VALUE），以 JSON 文本存储 |
| `field.ref(target, title, { tree? })` | REFERENCE_TABLE；带 `tree` 时为 REFERENCE_TREE |
| `field.checkbox` / `field.transfer` / `field.tabTree(target, title)` | CHECKBOX / TRANSFER / TAB_TREE，以被选记录主键的 JSON 数组存储 |
| `field.button(title, click)` | BUTTON（仅表单） |
| `field.of(editType, title)` | 其他类型：`TAGS`、`AUTO_COMPLETE`、`ATTACHMENT`（文件由 erupt 服务端保存，节点只存路径）、`HTML_EDITOR`、`MARKDOWN`、`CODE_EDITOR`、`COLOR`、`ICON`、`SIGNATURE`、`MAP`、`HIDDEN`、`RATE`、`SLIDER` |

字段选项：`search`、`notNull`、`sortable`、`table`（是否显示为表格列，默认 `true`）、`form`（是否出现在表单，默认 `true`）、`virtual`（DIVIDE、CALLOUT、EMPTY、GROUP 等只在表单中出现、从不读写的元素），以及原始的 `view` / `edit`。模型选项：`title`、`power`（如 `{ delete: false }`）、`orderBy`（默认排序，由节点执行，如 `"views desc, id"`）、`erupt`、`operations`、`dataProxy`。

日期以不带时区的字符串保存：DATE 为 `2026-01-05`，DATE_TIME 为 `2026-01-05T10:30:00.000`。

**原始注解属性透传**：字段的 `view` / `edit`、模型的 `erupt`、操作的 `raw` 作为 `@View` / `@Edit` / `@Erupt` / `@RowOperation` 的原始属性合并进构建结果。它们由生成的 `View`、`Edit`、`Erupt`、`RowOperation` 接口提供类型，并在声明模型时按 erupt 生成的注解 JSON Schema 校验，拼错的键或枚举值会在启动时抛错，而不是在浏览器里悄悄失效。

```ts
const Article = model("Article", {
  id: field.pk(),
  tags: field.input("Tags", { edit: { type: "TAGS", tagsType: { allowExtension: true, joinSeparator: "," } } }),
  rating: field.number("Rating", { edit: { type: "RATE", rateType: { count: 5, allowHalf: true } } }),
}, { erupt: { layout: { pageSize: 30 } } });
```

blog 示例就是这样做的：用存储类型的工厂（文本或数字）声明字段，再用 `edit.type` 切换前端组件。

## 引用

`field.ref(target, title, options)` 引用另一个模型的记录，被引用模型要注册在同一节点上。仓库只存被引用记录的主键，界面显示 `label`（默认 `name`）。引用标签、扁平列与引用树都由 erupt 服务端解析，节点无需提供额外接口。

```ts
const Category = model("Category", { id: field.pk(), name: field.input("Name", { search: true }), parent: field.number("Parent Id") });

const Article = model("Article", {
  id: field.pk(),
  category: field.ref(Category, "Category", { search: true }),    // 表格选择器
  topic: field.ref(Category, "Topic", { tree: "parent" }),        // 以 Category.parent 组织的树选择器
});
```

依赖另一个字段的表格选择器写作 `edit: { referenceTableType: { dependField: "province", dependColumn: "province" } }`，服务端只列出 `dependColumn` 等于依赖字段值的记录。

## 行操作

在模型选项 `operations` 中声明，键就是操作编码。处理函数（可为 async）收到 `OperationContext`：`rows`（选中的记录）、`param`（表单值，无表单时为 `null`）、`repo`、`model`、`user`。

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

| 选项 | 说明 |
| --- | --- |
| `mode` | `SINGLE`（行按钮）、`MULTI`（默认，行与工具栏）、`MULTI_ONLY`（仅工具栏）、`BUTTON`（工具栏，不选行） |
| `form` | 一个模型，执行前先让用户填写其字段；表单模型不需要主键，也不注册 |
| `confirm` | `false` 跳过确认框，字符串替换确认文案 |
| `show` | `(user) => boolean`，返回假时对该用户隐藏并拒绝执行 |
| `ifExpr` | 浏览器端基于 `item` 的 JS 表达式，控制行按钮是否可用 |
| `code` / `icon` / `tip` / `raw` | 操作编码（默认取键名）、图标、提示、原始 `@RowOperation` 属性 |

处理函数返回的字符串会作为 JavaScript 在浏览器中执行，只能返回你自己写的代码。抛出 `new Fail("...")` 会把消息展示给用户。

字段也可以带自己的代码（同步或 async），由服务端通过节点的 `invoke` 接口调用：`fetch`（CHOICE / MULTI_CHOICE / TAGS 的动态选项）、`onchange`（任意字段）、`complete`（AUTO_COMPLETE）、`click`（BUTTON）。

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

与 Java 的 `DataProxy` 对应：实现需要的钩子（都可以是 async），抛出 `Fail` 拒绝并提示用户。

```ts
import { currentUser, type DataProxy, Fail } from "erupt-sdk";

const articleProxy: DataProxy = {
  addBehavior(record) {           // 新增表单的初始值
    record.status = "draft";
  },
  validate(record) {              // 每次新增、修改前
    if (String(record.title ?? "").includes("spam")) throw new Fail("no spam");
  },
  beforeFetch(conditions) {       // 追加到表格 WHERE 的 SQL，值以参数绑定
    return ["owner = ?", [currentUser()!.uid]];
  },
};

model("Article", { /* ... */ }, { dataProxy: articleProxy });   // 一个或一个数组
```

| 钩子 | 执行时机 |
| --- | --- |
| `searchCondition(condition)` | 构建模型时：搜索栏默认值 |
| `beforeFetch(conditions)` | 读取表格页之前：返回 `"sql"` 或 `["带 ? 的 sql", [values]]`，按原样 AND 到 WHERE；仅 SQL 仓库支持，`MemoryRepository` 会拒绝 |
| `afterFetch(rows)` | 读取表格页之后 |
| `addBehavior(record)` | 新增表单初始值（`init-value`） |
| `editBehavior(record)` | 按主键读取记录之后（编辑表单、详情） |
| `validate(record)` | 新增或修改之前 |
| `beforeAdd` / `afterAdd(record)` | `repository.add` 前后 |
| `beforeUpdate` / `afterUpdate(record)` | `repository.update` 前后，参数为提交的值 |
| `beforeDelete` / `afterDelete(record)` | `repository.delete` 前后，每条记录各一次 |

## 存储

存储是任意 `Repository`：`bind`、`page`、`get`、`add`、`update`、`delete`，可同步可 async。内置三种：

| 仓库 | 说明 |
| --- | --- |
| `new MemoryRepository(seed?)` | 进程内存储，用于测试和演示；不支持 SQL 过滤（`beforeFetch`、视图 `filter`） |
| `new SqliteRepository(path, table)` | 基于 `node:sqlite`（Node 22.5+），缺表时自动建表 |
| `new SqlRepository(executor, table, { dialect, quote?, autoCreate? })` | 任意 SQL 数据库；`dialect` 取 `sqlite`、`postgres`、`mysql`、`mssql`，决定占位符、标识符引号与分页 |

SDK 不依赖任何数据库驱动，用执行器包装你已在使用的驱动：`pgExecutor`（node-postgres）、`mysqlExecutor`（mysql2/promise）、`mssqlExecutor`（mssql）、`sqliteExecutor`（node:sqlite）。

```ts
import { mysqlExecutor, pgExecutor, SqlRepository } from "erupt-sdk";

import pg from "pg";                               // node-postgres
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
node.register(Article, new SqlRepository(pgExecutor(pool), "article", { dialect: "postgres" }));

import mysql from "mysql2/promise";
const db = mysql.createPool({ uri: process.env.DATABASE_URL, dateStrings: true });
node.register(Article, new SqlRepository(mysqlExecutor(db), "article", { dialect: "mysql" }));
```

其他驱动只需提供一个两方法的对象：`{ query(sql, params) => rows, execute(sql, params) }`。表需要自己创建（`autoCreate` 只对 SQLite 生效），列名与字段名一致。所有值都以参数绑定，LIKE 以 `!` 转义，PostgreSQL 使用 `ILIKE`，使各数据库都不区分大小写。不指定排序时，所有仓库都按主键升序返回。

:::tip 日期列
SDK 把 DATE / DATE_TIME 当作不带时区的字符串读写，请存进不带时区的列（`date`、`timestamp`、`datetime`），并尽量让驱动以字符串返回：mysql2 设置 `dateStrings: true`；node-postgres 设置 `pg.types.setTypeParser(1082, String)` 与 `(1114, String)`；mssql 设置 `options: { useUTC: false }`。
:::

自定义仓库的 `page(query)` 返回 `[total, records]`，`query` 带 `conditions`、`sort`（`[字段, 是否降序]`）、`filters`、`offset`、`limit`。`query.filters` 来自视图与 `beforeFetch`，无法执行时必须抛错，不能忽略。仓库与操作中可用 `currentUser()` 取得当前用户。

## 运行与部署

```ts
new Node(name, accessToken, servers, { address?, heartbeat?, requireSignature? })
await node.serve(port = 9090, host = "0.0.0.0")
```

`serve()` 先启动 HTTP 服务（服务端注册时会探测 `/node-health`），再开始心跳（默认 15 秒）；`servers` 可以是一个地址或数组，轮询使用。

- **环境变量**：SDK 本身不读取环境变量，由你的入口代码传入。示例统一使用 `ERUPT_NODE_NAME`（默认 `blog`）、`ERUPT_ACCESS_TOKEN`、`ERUPT_SERVER`、`PORT`（默认 9090）以及 `ERUPT_DB`（SQLite 文件，默认 `blog.db`）。
- **节点地址**：默认是 `http://<朝向服务端的本机网卡 IP>:<port>`。在容器、NAT 或反向代理后面，服务端访问不到这个地址时，传入 `{ address: "http://node.example.com:9090" }`。
- **优雅注销**：`serve()` 收到 SIGINT 或 SIGTERM 时通知服务端注销该实例，并关闭 HTTP 服务。
- **挂进已有服务**：`node.listener` 是普通的 `(req, res)` 处理函数，可交给任意 `node:http` 服务。此时需传入 `address`，在开始监听后调用 `node.startHeartbeat()`，退出时调用 `node.deregister()`。

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

`node.config()` / `node.groupConfig()` 返回服务端为该节点及其分组设置的配置文本；请求处理中调用 `node.userInfo()` 可取得当前用户的完整信息（角色、组织、岗位）。

## 签名与权限

- **请求签名**：服务端转发的请求带 `Erupt-Signature` 时，节点用 access token 按 HMAC-SHA256 校验（时间窗 300 秒），通过后才视为合法；不带签名时校验明文 `Access-Token` 头。`requireSignature: true` 后只接受签名请求（服务端自 erupt 2.3.x 起签名）。`signRequest` / `verifySignature` 也公开导出。
- **Erupt-Enforced**：只在签名校验通过后才信任。其中包含 `power` 时，节点不再回调服务端取权限，只应用模型自己声明的 `power`；包含 `query` 时，信任服务端已校验过的查询条件（如依赖选择器追加的条件）。
- **权限回调**：未被服务端代为校验时，节点用用户会话 token 调用服务端 `/erupt-cloud-api/erupt-power`，把 `add`、`edit`、`delete`、`viewDetails`、`export`、`importable` 与模型声明的 `power` 取交集，每个 token + 模型缓存 5 秒；拿不到服务端结果时一律视为无权限（fail closed）。
- **按用户可见**：操作的 `show` 对该用户从构建结果中移除操作，直接调用也会被拒绝（403）。`currentUser()` 返回 `{ uid, account, name, tenantId }`，可在仓库、钩子与操作中按用户过滤数据。
- 带 `Origin` 头的请求（即浏览器直接访问节点）一律 403；节点只接受服务端之间的调用。

## 示例与一致性测试

blog 示例实现了 [SHOWCASE.md](https://github.com/erupt-io/erupt-sdk/blob/main/SHOWCASE.md) 的完整模型（Category、Article、Component）。在 erupt 服务端创建节点 `blog` 后，于仓库的 `ts/` 目录运行：

```bash
npm install && npm run build
ERUPT_ACCESS_TOKEN=<token> ERUPT_SERVER=http://localhost:8080 node dist/examples/blog.js
```

一致性测试由 `conformance/run.py` 扮演服务端。在 `ts/` 目录执行 `npm run conformance`（先编译再运行），或编译后于仓库根目录运行：

```bash
python conformance/run.py -- node ts/dist/examples/conformance.js
```

单元测试：在 `ts/` 目录执行 `npm test`。

## 能力边界

- 尚不支持：子表（TAB_TABLE_*）、TPL 操作、消息的国际化。
- 打印与 AI 功能的接口未实现，节点会在权限中关闭 `print` 与 `ai`，界面上不显示。
- `SqlRepository` 不支持 Oracle 方言。
- 树视图、文件上传与 Excel 导入导出由 erupt 服务端完成，节点无需实现。
- 尚不支持模型嵌套（父模型只能是自身）。
