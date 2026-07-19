---
title: "While MyBatis-Plus Was Grinding SQL DSLs, Erupt Built a Full Ring of Backend Infrastructure Around JPA"
description: One @Entity, ten identities inside the Erupt ecosystem — UI, RBAC, REST API, Auto DDL, i18n, DataProxy, Lambda queries, AI Agent, workflow engine, and cross-service aggregation.
outline: deep
---

# Issue 03 · While MyBatis-Plus Was Grinding SQL DSLs, Erupt Built a Full Ring of Backend Infrastructure Around JPA

> One `@Entity`, and inside the Erupt ecosystem it grows **10 identities: UI / RBAC / REST API / Auto DDL / i18n / DataProxy / Lambda queries / AI Agent / workflow engine / cross-service aggregation**.
>
> _Published 2026-05-25 · ~10 min read_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt WeChat Official Account" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · Official Account</div>
    <div class="topic-mp-qr__title">Follow Erupt on WeChat</div>
    <p class="topic-mp-qr__desc">Each issue is published here first, along with release notes, source code walkthroughs, and community case studies.</p>
  </div>
</div>

## 1. Not JPA-Plus

Anyone familiar with the Chinese Java ecosystem who hears "JPA enhancement" immediately thinks of one thing: **MyBatis-Plus**.

It layered `LambdaQueryWrapper`, auto-fill, soft delete, and a code generator on top of MyBatis, becoming the ceiling of the domestic ORM world.

So Chinese developers naturally ask:

> Since Erupt bets on JPA, is it just "JPA-Plus"?

It isn't. Our bet is bigger —

**Erupt is not an enhancement of JPA. It is a superset of JPA.**

MyBatis-Plus has done everything there is to do in the "write less SQL" space. But **writing a backend system means 80% of the work isn't writing SQL at all — it's writing the ring of infrastructure around the SQL**: UI, permissions, APIs, schema creation, internationalization, AI, approval flows, cross-service aggregation...

That ring is what we're betting on.

## 2. One Table, Ten Things: What a Single `@Entity` Can Do Inside Erupt

Let's put the whole picture up front — each of the 10 rows below is an identity that the same JPA entity "grows" inside the Erupt ecosystem:

| # | Capability | How It's Attached |
| --- | --- | --- |
| 1 | **UI Rendering** (Table / Form) | [`@EruptField`](/en/annotation/erupt-field) · 30 [`EditType`](/en/field-types/) variants |
| 2 | **RBAC Permissions** | [`@Power`](/en/annotation/power) 8 toggles + `PowerHandler` for dynamic permissions |
| 3 | **REST API** (automatic) | `EruptDataController` auto-exposes at `/erupt-api/data/*` |
| 4 | **Auto DDL** | Hibernate `ddl-auto: update` — change the annotation, the schema changes |
| 5 | **i18n** (12 languages) | [`I18nTranslate.$translate(key)`](/en/advanced/i18n) + CSV dictionary |
| 6 | **DataProxy business hooks** | [`beforeAdd / afterAdd / ...` 10+ hooks](/en/advanced/data-proxy) |
| 7 | **Lambda queries** | [`EruptLambdaQuery<T>`](/en/advanced/erupt-dao-lambda) type-safe DSL |
| 8 | **AI Agent** | [`erupt-ai-claw`](/en/modules/erupt-ai-claw) — import and go, zero-code LLM CRUD |
| 9 | **Approval workflow** | [`@EruptFlow`](/en/modules/pro/erupt-flow) — entity is the workflow carrier |
| 10 | **Cross-service aggregation** | [`erupt-cloud-node-jpa`](/en/modules/cloud-node) — heartbeat reports to a central admin |

Let's break these into three groups: **4 you get by writing annotations, 3 you extend with a little code, and 3 that are the modern killer capabilities** — plus one fallback layer that never lets you down.

## 3. The Basic Four: UI / RBAC / REST API / Auto DDL — Annotations Only

These are the most straightforward, yet they form the "foundation" that 80% of backend systems need. Here's a minimal example:

```java
@Erupt(name = "Customer", power = @Power(export = true, importable = true))
@Table(name = "t_customer")
@Entity
public class Customer extends BaseModel {

    @EruptField(views = @View(title = "Customer Name"),
                edit = @Edit(title = "Customer Name", notNull = true, search = @Search))
    private String name;

    @EruptField(views = @View(title = "Tier"),
                edit = @Edit(title = "Tier", type = EditType.CHOICE,
                    choiceType = @ChoiceType(vl = {
                        @VL(value = "A", label = "Tier A"),
                        @VL(value = "B", label = "Tier B")
                    })))
    private String level;
}
```

After startup you **immediately get 4 things**, all without writing a single line of frontend, Controller, Service, or SQL script:

**1. UI Rendering** — List page, create/edit form, Excel import/export, search, sorting, bulk operations, and lazy association loading, all driven by [`@EruptField`](/en/annotation/erupt-field). [`EditType`](/en/field-types/) provides 30 field types, from the simplest [`INPUT`](/en/field-types/input) / [`NUMBER`](/en/field-types/number) / [`DATE`](/en/field-types/date) all the way to [`HTML_EDITOR`](/en/field-types/html-editor) / [`CODE_EDITOR`](/en/field-types/code-editor) / [`MARKDOWN`](/en/field-types/markdown) / [`MAP`](/en/field-types/map) / [`SIGNATURE`](/en/field-types/signature) / [`REFERENCE_TREE`](/en/field-types/reference-tree) / [`REFERENCE_TABLE`](/en/field-types/reference-table) — every field input component a backend system needs is here.

**2. RBAC Permissions** — [`@Power`](/en/annotation/power) has 8 independent toggles: `add / edit / delete / query / viewDetails / export / importable / print`. You can restrict support staff to query-only, finance to export-only, and administrators to everything including delete. 8 static toggles not enough? Attach a `PowerHandler` — it's a plain Spring Bean, `@Autowired` to pull in `RoleService` or `TenantContext` — **dynamic permissions aren't a SaaS drag-and-drop; they're 6 lines of Java**.

**3. Automatic REST API** — `EruptDataController` (`erupt-core/.../controller/EruptDataController.java`) auto-mounts 6 core endpoints at `/erupt-api/data/*`:

```
POST /erupt-api/data/table/{erupt}                Paginated list query (with search conditions)
GET  /erupt-api/data/{erupt}/{id}                 Fetch by primary key
GET  /erupt-api/data/tree/{erupt}                 Tree-structured data
GET  /erupt-api/data/init-value/{erupt}           Default values for new record
POST /erupt-api/data/{erupt}/operator/{code}      Custom action button
GET  /erupt-api/data/{erupt}/reference-table/{f}  Associated table query
```

Combined with the insert / update / delete exposed by `EruptModifyService`, **zero-code RESTful backend** — hit these endpoints directly in Postman to CRUD.

**4. Auto DDL** — Set `hibernate.ddl-auto: update` in `application.yml`. Add a field, change a type, add an index — restart and the schema syncs automatically. **During development you don't need to write a single SQL migration script** — just edit the Java annotation. See [Database Support](/en/guide/database) for details.

The engineering nature of this layer is: **Erupt compresses "the backend foundation" into metadata**. Metadata = UI = Permissions = API = Schema — all four share a single source. Change one and all are synchronized. This is territory neither MyBatis-Plus nor Spring Data JPA has ever touched.

## 4. The Advanced Three: i18n / DataProxy / Lambda — A Little Code to Extend

### i18n (12 languages out of the box)

> Full documentation: [Internationalization](/en/advanced/i18n)

Source: `erupt-core/src/main/resources/i18n/erupt.i18n.csv`. One key per row, columns correspond to 12 languages:

```csv
key,zh-CN,zh-TW,en-US,fr-FR,ja-JP,ko-KR,ru-RU,es-ES,de-DE,pt-PT,id-ID,ar-SA
```

In code, `I18nTranslate.$translate("erupt.exec_success")` returns the copy in the current user's language. In annotations, `@Edit(title = "{customer.name}")` uses `{key}` placeholders that are substituted at render time. **One CSV file manages frontend copy + backend error messages + annotation titles simultaneously** — the internationalization requirement that most SaaS projects get stuck on costs essentially nothing in Erupt.

