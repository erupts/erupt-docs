---
title: "Annotation × Spring × Git: the most controllable low-code platform — there is no verb called 'generate'"
description: The Chinese low-code market — drag-and-drop canvases, on-platform Node.js editors — has always built for business operators. Erupt bets on the other lane, low-code for backend engineers. Annotations are the config surface, extension points are Spring beans, the source of truth lives in Git, and the framework never writes a file into your source tree — there is no verb called "generate". This is what "controllable" actually means in an engineering sense.
outline: deep
---

# Issue 05 · The most controllable low-code platform

> Ask any backend who has been writing Java for five years what they think of "low-code". You get the same three answers: loss of control, debugging hell, low ceiling. The complaint is never about code quantity — it's about where the code lives. Not in their IDE, not in Git, not behind a breakpoint. Erupt bets on the reverse lane: **low-code isn't writing less code; it's keeping every line under the engineer's control inside the IDE**, plus a default AI Harness — 17 LLM providers, an A2A protocol, cross-session memory, and `@AiToolbox` turning any Spring bean into an LLM tool in one annotation.
>
> _Published 2026-06-01 · ~10 min read_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt WeChat Official Account" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · Official Account</div>
    <div class="topic-mp-qr__title">Follow Erupt on WeChat</div>
    <p class="topic-mp-qr__desc">Topics drop here first, alongside release notes, source-code walk-throughs, and community case studies.</p>
  </div>
</div>

## 1. Why this issue

Every six months a "what do developers think of low-code?" thread surfaces in Chinese dev circles. The replies are almost a template:

- "I won't touch it. I can't trust the code the canvas generates."
- "Debugging means staring at platform logs. I can't set a breakpoint."
- "Anything beyond simple CRUD doesn't fit, and I end up cloning a Git repo and writing code anyway."
- "It's a tool for business ops, not engineers."

Stack these complaints up and they collapse into one question: **where does control live?**

Today's dominant low-code products travel two roads, **and neither hands control back to the engineer**:

1. **Canvas-as-app** — DingTalk Yida, Tencent Weda, Jiandao Cloud, Mingdao Cloud. Control lives inside the SaaS backend.
2. **Canvas + on-platform scripting** — JeecgBoot's online form designer + Online Code editor, Yida/Weda JS panels, Jiandao Cloud's smart assistant scripts, RuoYi's code generator. Some control returns to the engineer's IDE, but **the scripts you write and the code the canvas generated keep drifting apart** — fix a line in the IDE, then the next time you reach for the canvas you owe it a sync.

This issue is about a third road: **Erupt pushes "controllable" to the limit** — every line you write is plain Java, annotations are the configuration surface, extension points are Spring beans, debugging is an IDE breakpoint, versioning is Git. And **the AI Harness is a default dependency, not an add-on** — 17 LLM providers, A2A cross-agent, cross-session memory, and `@AiToolbox` to expose any bean to the LLM. **Installed and ready out of the box.**

::: tip A counterintuitive takeaway
"Low-code" has been almost contractually bound to "for business ops" in the Chinese market. Erupt argues for a different reading — **low-code for backend engineers**. The yardstick is not "business goes live with zero code" but "the engineer writes 80 lines instead of 800, and not one ounce of control over those 720 missing lines is lost."
:::

## 2. The three things developers actually dislike about low-code

Peel the gripes apart and three concrete axes fall out:

| Friction point | Canvas school<br/>(Yida / Weda / Jiandao) | Canvas + script school<br/>(JeecgBoot Online Code / Weda JS) | **Erupt** |
| --- | --- | --- | --- |
| Where control lives | SaaS canvas's internal DB | Split: half in generated code, half in canvas | **`.java` source in Git** |
| How to debug | Read backend logs | `console.log` + platform logs | **IDE breakpoint** |
| How to diff / review | Compare screenshots | `git diff` over machine-generated code (noisy) | **`git diff` over annotations** |
| Ceiling for complex logic | Form events + inline JS | Online IDE, files not on your box | **Any Spring bean** |
| CI/CD | Export the SaaS app bundle | jar + SQL sync | **Standard `mvn package` → jar** |
| Unit test | Effectively impossible | Pull the generated code locally to run | **JUnit + erupt-test (H2 in-memory)** |
| AI capabilities | Usually a separately-purchased "AI add-on" | Usually an external LangChain / Coze stitch | **erupt-ai is a default dependency** |

