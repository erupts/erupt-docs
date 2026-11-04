---
title: "erupt-cloud × Node Protocol × CloudSignature：节点不是一个 Spring 应用，是一份协议"
description: "分布式后台里，每个服务到底要自己扛多少东西？本期拆 erupt-cloud 的节点协议：登录、菜单、校验、Excel、附件全由服务端代办，节点只交出模型描述和数据读写，于是一个 2400 行、不依赖 Spring 的节点也能安全接入。"
outline: deep
---

# 第 20 期 · 节点不是 Spring 应用，是一份协议

> 传统分布式后台里，每接入一个服务，就要再接一遍网关、token 校验、权限和前端联调。erupt-cloud 押反向：**节点越薄越好**——登录、菜单、权限、校验、Excel、附件都由服务端代办，节点只交出两样东西：模型描述（build JSON）和数据读写。薄到这个程度，节点就不必是 Spring 应用了：`erupt-cloud-node-lite` 约 2400 行，运行时只依赖 `erupt-annotation`、`erupt-cloud-common` 和 `linq.j`。
>
> _发布于 2026-10-16 · 阅读 ~10 min_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt 微信公众号" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · 公众号</div>
    <div class="topic-mp-qr__title">扫码关注 Erupt 公众号</div>
    <p class="topic-mp-qr__desc">每期专题首发于此，另有版本动态、源码解读、社区精选案例。</p>
  </div>
</div>

[[toc]]

## 一、为什么写这篇

想象公司里有五个后端服务：订单、内容、工单、风控、结算。运营想要一个后台把它们管起来。常见的做法是各服务各写一套管理接口，前端再统一对接，网关管路由，每个服务再自己校验 token、自己查权限。后台越大，「每个服务都要重复做的事」越多。

过去两周，主仓里 `erupt-cloud` 发生了一组连续的变化：节点协议文档（`erupt-cloud/PROTOCOL.md`）落地、服务端开始代办校验并给转发加 HMAC 签名（#428）、`erupt-cloud-node-lite` 把节点从 Spring 里拆出来（#429、#430）、注册逻辑抽成两种节点共用的 `NodeRegistrar`（#431）。它们指向同一个命题：

> **分布式后台的最小单元不该是「一个服务」，而是「一份契约」。** 契约定得足够窄，实现它的东西就可以是任何东西——先从非 Spring 的 JVM 框架开始。

## 二、两种拆法：服务各自做全套，还是服务端统一代办

| 维度 | 各服务自带一套（常见做法） | 服务端代办，节点只交契约（erupt-cloud） |
|---|---|---|
| 登录、会话、用户 | 每个服务校验 token，或全压给网关 | 只在服务端（`erupt-upms`）；节点没有用户表、没有会话 |
| 菜单与按钮权限 | 每个服务各接一遍权限系统 | 服务端查菜单、查 `power`，通过 `Erupt-Enforced` 签名告诉节点「已查过」 |
| 界面 | 每个服务配一套前端页面或联调 | 节点上报 build JSON，服务端渲染 |
| 节点能用什么技术栈 | 通常是同一套微服务生态 | HTTP + JSON；Java、Kotlin、Solon、Quarkus、Micronaut、Vert.x、Servlet 都已有适配 |
| 浏览器能不能直连服务 | 取决于网关配置 | 不能：带 `Origin` 头的请求一律 403 |

节点保留的只有一件事：**它独有的数据**。

## 三、可数的事实：7 个必需接口

协议把节点要实现的东西分成三级。`PROTOCOL.md` §5.1 的 Level 0 只有 7 个端点，实现了就有表格、搜索、详情和新增 / 编辑 / 删除：

| 方法 | 路径 | 作用 |
|---|---|---|
| GET | `/erupt-api/build/{erupt}` | 模型描述 `EruptBuildModel` |
| POST | `/erupt-api/data/table/{erupt}` | 分页查询（`TableQuery`） |
| GET | `/erupt-api/data/{erupt}/{id}` | 单条详情 |
| GET | `/erupt-api/data/init-value/{erupt}` | 表单默认值（允许 `{}`） |
| POST | `/erupt-api/data/modify/{erupt}` | 新增 |
| POST | `/erupt-api/data/modify/{erupt}/update` | 编辑 |
| POST | `/erupt-api/data/modify/{erupt}/delete` | 删除 |

