# PHP SDK

PHP SDK 让 PHP 服务以 erupt-cloud 节点的身份，把用 PHP 8 Attribute 声明的模型变成 erupt 管理页面：模型与数据留在节点上，erupt 服务端负责渲染界面、登录与菜单权限。SDK 没有任何 Composer 依赖，可运行在 `php -S`、PHP-FPM 或 Laravel 等框架之中。

> 多语言 SDK 总览见 [Erupt SDK](/zh/modules/erupt-sdk/)，节点协议与服务端见 [Cloud Server](/zh/modules/cloud-server)。

## 环境要求

| 语言版本 | 运行时依赖 | 包名 | 版本 |
| --- | --- | --- | --- |
| PHP 8.1+ | `ext-json`、`ext-pdo`；可选 `ext-pdo_sqlite`（SQLite）、`ext-pcntl`（退出时注销） | `erupt-io/erupt-sdk`（Packagist） | 0.1.0 |

服务端需为 erupt **2.4.0+**。

## 安装

```bash
composer require erupt-io/erupt-sdk
```

不使用 Packagist 时，可让 Composer 指向只读拆分仓库：

```json
{
  "repositories": [{ "type": "vcs", "url": "https://github.com/erupt-io/erupt-sdk-php" }],
  "require": { "erupt-io/erupt-sdk": "^0.1" }
}
```

也可以把仓库中的 `php/` 目录（`autoload.php`、`src/`、`resources/`）复制进项目，然后 `require 'erupt-sdk/php/autoload.php';`。

:::warning 复制源码的升级方式
复制的代码不会自动更新。erupt 修改协议或注解 Schema 后，请用新版本整体替换该目录，不要手工合并，也不要改动 `Node::VERSION`，服务端依靠它显示节点运行的版本。
:::

## 快速开始

以示例博客（`php/examples/blog`）的精简版为例。PHP-FPM 与 `php -S` 每个请求都是新进程，因此节点由两部分组成：处理请求的前端控制器，和一个常驻的注册（心跳）进程。

```php
<?php // app.php：模型与节点，router.php 和 heartbeat.php 共用
require __DIR__ . '/vendor/autoload.php';

use Erupt\Attribute\{Erupt, Field};
use Erupt\{Node, PdoRepository};

#[Erupt('Category')]
final class Category
{
    #[Field(pk: true)] public int $id;
    #[Field('Name', search: true, notNull: true, sortable: true)] public string $name;
    #[Field('Parent Id')] public ?int $parent;
}

#[Erupt('Article', orderBy: 'id desc')]
final class Article
{
    #[Field(pk: true)] public int $id;
    #[Field('Title', search: true, notNull: true, sortable: true)] public string $title;
    #[Field('Category', search: true)] public ?Category $category;
    #[Field('Status', choices: ['draft' => 'Draft', 'review' => 'In Review', 'published' => 'Published'], search: true)]
    public string $status;
    #[Field('Views', sortable: true)] public int $views;
    #[Field('Featured', search: true)] public bool $featured;
    #[Field('Publish Date', type: 'DATE', search: true)] public ?string $publish_date;
    #[Field('Summary', type: 'TEXTAREA', table: false)] public ?string $summary;
}

$pdo = new PDO('sqlite:' . (getenv('ERUPT_DB') ?: __DIR__ . '/blog.db'));
return (new Node(getenv('ERUPT_NODE_NAME') ?: 'blog', (string) getenv('ERUPT_ACCESS_TOKEN'), getenv('ERUPT_SERVER') ?: 'http://localhost:8080'))
    ->register(Category::class, new PdoRepository($pdo, 'category'))
    ->register(Article::class, new PdoRepository($pdo, 'article'));
```

```php
<?php // router.php：处理服务端转发的请求
(require __DIR__ . '/app.php')->run();
```

```php
<?php // heartbeat.php：注册与心跳
(require __DIR__ . '/app.php')->heartbeat((int) (getenv('PORT') ?: 9090));
```

```bash
export ERUPT_ACCESS_TOKEN=<access-token> ERUPT_SERVER=http://localhost:8080
php -S 0.0.0.0:9090 router.php      # 请求
PORT=9090 php heartbeat.php         # 注册
```

