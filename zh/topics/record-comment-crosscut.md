---
title: "记录评论为什么不绑定业务表"
description: 所有做后台的人都给某张表加过 remark 字段，然后加 remark_user、remark_time，然后建一张 xxx_comment 子表，然后下一个实体来了再来一遍。Erupt 押反向：评论不认识任何业务实体，靠 (模型名, 主键字符串) 寻址；哪怕记录在另一台机器上，评论也留在中心。
outline: deep
---

# 第 11 期 · 记录评论为什么不绑定业务表

> 后台系统里「这条记录为什么长这样」的答案，几乎从来不在记录里。它在群里、在工单里、在某个人的脑子里。于是我们给表加 `remark` 字段，再加 `remark_user`、`remark_time`，再建一张 `xxx_comment` 子表——然后下一个业务实体来了，重来一遍。
> 这一期讲 `erupt-comment`。我们的结论是：**评论是一个横切面，它不该认识任何业务实体，也不该住在业务数据所在的那台机器上。**
>
> _发布于 2026-09-17 · 阅读 ~10 min_

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

先说需求是怎么来的。

用户的原话通常是："这条退款单为什么退了？财务问我，我只能去翻群聊。" 后台系统天然缺一层**记录级的对话**——不是操作日志（那是机器写的、说"谁改了什么"），而是人写的、说"为什么"。

国内平台都做了这层，但都把它挂在了一个具体的业务对象上：

- **钉钉宜搭**、**腾讯微搭**：评论长在**审批流程节点**上，叫「审批意见」。流程走完，意见就锁在那个实例里；一条没走流程的数据，没有地方可写。
- **简道云**、**明道云**：评论是**表单的评论区**，跟着这张表单定义走。换一张表单，配置重来一遍。
- **JeecgBoot** / **若依 RuoYi**：online 表单没有这一层，通常的做法就是本文开头那句——给业务表加字段，或者建一张业务专属的 `xxx_comment`。

三条路径的共同点是：**评论的生命周期，依附于某个具体的业务对象定义。** 定义有多少个，这层就要长多少遍。

本文的反向命题是：

> **评论层和业务表是正交的。它既不该被写进业务表的 schema，也不该跟着业务数据去它所在的那台机器。**

第一句是老生常谈，第二句才是这一期真正想讲的——在 erupt-cloud 的多节点部署里，**记录在节点上，评论必须留在中心**。这一条会逼出一个核心注解的新属性。

## 二、两种做法：纵向挂载 vs 横切寻址

| 维度 | 纵向挂载（子表 / 流程节点 / 表单评论区） | 横切寻址（`erupt-comment`） |
|---|---|---|
| 新增一个业务实体的成本 | 加一张子表或配一次评论区 | **0** |
| 业务表 schema 改动 | 加字段或加外键 | **0**，评论表不认识任何业务表 |
| 主键类型 | 子表外键必须和主表主键同类型 | 一律按字符串寻址，`Long` / `UUID` / 复合串通吃 |
| 关掉评论 | 删配置 / 删表 | 注解上一个 `@Power(comment = false)` |
| 模型被删之后的旧评论 | 外键悬空或级联删除 | 行还在，退化成显示原始模型名 |
| 记录在远端节点 | 评论跟着去节点 | **评论留在中心**，见 §五 |

「横切」的代价是放弃了数据库外键——评论表和业务表之间没有任何约束。我们认为这笔交易划算：外键换来的是引用完整性，而**一条针对已删除记录的历史评论，本来就应该留着**。

## 三、九个类、七条路由、一个可选依赖

先给可数的事实。整个模块在 `erupt-plugin/erupt-comment/`：

- **9 个 Java 类**，没有一个是抽象基类或 SPI
- **1 张表** `e_record_comment`，联合索引 `(erupt, recordId)`
- **7 条 REST 路由**，全部挂在 `/erupt-api/comment/**`
- **1 个可选依赖**：`erupt-notice`