Level 1 按模型声明的特性按需实现（树、行操作、引用选择器、联动……），Level 2 是可选扩展。**不实现就回 404**，服务端会隐去或代办：Excel 导入导出、附件上传、静态选项，服务端直接用节点的 build JSON 和 Level 0 接口完成（`PROTOCOL.md` §5.3、§5.4）。

`erupt-cloud-node-lite` 的 `Node` 类在构造器里注册了 11 条路由，就是 Level 0 加上引用选择器和行操作。注册与心跳走 `xyz.erupt.cloud.common.node.NodeRegistrar`：只用 JDK，每 15 秒一次，Spring 节点和 lite 节点共用同一个类。

## 四、关键能力一：build JSON 是「完全求值」的

节点要交的「模型描述」是什么？是 `@Erupt` / `@EruptField` 按注解属性逐项序列化出的 JSON，对应服务端的 `xyz.erupt.core.view.EruptBuildModel`。协议规定它必须**完全求值**：表达式已算完、动态选项已填进 `componentValue`，浏览器永远不执行节点的代码。

这意味着一个节点不需要「懂前端」。它只要把注解变成 JSON。lite 里是这样声明模型的，和 Spring 应用用的是同一批注解：

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
}

new Node("blog", System.getenv("ERUPT_ACCESS_TOKEN"), "http://erupt-server:8080")
        .register(Article.class, new JdbcRepository<>(dataSource, "article"))
        .serve("0.0.0.0", 9090);