服务端配置（详见 [Cloud Server](/zh/modules/cloud-server)）：

1. 在服务端「节点管理」（Node Config）中创建节点 `blog`，复制它的 access-token
2. 新增类型为 `table` 的菜单，类型值填 `blog.Article`（同理可加 `blog.Category`）
3. 启动上面两个进程。服务端需能访问 `http://<节点 ip>:9090`，否则在 `Node` 构造时传入 `address:`

## 声明模型

类上加 `#[Erupt]`，属性上加 `#[Field]`。属性名就是存储列名与接口字段名；记录在 SDK 内部是关联数组。

编辑类型按属性类型推断，`type:` 可显式覆盖：

| PHP 类型 | 编辑类型 |
| --- | --- |
| `string` | INPUT |
| `int` / `float` | NUMBER |
| `bool` | BOOLEAN |
| `DateTimeInterface`（如 `DateTimeImmutable`） | DATE_TIME |
| 另一个 `#[Erupt]` 类 | REFERENCE_TABLE（设置 `tree:` 时为 REFERENCE_TREE） |
| 带 `choices:` 的标量 | CHOICE |
| 带 `choices:` 的 `array` | MULTI_CHOICE（以 JSON 数组存储） |
| `object` / `stdClass` | JSON 对象（配合 `edit: ['type' => 'KEY_VALUE']`） |

日期以墙上时间字符串存储：DATE 为 `2026-01-05`（声明为 `string` 并写 `type: 'DATE'`），DATE_TIME 为 `2026-01-05T10:30:00.000`。

`#[Field]` 参数：`title`、`type`、`pk`、`search`、`notNull`、`sortable`、`table`（是否显示为表格列）、`form`（是否出现在表单）、`choices`、`ref`、`label`（引用显示字段，默认 `name`）、`tree`、`view`、`edit`、`virtual`、`fetch`、`onchange`、`complete`、`click`。

`#[Erupt]` 参数：`title`、`name`（默认类的短名，即菜单中 `<节点>.<name>` 的部分）、`power`（如 `['delete' => false]`）、`orderBy`（如 `'views desc, id'`，由节点执行）、`dataProxy`、`raw`。

### 原始注解属性

`view:` / `edit:` 是 `@View` / `@Edit` 的原始属性，`raw:` 是 `@Erupt` 的原始属性。它们由生成的 `Erupt\Types\Annotations` 数组形状和 `Erupt\Types` 枚举（`EditType`、`RowOperationMode` 等）描述，并在模型编译时按 erupt 注解 Schema 校验，拼错的键或枚举值会在启动时报错，而不是在浏览器里静默失效。

```php
#[Erupt('Article', orderBy: 'id desc', raw: ['layout' => ['pageSize' => 30]])]
final class Article
{
    #[Field('Title', edit: ['inputType' => ['length' => 60]])] public string $title;
    #[Field('Rating', edit: ['type' => 'RATE', 'rateType' => ['count' => 5, 'allowHalf' => true]])] public ?float $rating;
    #[Field('Theme Color', edit: ['type' => 'COLOR'])] public ?string $color;
    // ...
}
```

`type:` 还可取 `TAGS`、`AUTO_COMPLETE`、`ATTACHMENT`（文件由服务端存储，节点只保存路径）、`HTML_EDITOR`、`MARKDOWN`、`CODE_EDITOR`、`COLOR`、`ICON`、`SIGNATURE`、`MAP`、`HIDDEN`（以上均为文本）、`RATE`、`SLIDER`（数字）、`BUTTON`（仅表单），以及配合 `ref:` 的 `CHECKBOX` / `TAB_TREE` / `TRANSFER`（以被选记录主键的 JSON 列表存储）。DIVIDE、CALLOUT、EMPTY、GROUP 等布局元素用 `virtual: true` 声明，参与构建但从不读写存储。

### 视图与树

- `raw: ['vis' => [...]]` 声明 `@Erupt(vis)` 的附加视图；每个视图可带节点侧的 `filter`（SQL，原样 AND）与 `orderBy`，读取该视图时由节点执行，不进入构建结果。`filter` 需要 SQL 仓储
- `raw: ['tree' => ['id' => 'id', 'label' => 'name', 'pid' => 'parent']]` 以树展示模型；`raw: ['linkTree' => ['field' => 'category']]` 在表格旁显示引用字段的树。树由服务端基于节点的表格数据组装