七条路由如下（`EruptCommentController`）：

| 方法 | 路径 | 作用 |
|---|---|---|
| `GET` | `/{erupt}/{id}` | 读一条记录的全部评论 |
| `POST` | `/{erupt}/{id}` | 发一条评论（可带 `parentId` 与 `mentions`） |
| `POST` | `/{erupt}/counts` | 一页表格的评论计数，用来在行上打角标 |
| `GET` | `/{erupt}/mention-users` | 输入 `@` 时的候选人 |
| `PUT` | `/{erupt}/{id}/{commentId}/resolved` | 标记线程已解决（折叠） |
| `PUT` | `/{erupt}/{id}/{commentId}/pinned` | 置顶线程 |
| `DELETE` | `/{erupt}/{id}/{commentId}` | 删除，仅作者或超管 |

注意 `counts` 和 `mention-users` 是字面量段，排在 `{id}` 变量之前——这是 Spring 路由的既有规则，但把它写进注释是为了防止后来人加一条 `GET /{erupt}/{something}` 时踩坑。

**@mention 是可选的。** `erupt-notice` 在 pom 里标了 `<optional>true</optional>`，通知器整个类挂在 `@ConditionalOnClass` 上：

```java
@Slf4j
@Component
@ConditionalOnClass(name = "xyz.erupt.notice.service.EruptNoticeService")
public class CommentMentionNotifier {

    public static final String SCENE_CODE = "comment_mention";

    @Transactional
    public void notify(EruptRecordComment comment, List<Long> receivers) {
        if (null == receivers || receivers.isEmpty()) return;
        try {
            this.ensureScene();
            NoticeMessage message = new NoticeMessage();
            message.setTitle(I18nTranslate.$translate("comment.mention.title")
                    .replace("{0}", eruptUserService.getSimpleUserInfo().getUsername())
                    .replace("{1}", modelTitle(comment.getErupt())));
            message.setUrl("/#/fill/build/table/" + comment.getErupt() + "?id=" + comment.getRecordId());
            eruptNoticeService.send(eruptInternalNotice, SCENE_CODE, receivers, message);
        } catch (Exception e) {
            // a failed notice must not fail the comment
            log.error("comment mention notice failed", e);
        }
    }
}
```

服务层用 `ObjectProvider` 拿它，拿不到就跳过：

```java
@Autowired
private ObjectProvider<CommentMentionNotifier> mentionNotifier;
// ...
mentionNotifier.ifAvailable(n -> n.notify(comment, mentions.stream().map(MentionVo::getId).toList()));
```

没装 `erupt-notice` 时，`@` 依然会被解析、存进 `mentions` 字段、在前端高亮——只是没人收到站内信。**降级是静默的，不是报错的。**

`catch` 块也值得说一句：发信失败只打日志。一条评论已经写进库了，不该因为通知链路抽风而回滚。

## 四、寻址：把主键当字符串存

这是全模块唯一一个"设计决策"，其余都是它的推论。

```java
@EruptI18n
@Erupt(
        name = "Record Comment",
        orderBy = "createTime desc",
        power = @Power(add = false, edit = false, export = true)
)
@Entity
@Table(name = "e_record_comment", indexes = @Index(columnList = "erupt, recordId"))
@Getter
@Setter
public class EruptRecordComment extends xyz.erupt.upms.helper.HyperModelCreatorOnlyVo {

    @Column(length = 100)
    private String erupt;      // 模型名，云节点模型为 "nodeName.eruptName"

    @Column(length = 100)
    private String recordId;   // 主键渲染成字符串

    @Column(length = 4000)
    private String content;

    private Long parentId;     // 线程只有一层：回复指向顶层评论

    @Column(length = 2000)
    private String mentions;   // [{id, name}] 的 JSON 快照
}
```

三个决定：

