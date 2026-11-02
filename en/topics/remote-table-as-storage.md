---
title: "@EruptDataProcessor × EruptHttpAdapter × SaaS Tables: Swap the Storage Engine, Don't Integrate the Data"
description: "When the data lives in a DingTalk Notable sheet, a Feishu Bitable, Airtable or someone else's REST API, Chinese low-code platforms answer with connectors and sync. Erupt swaps the storage engine behind the model and leaves validation, DataProxy, permissions and logging on one pipeline. This issue covers what that buys and what it costs."
outline: deep
---

# Issue 16 · When the Data Isn't in Your Database

> More and more of what an admin backend manages is not in its own MySQL: a price list operations keeps in a DingTalk Notable sheet, a channel roster in Feishu Bitable, a customer service another team exposes only over REST. Yida, Mingdaoyun and Jiandaoyun answer with "connector + sync" — copy the data in, then manage the copy. Erupt bets the other way: **don't move the data, swap the engine.** Whether an `@Erupt` class is backed by JPA or an HTTP endpoint differs by one `@EruptDataProcessor` line. The price is that query semantics degrade to whatever the remote side can do — and we chose to write that down.
>
> Published 2026-10-02 · ~11 min read

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt WeChat Official Account" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · Official Account</div>
    <div class="topic-mp-qr__title">Scan to follow the Erupt official account</div>
    <p class="topic-mp-qr__desc">Each issue debuts here, along with release notes, source-code deep dives, and community case studies.</p>
  </div>
</div>

[[toc]]

## 1. Why this issue

Issue 15 ended on a question: **when the data isn't in your database, how much of the adaptation should a backend framework leave to you?**

Three commits in the main repo over the past two weeks brought it forward:

- `e5b2a218f Add DingTalk Notable and Airtable data sources` — DingTalk Notable and Airtable become data sources, sharing a base class with the existing Feishu Bitable connector;
- `003fadcc9 feat(erupt-data-s3): typed S3ObjectModel ...` — objects in an S3 bucket become a typed table;
- `ef34f8c1c feat(erupt-data-http): adapter hooks and per-request templates ...` — any REST API gets 8 lifecycle hooks and envelope unwrapping.

The industry default for external data is **integration**: build a connector, sync on a schedule or a workflow trigger into the platform's own table, then build forms, permissions and reports on that table. It is mature, and it quietly introduces a second copy of the data — along with the never-quite-answered question of which copy is true.

Our counter-thesis: **a backend framework's job is to manage data, not to own it.** Where data is stored should be a property of the model, not a migration.

## 2. Two paradigms: move the data vs swap the engine

| | Integration (connector + sync) | Storage engine (Erupt `@EruptDataProcessor`) |
|---|---|---|
| Where external data lives | Copied into a platform table | Stays put; every request goes there |
| Freshness | Depends on sync interval / trigger | Whatever the remote holds right now |
| Writing back | Another reverse sync or workflow node | The same `editData`, written directly |
| Forms / permissions / logs | Act on the copy | Act on the same pipeline as a JPA entity |
| Query power | Copy is local; full SQL | Degrades to what the remote API can do |
| Transactions | Within the copy | None across HTTP |

The last two rows are what we pay, detailed at the end of §5. The first four are what we get: **one model, one copy of the data, one pipeline.**

## 3. Countable facts

| Item | Number | Source |
|---|---|---|
| Data processors registered under `erupt-data` | 14 (JPA is the default) | call sites of `DataProcessorManager.register(...)` |
| SaaS table connectors among them | 3: Feishu Bitable, DingTalk Notable, Airtable | subclasses of `xyz.erupt.core.service.EruptRestTableDataService` |
| Methods a data source implements | 6 required + 3 defaulted | `xyz.erupt.core.service.IEruptDataService` |
| `EruptHttpAdapter` hooks | 8, all with defaults | `url / request / query / body / list / total / item / error` |
| Built-in paging conventions | 3 | `EruptHttp.Paging`: `PAGE_SIZE` / `PAGE_PER_PAGE` / `OFFSET_LIMIT` |
| LOCAL-mode fetch cap per table | 5000 rows, truncated with a warning | `EruptRestTableDataService.MAX_FETCH` |
| Condition expressions evaluated in memory | 13 (EQ, LIKE, RANGE, IN, NULL …) | `EruptBeanDataService.match` |