### DataProxy (service-layer hooks)

> Full documentation: [DataProxy](/en/advanced/data-proxy)

Most backend frameworks get ugly when it comes to "where does business logic go" — MyBatis forces a mapper + service + interceptor three-tier structure; JeecgBoot has you edit the generated service class; SaaS platforms have you write JS snippets inside a canvas.

Erupt's answer is **`DataProxy<T>`** — a plain Spring Bean:

```java
@Service
public class CustomerProxy implements DataProxy<Customer> {

    @Override
    public void beforeAdd(Customer model) { /* validation / defaults */ }

    @Override
    @Transactional
    public void afterUpdate(Customer model) { /* audit log */ }

    @Override
    public String beforeFetch(List<Condition> conditions) {
        return "ownerId = " + MetaContext.getUser().getId();   // 👈 row-level security
    }
}
```

[`@Erupt(dataProxy = CustomerProxy.class)`](/en/annotation/erupt) — reference it and it takes effect. 10+ hooks cover the full lifecycle of CRUD, Excel import/export, and field validation.

Its fundamental difference from canvas-based "write JS in an event panel" is — **this code shares the same transaction manager, the same security context, and the same unit tests as your service layer**. It can `@Autowired` any dependency, apply `@Transactional` and `@PreAuthorize`, be refactored in the IDE, and go through PR code review.

### Lambda Queries: Zero Boilerplate for Conditional Branches

> Full documentation: [EruptDao](/en/advanced/erupt-dao)

```java
eruptDao.lambdaQuery(Customer.class)
    .like(StringUtils.isNotBlank(q.getName()), Customer::getName, q.getName())
    .ge(q.getMinAmount() != null, Customer::getAmount, q.getMinAmount())
    .in(q.getLevels() != null, Customer::getLevel, q.getLevels())
    .between(q.getStartDate() != null,
             Customer::getCreateDate, q.getStartDate(), q.getEndDate())
    .orderByDesc(Customer::getCreateDate)
    .page(q.getLimit(), q.getOffset());
```

Focus on the first parameter of each line —

`StringUtils.isNotBlank(q.getName())`, `q.getMinAmount() != null`...

This is one of `EruptLambdaQuery`'s most satisfying design choices: **all `where` methods have a `(boolean condition, ...)` overload**. The meaning is "if the parameter is empty, don't add this condition" — no more `if` statements scattered around. **6 conditions in 6 chained calls, done**.

Full method list: `eq / ne / gt / lt / ge / le / between / notBetween / in / notIn / like / likeValue / isNull / isNotNull / orderBy / orderByAsc / orderByDesc / with (JOIN eager loading)`. Result options: `one / list / count / page / oneSelect / listSelect / listSelects`.

Source: `erupt-data/erupt-jpa/.../EruptLambdaQuery.java`

## 5. Killer Feature 1: [`erupt-ai-claw`](/en/modules/erupt-ai-claw) — Zero-Code LLM CRUD Across All Entities

This is the most counterintuitive thing Erupt does on top of JPA —

**Let an LLM CRUD any of your `@Erupt` entities through natural language, without you writing a single extra line of code.**

Not "draw a chat box for the operations team." Not "attach an AI suggestion button to a form field." And absolutely **not "make you write an `@AiToolbox` class for each table"**. This is truly:

> Add the `erupt-ai-claw` dependency, and when an ops user says in admin AI Chat "**find Zhang San's orders from last week and mark all the 'pending approval' ones as 'approved'**" — the LLM automatically discovers your entities, reads the schema, runs HQL, actually queries JPA, updates fields, runs permission checks, and commits the transaction.

### Add the Jar, Done

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-ai-claw</artifactId>
</dependency>
```

That's it. **Every `@Erupt` entity in your project is immediately accessible by the LLM** — add a new entity, change a field, it takes effect with zero configuration.

### Why Doesn't It Need Any Extra Code From You?

Source: `erupt-ai-claw/.../tool/EruptModelTools.java`:

```java
@AiToolbox
@Component
public class EruptModelTools {

