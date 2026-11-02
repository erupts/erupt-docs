# 轻量节点 Node Lite（无 Spring）

> 不依赖 Spring 的 erupt-cloud 节点：用纯 Java / Kotlin、Solon、Quarkus、Micronaut、Vert.x、Ktor 或任意 Servlet 容器托管 `@Erupt` 类，由 [Cloud Server](/zh/modules/cloud-server) 负责渲染界面、登录与菜单权限。<Badge type="tip" text="v2.4.0+" />

## 适用场景

[erupt-cloud-node](/zh/modules/cloud-node) 是一个 Spring Boot 模块，带着完整的 erupt-core 流水线。当你的服务**不是 Spring**（或者只想要最小依赖）时，用 `erupt-cloud-node-lite`：

- 运行期只依赖 `erupt-annotation`、`erupt-cloud-common`、`linq.j` 三个无传递依赖的 jar，Java 17+
- 模型用与 Spring 版 erupt 完全相同的注解声明，一个类可以在两者之间原样搬移
- 随 erupt 一起发布，版本号就是 erupt 的版本号，注解与服务端永远匹配
- 节点自身不持有用户、会话、菜单，只描述模型并提供 CRUD；浏览器永远不会直接访问节点

| 模块 | 用途 |
|------|------|
| `erupt-cloud-node-lite` | 纯 Java / Kotlin，运行在 JDK 自带的 HTTP 服务上，或挂载到任意 HTTP 栈 |
| `erupt-cloud-node-solon` | Solon 4：插件，把 `Node` bean 挂到 Solon 的服务上 |
| `erupt-cloud-node-quarkus` | Quarkus 3：把 `Node` bean 挂到 Quarkus 的 HTTP 服务上 |
| `erupt-cloud-node-micronaut` | Micronaut 4：把 `Node` bean 挂到 Micronaut 的 HTTP 服务上 |
| `erupt-cloud-node-vertx` | Vert.x 4.5 / 5：挂到 Vert.x Web 的 Router 上 |
| `erupt-cloud-node-ktor` | Ktor 3：挂到 Ktor 的 routing 上 |
| `erupt-cloud-node-servlet` | 任意 Servlet 容器，jakarta.servlet 5+ 或 javax.servlet 3.1+ |
| `erupt-cloud-node` / `-jpa` | Spring Boot：完整的 erupt-core 流水线，见 [Node 部署](/zh/modules/cloud-node) |

