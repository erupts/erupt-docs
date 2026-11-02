# Python SDK

Python SDK 让任何 Python 服务以 erupt-cloud 节点的身份，把自己的类声明成 erupt 管理页面：模型与数据留在 Python 进程里，erupt 服务端负责界面、登录与菜单权限。它只依赖标准库，内置 HTTP 服务、SQLite 存储与任意 DB-API 2.0 驱动的 SQL 存储。

> 多语言 SDK 总览见 [Erupt SDK](/zh/modules/erupt-sdk/)，节点协议与服务端见 [Cloud Server](/zh/modules/cloud-server)。

## 环境要求

| 语言版本 | 运行时依赖 | 包名 | 版本 |
| --- | --- | --- | --- |
| Python 3.9+ | 无（仅标准库） | `erupt-sdk`（PyPI，导入名 `erupt`） | 0.1.0 |

## 安装

```bash
pip install erupt-sdk
```

不经过 PyPI，也可以直接从仓库的 tag 安装：

```bash
pip install "erupt-sdk @ git+https://github.com/erupt-io/erupt-sdk@python/v0.1.0#subdirectory=python"
```

或者把 `python/src/erupt/` 整个目录复制进项目作为 `erupt` 包（保留同目录下的两个 `.json` 文件）。复制的代码不会自动更新：erupt 的协议或注解 Schema 变化后，请用新版本整体替换该目录，不要手工合并，也不要改动 `node.py` 中的 `__version__`，服务端靠它显示节点运行的版本。

## 快速开始

下面是仓库中 `examples/blog.py` 的精简版：分类 + 文章两个模型，存储在 SQLite。

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
class PublishForm:                       # 只用作操作表单，不需要主键
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

然后在 erupt 服务端完成三步（服务端的搭建见 [Cloud Server](/zh/modules/cloud-server)）：

