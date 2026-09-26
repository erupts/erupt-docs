---
title: "Why Comments Don't Bind to Business Tables"
description: "Everyone who has built an admin backend has added a remark column to some table, then remark_user and remark_time, then an xxx_comment child table — and then done it all over again for the next entity. Erupt bets the reverse: comments know nothing about any business entity and are addressed by (model name, primary key as a string); even when the record lives on another machine, the comment stays at the center."
outline: deep
---

# Issue 11 · Why Comments Don't Bind to Business Tables

> In an admin system, the answer to "why does this record look like this" is almost never in the record. It's in a group chat, in a ticket, in someone's head. So we add a `remark` column to the table, then `remark_user` and `remark_time`, then an `xxx_comment` child table — and when the next business entity shows up, we do it all again.
> This issue is about `erupt-comment`. Our conclusion: **comments are a cross-cutting concern. They should not know about any business entity, and they should not live on the machine where the business data lives.**
>
> _Published 2026-09-17 · ~10 min read_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt WeChat Official Account" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · Official Account</div>
    <div class="topic-mp-qr__title">Scan to follow the Erupt official account</div>
    <p class="topic-mp-qr__desc">Each issue debuts here, along with release notes, source-code deep dives, and community case studies.</p>
  </div>
</div>

[[toc]]

## 1. Why We Wrote This

Start with where the requirement comes from.

The user's words are usually something like: "Why was this refund approved? Finance asked me, and all I could do was dig through the group chat." Admin systems are inherently missing a layer of **record-level conversation** — not the operation log (written by machines, saying "who changed what"), but something written by people, saying "why."

Every domestic platform has built this layer, and every one of them hung it on a specific business object:

- **DingTalk Yida**, **Tencent WeDa**: comments live on **approval flow nodes**, under the name "approval opinions." Once the flow completes, the opinions are locked inside that instance; a record that never went through a flow has nowhere to be commented on.
- **Jiandaoyun**, **Mingdao**: comments are a **comment section on the form**, attached to that form definition. Switch to another form, and you configure it all over again.
- **JeecgBoot** / **RuoYi**: online forms have no such layer; the usual approach is the one from the opening line — add columns to the business table, or build a business-specific `xxx_comment`.

What the three paths have in common: **the lifecycle of a comment is tied to a specific business object definition.** However many definitions you have, that's how many times this layer gets rebuilt.

The contrarian thesis of this piece:

> **The comment layer is orthogonal to business tables. It should neither be written into a business table's schema, nor follow the business data to whatever machine it lives on.**

The first half is a truism. The second half is what this issue is really about — in a multi-node erupt-cloud deployment, **the record lives on the node, and the comment must stay at the center**. That single rule forces a new attribute onto a core annotation.

## 2. Two Approaches: Vertical Mounting vs. Cross-Cutting Addressing

| Dimension | Vertical mounting (child table / flow node / form comment section) | Cross-cutting addressing (`erupt-comment`) |
|---|---|---|
| Cost of adding a new business entity | One more child table, or one more comment-section config | **0** |
| Changes to the business table schema | Add columns or a foreign key | **0** — the comment table knows no business table |
| Primary key type | The child table's FK must match the parent's PK type | Always addressed as a string; `Long` / `UUID` / composite strings all work |
| Turning comments off | Delete config / drop the table | `@Power(comment = false)` on the annotation |
| Old comments after a model is deleted | Dangling FK or cascade delete | Rows stay, degrading to show the raw model name |
| Record on a remote node | Comments go to the node with it | **Comments stay at the center**, see Section 5 |

The price of "cross-cutting" is giving up the database foreign key — there is no constraint at all between the comment table and the business tables. We think the trade is worth it: what the FK buys you is referential integrity, and **a historical comment on a deleted record is exactly the kind of thing that should be kept anyway**.

## 3. Nine Classes, Seven Routes, One Optional Dependency

Start with the countable facts. The whole module lives in `erupt-plugin/erupt-comment/`:

- **9 Java classes**, none of which is an abstract base class or SPI
- **1 table**, `e_record_comment`, with a composite index on `(erupt, recordId)`
- **7 REST routes**, all under `/erupt-api/comment/**`
- **1 optional dependency**: `erupt-notice`