:::tip 非 JVM 语言
Python、Go、TypeScript、PHP、.NET、Rust、Ruby、Swift 的节点 SDK 在 [erupt-sdk](/zh/modules/erupt-sdk/)，基于同一份 [节点协议](https://github.com/erupts/erupt/blob/develop/erupt-cloud/PROTOCOL.md) 与生成的 JSON Schema（`schema/erupt-annotations.schema.json`、`schema/erupt-node-defaults.json`）实现。
:::

## 引入方式

按运行环境选择一个 artifactId，版本与 erupt 保持一致：

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <!-- 或 erupt-cloud-node-solon / -quarkus / -micronaut / -vertx / -ktor / -servlet -->
    <artifactId>erupt-cloud-node-lite</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

各框架适配模块都依赖 `erupt-cloud-node-lite`，无需重复引入。

## 快速开始

### 1. 声明模型

```java
@Erupt(name = "文章", orderBy = "id desc")
public class Article {
    @EruptField
    private Long id;

    @EruptField(views = @View(title = "标题", sortable = true),
            edit = @Edit(title = "标题", notNull = true, search = @Search))
    private String title;

    @EruptField(views = @View(title = "发布日期"), edit = @Edit(title = "发布日期", search = @Search))
    private LocalDate publishDate;

    @EruptField(edit = @Edit(title = "正文", type = EditType.TEXTAREA))
    private String body;
}
```

### 2. 注册并启动节点

```java
new Node("blog", System.getenv("ERUPT_ACCESS_TOKEN"), "http://erupt-server:8080")
        .register(Article.class, new JdbcRepository<>(dataSource, "article"))
        .serve("0.0.0.0", 9090);
```

`Node(name, accessToken, servers...)`：节点名、服务端分配的 access-token、一个或多个服务端地址（轮询）。`serve` 在 JDK HTTP 服务上监听、向服务端注册并阻塞，收到 Ctrl-C / SIGTERM 时注销；`start` 则立即返回，由你在合适的时机调用 `close()`。

### 3. 服务端配置

1. 在 Cloud Server 的「节点管理」中创建节点 `blog`，复制它的 access-token
2. 新增类型为 `table` 的菜单，类型值填 `blog.Article`
3. 启动节点。服务端需能访问 `http://<节点 ip>:9090`；网络环境复杂（多层代理、容器）时用 `.address("http://...")` 显式指定

刷新页面即可看到 Article 表格，新增、编辑、删除、搜索、排序均已可用。

## 模型声明

规则与 erupt 一致：

- 类需有无参构造方法；每个 `@EruptField` 成员就是一个与成员同名的列
- 主键由 `@Erupt(primaryKeyCol)` 指定（默认 `id`），用不带参数的 `@EruptField` 声明
- `@Edit` 有 `title` 的字段才会出现在表单中
- `@Erupt(orderBy)` 是默认排序，写法 `"field [asc|desc], ..."`，字段必须是模型的成员
- 构建 JSON 由注解按 erupt 自身的规则（`AnnotationProcess`）序列化：`@Transient` 属性不输出、`@Match` 分支已求值、枚举输出名称、类输出简单名

### AUTO 类型推断

`EditType.AUTO`（默认值）按成员类型推断，与 erupt 的代理一致：`String` → INPUT，数字 → NUMBER，`Boolean` → BOOLEAN，`LocalDate` / `LocalDateTime` / `Date` → DATE，枚举 → CHOICE，`List` / `Set` → MULTI_CHOICE，另一个 `@Erupt` 类 → 引用。视图类型 `ViewType.AUTO`、`@BoolType`、`@Search(operator)` 同样会被解析。

### 集合与布局字段

- `List` / `Set` / `Map` 成员（MULTI_CHOICE、KEY_VALUE 等）**以 JSON 文本存储**，在接口中以 JSON 数组 / 对象传输；数组成员不支持，请声明为 `List`
- 布局类控件 DIVIDE、GROUP、CALLOUT、EMPTY、BUTTON 不占列，仓储会跳过它们
- `transient` 修饰的成员或标注了 `@Transient` 的成员参与构建但不存储

## 引用关系

成员类型是**同一节点上已注册**的另一个 `@Erupt` 类，即引用它的一条记录。仓储只存被引用记录的主键，行数据也只带主键，标签由服务端解析并补全。

```java
@EruptField(views = @View(title = "分类", column = "name"), edit = @Edit(title = "分类", search = @Search))
private Category category;                       // 表格选择器

@EruptField(views = @View(title = "主题", column = "name"), edit = @Edit(title = "主题",
        type = EditType.REFERENCE_TREE, referenceTreeType = @ReferenceTreeType(pid = "parent")))
private Category topic;                          // 基于 Category.parent 的树选择器
```

被引用的 `Category` 无需配置菜单：选择器以宿主模型的名义请求，服务端从 `Category` 的表格数据组装出选项、树与 `{id, label}` 标签。

### @Drill 与 @LinkTree

- `@Erupt(drills)`：从一条记录钻取到另一个模型的表格时，节点读取源记录的 `link.column`（默认 `id`），筛选目标表中 `link.joinColumn` 等于该值的行，并原样追加 `linkCondition`；源模型未声明的钻取会被拒绝
- `@Erupt(linkTree)`：表格左侧的树由服务端从 `linkTree.field` 指向的模型组装；用户勾选后节点按 `IN` 过滤 `linkTree.field`；`dependNode = true` 时未勾选返回空页

## 处理器

注解中引用的 erupt-annotation 接口与 Spring 应用中的用法相同：

| 接口 | 声明位置 | 说明 |
|------|----------|------|
| `DataProxy<T>` | `@Erupt(dataProxy)` | `validate`、`before/afterAdd`、`before/afterUpdate`、`before/afterDelete`、`beforeFetch`、`afterFetch`、`addBehavior`、`editBehavior`、`searchCondition` |
| `OperationHandler<T, Form>` | `@RowOperation(operationHandler)` | `exec(rows, form, params)`；返回的字符串会在浏览器中作为 JavaScript 执行，只能返回你自己编写的代码；`eruptFormValue` 填充表单初值 |
| `ChoiceFetchHandler` | `@ChoiceType(fetchHandler)` | 动态 CHOICE / MULTI_CHOICE 选项，在构建时解析进 `componentValue` |
| `PowerHandler` | `@Power(powerHandler)` | 在声明的权限基础上进一步收窄 |
| `ExprBool.ExprHandler` | `show` / `ifRender` | 按用户控制操作、视图、编辑项的可见性 |
| `Readonly.ReadonlyHandler` | `@Readonly(exprHandler)` | 按用户控制只读 |

抛出 `xyz.erupt.annotation.exception.EruptException` 即可向用户展示提示。请求内可用 `Node.currentUser()` 取当前用户（`uid`、`account`、`name`、`tenantId`），`Node.current().repository(Article.class)` 取已注册的仓储。

```java
@Erupt(name = "文章", rowOperation = @RowOperation(code = "publish", title = "发布",
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

### 依赖注入

处理器默认通过无参构造方法创建，每个类只创建一次。使用 DI 容器时把容器的查找函数交给节点，返回 `null` 时回退到构造方法：

```java
node.factory(beanContainer::get);
```

| 容器 | 写法 |
|------|------|
| Solon | `Solon.context()::getBean` |
| Quarkus | `type -> Arc.container().instance(type).get()` |
| Micronaut | `type -> ctx.findBean(type).orElse(null)` |
| Guice | `injector::getInstance` |

## 存储

存储是任意实现了 `Repository<T>` 的对象，操作的是模型类的实例：

```java
public interface Repository<T> {
    default void bind(Model<T> model) {}   // 注册时调用一次
    Page<T> page(Query query);             // 匹配总数 + 一页记录
    T get(Object pk);                      // 不存在返回 null
    void add(T record);                    // 存储并回填生成的主键
    void update(T record);                 // 存储全部列
    void delete(List<Object> pks);
    record Page<T>(long total, List<T> records) {}
}
```

`Query` 携带条件（已按模型白名单过滤的 `Condition`）、排序、`offset` / `limit`，以及 DataProxy、`@Vis(filter)`、钻取追加的原生过滤表达式。`Model.get` / `Model.set` 以存储值的形式读写一列（引用字段读写的是被引用主键，集合字段读写的是 JSON 文本）。内置两种实现：

- **`MemoryRepository<T>`**：内存存储，可传入初始记录，用于测试与演示
- **`JdbcRepository<T>(dataSource, table)`**：任意 JDBC `DataSource`。列名即成员名并带引号（PostgreSQL、Oracle 区分大小写），引用列存被引用主键，所有值均为绑定参数，LIKE 使用 `ESCAPE '!'`。标识符引号与分页语法从连接自动识别，也可用 `.dialect(JdbcRepository.Dialect.SQLSERVER)` 指定（`STANDARD` / `MYSQL` / `SQLSERVER` / `ORACLE`）。**表需要自行创建**

未指定排序时，所有仓储都按主键升序返回。

:::info 由服务端代劳的功能
附件上传、Excel 模板 / 导出 / 导入、单元格编辑、拖拽排序、看板 / 日历 / 甘特视图的写入、引用标签与引用树等，都由服务端基于节点已提供的接口完成，节点无需实现。详见 [服务端代节点完成的工作](/zh/modules/cloud-server#服务端代节点完成的工作)。
:::

## 各框架适配

适配模块只接管服务端会调用的路径（`/erupt-api/**`、`/node-health`），与应用自身的路由并存；HTTP 服务开始监听后以实际端口与上下文路径注册（设置了 `.address(...)` 则以其为准），停止时注销。

### Solon

声明 `Node` bean，插件会自动注册 `server.contextPath`：

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

需要 `quarkus-vertx-http`（任一 REST 扩展都会带上）。以 `@Singleton` 生产 `Node`（`Node` 是 final 类，不能作为 `@ApplicationScoped` 代理），`quarkus.http.root-path` 会随地址一起注册：

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

任意带 JSON mapper 的 Micronaut HTTP 服务，`micronaut.server.context-path` 会随地址一起注册：

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

处理器在 worker 线程上执行（仓储是阻塞的）：

```java
EruptNodeVertx.serve(vertx, node, 9090);                               // 独立服务

EruptNodeVertx.mount(router, node);                                    // 或挂到应用的 Router 上
vertx.createHttpServer().requestHandler(router).listen(8080).onSuccess(s -> node.connect(s.actualPort()));

app.route("/admin/*").subRouter(EruptNodeVertx.mount(Router.router(vertx), node));   // 或挂到某个挂载点下
vertx.createHttpServer().requestHandler(app).listen(8080).onSuccess(s -> node.connect(s.actualPort(), "/admin"));
```

### Ktor

Ktor 3，调用在 `Dispatchers.IO` 上执行。挂在固定路径下，节点以其监听端口与路径注册：

```kotlin
embeddedEruptNode(CIO, node, 9090).start(wait = true)                  // 独立服务

routing {                                                              // 或挂到应用的 routing 上
    route("/admin") { eruptNode(node) }
}
```

### Servlet

在 `ServletContainerInitializer` 或 `ServletContextListener` 中调用 `EruptNodeServlet.mount(servletContext, node)`（jakarta.servlet 用 `xyz.erupt.cloud.node.servlet`，javax.servlet 用 `xyz.erupt.cloud.node.servlet.javax`）。Servlet 不知道自己的端口：设置了 `.address(...)` 时节点在 Servlet 初始化时连接（心跳会重试直到容器开始监听），否则在容器监听后调用 `node.connect(port, contextPath)`。Servlet 的 `destroy` 负责注销。

```java
public class EruptNodeInitializer implements ServletContainerInitializer {
    public void onStartup(Set<Class<?>> classes, ServletContext context) {
        EruptNodeServlet.mount(context, new Node("blog", token, "http://erupt-server:8080")
                .address("http://10.0.0.12:8080" + context.getContextPath())
                .register(Article.class, new JdbcRepository<>(dataSource, "article")));
    }
}
```

### 其他 HTTP 栈

Javalin、Helidon、http4k 等：`node.handle(Request)` 处理一个请求且永不抛异常。挂载后在监听时调用 `node.connect(port)`（有挂载点时 `connect(port, mountPoint)`），关闭时调用 `node.close()`：

```java
var target = Node.Request.target(req.getContextPath(), req.getRequestURI(), req.getQueryString());
var r = node.handle(new Node.Request(req.getMethod(), target, req::getHeader, req.getInputStream().readAllBytes()));
resp.setStatus(r.status()); resp.setContentType(r.contentType()); resp.getOutputStream().write(r.body());
```

`target` 是挂载点之下的原始路径与查询串，必须按收到的原样传入：服务端的签名覆盖它。

### 上下文路径与挂载点

| 方法 | 说明 |
|------|------|
| `connect(port)` | 未设置地址时，以本机朝向服务端的网卡地址 + 端口注册 |
| `connect(port, path)` | 同上，并在地址后追加上下文路径或挂载点 |
| `address(String)` | 显式指定服务端访问本节点的基础 URL（含上下文路径，不带尾部 `/`） |
| `address()` | 当前注册地址，设置或连接前为 `null` |
| `heartbeat(Duration)` | 心跳间隔，默认 15 秒 |

## 签名校验

服务端的每次调用都带有 `Erupt-Signature`（以 access-token 为密钥的 HMAC-SHA256，覆盖方法、路径、时间戳、`Erupt-Enforced`、用户与请求体），节点逐一校验：

- `requireSignature(true)` 后，仅携带明文 `Access-Token` 的调用一律拒绝；服务端对应关闭 `erupt.cloud-server.plain-access-token`
- `Erupt-Enforced` 只有在签名校验通过后才被信任；带有 `Origin` 头的请求（浏览器直连）直接返回 403
- 服务端未声明 `Erupt-Enforced: power` 时，节点向服务端查询用户权限（`erupt-power`，缓存 5 秒），查询失败视为无权限
- 查询条件的字段与排序字段都按模型白名单校验，不会进入 SQL

:::warning 尚未支持
子表（TAB_*）、TPL 类型的操作、`@Erupt(filter)`、引用字段的 depend 字段、提示信息的国际化。节点未实现的接口返回 404，由服务端兜底或隐藏对应功能。
:::