### 字段代码

`fetch`、`onchange`、`complete`、`click` 指向模型类的静态方法，服务端通过节点的 `invoke` 接口携带表单值调用：

```php
#[Erupt('Order')]
final class Order
{
    #[Field(pk: true)] public int $id;
    #[Field('Status', fetch: 'statusOptions')] public string $status;
    #[Field('Qty', onchange: 'qtyChanged')] public int $qty;
    #[Field('Total')] public float $total;
    #[Field('Recalc', type: 'BUTTON', click: 'recalc')] public ?string $recalc;

    public static function statusOptions(array $form): array { return ['new' => 'New', 'paid' => 'Paid']; }
    public static function qtyChanged(array $form): array { return ['formData' => ['total' => $form['qty'] * 9], 'editExpr' => new \stdClass()]; }
    public static function recalc(array $form): array { return ['eval' => "alert('done')", 'formData' => new \stdClass()]; }
}
```

`fetch` 用于 CHOICE / MULTI_CHOICE（返回 `value => label`）与 TAGS（返回列表），`complete(array $form, string $typed)` 用于 AUTO_COMPLETE，`click` 用于 BUTTON，`onchange` 可用于任意字段。抛出 `Erupt\Fail` 可向用户提示。

## 引用

属性类型为另一个 `#[Erupt]` 类即为引用。仓储只存被引用记录的主键，界面显示 `label:`（默认 `name`），标签与树由服务端解析。被引用模型须注册在同一节点上。

```php
#[Field('Category', search: true)] public ?Category $category;   // 表格选择器
#[Field('Topic', tree: 'parent')] public ?Category $topic;       // 基于 Category.parent 的树选择器
```

依赖另一字段的引用表格：`edit: ['referenceTableType' => ['dependField' => 'province', 'dependColumn' => 'province']]`，服务端只保留被引用模型中 `dependColumn` 等于依赖字段值的行。

钻取（`@Erupt(drills)`）同样以原始属性声明，目标模型须在同一节点上：

```php
#[Erupt('Author', raw: ['drills' => [['title' => 'Books', 'link' => ['linkErupt' => 'Book', 'joinColumn' => 'author']]]])]
```

打开 `Book` 中 `author` 等于作者 `id`（`link.column`，默认 `id`）的行；`link.linkCondition` 原样追加 SQL（需 SQL 仓储）。

## 行操作

在模型的 public static 方法上加 `#[Operation]`。示例博客的两个操作：

```php
#[Erupt('Publish Options')]
final class PublishForm                  // 操作表单无需主键，也不注册
{
    #[Field('Publish Date', type: 'DATE', notNull: true)] public string $publish_date;
}

#[Erupt('Article', orderBy: 'id desc')]
final class Article
{
    // ...字段

    #[Operation('Publish', icon: 'fa fa-paper-plane', form: PublishForm::class, ifExpr: "item.status !== 'published'")]
    public static function publish(OperationContext $op): void
    {
        foreach ($op->rows as $row) {
            $op->repo->update($row['id'], ['status' => 'published', 'publish_date' => $op->param['publish_date']]);
        }
    }

    #[Operation('Feature', mode: 'SINGLE', icon: 'fa fa-star', confirm: 'Feature this article on the home page?')]
    public static function feature(OperationContext $op): void
    {
        $op->repo->update($op->rows[0]['id'], ['featured' => true]);
    }
}
```

- `OperationContext`：`$op->rows`（所选记录，BUTTON 模式为空）、`$op->param`（表单值，无表单时为 `null`）、`$op->repo`、`$op->model`、`$op->user`
- `code` 默认为方法名；`mode`：`SINGLE` / `MULTI`（默认）/ `MULTI_ONLY` / `BUTTON`
- `confirm: false` 跳过确认框，字符串则替换确认文案；`tip`、`icon`、`ifExpr`（浏览器端对 `item` 求值）；`raw` 为 `@RowOperation` 原始属性
- `show: 'isRoot'` 指向一个接收用户（`?array`）的静态方法，返回 `false` 时隐藏操作并拒绝执行
- 返回字符串会在浏览器中作为 JavaScript 执行，只能返回你自己编写的代码
- 抛出 `Erupt\Fail` 向用户提示，其他异常返回 500；请求内任意位置可用 `Node::currentUser()` 取当前用户（`uid`、`account`、`name`、`tenantId`）