The seven routes (`EruptCommentController`):

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/{erupt}/{id}` | Read all comments on one record |
| `POST` | `/{erupt}/{id}` | Post a comment (optionally with `parentId` and `mentions`) |
| `POST` | `/{erupt}/counts` | Comment counts for one page of a table, used for row badges |
| `GET` | `/{erupt}/mention-users` | Candidate users when typing `@` |
| `PUT` | `/{erupt}/{id}/{commentId}/resolved` | Mark a thread resolved (collapsed) |
| `PUT` | `/{erupt}/{id}/{commentId}/pinned` | Pin a thread |
| `DELETE` | `/{erupt}/{id}/{commentId}` | Delete; author or super admin only |

Note that `counts` and `mention-users` are literal segments and are declared ahead of the `{id}` variable — that's standard Spring routing, but it's written into a code comment so the next person adding a `GET /{erupt}/{something}` doesn't trip over it.

**@mention is optional.** `erupt-notice` is marked `<optional>true</optional>` in the pom, and the entire notifier class hangs on `@ConditionalOnClass`:

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

The service layer fetches it through an `ObjectProvider` and skips it if it isn't there:

```java
@Autowired
private ObjectProvider<CommentMentionNotifier> mentionNotifier;
// ...
mentionNotifier.ifAvailable(n -> n.notify(comment, mentions.stream().map(MentionVo::getId).toList()));
```

Without `erupt-notice` installed, `@` is still parsed, stored in the `mentions` column, and highlighted on the frontend — nobody just receives an in-app message. **The degradation is silent, not an error.**

The `catch` block deserves a word too: a failed send only logs. The comment is already in the database, and it shouldn't be rolled back because the notification path is having a bad day.

## 4. Addressing: Store the Primary Key as a String

This is the module's only real "design decision"; everything else is a corollary.

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

Three decisions:

**`recordId` is a `String`.** So `Long` keys, `UUID` keys, even strings assembled from composite keys all fit in the same table. The cost is that queries can only go through that composite index and you can't join — for a scenario of "read a dozen rows when opening one record," that's not a problem.

**`mentions` stores a snapshot `[{id, name}]`, not foreign keys.** After a user renames themselves, historical comments still show the name from back then. This is deliberate: a comment is a piece of history, not a live view. Before writing, the list passes through `resolveMentions`, which keeps only user ids that actually exist, so the frontend can't forge them.

**Threads are one level deep.** Replying to a reply gets flattened onto its top-level comment:

```java
comment.setParentId(null == parent.getParentId() ? parent.getId() : parent.getParentId());
```

No infinite nesting, so no recursive indentation to render and no "what happens when you delete a middle node." Deleting a top-level comment takes its replies with it — that's the entirety of the cascade logic.

The switch sits on `@Power` (`xyz.erupt.annotation.sub_erupt.Power`, added in 2.2.0):

```java
@Comment("Whether records of this model carry a comment stream (needs the erupt-comment module)")
boolean comment() default true;
```

The frontend reads it to decide whether to show the entry point; the server **also** reads it to decide whether to accept writes:

```java
private void checkEnabled(String erupt) {
    EruptModel model = EruptCoreService.getEruptWithRemote(erupt);
    if (null != model && !model.getErupt().power().comment()) {
        throw new EruptWebApiRuntimeException("Comments are disabled for " + erupt);
    }
}
```

:::tip A counterintuitive takeaway
This table deliberately **does not know** whose comments it's storing. So in the admin's "Record Comment" management table, the "Model" column can't just show the raw value of `erupt` — that's a class name, meaningless to a human. `CommentEruptChoice` works backwards: first `select distinct c.erupt` to find the models that **someone has actually commented on**, then hand `@Erupt(name)` as the label to `EruptUtil.getChoiceList` for an i18n pass.

The result is that the filter dropdown only ever shows models that have really existed; a model nobody has commented on doesn't earn an option, and a model that has since been deleted keeps identifying itself by its own name.
:::

## 5. `cloudProxy = false`: Record on the Node, Comment at the Center

Everything so far is fairly conventional. The design that was genuinely forced is here.

The default semantics of `erupt-cloud`: **whichever node an erupt name points to, that's where the request is forwarded**. The center is just a gateway; business models and data live on the nodes. That rule used to hold for every API.

Comments are the first API that has to break it. A comment is made of four things — **the comment table, the author, the @ candidates, the in-app notification** — and **all four live at the center**. The node has neither this module installed nor a user system; it simply cannot answer.

So `@EruptRouter` gained an attribute (`erupt-core`, `xyz.erupt.core.annotation.EruptRouter`):

```java
@Comment("Whether erupt-cloud-server may forward this API to the node that owns the erupt. " +
        "Turn it off for a server-owned API that only keys on the erupt name (record comments, " +
        "for example): the node neither carries the module nor knows the server's users, so the " +
        "server must answer the call itself, under the 'nodeName.eruptName' it addressed")
