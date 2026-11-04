---
title: "@EruptScope × EruptScopeService × ChoiceFetchHandler: \"The Current Project\" Should Not Be a where Clause"
description: "In most admins, \"current project / cluster / environment\" is a dropdown plus hand-written filters. This issue takes apart @EruptScope: the scope is an @Erupt form class, the client sends one value, and the server re-validates it on every request, rewrites queries and forces writes."
outline: deep
---

# Issue 21 · "The Current Project" Should Not Be a where Clause

> In admins that span projects, clusters or environments, "which scope am I in" is almost always a global dropdown in the front end, and every table then repeats a hand-written filter. `@EruptScope` does the opposite: **the scope is an ordinary `@Erupt` form class that reuses the existing annotations for options, cascades and validation; the client sends one value, and the server re-validates it on every request and rewrites list queries, single-record reads and adds / edits.**
>
> _Published 2026-10-19 · ~9 min read_

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

Picture an ops admin that manages three Kubernetes clusters. The page header has a "current cluster" dropdown, and below it sit nine tables: Pods, Deployments, Services, Events and so on. To make every table follow the dropdown, teams usually do one of three things: add a `cluster` parameter to every query endpoint; inject filter conditions from a gateway or interceptor based on a header; or build one set of pages per cluster.

All three share a flaw: **the scope is a convention, not a declaration.** Add a table and forget the parameter, and it spans clusters. Forget to force `cluster` back on the add / edit endpoint, and a user can write a record into another scope. Read a detail by id, and nobody checks whether the record belongs to the current scope.

