---
title: "Why Cell Edits Run the Whole-Row Pipeline"
description: "Admin tables keep drifting toward spreadsheet-style grids where you double-click and change one field in place. But \"change one field\" means a write path that bypasses the whole-row form — bypassing validation, DataProxy, and readonly. Erupt bets the reverse — cell editing doesn't deserve a path of its own; it loads the whole row, patches it, and runs the complete edit pipeline again."
outline: deep
---

# Issue 10 · Why Cell Edits Run the Whole-Row Pipeline

> Over the past couple of years, admin tables have collectively converged on the spreadsheet grid: double-click a cell, change one field in place, hit Enter to save. The experience is genuinely better, but on the server it quietly opens a new hole — **a write path that carries exactly one field**. Nobody runs the cross-field rules, nobody calls `DataProxy`, and `@Readonly` is reduced to decoration.
> This issue covers `cellEdit` in Erupt 2.2.0. Our conclusion is that **cell editing should not have a write path of its own**. It loads the whole row from the database, applies one patch to the JSON, and runs the edit pipeline again unchanged — the single field is just the shape of the input, not a new semantics.
>
> _Published 2026-09-16 · ~10 min read_

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

Let's start with how we got pushed into building this feature.

The request usually arrives in these words: "Can we edit directly in the table, like **Jiandaoyun**? Opening a dialog every time I change a status is too slow." The request is entirely reasonable — admin systems are full of "flip one enum" and "add one remark" operations, and opening a full form for each of them is heavy. **Mingdao**, **DingTalk Yida**'s online tables, and **JeecgBoot**'s online forms all offer inline editing; it's already a baseline expectation for admin systems in China.

The trouble starts at the very first fork in the implementation. The overwhelming majority do this:

```
PATCH /api/{table}/{id}   body: { "status": "PUBLISHED" }
```

An endpoint that carries only the changed field. It looks like the most natural design — send what you changed. Then, on a real project, it runs into four things in sequence:

1. **Cross-field rules can't run.** "When status becomes Published, the body must not be empty" — `status` alone is fine, `content` alone is fine, only the pair is wrong. The endpoint holds only `status`; it has no material to judge with.
2. **`DataProxy` / interceptors don't receive a complete entity.** The `model` your `beforeUpdate(model)` gets has one field populated and everything else `null` — so either it misjudges, or you're forced to write "is this null because it wasn't sent, or because it should be cleared?" into every hook.
3. **Readonly becomes decoration.** A field grayed out on the form is an ordinary column in the table. Not rendering the edit icon on the frontend counts as "under control" — until someone hand-writes a `curl`.
4. **Display values get written back.** `afterFetch` formats an amount as `¥1,200.00` or masks a phone number as `138****0000` for display, and the inline editor seeds its initial value from exactly that row. The user didn't touch this field and saved a different one? Fine. **But the moment they click this cell, `138****0000` gets submitted back as the real value.**

The fourth one is especially insidious — it doesn't throw; it stores asterisks in the database.

The contrarian thesis of this piece:

> **Cell editing is not a new write semantics; it's just a new input shape. Any implementation that gives it a separate write path has to redo, on that path, everything the form already does — and redoing means missing something.**

## 2. Two Approaches: Patch vs. Whole-Row Replay

Flatten those four problems out and the difference between the two paradigms is clear:

| | Patch (PATCH a single field) | Whole-row replay (Erupt `update-cell`) |
|---|---|---|
| Data the server receives | Only the changed field | Changed field + **the whole row read from the database** |
| Cross-field validation | Impossible (missing material) | Works out of the box, the very same rules as the form |
| `DataProxy` hook argument | Partial entity | Complete entity |
| Readonly / permissions | Usually only blocked on the frontend | Rejected layer by layer on the server |
| New validation logic to write | A whole set | **Zero** — reuses `validateEruptValue` |
| Cost | Saves one query | **One extra query by primary key** |

Erupt chose the right-hand column, with the cost stated in the open: every cell save costs one extra `findDataById`. We consider it the best-value query of the century — what it buys is "not a single rule on this path needs to be reimplemented."