    @Tool("Erupt data model list")
    public String eruptModelList() {
        for (EruptModel erupt : EruptCoreService.getErupts()) { /* ... */ }
    }

    @Tool("Erupt data model schema")
    public String eruptSchema(String eruptName) {
        return GsonFactory.getGson().toJson(EruptCoreService.getEruptView(eruptName));
    }

    @Tool("Query erupt model data ... SELECT only")
    public String eruptDataQuery(String hql) {
        return GsonFactory.getGson().toJson(
            eruptDao.getEntityManager().createQuery(hql).setMaxResults(200).getResultList());
    }

    @Tool("Insert / Update / Delete erupt data ...")
    public String insertEruptData(String eruptName, Map<String, Object> data) { /* ... */ }
    // ... also findEruptDataByPk / updateEruptData / deleteEruptData
}
```

Notice — all 8 `@Tool` methods are **fully generic**, targeting no specific entity. Underneath are 3 generic services: `EruptCoreService` for the metadata graph, `EruptModifyService` for generic write operations, and `EruptDataController` for generic queries.

Add a new `@Erupt` entity? The LLM recognizes it immediately. **Because metadata = LLM Tool**.

And `ClawSystemPrompt` has already pre-loaded the workflow prompt:

> When operating on Erupt model data: always call `eruptModelList` first if the target model is unknown, call `eruptSchema` before any read or write to confirm field names, for updates call `findEruptDataByPk` first to retrieve the current record ...

**Users neither write tools nor write prompts.**

### Three Safety Gates

An LLM CRUDing the database directly sounds dangerous, so Erupt provides three gates:

1. **HQL forced SELECT-only**: `eruptDataQuery` says right in the tool description `INSERT/UPDATE/DELETE/DROP/TRUNCATE are strictly forbidden` — the LLM sees this rule itself
2. **Write operations go through `@Power` RBAC**: `insertEruptData / updateEruptData / deleteEruptData` internally go through `EruptModifyService` — the same permission gates as when an ops user manually clicks "Create." If you set `@Power(delete = false)` on an entity, the LLM can't delete it either
3. **Role-level tool permissions**: `LLMRoleService.getAllowedToolsByUid(...)` filters callable tools by role — regular employees can only call read tools, admins can call write tools

The underlying [`erupt-ai`](/en/modules/erupt-ai) module ships with 17 LLM providers — ChatGPT / Claude / DeepSeek / Gemini / Grok / Qwen / Moonshot / Ollama / OpenAI-compatible... switch with one click in admin. **Run the demo with DeepSeek today, run production with Ollama tomorrow — no business code changes**.

The engineering nature of this layer: **AI is not a separate service, not a chat box, not an overlay. It is the `@Erupt` metadata graph fed directly to the LLM**. Metadata = UI = LLM Tool — three from the same source, so the LLM taking over admin needs no extra code.

## 6. Killer Feature 2: [`@EruptFlow`](/en/modules/pro/erupt-flow) — Entity as Approval Workflow Carrier

Nearly every backend system has approval flows — leave requests, order changes, contract approvals, customer tier adjustments.

The traditional solution is to bring in Activiti / Flowable / Camunda. Their pain point is **dual-track data models**: the workflow engine lives in its own `act_*` tables; the business entity lives in its own `t_order` table; the two sides are linked by a `businessKey` string. Every time you want to "show approval progress in the order detail view," you write join bridges.

Erupt flips this — **the business entity itself is the carrier of the workflow instance**:

```java
@Erupt(name = "Leave Application")
@EruptFlow(flowProxy = LeaveFlowProxy.class)   // 👈 one annotation, enters the workflow
@Entity
public class LeaveApplication extends BaseModel {
    private String applicant;
    private Integer days;
    private String status;
}
```

After startup this entity automatically gains: an admin form/list with a "workflow progress" button, approvers see the record in their "To-do" list, and `LeaveFlowProxy` is called back when a node transitions.

`FlowProxy`'s three hooks (`onNodeStart` / `onNodeEnd` / `onReject`) are plain Spring Beans — they can `@Autowired` in `EruptDao` to directly change the business entity's status, or call `NoticeService` to push a DingTalk notification — **linking approval outcomes to business data with zero duplicated code**.

The core data model `EruptFlowInstance` has two key fields: `erupt` (entity class name) + `eruptModelId` (entity primary key). **The workflow instance directly knows which JPA row it's bound to** — no more `businessKey` string bridges.

We're not saying Activiti is bad — when you need strict BPMN compliance and cross-system workflow standardization, it remains the first choice. But 80% of internal approval scenarios don't need BPMN. They need "leave request → supervisor → approval" — a three-to-five node flow.

**Erupt Flow's bet is: in that 80% scenario, the business model shouldn't have to yield to the workflow model.**

## 7. Killer Feature 3: [`erupt-cloud`](/en/modules/erupt-cloud) — Microservice JPA Remote Aggregation

This is the most information-dense of the 10 capabilities.

Consider this scenario — you have 10 microservices, each with 5–10 JPA entities, and your ops team needs to manage all the data from a single unified admin. What do you do?

Traditional solutions come in two flavors:

**A. Merge all JPA entities into one admin project** — copy all 10 services' `@Entity` classes into `admin-aggregator`, connect 10 data sources. Cost: dependency conflicts, field definition drift, and every microservice field change requires a synchronized admin update.

**B. Each microservice has its own admin** — 10 separate backends. Cost: no shared login state, no unified menu, ops staff have to open 10 different URLs.

Erupt's third option:

```
┌────────── erupt-cloud-server (central admin) ──────────┐
│       No business data, only aggregates @Erupt metadata │
└──────┬─────────────┬─────────────┬──────────────────────┘
       │heartbeat    │heartbeat    │heartbeat
   ┌───▼───┐    ┌────▼───┐    ┌────▼───┐
   │ Order │    │ User   │    │ Stock  │
   │ + JPA │    │ + JPA  │    │ + JPA  │
   │ + Node│    │ + Node │    │ + Node │
   └───────┘    └────────┘    └────────┘