**`recordId` 是 `String`。** 于是 `Long` 主键、`UUID` 主键、甚至复合主键拼出来的串，都能进同一张表。代价是查询只能走那个联合索引、做不了 join——对一个「打开一条记录时读十几行」的场景，这不是问题。

**`mentions` 存的是快照 `[{id, name}]`，不是外键。** 用户改名之后，历史评论里显示的还是当时那个名字。这是刻意的：评论是一段历史记录，不是一个实时视图。写入前会过一遍 `resolveMentions`，只保留真实存在的用户 id，杜绝前端伪造。

**线程只有一层。** 回复一条回复，会被拉平到它的顶层：

```java
comment.setParentId(null == parent.getParentId() ? parent.getId() : parent.getParentId());
```

没有无限嵌套，也就没有渲染缩进的递归、没有"删中间节点怎么办"。删顶层时把它的回复一并带走，就是全部的级联逻辑。

开关在 `@Power` 上（`xyz.erupt.annotation.sub_erupt.Power`，2.2.0 新增）：

```java
@Comment("Whether records of this model carry a comment stream (needs the erupt-comment module)")
boolean comment() default true;
```

前端读它决定要不要显示入口，服务端**也**读它决定要不要接受写入：

```java
private void checkEnabled(String erupt) {
    EruptModel model = EruptCoreService.getEruptWithRemote(erupt);
    if (null != model && !model.getErupt().power().comment()) {
        throw new EruptWebApiRuntimeException("Comments are disabled for " + erupt);
    }
}
```

:::tip 圈出一个反直觉的小结
这张表故意**不知道**自己在给谁存评论。所以后台那张「评论记录」管理表里，"模型"这一列不能直接展示 `erupt` 的原始值——那是个类名，对人没有意义。`CommentEruptChoice` 反过来查：先 `select distinct c.erupt` 找出**真的有人评论过**的模型，再用 `@Erupt(name)` 作为标签交给 `EruptUtil.getChoiceList` 走一遍 i18n。

于是筛选框里只会出现真实存在过的模型，一个没人评论过的模型不配占一个选项；一个已经被删掉的模型，则用它自己的名字继续指认自己。
:::

## 五、`cloudProxy = false`：记录在节点，评论在中心

前面都还算常规。真正被逼出来的设计在这里。

`erupt-cloud` 的默认语义是：**erupt 名字指向哪个节点，请求就转发到哪个节点**。中心只是一个网关，业务模型和数据都在节点上。这条规则以前对所有 API 都成立。

评论是第一个必须打破它的 API。因为一条评论由四样东西组成——**评论表、作者、@ 候选人、站内信**——**它们全都在中心**。节点既没装这个模块，也没有用户体系，它根本答不上来。

于是 `@EruptRouter` 加了一个属性（`erupt-core`，`xyz.erupt.core.annotation.EruptRouter`）：

```java
@Comment("Whether erupt-cloud-server may forward this API to the node that owns the erupt. " +
        "Turn it off for a server-owned API that only keys on the erupt name (record comments, " +
        "for example): the node neither carries the module nor knows the server's users, so the " +
        "server must answer the call itself, under the 'nodeName.eruptName' it addressed")
boolean cloudProxy() default true;
```

`EruptCloudServerInterceptor` 在任何节点路由之前先看它：

```java
// Server-owned API (record comments and the like): the erupt name may point at a node, but the
// answer lives here — the node carries neither the module nor the users the data refers to.
if (!eruptRouter.cloudProxy()) return true;
```

默认 `true`，所以**现存的每一条路由行为不变**。评论的七条路由全部标 `cloudProxy = false`。

妙处在于寻址不需要任何额外映射：请求进来时 erupt 名字已经是 `nodeName.eruptName`（云菜单本来就是这么注册的），这串东西直接就是评论行的 key。中心不需要知道这条记录长什么样，只需要知道它被**叫作**什么。