```

服务端创建节点 `blog`、拿到访问令牌，菜单填 `blog.Article`，就能看到完整的表格与表单。同一个类放回 Spring 应用也不用改。

「别的语言怎么办」靠的是两份**生成出来的**文件：`schema/erupt-annotations.schema.json`（`eruptJson` 与 `eruptFieldJson` 的 JSON Schema）和 `schema/erupt-node-defaults.json`（每种编辑类型解析后的默认值）。`erupt-test` 里的 `NodeSchemaTest` 与 `NodeDefaultsTest` 检查它们有没有漂移：改了注解而没重新生成，构建就失败。协议因此有一个会自己报警的单一事实来源。

## 五、关键能力二：签名，以及「已检查」的声明

把校验交给服务端有一个前提：节点必须能确定「这个请求真的来自服务端，并且服务端说它检查过了」。做法是 HMAC-SHA256，密钥是节点的访问令牌，令牌本身不再上路。`xyz.erupt.cloud.common.http.CloudSignature` 的注释写明了被签名的内容：

```
method \n path?query \n timestamp \n enforced \n sha256(user header) \n sha256(body)
```

用户头、请求体、`Erupt-Enforced` 都在签名里，改不了；时间戳窗口 300 秒，放不过期的重放。`Enforced` 枚举只有三个值：`POWER`（接口权限与 build 里的 `power`）、`QUERY`（搜索条件、排序、分页上限）、`RECORD`（必填、数值、长度、选项、XSS）。lite 节点验证签名的代码就是这几行：

```java
String enforced = req.header().apply(CloudSignature.HEADER_ENFORCED);
String timestamp = req.header().apply(CloudSignature.HEADER_TIMESTAMP);
if (timestamp == null || !CloudSignature.verify(accessToken, req.method(), req.target(), timestamp, enforced, req.header().apply(HEADER_USER),
        multipart ? null : req.body() == null ? new byte[0] : req.body(), signature, System.currentTimeMillis() / 1000)) {
    throw new Reply(403);
}
return CloudSignature.Enforced.parse(enforced);
```

签名通过，`Erupt-Enforced` 才被采信，节点才可以跳过它声称已做的检查；没有签名的老服务端，节点自己按 `PROTOCOL.md` §6.1 重算权限，并且**失败即关闭**。`.requireSignature(true)` 则直接拒绝只带明文令牌的请求。

:::tip 反直觉的一点
把检查挪到服务端，节点反而更安全，而不是更危险。一个 2400 行的第三方节点不可能把每种校验都写对；让服务端用同一个 `EruptValueValidator`（见上一期）验完再带着签名转发，节点写错的空间就只剩「数据怎么存」。协议里也写了不能省的部分：节点仍要对拼进 SQL 的字段名做白名单——即便 `query` 已在 `Erupt-Enforced` 里。
:::

## 六、跟 JeecgBoot 微服务版 / 若依 Cloud / 宜搭怎么比？

我们没有逐项实测这些平台。下表左列是**选型时值得问的问题**，不是对它们的结论；各平台能力以官方文档和实测为准。

| 维度 | 国内对位平台：选型时该问 | Erupt |
|---|---|---|
| 新服务接入后台 | JeecgBoot 微服务版、RuoYi-Cloud 的子服务接入网关与权限体系，要改哪些东西、写几个类？ | 服务端登记 `nodeName` 与令牌，节点注册即可；菜单值写 `blog.Article` |
| 子服务的技术栈 | 是否要求同一套 Spring Cloud 生态？ | 协议是 HTTP + JSON，`erupt-cloud-node-lite` 另有 Solon、Quarkus、Micronaut、Vert.x、Servlet 适配 |
| 界面从哪来 | 子服务的页面是否需要另写、另联调？ | 节点上报 build JSON，服务端渲染，无前端工作 |
| 子服务的权限 | 每个服务各自校验 token、查权限，还是由网关统一管？ | 服务端查菜单和 `power`，用签名声明「已检查」；节点只信签名 |
| 外部系统的数据 | 宜搭、简道云的连接器 / 自定义接口，字段结构是否要在平台里再配一遍？ | 模型在节点上用注解声明一次，build JSON 自动同步 |
| 节点的 Excel、附件 | 每个服务各做导入导出与文件存储？ | 节点回 404，服务端用 Level 0 接口代办 |

### 代价与边界

我们认为专题应当把短板写在明处：

- **协议还是草案。** `PROTOCOL.md` 的状态是 Draft v0，`protocolVersion`、能力声明（`capabilities`）和一致性测试套件都标着 **[v1 proposal]**；今天协议版本等同于 erupt 版本号。
- **lite 节点没做完。** 子表（`TAB_*`）、多选 / 集合成员、TPL 操作、树模型、引用的联动字段、文件上传、`@Erupt(filter)`、消息国际化，README 里列着「暂未支持」。
- **「任何语言」目前是协议层的承诺。** 主仓里发布的适配都在 JVM 上；跨语言一致性测试和 Kotlin 示例在独立的 `erupt-sdk` 仓库。
- **节点必须在内网。** 服务端信任节点上报的 build JSON，并且协议里明写：行操作返回的 `data` 会在浏览器里当 JavaScript 执行，节点只能放自己写的代码，不能放数据。

## 七、5 分钟上手

从空项目到能访问的 admin 页面，完整流程已经独立成一篇：

**→ [快速部署 / Quick Start](/guide/quick-start)**

这一页起的是服务端。节点是另一个独立进程：Spring Boot 节点参考 [Erupt Cloud Node](/modules/cloud-node)；不想引入 Spring 的话，用 `erupt-cloud-node-lite`（或 `-solon`、`-quarkus`、`-micronaut`、`-vertx`、`-servlet`），依赖版本与 erupt 保持一致：

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-cloud-node-lite</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

跑起来之后，在服务端的节点页能看到实例，菜单里把类型选 `table`、值填 `blog.Article` 即可。

## 八、下一期预告

上期预告过的 `erupt-webhook` 顺延到下一期：它订阅 `EruptAddEvent` / `EruptEditEvent` / `EruptDeleteEvent`，在事务提交**之后**用 HMAC-SHA256 签名把数据变更 POST 给别人。我们要聊的是：**为什么「数据变了通知外部」不该写在 `DataProxy#afterAdd` 里**，以及投递失败最多 3 次的重试，为什么发生在请求线程之外。

---

:::info 参与讨论
本期涉及的源码：`erupt-cloud/PROTOCOL.md`、`erupt-cloud/erupt-cloud-common/.../http/CloudSignature.java`、`erupt-cloud/erupt-cloud-common/.../node/NodeRegistrar.java`、`erupt-cloud/erupt-cloud-node-lite/.../Node.java`、`erupt-core/.../view/EruptBuildModel.java`，以及 `erupt-test/.../cloud/NodeSchemaTest.java`。

协议里的 `protocolVersion` 与 `capabilities` 要不要在 v1 里做成强制项，欢迎到 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 留贴。
:::