The last row is the second beat of this issue — **while everyone else is selling "low-code + AI add-on", Erupt bakes the AI Harness in**. Once you pull in the starter, 17 providers are already there, the extension points are already there. All you have to add is your API key.

## 3. What "controllable" actually means in engineering terms

When vendors say "controllable", they tend to translate it to "more visual configuration options" — more draggable fields, more configurable rules. That is not what engineers mean when they say controllable.

The engineer's version is very concrete:

1. **Every line of code is in my IDE** — `⌘ + B` jumps to definition, `⌘ + F12` lists all call sites.
2. **Every state lives in Git** — `git log` tells me who renamed which field on which day.
3. **Every branch is reviewable** — `git diff` produces something a human reads, not 1,200 lines of machine-generated Vue.
4. **Every error is breakpoint-able** — when something blows up I step through it, I don't go fishing in a runtime log on a remote box.
5. **Every extension point is a Spring bean** — familiar `@Service`, `@Autowired`, `@Transactional`, no proprietary "low-code runtime" abstraction in the way.

Erupt delivers all five. Here is the smallest example — a customer-management admin:

```java
@Erupt(
    name = "Customer",
    dataProxy = CustomerDataProxy.class,
    power = @Power(importable = true, export = true)
)
@Table(name = "t_customer")
@Entity
public class Customer extends BaseModel {

    @EruptField(
        views = @View(title = "Name"),
        edit = @Edit(title = "Name", notNull = true, search = @Search)
    )
    private String name;

    @EruptField(
        views = @View(title = "Tier"),
        edit = @Edit(title = "Tier", type = EditType.CHOICE,
            choiceType = @ChoiceType(vl = {
                @VL(value = "A", label = "Tier A"),
                @VL(value = "B", label = "Tier B")
            }))
    )
    private String tier;
}

@Service
@RequiredArgsConstructor
public class CustomerDataProxy implements DataProxy<Customer> {

    private final RiskClient risk;

    @Override
    public void beforeAdd(Customer model) {
        if (risk.isBlacklisted(model.getName())) {
            throw new EruptException("Customer is on the risk blacklist");
        }
    }
}
```

Count the points of control:
- Fields are Java fields → IDE autocomplete, rename refactor, find-usages all work natively.
- Validation lives in `beforeAdd` → set a breakpoint, mock `RiskClient` in a unit test, done.
- The risk call is a plain `@Autowired` dependency → first-class citizen of your existing Spring graph, no "low-code runtime calls an external service" black box.

::: info Don't gloss over this
**None of this code is framework-generated.** `Customer.java` was typed in your IDE. `CustomerDataProxy.java` was typed in your IDE. Erupt does not emit files into your source tree — unlike JeecgBoot / JNPF's "canvas-generates-code" path, **Erupt has no verb called "generate"**.
:::

## 4. The extension-point matrix: every concern has a Spring bean

Backend engineers don't push back on "writing less code". They push back on "being forced out of the extension model I already know". Erupt's extension points are all Spring beans / Java interfaces — there is no "configuration panel" layer in between:

| What you want to do | Implement this interface | Where it lives |
| --- | --- | --- |
| CRUD lifecycle | `DataProxy<T>` | `xyz.erupt.annotation.fun.DataProxy` |
| Custom query filter | `FilterHandler` | `xyz.erupt.annotation.fun.FilterHandler` |
| Row-level permission | `PowerHandler` | `xyz.erupt.annotation.fun.PowerHandler` |
| Row-level action button | `OperationHandler` | `xyz.erupt.annotation.fun.OperationHandler` |
| Dropdown options | `ChoiceFetchHandler` / `TagsFetchHandler` | `xyz.erupt.annotation.fun.*` |
| Autocomplete suggestions | `AutoCompleteHandler` | `xyz.erupt.annotation.fun.AutoCompleteHandler` |
| Type-safe queries | `eruptDao.lambdaQuery(...)` | `xyz.erupt.jpa.dao.EruptDao` |

