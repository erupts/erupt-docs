# Erupt Webhook Outbound Webhooks

erupt-webhook pushes changes on the erupt data pipeline to external systems: an administrator subscribes a URL in the admin UI, picks the models and events to watch (add / update / delete), and from then on every **committed** change is POSTed there as a JSON payload — optionally signed with HMAC-SHA256, with custom headers, automatic retries and one log row per delivery. No code to write, and no business model needs a new field.

> Minimum version: **2.4.0**

## Setup

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-webhook</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

`erupt-spring-boot-starter-all` already includes this module, so projects on starter-all need not add it. The module depends on `erupt-upms` (and therefore `erupt-data-jpa`); subscriptions and logs live in two tables of their own on the server.

Auto configuration adds a **Webhook** menu under **System Management**. The delivery log is reached through the "Deliveries" drill on a webhook row; its own menu is hidden and only grants the permission.

:::info
Deliveries are fired by the data pipeline's events (`EruptAddEvent` / `EruptEditEvent` / `EruptDeleteEvent`), the same source as [Event Listener](/en/advanced/event-listener). Writes through the admin UI, the REST API and `EruptModifyService` all fire; writing the table directly with JPA or SQL, bypassing erupt, does not.
:::

## Configuring a Subscription

![New webhook subscription](/webhook/webhook-edit.png)

**System Management → Webhook → Add**; one record is one subscription:

| Field | Description |
| --- | --- |
| Name | The subscription's name, also written into every log row |
| URL | The receiver; must start with `http://` or `https://` |
| Secret | Optional. When set, every delivery carries an `X-Erupt-Signature` header; a password field, never shown back once saved |
| Events | Multi-select of `Add` / `Update` / `Delete`; a new form starts with all of them ticked |
| Enabled | Switched off, the subscription is kept but stops firing |
| Headers | Key-value pairs attached verbatim to every request, e.g. an `Authorization` the receiver expects |
| Send Test | A form button that posts a `PING` with the values as typed, so the endpoint is checked before saving |
| All Models | On, every registered model fires without picking them one by one |
| Models | Shown when All Models is off: a searchable transfer, at least one model is then required |
| Remark | Free text |

Saving validates the URL scheme and, with All Models off, that at least one model is picked. The module's own two tables (Webhook, Webhook Log) never fire a webhook, not even for a subscription to every model. Remote models served by an [erupt-cloud](/en/modules/erupt-cloud) node are not offered in the picker.

The table shows each row's subscribed **Models** and **Events** as tag columns, with two entries per row:

- **Send Test**: a row operation that posts a `PING` for the saved subscription; on success it reports "Test delivered: HTTP 200 in N ms", on failure the status code and response
- **Deliveries**: drills into the subscription's delivery log

:::tip
Subscriptions added, edited or deleted through the menu take effect immediately, no restart needed: the server caches the list of enabled subscriptions and reloads it after every change.
:::

## Payload

Once the transaction has committed, the change is assembled into one JSON object and sent as a `POST` with `Content-Type: application/json; charset=utf-8`:

```json
{
  "id": "6f1c2e4a-8d3b-4f0e-9a7c-2b5d8e1f3a90",
  "event": "UPDATE",
  "erupt": "Goods",
  "model": "Goods",
  "recordId": "1024",
  "operator": "admin",
  "timestamp": "2026-11-01T08:30:12.345Z",
  "before": { "id": 1024, "name": "Keyboard", "price": 199, "status": "ON_SALE" },
  "after":  { "id": 1024, "name": "Keyboard", "price": 159, "status": "ON_SALE" }
}
```

| Field | Description |
| --- | --- |
| `id` | UUID of this delivery, unchanged across retries; receivers can deduplicate on it |
| `event` | `ADD` / `UPDATE` / `DELETE`; `PING` for a test delivery |
| `erupt` | The model's class name, i.e. the `simpleName` of the `@Erupt` class |
| `model` | The raw `@Erupt(name)`, not translated |
| `recordId` | The record's primary key as a string |
| `operator` | Account of the user who made the change; `null` without a login context |
| `timestamp` | UTC time in ISO-8601 with a trailing `Z` |
| `before` | The record before the change; `null` on `ADD` |
| `after` | The record after the change; `null` on `DELETE` |

`before` / `after` are serialised the same way as erupt's public API: `PASSWORD` fields are replaced with the mask `••••••`, combined fields (COMBINE) are handled recursively, so a password never leaves the server.

A `PING` payload has no `erupt` or `model`, its `recordId` is `null`, and it carries an extra `"message": "erupt webhook test"`.

Every request also carries fixed headers:

| Header | Value |
| --- | --- |
| `User-Agent` | `erupt-webhook` |
| `X-Erupt-Delivery` | A UUID per HTTP request; changes on each retry |
| `X-Erupt-Signature` | Only when a secret is set, see below |

The subscription's own Headers are added on top.

