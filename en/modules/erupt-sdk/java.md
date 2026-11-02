# Java / Kotlin

Java and Kotlin need no separate SDK: the node ships with erupt, so its annotations always match the server. A service declares models with the regular `@Erupt` / `@EruptField` annotations and becomes a node by adding one dependency. Spring Boot projects use `erupt-cloud-node`; other stacks use `erupt-cloud-node-lite`, which has no Spring dependency, and its framework adapters. `erupt-cloud-node` is also the reference implementation of the node protocol the other language SDKs follow.

> For the multi-language overview see [Erupt SDK](/en/modules/erupt-sdk/); for the node protocol and the server see [Cloud Server](/en/modules/cloud-server).

## Choosing a Module

| Stack | artifactId | Docs |
| --- | --- | --- |
| Spring Boot 3.5 (Java 17+) | `erupt-cloud-node-jpa` (with the JPA data layer), or the bare `erupt-cloud-node` | [Cloud Node](/en/modules/cloud-node) |
| Plain Java / Kotlin (the JDK's HTTP server) | `erupt-cloud-node-lite` | [Node Lite](/en/modules/cloud-node-lite) |
| Solon / Quarkus / Micronaut / Vert.x / Ktor / a servlet container | `erupt-cloud-node-solon` / `-quarkus` / `-micronaut` / `-vertx` / `-ktor` / `-servlet` | [Node Lite · Framework Adapters](/en/modules/cloud-node-lite#framework-adapters) |

Every module has groupId `xyz.erupt` and the erupt version. The lite node (`-lite` and its adapters) is available from erupt **2.4.0**.

## Installation

Spring Boot:

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-cloud-node-jpa</artifactId>   <!-- or erupt-cloud-node -->
    <version>${erupt.version}</version>
</dependency>
```

Without Spring:

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <!-- or erupt-cloud-node-solon / -quarkus / -micronaut / -vertx / -ktor / -servlet -->
    <artifactId>erupt-cloud-node-lite</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

:::tip Before the version is released
Until an erupt release containing the lite node is published, install it from an erupt checkout: `mvn install -pl erupt-cloud/erupt-cloud-node-lite -am -DskipTests`.
:::

## Quick Start: Spring Boot

From `jvm/examples/spring-blog` (`erupt-cloud-node-jpa` + H2). `application.yml`:

```yaml
server:
  port: ${PORT:9090}

erupt:
  cloud-node:
    node-name: ${ERUPT_NODE_NAME:blog}
    # On the server: Node Config -> add node "blog" -> View Token. Never commit it.
    access-token: ${ERUPT_ACCESS_TOKEN}
    server-addresses: ${ERUPT_SERVER:http://localhost:8080}   # several addresses are round-robined
    # host-address: http://10.0.0.12:9090                     # only when the server cannot reach the auto-detected address
```

```java
@SpringBootApplication
@EruptScan
@EntityScan
public class BlogApplication {
    public static void main(String[] args) {
        SpringApplication.run(BlogApplication.class, args);
    }
}
```

```java
@Entity
@Table(name = "blog_article")
@Erupt(name = "Article", orderBy = "Article.id desc")
public class Article extends BaseModel {

    @EruptField(views = @View(title = "Title", sortable = true),
            edit = @Edit(title = "Title", notNull = true, search = @Search, inputType = @InputType(length = 60)))
    private String title;

    @ManyToOne
    @EruptField(views = @View(title = "Category", column = "name"),
            edit = @Edit(title = "Category", search = @Search, type = EditType.REFERENCE_TABLE))
    private Category category;

    @EruptField(views = @View(title = "Status"), edit = @Edit(title = "Status", type = EditType.CHOICE, search = @Search,
            choiceType = @ChoiceType(vl = {@VL(value = "draft", label = "Draft"), @VL(value = "published", label = "Published")})))
    private String status;

    @EruptField(views = @View(title = "Featured"), edit = @Edit(title = "Featured", search = @Search))
    private Boolean featured;

    @EruptField(views = @View(title = "Publish Date"), edit = @Edit(title = "Publish Date", search = @Search))
    private LocalDate publishDate;
}
```

Configuration, databases and plugins are covered in [Cloud Node](/en/modules/cloud-node).

## Quick Start: Lite Node

From `jvm/examples/blog` (Kotlin, `erupt-cloud-node-lite` + H2):

```kotlin
@Erupt(name = "Category")
class Category {
    @EruptField
    var id: Long? = null

    @EruptField(views = [View(title = "Name")], edit = Edit(title = "Name", notNull = true, search = Search()))
    var name: String? = null

    @EruptField(views = [View(title = "Parent Id")], edit = Edit(title = "Parent Id"))
    var parent: Long? = null
}

enum class Status { DRAFT, PUBLISHED }   // an enum member is a CHOICE

@Erupt(name = "Article", orderBy = "id desc")
class Article {
    @EruptField
    var id: Long? = null

    @EruptField(views = [View(title = "Title", sortable = true)], edit = Edit(title = "Title", notNull = true, search = Search()))
    var title: String? = null

    @EruptField(
        views = [View(title = "Category", column = "name")],
        edit = Edit(title = "Category", search = Search(), type = EditType.REFERENCE_TREE, referenceTreeType = ReferenceTreeType(pid = "parent")),
    )
    var category: Category? = null

    @EruptField(edit = Edit(title = "Status", search = Search()), views = [View(title = "Status")])
    var status: Status? = null

    @EruptField(views = [View(title = "Publish Date")], edit = Edit(title = "Publish Date", search = Search()))
    var publishDate: LocalDate? = null
}

fun main() {
    val dataSource = JdbcDataSource().apply { setURL("jdbc:h2:./blog") }   // create the tables yourself; the example runs CREATE TABLE IF NOT EXISTS here
    Node(System.getenv("ERUPT_NODE_NAME") ?: "blog", System.getenv("ERUPT_ACCESS_TOKEN"), System.getenv("ERUPT_SERVER") ?: "http://localhost:8080")
        .register(Category::class.java, JdbcRepository(dataSource, "category"))
        .register(Article::class.java, JdbcRepository(dataSource, "article"))
        .serve("0.0.0.0", System.getenv("PORT")?.toInt() ?: 9090)
}
```

`serve` listens on the JDK HTTP server, registers and blocks, and deregisters on Ctrl-C / SIGTERM. Models, handlers, storage and mounting into each framework are covered in [Node Lite](/en/modules/cloud-node-lite).

With either node running, on the server (see [Cloud Server](/en/modules/cloud-server)):

1. Create node `blog` under Node Config and copy its access token
2. Add menus of type `table` with values `blog.Article` and `blog.Category`
3. Start the node. The server must reach `http://<node ip>:9090`

## Differences Worth Knowing

- Field naming follows Java (`publishDate`); the other SDKs use whatever names the model declares (e.g. `publish_date`)
- A wrong plain access token or a denied right answers **500** from the Spring node, a failed signature check **403**; the SDKs answer **403** in every case (`erupt-cloud/PROTOCOL.md` §8 proposes 403 for v1); the browser shows an error either way
- The Spring node enforces the full annotation surface (sub-tables, Excel, attachments, DataProxy hooks...); the SDKs implement what their pages list under Limitations

## Examples and Conformance

| Example | Content |
| --- | --- |
| `jvm/examples/conformance` | the conformance fixture in Java, on `erupt-cloud-node-lite` |
| `jvm/examples/blog` | the blog in Kotlin over H2, on `erupt-cloud-node-lite` |
| `jvm/examples/spring-blog` | the same blog on Spring Boot with `erupt-cloud-node-jpa`, covering the field types of [SHOWCASE](https://github.com/erupt-io/erupt-sdk/blob/main/SHOWCASE.md) |

From the erupt-sdk repository root:

```bash
# lite
mvn -f jvm/examples/pom.xml package
python3 conformance/run.py -- java -jar jvm/examples/conformance/target/erupt-conformance.jar
java -jar jvm/examples/blog/target/erupt-blog.jar

# Spring
mvn -f jvm/examples/spring-blog/pom.xml package
ERUPT_ACCESS_TOKEN=<access-token> ERUPT_SERVER=http://localhost:8080 PORT=9090 java -jar jvm/examples/spring-blog/target/erupt-node-blog-0.1.0.jar
```

## More

- [Cloud Node](/en/modules/cloud-node): Spring node configuration, JPA, plugins, registered address and signature verification, pulling configuration from the server
- [Node Lite](/en/modules/cloud-node-lite): lite node models, references, handlers, dependency injection, storage, framework adapters and signature verification