In the last two weeks the main repo landed `@EruptScope` (`xyz.erupt.annotation.EruptScope`), its runtime `xyz.erupt.core.scope.EruptScopeService` and `EruptScopes`, and a first consumer, `erupt-k8s-dashboard` (#414, #416). They share one thesis:

> **A scope should be declared the way a field is declared, and enforced by the server once on each of three paths: listing, access by id, and writing.** The front-end dropdown is just one rendering of that declaration.

## 2. Two approaches: scope as a parameter, or scope as a model

| Dimension | Scope as a request parameter (hand-written filters) | Scope as a model (`@EruptScope`) |
|---|---|---|
| Where the scope is defined | Scattered across endpoint parameters and interceptors | One `@Erupt` class; each field with an `edit.title` is one condition |
| Where options come from | The front end carries its own dropdown data | Reuses `@ChoiceType`, `ChoiceFetchHandler` and `dependField` cascades |
| Adding a new table | Remember the parameter | One line on the class: `@EruptScope(XxxScope.class)` |
| The value the client sends | Treated as trusted input | Re-checked on every request against the options the current user is offered |

## 3. The countable facts: one annotation, two attributes, three paths

The annotation has two attributes: `value()` names the scope class, and `bind()` (default `true`) decides whether same-named fields are bound automatically. The scope's values travel in the `erupt-scope` request header (URL-encoded JSON such as `{"KubeScope":{"cluster":"orbstack"}}`); a TPL page that cannot send headers uses the `_scope` parameter. The constants are `EruptScopeService.HEADER` and `PARAM`.

The server enforces it on three paths:

- **List queries**: `EruptService` merges `eruptScopeService.conditions(eruptModel)` into the query conditions.
- **Access by id**: `EruptService#verifyIdPermissions` appends the same conditions, so a record outside the scope is treated as missing.
- **Add / edit**: `EruptScopeService#bind` writes the current scope into the submitted JSON, over whatever the client sent.

## 4. A scope is just a form class

Declaring a scope needs no new concept: write an `@Erupt` form class. Below is `KubeScope` from `erupt-k8s-dashboard` (`xyz.erupt.k8s_dashboard.scope.KubeScope`):

```java
@Getter
@Setter
// A form, not a table: its first field doubles as the key erupt requires
@Erupt(name = "Workspace", primaryKeyCol = "cluster")
public class KubeScope {

    @EruptField(edit = @Edit(title = "Cluster", type = EditType.CHOICE, notNull = true,
            choiceType = @ChoiceType(fetchHandler = KubeContextFetchHandler.class)))
    private String cluster;

    // Left empty: every namespace
    @EruptField(edit = @Edit(title = "Namespace", type = EditType.CHOICE,
            choiceType = @ChoiceType(fetchHandler = KubeScopeNamespaceFetchHandler.class, dependField = "cluster")))
    private String namespace;

}
```

A model that uses it adds one line: `@EruptScope(KubeScope.class)` on `KubePod`. Model fields that share a name with a scope field (`namespace`) are bound automatically. Reference fields (`REFERENCE_TABLE` / `REFERENCE_TREE`) bind by the referenced id: the scope holds the id, the model holds the referenced row. Options come from `xyz.erupt.annotation.fun.ChoiceFetchHandler`, the same interface you write for any dropdown field.

## 5. How the server declines to trust the client

`EruptScopeService` has several rules worth naming, each backed by a case in `erupt-test/.../scope/EruptScopeTest.java`:

- **A required scope is never guessed.** `current(Class<?>)` throws `EruptWebApiRuntimeException` when a `notNull` field is empty, rather than falling back to "no filter", because no filter means every scope (`noPickIsRefused`).
- **Header values are checked against the options every time.** For CHOICE / MULTI_CHOICE fields, `accept(...)` fetches the current user's options through `EruptUtil.getChoiceListFilter(...)` and compares each value; an out-of-range pick is dropped as a whole and the request runs on the defaults (`headerValuesOutsideTheOptionsAreIgnored`).
- **Only the scope the requested model declares is read.** Other scope keys in the header are ignored (`onlyTheScopeOfTheRequestedModelIsRead`).
- **Writes are forced back into the scope.** The client submits `project=alpha` while the scope is `beta`; `beta` is what gets stored (`writesAreForcedIntoTheScope`). A cell edit on a bound field is refused outright, with a dedicated check in `EruptModifyService`.
- **An id outside the scope is a missing id.** `idsOutsideTheScopeAreRefused` covers it.

The core is condition generation: scope values become `Condition`s, multi-value scopes use `IN`, single values use `EQ`:

```java
public List<Condition> conditions(EruptModel eruptModel) {
    List<String> fields = boundFields(eruptModel);
    if (fields.isEmpty()) return Collections.emptyList();
    JsonObject values = this.current(scopeOf(eruptModel).value());
    List<Condition> conditions = new ArrayList<>();
    for (String field : fields) {
        JsonElement value = values.get(field);
        if (empty(value)) continue;
        EruptFieldModel fieldModel = eruptModel.getEruptFieldMap().get(field);
        String refId = refId(fieldModel);
        Class<?> type = fieldModel.getField().getType();
        // a reference condition carries the id the way a search does: {id: value}
        Function<JsonElement, Object> convert = it -> null == refId
                ? TypeUtil.typeStrConvertObject(it.getAsString(), type) : Map.of(refId, it.getAsString());
        if (value.isJsonArray()) {
            List<Object> list = new ArrayList<>();
            value.getAsJsonArray().forEach(it -> list.add(convert.apply(it)));
            conditions.add(new Condition(field, list, QueryExpression.IN));
        } else {
            conditions.add(new Condition(field, convert.apply(value), QueryExpression.EQ));
        }
    }
    return conditions;
}
```

:::tip A counter-intuitive point
The scope condition is not assembled in the front end, nor written into every `DataProxy#beforeFetch`. `EruptService` merges it in two places: list queries and the by-id check. You can bring a new table into a scope without writing Java; to opt one table out, you must turn `bind` off on the annotation and call `EruptScopes.get(...)` yourself. Opting out is an action, not an omission.
:::

### Non-SQL data sources can read the scope too

Not all data lives in SQL tables. The `erupt-k8s-dashboard` models run on `@EruptDataProcessor(EruptK8sDataService.DATA_PROCESSOR)` and read from the Kubernetes API, where there is no `where`. The data source can read the scope itself (set `bind` to `false` when needed, so the framework does not also bind by field name):

```java
@Component
public class KubeScopeContextResolver implements K8sContextResolver {

    @Override
    public String context(EruptK8s eruptK8s) {
        if (!KubeCluster.MASTER_URL.equals(eruptK8s.masterUrl())) return null;
        return KubeContextFetchHandler.context(EruptScopes.get(KubeScope.class).getCluster());
    }

}
```

`EruptScopes.get(...)` returns an **already verified** scope object: values from the request header, or the form's `addBehavior` defaults. The same declaration can therefore constrain a JPA table and also decide which cluster a Pod list talks to.

## 6. How does it compare with Yida / Jiandaoyun / Mingdao?

We have not benchmarked these platforms. The left column lists **questions worth asking when choosing**, not conclusions about them; check each platform's official documentation and test it yourself.

| Dimension | Domestic platforms: what to ask | Erupt |
|---|---|---|
| Global context (project / environment) | In Yida, Jiandaoyun or Mingdao, is "current project" a page variable, a filter widget, or a platform concept? Does a new table need wiring page by page? | One `@EruptScope` line on the class; same-named fields bind automatically |
| Trust in the client's value | Is a value from the URL or a filter widget re-checked on the server against the current user's options? | Re-validated per request (`EruptScopeService#accept`); out-of-range values are dropped |
| Write path | Can adds / edits be bound to the current scope instead of relying on front-end prefill? | `bind(...)` overrides the submitted value; cell edits on bound fields are refused |
| Non-database data | Can a scope apply to API-backed data sources? | `EruptScopes.get(...)` is readable from any data processor |
| Relation to permissions | Are scope and data permission the same thing? | No, see below |

### Costs and limits

- **A scope is not a permission.** The annotation's Javadoc says so plainly: a scope only narrows what the model's menu already shows. To keep users apart (a project they may not see), use a `ChoiceFetchHandler` whose options are filtered per user, or `@Filter` / data permissions.
- **Free-text fields are taken as typed.** A field with no options to check (such as `tag` in the tests) is accepted as typed.
- **Menus matter.** `EruptScopeController` lists only the scopes declared by models visible on the user's menus; models with `authVerify = false` are always included.
- **Option handlers cache for themselves.** `EruptScopeService` documents that it keeps no scope-level cache and asks for options on every request; a costly handler must cache its own (#420).

## 7. From annotation to UI in 5 minutes

The full flow from an empty project to a working admin page has its own page:

**→ [Quick Start](/guide/quick-start)**

Once that runs, write a scope form class (like `KubeScope` above), add `@EruptScope(KubeScope.class)` to any `@Erupt` model, and make sure the model has a field with the same name as a scope field; a scope picker appears in the page header. For a complete example, enable `erupt-k8s-dashboard`.

## 8. Next issue

`erupt-webhook` has now slipped two issues: it subscribes to `EruptAddEvent` / `EruptEditEvent` / `EruptDeleteEvent` and delivers data changes to external systems after the transaction commits, signed with HMAC-SHA256. Next time: **why "tell the outside world the data changed" does not belong in `DataProxy#afterAdd`**, and why delivery retries happen off the request thread.

---

:::info Join the discussion
Source covered in this issue: `erupt-annotation/.../EruptScope.java`, `erupt-core/.../scope/EruptScopeService.java`, `erupt-core/.../scope/EruptScopes.java`, `erupt-upms/.../controller/EruptScopeController.java`, `erupt-plugin/erupt-k8s-dashboard/.../scope/KubeScope.java`, and `erupt-test/.../scope/EruptScopeTest.java`.

Should a scope be able to layer per-user defaults or allow-lists on top? Tell us in [GitHub Discussions](https://github.com/erupts/erupt/discussions).
:::
