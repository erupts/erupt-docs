# Node Lite (without Spring)

> An erupt-cloud node that does not need Spring: serve `@Erupt` classes from plain Java / Kotlin, Solon, Quarkus, Micronaut, Vert.x, Ktor or any servlet container, while the [Cloud Server](/en/modules/cloud-server) renders the UI, logs users in and checks menus. <Badge type="tip" text="v2.4.0+" />

## When to Use It

[erupt-cloud-node](/en/modules/cloud-node) is a Spring Boot module carrying the full erupt-core pipeline. When your service is **not Spring** (or you simply want the smallest footprint), use `erupt-cloud-node-lite`:

- The only runtime dependencies are `erupt-annotation`, `erupt-cloud-common` and `linq.j`, all three dependency-free; Java 17+
- Models are declared with the very annotations a Spring erupt application uses, so a class moves between the two unchanged
- Released with erupt, so its version is erupt's and the annotations always match the server
- A node holds no users, sessions or menus; it only describes its models and serves their CRUD. A browser never talks to a node

| Module | Use it for |
|--------|------------|
| `erupt-cloud-node-lite` | plain Java / Kotlin on the JDK's HTTP server, or mounted in any HTTP stack |
| `erupt-cloud-node-solon` | Solon 4: a plugin serving your `Node` bean on Solon's server |
| `erupt-cloud-node-quarkus` | Quarkus 3: serves your `Node` bean on Quarkus' HTTP server |
| `erupt-cloud-node-micronaut` | Micronaut 4: serves your `Node` bean on Micronaut's HTTP server |
| `erupt-cloud-node-vertx` | Vert.x 4.5 / 5: mounts a node on a Vert.x Web router |
| `erupt-cloud-node-ktor` | Ktor 3: mounts a node on a Ktor server's routing |
| `erupt-cloud-node-servlet` | any servlet container, jakarta.servlet 5+ or javax.servlet 3.1+ |
| `erupt-cloud-node` / `-jpa` | Spring Boot: the full erupt-core pipeline, see [Node Deployment](/en/modules/cloud-node) |

