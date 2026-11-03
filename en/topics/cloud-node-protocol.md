---
title: "erupt-cloud × Node Protocol × CloudSignature: A Node Is Not a Spring App, It Is a Protocol"
description: "In a distributed admin, how much must each service carry itself? This issue takes apart erupt-cloud's node protocol: login, menus, validation, Excel and attachments are all handled by the server, a node hands over only a model description and data access, and so a 2,400-line node with no Spring can join safely."
outline: deep
---

# Issue 20 · A Node Is Not a Spring App, It Is a Protocol

> In a traditional distributed admin, every service you add means wiring the gateway, token checks, permissions and front-end integration once more. erupt-cloud bets the other way: **the thinner the node, the better**. Login, menus, permissions, validation, Excel and attachments are handled by the server, and a node hands over just two things: a model description (the build JSON) and data access. Thin enough that a node no longer has to be a Spring app: `erupt-cloud-node-lite` is about 2,400 lines, and its runtime depends only on `erupt-annotation`, `erupt-cloud-common` and `linq.j`.
>
> _Published 2026-10-16 · ~10 min read_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt WeChat Official Account" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · Official Account</div>
    <div class="topic-mp-qr__title">Follow the Erupt Official Account</div>
    <p class="topic-mp-qr__desc">Every issue is published there first, along with release notes, source walkthroughs and community case studies.</p>
  </div>
</div>

[[toc]]

## 1. Why this issue

Picture five backend services: orders, content, tickets, risk, settlement. Operations wants one admin to run them all. The usual route is for each service to write its own management endpoints, for the front end to integrate them, for a gateway to do the routing, and for every service to check tokens and permissions on its own. The bigger the admin, the more every service repeats.

In the last two weeks `erupt-cloud` in the main repo changed in one connected run: the node protocol document (`erupt-cloud/PROTOCOL.md`) landed; the server started validating on the node's behalf and signing every forward with an HMAC (#428); `erupt-cloud-node-lite` pulled the node out of Spring (#429, #430); and registration was extracted into `NodeRegistrar`, shared by both kinds of node (#431). They all point at one claim:

> **The smallest unit of a distributed admin should not be "a service" but "a contract".** Make the contract narrow enough and anything can implement it, starting with the JVM frameworks that aren't Spring.

## 2. Two ways to split: every service does it all, or the server does it for them

| Dimension | Each service carries its own (common) | Server does it, node hands over a contract (erupt-cloud) |
|---|---|---|
| Login, sessions, users | Every service checks tokens, or it all falls on the gateway | Only on the server (`erupt-upms`); a node has no user table and no session |
| Menu and button permissions | Each service wires into the permission system | The server checks menus and `power`, and tells the node "already checked" through a signed `Erupt-Enforced` |
| UI | Each service gets its own pages or integration work | The node reports build JSON, the server renders it |
| Node tech stack | Usually the same microservice ecosystem | HTTP + JSON; Java, Kotlin, Solon, Quarkus, Micronaut, Vert.x and Servlet adapters exist |
| Can a browser call a service directly | Depends on gateway config | No: any request carrying an `Origin` header gets a 403 |

What a node keeps is one thing: **the data only it has**.

## 3. Countable facts: 7 required endpoints

The protocol sorts what a node implements into three levels. Level 0 in `PROTOCOL.md` §5.1 is just 7 endpoints, and implementing them gives you a table, search, detail view and add / edit / delete:

| Method | Path | Purpose |
|---|---|---|
| GET | `/erupt-api/build/{erupt}` | the model description, `EruptBuildModel` |
| POST | `/erupt-api/data/table/{erupt}` | paged query (`TableQuery`) |
| GET | `/erupt-api/data/{erupt}/{id}` | one record |
| GET | `/erupt-api/data/init-value/{erupt}` | form defaults (`{}` is allowed) |
| POST | `/erupt-api/data/modify/{erupt}` | add |
| POST | `/erupt-api/data/modify/{erupt}/update` | edit |
| POST | `/erupt-api/data/modify/{erupt}/delete` | delete |

