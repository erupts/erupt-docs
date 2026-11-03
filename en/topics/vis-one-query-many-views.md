---
title: "@Vis × TableQuery × DataProxy: Eight Views, One Query Pipeline"
description: "Mingdaoyun, Jiandaoyun and Yida all ship board, calendar and Gantt views. Erupt's @Vis bets differently: a view is a projection of one query, not a mini-app with its own data rules. This issue shows how the read path is shared and where the write path still isn't."
outline: deep
---

# Issue 17 · One Table, Eight Views

> Board, calendar and Gantt have become standard in Chinese spreadsheet-style low-code platforms, and a view increasingly looks like an object of its own, with its own filter, grouping and sort. Over the last two weeks Erupt's `@Vis` gained TIMELINE, MAP, CUBE and server-side column statistics, so one entity can now carry 8 view types. Our position: **a view should be a projection of one query, not a small app with its own data rules.** The read path is converged on one function; the three drag-and-drop write endpoints are not yet. This issue lays out both.
>
> Published 2026-10-03 · ~10 min read

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

Adding a "board view" to a task table sounds like a front-end ticket. The trouble comes afterwards: is the "In progress: 12" on the board the same set of rows the list page filters to? A salesperson who can only see their own customers — do they still only see their own after switching to the calendar or the map? When a card is dragged to "Done", do the business rules still run?

Once there are many views, these stop being feature questions and become questions of data scope. Our answer is not a data API per view. All views share one query pipeline; a view only decides **how to draw**.

The conclusion up front, so you don't have to read to the end for it: the read path is done; the write path is half done. §5 lists exactly what is missing.

## 2. Two paradigms: view as object vs view as projection

| | View as object | View as projection (`@Vis`) |
|---|---|---|
| What a view stores | Filter, grouping, sort, column visibility — one copy each | Only "how to draw": group field, date field, color field |
| Data scope | May differ per view | Identical to the list page: same `TableQuery`, same `Condition`s |
| Who defines it | Business users, by clicking in the UI | Developers, in entity annotations, versioned in Git |
| Permissions and hooks | Handled by the platform; hard for developers to intercept | Via `DataProxy` and `@Erupt(power = @Power(...))`; developers can intercept |
| Cost | Scope drifts when users edit views | Changing a view means changing code and shipping |

Neither is wrong; the audience differs. If business users build it themselves, a view belongs in the UI as an object. If you are delivering a back office whose numbers must stay stable, a view belongs in code.

## 3. The countable facts

| Item | Count | Source |
|---|---|---|
| View types | 8: `TABLE` / `GANTT` / `CARD` / `BOARD` / `CALENDAR` / `TIMELINE` / `MAP` / `CUBE`, plus `TPL` for custom templates | `xyz.erupt.annotation.Vis.Type` |
| View config annotations | 8, in `xyz.erupt.annotation.vis.*` and `xyz.erupt.annotation.cube.CubeView` | `BoardView` / `CalendarView` / `CardView` / `GanttView` / `MapView` / `TableView` / `TimelineView` / `CubeView` |
| Chart types (CUBE view) | 28 | `xyz.erupt.annotation.cube.CubeChart.Type` |
| Column statistics | 6: `COUNT` / `DISTINCT_COUNT` / `SUM` / `AVG` / `MAX` / `MIN` | `xyz.erupt.annotation.sub_field.View.Statistic` |
| Read-pipeline entry | 1: `EruptService.assembleQuery`, shared by list and aggregate | `xyz.erupt.core.service.EruptService` |
| Write-back endpoints | 3: board, calendar, Gantt | `xyz.erupt.core.controller.vis.*Controller` |

`@Vis` hangs off `@Erupt(vis = {...})`. `visRawTable` defaults to `true`, so the default table stays and the other views appear as side-by-side tabs.

## 4. The read path: a view is one field on TableQuery

Every view request carries a `vis` value (the `@Vis.code`). On the server, `EruptService.assembleQuery` turns it into extra conditions; everything else is the same function the list page uses:

```java
// xyz.erupt.core.service.EruptService#assembleQuery (excerpt)
DataProxyInvoke.invoke(eruptModel, (dataProxy ->
        Optional.ofNullable(dataProxy.beforeFetch(legalConditions)).ifPresent(conditionStrings::add)));
if (null != tableQuery.getVis()) {
    for (Vis vis : eruptModel.getErupt().vis()) {
        if (vis.code().equals(tableQuery.getVis())) {
            for (Filter filter : vis.filter()) {
                conditionStrings.add(filter.value());
            }
            if (vis.orderBy().length > 0) {
                // the view's own sort applies only when the user hasn't chosen one
            }
        }
    }
}
```

The order matters: user search conditions and the link tree first, then `DataProxy#beforeFetch` — where row-level permissions typically live — and only then the view's own `@Vis(filter = ...)`. **A view's filter can only narrow, never widen past what came before**, because it is appended as an `and`.

The server-side column statistics added last week use the same function. `POST /erupt-api/data/aggregate/{erupt}` takes exactly the same `TableQuery` as the list:

```java
// xyz.erupt.core.service.EruptService#getEruptAggregate (excerpt)
Erupts.powerLegal(eruptModel, PowerObject::isQuery);
// ... collect every @View(statistic = ...) column ...
EruptQuery eruptQuery = this.assembleQuery(eruptModel, tableQuery, null);
Optional.ofNullable(DataProcessorManager.getEruptDataProcessor(eruptModel.getClazz())
        .aggregate(eruptModel, eruptQuery, aggregates)).ifPresent(result::putAll);
```

So the sum in a board column header (`@BoardView(sumField = ...)`), the subtotal of a grouped table (`@TableView(groupField = ...)`) and the footer total do not depend on which page of the list you are on; they cover every row the same conditions match. Transient columns that a DataProxy fills in `afterFetch` cannot be aggregated by the data source; for those the server falls back to in-memory computation capped at 2,000 rows, and beyond that it returns `null` — better to show "unknown" than an exact-looking total over half the data.

The CUBE view carries the same idea into charts. `@CubeView(linkSearch = true)` forwards the list's search conditions to every chart as cube filters, and `searchMapping` bridges differently named fields:

```java
@Erupt(name = "Order", vis = {
    @Vis(title = "Analysis", type = Vis.Type.CUBE, cubeView = @CubeView(
        explore = "overview",
        linkSearch = true,
        searchMapping = @KV(key = "customer.name", value = "customerName"),
        columns = 2,
        charts = {
            @CubeChart(title = "Monthly amount", type = CubeChart.Type.LINE,
                       x = "month", y = "amount"),
            @CubeChart(title = "Channel share", type = CubeChart.Type.PIE,
                       x = "channel", y = "amount")
        }))
})
```

Rendering and querying come from erupt-cube; without that module the view reports that charts are unavailable instead of failing.

:::tip The counter-intuitive takeaway
The more views you have, the **less** you should give them data APIs. The board, calendar and Gantt controllers contain no query code at all — they only write back. Every read is a `TableQuery` plus a `vis` field, so the scope exists in one place.
:::

## 5. The write path: three endpoints, four things not yet converged

Dragging a board card, a calendar entry or a Gantt bar writes to the database. The three endpoints (`EruptBoardController#updateGroup`, `EruptCalendarController#updateDate`, `EruptGanttController`) work broadly the same way: check the `isEdit` power, load the entity by primary key, set the field by reflection, call `DataProxy#beforeUpdate` / `afterUpdate`, save.

That path works, and the `DataProxy` hooks are there. But compared with `update-cell` from [Issue 10](/topics/cell-edit-whole-row), it is a **short path**. Here is what `EruptModifyService.updateEruptCell` does that, by our reading of the source, the drag endpoints do not:

- **Whole-row validation.** `update-cell` merges the change into the full row and runs `EruptUtil.validateEruptValue`. The drag endpoints change only a date or group field and run neither `@Edit` validation nor `DataProxy#validate`.
- **Row-level permission.** The update entry calls `verifyIdPermissions` to confirm the primary key is inside the current user's visible set. The drag endpoints (board and calendar, for example) go straight to `findDataById`.
- **Operation log and events.** A regular update calls `modifyLog` and publishes `EruptEditEvent`. None of the three drag endpoints carries `@EruptRecordOperate` or calls `modifyLog`. On events, Gantt publishes `EruptEditEvent`; board and calendar do not, so anything that notifies on that event misses drags in those two views.
- **Tree-level check.** `eruptTreeLevelService.verify` runs on regular updates, not on drags.

