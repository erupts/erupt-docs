---
title: "ByteBuddy × JsonAnnotationProxy × @EruptDataProcessor: We Built a Designer, but It Compiles Into a Real @Erupt Class"
description: Nearly every online form designer stores the design as a JSON DSL and renders it at runtime through an interpreter. erupt-designer bets the opposite way — at runtime the design is compiled by ByteBuddy into a real @Erupt class, reusing the exact same pipeline as a hand-written entity. No restart, no generated code, no interpreter.
outline: deep
---

# Issue 07 · The Bytecode Designer

> In Issue 02 we explained "why we didn't build a drag-and-drop canvas." This issue we have to admit something: we built a designer — but it does not interpret JSON. At runtime the design is compiled by ByteBuddy into a real `@Erupt` class, then flows through the **exact same** pipeline as a hand-written entity: Gson serialization, reflection, validation, `DataProxy`, even the `@EruptFlow` approval workflow. No interpreter, no generated source files, no restart.
>
> _Published 2026-06-17 · ~10 min read_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt WeChat Official Account" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · Official Account</div>
    <div class="topic-mp-qr__title">Follow Erupt on WeChat</div>
    <p class="topic-mp-qr__desc">Each issue is published here first, along with release notes, source code walkthroughs, and community case studies.</p>
  </div>
</div>

[[toc]]

## 1. Why We Wrote This

An online form designer is a standard capability of Chinese low-code platforms. The online designers of Yida, Jiandaoyun, Mingdaoyun, JNPF, and JeecgBoot are backed by essentially the same mechanism:

> Whatever you drag out on the canvas gets serialized into a **JSON DSL** and stored in the platform database; at runtime, an **interpreter** reads that JSON, dynamically renders the page, assembles the SQL, and runs the validation.

This mechanism works, but it has a structural crack: **the design's "language" and the application's "language" are two separate things**. The design is JSON; the application is interpreted JSON — it can never take advantage of the host framework's capabilities that only recognize "real classes, real annotations, real fields" (ORM entity mapping, Bean Validation, type-oriented extension points). To hook into those capabilities, the interpreter either has to reinvent them itself, or simply gives up.

In Issue 02 we bet on "code is configuration" and argued why we don't build a canvas. But there is one kind of real requirement you cannot dodge: **operations staff need to add a table and configure a few fields themselves, without a new release**. This issue is about how we made that happen without betraying "code is configuration" —

> **A designer's output should not be interpreted JSON; it should be a real bytecode class.**

## 2. The Fundamental Divergence Among Three Kinds of "Online Designers"

| Dimension | **Interpreting designer**<br/>Yida / Jiandaoyun / Mingdaoyun | **Generating designer**<br/>JNPF / JeecgBoot | **Bytecode designer**<br/>**erupt-designer** |
| --- | --- | --- | --- |
| What the design is stored as | JSON DSL | JSON → template-generated `.java`/`.vue` | JSON draft (a draft only) |
| What the runtime gets | Interpreted JSON | Source files written to disk | **A real Class compiled at runtime** |
| Recompile / re-release needed? | No | **Yes** (compile and restart after generating) | **No** (ByteBuddy loads at runtime) |
| Can it reuse ORM / validation / reflection? | Interpreter reinvents them | Yes (already a real class) | **Yes (it is a real class to begin with)** |
| Can it hook host-framework extension points? | Limited by the interpreter | Yes, but you must edit the generated code | **Hook `DataProxy` / `@EruptFlow` directly** |
| Relationship between design and runtime artifact | The same JSON | Drift (edit the code and the canvas becomes stale) | **Draft → class, one-way compilation** |

The cost of the interpreting approach is "language isolation": JSON cannot use the capabilities of the class world. The cost of the generating approach is the "two-way drift" we covered in Issue 02: once the canvas generates code, the moment you go back to the IDE and edit it, the canvas is no longer trustworthy.

erupt-designer picks a third path: **the draft is JSON, but the runtime artifact is a bytecode class**. The draft is only responsible for "what it looks like"; once published, it is compiled into a class indistinguishable from a hand-written `@Erupt` entity — and from then on, none of the capabilities are reinvented by the designer; they are the ones the framework already has.

## 3. The Real Path a "Publish" Travels Through

erupt-designer is a standalone module (`erupt-designer`, landed in the root module in 2026-06). It exposes only 5 endpoints, all behind the `@EruptMenuAuth("DesignerEntity")` permission slot (source: `controller/EruptDesignerController.java`):

