---
title: "@Erupt × DataProxy × Handler: Why We Didn't Build a Drag-and-Drop Canvas"
description: When DingTalk Yida, JianDaoYun, and JeecgBoot all went all-in on "canvas" or "canvas-generates-code," Erupt kept betting on source code itself — a single @Erupt annotation, a DataProxy<T> extension point, a set of Handler interfaces. This issue explains why.
outline: deep
---

# Issue 02 · @Erupt × DataProxy × Handler

> Erupt's atomic unit is not a canvas — it's a piece of Java code. Put an `@Erupt` next to your `@Entity` and you've declared an admin UI. This issue thoroughly explains the engineering case for not building a drag-and-drop canvas.
>
> _Published 2026-05-22 · ~9 min read_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt WeChat Official Account" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · Official Account</div>
    <div class="topic-mp-qr__title">Follow Erupt on WeChat</div>
    <p class="topic-mp-qr__desc">Each issue is published here first, along with release notes, source code walkthroughs, and community case studies.</p>
  </div>
</div>

## 1. Why This Article

Over the past year, every product launch in China's low-code space has read like the same pitch deck:

- **DingTalk Yida / Alibaba Cloud AppCube**: Forms + workflows + reports, all drag-and-drop.
- **Tencent Weda**: Browser canvas + AI co-pilot, "edit components with natural language."
- **JianDaoYun / MingDaoYun**: SaaS drag-and-drop, pitched as "business users build it themselves."
- **JeecgBoot / JNPF**: Design the form in an online designer, which **generates Java + Vue code** for you to continue editing.

Their paradigms fall into two camps:

- **Canvas is the application** (Yida / Weda / JianDaoYun / MingDaoYun): The canvas is the source of truth; exports are just backups.
- **Canvas generates code** (JeecgBoot / JNPF): The canvas is the initial scaffold; once the code is generated, you go back to your IDE to modify it.

During the same period, Erupt took a third path:

> **The code itself is the configuration.** No canvas, no "generate" step — annotations are the materialized form of a UI Schema.

This sounds counterintuitive: now that AI is writing code for us, why ask users to write annotations? This issue lays out the engineering argument for this contrarian bet.

## 2. The Fundamental Divide Between Three Kinds of "Low-Code"

Under the Chinese market label of "low-code" are three entirely different systems:

| Dimension | **Canvas is App**<br/>Yida / Weda / JianDaoYun | **Canvas Generates Code**<br/>JeecgBoot / JNPF | **Code is Config**<br/>**Erupt** |
| --- | --- | --- | --- |
| Where is the source of truth? | The SaaS canvas's internal DB | Once-generated `.java` / `.vue` files | `.java` source files in Git |
| Adding a field | Open canvas, configure → sync schema | Edit entity + edit Vue + edit mapper | Add one line of `@EruptField` |
| Diff / Review | Screenshot comparison | `git diff`, but diffing auto-generated code | `git diff`, diffing only the annotation |
| Cross-environment deployment | Import/export application package | jar + sync SQL | `mvn package` → jar |
| Where does business logic live? | Form backend events + JS snippets | Edit service / controller | Spring Bean + `DataProxy<T>` |
| Cost of subsequent modification | Low (drag) → High (as business grows complex) | High (canvas and generated code diverge) | Constant (always in IDE) |
| Who collaborates | Business users, operations staff | "Business people who can code" | Spring Boot backend engineers |

There's no question of which is superior — **they assume completely different users and system lifespans**:

- Canvas-is-app assumes "lightweight scenario, lives two years."
- Canvas-generates-code assumes "fast for PoC, maintained as code long-term" — but few people notice that **once you go back to the IDE and modify code, the canvas is no longer trustworthy**. The next time you want to use the canvas to add a field, you incur synchronization costs.
- Erupt assumes: **there are hundreds of thousands of companies with backend systems that are past the "rapid PoC" moment**. What they need is to expose a stable domain model as an admin interface with minimal overhead.

## 3. `@Erupt`: The Minimal Annotation Surface for a Domain Model

Consider a typical Erupt entity:

```java
@Erupt(
    name = "Customer",
    power = @Power(importable = true, export = true)
)
@Table(name = "t_customer")
@Entity
public class Customer extends BaseModel {

    @EruptField(
        views = @View(title = "Customer Name"),
        edit = @Edit(title = "Customer Name", notNull = true, search = @Search)
    )
    private String name;

    @EruptField(
        views = @View(title = "Tier"),
        edit = @Edit(
            title = "Tier",
            type = EditType.CHOICE,
            choiceType = @ChoiceType(vl = {
                @VL(value = "A", label = "Tier A"),
                @VL(value = "B", label = "Tier B")
            })
        )
    )
    private String level;
}
```

With just **3 annotations** and **2 fields**, Erupt generates:

- List page (with search bar, Excel import/export buttons, filter by tier)
- Create/edit form (with required field validation, dropdown options)
- Permissions / menu / API endpoints
- Frontend table behavior (sorting, column widths, action column)

The reason the annotation surface is so small lies in `erupt-core/proxy/AnnotationProxyPool.java` — at startup, Erupt serializes `@Erupt`, `@EruptField`, `@View`, and `@Edit` into JSON via `AnnotationProxy<T,R>`. The Angular frontend receives that JSON and dynamically renders the UI.

In other words, **annotations are not decoration — they are actual UI Schema** — just schema written in code, auto-completed by IDEs, and version-controlled by Git.

:::tip How This Differs from the Decorator Pattern
React's decorators and Spring's `@Component` are "runtime behavior markers" — the annotation only affects behavior.
`@Erupt` is "configuration surface materialized" — the annotation is the UI configuration itself, serializable as JSON for the frontend and readable/understandable by AI.
:::

## 4. `DataProxy<T>`: Let Spring Beans Directly Participate in the Lifecycle

The first question canvas-based platforms always face is: "What if the business logic is complex?"

The pure-canvas answer from Yida/Weda is "events + simple scripts" — you write `function onSubmit(formData) { ... }` in the canvas's property panel with no full IDE, no Spring container, no transactions. JeecgBoot's code-generation answer is "go back to the IDE and edit the service layer after the canvas is done" — but the next time you use the canvas to add a field, you have to manually resolve merge conflicts.

Erupt takes a third path — it defines an interface in the `erupt-annotation` module:

```java
public interface DataProxy<MODEL> extends MetaProxy<MODEL> {
    default void validate(MODEL model) throws EruptException {}
    default void beforeAdd(MODEL model) {}
    default void afterAdd(MODEL model) {}
    default void beforeUpdate(MODEL model) {}
    default void afterUpdate(MODEL model) {}
    default void beforeDelete(MODEL model) {}
    default void afterDelete(MODEL model) {}
    default String beforeFetch(List<Condition> conditions) { return null; }
    default void afterFetch(Collection<Map<String, Object>> list) {}
    default void searchCondition(Map<String, Object> condition) {}
    // ...
}
```

Source: `erupt-annotation/src/main/java/xyz/erupt/annotation/fun/DataProxy.java`

Any Spring Bean that implements this interface and is referenced by `@Erupt(dataProxy = ...)` runs its business logic in the create/read/update/delete lifecycle of the admin — and crucially:

- It's a plain `@Service`, capable of `@Autowired`-ing anything
- It's Spring-managed, so you can apply `@Transactional` and `@PreAuthorize`
- It's Java, so it can call JPA, Redis, message queues, and external HTTP directly
- It's source code, so it gets code review, unit tests, and IDE refactoring

```java
@Service
public class CustomerProxy implements DataProxy<Customer> {

    @Resource private CustomerService service;
    @Resource private AuditLogger auditLogger;

    @Override
    @Transactional
    public void beforeAdd(Customer model) {
        service.assertNameUnique(model.getName());
        model.setOwnerId(MetaContext.getUser().getId());
    }

    @Override
    public void afterUpdate(Customer model) {
        auditLogger.log("customer.update", model.getId());
    }
}
```

The fundamental difference between this code and a canvas-based "write JS in the property panel" is: **it shares the same transaction manager, the same security context, and the same unit tests as your service layer**.

## 5. Handler Interfaces: All "Dynamic Behaviors" Converge to Java Classes

The second thing canvas platforms like to boast about is "no-code dynamic behavior" — a dropdown's options fetched dynamically, a button that triggers a custom workflow, a row visible only to administrators.

In canvases, these features are typically implemented via "event configuration panels + proprietary DSLs."

Erupt's answer to the same set of problems is **Handler interfaces** — every place that needs to "give an answer at runtime" has a corresponding Java interface. Implement a `@Service` Bean and reference the class in the annotation:

| Scenario | Annotation | Handler Interface |
| --- | --- | --- |
| Data filtering (row-level permissions / custom queries) | `@Filter(conditionHandler = ...)` | `FilterHandler` |
| Custom action buttons | `@RowOperation(operationHandler = ...)` | `OperationHandler<Row, Form>` |
| Dynamic permission control | `@Erupt(powerHandler = ...)` | `PowerHandler` |
| Dynamic dropdown options | `@ChoiceType(fetchHandler = ...)` | `ChoiceFetchHandler` |
| Input autocomplete | `@InputType(autoCompleteHandler = ...)` | `AutoCompleteHandler` |
| Dynamic tag options | `@TagsType(fetchHandler = ...)` | `TagsFetchHandler` |

Source location: `erupt-annotation/src/main/java/xyz/erupt/annotation/fun/`