## Verifying the Signature

With a secret set, the server computes HMAC-SHA256 over the **raw request body** (UTF-8 bytes), keyed by the secret's UTF-8 bytes, and writes the lowercase hex digest into the header:

```
X-Erupt-Signature: sha256=<hex(HMAC-SHA256(secret, body))>
```

The receiver recomputes it over the raw body it received with the same secret and compares it to the header, which proves the request came from erupt and was not altered in transit. Compute over the **raw bytes** — do not parse and re-serialise first. A Spring receiver, for example:

```java
@RestController
public class WebhookReceiver {

    private static final String SECRET = "your-secret";

    @PostMapping("/erupt/hook")
    public void receive(@RequestBody byte[] body,
                        @RequestHeader("X-Erupt-Signature") String signature) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String expected = "sha256=" + HexFormat.of().formatHex(mac.doFinal(body));
        if (!MessageDigest.isEqual(expected.getBytes(), signature.getBytes())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        // verified; parse the body now
    }

}
```

Without a secret the request carries no `X-Erupt-Signature`; such a receiver should only be exposed on an internal network or protected by a credential in Headers.

:::warning
The secret is never shown back once saved. Clicking Send Test in an edit form with the secret left blank or at its placeholder signs with the saved secret; a newly typed value signs with the new one.
:::

## Retries and Delivery Log

After the commit, deliveries are handed to a 2-thread background pool (`erupt-webhook`); the request thread never waits for the receiver, and a failed delivery or a receiver that is down never affects the change itself.

| Item | Rule |
| --- | --- |
| Success | HTTP 2xx |
| Attempts | Up to 3, with 1 s and then 5 s between them |
| Timeouts | 10 s to connect, 15 s per request |
| Protocol | HTTP/1.1, redirects followed |
| Response kept | The first 2000 characters of the body |

A subscription gets **one** log row per change, however many attempts it took; a status of `0` means no response arrived at all (connection refused, timeout, ...), and the Response column then holds the error message.

### Delivery log

Click **Deliveries** on a webhook row, or open the Webhook Log menu directly when granted:

| Column | Description |
| --- | --- |
| Webhook | The owning subscription's name |
| Model / Event / Record ID | The change that fired the delivery |
| URL | The address actually posted to |
| Result | Delivered / Failed |
| Status | HTTP status of the last response |
| Attempts / Duration (ms) | Total attempts including retries, and total time |
| Response | The receiver's response body (in the detail view) |
| Payload | The JSON exactly as sent (a code editor in the detail view) |
| Time | When the row was written |

The log is read-only: no add or edit, but delete and export are allowed.

### Resend

The **Resend** row operation on the log table posts the payload stored in that row **unchanged** (same `id` and `timestamp`) as a new delivery queued on the background pool, producing a new log row; it reports "N resent; refresh the log for the outcome". Resending is refused when the webhook the row belongs to has been deleted.

## Database Tables

### e_webhook

Extends `HyperModelUpdateVo` (which brings `id`, `create_time`, `create_user_id`, `update_user_id`, `update_time`):

| Column | Type | Description |
| --- | --- | --- |
| `name` | VARCHAR(100) | Name |
| `url` | VARCHAR(1024) | Receiver URL |
| `secret` | VARCHAR(255) | Signing secret |
| `events` | JSON | Subscribed events, e.g. `["ADD","UPDATE"]` |
| `enabled` | BIT(1) | Enabled |
| `headers` | VARCHAR(2000) | Custom headers as a JSON object |
| `all_models` | BIT(1) | All Models |
| `erupts` | JSON | Subscribed model class names, e.g. `["Goods","Order"]` |
| `remark` | VARCHAR(2000) | Remark |

Both set columns are stored as JSON through `@JdbcTypeCode(SqlTypes.JSON)`; there is no join table.

### e_webhook_log

Extends `BaseModel` (which brings `id`), indexed on `create_time` and `webhook_id`:

| Column | Type | Description |
| --- | --- | --- |
| `webhook_id` | BIGINT | Owning subscription id; the drill joins on it |
| `webhook` | VARCHAR(100) | Snapshot of the subscription name |
| `erupt` | VARCHAR(100) | Model class name |
| `event` | VARCHAR(64) | Event name, stored by enum name (`@Enumerated(STRING)`) |
| `record_id` | VARCHAR(100) | The record's primary key as a string |
| `url` | VARCHAR(1024) | Address posted to |
| `success` | BIT(1) | Delivered or not |
| `status` | INT | HTTP status; 0 when no response arrived |
| `attempts` | INT | Number of attempts |
| `duration` | BIGINT | Total time in milliseconds |
| `response` | VARCHAR(2000) | Response body |
| `payload` | LONGTEXT | The JSON payload as sent |
| `create_time` | DATETIME | When the row was written |

Projects with JPA schema generation enabled get the tables on upgrade; projects that maintain their schema by hand should create them from the tables above.