Swapping engines works because the engine interface is narrow: `IEruptDataService` asks six things — find by id, page query, column query, add, edit, delete. Every read and write in the framework gets this interface from `DataProcessorManager.getEruptDataProcessor(clazz)` and neither knows nor cares what is behind it.

## 4. The pipeline stays; only the last hop changes

Here is the path an insert takes in `xyz.erupt.core.service.EruptModifyService#insertEruptData`:

```java
R<Void> validation = EruptUtil.validateEruptValue(eruptModel, data);
if (!validation.isSuccess()) {
    throw new EruptApiErrorTip(validation.getMessage(), R.PromptWay.MESSAGE);
}
Object obj = this.eruptInsertDataProcess(eruptModel, data);
eruptTreeLevelService.verify(eruptModel, obj, true);
DataProxyInvoke.invoke(eruptModel, (dataProxy -> dataProxy.beforeAdd(obj)));
DataProcessorManager.getEruptDataProcessor(eruptModel.getClazz()).addData(eruptModel, obj);
DataProxyInvoke.invoke(eruptModel, (dataProxy -> dataProxy.afterAdd(obj)));
applicationEventPublisher.publishEvent(new EruptAddEvent<>(eruptModel.getClazz(), obj));
```

Validation, tree depth (the `@Tree(maxLevel)` added these two weeks), `DataProxy.beforeAdd`, events, the operation log — of seven steps, only the fifth touches storage. Put `@EruptDataProcessor("HTTP")` on the class and only where that line lands changes. The `DataProxy<T>`, `@Power` and `PowerHandler` you wrote for a JPA entity apply unchanged to a DingTalk Notable sheet.

On the SaaS side, the three connectors share `EruptRestTableDataService<A extends Annotation>`. It owns the HTTP transport, flattens cell values into Java scalars (rich text, person, attachment → their `text` / `name` / `url` joined into a string; multi-select stays a List) and encodes the model back into `fields`. A concrete connector is left with three things: endpoints, auth header, envelope. The binding annotation carries **only non-secret identifiers**:

```java
@Erupt(name = "Price List", primaryKeyCol = "id")
@EruptDingTalk(baseId = "Xxxxxxxx", sheet = "Prices")
@EruptDataProcessor(EruptDingTalkDataService.DATA_PROCESSOR)
public class PriceItem { /* id, sku, price ... */ }
```

`clientId` / `clientSecret` come from `erupt.dingtalk.*` (`xyz.erupt.dingtalk.prop.EruptDingTalkProperties`). There is no place in source to put a credential — not by convention, but because the annotation has no such attribute.

:::tip The counter-intuitive bit
`EruptBeanDataService#toModel` **materializes the remote Map row into a model instance** before handing it to edit, drill and detail. The comment explains why: downstream `BeanUtils.copyProperties` and `dataTarget` reflect over model fields. In other words, **Erupt adapts to the remote — the pipeline is never taught about Maps.** The pipeline knows exactly one thing: your `@Erupt` class.
:::

## 5. REST APIs: fold the differences into 8 hooks

Feishu, DingTalk and Airtable have known API shapes; they can be hard-coded. The hard case is "someone else's REST": is paging `offset/limit` or `page/per_page`, is the list at `data.items` or `result.list`, is auth Bearer or an HMAC signature?

`@EruptHttp` turns what can be declared into attributes and pushes the rest into `xyz.erupt.http.EruptHttpAdapter`:

```java
package com.example.crm;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import xyz.erupt.annotation.config.QueryExpression;
import xyz.erupt.annotation.query.Condition;
import xyz.erupt.core.view.EruptModel;
import xyz.erupt.core.view.Page;
import xyz.erupt.http.EruptHttpAdapter;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.http.HttpRequest;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

// @Component: taken from the Spring context, so it can hold injected config
@Component
public class CrmAdapter implements EruptHttpAdapter {

    @Value("${crm.api.secret}")
    private String secret;

    @Override
    public void request(HttpRequest.Builder request, EruptModel model) {
        String ts = String.valueOf(System.currentTimeMillis());
        request.header("X-Timestamp", ts).header("X-Signature", hmac(ts));
    }

    @Override
    public void query(Map<String, String> params, Page page, List<Condition> conditions, EruptModel model) {
        EruptHttpAdapter.super.query(params, page, conditions, model);
        for (Condition c : conditions) {
            // The CRM understands name_like; push LIKE down instead of dropping it
            if (QueryExpression.LIKE == c.getExpression()) params.put(c.getKey() + "_like", String.valueOf(c.getValue()));
        }
    }

    private String hmac(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
```

The model is left with declarations:

```java
@Erupt(name = "CRM Customer", primaryKeyCol = "id")
@EruptHttp(value = "${crm.api.base}/customers",
        queryMode = EruptHttp.QueryMode.REMOTE, paging = EruptHttp.Paging.OFFSET_LIMIT,
        listPath = "data.items", totalPath = "meta.count", itemPath = "data",
        editMethod = EruptHttp.EditMethod.PATCH, adapter = CrmAdapter.class)
@EruptDataProcessor(EruptHttpDataService.DATA_PROCESSOR)
public class CrmCustomer { /* id, name, level ... */ }
```

`value` and `headers` are templates resolved by `xyz.erupt.http.HttpTemplate` **on every request**: `${...}` reads Spring configuration so secrets stay in config; `#{...}` is an expression bound to the current `MetaUser`, meant for simple cases like a tenant segment in the URL. Anything with logic — signing, token refresh, rewriting errors — belongs in the adapter: a plain Spring bean you can inject, unit-test and set breakpoints in.

The hook order is the order of a request: `url → request → query → (send) → list / total / item → error`. Each has a default, so a "standard" REST API needs no hook at all, and an odd one overrides only the part that is odd.

### The cost: query semantics degrade, and we say so

The storage-engine paradigm isn't free. Each of these maps to source:

1. **LOCAL mode has a ceiling.** SaaS table connectors fetch the whole table (cursor-paged), then filter, sort and page in memory, capped at `MAX_FETCH = 5000` with truncation and a `warn`. Good for config, dictionary and roster scale — not for transaction logs.
2. **REMOTE mode pushes down only equality by default.** The default `EruptHttpAdapter#query` handles `EQ` only; LIKE and RANGE must be translated into parameters the remote understands in your adapter, or they have no effect. `CrmAdapter`'s `name_like` above exists for exactly this.
3. **Condition strings returned by `DataProxy.beforeFetch` are understood only as `field = value` on non-JPA sources.** `EruptBeanDataService#parseConditionString` parses equality fragments only; HQL fragments such as `in (...)` or `or` are ignored. **If you rely on beforeFetch for row-level isolation, rewrite it as equality conditions — or enforce isolation in the adapter / the remote API — before moving the model to a remote source.**
4. **No transactions across HTTP.** The `@Transactional` on `insertEruptData` covers the local database only; if `afterAdd` throws after a successful remote write, the remote row stays. Compensate in `afterAdd` yourself if you need to.

:::warning Item 3 deserves its own box
It doesn't fail. When a row filter is ignored the list still returns — with rows that shouldn't be there. This is the spot in the storage-engine paradigm that needs the most care on the security side: before moving a model with a `beforeFetch` from JPA to a remote source, walk through its filter conditions one by one.
:::