一个刻意的取舍写在 `checkEnabled` 的注释里：节点模型解析出来的是一个带注解默认值的远程占位对象，`power().comment()` 读不到节点上的真实声明。**我们没有为此回节点取一次。** 理由是浏览器据以显示入口的 build model 本来就来自节点，节点自己的 opt-out 在客户端已经生效；为服务端这一道兜底去换一次 HTTP 往返，每写一条评论都要付，不值。

:::info 这一条推广到别处
`cloudProxy` 不是给评论开的后门，它是 core 对 cloud-server 说「这条 API 归中心」的**唯一一个点**。任何只按 erupt 名字寻址、数据却落在中心的能力——收藏、订阅、标签、审批意见——以后都用同一个开关。
:::

## 六、跟宜搭 / 简道云 / JeecgBoot 怎么比？

| 维度 | 钉钉宜搭 / 腾讯微搭 | 简道云 / 明道云 | JeecgBoot / 若依 | Erupt `erupt-comment` |
|---|---|---|---|---|
| 评论挂在哪 | 审批流程节点（审批意见） | 表单实例的评论区 | 无内置，自行加字段 | 任意 `@Erupt` 模型的任意一行 |
| 没走流程的数据能评论吗 | 否 | 是（限已配表单） | — | 是 |
| 新增实体的接入成本 | 配一次流程 | 配一次评论区 | 改一次表结构 | **0** |
| 关闭开关 | 流程配置 | 表单配置 | 改代码 | `@Power(comment = false)` |
| @提及 | 有，绑钉钉 / 企微通讯录 | 有 | — | 有，走 `erupt-notice`，**模块缺席则静默降级** |
| 多节点 / 私有化分布式 | SaaS，不适用 | SaaS 为主 | 单体 | 记录在节点、评论在中心（`cloudProxy = false`） |
| 评论数据归属 | 平台侧 | 平台侧 | 自有库 | 自有库，一张 `e_record_comment` |

最后一行是这一期真正的分野。SaaS 平台上，"评论存在哪"不是一个你能回答的问题；`erupt-comment` 里它是一张你能 `select *` 的表，甚至能在后台以普通模型的形态打开（菜单挂在**系统管理**下，和登录日志、操作日志并列——它就是一种日志）。

## 七、5 分钟上手

从空 Spring Boot 项目到能访问的 admin 页面，完整流程已经独立成一篇：

**→ [快速部署 / Quick Start](/zh/guide/quick-start)**

那一页覆盖 Maven 依赖、`application.yml`、第一个 `@Erupt` 实体、默认登录账号，以及 Docker / K8S 部署。

跑通之后，本模块只要加一个依赖（用 `erupt-spring-boot-starter-all` 的话已经包含了）：

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-comment</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

装上即生效——**所有** `@Erupt` 模型的记录面板里都会出现评论入口。要给某个模型关掉：

```java
@Erupt(name = "结算单", power = @Power(comment = false))
```

想让 `@` 真的发出站内信，再补一个 `erupt-comment` 之外的可选依赖：

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-notice</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

不加也能用，见 §三。

## 八、下一期预告

第 12 期讲 `erupt-remote` 新加的 SFTP 文件面板。有意思的不是"能传文件了"，而是**它没有为此新开一条连接**：文件面板和 SSH 终端复用同一个已认证的会话，配合新的 `RemoteHost.authUsers`——一台主机精确地到达一组人，别的什么都不授予。

把主机控制权放进浏览器这件事，安全边界画在哪里，下一期展开。

---

:::info 参与讨论
本期专题对应的核心源码在 [`erupt-plugin/erupt-comment`](https://github.com/erupts/erupt/tree/master/erupt-plugin/erupt-comment)，`cloudProxy` 在 [`xyz.erupt.core.annotation.EruptRouter`](https://github.com/erupts/erupt/blob/master/erupt-core/src/main/java/xyz/erupt/core/annotation/EruptRouter.java)。欢迎在 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 留贴。
:::