Not one row says "drag X in the canvas". Every row says "implement interface Y". **For someone who has written Java, this table is the bean-registration model they already use every day — no room for pushback to grow.**

## 5. AI is not "plug in a ChatGPT extension" — it's a default capability

The second source of pushback: **in the Chinese market, low-code + AI is almost always an add-on** — first you have a platform, then you buy the AI module, then you fill in the LLM key, then you learn yet another vendor-specific Agent configuration DSL.

Erupt flips this. `erupt-ai` is a default dependency on par with `erupt-core`. Once you pull in the starter, the whole AI Harness is already there:

```text
erupt-ai/src/main/java/xyz/erupt/ai/llm/
├── ChatGpt.java       Claude.java       DeepSeek.java
├── Doubao.java        Fireworks.java    Gemini.java
├── GLM.java           Grok.java         MiniMax.java
├── Mimo.java          Mistral.java      Moonshot.java
├── Ollama.java        OpenAIAdapter.java
├── OpenRouter.java    Qwen.java         Together.java
```

Count them: **17 providers, all in the main repo**, not in a remote marketplace. The supporting infrastructure — `LlmCore`, `LLMService`, `AiToolboxManager`, `A2AAgentService` — is also in the main repo.

Now the part that matters — **how do you let the LLM call your own business beans?**

One annotation. Here is the full definition of `xyz.erupt.annotation.ai.AiToolbox`, all 12 lines:

```java
package xyz.erupt.annotation.ai;

import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Documented
@Inherited
public @interface AiToolbox {
}
```

A marker annotation. At runtime `AiToolboxManager` picks it up — the core of `xyz.erupt.ai.core.AiToolboxManager`, simple enough to skim:

```java
@Override
public void run(ApplicationArguments args) {
    applicationContext.getBeansWithAnnotation(AiToolbox.class).values().forEach(bean -> {
        Object target = AopProxyUtils.getSingletonTarget(bean);
        Object realBean = target != null ? target : bean;
        tools.add(realBean);
        for (Method method : realBean.getClass().getDeclaredMethods()) {
            if (method.isAnnotationPresent(Tool.class)) {
                aiMethodMap.put(method.getName(), method);
                aiMethodBeanMap.put(method.getName(), realBean);
            }
        }
    });
}
```

On boot, scan every Spring bean carrying `@AiToolbox`, register each method that also carries langchain4j's `@Tool`. That's it — **your business beans become LLM tools by themselves**.

Write a CRM lookup that the AI can call:

```java
@AiToolbox
@Service
@RequiredArgsConstructor
public class CustomerAiTools {

    private final EruptDao eruptDao;

    @Tool("Fuzzy-search customers by name and return up to 20 records")
    public List<Customer> searchCustomerByName(
            @P("name keyword") String keyword) {
        return eruptDao.lambdaQuery(Customer.class)
                .like(Customer::getName, keyword)
                .limit(20)
                .list();
    }

    @Tool("Move the customer onto the risk blacklist")
    public String blacklist(@P("customer id") Long customerId) {
        Customer c = eruptDao.lambdaQuery(Customer.class)
                .eq(Customer::getId, customerId).one();
        if (c == null) return "Customer not found";
        c.setTier("BLACKLIST");
        eruptDao.merge(c);
        return "Blacklisted: " + c.getName();
    }
}
```

From an engineer's seat: **this is 100% a plain Spring bean** — `@Service`, constructor injection (via Lombok's `@RequiredArgsConstructor`), `EruptDao` lambda queries. The only additions are the class-level `@AiToolbox` and the method-level `@Tool`. Next time a user tells the LLM "find the customer named John Smith", it calls `searchCustomerByName` on its own.

The Harness goes well beyond this. Lay Erupt's current state side by side:

| Capability | Erupt today | Chinese counterparts |
| --- | --- | --- |
| LLM providers built-in | 17 | Usually 1–3, the rest via plugins |
| Multi-agent (A2A) | `xyz.erupt.ai.service.A2AAgentService` built-in | Usually external LangGraph / Mastra |
| Cross-session memory | `xyz.erupt.ai.model.AiMemory` built-in | Roll-your-own Redis layer |
| MCP server | `xyz.erupt.ai.service.McpServerService` built-in | Almost never first-class |
| Expose a Spring bean as Tool | `@AiToolbox` + `@Tool`, one line | Usually requires writing schema JSON manually |
| Autonomous admin agent | `erupt-ai-claw` module | Usually a separate purchase |

