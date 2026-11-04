---
title: "EruptEditEvent × Field Diff × Rollback: Why Change History Doesn't Live in a DataProxy"
description: "An audit log tells you who touched a record, not what it looked like before. This issue takes apart erupt-revision: field-level diffs from pipeline events, rollback through the normal update path, and the two entry points it still misses."
outline: deep
---

# Issue 18 · Change History Belongs to No DataProxy

> The obvious way to keep a record's history is to stash the old row in each model's `DataProxy#beforeUpdate`, which means writing it once per model. `erupt-revision` goes the other way: it touches no `DataProxy`, subscribes to the `EruptAddEvent` / `EruptEditEvent` / `EruptDeleteEvent` the pipeline already publishes, writes a field-level diff inside the caller's transaction, and sends old values back through the **same update pipeline** on rollback.
>
> _Published 2026-10-08 · ~9 min read_

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

Admin systems carry two kinds of "history" that are often confused:

- **Operation log**: written by the machine, one line of `who / when / UPDATE on which table`. Erupt has had this for a long time (`@EruptRecordOperate`, `EruptModifyService#modifyLog`).
- **Field history**: this record's `status` was "pending" last week and is "rejected" now; who changed it, and can it go back.

When the second need shows up, most teams patch it into business code: query the old row in `beforeUpdate`, compare, write to `xxx_history`. It feels fine for the first model, becomes copy-paste by the third, and by the tenth someone has forgotten.

Our counter-thesis:

> **Change history is a by-product of the pipeline, not a duty of business code.** It should subscribe to "a write happened", not wedge itself into one model's lifecycle.

## 2. Two approaches: lifecycle hook vs pipeline event

| Dimension | In DataProxy / triggers | Pipeline events (`erupt-revision`) |
|---|---|---|
| Cost of one more model | One implementation each | **0**; adding the module covers every model |
| Turning one model off | Delete code | `@Power(revision = false)` |
| Risk of gaps | Anyone can forget | Recorded whenever the write goes through the pipeline; not recorded otherwise (see §5) |
| Relation to the business transaction | You guarantee it | Listeners run in the caller's transaction: change and history commit or roll back together |
| Rollback validation | Usually a raw UPDATE that skips validation | Re-enters `updateEruptData`; validation and `DataProxy` hooks still run |

The price is giving up business semantics: the module knows field names and values, not the action "reject". For most back offices that is the right trade; business semantics belong in comments (see [Issue 11](/topics/record-comment-crosscut)).

## 3. One table, three events, two routes

The countable facts, under `erupt-plugin/erupt-revision/`:

- One entity, `xyz.erupt.revision.model.EruptRecordRevision`: `erupt` (model name), `recordId` (primary key as a string), `version`, `operation` (`ADD` / `UPDATE` / `DELETE`), `operator`, `changes` (JSON), with a composite index on `(erupt, recordId)`.
- Three listener methods for `xyz.erupt.core.event.EruptAddEvent` / `EruptEditEvent` / `EruptDeleteEvent`.
- Two routes: `GET /erupt-api/revision/{erupt}/{id}` reads history, `POST .../{revisionId}/rollback` rolls back. Both use `VerifyType.ERUPT`: **whoever can open the model can read its history; rollback additionally needs edit power.**
- One switch: `xyz.erupt.annotation.sub_erupt.Power#revision()`, default `true`.

The history table is itself read-only (`@Power(add = false, edit = false, delete = false, revision = false, comment = false, export = true)`): only the pipeline writes it, and it does not keep history of itself.

## 4. Field-level diff: "unchanged" is the hard part

The listener is short:

```java
@EventListener
@Transactional
public void onEdit(EruptEditEvent<Object> event) {
    this.capture(event.getEruptClass(), RevisionOperation.UPDATE, event.getBefore(), event.getSource());
}

private void capture(Class<?> clazz, RevisionOperation operation, Object before, Object after) {
    EruptModel eruptModel = this.resolve(clazz);
    if (null == eruptModel || !eruptModel.getErupt().power().revision()) return;
    try {
        JsonObject beforeJson = this.masked(eruptModel, before);
        JsonObject afterJson = this.masked(eruptModel, after);
        List<FieldChange> changes = this.diff(eruptModel, beforeJson, afterJson);
        if (changes.isEmpty()) return;
        // ... build EruptRecordRevision, version = max(version) + 1, eruptDao.persist(revision)
    } catch (Exception e) {
        log.warn("erupt-revision: failed to record {} of {}: {}", operation, eruptModel.getEruptName(), e.getMessage());
    }
}
```

`diff` is where the work is. Three rules, all in the source:

1. **Values come from `EruptUtil.toMaskedJson`**, so `PASSWORD` fields are already masked and never reach the history table.
2. **"Empty" equals null.** Empty collections, objects and strings compare equal to null, because that is how a form submits blanks. Otherwise "open the form, change nothing, save" would write an empty revision. An empty `changes` list writes nothing.
3. **References compare by key only.** `REFERENCE_TABLE`, `CHECKBOX`, `TRANSFER` and friends are stored as `{pk, label}` and compared without the label, so a cell edit or rollback that carries only the key is not read as a label change.

:::tip The counter-intuitive part
History does **not** store whole-row snapshots, only `{field, title, before, after}` for fields that changed. That is why rolling back an old revision undoes that one change without wiping fields other people edited since.
:::

## 5. Rollback is a resubmitted form, not an UPDATE

```java
@Transactional
public void rollback(String erupt, String recordId, Long revisionId) {
    EruptModel eruptModel = EruptCoreService.getErupt(erupt);
    Erupts.powerLegal(eruptModel, PowerObject::isEdit);
    EruptRecordRevision revision = eruptDao.find(EruptRecordRevision.class, revisionId);
    // ... check the revision belongs to this model and record, and operation == UPDATE
    Object current = DataProcessorManager.getEruptDataProcessor(eruptModel.getClazz())
            .findDataById(eruptModel, EruptUtil.toEruptId(eruptModel, recordId));
    JsonObject data = GSON.toJsonTree(current).getAsJsonObject();
    for (FieldChange change : RevisionVo.parse(revision.getChanges())) {
        EruptFieldModel fieldModel = eruptModel.getEruptFieldMap().get(change.getField());
        if (null == fieldModel || fieldModel.getEruptField().edit().type() == EditType.PASSWORD) continue;
        data.add(change.getField(), null == change.getBefore() ? JsonNull.INSTANCE : change.getBefore());
    }
    eruptModifyService.updateEruptData(eruptModel, data);
}
```

The last line is the point: old values are written into the **current record's JSON** and handed to `EruptModifyService#updateEruptData`. `DataProxy#beforeUpdate` validation, `@Edit` constraints and row-level permissions all still apply, and the rollback itself fires a new `UPDATE` revision, so **a rollback has history too** and can be rolled back.

The same path sets the limits: only `UPDATE` revisions can be rolled back (`ADD` / `DELETE` throw `revision.rollback_update_only`); fields since removed from the model and `PASSWORD` fields are skipped.

:::warning Known gaps
Two write paths currently leave **no** revision: `EruptModifyService#dragSortEruptData` (drag sorting) writes only the operation log and publishes no `EruptEditEvent`, and any code that calls `eruptDao.persist` or SQL without going through `EruptModifyService` is invisible to the pipeline. Also, `capture` catches every exception and logs a warning: "history must never take the change down" is deliberate, but nobody is notified when a history write fails.
:::

## 6. How does it compare with Yida / Jiandaoyun / Mingdaoyun?

The table compares product shapes; we did not test these platforms item by item, so check their official docs for details.

| Dimension | Domestic platforms | Erupt |
|---|---|---|
| Who enables it | Business users, per form / worksheet in the UI | Adding the module enables it globally; models opt out with `@Power(revision = false)` |
| Granularity | Built-in modification record / activity feed, format set by the platform | Field-level `{field, title, before, after}` JSON, exportable (`export = true`) |
| Rollback | Mostly view-only; restoring is manual | One click, full update pipeline, rollback is itself recorded |
| Transaction | Handled inside the platform | Listener shares the business transaction |
| Extensible | Closed | The same `EruptEditEvent` is open to your own `@EventListener` |
| Fits | Business users self-serving | Backend teams that want "what changed" as a system capability, not one table of code per model |

## 7. Five minutes to a running page

One extra dependency for this issue:

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-revision</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

`erupt-spring-boot-starter-all` already includes it. The module depends on `erupt-upms`, needs **2.3.0** or later, and a JPA data source (the history table is a JPA entity). Once added, a read-only "Record Revision" menu appears under System Management and the record panel gets a history entry.

Everything else is a normal Erupt project:

**→ [Quick Start](/en/guide/quick-start)**

After that, put `@Power(revision = false)` on models that should leave no trace, then verify the §4 claim: "save without changing anything" must produce no history.

## 8. Next issue

The same two weeks also brought the opposite direction: `S3AttachmentProxy` stores attachments straight in an object-storage bucket, and `erupt-data-s3` adds a typed `S3ObjectModel`. Next time: **should an attachment follow the business data or follow the object store**, and what loopholes Yida and Mingdaoyun leave in file ownership.

---

:::info Join the discussion
Source for this issue: `erupt-plugin/erupt-revision/.../service/EruptRevisionService.java`, `model/EruptRecordRevision.java`, `controller/EruptRevisionController.java`, `erupt-core/.../service/EruptModifyService.java` (where the events are published), `erupt-annotation/.../sub_erupt/Power.java`.

Should drag sorting publish an event, and should a failed history write alert someone? Vote on [GitHub Discussions](https://github.com/erupts/erupt/discussions).
:::