```java
// Board drag, EruptBoardController#updateGroup (excerpt)
Object obj = DataProcessorManager.getEruptDataProcessor(eruptModel.getClazz())
        .findDataById(eruptModel, command.getPk());
this.assign(eruptModel, obj, vis.boardView().groupField(), command.getGroupValue());
DataProxyInvoke.invoke(eruptModel, (dataProxy -> dataProxy.beforeUpdate(obj)));
DataProcessorManager.getEruptDataProcessor(eruptModel.getClazz()).editData(eruptModel, obj);
DataProxyInvoke.invoke(eruptModel, (dataProxy -> dataProxy.afterUpdate(obj)));
```

:::warning A debt we owe
If your business rules live in `DataProxy#validate` or depend on `EruptEditEvent`, either re-check them in `beforeUpdate` before enabling board / calendar / Gantt dragging, or leave dragging off for now. Our plan is to route these three endpoints through the same whole-row pipeline as `update-cell`; until then this is a known gap, not a design trade-off.
:::

We put this in an issue instead of quietly fixing it because Issue 10's conclusion — every write goes through the whole-row pipeline — applies to views too, and our own code does not yet honor it.

## 6. Compared with Mingdaoyun / Jiandaoyun / Yida

The table compares product shapes. We have not tested these platforms' internals item by item; defer to their official documentation for details.

| Dimension | Domestic counterparts | Erupt |
|---|---|---|
| Who defines a view | Business users in the UI; views are first-class platform objects | Developers in `@Erupt(vis = ...)`, versioned with the entity in Git |
| View types | Board, calendar, Gantt, gallery and so on, evolving with platform releases | 8 built in, plus the `TPL` custom-template view for other shapes |
| Data scope | Each view carries its own filter and grouping; consistency is a human job | One `assembleQuery` on the read path; a view only appends `and` conditions |
| Row-level permission | Handled by the platform's permission system | `DataProxy#beforeFetch` applies once, to every view |
| Drag write-back | Handled inside the platform | Fires `beforeUpdate` / `afterUpdate`; validation, row-level permission and logging not yet aligned (§5) |
| Charts | Built-in dashboards / chart components | `CubeView` embeds 28 chart types in the same tab system; queries go through the `@EruptCube` semantic layer |
| Best for | Business users building it themselves | Back-end teams that need stable, auditable, version-controlled scope |

## 7. From annotation to UI in 5 minutes

The whole flow from an empty Spring Boot project to a reachable admin page is its own page:

**→ [Quick Start](/guide/quick-start)**

It covers the Maven dependency, application.yml, your first @Erupt entity, the default login, and Docker / K8S deployment.

Once it runs, look at `xyz.erupt.sample.model.Gantt` in the `erupt-sample` module of the main repo: one entity carrying card, Gantt, calendar and timeline views. Copy it and swap in your own field names. Full attributes are in [@Vis multi-view](/en/annotation/vis).

## 8. Next issue

Views are about how data is seen. The same fortnight brought a change in the opposite direction: `S3AttachmentProxy` stores Erupt attachments straight into an object-storage bucket, and `erupt-data-s3` ships a typed `S3ObjectModel`. Next time: **should an attachment follow the business data or follow the object store** — and what DingTalk Yida and Mingdaoyun leave open about file ownership in their attachment fields.

---

:::info Join the discussion
Source covered in this issue: `erupt-annotation/.../Vis.java`, `vis/*View.java`, `cube/CubeView.java`, `cube/CubeChart.java`; `erupt-core/.../service/EruptService.java` (`assembleQuery`, `getEruptAggregate`); `controller/vis/EruptBoardController.java`, `EruptCalendarController.java`, `EruptGanttController.java`.

Tell us on [GitHub Discussions](https://github.com/erupts/erupt/discussions) which of the four gaps in §5 matters most to you; we'll order the fixes by feedback.
:::
