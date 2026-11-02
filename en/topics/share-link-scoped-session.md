---
title: "SessionScopeGuard × DataProxy × FilterHandler: A Public Link Should Not Be a Second Auth System"
description: "Public forms in Jiandaoyun, Mingdao and DingTalk Yida are usually an anonymous channel beside the login system. erupt-share does the opposite: opening a link mints an ordinary session in the issuer's name, then a whitelist narrows it to one form. This issue explains the trade-offs."
outline: deep
---

# Issue 26 · A Public Link Should Not Be a Second Auth System

> The easiest way to let a stranger submit data is an anonymous endpoint, and that leaves your back office with a permission path nobody audits. `erupt-share` does the opposite: **a link is not a new identity, it is a narrowing of the issuer's identity**. The stranger holds an ordinary Erupt session, with a 403 standing next to it.
>
> _Published 2026-11-02 · ~9 min read_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt WeChat Official Account" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · Official Account</div>
    <div class="topic-mp-qr__title">Follow the Erupt Official Account</div>
    <p class="topic-mp-qr__desc">Each issue debuts here, along with release notes, source-code deep dives, and community case studies.</p>
  </div>
</div>

[[toc]]

## 1. Why this issue

Sign-up sheets, surveys, ticket forms: sooner or later a back office has to open one form to people with no account. The usual answer among Chinese platforms is a separate public channel:

- **Jiandaoyun / Mingdao**: a form can produce a public fill-in link, with limits such as validity period and submission count; data lands in the app's own table.
- **DingTalk Yida**: a form can be shared for outside submission; data enters the same app's form instances.

We have not seen how these are built and will not judge them. What we can state is our own constraint: Erupt's permissions are **menu + button + data scope**, enforced in one place by `EruptSecurityInterceptor`. An extra anonymous endpoint means asking, for every new endpoint, "can an anonymous caller reach this?"

So the thesis of `erupt-share` is:

> **A public link = an ordinary session minted in the issuer's name + a guard that only knows a whitelist.** No new authentication system, only one new narrowing hook.

## 2. Three approaches

| Approach | What the stranger holds | New attack surface |
|---|---|---|
| Anonymous endpoint (a public route without `@EruptRouter`) | No identity | Each public endpoint checks for itself |
| Guest account (create an `EruptUser` per stranger) | A low-privilege user | Account sprawl, cleanup |
| **Narrowed session (erupt-share)** | The issuer's session, with menus cut down to what the target needs | One guard + one route whitelist |

The point of the third: the session is a real session going through the same interceptor. What it can do is decided by two layers: only the menus the target needs are granted at minting time, then a guard checks the path on every request.

## 3. Countable facts about one link

One row of `EruptShareLink` (table `e_share_link`) is one link. Every field is an `@EruptField`, so the admin UI is generated from annotations:

- `code`: 22 random alphanumerics (`CODE_LENGTH = 22`), the only secret in the URL;
- type: `FORM` (anyone may submit) or `PAGE` (anyone may read a tpl page);
- a required `expireTime`; optional `maxVisits`, optional password, an `enabled` switch;
- the password is stored only as a salted SHA-512 digest, **with the link code as salt**, so equal passwords never share a digest; the form's password field is `@Transient`, so the digest never reaches the browser;
- three `erupt.share` properties: `session-minutes` (default 120), `max-attempts` (default 20), `attempt-window-minutes` (default 10).

Issuing and display use only existing extension points:

```java
@Erupt(
        name = "Share Link",
        orderBy = "createTime desc",
        dataProxy = ShareLinkProxy.class,                     // DataProxy: issue the code, freeze the issuer
        filter = @Filter(conditionHandler = ShareScopeFilter.class), // FilterHandler: see only your own links
        power = @Power(export = false, importable = false),
        rowOperation = @RowOperation(code = ShareCopyLinkOperation.CODE, title = "Copy Link",
                icon = "fa fa-link", mode = RowOperation.Mode.SINGLE,
                callHint = "", operationHandler = ShareCopyLinkOperation.class) // OperationHandler: copy the full URL
)
@Entity
@Table(name = "e_share_link", indexes = @Index(columnList = "code", unique = true))
public class EruptShareLink extends HyperModelCreatorOnlyVo { /* ... */ }
```

The model picker `ShareEruptChoice` and page picker `SharePageChoice` are `ChoiceFetchHandler`s; the "Copy Link" button is an `OperationHandler`. The whole module uses interfaces that already live in `xyz.erupt.annotation.fun.*`.

## 4. Issuing: a link never grants more than its issuer has

Before saving, `ShareLinkProxy#beforeAdd` does four things: verifies the target, generates the code, freezes the issuer (`issuerId` / `issuerAccount` / `issuerName` / `tenantId`), and swaps the password for its digest. The check in `EruptShareService#verifyTarget` is the interesting part:

```java
// A form link: the model must be local, allow adding, and the issuer must hold both its menu and its "add" button
public static boolean canAdd(EruptModel model, Map<String, Boolean> menuValues) {
    if (null == model || model.isRemote() || !model.getErupt().power().add()) return false;
    String name = model.getEruptName();
    return menuValues.containsKey(name.toLowerCase())
            && menuValues.containsKey(UPMSUtil.getEruptFunPermissionsCode(name, EruptFunPermissions.ADD).toLowerCase());
}
```

Someone without the add right cannot even create the link (`No permission to share this model`); `PAGE` links are the same, limited to tpl pages in the issuer's own menus. **The ceiling of a link is its issuer's permission, with no second authorization table.**