Here's a typical example — letting users only see orders they created:

```java
@Service
public class MyOrderFilter implements FilterHandler {
    @Override
    public String filter(String condition, String[] params) {
        Long uid = MetaContext.getUser().getId();
        return "ownerId = " + uid;
    }
}

@Erupt(
    name = "Order",
    filter = @Filter(conditionHandler = MyOrderFilter.class)
)
@Entity
public class Order extends BaseModel { /* ... */ }
```

Notice the design choice here: **this is not a string expression — it is a real Java interface**. That means:

- You can `@Autowired` in `RoleService`, `TenantContext`, or any Spring Bean
- You can write unit tests so PRs can merge without relying entirely on QA
- You can use IDE navigation, refactoring, and find-usages
- Complex logic (multi-tenant switching, quarterly slicing, A/B experiments) is just plain Java — no "low-code DSL" to learn

Compared to the "condition builder UI + proprietary DSL" used by most domestic low-code platforms — where logic becomes a rat's nest of nested dropdowns the moment it grows complex, with no way to code review the result — **Erupt's bet is: it's better to ask you to write 6 lines of Java than to ask you to learn a DSL you'll only use once**.

## 6. How Does It Compare to Mainstream Chinese Low-Code Platforms?

| Dimension | **DingTalk Yida / Tencent Weda** | **JianDaoYun / MingDaoYun** | **JeecgBoot / JNPF** | **Erupt** |
| --- | --- | --- | --- | --- |
| Paradigm | SaaS drag-and-drop canvas | SaaS drag-and-drop canvas | Online designer **generates** code | **Code is configuration** |
| Source of truth | Canvas internal data | Canvas internal data | Generated Java + Vue | **Git source code** |
| Private deployment | Some features require enterprise edition | Some features require enterprise edition | Self-hosted | **Self-hosted, single jar startup** |
| Business extension | Events + JS snippets | Form events + automation | Edit generated service/mapper | **Spring Bean + `DataProxy<T>`** |
| Dynamic behavior extension | Canvas event configuration | Built-in triggers | Modify generated code | **Handler interfaces (6+)** |
| Permission model | Platform built-in | Platform built-in | Built-in RBAC | **`@Power` + `PowerHandler`, injectable with business rules** |
| Diff / Code Review | Screenshots / version snapshots | Same | `git diff` generated code | **`git diff` the annotations themselves** |
| Cross-environment deployment | Application export/import | Same | jar + sync SQL | **`mvn package` one jar** |
| AI integration approach | "Edit components with natural language" | AI form fields | No unified solution yet | **`erupt-ai` treats LLM as a Bean** |
| Best for | Business, operations, lightweight IT | Business, SaaS departments | Java teams wanting a fast prototype | **Spring Boot teams / strong domain model / strict compliance** |

We're not saying canvas platforms are necessarily wrong — for a business department with no engineering team, "building a data-query App in the browser" is genuine productivity.

Code-generation platforms like JeecgBoot also have their place — **when all you care about is "getting it running fast" and you'll never go back to the canvas**, the generation approach is a reasonable scaffold.

But when a system has matured, the domain model has stabilized, and compliance and auditing are hard constraints, canvas-is-app hits the "expressiveness ceiling," and canvas-generates-code hits "bidirectional sync drift." **Both problems are unsolvable at first principles** — because both try to be "lightweight like a canvas and powerful like code" at the same time.

Erupt's contrarian bet is: **acknowledge that code itself is already the floor of low-code**. Annotations are already the configuration surface — compressing further would be dishonest. The rest is handed to IDE, Git, and Spring — a toolchain validated over 20 years.

## 7. From Annotation to Interface in 5 Minutes

The complete path from a blank Spring Boot project to an accessible admin page is already its own standalone guide:

**→ [Quick Start](/en/guide/quick-start)**

That page covers Maven dependencies, `application.yml`, the first `@Erupt` entity, the default login credentials, and Docker/K8S deployment.

Once that's running, come back to §4 (DataProxy) and §5 (Handler) in this article and you can wire in business extensions immediately — write `DataProxy<Demo>` to add business logic, write `FilterHandler` to add dynamic filtering, write `OperationHandler` to add custom action buttons. Every step is writing Java; every step is owned by your IDE, your Git, and your CI — not a single line goes back to a canvas.

---

:::info Join the Discussion
The core source code for this issue lives in [`erupt-annotation`](https://github.com/erupts/erupt/tree/master/erupt-annotation) and [`erupt-core/proxy`](https://github.com/erupts/erupt/tree/master/erupt-core/src/main/java/xyz/erupt/core/proxy).
If your team has lived through a real migration from canvas-based tools to the annotation approach (or the reverse), share your story in [GitHub Discussions](https://github.com/erupts/erupt/discussions) — community case studies get priority consideration for future topics.
:::
