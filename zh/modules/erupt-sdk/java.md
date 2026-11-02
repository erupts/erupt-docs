# Java / Kotlin

Java 和 Kotlin 不需要单独的 SDK：节点随 erupt 一起发布，注解与服务端永远匹配。服务用常规的 `@Erupt` / `@EruptField` 注解声明模型，加一个依赖即成为节点。Spring Boot 项目使用 `erupt-cloud-node`，其他技术栈使用不依赖 Spring 的 `erupt-cloud-node-lite` 及其框架适配模块。`erupt-cloud-node` 也是其他语言 SDK 所遵循的节点协议的参考实现。

> 多语言 SDK 总览见 [Erupt SDK](/zh/modules/erupt-sdk/)，节点协议与服务端见 [Cloud Server](/zh/modules/cloud-server)。

## 选择模块

| 技术栈 | artifactId | 文档 |
| --- | --- | --- |
| Spring Boot 3.5（Java 17+） | `erupt-cloud-node-jpa`（带 JPA 数据层），或仅 `erupt-cloud-node` | [Cloud Node](/zh/modules/cloud-node) |
| 纯 Java / Kotlin（JDK 自带 HTTP 服务） | `erupt-cloud-node-lite` | [Node Lite](/zh/modules/cloud-node-lite) |
| Solon / Quarkus / Micronaut / Vert.x / Ktor / Servlet 容器 | `erupt-cloud-node-solon` / `-quarkus` / `-micronaut` / `-vertx` / `-ktor` / `-servlet` | [Node Lite · 各框架适配](/zh/modules/cloud-node-lite#各框架适配) |

所有模块的 groupId 均为 `xyz.erupt`，版本与 erupt 一致。轻量节点（`-lite` 及各适配模块）自 erupt **2.4.0** 起提供。

## 安装

Spring Boot：

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-cloud-node-jpa</artifactId>   <!-- 或 erupt-cloud-node -->
    <version>${erupt.version}</version>
</dependency>
```

不使用 Spring：

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <!-- 或 erupt-cloud-node-solon / -quarkus / -micronaut / -vertx / -ktor / -servlet -->
    <artifactId>erupt-cloud-node-lite</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

:::tip 版本尚未发布时
在 erupt 发布包含轻量节点的版本前，可在 erupt 源码目录执行 `mvn install -pl erupt-cloud/erupt-cloud-node-lite -am -DskipTests` 安装到本地仓库。
:::

## 快速开始：Spring Boot

取自 `jvm/examples/spring-blog`（`erupt-cloud-node-jpa` + H2）。`application.yml`：

```yaml
server:
  port: ${PORT:9090}

erupt:
  cloud-node:
    node-name: ${ERUPT_NODE_NAME:blog}
    # 服务端「节点管理」→ 新增节点 blog → 查看令牌；不要提交到代码库
    access-token: ${ERUPT_ACCESS_TOKEN}
    server-addresses: ${ERUPT_SERVER:http://localhost:8080}   # 多个地址轮询
    # host-address: http://10.0.0.12:9090                     # 仅当服务端访问不到自动检测的地址时设置
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

配置、数据库与插件的完整说明见 [Cloud Node](/zh/modules/cloud-node)。

## 快速开始：轻量节点

取自 `jvm/examples/blog`（Kotlin，`erupt-cloud-node-lite` + H2）：

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

enum class Status { DRAFT, PUBLISHED }   // 枚举成员即 CHOICE

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
    val dataSource = JdbcDataSource().apply { setURL("jdbc:h2:./blog") }   // 表需自行创建，示例在此执行 CREATE TABLE IF NOT EXISTS
    Node(System.getenv("ERUPT_NODE_NAME") ?: "blog", System.getenv("ERUPT_ACCESS_TOKEN"), System.getenv("ERUPT_SERVER") ?: "http://localhost:8080")
        .register(Category::class.java, JdbcRepository(dataSource, "category"))
        .register(Article::class.java, JdbcRepository(dataSource, "article"))
        .serve("0.0.0.0", System.getenv("PORT")?.toInt() ?: 9090)
}
```

`serve` 在 JDK HTTP 服务上监听、注册并阻塞，Ctrl-C / SIGTERM 时注销。模型、处理器、存储与各框架挂载方式见 [Node Lite](/zh/modules/cloud-node-lite)。

两种方式启动后，在服务端（详见 [Cloud Server](/zh/modules/cloud-server)）：

1. 在「节点管理」（Node Config）中创建节点 `blog`，复制它的 access-token
2. 新增类型为 `table` 的菜单，类型值填 `blog.Article`、`blog.Category`
3. 启动节点。服务端需能访问 `http://<节点 ip>:9090`

## 值得注意的差异

- 字段命名遵循 Java 习惯（`publishDate`）；其他语言的 SDK 使用模型声明的名字（如 `publish_date`）
- 明文 access-token 错误或权限不足时，Spring 节点返回 **500**，签名校验失败时返回 **403**；各语言 SDK 一律返回 **403**（`erupt-cloud/PROTOCOL.md` §8 建议 v1 统一为 403），浏览器两种情况都显示错误
- Spring 节点支持完整的注解能力（子表、Excel、附件、DataProxy 钩子等）；各语言 SDK 的支持范围见各自文档的「能力边界」

## 示例与一致性测试

| 示例 | 内容 |
| --- | --- |
| `jvm/examples/conformance` | 一致性测试夹具，Java，基于 `erupt-cloud-node-lite` |
| `jvm/examples/blog` | 示例博客，Kotlin + H2，基于 `erupt-cloud-node-lite` |
| `jvm/examples/spring-blog` | 同一博客，Spring Boot + `erupt-cloud-node-jpa`，覆盖 [SHOWCASE](https://github.com/erupt-io/erupt-sdk/blob/main/SHOWCASE.md) 的字段类型 |

在 erupt-sdk 仓库根目录执行：

```bash
# 轻量节点
mvn -f jvm/examples/pom.xml package
python3 conformance/run.py -- java -jar jvm/examples/conformance/target/erupt-conformance.jar
java -jar jvm/examples/blog/target/erupt-blog.jar

# Spring
mvn -f jvm/examples/spring-blog/pom.xml package
ERUPT_ACCESS_TOKEN=<access-token> ERUPT_SERVER=http://localhost:8080 PORT=9090 java -jar jvm/examples/spring-blog/target/erupt-node-blog-0.1.0.jar
```

## 更多

- [Cloud Node](/zh/modules/cloud-node)：Spring 节点的配置、JPA、插件、注册地址与签名校验、从服务端拉取配置
- [Node Lite](/zh/modules/cloud-node-lite)：轻量节点的模型声明、引用、处理器、依赖注入、存储、各框架适配与签名校验