Integration has none of these four, because the copy is local and SQL can do anything. It is an explicit trade: **we exchange a ceiling on query power for a single source of truth.** For data under 5,000 rows, maintained by another system or by ops, we think the trade pays; above that, the answer is to get REMOTE capabilities from the other side, or to do proper ETL.

## 6. How does it compare with Yida / Mingdaoyun / Jiandaoyun / JeecgBoot?

Based on each platform's public documentation as of publication, comparing the typical approach to **"bringing external data under backend management"**; check each vendor's latest release for exact capabilities.

| Dimension | Yida (connectors) | Mingdaoyun (API integration) | Jiandaoyun (data integration) | JeecgBoot (API datasets) | Erupt |
|---|---|---|---|---|---|
| Where external data lands | Written into a Yida form by a flow | Written into a worksheet by a workflow | Synced / extracted into a form | Reports & dashboards read the API | Nowhere; the model goes direct |
| Edit in the backend and write back? | Needs a write-back flow | Needs a write-back flow | Depends on sync direction | Usually read-only display | Yes, via `editData` |
| Same validation / hooks? | Act on the copy | Act on the copy | Act on the copy | N/A for reports | Same pipeline; `DataProxy<T>` applies unchanged |
| Where adapter logic lives | Platform config | Platform config | Platform config | Platform config | One Java class, `EruptHttpAdapter` |
| Credentials | Platform connector config | Platform integration config | Platform config | Platform config | Spring config (`erupt.dingtalk.*` / `${...}`) |
| Large volumes / complex queries | Full SQL on the copy | Full on the copy | Full on the copy | Depends on the API | Limited, see "The cost" in §5 |

We don't win the last row, and we say so. The first five come down to one thing: **integration turns "external" into "internal"; the storage-engine paradigm keeps external external and reaches management out to it.**

## 7. Up and running in 5 minutes

Taking DingTalk Notable as the example, add one dependency (already included in `erupt-spring-boot-starter-all`):

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-data-dingtalk</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

```yaml
erupt:
  dingtalk:
    client-id: ${DINGTALK_CLIENT_ID}
    client-secret: ${DINGTALK_CLIENT_SECRET}
    operator-id: ${DINGTALK_OPERATOR_UNION_ID}
```

Then attach `PriceItem` from §4 to a menu. For Feishu, Airtable and REST see [erupt-feishu](/en/modules/erupt-feishu), [erupt-airtable](/en/modules/erupt-airtable) and [erupt-http](/en/modules/erupt-http); to write your own data source see [Custom Data Source](/en/advanced/custom-datasource).

If you don't have a running Erupt project yet, start here:

**→ [Quick Start](/guide/quick-start)**

That page covers Maven dependencies, application.yml, your first @Erupt entity, the default login, and Docker / K8S deployment.

Once it runs, go back to the four items under "The cost" in §5 and decide whether your data belongs in LOCAL, REMOTE, or simply stays in JPA.

## 8. Next issue

Data is swapping engines, and so are views: the same weeks added `TIMELINE`, `MAP` and `CUBE` view types to `@Vis`, and the value of an `EditType.MAP` field went from a string to `xyz.erupt.annotation.model.Location` with a coordinate system (GCJ02 / BD09 / WGS84). Next time: **why a backend framework should care about datums** — and why a "map view" on Yida or Jiandaoyun is so often just a plugin.

---

:::info Join the discussion
Source covered in this issue: in `erupt-core`, `service/IEruptDataService`, `service/EruptBeanDataService`, `service/EruptRestTableDataService`, `invoke/DataProcessorManager`, `service/EruptModifyService`; `erupt-data/erupt-data-http` (`EruptHttpAdapter`, `HttpTemplate`, `HttpEnvelope`); `erupt-data/erupt-data-{dingtalk,feishu,airtable}`.

Which "someone else's data" have you brought into a backend, and did you sync or go direct? Post in [GitHub Discussions](https://github.com/erupts/erupt/discussions) — we especially want to hear whether item 3 of "The cost" has bitten you.
:::
