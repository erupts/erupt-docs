---
title: "What You Write in an Annotation Isn't a String — It's Code With Syntax"
description: The favorite rebuttal against annotation-based low-code is "annotations just turn SQL into unhighlighted dumb strings." Erupt bets the reverse — it uses JetBrains @Language to inject 10 embedded languages into its own annotation attributes, so a single sql="..." gets highlighting, completion, and error checking in IntelliJ; @Comment then makes the same attribute self-describing for both humans and AI.
outline: deep
---

# Issue 08 · What You Write in an Annotation Isn't a String — It's Code With Syntax

> The people who dislike annotation-based low-code have one line that stings the most: **"You cram SQL, templates, and scripts into annotation strings — no highlighting, no completion, and a typo won't even fail compilation. Isn't this just going back to Notepad?"**
> This issue takes that line apart: Erupt injects **10 embedded languages** into its own annotation attributes, so that `sql = "..."` line has syntax highlighting, completion, and real-time error checking in IntelliJ; `@Comment` then makes the same attribute readable by both humans and AI.
>
> _Published 2026-07-01 · ~9 min read_

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

In Issue 02 we explained "why we didn't build a drag-and-drop canvas," and in Issue 05 we argued "annotations are the config." Every time we finish, the same rebuttal floats up in the comments —

> "A drag-and-drop canvas at least gives you syntax highlighting and completion in its online script editor. You write a blob of `sql = "sum(amount)"` in an annotation, and a wrong field name only blows up at runtime. The developer experience of annotation-based low-code is a trip back to Notepad."

That rebuttal **holds for most annotation frameworks**. The type of a Java annotation attribute is `String`, and the compiler only sees it as a stretch of characters — whether it's SQL, a Velocity template, or markdown inside, `javac` doesn't know, and the IDE doesn't know by default. So every "embedded snippet" you write in an annotation is running around naked.

This issue is about our answer to that rebuttal — and it isn't backed by a homegrown plugin or a DSL compiler. **It's backed by an annotation JetBrains put out long ago that most people never picked up, `@Language`, plus Erupt's own `@Comment`.**

The contrarian thesis of this piece is simple:

> **The string in an annotation attribute should not be treated as a dumb string. It's a canvas the IDE can inject a sub-language grammar into and treat as a sub-language editor — and that canvas lives inside a real IDE, giving you refactoring, git, and the debugger for free.**

## 2. The Three Identities of an Attribute String

Let's frame the paradigm first. In Erupt, a string on an annotation attribute carries three identities at once:

| Identity | For whom | Powered by |
| --- | --- | --- |
| **Config value** | The framework at runtime | The Java annotation itself, read via Gson reflection |
| **Embedded-language editing surface** | The engineer writing code | `@Language(...)` — the IDE injects the sub-language grammar |
| **Self-describing docs / AI context** | Humans (IDE hover) + machines (LLM) | `@Comment(...)` + the `prompt()` attribute |

The same `sql = "sum(amount)"` is an aggregate expression at runtime, a block of SQL editor while coding, and a line readable by both humans and models while reading. All three identities share one source of truth — **the annotation string itself** — with no copies and no derivations.

This is exactly Erupt's consistent bet, extended into the developer-experience layer: **metadata is the single source of truth**. Issue 03 argued metadata = UI = API = LLM Tool; this issue argues that even "what language is this string, and who is it for" is pressed into the metadata too.

## 3. 10 Embedded Languages Injected Into Annotations

Start with the countable facts. Tally every `@Language(...)` target language across `erupt-annotation` in the main repo:

| Injected language | Occurrences | Typical attribute |
| --- | --- | --- |
| `hql` | 21 | `@Search` filters, `@Edit` ordering, `Join.on` conditions |
| `java` | 14 | `datasource` (`private String ...;`), `drillFields` (`Object get(){...}`) |
| `markdown` | 6 | Every `prompt()` (AI prompt) |
| `sql` | 5 | `@Measure.sql` aggregates, `Join.type` |
| `javascript` | 3 | Frontend interaction scripts |
| `VTL` (Velocity) | 2 | `@EruptCube.sql` / `@Dimension.sql` templates |
| `html` | 2 | Icon class (`<i class="...">`) |
| `file-reference` | 2 | Resource paths |
| `css` | 1 | Custom styles |
| `spel` | 1 | Framework-internal annotation serialization (not exposed to users) |