## DataProxy

继承 `Erupt\DataProxy`，只覆盖需要的方法；记录与行按引用传入，原地修改即可。抛出 `Erupt\Fail` 拒绝并提示用户。

```php
use Erupt\{DataProxy, Fail, Node};

final class ArticleProxy extends DataProxy
{
    public function addBehavior(array &$record): void          // 新增表单的初始值
    {
        $record['status'] = 'draft';
    }

    public function validate(array &$record): void             // 每次新增与修改前
    {
        if (str_contains($record['title'] ?? '', 'spam')) {
            throw new Fail('no spam');
        }
    }

    public function beforeFetch(array $conditions): string|array|null   // AND 到 WHERE 的 SQL，值绑定
    {
        return ['owner = ?', [Node::currentUser()['uid']]];
    }
}

#[Erupt('Article', dataProxy: ArticleProxy::class)]   // 一个或一组，类名或实例
final class Article { /* ... */ }
```

| 钩子 | 执行时机 |
| --- | --- |
| `searchCondition(&$condition)` | 构建模型时：搜索栏默认值 |
| `beforeFetch($conditions)` | 读取表格页前：返回 `'sql'` 或 `['sql with ?', [values]]`，原样 AND 到 WHERE；仅 SQL 仓储支持，`MemoryRepository` 会拒绝 |
| `afterFetch(&$rows)` | 读取表格页后、发送前 |
| `addBehavior(&$record)` | 新增表单（`init-value`） |
| `editBehavior(&$record)` | 按主键读取记录后（编辑表单、详情） |
| `validate(&$record)` | 新增或修改前 |
| `beforeAdd` / `afterAdd(&$record)` | `Repository::add` 前后 |
| `beforeUpdate` / `afterUpdate(&$record)` | `Repository::update` 前后，参数为提交的值 |
| `beforeDelete` / `afterDelete(&$record)` | `Repository::delete` 前后，每条记录一次 |

## 存储

内置两种仓储：

- **`PdoRepository(PDO $pdo, string $table, bool $autoCreate = true)`**：任意 PDO 连接。标识符来自模型白名单并按驱动加引号（MySQL 为反引号），所有值均为绑定参数，LIKE 以 `!` 转义，分页使用 `LIMIT / OFFSET`；日期存为文本，布尔存为 0 / 1，空值统一排在最后（降序时最前）。SQLite 上缺表时自动建表，其他数据库需自行建表。CI 针对 SQLite、PostgreSQL、MySQL 测试
- **`MemoryRepository(array $records = [])`**：进程内存储。PHP-FPM 下每个请求都从空开始，只适合测试和常驻进程（RoadRunner、Swoole、ReactPHP）

自定义存储实现 `Erupt\Repository` 接口：

```php
interface Repository
{
    public function bind(Model $model): void;
    public function page(Query $query): array;          // [总数, 当前页记录]
    public function get(int|string $pk): ?array;
    public function add(array $record): void;
    public function update(int|string $pk, array $record): void;
    public function delete(array $pks): void;
}
```

`Query` 携带 `conditions`（已按模型校验的 `Cond`）、`sort`、`offset`、`limit` 与 `filters`（`@Vis` 视图和 `beforeFetch` 的 SQL）。`filters` 必须全部 AND 进查询，做不到时应抛异常，不能忽略。未指定排序时按主键升序返回。

## 运行与部署

示例读取的环境变量：

| 变量 | 说明 |
| --- | --- |
| `ERUPT_NODE_NAME` | 节点名，默认 `blog` |
| `ERUPT_ACCESS_TOKEN` | 服务端为节点生成的 access-token，勿提交到代码库 |
| `ERUPT_SERVER` | 服务端地址，默认 `http://localhost:8080` |
| `PORT` | 心跳进程注册的端口，默认 `9090`，须与 Web 服务端口一致 |
| `ERUPT_DB` | SQLite 文件，默认 `blog.db` |