Level 1 is implemented only for the features a model declares (trees, row operations, reference pickers, dependent fields...), and Level 2 is optional. **Anything not implemented answers 404**, and the server hides or covers for it: Excel import / export, attachment upload and static options are done by the server from the node's build JSON and the Level 0 endpoints (`PROTOCOL.md` §5.3, §5.4).

The `Node` class in `erupt-cloud-node-lite` registers 11 routes in its constructor: Level 0 plus the reference picker and row operations. Registration and heartbeat go through `xyz.erupt.cloud.common.node.NodeRegistrar`: JDK only, every 15 seconds, one class shared by the Spring node and the lite node.

## 4. Capability one: the build JSON is fully resolved

What is the "model description" a node hands over? It is `@Erupt` / `@EruptField` serialized key by key from the annotation attributes, matching the server's `xyz.erupt.core.view.EruptBuildModel`. The protocol requires it to be **fully resolved**: expressions are already evaluated, dynamic options are already in `componentValue`, and the browser never runs node code.

So a node does not have to "know the front end". It only turns annotations into JSON. In lite, a model is declared with the same annotations a Spring application uses:

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

Create node `blog` on the server, take its access token, put `blog.Article` in a menu, and you get the full table and form. Move the same class back into a Spring application and nothing changes.

"What about other languages" rests on two **generated** files: `schema/erupt-annotations.schema.json` (the JSON Schema of `eruptJson` and `eruptFieldJson`) and `schema/erupt-node-defaults.json` (the resolved defaults per edit type). `NodeSchemaTest` and `NodeDefaultsTest` in `erupt-test` check them for drift: change an annotation without regenerating and the build fails. The protocol gets a single source of truth that raises its own alarm.

## 5. Capability two: the signature, and the "already checked" claim

Handing validation to the server has one precondition: the node must be able to tell that a request really came from the server and that the server says it checked. The mechanism is HMAC-SHA256 keyed by the node's access token, so the token itself no longer travels. The comment on `xyz.erupt.cloud.common.http.CloudSignature` spells out what is signed:

```
method \n path?query \n timestamp \n enforced \n sha256(user header) \n sha256(body)
```

The user header, the body and `Erupt-Enforced` are all covered, so none can be altered; the timestamp window is 300 seconds, which stops stale replays. The `Enforced` enum has three values: `POWER` (endpoint rights and the `power` in the build), `QUERY` (search conditions, sorting, page size cap) and `RECORD` (not-null, number, length, choice and XSS rules). This is how the lite node verifies a signature:

```java
String enforced = req.header().apply(CloudSignature.HEADER_ENFORCED);
String timestamp = req.header().apply(CloudSignature.HEADER_TIMESTAMP);
if (timestamp == null || !CloudSignature.verify(accessToken, req.method(), req.target(), timestamp, enforced, req.header().apply(HEADER_USER),
        multipart ? null : req.body() == null ? new byte[0] : req.body(), signature, System.currentTimeMillis() / 1000)) {
    throw new Reply(403);
}
return CloudSignature.Enforced.parse(enforced);
```

Only after the signature verifies is `Erupt-Enforced` trusted and the node allowed to skip the checks it claims. Against an older, unsigned server the node recomputes permissions itself per `PROTOCOL.md` §6.1 and **fails closed**. `.requireSignature(true)` refuses any request that carries only the plain token.

:::tip A counter-intuitive point
Moving the checks to the server makes a node safer, not riskier. A third-party 2,400-line node won't get every validation right; let the server run the same `EruptValueValidator` (last issue) and forward the result signed, and the node's room to be wrong shrinks to "how data is stored". The protocol also names what can't be skipped: a node still whitelists field names that go into SQL, even when `query` is in `Erupt-Enforced`.
:::

## 6. How does it compare with JeecgBoot microservices / RuoYi-Cloud / Yida?