::: tip A counterintuitive takeaway
The hard part of inline editing was never the frontend. The frontend is a popover and one `POST`. The hard part is this: **the write path you just added has, in one stroke, voided every implicit constraint that accumulated in the "edit form" over the past several years.**
:::

## 3. How Many Gates a Cell Save Passes Through

`POST /erupt-api/data/modify/{erupt}/update-cell`, and the payload has only three fields:

```java
package xyz.erupt.core.view;

/**
 * One cell edit: the row primary key, the field to change and its new value.
 */
@Getter
@Setter
public class EruptCellVo {
    private String id;
    private String field;
    private JsonElement value;
}
```

Once those three fields land on the server, they have to clear seven gates in a row, and failing any one of them yields a rejection with a message (`EruptApiErrorTip`, not a 500):

1. `@Power(edit)` — may this model be edited at all
2. `@Power(cellEdit)` — may this model be edited **in the table**
3. The field exists and `@Edit(title)` is non-empty — anything not on the edit surface is refused outright
4. `@Edit(cellEdit)` — may this field be edited in the table
5. `@Edit(readonly.edit)` — readonly on the form means even more so in the table
6. `verifyIdPermissions` — row-level permission: can you **see** this row? If you can't query it, you can't change it
7. Whole-row validation + `DataProxy#validate`

Gate 6 deserves a sentence of its own. It doesn't compare some owner field; it **re-queries this row with the current user's query conditions**:

```java
public void verifyIdPermissions(EruptModel eruptModel, String id) {
    List<Condition> conditions = new ArrayList<>();
    conditions.add(new Condition(eruptModel.getErupt().primaryKeyCol(), id, QueryExpression.EQ));
    Page page = DataProcessorManager.getEruptDataProcessor(eruptModel.getClazz())
            .queryList(eruptModel, new Page(1, 1),
                    EruptQuery.builder().conditions(conditions).build());
    if (page.getList().isEmpty()) {
        throw new EruptNoLegalPowerException();
    }
}
```

— `xyz.erupt.core.service.EruptService`

That query carries every row-level filter: `@Filter`, `DataProxy#beforeFetch`, multi-tenant conditions, all of it. **Can't see it, can't change it** — there is one copy of the rule, and no data-permission logic has to be written a second time for cell editing.

## 4. Two Switches, Both Enforced on the Server

There's one `cellEdit` at the model level and one at the field level, both defaulting to `true`:

```java
// xyz.erupt.annotation.sub_erupt.Power
@Comment("Whether rows may be edited one cell at a time, directly in the table. " +
        "A cell runs the same pipeline as the edit form, so turn it off only for a table " +
        "whose rows should always be changed as a reviewed whole")
boolean cellEdit() default true;
```

```java
// xyz.erupt.annotation.sub_field.Edit
@Comment("Whether this field may be edited directly in the table, when the model allows it. " +
        "A single cell is validated as a whole row, so a cross-field rule needs no help here; " +
        "turn it off for a field the form should still edit but a grid cell should not, " +
        "such as a secret that has no place in an in-table popover")
boolean cellEdit() default true;
```

The model says "this table can be edited in place"; the field says "but not me." That combination solves a scenario that previously had no answer: **a field that should be editable on the form but not in the table.** The only exclusion tool before was `@Readonly`, which disables the control on the form as well.

The framework is its own first user. `EruptUser.account`, `LLM.apiDomain`, `RemoteHost.privateKey`, and `BiDataSource.connectString` are all marked `cellEdit = false` — credentials and connection strings have no business in a table popover:

```java
// xyz.erupt.remote.model.RemoteHost
@EruptField(
        views = @View(title = "Private Key"),
        edit = @Edit(title = "Private Key", type = EditType.TEXTAREA, cellEdit = false, ...)
)
private String privateKey;
```

The key is the last point: **both switches are checked again at the write.** The controller first runs `powerLegal(eruptModel, PowerObject::isCellEdit)`, and the service then checks the field-level switch. A hand-crafted request aimed at a model that never enabled cell editing gets a rejection, not a successful write. Not rendering the edit icon on the frontend just keeps the UI from lying; it is not the permission itself.