## 5. Opening: mint a session, then narrow it

A visitor's two calls need no login, so `GET /erupt-api/share/meta/{code}` and `POST /erupt-api/share/exchange/{code}` in `EruptShareController` carry no `@EruptRouter`. The order inside `exchange`:

1. Failed attempts are counted per client IP; past `max-attempts` the call is refused.
2. The link must exist, be enabled, unexpired, under its cap, with the right password. Any failure bumps the counter.
3. The visit is counted with **one UPDATE statement** whose `where` includes `visitCount < maxVisits`: two visitors racing for the last slot cannot both win, and no lock is needed.
4. The session is minted: `issuerInfo` signs in as the issuer's account and tenant but with `setSuperAdmin(false)` and no roles, so **whoever the issuer is, a visitor is never an administrator**; menus are hand-built by `targetMenus`: for a form only the erupt's table menu and its ADD button.
5. Lifetime is the smaller of `session-minutes` and the link's remaining time; a `ShareScope` (type, erupt, path) is stored against the token.
6. A login-log row is written, named like `issuer [share code]`, recognizable in audits.

## 6. The guard: one interface, one route whitelist

The interceptor gains one hook. `xyz.erupt.security.scope.SessionScopeGuard` has a single method:

```java
public interface SessionScopeGuard {
    boolean allow(String token, HttpServletRequest request, EruptRouter eruptRouter);
}
```

`EruptSecurityInterceptor` walks all guards after the token is verified and the user registered, before the menu and erupt permission checks; any `false` is a 403. An ordinary login session has no scope, so every guard lets it through. `erupt-cloud-server` verifies tokens its own way, which is why `scopeAllows` is public: both share one set of rules.

`ShareScopeGuard` is an **explicit route table**. `FORM_ROUTES` lists the 22 paths a form needs: build, add, `init-value`, `onchange`, option and reference lookups, file upload. Each carries an `{erupt}` placeholder that must equal the erupt bound to the link (or one whose parent, declared in a request header, the interceptor has already verified as nesting it). Everything else is closed:

- no table query, no record read, no update, no export, no other erupt;
- a `PAGE` link allows exactly `path.equals(TPL + scope.getPath())`, not one character more.

:::tip The counterintuitive part
The whitelist does not "ban dangerous endpoints"; it "allows only the endpoints a form needs". A new endpoint is a 403 to public links by default, so **a new feature cannot become public by forgetting one line of validation**.
:::

Revocation reuses the same machinery: disabling or deleting a link calls `revokeSessions` from `ShareLinkProxy#afterUpdate` / `beforeDelete`, which scans by prefix and logs out every session minted from it.

## 7. How does it compare with Jiandaoyun / Mingdao / Yida?

We have not tested these products item by item. The middle column lists **questions worth asking when choosing**, not conclusions about them; defer to their official docs.

| Dimension | Domestic platforms: what to ask | Erupt |
|---|---|---|
| Where public-fill permissions come from | Jiandaoyun, Mingdao, Yida: is a public form on the same role system as the app? | Issuer's permission is the ceiling, checked by `verifyTarget` at creation |
| Access limits | Can expiry, count and password be combined, and can a link be switched off instantly? | `expireTime` required; `maxVisits`, password, `enabled` optional; disabling logs out issued sessions |
| Brute force | Are link codes and passwords rate limited per source? | 22-char random code; per-IP limit, 20 per 10 minutes by default |
| New endpoints public by default? | When the platform adds an API, does the anonymous channel need re-auditing? | 403 by default; `FORM_ROUTES` needs an explicit row |
| Where data goes | Which table holds submissions? | The target erupt's own table, `DataProxy` hooks fire as usual |

## 8. 5 minutes to get started

The full flow from an empty project to a working admin page has its own page:

**→ [Quick Start](/guide/quick-start)**

`erupt-share` is an optional module under `erupt-plugin`, and `erupt-spring-boot-starter-all` already includes it. To add it alone:

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-share</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

It depends on `erupt-upms` and `erupt-security` and needs no configuration; tune it with the three `erupt.share.*` properties.

## 9. Costs, and a preview of the next issue

- **A visitor session is the issuer's session.** It has no roles, is never an administrator and its menus are narrowed, but the creator recorded on written data is the issuer. To tell who submitted, add a field to the form yourself.
- **The guard only acts on link sessions.** Ordinary login sessions are untouched; that is by design.
- **Sessions expire.** 120 minutes at most by default, never beyond the link's remaining life.
- **Remote models are not supported.** An erupt where `model.isRemote()` is true cannot be shared.

Next issue goes back to the data layer: main-repo #447 adds "batch edit" to lists: select rows, write one value to one field at once. It looks like `UPDATE ... WHERE id IN (...)`; in the source it **runs every row through the existing cell-edit pipeline**: validation, row-level permission, `DataProxy` hooks, operation log, and one rejected row rolls back the batch. **Why a batch operation must not bypass the pipeline** is next.

---

:::info Join the discussion
Source covered this issue: `erupt-plugin/erupt-share/.../model/EruptShareLink.java`, `handler/ShareLinkProxy.java`, `service/EruptShareService.java`, `service/ShareScopeGuard.java`, `controller/EruptShareController.java`, plus `erupt-security/.../scope/SessionScopeGuard.java` and `interceptor/EruptSecurityInterceptor.java`.

How tight should the public-link whitelist be? Tell us in [GitHub Discussions](https://github.com/erupts/erupt/discussions).
:::