That's **10 sub-languages** across 29 attributes; the accompanying `@Comment` appears **73 times** in the main repo.

:::tip A counterintuitive takeaway
Most frameworks treat "you can write expressions in annotations" as a selling point, yet leave "what language is this expression" to the engineer's memory. Erupt turns the language kind itself into metadata — `javac` doesn't care, but the IDE cares, and the IDE is what the engineer faces all day.
:::

## 4. Capability One: `@Language` + prefix/suffix, So Even "Half a SQL Statement" Gets Highlighted

`@Language` is an annotation JetBrains ships in `org.intellij.lang.annotations`. Put it on a `String` attribute, and IntelliJ treats that string as the corresponding language: highlighting, completion, error checking, even formatting.

The hard part: what you write in an annotation is often not a **complete** statement but a **fragment**. For example, the filter expression of `@Search` — you only write `status = 'DONE'`, which is not valid SQL. How is the IDE supposed to highlight it?

Erupt's answer is `prefix` / `suffix` — **tell the IDE to splice a chunk before and after the fragment to make a valid statement, then parse that**. Look at the real source of `Measure` in the main repo:

```java
public @interface Measure {

    String title();

    @Comment("Aggregate SQL expression, e.g. sum(amount)")
    @Language(value = "sql", prefix = "select ")
    String sql();

    @Comment("Dimension fields exposed when drilling down")
    @Language(value = "java", prefix = "Object get() { ", suffix = ";}")
    String[] drillFields() default {};

    @Comment("Extra filter applied when drilling down")
    @Language(value = "sql", prefix = "select * from x where ")
    String drillFilter() default "";
}
```

Three attributes, three splicing schemes:

- `sql()` prefixed with `select ` — you write `sum(amount)`, and the IDE validates it as `select sum(amount)`, checking the aggregate function;
- `drillFields()` prefixed with `Object get() { ` and suffixed with `;}` — your drill-down fields are completed as a **Java expression**;
- `drillFilter()` prefixed with `select * from x where ` — your drill-down filter fragment is highlighted as a WHERE condition.

It's even more typical in `@Search` (`erupt-annotation/.../sub_field/Edit.java`):

```java
@Comment("Sort expression; applicable when the field type is an ORM entity object")
@Language(value = "sql", prefix = "select * from t order by")
String sort() default "";
```

Full package names: `org.intellij.lang.annotations.Language` + `xyz.erupt.annotation.config.Comment`. Neither annotation takes part in runtime logic — they only speak to the IDE **at the moment of coding**. What the runtime reads is still that clean string.

This is the frontal answer to the rebuttal in Section 1: **the SQL fragment in an annotation isn't running around naked — it gets spliced front and back into a valid statement and fed to IntelliJ's SQL engine. A wrong field name or a misspelled function shows a red squiggle on the spot — no waiting for runtime.**

## 5. Capability Two: `@Comment`, Making the Same Attribute Self-Describing for Humans and AI

Highlighting solves "is it written correctly"; `@Comment` solves "what is this for." It's Erupt's own annotation, applicable to types, fields, methods, and parameters, and it carries a language enum:

```java
@Repeatable(Comments.class)
@Target({METHOD, TYPE, FIELD, TYPE_PARAMETER, PARAMETER})
public @interface Comment {
    String value();
    Language language() default Language.ZH;
    enum Language { ZH, EN }
}
```

Inside an annotation declaration, `@Comment` is the hover text for **the next person who writes this annotation**; on the AI side, Erupt opens a more direct channel — every data-facing annotation carries a `prompt()`, itself injected with `@Language("markdown")`:

```java
@Comment("AI prompt")
@Language("markdown")
String prompt() default "";
```

Look at where it sits on `@EruptCube`, and it all comes together:

```java
@EruptCube(
        name = "Work Item Statistics",
        sql = """
                select wi.type    as type,
                       wi.status  as status,
                       u.name     as assignee_name
                from e_project_work_item wi
                     left join e_upms_user u on wi.assignee_id = u.id
                """
)
public class WorkItemStatsCube {
    @Dimension(title = "Assignee", sql = "assignee_name")
    private String assigneeName;

    @Measure(title = "Overdue Count",
             sql = "sum(case when status <> 'DONE' and due_date < current_date then 1 else 0 end)")
    private Long overdueCount;
}
```

In this code: that multi-line `sql` is a Velocity template injected via `@Language("VTL")` (the IDE recognizes the `${...}` placeholders); `@Measure.sql` is an aggregate fragment highlighted as SQL; each `prompt` is AI context edited as markdown. The "three eyes an LLM grows next to a cube" from Issue 04 draw their metadata nourishment from exactly these `@Comment`s and `prompt`s — **the field descriptions the LLM reads are the same ones you see on hover in the IDE**.

One annotation, three consumers each taking what they need, with no second copy to maintain.

## 6. How Does It Compare to Yida / Jiandaoyun / JeecgBoot?

The canvas camp treats "our online script editor has highlighting" as an advantage over the code camp. Let's lay this comparison out:

| Dimension | Yida / Jiandaoyun / Mingdaoyun (online scripts) | JeecgBoot (online dev + code generation) | Erupt (`@Language` injected into annotations) |
| --- | --- | --- | --- |
| Where expressions are written | Platform's embedded script box | Online config → generated service | **Inside the annotation attributes of real source** |
| Syntax highlighting | Platform's homegrown editor, limited languages | Only in the IDE after generation | **Native IntelliJ, 10 sub-languages** |
| Fragment validation | At runtime / on save | At compile time after generation | **Instant while coding, prefix/suffix splice to a valid statement** |
| Refactoring (rename a field) | Manual global search | Regenerate, prone to drift | **IDE Rename follows along** |
| Version control | Platform DB stores JSON | Generated artifacts in git, config not | **Annotations are source, naturally in git** |
| Breakpoint debugging | None | The generated service is debuggable | **Same as ordinary Java** |
| Context for AI | No standard channel | None | **`@Comment` + `prompt()`, same source** |

We're not saying the canvas camp's online editor is bad — for business operators, and for the "edit without installing an IDE" scenario, their home turf is solid. But for **backend engineers**, "highlighting" was never the canvas's privilege; it's the IDE's capability. Write the logic back into real source, and you get not just highlighting but the entire toolchain the IDE has accumulated over twenty years. All `@Language` does is wire that capability onto annotation strings — without writing a single line of homegrown editor.

## 7. 5 Minutes From Annotation to UI

This developer experience needs no extra dependency — as long as you open an Erupt project in IntelliJ, `@Language` injection kicks in automatically. To get your first `@Erupt` entity running and see the admin UI, the full flow is its own page:

**→ [Quick Start](/en/guide/quick-start)**

That page covers Maven dependencies, `application.yml`, the first `@Erupt` entity, the default login account, and Docker / K8S deployment.

Once it's running, come back here: open any `@Search` or `@EruptCube`, drop the cursor into `sql = "..."`, hit `Alt+Enter`, and check the "Edit SQL Fragment" IntelliJ pops up — that's the canvas from Sections 4 and 5.

---

:::info Join the discussion
The core source for this issue: `xyz.erupt.annotation.cube.Measure`, `xyz.erupt.annotation.sub_field.Edit`, `xyz.erupt.annotation.config.Comment`, and JetBrains' `org.intellij.lang.annotations.Language`. Come post on [GitHub Discussions](https://github.com/erupts/erupt/discussions) and tell us which sub-languages you've injected into your annotations.
:::