boolean cloudProxy() default true;
```

`EruptCloudServerInterceptor` checks it before any node routing:

```java
// Server-owned API (record comments and the like): the erupt name may point at a node, but the
// answer lives here — the node carries neither the module nor the users the data refers to.
if (!eruptRouter.cloudProxy()) return true;
```

The default is `true`, so **every existing route behaves exactly as before**. All seven comment routes are marked `cloudProxy = false`.

The neat part is that addressing needs no extra mapping: by the time the request arrives, the erupt name is already `nodeName.eruptName` (that's how cloud menus are registered in the first place), and that string is directly the key of the comment row. The center doesn't need to know what the record looks like, only what it's **called**.

One deliberate trade-off is written into a comment in `checkEnabled`: a node model resolves to a remote placeholder object carrying annotation defaults, so `power().comment()` can't read the real declaration on the node. **We did not go back to the node for it.** The reasoning: the build model the browser uses to show the entry point already comes from the node, so the node's own opt-out is already in effect on the client; paying an HTTP round trip on every comment write just for this server-side backstop isn't worth it.

:::info This generalizes
`cloudProxy` isn't a backdoor opened for comments. It's the **single point** where core tells cloud-server "this API belongs to the center." Any capability that addresses by erupt name alone but whose data lands at the center — favorites, subscriptions, tags, approval opinions — uses the same switch from now on.
:::

## 6. How Does It Compare to Yida / Jiandaoyun / JeecgBoot?

| Dimension | DingTalk Yida / Tencent WeDa | Jiandaoyun / Mingdao | JeecgBoot / RuoYi | Erupt `erupt-comment` |
|---|---|---|---|---|
| Where comments attach | Approval flow nodes (approval opinions) | Comment section on a form instance | None built in; add columns yourself | Any row of any `@Erupt` model |
| Can data outside a flow be commented on | No | Yes (configured forms only) | — | Yes |
| Onboarding cost per new entity | Configure a flow | Configure a comment section | Change the table schema | **0** |
| Off switch | Flow config | Form config | Change code | `@Power(comment = false)` |
| @mention | Yes, bound to DingTalk / WeCom directory | Yes | — | Yes, via `erupt-notice`; **silent degradation when the module is absent** |
| Multi-node / private distributed deployment | SaaS, not applicable | Mostly SaaS | Monolith | Record on the node, comment at the center (`cloudProxy = false`) |
| Who owns the comment data | Platform side | Platform side | Your own DB | Your own DB, one `e_record_comment` table |

The last row is the real dividing line of this issue. On a SaaS platform, "where are the comments stored" isn't a question you get to answer; in `erupt-comment` it's a table you can `select *` from, and even open in the admin as an ordinary model (the menu sits under **System Management**, alongside the login log and operation log — because it is a kind of log).

## 7. Up and Running in 5 Minutes

From an empty Spring Boot project to a reachable admin page, the full flow is its own page:

**→ [Quick Start](/en/guide/quick-start)**

That page covers Maven dependencies, `application.yml`, the first `@Erupt` entity, the default login account, and Docker / K8S deployment.

Once it's running, this module needs just one dependency (already included if you use `erupt-spring-boot-starter-all`):

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-comment</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

It takes effect on install — the record panel of **every** `@Erupt` model gets a comment entry. To turn it off for one model:

```java
@Erupt(name = "结算单", power = @Power(comment = false))
```

If you want `@` to actually send in-app messages, add one more optional dependency beyond `erupt-comment`:

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-notice</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

It works without it too, see Section 3.

## 8. Next Issue Preview

Issue 12 covers the new SFTP file panel in `erupt-remote`. The interesting part isn't "it can transfer files now," it's that **it didn't open a new connection to do so**: the file panel and the SSH terminal share the same already-authenticated session, paired with the new `RemoteHost.authUsers` — one host reaches exactly one group of people, and grants nothing else.

Putting control of a host inside the browser: where the security boundary is drawn, next issue.

---

:::info Join the discussion
The core source for this issue lives in [`erupt-plugin/erupt-comment`](https://github.com/erupts/erupt/tree/master/erupt-plugin/erupt-comment); `cloudProxy` is in [`xyz.erupt.core.annotation.EruptRouter`](https://github.com/erupts/erupt/blob/master/erupt-core/src/main/java/xyz/erupt/core/annotation/EruptRouter.java). Come post on [GitHub Discussions](https://github.com/erupts/erupt/discussions).
:::