## 5. Whole-Row Replay: Patching the Row That Lives in the Database

This is the heart of the design, and the source is more direct than any explanation:

```java
// xyz.erupt.core.service.EruptModifyService#updateEruptCell
Object old = DataProcessorManager.getEruptDataProcessor(eruptModel.getClazz())
        .findDataById(eruptModel, TypeUtil.typeStrConvertObject(id, pkField.getType()));

// the stored row patched with the new value is validated as a whole, so a single cell runs
// exactly the rules the edit form runs: every field's own rules, a @Dynamic rule that reads
// another field, and DataProxy#validate against a complete entity
JsonObject merged = GsonFactory.getGson().toJsonTree(old).getAsJsonObject();
merged.add(fieldName, value);
R<Void> validation = EruptUtil.validateEruptValue(eruptModel, merged);
if (!validation.isSuccess()) {
    throw new EruptApiErrorTip(validation.getMessage(), R.PromptWay.MESSAGE);
}
```

`validateEruptValue` is the very method called when the row form is submitted — **the same symbol, with no cell-specific branch**. Cross-field rules therefore apply automatically. The test in erupt-test that nails this down looks like this:

```java
@Component
public class CellEditRowDataProxy implements DataProxy<CellEditRowModel> {

    /**
     * A cross-field rule: neither status nor content is wrong on its own, only the pair is.
     * Reachable from a cell edit only when the whole row is validated.
     */
    @Override
    public void validate(CellEditRowModel model) throws EruptException {
        if ("PUBLISHED".equals(model.getStatus())
                && (null == model.getContent() || model.getContent().isBlank())) {
            throw new EruptException("Published records need content");
        }
    }
}
```

The test changes only `status = PUBLISHED` and asserts a rejection; once `content` is filled in, the same patch passes. **No patch-style implementation can ever pass this test**, because all it ever holds is `status`.

Everything after the write is the same cast as well: `beforeUpdate` / `afterUpdate` receive the complete entity, the operation log is recorded as `oldData -> {changed field}`, `EruptEditEvent` fires as usual, and `PASSWORD` fields are masked in the log as usual.

### A Breaking Fix That Came With It: Tables Return Raw Values

To make inline editing possible, one thing had to change first: **table queries used to return display text** — booleans came back as the `trueText` / `falseText` wording, choices came back as labels. That's fine for a "read-only table" and fatal for an "editable table": the editor needs the **value**, not the **wording**. Worse, the wording is translated by `@EruptI18n`, so reverse-mapping text back to a value is both ambiguous (two options may share a label) and drifts with the UI language.

Starting with 2.2.0, `/erupt-api/data/table/{erupt}` returns stored values as-is, and `convertDataToEruptView` retains only the `PASSWORD` masking. Excel export applies wording and labels itself when writing cells, so exported output is unchanged.

::: warning Upgrade note
`@RowOperation(ifExpr)` and `@View(template)` are evaluated in the browser against this row, so expressions involving BOOLEAN / CHOICE fields must be rewritten:

```
ifExpr = "item.status == '启用'"   ->   "item.status === true"
ifExpr = "item.level == '高'"      ->   "item.level == 'HIGH'"
```

The same goes for custom code calling the table endpoint. Incidentally, these expressions **were always brittle** — they compare against translated text, so the semantics change the moment the UI language is switched.
:::

### One More Trap: `afterFetch` Rewrites Land in the Editor

This is the proper answer to item 4 in Section 1, and it's written into the `DataProxy` Javadoc:

```java
/**
 * Rewrites the rows a table query is about to return. The row form is unaffected, because it
 * reads a record through its own endpoint, but in-table cell editing seeds its editor from the
 * row shown here: a field rewritten for display (masked, formatted, turned into markup) would
 * be written back in that form. Rewrite view-only fields, or mark an editable one
 * {@code @Edit(cellEdit = false)}.
 */
default void afterFetch(Collection<Map<String, Object>> list) {
}
```