```

Each microservice adds [`erupt-cloud-node-jpa`](/en/modules/cloud-node), **retaining its own independent JPA entities and database**, but at startup it reports its `@Erupt`-annotated metadata (menus, fields, permissions) to the [cloud-server](/en/modules/cloud-server) via HTTP heartbeat.

Configuration in `erupt.cloud-node`:

```yaml
erupt:
  cloud-node:
    node-name: order-service
    access-token: ${ERUPT_CLOUD_TOKEN}
    server-addresses: [https://admin.company.com]
    heartbeat-time: 15000
```

What the ops team sees in the central admin:

```
📋 Order Management    └ Order List (from Order node, t_order)
👥 User Management    └ User List (from User node, t_user)
📦 Inventory          └ SKU List (from Stock node, t_sku)
```

Click "Order List" and cloud-server transparently forwards the request to the Order node. The node uses its own `EruptDao.lambdaQuery(Order.class)` to query its own database and returns the result.

**The entire process is transparent to both ops and engineers** —

- Ops sees a unified admin, a single menu, a single login
- Engineers write `@Entity` + `@Erupt` in their own microservice, exactly the same as a monolith
- Nodes don't depend on each other; nodes and server communicate via HTTP + accessToken

The engineering value: **the node is the source of truth; the server is just the aggregated view**. Change a field in a microservice without syncing admin; onboard a new service and it appears automatically; field definitions never drift.

If you run a SaaS platform, a multi-product ToB matrix, or an internal multi-team platform — this is the killer feature.

## 8. The Fallback: [Multiple Data Sources](/en/advanced/datasource) + JdbcTemplate

Anyone who has written a lot of JPA has encountered this awkward moment:

> Writing this query in JPA is longer than just writing the SQL, or the SQL it generates is completely wrong.

`EruptDao` holds `EntityManager` + `JdbcTemplate` + `NamedParameterJdbcTemplate` simultaneously:

```java
eruptDao.find(Customer.class, 1L);                                      // JPA
eruptDao.lambdaQuery(Customer.class).eq(Customer::getName, "A").one();  // Lambda
eruptDao.getJdbcTemplate().queryForList("select ...");                  // Raw SQL
eruptDao.getEntityManager("report");                                    // Multiple data sources
```

All four are the most native Spring ecosystem APIs — **choosing JPA doesn't lock you in**. See [EruptDao](/en/advanced/erupt-dao) and [Multiple Data Sources](/en/advanced/datasource) for details.

## 9. Competitor Comparison

| Dimension | **MyBatis-Plus** | **Spring Data JPA** | **Erupt JPA** |
| --- | --- | --- | --- |
| Core enhancement | SQL DSL | Repository pattern | **JPA → 10-identity superset** |
| UI rendering | None | None | **30 EditType variants** |
| RBAC permissions | None | None | **8 Power toggles + dynamic Handler** |
| REST API | None | Spring Data REST | **`EruptDataController` auto-exposes** |
| Auto DDL | None | Hibernate ddl-auto | **Hibernate ddl-auto** |
| i18n | None | None | **12-language CSV dictionary** |
| Service hooks | Interceptors | `@EntityListeners` | **`DataProxy<T>` 10+ hooks** |
| Conditional query boilerplate | Manual `if` wrapping | Specification | **`(boolean cond, ...)` overloads** |
| **AI integration** | **None** | **None** | **`erupt-ai-claw` zero-code LLM CRUD** |
| **Workflow engine** | **None** | **None** | **`@EruptFlow` entity as workflow carrier** |
| **Microservice aggregation** | **None** | **None** | **`erupt-cloud-node-jpa` heartbeat reporting** |
| Best scenario | High-concurrency consumer-facing | Standard CRUD | **Backend / internal systems / AI-Native / multi-service platform** |

We're not saying MyBatis-Plus or Spring Data JPA are bad — high-concurrency consumer apps with fine-grained SQL control is MyBatis-Plus territory; standard CRUD microservices are still cleanest with Spring Data JPA.

But when you're building an **admin panel, internal system, operations platform, or SaaS control console**, and you want that system to **simultaneously be clicked by ops, called by LLMs, run approvals, and aggregate across services** — this is Erupt's territory. It's the only territory Erupt claims.

## 10. Running in 5 Minutes

> For complete dependency configuration and project initialization, see [Quick Start](/en/guide/quick-start).

1. Add [`@Erupt`](/en/annotation/erupt) next to `@Entity` on your entity, start up → admin is already there
2. Set `hibernate.ddl-auto: update` in `application.yml`, schema auto-syncs
3. Configure a LLM in admin (DeepSeek or Ollama both work), open AI Chat
4. Tell it "find Zhang San's orders from last week" — LLM does it with 0 extra code

Under 5 minutes.

## 11. Closing Thoughts

Back to the question at the start — is Erupt JPA-Plus?

No. The "JPA-Plus" label implies "one more SQL DSL layer," but that layer is where MyBatis-Plus has already hit the ceiling. Competing there further has rapidly diminishing marginal returns.

What Erupt adds on top of JPA is **a complete ring of backend infrastructure** —

- **The Basic Four** (UI / RBAC / REST API / Auto DDL) give you **a full admin by writing annotations**
- **The Advanced Three** (i18n / DataProxy / Lambda) let you **extend business logic with minimal code**
- **The Killer Three** (`erupt-ai-claw` / `@EruptFlow` / `erupt-cloud`) put you **into capabilities that other frameworks in this era haven't caught up to yet**
- **The Fallback Layer** (multiple data sources + JdbcTemplate) means you **always have a way out**

Put all 10 together and **Erupt JPA is not the next version of JPA — it is a superset of JPA**.

JPA, the metadata specification that's been praised and cursed for 20 years, was rediscovered by us as "the floor of low-code" — compressing further would be dishonest.

The rest is handed to IDE, Git, and Spring — a toolchain validated over 20 years.

:::tip Ready to Try It
Follow the 4 steps in §10 to get up and running. Stuck? Ask in [GitHub Discussions](https://github.com/erupts/erupt/discussions), or scan the QR code at the top of the article to join the community.
:::
