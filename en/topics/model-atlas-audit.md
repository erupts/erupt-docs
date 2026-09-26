---
title: "Model Atlas as a Static Audit"
description: "Low-code platforms draw model relationship diagrams mostly to \"look professional.\" erupt-atlas bets the reverse — the diagram is a by-product; the real output is a static audit of the runtime registry: circular dependencies, shared physical tables, orphan models, models built but never bound to a menu, and permissions declared but never grown into buttons."
outline: deep
---

# Issue 09 · Model Atlas as a Static Audit

> The smoother a low-code platform is to use, the faster models pile up. Three months in, nobody can say how many tables the system actually has, who references whom, or which models were created and never opened again.
> This issue is about `erupt-atlas`: the model relationship diagram it draws is really a by-product — **the real output is an audit report** — and the only reason it can be generated with zero configuration is that Erupt has exactly one source of truth from start to finish: the runtime `@Erupt` registry.
>
> _Published 2026-09-15 · ~10 min read_

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

Low-code's pitch is "a new model takes five minutes." That's true, and so is the cost: **once modeling drops to five minutes, nobody thinks it through before building.**

Here's the real-world state we've seen: an admin system two years in production, with three hundred-plus `@Erupt` classes. Ask the team a few questions —

- Which models reference other models, and which are completely isolated?
- Are there two models quietly mapped to the same physical table?
- How many models were built but never bound to a menu, so nobody can ever open them?
- Is there a cycle where A references B, B references C, and C references A again?

Nobody can answer. Not because the team is unprofessional, but because **these facts aren't stored anywhere**.

Now look at how the domestic alternatives handle it:

- **JeecgBoot / RuoYi** take the code-generation route. The moment you generate, the model definition flows out of the tool into `src/main/java`, and from then on the tool has no idea what you've changed it into. For a global view, you fall back on an ER diagram or `SHOW TABLES` — and that's the **database's** view, not the **business model's** view. It can't see who references whom inside a form.
- **Jiandaoyun / Mingdao** have a global view, but the form definitions live inside a SaaS black box. The relationships are a picture the product renders for you, not data you can read, query, or feed into CI.

The contrarian thesis of this piece:

> **A model relationship diagram shouldn't be a decorative picture for people to "look at relationships." It should be the output of an audit — the diagram merely draws the audit result.**
>
> **And whether a low-code framework can pull this off comes down to one plain question: does its model definition have a single source of truth at runtime?**

## 2. Two Ways of "Seeing Yourself"