— `xyz.erupt.annotation.fun.DataProxy`

The rule in one sentence: **a field rewritten in `afterFetch` must either be display-only or be marked `@Edit(cellEdit = false)`.** This is a constraint the framework cannot decide for you (it has no way to know whether `¥1,200.00` is formatting or the true value), so we wrote it into the extension point's own documentation rather than into the corner of some manual page.

## 6. How Does It Compare to Jiandaoyun / Mingdao / JeecgBoot?

| Dimension | Jiandaoyun / Mingdao / Yida | JeecgBoot online forms | Erupt `cellEdit` |
|---|---|---|---|
| Inline editing entry point | Yes, built into the product | Yes, via online config | `@Power(cellEdit)`, on by default |
| Field-level exclusion | Via "readonly", which disables the form too | Field config set to readonly | `@Edit(cellEdit=false)`, **form remains editable** |
| Cross-field validation | Must be configured again in form rules | Must write online enhancement JS / Java | **No config**, the same `validate` as the form |
| Extension hook argument | No source-level hooks | Available via enhancement class | Complete entity, identical to a form submission |
| Row-level data permission | Platform rules, black box | Must wire up `DataScope` yourself | Reuses query-side filters; can't see it, can't change it |
| Hand-crafted request bypassing the frontend | Depends on the platform | Depends on whether the enhancement runs server-side | All seven gates on the server |
| Operation log | Yes, platform format | Requires configuration | Same log chain as a form submission |

The difference can be summed up in one line: **others "added an editing capability to the table"; we "added an input shape to the form."** The former has to build out a whole set of constraints for the new capability; the latter is born carrying the old ones.

## 7. 5 Minutes From Annotation to UI

From an empty Spring Boot project to a reachable admin page, the full flow is its own page:

**→ [Quick Start](/en/guide/quick-start)**

That page covers Maven dependencies, `application.yml`, the first `@Erupt` entity, the default login account, and Docker / K8S deployment.

Once it's running, cell editing **needs no extra configuration** — `@Power(cellEdit)` defaults to `true`; just double-click a cell. The only real work is two acts of tightening:

```java
// Rows in this table must be changed as a reviewed whole; turn it off for the model
@Erupt(name = "Settlement", power = @Power(cellEdit = false))
public class Settlement extends BaseModel { }

// Or keep a single field out of the table while the form still edits it
@EruptField(
        views = @View(title = "API Key"),
        edit = @Edit(title = "API Key", cellEdit = false)
)
private String apiKey;
```

Configuration options and UI behavior are detailed in [@Power → cellEdit](/en/annotation/power); table interaction is covered in the [UI Guide](/en/guide/ui).

## 8. Next Issue Preview

This issue argued that "a new write path should not have new rules." Next issue we go back to the thread left dangling at the end of #09 and ask a more awkward question: **of all those rules, how many have never once been triggered?**

> **Issue 11 · `@Power` × Menu Tree × `EruptOperateLog`: Permissions Aren't Configured, They're Used**

Overlay three things — the static declarations in `@Power`, what the menu tree actually grants, and the real calls in the operation log — and most admin permission models turn out to be over-engineered. More than half of the permissions granted have never been used by anyone.

---

:::info Join the discussion
The core source for this issue is [`EruptModifyService#updateEruptCell`](https://github.com/erupts/erupt/blob/master/erupt-core/src/main/java/xyz/erupt/core/service/EruptModifyService.java); the two switches live in [`Power`](https://github.com/erupts/erupt/blob/master/erupt-annotation/src/main/java/xyz/erupt/annotation/sub_erupt/Power.java) and [`Edit`](https://github.com/erupts/erupt/blob/master/erupt-annotation/src/main/java/xyz/erupt/annotation/sub_field/Edit.java); the whole-row validation test is `CellEditRowModel` in `erupt-test`. Come post on [GitHub Discussions](https://github.com/erupts/erupt/discussions) and tell us which fields in your project least belong in a table popover.
:::