We haven't tested these platforms one by one. The left column below lists **questions worth asking when you choose**, not conclusions about them; check each platform's own docs and test it.

| Dimension | Domestic platforms: what to ask | Erupt |
|---|---|---|
| Adding a service to the admin | What does a JeecgBoot microservice or RuoYi-Cloud sub-service need changed in the gateway and permission system, and how many classes? | Register a `nodeName` and token on the server, then the node registers; the menu value is `blog.Article` |
| Sub-service tech stack | Is the same Spring Cloud ecosystem required? | The protocol is HTTP + JSON; `erupt-cloud-node-lite` adds Solon, Quarkus, Micronaut, Vert.x and Servlet adapters |
| Where the UI comes from | Do sub-service pages need writing and integrating separately? | The node reports build JSON, the server renders it, no front-end work |
| Sub-service permissions | Does each service check tokens and rights itself, or does the gateway own it? | The server checks menus and `power` and declares "already checked" by signature; the node trusts only the signature |
| Data from an external system | Do Yida's or Jiandaoyun's connectors / custom APIs make you configure the field structure again on the platform? | The model is declared once on the node with annotations; the build JSON stays in sync |
| Excel and attachments on a node | Does each service build its own import / export and file storage? | The node answers 404 and the server covers it through the Level 0 endpoints |

### Costs and limits

An issue should write the shortfalls down where readers can see them:

- **The protocol is still a draft.** `PROTOCOL.md` is marked Draft v0; `protocolVersion`, the `capabilities` declaration and the conformance suite are all tagged **[v1 proposal]**. Today the protocol version is the erupt version.
- **The lite node is unfinished.** Sub-tables (`TAB_*`), multi-choice / collection members, TPL operations, tree models, dependent fields on references, file upload, `@Erupt(filter)` and message i18n are listed as "not yet" in its README.
- **"Any language" is so far a promise at the protocol level.** The adapters shipped in the main repo all run on the JVM; the cross-language conformance suite and the Kotlin example live in the separate `erupt-sdk` repository.
- **A node must stay on the internal network.** The server trusts the build JSON a node reports, and the protocol says plainly that the `data` a row operation returns runs as JavaScript in the browser, so a node may only put code it wrote there, never data.

## 7. 5 minutes from annotation to UI

The full flow from an empty project to an admin page you can open is its own page:

**→ [Quick Start](/guide/quick-start)**

That page sets up the server. A node is a separate process: for a Spring Boot node see [Erupt Cloud Node](/modules/cloud-node); to stay off Spring, use `erupt-cloud-node-lite` (or `-solon`, `-quarkus`, `-micronaut`, `-vertx`, `-servlet`), keeping its version in step with erupt:

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-cloud-node-lite</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

Once it runs, the instance shows on the server's node page; add a menu of type `table` with value `blog.Article`.

## 8. Next issue

The `erupt-webhook` preview from last time slips to the next issue: it subscribes to `EruptAddEvent` / `EruptEditEvent` / `EruptDeleteEvent` and, **after** the transaction commits, POSTs the change to someone else, signed with HMAC-SHA256. We'll ask **why "tell the outside world the data changed" doesn't belong in `DataProxy#afterAdd`**, and why the up-to-3 delivery retries happen off the request thread.

---

:::info Join the discussion
Source behind this issue: `erupt-cloud/PROTOCOL.md`, `erupt-cloud/erupt-cloud-common/.../http/CloudSignature.java`, `erupt-cloud/erupt-cloud-common/.../node/NodeRegistrar.java`, `erupt-cloud/erupt-cloud-node-lite/.../Node.java`, `erupt-core/.../view/EruptBuildModel.java`, and `erupt-test/.../cloud/NodeSchemaTest.java`.

Whether `protocolVersion` and `capabilities` should be mandatory in v1 is up for discussion in [GitHub Discussions](https://github.com/erupts/erupt/discussions).
:::