:::tip Beyond the JVM
Node SDKs for Python, Go, TypeScript, PHP, .NET, Rust, Ruby and Swift live in [erupt-sdk](/en/modules/erupt-sdk/). They are built on the same [node protocol](https://github.com/erupts/erupt/blob/develop/erupt-cloud/PROTOCOL.md) and the generated JSON Schema (`schema/erupt-annotations.schema.json`, `schema/erupt-node-defaults.json`).
:::

## Setup

Pick one artifactId for your stack; the version is erupt's:

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <!-- or erupt-cloud-node-solon / -quarkus / -micronaut / -vertx / -ktor / -servlet -->
    <artifactId>erupt-cloud-node-lite</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

Every framework adapter depends on `erupt-cloud-node-lite`, so it needs no separate entry.

## Quick Start

### 1. Declare a model

```java
@Erupt(name = "Article", orderBy = "id desc")
public class Article {
    @EruptField
    private Long id;

    @EruptField(views = @View(title = "Title", sortable = true),
            edit = @Edit(title = "Title", notNull = true, search = @Search))
    private String title;

    @EruptField(views = @View(title = "Publish Date"), edit = @Edit(title = "Publish Date", search = @Search))
    private LocalDate publishDate;

    @EruptField(edit = @Edit(title = "Body", type = EditType.TEXTAREA))
    private String body;
}
```

### 2. Register and serve the node

```java
new Node("blog", System.getenv("ERUPT_ACCESS_TOKEN"), "http://erupt-server:8080")
        .register(Article.class, new JdbcRepository<>(dataSource, "article"))
        .serve("0.0.0.0", 9090);
```

`Node(name, accessToken, servers...)`: the node name, the access token the server issued, and one or more server base URLs (round-robined). `serve` listens on the JDK HTTP server, registers with the server and blocks, deregistering on Ctrl-C / SIGTERM; `start` returns at once and leaves `close()` to you.

### 3. Server side

1. On the Cloud Server create node `blog` (Node Config) and copy its access token
2. Add a menu of type `table` with the value `blog.Article`
3. Run the node. The server must reach it on `http://<node ip>:9090`; in a complex network (proxies, containers) set `.address("http://...")` explicitly

Refresh the page and the Article table is there, with add, edit, delete, search and sort working.

## Declaring Models

Exactly erupt's rules:

- The class needs a no-argument constructor; every `@EruptField` member is a column named like the member
- The primary key is `@Erupt(primaryKeyCol)` (`id` by default), declared with a bare `@EruptField`
- A field shows in the form when its `@Edit` has a title
- `@Erupt(orderBy)` is the default sort, written `"field [asc|desc], ..."`, by member name
- The build JSON is serialized from the annotations by erupt's own rules (`AnnotationProcess`): `@Transient` attributes left out, `@Match` branches evaluated, enums by name, classes by simple name

### AUTO inference

`EditType.AUTO` (the default) is inferred from the member type as the erupt proxies do: `String` INPUT, numbers NUMBER, `Boolean` BOOLEAN, `LocalDate` / `LocalDateTime` / `Date` DATE, an enum CHOICE, a `List` / `Set` MULTI_CHOICE, another `@Erupt` class a reference. `ViewType.AUTO`, `@BoolType` and `@Search(operator)` are resolved the same way.

### Collections and layout fields

- `List` / `Set` / `Map` members (MULTI_CHOICE, KEY_VALUE and the like) are **stored as JSON text** and travel as a JSON array / object on the wire; array members are not supported, declare a `List`
- Layout controls DIVIDE, GROUP, CALLOUT, EMPTY and BUTTON hold no value, so the repository skips them
- A `transient` member, or one annotated `@Transient`, is part of the build but never stored

## References

A member typed with another `@Erupt` class **registered on the same node** references one of its records. The repository stores the referenced primary key, rows carry only that key, and the server resolves and fills in the label.

```java
@EruptField(views = @View(title = "Category", column = "name"), edit = @Edit(title = "Category", search = @Search))
private Category category;                       // table picker

@EruptField(views = @View(title = "Topic", column = "name"), edit = @Edit(title = "Topic",
        type = EditType.REFERENCE_TREE, referenceTreeType = @ReferenceTreeType(pid = "parent")))
private Category topic;                          // tree picker over Category.parent
```

The referenced `Category` needs no menu: the picker is requested under the host model's name, and the server assembles the options, the tree and the `{id, label}` labels from `Category`'s table data.

### @Drill and @LinkTree

- `@Erupt(drills)`: when a row drills into another model's table, the node reads the source row's `link.column` (`id` by default), keeps the target rows whose `link.joinColumn` holds it and appends `linkCondition` as written; a drill the source model does not declare is refused
- `@Erupt(linkTree)`: the tree beside the table is built by the server from the model `linkTree.field` points at; once the user picks nodes, the node filters `linkTree.field` with `IN`; with `dependNode = true` nothing is listed until something is picked

## Handlers

The erupt-annotation interfaces named in the annotations work as in a Spring application:

| Interface | Declared in | Notes |
|-----------|-------------|-------|
| `DataProxy<T>` | `@Erupt(dataProxy)` | `validate`, `before/afterAdd`, `before/afterUpdate`, `before/afterDelete`, `beforeFetch`, `afterFetch`, `addBehavior`, `editBehavior`, `searchCondition` |
| `OperationHandler<T, Form>` | `@RowOperation(operationHandler)` | `exec(rows, form, params)`; a returned string runs as JavaScript in the browser, so return only code you wrote. `eruptFormValue` fills the form |
| `ChoiceFetchHandler` | `@ChoiceType(fetchHandler)` | dynamic CHOICE / MULTI_CHOICE options, resolved into `componentValue` at build time |
| `PowerHandler` | `@Power(powerHandler)` | narrows the declared power |
| `ExprBool.ExprHandler` | `show` / `ifRender` | per-user visibility of operations, views, edits |
| `Readonly.ReadonlyHandler` | `@Readonly(exprHandler)` | per-user read-only |

Throw `xyz.erupt.annotation.exception.EruptException` to show the user a message. Inside a request, `Node.currentUser()` is the acting user (`uid`, `account`, `name`, `tenantId`) and `Node.current().repository(Article.class)` a registered repository.

```java
@Erupt(name = "Article", rowOperation = @RowOperation(code = "publish", title = "Publish",
        eruptClass = PublishForm.class, operationHandler = Publish.class,
        show = @ExprBool(exprHandler = EditorsOnly.class)))
public class Article { ... }

public class Publish implements OperationHandler<Article, PublishForm> {
    public String exec(List<Article> rows, PublishForm form, String[] params) {
        var repo = Node.current().repository(Article.class);
        rows.forEach(a -> { a.setStatus("published"); repo.update(a); });
        return null;
    }
}
```

### Dependency injection

Handlers are created by their no-argument constructor, once per class. With a DI container, hand the node its lookup; a `null` answer falls back to the constructor:

```java
node.factory(beanContainer::get);
```

| Container | Lookup |
|-----------|--------|
| Solon | `Solon.context()::getBean` |
| Quarkus | `type -> Arc.container().instance(type).get()` |
| Micronaut | `type -> ctx.findBean(type).orElse(null)` |
| Guice | `injector::getInstance` |

## Storage

Storage is anything implementing `Repository<T>` over instances of the model class:

```java
public interface Repository<T> {
    default void bind(Model<T> model) {}   // called once when the model is registered
    Page<T> page(Query query);             // the total matching the query and one page of records
    T get(Object pk);                      // null when there is none
    void add(T record);                    // stores it and sets the generated primary key
    void update(T record);                 // stores every column
    void delete(List<Object> pks);
    record Page<T>(long total, List<T> records) {}
}
```

`Query` carries the conditions (`Condition` objects already whitelisted against the model), the sort, `offset` / `limit`, and the raw filter expressions added by DataProxy, `@Vis(filter)` and drills. `Model.get` / `Model.set` read and write a column's stored value (the referenced key for a reference, JSON text for a collection). Two implementations ship:

- **`MemoryRepository<T>`**: in memory, optionally seeded with records; for tests and demos
- **`JdbcRepository<T>(dataSource, table)`**: any JDBC `DataSource`. Columns are the member names, quoted (so case sensitive on PostgreSQL and Oracle); a reference column holds the referenced key; every value is a bound parameter; LIKE escapes with `ESCAPE '!'`. Identifier quotes and paging are detected from the connection, or set with `.dialect(JdbcRepository.Dialect.SQLSERVER)` (`STANDARD` / `MYSQL` / `SQLSERVER` / `ORACLE`). **Create the tables yourself**

Without a sort, every repository returns rows by primary key ascending.

:::info Done by the server
Attachment uploads, Excel template / export / import, cell editing, drag sort, board / calendar / gantt writes, reference labels and reference trees are all handled by the server through the endpoints a node already serves, so a node implements none of them. See [What the Server Does for a Node](/en/modules/cloud-server#what-the-server-does-for-a-node).
:::

## Framework Adapters

The adapters route only the paths the erupt server calls (`/erupt-api/**`, `/node-health`) next to the application's own routes, connect once the HTTP server listens (on its actual port and context path, unless `.address(...)` is set) and deregister on shutdown.

### Solon

Declare the node as a bean; the plugin registers `server.contextPath` with the address:

```java
@Configuration
public class EruptNodeConfig {
    @Bean
    public Node node(@Inject("${erupt.cloud-node.access-token}") String token, DataSource dataSource) {
        return new Node("blog", token, "http://erupt-server:8080")
                .factory(Solon.context()::getBean)
                .register(Article.class, new JdbcRepository<>(dataSource, "article"));
    }
}
```

### Quarkus

Needs `quarkus-vertx-http`, which any REST extension brings. Produce the node as a `@Singleton` (`Node` is final, so it cannot be an `@ApplicationScoped` proxy); `quarkus.http.root-path` is registered with the address:

```java
public class EruptNodeConfig {
    @Produces
    @Singleton
    Node node(@ConfigProperty(name = "erupt.cloud-node.access-token") String token, AgroalDataSource dataSource) {
        return new Node("blog", token, "http://erupt-server:8080")
                .factory(type -> Arc.container().instance(type).get())
                .register(Article.class, new JdbcRepository<>(dataSource, "article"));
    }
}
```

### Micronaut

Any Micronaut HTTP server with a JSON mapper; `micronaut.server.context-path` is registered with the address:

```java
@Factory
public class EruptNodeConfig {
    @Singleton
    Node node(@Value("${erupt.cloud-node.access-token}") String token, DataSource dataSource, BeanContext ctx) {
        return new Node("blog", token, "http://erupt-server:8080")
                .factory(type -> ctx.findBean(type).orElse(null))
                .register(Article.class, new JdbcRepository<>(dataSource, "article"));
    }
}
```

### Vert.x

Handlers run on worker threads, since repositories block:

```java
EruptNodeVertx.serve(vertx, node, 9090);                               // a server of its own

EruptNodeVertx.mount(router, node);                                    // or on the application's router
vertx.createHttpServer().requestHandler(router).listen(8080).onSuccess(s -> node.connect(s.actualPort()));

app.route("/admin/*").subRouter(EruptNodeVertx.mount(Router.router(vertx), node));   // or under a mount point
vertx.createHttpServer().requestHandler(app).listen(8080).onSuccess(s -> node.connect(s.actualPort(), "/admin"));
```

### Ktor

Ktor 3; calls run on `Dispatchers.IO`. Mount it under a constant path; the node connects on the port and path it is served at:

```kotlin
embeddedEruptNode(CIO, node, 9090).start(wait = true)                  // a server of its own

routing {                                                              // or on the application's routing
    route("/admin") { eruptNode(node) }
}
```

### Servlet

Call `EruptNodeServlet.mount(servletContext, node)` from a `ServletContainerInitializer` or `ServletContextListener` (`xyz.erupt.cloud.node.servlet` for jakarta.servlet, `xyz.erupt.cloud.node.servlet.javax` for javax.servlet). A servlet does not know its port: with `.address(...)` set the node connects when the servlet starts (the heartbeat retries until the container listens); otherwise call `node.connect(port, contextPath)` once it does. The servlet's `destroy` deregisters.

```java
public class EruptNodeInitializer implements ServletContainerInitializer {
    public void onStartup(Set<Class<?>> classes, ServletContext context) {
        EruptNodeServlet.mount(context, new Node("blog", token, "http://erupt-server:8080")
                .address("http://10.0.0.12:8080" + context.getContextPath())
                .register(Article.class, new JdbcRepository<>(dataSource, "article")));
    }
}
```

### Any other HTTP stack

Javalin, Helidon, http4k and friends: `node.handle(Request)` answers one request and never throws. Mount it, call `node.connect(port)` (`connect(port, mountPoint)` under a mount point) once listening, and `node.close()` on shutdown:

```java
var target = Node.Request.target(req.getContextPath(), req.getRequestURI(), req.getQueryString());
var r = node.handle(new Node.Request(req.getMethod(), target, req::getHeader, req.getInputStream().readAllBytes()));
resp.setStatus(r.status()); resp.setContentType(r.contentType()); resp.getOutputStream().write(r.body());
```

`target` is the raw path and query below the mount point, passed exactly as received: the server's signature covers it.

### Context path and mount point

| Method | Meaning |
|--------|---------|
| `connect(port)` | With no address set, registers this host's interface toward the server plus the port |
| `connect(port, path)` | The same, with a context path or mount point appended to the address |
| `address(String)` | The base URL the server calls this node on, context path included, no trailing `/` |
| `address()` | The registered address; `null` before it is set or connected |
| `heartbeat(Duration)` | Heartbeat interval, 15 seconds by default |

## Signature Verification

Every server call carries `Erupt-Signature`, an HMAC-SHA256 keyed by the access token over the method, path, timestamp, `Erupt-Enforced`, user and body, and the node verifies each one:

- After `requireSignature(true)`, a call carrying only the plain `Access-Token` is refused; on the server, switch `erupt.cloud-server.plain-access-token` off to match
- `Erupt-Enforced` is trusted only under a valid signature; a request with an `Origin` header (a browser calling directly) gets 403
- Without `Erupt-Enforced: power` the node asks the server for the user's rights (`erupt-power`, cached 5 s) and fails closed when the server cannot be reached
- Condition keys and sort fields are whitelisted against the model and never reach SQL unchecked

:::warning Not yet
Sub-tables (TAB_*), TPL operations, `@Erupt(filter)`, depend fields of references, i18n of messages. A node answers 404 for what it does not implement; the server fills in or hides the feature.
:::
