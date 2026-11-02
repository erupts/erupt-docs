# PHP SDK

The PHP SDK lets a PHP service act as an erupt-cloud node and turns models declared with PHP 8 attributes into erupt admin pages: models and data stay on the node, while the erupt server renders the UI and handles login and menu permissions. The SDK has no Composer dependencies and runs under `php -S`, PHP-FPM or inside a framework such as Laravel.

> For the multi-language overview see [Erupt SDK](/en/modules/erupt-sdk/); for the node protocol and the server see [Cloud Server](/en/modules/cloud-server).

## Requirements

| Language version | Runtime dependencies | Package | Version |
| --- | --- | --- | --- |
| PHP 8.1+ | `ext-json`, `ext-pdo`; optional `ext-pdo_sqlite` (SQLite), `ext-pcntl` (deregister on exit) | `erupt-io/erupt-sdk` (Packagist) | 0.1.0 |

The server must be erupt **2.4.0+**.

## Installation

```bash
composer require erupt-io/erupt-sdk
```

Without Packagist, point Composer at the read-only split repository:

```json
{
  "repositories": [{ "type": "vcs", "url": "https://github.com/erupt-io/erupt-sdk-php" }],
  "require": { "erupt-io/erupt-sdk": "^0.1" }
}
```

Or copy the repository's `php/` directory (`autoload.php`, `src/`, `resources/`) into your project and `require 'erupt-sdk/php/autoload.php';`.

:::warning Upgrading a copied SDK
A copy does not update itself. When erupt changes the protocol or the annotation schema, replace the whole directory with the next release instead of merging by hand, and leave `Node::VERSION` untouched: the server uses it to show which release the node runs.
:::

## Quick Start

A trimmed version of the blog example (`php/examples/blog`). Under PHP-FPM and `php -S` every request is a fresh process, so a node is two parts: a front controller that serves requests, and one long-running registration (heartbeat) process.

```php
<?php // app.php: the models and the node, shared by router.php and heartbeat.php
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
<?php // router.php: serves the requests the server forwards
(require __DIR__ . '/app.php')->run();
```

```php
<?php // heartbeat.php: registration and heartbeat
(require __DIR__ . '/app.php')->heartbeat((int) (getenv('PORT') ?: 9090));
```

```bash
export ERUPT_ACCESS_TOKEN=<access-token> ERUPT_SERVER=http://localhost:8080
php -S 0.0.0.0:9090 router.php      # requests
PORT=9090 php heartbeat.php         # registration
```

On the server (see [Cloud Server](/en/modules/cloud-server)):

1. Create node `blog` under Node Config and copy its access token
2. Add a menu of type `table` with value `blog.Article` (and `blog.Category` likewise)
3. Start the two processes above. The server must reach `http://<node ip>:9090`; otherwise pass `address:` to `Node`

## Declaring Models

Put `#[Erupt]` on the class and `#[Field]` on each property. The property name is the storage column and the field name on the wire; inside the SDK a record is an associative array.

The edit type follows the property type; `type:` overrides it:

| PHP type | Edit type |
| --- | --- |
| `string` | INPUT |
| `int` / `float` | NUMBER |
| `bool` | BOOLEAN |
| `DateTimeInterface` (e.g. `DateTimeImmutable`) | DATE_TIME |
| another `#[Erupt]` class | REFERENCE_TABLE (REFERENCE_TREE with `tree:`) |
| a scalar with `choices:` | CHOICE |
| an `array` with `choices:` | MULTI_CHOICE (stored as a JSON array) |
| `object` / `stdClass` | a JSON object (with `edit: ['type' => 'KEY_VALUE']`) |

Dates are stored as wall-clock strings: DATE `2026-01-05` (declare a `string` with `type: 'DATE'`), DATE_TIME `2026-01-05T10:30:00.000`.

`#[Field]` arguments: `title`, `type`, `pk`, `search`, `notNull`, `sortable`, `table` (shown as a table column), `form` (shown in the form), `choices`, `ref`, `label` (the referenced field shown, default `name`), `tree`, `view`, `edit`, `virtual`, `fetch`, `onchange`, `complete`, `click`.

