# Login & Operation Logs

Together the two logs answer the three audit questions: **who logged in, who changed what, and did it break.** Both are read-only lists with search and export. The delete button appears only for super admins.

## Login Log

One record per successful login:

| Field | Description |
| --- | --- |
| Account / Login Time | |
| IP Address / IP Source | Resolved to "Country \| Province \| City \| ISP" |
| OS / Browser / Device Type | Parsed from the User-Agent |

IP geolocation uses the bundled offline ip2region database, on by default with no network access. Point `erupt.upms.ip2region.path` at a newer xdb file, or set `enable: false` to skip lookups.

## Operation Log

Records every data write by a user, plus any API annotated with `@EruptRecordOperate`:

| Field | Description |
| --- | --- |
| Operator / IP / IP Source | |
| Function Name | Such as `UPDATE \| Order Management`: operation type, then menu name |
| Before Data | For edits and deletes, the full object before the change, pretty-printed JSON |
| Req Param | The request body or URL parameters submitted |
| Is Success / Error Info | On failure the stack trace is saved (truncated to 4000 characters) |
| Req Time | Milliseconds, sortable, for spotting slow operations |
| URL / Method | |

Operation types recorded by default:

| Type | Trigger |
| --- | --- |
| `INSERT` | Adding data |
| `UPDATE` | Editing, inline cell edits, batch edits |
| `DELETE` | Deleting data |
| `FORM-VIEW` | Form view submissions |
| Row operation | Custom `@RowOperation` actions, named by their title |

### Recording Your Own APIs

Add `@EruptRecordOperate` to a REST endpoint and it lands in the operation log:

```java
@PostMapping("/sync-order")
@EruptMenuAuth("order_sync")
@EruptRecordOperate("Sync orders")
public R<Void> syncOrder(@RequestBody SyncBody body) { ... }
```

### Configuration

```yaml
erupt:
  security:
    record-operate-log: true              # false disables recording
    record-operate-log-max-body-size: 1048576  # bodies over 1MB are not buffered
```

## As an Analytics Source

`EruptLoginLog` and `EruptOperateLog` both carry `@EruptCube`, with account, IP region, function name and duration already declared as dimensions and measures. With [erupt-cube](/en/modules/pro/erupt-cube) you can drag-and-drop straight away: which function fails most, when logins peak, which operations are slowest.
