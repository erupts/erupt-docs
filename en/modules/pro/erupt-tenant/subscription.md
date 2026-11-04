# Packages & Subscription

## Packages

Packages decide which features a tenant can use. Create a package in **Tenant Package**, pick menus from the platform's **Menu Management**, then assign packages to tenants in **Tenant Config** (a tenant can have several).

<img src="/tenant/tenant-package.png" width="900">

| Field | Description |
| --- | --- |
| Code | Globally unique |
| Name / Sort | Display |
| Status | A disabled package grants no menus and does not count toward trial days |
| Trial Days | A new tenant without an expire date gets the longest trial of its enabled packages |
| Menu Permissions | References the platform menu table `e_upms_menu` |

All sessions of a tenant (administrators included) only see the menus of its enabled packages, and its role editor can only grant those. Menus are maintained once in Menu Management; changing a package affects every tenant using it.

## Subscription

A tenant's subscription has one date: the **expire date** `expireDate`; empty means it never expires.

### Trial

A new tenant without an expire date gets the longest trial days of its enabled packages, counted from creation; if no package has trial days, no expire date is set.

### Status

The status is derived from the expire date and the grace days on every read, never stored:

| Status | Condition | Usable |
| --- | --- | --- |
| `Active` | Not yet expired, or no expire date | ✅ |
| `Grace` | Past the expire date but within `grace-days` | ✅ |
| `Expired` | Past the grace period | ❌ login refused |

The **Status** switch in Tenant Config (enabled / locked) is independent of the expire date: a locked tenant is refused regardless.

### Live sessions

If a tenant expires or is locked while its users are signed in, their sessions are logged out on the next request with `401`, and the front end returns to the tenant login page with the reason. To avoid a database read per request, the status is cached for `status-cache-seconds`; editing the tenant on the admin side evicts it immediately.

### Configuration

```yaml
erupt:
  tenant:
    subscription:
      grace-days: 7            # days a tenant keeps working after expiry, default 0
      status-cache-seconds: 30 # seconds the status is cached, default 30
```

### Renewal

erupt does not bill. Once your own payment logic receives a payment, call `TenantSubscriptionService#extend`:

```java
@Resource
private TenantSubscriptionService tenantSubscriptionService;

public void onPaid(Long tenantConfigId) {
    // extends from the current expire date; an expired tenant extends from now
    tenantSubscriptionService.extend(tenantConfigId, Period.ofYears(1), LocalDateTime.now());
}
```

### Reading the subscription

A tenant session can call `GET /erupt-api/tenant/info` for its tenant id, name, subscription status, expire date and enabled packages — e.g. to prompt for renewal in the UI.