| Endpoint | Purpose |
| --- | --- |
| `POST /designer/preview` | Instantly turn the current draft into an `EruptBuildModel` preview, without persisting |
| `POST /designer/publish/{className}` | Publish: compile into a class + register into the runtime |
| `GET /designer/config/{className}` | Retrieve the configuration of a given design |
| `GET /designer/java-code` | Reverse-export the draft into equivalent hand-written `@Erupt` Java source |
| `GET /designer/erupts` | List registered models (name + label key-value pairs) |

The key number is **0**: publishing a new model takes **0 restarts, 0 source files written to disk, 0 interpreters**. The existence of the `java-code` endpoint says the most about the design philosophy — the designer can at any time turn itself "back into its original form" as a chunk of `@Erupt` source you can paste into an IDE and compile. The designer is not a separate world; it is merely a visual entry point into the same code.

## 4. Key Capability One: ByteBuddy Compiles the Draft Into a Real-Field Class

On publish, `DesignerClassFactory.build(form)` uses ByteBuddy to build a subclass of `BaseModel` on the spot, turning the field definitions in the draft into **real Java fields**, and stamping on the `@EruptDataProcessor` routing annotation:

```java
public static Class<?> build(DesignerForm form) {
    DynamicType.Builder<?> builder = new ByteBuddy()
            .subclass(BaseModel.class)
            .name(PKG + form.getClassName())
            .annotateType(AnnotationDescription.Builder.ofType(EruptDataProcessor.class)
                    .define("value", DATA_PROCESSOR).build());
    // ERUPT_FLOW is null when erupt-flow is absent; skip without a hard dependency
    if (null != ERUPT_FLOW) {
        builder = builder.annotateType(AnnotationDescription.Builder.ofType(ERUPT_FLOW).build());
    }
    for (DesignerForm.DesignerField field : form.getFields()) {
        builder = builder.defineField(field.getFieldName(), javaType(field), Visibility.PRIVATE);
    }
    return builder.make()
            .load(DesignerClassFactory.class.getClassLoader(), ClassLoadingStrategy.Default.WRAPPER)
            .getLoaded();
}
```

Source: `erupt-designer/src/main/java/xyz/erupt/designer/service/DesignerClassFactory.java`

Three design choices are worth unpacking:

- **The fields are real fields, and the types are real types**. `javaType()` maps the edit type back to a Java type — `NUMBER` becomes `Integer/Long/Double/BigDecimal` based on `fieldType`, `DATE` becomes `Date`, `REFERENCE_TABLE/COMBINE` becomes `Map`, and `TAB_TABLE_ADD` becomes `List`. Because the fields are real, the Gson conversion, reflection read/write, and Bean validation pipeline all work **without any special-casing**.
- **The `WRAPPER` strategy + a dedicated classloader**. Every publish loads into a brand-new classloader; re-publishing a class of the same name simply produces a new class, and the old class naturally becomes garbage to be collected — this is how the cost of "change a field without restarting" is amortized.
- **`@EruptFlow` is a soft dependency**. When erupt-flow is on the classpath, the annotation is baked into the bytecode, and the approval workflow can recognize this designed model via reflection; when it is not, the whole segment is skipped, so it is not a hard dependency.

:::tip A counterintuitive takeaway
Most designers interpret "dynamic" as "don't compile, use an interpreter." erupt-designer interprets "dynamic" as "**compile, but compile at runtime**" — what is dynamic is the timing of compilation, not the manner of execution. The manner of execution is always "run a real class," which is why it can reuse the entire framework at zero cost.
:::

## 5. Key Capability Two: JsonAnnotationProxy Disguises JSON as Real Annotations

The bytecode class only carries fields, not annotations like `@Erupt`/`@EruptField` — the content of the annotations still lives in the draft JSON. Here is the second key piece: at runtime, `JsonAnnotationProxy` disguises the JSON as a **real annotation instance**.

Its contract is clean: members that appear in the draft JSON override the template annotation, and members that do not appear **fall through to the template's default value**; nested annotations are proxied recursively, and annotation arrays expand using the template's first element as the prototype.

```java
public static <A extends Annotation> A proxy(A annotation, JsonObject json) {
    if (null == json) return annotation;
    return EruptProxyUtil.newProxy(annotation, invocation -> {
        JsonElement je = json.get(invocation.getMethod().getName());
        if (null == je || je.isJsonNull()) return invocation.proceed(); // fall through to template default
        return toValue(invocation.getMethod().getReturnType(), je, invocation);
    });
}
```