`#[Erupt]` arguments: `title`, `name` (defaults to the class's short name, the `<name>` in a `<node>.<name>` menu), `power` (e.g. `['delete' => false]`), `orderBy` (e.g. `'views desc, id'`, applied by the node), `dataProxy`, `raw`.

### Raw annotation attributes

`view:` / `edit:` are raw `@View` / `@Edit` attributes and `raw:` holds raw `@Erupt` attributes. They are described by the generated array shapes in `Erupt\Types\Annotations` and the enums in `Erupt\Types` (`EditType`, `RowOperationMode`, ...), and checked against the erupt annotation schema when the model is compiled, so a misspelt key or enum value throws at startup instead of silently doing nothing in the browser.

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

`type:` also takes `TAGS`, `AUTO_COMPLETE`, `ATTACHMENT` (the server stores the upload, the node keeps its path), `HTML_EDITOR`, `MARKDOWN`, `CODE_EDITOR`, `COLOR`, `ICON`, `SIGNATURE`, `MAP`, `HIDDEN` (all text), `RATE`, `SLIDER` (numbers), `BUTTON` (form only), and `CHECKBOX` / `TAB_TREE` / `TRANSFER` with `ref:` (the picked records, stored as the JSON list of their keys). Layout elements such as DIVIDE, CALLOUT, EMPTY and GROUP are declared `virtual: true`: in the build, but never read or written.

### Views and trees

- `raw: ['vis' => [...]]` declares the extra views of `@Erupt(vis)`; each view may carry a node-side `filter` (SQL, ANDed as written) and `orderBy`, applied by the node when the table is read for that view and kept out of the build. A `filter` needs a SQL repository
- `raw: ['tree' => ['id' => 'id', 'label' => 'name', 'pid' => 'parent']]` shows the model as a tree; `raw: ['linkTree' => ['field' => 'category']]` puts the tree of a reference field beside the table. The server builds both trees from the node's table

### Field code

`fetch`, `onchange`, `complete` and `click` name a static method of the model class, which the server calls through the node's `invoke` endpoint with the form's values:

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

`fetch` belongs to CHOICE / MULTI_CHOICE (`value => label`) and TAGS (a list), `complete(array $form, string $typed)` to AUTO_COMPLETE, `click` to BUTTON, `onchange` to any field. Throw `Erupt\Fail` to refuse with a message.

## References

A property typed with another `#[Erupt]` class is a reference. The repository stores the referenced primary key and the UI shows `label:` (default `name`); the server resolves labels and trees. Register the referenced model on the same node.

```php
#[Field('Category', search: true)] public ?Category $category;   // table picker
#[Field('Topic', tree: 'parent')] public ?Category $topic;       // tree picker over Category.parent
```

A reference table depending on another field: `edit: ['referenceTableType' => ['dependField' => 'province', 'dependColumn' => 'province']]`; the server keeps the referenced model's rows whose `dependColumn` holds the depend field's value.

Drills (`@Erupt(drills)`) are raw attributes too; the target model must be on the same node:

```php
#[Erupt('Author', raw: ['drills' => [['title' => 'Books', 'link' => ['linkErupt' => 'Book', 'joinColumn' => 'author']]]])]
```

This opens `Book` filtered to the rows whose `author` holds the author's `id` (`link.column`, `id` by default); `link.linkCondition` adds SQL as written (a SQL repository then).

## Row Operations

Put `#[Operation]` on a public static method of the model. The two operations of the blog example:

```php
#[Erupt('Publish Options')]
final class PublishForm                  // an operation form needs no primary key and is not registered
{
    #[Field('Publish Date', type: 'DATE', notNull: true)] public string $publish_date;
}

#[Erupt('Article', orderBy: 'id desc')]
final class Article
{
    // ...fields

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

- `OperationContext`: `$op->rows` (the selected records, empty in BUTTON mode), `$op->param` (form values, `null` without a form), `$op->repo`, `$op->model`, `$op->user`
- `code` defaults to the method name; `mode`: `SINGLE` / `MULTI` (default) / `MULTI_ONLY` / `BUTTON`
- `confirm: false` skips the dialog, a string replaces its text; also `tip`, `icon`, `ifExpr` (browser-side JS over `item`); `raw` holds raw `@RowOperation` attributes
- `show: 'isRoot'` names a static method taking the user (`?array`); returning `false` hides the operation and refuses to run it
- A returned string runs as JavaScript in the browser, so return only code you wrote
- Throw `Erupt\Fail` to show the user a message; any other exception answers 500. `Node::currentUser()` returns the acting user (`uid`, `account`, `name`, `tenantId`) anywhere in a request

## DataProxy

Extend `Erupt\DataProxy` and override what you need; records and rows come by reference, so change them in place. Throw `Erupt\Fail` to refuse with a message the user sees.

```php
use Erupt\{DataProxy, Fail, Node};

final class ArticleProxy extends DataProxy
{
    public function addBehavior(array &$record): void          // the new form's values
    {
        $record['status'] = 'draft';
    }

    public function validate(array &$record): void             // before every add and update
    {
        if (str_contains($record['title'] ?? '', 'spam')) {
            throw new Fail('no spam');
        }
    }

    public function beforeFetch(array $conditions): string|array|null   // SQL ANDed to the WHERE, values bound
    {
        return ['owner = ?', [Node::currentUser()['uid']]];
    }
}

#[Erupt('Article', dataProxy: ArticleProxy::class)]   // one proxy or a list, classes or instances
final class Article { /* ... */ }
```

| Hook | Runs |
| --- | --- |
| `searchCondition(&$condition)` | building the model: default values of the search bar |
| `beforeFetch($conditions)` | before a table page is read: `'sql'` or `['sql with ?', [values]]`, ANDed to the WHERE as written; SQL repositories only, `MemoryRepository` refuses it |
| `afterFetch(&$rows)` | after a table page is read, before it is sent |
| `addBehavior(&$record)` | the new record form (`init-value`) |
| `editBehavior(&$record)` | after a record is read by its key (edit form, detail view) |
| `validate(&$record)` | before an add or an update |
| `beforeAdd` / `afterAdd(&$record)` | around `Repository::add` |
| `beforeUpdate` / `afterUpdate(&$record)` | around `Repository::update`, with the submitted values |
| `beforeDelete` / `afterDelete(&$record)` | around `Repository::delete`, once per record |

## Storage

Two repositories are built in:

- **`PdoRepository(PDO $pdo, string $table, bool $autoCreate = true)`**: any PDO connection. Identifiers come from the model's whitelist and are quoted for the driver (backticks on MySQL), every value is a bound parameter, LIKE is escaped with `!`, paging uses `LIMIT / OFFSET`; dates are stored as text, booleans as 0 / 1, and nulls sort last (first when descending). On SQLite a missing table is created; elsewhere create it yourself. CI tests it against SQLite, PostgreSQL and MySQL
- **`MemoryRepository(array $records = [])`**: in process memory. Under PHP-FPM it starts empty on every request, so it only suits tests and long-running servers (RoadRunner, Swoole, ReactPHP)

Custom storage implements `Erupt\Repository`:

```php
interface Repository
{
    public function bind(Model $model): void;
    public function page(Query $query): array;          // [total, records of the page]
    public function get(int|string $pk): ?array;
    public function add(array $record): void;
    public function update(int|string $pk, array $record): void;
    public function delete(array $pks): void;
}
```

`Query` carries `conditions` (`Cond`s checked against the model), `sort`, `offset`, `limit` and `filters` (the SQL of a `@Vis` view and of `beforeFetch`). Every filter must be ANDed into the query; a repository that cannot apply them must throw, never ignore them. Without a sort, rows come back by primary key ascending.

## Running and Deploying

Environment variables read by the examples:

| Variable | Meaning |
| --- | --- |
| `ERUPT_NODE_NAME` | node name, default `blog` |
| `ERUPT_ACCESS_TOKEN` | the access token the server generated for the node; never commit it |
| `ERUPT_SERVER` | server address, default `http://localhost:8080` |
| `PORT` | the port the heartbeat registers, default `9090`; must match the web server's port |
| `ERUPT_DB` | SQLite file, default `blog.db` |

`Node` constructor: `new Node($name, $accessToken, $servers, address: null, heartbeatSeconds: 15, requireSignature: false)`. `$servers` may be an array, used round-robin.

- **Two processes**: `run()` serves the current PHP request, under `php -S` or with PHP-FPM pointed at the front controller; `heartbeat($port)` runs as its own long-lived CLI process, registers every 15 seconds and, with `ext-pcntl`, deregisters on SIGINT / SIGTERM before exiting
- **Address**: without a configured `address`, the node detects the interface the server is reached through (IPv4 first; an IPv6 address is bracketed) and registers `http://<ip>:<port>`
- **Inside a framework**: `handle($method, $path, $headers, $body, $query)` is the framework-neutral core and returns a `Response` (`status`, `contentType`, `body`). Laravel:

```php
Route::any('{path}', function (Illuminate\Http\Request $request) {
    $r = app(Erupt\Node::class)->handle($request->method(), '/' . $request->path(),
        array_map(fn($v) => $v[0], $request->headers->all()), $request->getContent(), $request->query());
    return response($r->body, $r->status)->header('Content-Type', $r->contentType);
})->where('path', '(erupt-api/.*|node-health)')->withoutMiddleware([
    \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
]);
```

Run `$node->heartbeat($port)` from an artisan command kept alive by your process manager.

- **Server config and user info**: `$node->config()` and `$node->groupConfig()` return the config text set for the node and its group on the server; `$node->userInfo()` returns the acting user's full info (roles, org, post) while a request is served

## Signatures and Power

- **Authentication**: server calls carry the plain `Access-Token` or an `Erupt-Signature` (HMAC-SHA256 keyed by the access token, 300-second window). A signature must verify; with `requireSignature: true` a call with only the plain token gets 403
- **`Erupt-Enforced`** is trusted only under a valid signature; a request with an `Origin` header (a browser reaching the node directly) gets 403
- **Power**: the node ANDs the model's declared `power` with the server's per-session verdict (the `erupt-power` callback); if the callback fails nothing is writable. The result is cached for 5 seconds for the lifetime of the `Node` (one request under PHP-FPM). When the server lists `power` in `Erupt-Enforced` the callback is skipped and only the model's own declaration applies
- **Whitelists**: a searched field must be declared `search`, a sorted field `sortable` (or be the primary key), and a page holds at most 1000 rows; field names never reach SQL as input and values are always bound

## Examples and Conformance

- `php/examples/blog`: the blog example (Category, Article and Component, covering every component of [SHOWCASE](https://github.com/erupt-io/erupt-sdk/blob/main/SHOWCASE.md)); the heartbeat process seeds empty tables on start

```bash
cd php
php -S 0.0.0.0:9090 examples/blog/router.php
PORT=9090 php examples/blog/heartbeat.php
```

- Unit tests: `php tests/run.php`
- Conformance (from the repository root; the fixture uses a temporary SQLite file, since `php -S` keeps nothing between requests):

```bash
python conformance/run.py -- php php/examples/conformance.php
```

## Limitations

- The `print` and `ai` powers are always off and hidden in the UI
- Not supported yet: sub-tables (`TAB_TABLE_ADD` / `TAB_TABLE_REFER`), `MULTI_FORM`, `COMBINE`, `TPL`, `PASSWORD` (needs server-side masking first), and nested models (`eruptParent` can only name the model itself)
- `beforeFetch`, view `filter`s and drill `linkCondition`s need a SQL repository; `MemoryRepository` refuses them
- Differences from the Python SDK: an operation's `code` defaults to the method name; `show`, `fetch`, `onchange`, `complete` and `click` name static methods instead of taking closures; dates are stored as strings; a request body that is not a JSON object counts as empty instead of answering 500
- Excel, attachments, cell editing, drag sort and writes from board / calendar / gantt views are done by the server; see [What the Server Does for a Node](/en/modules/cloud-server#what-the-server-does-for-a-node)