One callout on `erupt-ai-claw` — this is the **autonomous admin agent** Erupt ships by default. It knows which `@Erupt` classes exist, which fields they have, which row-level operations they expose. It can read and modify data on the user's behalf, even hit system operations — all gated by `LLMRoleService`'s RBAC. We unpacked its internals in [Issue 01 · 50+ LLM × A2A × Memory](/en/topics/50-llm-a2a-memory).

## 6. Against JeecgBoot Online Code / DingTalk Yida JS / Tencent Weda JS

The defining problem of every "canvas + script" school is the same: **the script you wrote and the code the canvas generated keep drifting apart**. Side by side:

| Dimension | JeecgBoot Online Code | DingTalk Yida JS / Weda JS | Jiandao Cloud scripts | **Erupt** |
| --- | --- | --- | --- | --- |
| Where business logic lives | Platform's online IDE, Groovy / Java snippets | Form-event JS inside SaaS | Jiandao's embedded script editor | **Spring beans in your local IDE** |
| Debugging | Platform logs | Browser console | Platform logs | **Local IDE breakpoint** |
| Unit testing | Hard (script not in your repo) | Effectively impossible | Effectively impossible | **JUnit + erupt-test (H2)** |
| Reusing the Spring ecosystem | Partial | ❌ | ❌ | **Fully (Spring Boot 3.5)** |
| Package management | Platform-bundled jars | Platform allow-list | Platform allow-list | **Anything `pom.xml` allows** |
| Exposing AI tools | Needs the platform's AI module | Needs a "low-code + AI" add-on | Needs the smart-assistant pack | **One `@AiToolbox` annotation** |
| CI/CD | Export the application package | Import the application package | Import the application package | **Standard `mvn package`** |

The first row above is the one to look at — the three left columns hold the most-loved part of an engineer's craft (business logic) inside platform-owned editors. **They leave the engineer's workflow.** Erupt leaves nothing behind.

## 7. 5 minutes to a controllable, AI-ready admin

The standard Spring Boot + Erupt bootstrap path lives on its own page:

**→ [Quick Start](/en/guide/quick-start)**

That page covers Maven dependencies, application.yml, the first `@Erupt` entity, the default login, Docker / K8S deployment.

Once that's running, **the AI part this issue cares about** is two extra steps — pull `erupt-ai` in `pom.xml`, drop one LLM key in yml:

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-ai</artifactId>
</dependency>
```

Open the admin, go to **AI → LLM Config**, add a DeepSeek entry (or any other provider), paste the API key — the chat is live. Now drop a tool somewhere in your project:

```java
@AiToolbox
@Service
public class MyTools {
    @Tool("Tell me the current time")
    public String now() { return LocalDateTime.now().toString(); }
}
```

Restart, ask the AI "what time is it?" — it calls your method.

The whole flow **never leaves the IDE.**

## 8. Coming up next

Issue 06 follows this "controllable + AI by default" thread one more step — the three built-in toolkits inside `erupt-ai-claw`: `EruptMemoryTools`, `EruptModelTools`, `EruptSystemTools`. They let the LLM read Erupt metadata, manipulate Erupt models, even reach for the shell — and we'll show how `LLMRoleService`'s RBAC keeps that autonomy on a leash.

That issue answers a question people keep asking: **"Let an AI loose inside the admin — how do you keep it from breaking things?"**

---

:::info Discuss
Core source code for this issue:

- `xyz.erupt.annotation.fun.DataProxy` — business-lifecycle extension point
- `xyz.erupt.annotation.ai.AiToolbox` — marker that opts a Spring bean into the AI toolbox
- `xyz.erupt.ai.core.AiToolboxManager` — startup scanner that registers `@AiToolbox` beans
- `xyz.erupt.ai.core.LlmCore` / `xyz.erupt.ai.service.LLMService` — 17-provider registry with hot-swap

Drop a thread on [GitHub Discussions](https://github.com/erupts/erupt/discussions).
:::
