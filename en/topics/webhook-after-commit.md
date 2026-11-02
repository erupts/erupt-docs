---
title: "EruptAddEvent × AFTER_COMMIT × HMAC: Telling the Outside World Does Not Belong in a DataProxy"
description: "The easiest way to push a data change to another system is an HTTP call inside DataProxy#afterAdd. This issue takes apart erupt-webhook: it subscribes to pipeline events, delivers only after the transaction commits, never makes the request thread wait for the receiver, and has no durable queue yet."
outline: deep
---

# Issue 22 · Don't Notify Anyone Before the Transaction Commits

> The easiest way to push a data change to another system is an HTTP call inside `DataProxy#afterAdd` — which runs **before** the transaction commits, parks the request on the receiver, and leaves retries for you to write. `erupt-webhook` goes the other way: it subscribes to the `EruptAddEvent` / `EruptEditEvent` / `EruptDeleteEvent` the pipeline already publishes, matches subscriptions only after commit, and hands a signed, retried, logged delivery to a background worker.
>
> _Published 2026-10-19 · ~9 min read_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt WeChat Official Account" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · Official Account</div>
    <div class="topic-mp-qr__title">Follow the Erupt Official Account</div>
    <p class="topic-mp-qr__desc">Every issue is published here first, along with release notes, source-code walkthroughs and community case studies.</p>
  </div>
</div>

[[toc]]

## 1. Why this issue

"Tell the warehouse system as soon as an order is saved." "Sync to the CRM when a customer record changes." Back-office teams get this request every month. There are three usual answers: call `HttpClient.post` inside the business method; do it in `DataProxy#afterAdd`; or configure a "call an API when data changes" rule on one form of a low-code platform.

All three share the same hazards:

- **The notification goes out before the commit.** When `afterAdd` runs, the transaction of `EruptModifyService#insertEruptData` (annotated `@Transactional`) has not committed. A receiver that calls back may not find the record; if the transaction then rolls back, the outside world has already been told about an add that never happened.
- **The request thread waits for the receiver.** If the receiver takes 10 seconds, the user's Save button spins for 10 seconds.
- **It is configured model by model.** On the tenth table someone forgets.

Our counter-thesis:

> **An outbound notification is a broadcast of a fact that has already been committed, not a step in some model's lifecycle.** It should subscribe to events after commit, with a deliverer that is independent of the request and responsible for retries and records.

## 2. Two approaches: plug into the lifecycle vs. subscribe to post-commit events

| Dimension | In `DataProxy#afterXxx` | Subscribe to pipeline events (`erupt-webhook`) |
|---|---|---|
| When it fires | Before the transaction commits | `TransactionPhase.AFTER_COMMIT`; rolled-back writes notify no one |
| Coverage | Written once per model | Tick "All Models", or pick from a transfer box |
| Who waits for the receiver | The request thread | A background pool; the request thread only matches and serialises |
| On failure | Write your own retries and logs | 3 attempts + delivery log + one-click resend |
| Who configures it | A developer, via code and a release | An administrator, via a form in the back office |

## 3. Countable facts: three events, three attempts, two tables

The whole module lives in `erupt-plugin/erupt-webhook`, roughly 830 lines of main code:

- **Three events**: `xyz.erupt.webhook.model.WebhookEvent` has only `ADD`, `UPDATE` and `DELETE`, mapping to `EruptAddEvent`, `EruptEditEvent` and `EruptDeleteEvent` in the core pipeline. A test, `deleteIsNotSubscribed`, asserts that an event nobody subscribed to is not delivered.
- **Three attempts**: `EruptWebhookService` sets `ATTEMPTS = 3`, with back-offs of 1 s and 5 s; each request times out after 15 s, the connect after 10 s.
- **Two tables**: `EruptWebhook` (subscriptions) and `EruptWebhookLog` (one row per delivery: status, attempts, duration, the first 2,000 characters of the response, the full payload). Both are ordinary `@Erupt` models, and the subscription table drills into its own delivery log.
- **Two built-in headers**: `X-Erupt-Signature: sha256=<HMAC-SHA256(secret, body)>` and `X-Erupt-Delivery`; a `KEY_VALUE` field on the subscription adds any other header the receiver wants, such as `Authorization`.

The payload is one uniform envelope:

```json
{
  "id": "…uuid…",
  "event": "UPDATE",
  "erupt": "Order",
  "model": "Order",
  "recordId": "1024",
  "operator": "admin",
  "timestamp": "2026-10-19T03:04:45Z",
  "before": { "status": "UNPAID" },
  "after":  { "status": "PAID" }
}
```