`Node` 构造参数：`new Node($name, $accessToken, $servers, address: null, heartbeatSeconds: 15, requireSignature: false)`。`$servers` 可传数组，轮询使用。

- **两个进程**：`run()` 处理当前 PHP 请求，适用于 `php -S` 或把 PHP-FPM 指向前端控制器；`heartbeat($port)` 需作为独立的 CLI 进程常驻，每 15 秒注册一次，安装 `ext-pcntl` 时收到 SIGINT / SIGTERM 会先注销再退出
- **地址**：未配置 `address` 时，自动检测通往服务端的网卡地址（优先 IPv4，IPv6 地址加方括号），注册为 `http://<ip>:<port>`
- **框架内挂载**：`handle($method, $path, $headers, $body, $query)` 是与框架无关的入口，返回 `Response`（`status`、`contentType`、`body`）。Laravel 示例：

```php
Route::any('{path}', function (Illuminate\Http\Request $request) {
    $r = app(Erupt\Node::class)->handle($request->method(), '/' . $request->path(),
        array_map(fn($v) => $v[0], $request->headers->all()), $request->getContent(), $request->query());
    return response($r->body, $r->status)->header('Content-Type', $r->contentType);
})->where('path', '(erupt-api/.*|node-health)')->withoutMiddleware([
    \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
]);
```

再用一个由进程管理器保活的 artisan 命令运行 `$node->heartbeat($port)`。

- **服务端配置与用户信息**：`$node->config()`、`$node->groupConfig()` 返回服务端为节点及其分组设置的配置文本；`$node->userInfo()` 在请求内返回当前用户的完整信息（角色、组织、岗位）

## 签名与权限

- **调用认证**：服务端的调用携带明文 `Access-Token`，或携带 `Erupt-Signature`（以 access-token 为密钥的 HMAC-SHA256，时间窗口 300 秒）。签名必须校验通过；`requireSignature: true` 后仅带明文 token 的调用一律返回 403
- **`Erupt-Enforced`** 只有在签名有效时才被信任；带 `Origin` 头的请求（浏览器直连节点）直接返回 403
- **权限**：节点把模型声明的 `power` 与服务端按会话下发的权限（`erupt-power` 回调）做 AND；回调失败时视为无写权限。结果在 `Node` 生命周期内缓存 5 秒（PHP-FPM 下即一个请求）。服务端在签名中声明 `Erupt-Enforced: power` 时跳过回调，只执行模型自身的声明
- **白名单**：搜索字段必须声明 `search`，排序字段必须声明 `sortable`（或为主键），每页最多 1000 条；字段名从不拼进 SQL，值始终绑定

## 示例与一致性测试

- `php/examples/blog`：示例博客（Category、Article、Component 三个模型，覆盖 [SHOWCASE](https://github.com/erupt-io/erupt-sdk/blob/main/SHOWCASE.md) 的全部组件），心跳进程启动时为空表写入种子数据

```bash
cd php
php -S 0.0.0.0:9090 examples/blog/router.php
PORT=9090 php examples/blog/heartbeat.php
```

- 单元测试：`php tests/run.php`
- 一致性测试（在仓库根目录执行，夹具使用临时 SQLite 文件，因为 `php -S` 在请求之间不保留状态）：

```bash
python conformance/run.py -- php php/examples/conformance.php
```

## 能力边界

- 打印（`print`）与 AI（`ai`）权限始终关闭，界面中隐藏
- 尚不支持：子表（`TAB_TABLE_ADD` / `TAB_TABLE_REFER`）、`MULTI_FORM`、`COMBINE`、`TPL`、`PASSWORD`（需服务端先支持掩码），以及模型嵌套（`eruptParent` 只能指向自身）
- `beforeFetch`、视图 `filter`、钻取 `linkCondition` 需要 SQL 仓储，`MemoryRepository` 会拒绝
- 与 Python SDK 的差异：操作 `code` 默认取方法名；`show`、`fetch`、`onchange`、`complete`、`click` 指向静态方法名而非闭包；日期存为字符串；请求体不是 JSON 对象时视为空对象，而不是返回 500
- Excel、附件、单元格编辑、拖拽排序、看板 / 日历 / 甘特视图的写入等由服务端代为完成，见 [服务端代节点完成的工作](/zh/modules/cloud-server#服务端代节点完成的工作)