1. 在「节点配置（Node Config）」中创建节点 `blog`，复制它的 access token。
2. 新增一个类型为 `table` 的菜单，值为 `blog.Article`（同理可加 `blog.Category`）。
3. 运行节点：`ERUPT_ACCESS_TOKEN=<token> ERUPT_SERVER=http://<erupt 服务端>:8080 python blog.py`。服务端必须能通过 `http://<节点 IP>:9090` 访问到节点，否则见 [运行与部署](#运行与部署) 中的 `address`。

## 声明模型

用 `@erupt(title, ...)` 装饰一个类，类属性 `Field(...)` 就是字段。模型名默认是类名，服务端通过 `<节点名>.<模型名>` 访问它；`name=` 可以改名。

| Python 注解 | 编辑类型 |
| --- | --- |
| `str` | INPUT |
| `int` / `float` | NUMBER |
| `bool` | BOOLEAN |
| `datetime.date` | DATE |
| `datetime.datetime` | DATE_TIME（DATE 组件的日期时间选择器） |
| 任意类型 + `choices={...}` | CHOICE |
| `list` + `choices={...}` | MULTI_CHOICE（以 JSON 数组存储） |
| `list` / `dict` | JSON 值（如 KEY_VALUE，以 JSON 文本存储） |
| 另一个 `@erupt` 类 | REFERENCE_TABLE；带 `tree=` 时为 REFERENCE_TREE |

显式的 `type=` 优先于推断，可取 `TEXTAREA`、`TAGS`、`AUTO_COMPLETE`、`ATTACHMENT`（文件由 erupt 服务端保存，节点只存路径）、`HTML_EDITOR`、`MARKDOWN`、`CODE_EDITOR`、`COLOR`、`ICON`、`SIGNATURE`、`MAP`、`HIDDEN`、`RATE`、`SLIDER`、`BUTTON`（仅表单），以及配合 `ref=` 的 `CHECKBOX` / `TAB_TREE` / `TRANSFER`（以被选记录主键的 JSON 数组存储）。

`Field` 的常用参数：`pk`、`search`、`not_null`、`sortable`、`table`（是否显示为表格列，默认 `True`）、`form`（是否出现在表单，默认 `True`）、`virtual=True`（DIVIDE、CALLOUT、EMPTY、GROUP 等只在表单中出现、从不读写的元素）。`@erupt` 的参数：`power`（如 `{"delete": False}` 关闭删除）、`order_by`（默认排序，由节点执行，如 `"views desc, id"`）、`data_proxy`。

**原始注解属性透传**：字段上的 `view={...}` / `edit={...}`，以及 `@erupt(...)`、`@operation(...)` 的其余关键字参数，会作为 `@View` / `@Edit` / `@Erupt` / `@RowOperation` 的原始属性合并进构建结果。它们在声明模型时就按 erupt 生成的注解 JSON Schema 校验，拼错的键或枚举值会在导入时报错，而不是在浏览器里悄悄失效。

```python
@erupt("Article", layout={"pageSize": 30})
class Article:
    id: int = Field(pk=True)
    tags: str = Field("Tags", edit={"type": "TAGS", "tagsType": {"allowExtension": True, "joinSeparator": ","}})
    rating: float = Field("Rating", edit={"type": "RATE", "rateType": {"count": 5, "allowHalf": True}})
```

上例是 blog 示例的写法：按存储的类型（`str` / `float`）声明字段，再用 `edit={"type": ...}` 切换前端组件。`src/erupt/_types.py` 中有每个注解属性的 TypedDict 与 Literal，可用于编辑器提示。

## 引用

把字段注解为另一个 `@erupt` 类（须先声明、注册在同一节点上）即为引用。仓库只存被引用记录的主键，界面显示 `label`（默认 `name`）。引用标签、扁平列与引用树都由 erupt 服务端解析，节点无需提供额外接口。

```python
@erupt("Category")
class Category:
    id: int = Field(pk=True)
    name: str = Field("Name", search=True)
    parent: int = Field("Parent Id")


@erupt("Article")
class Article:
    id: int = Field(pk=True)
    category: Category = Field("Category", search=True)       # 表格选择器
    topic: Category = Field("Topic", tree="parent")           # 以 Category.parent 组织的树选择器
```

也可以用 `ref=Category` 显式指定目标，用 `label="title"` 改变显示列。依赖另一个字段的表格选择器写作 `edit={"referenceTableType": {"dependField": "province", "dependColumn": "province"}}`，服务端只列出 `dependColumn` 等于依赖字段值的记录。

## 行操作

在模型类中用 `@operation` 装饰一个函数，它收到 `OperationContext`：`op.rows`（选中的记录）、`op.param`（表单值，无表单时为 `None`）、`op.repo`、`op.user`。

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

| 参数 | 说明 |
| --- | --- |
| `mode` | `SINGLE`（行按钮）、`MULTI`（默认，行与工具栏）、`MULTI_ONLY`（仅工具栏）、`BUTTON`（工具栏，不选行） |
| `form` | 一个 `@erupt` 类，执行前先让用户填写其字段；表单模型不需要主键，也不注册 |
| `confirm` | `False` 跳过确认框，字符串替换确认文案 |
| `show` | `show=lambda user: ...`，返回假时对该用户隐藏操作并拒绝执行 |
| `if_expr` | 浏览器端基于 `item` 的 JS 表达式，控制行按钮是否可用 |
| `code` / `icon` / `tip` | 操作编码（默认函数名）、图标、提示 |

函数返回的字符串会作为 JavaScript 在浏览器中执行，只能返回你自己写的代码。抛出 `Fail("...")` 会把消息展示给用户。

字段也可以带自己的代码，由服务端通过节点的 `invoke` 接口调用：`fetch`（CHOICE / MULTI_CHOICE / TAGS 的动态选项）、`onchange`（任意字段）、`complete`（AUTO_COMPLETE）、`click`（BUTTON）。

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

与 Java 的 `DataProxy` 对应：继承 `DataProxy`，只覆盖需要的钩子，抛出 `Fail` 拒绝并提示用户。

```python
from erupt import DataProxy, Fail, current_user


class ArticleProxy(DataProxy):
    def add_behavior(self, record):      # 新增表单的初始值
        record["status"] = "draft"

    def validate(self, record):          # 每次新增、修改前
        if "spam" in (record.get("title") or ""):
            raise Fail("no spam")

    def before_fetch(self, conditions):  # 追加到表格 WHERE 的 SQL，值以参数绑定
        return "owner = ?", [current_user()["uid"]]


@erupt("Article", data_proxy=ArticleProxy)   # 一个或一个列表，类或实例均可
class Article: ...
```

| 钩子 | 执行时机 |
| --- | --- |
| `search_condition(condition)` | 构建模型时：搜索栏默认值 |
| `before_fetch(conditions)` | 读取表格页之前：返回 `"sql"` 或 `("带 ? 的 sql", [values])`，按原样 AND 到 WHERE；仅 SQL 仓库支持，`MemoryRepository` 会拒绝 |
| `after_fetch(rows)` | 读取表格页之后 |
| `add_behavior(record)` | 新增表单初始值（`init-value`） |
| `edit_behavior(record)` | 按主键读取记录之后（编辑表单、详情） |
| `validate(record)` | 新增或修改之前 |
| `before_add` / `after_add(record)` | `repository.add` 前后 |
| `before_update` / `after_update(record)` | `repository.update` 前后，参数为提交的值 |
| `before_delete` / `after_delete(record)` | `repository.delete` 前后，每条记录各一次 |

## 存储

存储是任意 `Repository`，实现 `page`、`get`、`add`、`update`、`delete` 五个方法（`bind(model)` 已有默认实现）。内置三种：

| 仓库 | 说明 |
| --- | --- |
| `MemoryRepository(records=())` | 进程内存储，用于测试和演示；不支持 SQL 过滤（`before_fetch`、视图 `filter`） |
| `SqliteRepository(path, table)` | 标准库 `sqlite3`，缺表时自动建表，每线程一个连接 |
| `SqlRepository(connect, table, dialect=..., release=..., paramstyle=...)` | 任意 DB-API 2.0 驱动；`dialect` 取 `sqlite`、`postgres`、`mysql`、`mssql`、`oracle`，决定标识符引号与分页；驱动的 paramstyle 自动识别 |

```python
import psycopg                      # PostgreSQL
repo = SqlRepository(lambda: psycopg.connect(DSN), "article", dialect="postgres")

from psycopg_pool import ConnectionPool
pool = ConnectionPool(DSN)          # 连接池：用 release 归还连接而不是关闭
repo = SqlRepository(pool.getconn, "article", dialect="postgres", release=pool.putconn)

import pymysql                      # MySQL
repo = SqlRepository(lambda: pymysql.connect(**MYSQL), "article", dialect="mysql")
```

`SqlRepository` 的表需要自己创建（`auto_create` 只对 SQLite 生效），列名与字段名一致。所有值都以参数绑定，LIKE 以 `ESCAPE '!'` 转义。不指定排序时，所有仓库都按主键升序返回。

自定义仓库只需继承 `Repository`：`page(query)` 返回 `(total, [record, ...])`，`query` 带 `conditions`（`Cond(field, op, value)` 列表）、`sort`、`filters`、`offset`、`limit`。`query.filters` 来自视图与 `before_fetch`，无法执行时应抛错，不能忽略。仓库内可用 `current_user()` 取得当前用户。

## 运行与部署

```python
Node(name, access_token, servers, *, address=None, heartbeat=15, require_signature=False)
node.serve(host="0.0.0.0", port=9090)
```

`serve()` 先启动 HTTP 服务（服务端注册时会探测 `/node-health`），再开始心跳注册；`servers` 可以是一个地址或列表，轮询使用。

- **环境变量**：SDK 本身不读取环境变量，由你的入口代码传入。示例统一使用 `ERUPT_NODE_NAME`（默认 `blog`）、`ERUPT_ACCESS_TOKEN`、`ERUPT_SERVER`、`PORT`（默认 9090）以及 `ERUPT_DB`（SQLite 文件，默认 `blog.db`）。
- **节点地址**：默认是 `http://<朝向服务端的本机网卡 IP>:<port>`。在容器、NAT 或反向代理后面，服务端访问不到这个地址时，用 `address="http://node.example.com:9090"` 指定。
- **嵌入已有服务**：`Node` 实例本身是一个 WSGI 应用，但注册心跳只由 `serve()` 启动，SDK 没有提供单独启动心跳的公开方法，因此推荐以 `serve()` 独立运行节点。
- **优雅注销**：`serve()` 收到 `KeyboardInterrupt`（SIGINT / Ctrl+C）时停止心跳并通知服务端注销该实例。

:::warning 容器中的 SIGTERM
`serve()` 只处理 SIGINT。Docker、Kubernetes 停止容器时发送的是 SIGTERM，此时节点不会主动注销，服务端要等心跳超时才摘除该实例。需要立即摘除时，可在入口中把 SIGTERM 转成 `KeyboardInterrupt`，例如 `signal.signal(signal.SIGTERM, signal.default_int_handler)`。
:::

`node.config()` / `node.group_config()` 返回服务端为该节点及其分组设置的配置文本；请求处理中调用 `node.user_info()` 可取得当前用户的完整信息（角色、组织、岗位）。

## 签名与权限

- **请求签名**：服务端转发的请求带 `Erupt-Signature` 时，节点用 access token 按 HMAC-SHA256 校验（时间窗 300 秒），通过后才视为合法；不带签名时校验明文 `Access-Token` 头。`require_signature=True` 后只接受签名请求（服务端自 erupt 2.3.x 起签名）。
- **Erupt-Enforced**：只在签名校验通过后才信任。其中包含 `power` 时，节点不再回调服务端取权限，只应用模型自己声明的 `power`；包含 `query` 时，信任服务端已校验过的查询条件（如依赖选择器追加的条件）。
- **权限回调**：未被服务端代为校验时，节点用用户会话 token 调用服务端 `/erupt-cloud-api/erupt-power`，把 `add`、`edit`、`delete`、`viewDetails`、`export`、`importable` 与模型声明的 `power` 取交集，每个 token + 模型缓存 5 秒；拿不到服务端结果时一律视为无权限（fail closed）。
- **按用户可见**：`@operation(show=...)` 对该用户从构建结果中移除操作，直接调用也会被拒绝（403）。`current_user()` 返回 `{"uid", "account", "name", "tenantId"}`，可在仓库、钩子与操作中按用户过滤数据。
- 带 `Origin` 头的请求（即浏览器直接访问节点）一律 403；节点只接受服务端之间的调用。

## 示例与一致性测试

blog 示例实现了 [SHOWCASE.md](https://github.com/erupt-io/erupt-sdk/blob/main/SHOWCASE.md) 的完整模型（Category、Article、Component）。在 erupt 服务端创建节点 `blog` 后，于仓库的 `python/` 目录运行：

```bash
PYTHONPATH=src ERUPT_ACCESS_TOKEN=<token> ERUPT_SERVER=http://localhost:8080 python examples/blog.py
```

一致性测试由 `conformance/run.py` 扮演服务端，于仓库根目录运行：

```bash
python conformance/run.py -- python3 python/examples/conformance.py
```

单元测试：在 `python/` 目录执行 `PYTHONPATH=src python -m unittest discover -s tests`。

## 能力边界

- 尚不支持：子表（TAB_TABLE_*）、TPL 操作、消息的国际化。
- 打印与 AI 功能的接口未实现，节点会在权限中关闭 `print` 与 `ai`，界面上不显示。
- 树视图、文件上传与 Excel 导入导出由 erupt 服务端完成，节点无需实现。
- 尚不支持模型嵌套（父模型只能是自身）。