| Dimension | Document-style / generation-style (JeecgBoot, RuoYi) | Registry-style (Erupt) |
| --- | --- | --- |
| Where the truth lives | Generated source + a hand-maintained ER diagram | The runtime `EruptCoreService` registry |
| Who updates it | People. Change a model, remember to update the diagram | There is no "update" action; rebuilt on the spot per request |
| Models added at runtime | Invisible (models published by the designer aren't in the ER diagram) | Appear automatically, no restart |
| Where relationships come from | Database foreign keys / hand-drawn | `edit().type()` on `@EruptField` |
| Can it be audited | Only by eyeballing | Building the diagram is itself the audit |

The difference isn't "who draws prettier." It's **whether the diagram can go stale**. A hand-maintained diagram will go stale, guaranteed; a diagram rebuilt from the registry on the spot has no such state — it's either correct or the service isn't up.

Inside `EruptCoreService`, two static fields guard this truth:

```java
public class EruptCoreService {

    private static final Map<String, EruptModel> ERUPTS = new LinkedCaseInsensitiveMap<>();

    // Models registered after startup: erupt-designer publishes into here
    private static final Set<String> RUNTIME_ERUPTS = new HashSet<>();

    public static List<EruptModel> getErupts() { /* ... */ }

    public static boolean isRuntimeErupt(String eruptName) {
        return RUNTIME_ERUPTS.contains(eruptName.toLowerCase());
    }
}
```

The `RUNTIME_ERUPTS` line is the key. [Issue 07](/en/topics/bytecode-designer) covered how erupt-designer compiles a design draft into a real `@Erupt` class with ByteBuddy — and those classes register into the very same `ERUPTS`. So **models published by the designer, and erupt-flow's form models, are first-class citizens in the atlas alongside hand-written entities**, with no adapter code needed on the atlas side.

## 3. How Many Facts One `build()` Sweeps Up

The entire public contract of `erupt-atlas` is one record, readable in 30 lines:

```java
public record AtlasView(List<Node> nodes, List<Edge> edges, Audit audit, Map<String, String> text) {

    /** kind: "erupt" (@Erupt model), "cube" (@EruptCube), "remote" (served by an erupt-cloud node) */
    public record Node(String id, String name, String label, String source, String kind,
                       boolean runtime, int fields, int dimensions, int measures, String table) {
    }

    /** kind: reference | tab | embed | drill | operation | cubeOf | join | table */
    public record Edge(String from, String to, String label, String kind) {
    }

    public record Audit(List<List<String>> cycles, List<SharedTable> sharedTables,
                        List<String> orphans, List<String> unpublished) {
    }

    public record SharedTable(String table, List<String> models) {
    }
}
```

The countable part:

- **3 node kinds**: `@Erupt` models, `@EruptCube` analytical models, and models served by erupt-cloud remote nodes.
- **8 edge kinds**: `reference` / `tab` / `embed` / `drill` / `operation` / `cubeOf` / `join` / `table`. The first three are real data coupling; the other five are navigation and aggregation.
- **4 audit items**: cycles, shared tables, orphans, unpublished.
- **A 5th item on its own endpoint**: permission drift (`/power`, see Section 5).

Two more fields deserve a word. `Node.source` collapses a class's package name into a module name — `xyz.erupt.upms.model.EruptUser` lands under `upms`, while a business package like `com.acme.crm.Customer` is kept as-is. So the diagram groups by module naturally, without any configuration:

```java
private static String source(Class<?> clazz) {
    if (null == clazz || null == clazz.getPackage()) return null;
    String pack = clazz.getPackage().getName();
    if (!pack.startsWith(PACKAGE_PREFIX)) return pack;
    String tail = pack.substring(PACKAGE_PREFIX.length());
    int dot = tail.indexOf('.');
    return dot > 0 ? tail.substring(0, dot) : tail;
}
```

`Node.runtime` comes straight from `EruptCoreService.isRuntimeErupt(...)` — on the diagram you can tell at a glance which models were "hard-coded at compile time" and which were "published by the designer at runtime."

## 4. Relationships Are Inferred From Annotations, Not Foreign Keys

This is the most fundamental split from ER diagram tools. A database foreign key describes a **storage constraint**; a business-level "reference" is far broader than a foreign key — a `TAB_TABLE_REFER` field is a reference, a `COMBINE` embed is a reference too, yet neither may have a foreign key in the database at all.

`erupt-atlas` reads the edit type on `@EruptField` directly:

```java
private static String fieldKind(EruptFieldModel fieldModel) {
    return switch (fieldModel.getEruptField().edit().type()) {
        case TAB_TREE, TAB_TABLE_ADD, TAB_TABLE_REFER, CHECKBOX -> "tab";
        case COMBINE, MULTI_FORM -> "embed";
        default -> "reference";
    };
}
```

A three-line switch covers every inter-model field type Erupt has. Layer on `@Drill`, `@RowOperation`, and `@EruptCube`'s `@Join`, and all eight edge kinds are accounted for.

:::tip A counterintuitive takeaway
When detecting "cycles," `erupt-atlas` **recognizes only three edge kinds**:

```java
private static final Set<String> STRUCTURAL = Set.of("reference", "tab", "embed");
```

`drill` and `operation` are excluded. The reasoning is in the source comment: *a drill or a row operation pointing back is navigation, not coupling* — drilling back to the parent model is product design, not architectural debt.

Most dependency-analysis tools produce false positives right here, because they only check "is there a line," not **whether the line is data or navigation**. Erupt can tell them apart because the edge type comes from annotation semantics, not from the act of drawing a line.
:::

Cycle detection uses Tarjan's strongly connected components; results are sorted by cycle size in descending order, largest cycle first — fix the one that hurts most first.

## 5. The Five Things the Diagram Doesn't Say Out Loud

This section is the thesis of the piece. The four items in `Audit` plus the fifth on the `/power` endpoint — not one of them is something the concept of a "relationship diagram" naturally includes.

**1. Cycles** — The strongly connected components Tarjan finds. A references B, B references C, C references A: none of the three models can be deleted or migrated independently.

**2. Shared physical tables (sharedTables)** — Two or more `@Erupt` classes with `@Table` pointing at the same table. This is usually intentional (read/write-split views, windows with different permissions), but it means **a validation added on A is bypassed by writes coming in through B**.

**3. Orphans** — Models no relationship edge touches:

```java
// Models no relation touches: usually logs and registries, sometimes something forgotten
private static List<String> orphans(List<AtlasView.Node> nodes, Collection<AtlasView.Edge> edges) {
    Set<String> touched = new HashSet<>();
    for (AtlasView.Edge edge : edges) {
        touched.add(edge.from());
        touched.add(edge.to());
    }
    List<String> list = new ArrayList<>();
    for (AtlasView.Node node : nodes) {
        if ("erupt".equals(node.kind()) && !touched.contains(node.id())) list.add(node.name());
    }
    return list;
}
```

**4. Unpublished** — Models with an entity table but no menu in the menu tree pointing at them. This item best exposes the hangover from "a model in five minutes":

```java
/**
 * Entity-backed models with no menu bound to them. A sub-table or a popup form legitimately
 * has no menu, so this is a candidate list to read, not a defect list to clear.
 */
private List<String> unpublished(List<AtlasView.Node> nodes) {
    EruptDao eruptDao = eruptDaoProvider.getIfAvailable();
    if (null == eruptDao) return new ArrayList<>();
    Set<String> bound = new LinkedHashSet<>();
    for (EruptMenu menu : eruptDao.lambdaQuery(EruptMenu.class).list()) {
        if (null != menu.getValue()) bound.add(menu.getValue().toLowerCase());
    }
    List<String> list = new ArrayList<>();
    for (AtlasView.Node node : nodes) {
        if (!"erupt".equals(node.kind()) || null == node.table()) continue;
        if (!bound.contains(node.name().toLowerCase())) list.add(node.name());
    }
    return list;
}
```

Note `eruptDaoProvider.getIfAvailable()`: an application running without `erupt-data-jpa` has no menu table, so this item is skipped silently rather than throwing. Note the Javadoc too — **this is a candidate list, not a defect list**. Sub-tables and popup forms aren't supposed to have menus. The tool supplies facts; the judgment stays with people.

**5. Permission drift (`/power`)** — A separate endpoint, because it's the most hidden item of all:

```java
/**
 * What a model declares it can do, next to what the menu tree actually offers. The two drift:
 * function buttons are written once, when the menu is created, from the power flags as they stood
 * then — a flag flipped afterwards never grows a button, and the permission behind it is never
 * granted to anyone.
 */
public record PowerRow(String model, String label, String module, String menuType,
                       List<String> power, List<String> buttons, String powerHandler) {
}
```

In plain terms: **you flipped `export = true` in `@Power`, but the menu was created six months ago, when it was still `false`. Function buttons are written exactly once, at menu creation, and never grow on their own afterwards.** So the permission declaration and the range of permissions that can actually be granted quietly fork — code review won't catch it, tests won't flag it, and it only surfaces when a user asks "why don't I have an export button here?"

`PowerRow` lays both sides out side by side (`power` is what the annotation declares, `buttons` is what the menu tree actually carries), so the difference is visible at a glance. It also lists `powerHandler`: if it isn't the default `PowerHandler`, this model's permissions have been taken over by custom logic (see [@Power](/en/annotation/power)).

## 6. How Does It Compare to JeecgBoot / RuoYi / Jiandaoyun?

| Dimension | JeecgBoot / RuoYi | Jiandaoyun / Mingdao | Erupt (erupt-atlas) |
| --- | --- | --- | --- |
| Global model view | None built in; needs an external ER tool | Yes, rendered inside the product | Yes, `/erupt-api/atlas/view` returns JSON |
| Can the view go stale | Yes (source evolves on its own after generation) | No | No (rebuilt per request) |
| Source of relationships | Database foreign keys | Platform-internal form associations | `@EruptField` edit-type semantics |
| Distinguishes data coupling / navigation | No | No | Yes (only the three `STRUCTURAL` kinds count as coupling) |
| Circular dependency detection | None | None | Tarjan SCC, sorted by cycle length descending |
| Shared physical table detection | None | N/A (you don't define tables) | Yes |
| "Built but never bound to a menu" detection | None | N/A | Yes |
| Permission declaration vs. actual buttons | None | None | Yes (`/power`) |
| Runtime-added models enter the diagram | No | N/A | Yes (designer / flow publish shows up immediately) |
| Can the data flow out as a CI gate | Write your own parser | No (SaaS black box) | Yes, three REST endpoints return structured JSON |

The last row is the one we care about most. `AtlasView` is a record; serialized, it's a clean piece of JSON — **you can pull `/atlas/view` once in CI and assert that `audit.cycles` is empty and `audit.sharedTables` doesn't exceed a whitelist**. A diagram people can look at and machines can assert on: that's the point of making it an audit rather than an illustration.

:::info Permission boundary
All three endpoints carry `@EruptMenuAuth(AtlasConstant.MENU_ATLAS)` — the atlas itself is system-structure intelligence, so by default only roles granted the "Model Atlas" menu can read it. This follows the same line of thinking as [Issue 06](/en/topics/security-defaults): security is the annotation default.
:::

## 7. Up and Running in 5 Minutes

From an empty Spring Boot project to a reachable admin page, the full flow is its own page:

**→ [Quick Start](/en/guide/quick-start)**

That page covers Maven dependencies, application.yml, the first `@Erupt` entity, the default login account, and Docker / K8S deployment.

Once it's running, one dependency gives you the atlas (minimum version **2.2.0**):

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-atlas</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

No configuration options, nothing persisted to the database. Once added, a **Model Atlas** root menu appears with two entries beneath it: **Model Relationship Diagram** and **Erupt Class Registry**. For a full walkthrough of the UI, see [Erupt Atlas](/en/modules/erupt-atlas).

The first time you open it, we suggest skipping the overview diagram and going straight to the audit panel — **on a project that's been running for a year or more, odds are good there's something in those four items**.

## 8. Next Issue Preview

This issue was about "the platform knowing what it looks like." Next issue we step back one pace to **the platform knowing how it's being used**:

> **Issue 10 · `@Power` × Menu Tree × Operation Log: Permissions Aren't Configured, They're Used**

The "drift between declaration and reality" that `PowerRow` exposes is only the opening. When you stack `@Power`'s static declarations, the menu tree's actual grants, and the real call records in `EruptOperateLog` (which carries both `@Erupt` and `@EruptCube`, making it an analytical model in its own right), you find that the permission models of most admin systems are over-engineered — **well over half the permissions granted have never been used by anyone.**

---

:::info Join the discussion
The core source for this issue lives in [`erupt-plugin/erupt-atlas`](https://github.com/erupts/erupt/tree/master/erupt-plugin/erupt-atlas), and the registry in [`xyz.erupt.core.service.EruptCoreService`](https://github.com/erupts/erupt/blob/master/erupt-core/src/main/java/xyz/erupt/core/service/EruptCoreService.java). Come post on [GitHub Discussions](https://github.com/erupts/erupt/discussions) and tell us what turned up in the four audit items on your own project.
:::