`before` / `after` are whole-row JSON; `before` is `null` on add and `after` is `null` on delete.

## 4. What "after commit" looks like in code

The listener is in `xyz.erupt.webhook.service.EruptWebhookService`: three methods, all on `AFTER_COMMIT`:

```java
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
public void onEdit(EruptEditEvent<Object> event) {
    this.dispatch(event.getEruptClass(), WebhookEvent.UPDATE, event.getBefore(), event.getSource());
}

private void dispatch(Class<?> clazz, WebhookEvent event, Object before, Object after) {
    if (!subscribable(clazz)) return;
    List<EruptWebhook> matches = this.subscriptions().stream()
            .filter(it -> it.getEvents().contains(event) && this.subscribes(it, clazz.getSimpleName()))
            .toList();
    if (matches.isEmpty()) return;
    EruptModel eruptModel = this.resolve(clazz);
    if (null == eruptModel) return;
    try {
        // everything that depends on the request thread (user, masking) is captured here, before the handoff
        JsonElement beforeJson = this.masked(eruptModel, before);
        JsonElement afterJson = this.masked(eruptModel, after);
        String recordId = this.recordId(eruptModel, null == afterJson ? beforeJson : afterJson);
        JsonObject payload = this.envelope(event.name(), eruptModel, recordId);
        payload.add("before", beforeJson);
        payload.add("after", afterJson);
        String body = payload.toString();
        for (EruptWebhook webhook : matches) {
            executor.execute(() -> this.record(webhook, eruptModel.getEruptName(), event, recordId, body, this.deliver(webhook, body)));
        }
    } catch (Exception e) {
        // a webhook must never take the change itself down
        log.warn("erupt-webhook: failed to dispatch {} of {}: {}", event, clazz.getSimpleName(), e.getMessage());
    }
}
```

Three details are worth pointing at:

- **`fallbackExecution = true`.** With no active transaction the event still fires instead of being silently dropped for having nothing to wait for.
- **Anything tied to the request thread is captured before the handoff.** The operator (`MetaContext.getUser()`) and the whole-row serialisation (`EruptUtil.toMaskedJson`) are done synchronously in `dispatch`; the background thread receives a finished string.
- **The deliverer can never take the business down.** The whole block is wrapped in `try/catch` and only logs a `warn`; delivery runs on two daemon threads, and the request thread only matches and serialises.

:::tip A small counter-intuitive point
Retries don't happen "in the request", and **what is signed is the final byte string**: `sign(secret, body)` runs over the UTF-8 bytes of `payload.toString()`, and resending a logged delivery (`redeliver`) reuses the very `payload` stored in the log, so the receiver always verifies the same bytes. The test `resendPostsTheStoredPayloadAgain` asserts that a resend is identical to the original, character for character.
:::

## 5. The subscription is an `@Erupt` table too

`EruptWebhook` has almost no "special UI". It is a combination of annotations covered in earlier issues:

```java
@Erupt(
        name = "Webhook",
        orderBy = "createTime desc",
        dataProxy = EruptWebhookDataProxy.class,
        drills = @Drill(title = "Deliveries", icon = "fa fa-list-ul",
                link = @Link(linkErupt = EruptWebhookLog.class, joinColumn = "webhookId")),
        rowOperation = @RowOperation(code = "ping", title = "Send Test", icon = "fa fa-paper-plane",
                mode = RowOperation.Mode.SINGLE, operationHandler = EruptWebhookDataProxy.class)
)
@Entity
@Table(name = "e_webhook")
public class EruptWebhook extends HyperModelUpdateVo {

    @EruptField(edit = @Edit(title = "Secret", type = EditType.PASSWORD))
    private String secret;

    @JdbcTypeCode(SqlTypes.JSON)
    @EruptField(edit = @Edit(title = "Events", notNull = true, type = EditType.MULTI_CHOICE))
    private Set<WebhookEvent> events = EnumSet.allOf(WebhookEvent.class);

    @EruptField(edit = @Edit(title = "All Models", notNull = true, boolType = @BoolType(type = BoolType.Type.SWITCH)))
    private Boolean allModels = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @EruptField(edit = @Edit(title = "Models", type = EditType.MULTI_CHOICE,
            dynamic = @Dynamic(dependField = "allModels", condition = "!value", match = Dynamic.Ctrl.NOTNULL),
            multiChoiceType = @MultiChoiceType(type = MultiChoiceType.Type.TRANSFER, fetchHandler = WebhookEruptChoice.class)))
    private Set<String> erupts;
    // …
}
```

Every "feature" here lands on an existing extension point:

- **"Send a test."** One `EruptWebhookDataProxy` implements `DataProxy`, `OperationHandler` (the row button, testing the saved row) and `EruptButtonHandler` (the form button, testing **the values currently typed**, so the URL can be checked before saving). On an edit form the secret is a placeholder, so `click` reads the real one back from the database.
- **The model transfer box** gets its options from `WebhookEruptChoice`, an ordinary `fetchHandler`.
- **The "All Models" switch hides the picker** with `@Dynamic`, but the required check lives in `EruptWebhookDataProxy#validate` — the code comment is blunt: the form only hides the picker, so the required check must be on the server.
- **The delivery log** `EruptWebhookLog` has `Power(add = false, edit = false)`: read, filter, export, and "Resend" (`WebhookResendHandler` is an `OperationHandler`).

There is not one line of webhook-specific UI. The subscription list, the log drill-down and the test button are all rendered from annotations.

## 6. How does this compare with Yida / Jiandaoyun / Mingdao?

We have not tested these platforms item by item. The left column below lists **questions worth asking during selection**, not verdicts on them; check each platform's official documentation and try it yourself.

| Dimension | Domestic platforms: what to ask | Erupt |
|---|---|---|
| Where it is triggered | In Yida, Jiandaoyun or Mingdao, is "call an API on data change" configured on one form or one flow, or is it a platform-level subscription? Does a new table need it configured again? | One subscription can cover "All Models", except the module's own two tables (`subscribable`) |
| When the notification goes out | Does the callback happen before or after the data is stored? Is a rolled-back write announced? | `AFTER_COMMIT`; a rollback notifies no one |
| The request thread | Does a slow receiver slow down the user's save? | Two background threads deliver; the request thread only serialises |
| Verification | Can the receiver verify the caller? | `X-Erupt-Signature: sha256=` HMAC-SHA256; the secret is never shown back |
| Failure visibility | After a failure, can you see the response and resend with one click? | The log holds status, response, attempts and full payload, and can be resent |
| Sensitive fields in the payload | Are password-type fields sent out? | `PASSWORD` fields (including nested `COMBINE` structures) are replaced with a placeholder |

## 7. Getting started in 5 minutes

The whole flow from an empty project to a reachable admin page is its own page:

**→ [Quick Start](/guide/quick-start)**

`erupt-webhook` is optional: on top of `erupt-upms`, add the `xyz.erupt:erupt-webhook` dependency; no yaml is required. After startup a "Webhook" entry appears in the management menu — create a subscription, click "Send Test", then open "Drill → Deliveries" to see every delivery.

## 8. The costs, and what's next

We won't hide these; each can be matched against the source:

- **There is no durable queue.** Delivery jobs sit in an in-memory pool. If the process restarts mid-retry those deliveries are gone — neither retried nor logged (the log row is written after a delivery finishes). For "at least once" needs, treat the receiver as best-effort and reconcile with `recordId`.
- **Three chances, not infinite.** After that only a failure row is kept, and an administrator must "Resend" by hand.
- **The subscription cache refreshes on the local node only.** `refresh()` clears the `enabled` list in this process; in a multi-node deployment other nodes see a new subscription only when their own cache is cleared.
- **Masking covers `PASSWORD` only.** `EruptUtil.maskPasswordFields` handles `EditType.PASSWORD` (and nested `COMBINE`); phone numbers and ID numbers go out as they are — don't subscribe a whole table that holds them.
- **Only three events.** There is no conditional "when this field becomes that value" subscription; filtering is left to the receiver.

Next we change direction: in the last two weeks `erupt-sso` gained SAML 2.0 (#401), and tenants can use sign-in providers of their own (#424). `SsoSamlService` is about 400 lines, and the `pom.xml` of `erupt-sso` has nothing besides `erupt-upms` — no SAML library. **Which steps of an enterprise sign-in protocol are the hardest to get right, and why we chose to walk them ourselves** — and where it stops next to DingTalk and Feishu QR sign-in.

---

:::info Join the discussion
Source for this issue: `erupt-plugin/erupt-webhook/.../service/EruptWebhookService.java`, `model/EruptWebhook.java`, `model/EruptWebhookLog.java`, `handler/EruptWebhookDataProxy.java`, `handler/WebhookResendHandler.java`, `erupt-core/.../service/EruptModifyService.java` (where the events are published), `erupt-core/.../util/EruptUtil.java` (`toMaskedJson`), and `erupt-test/.../webhook/WebhookTest.java`.

Whether subscriptions should get field conditions, and whether to offer a durable delivery queue, are open questions — cast a vote in [GitHub Discussions](https://github.com/erupts/erupt/discussions).
:::