Source: `erupt-designer/src/main/java/xyz/erupt/designer/proxy/JsonAnnotationProxy.java`

So what `EruptDesignerService.toEruptModel()` does is stitch those two halves together: the class built by ByteBuddy provides the field carrier, and `JsonAnnotationProxy` disguises the draft as annotations and attaches them to the `EruptModel` — the resulting `EruptModel` is the same kind of thing you would get from scanning a hand-written `@Erupt` class.

The last piece of the puzzle is `@EruptDataProcessor(DATA_PROCESSOR)`: it routes this dynamic class's CRUD to the designer's own data service (instead of a JPA entity table), so a designed model can store and retrieve data even without a corresponding ORM entity. And the designer's **own** metadata management uses precisely the framework's standard extension points — `DesignerEntityDataProxy implements DataProxy<DesignerEntity>`, which validates class-name uniqueness in `beforeAdd`, and calls `EruptCoreService.unregisterErupt(...)` in `afterDelete` to deregister the runtime model. The designer manages the framework using the framework.

## 6. How Does It Compare to Yida / Jiandaoyun / JNPF / JeecgBoot?

| Dimension | **Yida / Jiandaoyun / Mingdaoyun** | **JNPF / JeecgBoot online designer** | **erupt-designer** |
| --- | --- | --- | --- |
| Form of the runtime artifact | Interpreted JSON DSL | Generated `.java`/`.vue` written to disk | **Bytecode class compiled at runtime** |
| Does adding a field require a restart? | No | **Yes** (regenerate + compile) | **No** |
| Design vs. runtime artifact | The same JSON | Prone to drift (edit in the IDE and it goes stale) | **Draft → class, one-way compilation, source can be reverse-exported** |
| Reuse host ORM / validation | Interpreter reinvents them | Yes (already a real class) | **Direct reuse, 0 special-casing** |
| Hooking business extension points | Platform events + scripts | Edit the generated code | **`DataProxy` / `FilterHandler` / `@EruptFlow`** |
| Approval-workflow integration | Platform built-in | Built-in + edit the code | **Auto-recognized whenever erupt-flow is on the classpath** |
| Self-hosting | Some require the enterprise edition | Self-deployed | **Self-deployed, a single jar** |
| Can the design be code-reviewed? | Screenshots / version snapshots | Diff the generated code | **Can export an equivalent `@Erupt` source diff** |

We do not deny the value of interpreting designers — for a business unit with no engineering team, dragging out an app in the browser is real productivity. The generating approach also has its place, provided you never go back to the forge.

erupt-designer's bet differs on just one point: **it refuses to introduce a "second language."** The interpreting approach introduces a JSON DSL; the generating approach introduces "generated code," a drift-prone intermediate state. erupt-designer makes the design collapse, the instant it is published, into something the framework already recognizes — an `@Erupt` class. From then on, it does not have to rewrite a single line of the framework's "class"-oriented capabilities.

## 7. Get Started in 5 Minutes

Going from an empty Spring Boot project to an accessible admin page — the common startup flow now has its own page:

**→ [Quick Deployment / Quick Start](/en/guide/quick-start)**

That page covers the Maven dependencies, `application.yml`, your first `@Erupt` entity, the default login account, and Docker / K8S deployment.

Once that's running, add the designer module and a "Model Design" entry appears in the admin menu:

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-designer</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

Enter the designer, drag out a few fields, and clicking "Preview" hits `POST /designer/preview` (no persistence); clicking "Publish" hits `POST /designer/publish/{className}` — as soon as it is published, the model appears in the menu, **with no restart at any point**. Want to promote it into a formal entity? Click export, and `GET /designer/java-code` hands you back a chunk of `@Erupt` source you can paste straight into an IDE and compile. At that point the designer bows out, gracefully, and returns to the "code is configuration" main road from Issue 02.

---

:::info Join the Discussion
The core source code for this issue lives in [`erupt-designer`](https://github.com/erupts/erupt/tree/master/erupt-designer) — focus on `service/DesignerClassFactory.java`, `service/EruptDesignerService.java`, and `proxy/JsonAnnotationProxy.java`.
If your team has walked a real migration path between an "online designer" and "hand-written entities," feel free to post in [GitHub Discussions](https://github.com/erupts/erupt/discussions); community cases get priority in future topic selection.
:::
