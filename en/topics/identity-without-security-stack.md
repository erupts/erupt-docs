---
title: "A Login Chain Without Spring Security"
description: "Wiring SSO into an admin framework usually means pulling in spring-security-oauth2-client, writing a SecurityFilterChain, and picking a JWT library. Erupt pulled in none of them — this issue walks the login chain it built end to end, and the three choke points that bought."
outline: deep
---

# Issue 13 · A Login Chain Without Spring Security

> Chinese admin frameworks handle identity along almost the same path: pull in Spring Security or Sa-Token, configure a `SecurityFilterChain`, add `spring-security-oauth2-client` for OAuth2, then pick a JWT library to validate the id_token. Erupt pulled in none of them. That isn't a taste for reinventing wheels — it's because once the login chain is split across Filters and third-party starters, there is no longer any way to guarantee that "is this account usable" is decided in exactly one place across the whole system.
>
> _Published 2026-09-21 · ~11 min read_

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

Over the past two weeks the Erupt main repo merged a set of commits that look unrelated: a new plugin module `erupt-plugin/erupt-sso`, TOTP two-factor verification, login-failure lockout, kicking other sessions on password change, and CIDR masks in the IP whitelist.

In the changelog they read as five parallel features. But they all change the same thing — **what earns a request its token**.

And in the vast majority of Java admin frameworks, that question no longer belongs to the framework itself. RuoYi hands it to Spring Security, JeecgBoot hands it to Shiro, and OAuth2 stacks another layer of `spring-security-oauth2-client` on top. The upside of that road is real: someone else maintains the protocol details. The cost is just as real, and rarely spelled out:

**Login stops being a line and becomes a web.** Password login goes through an `AuthenticationProvider`, SSO login through `OAuth2LoginAuthenticationFilter`, LDAP through yet another Provider. Each has its own notion of "success". So checks like "has this account expired" or "is this IP allowed in" either get copied into every branch, or land in some `UserDetailsService` — which the OAuth2 branch never passes through at all.

Erupt bets the other way: **don't outsource the login chain, and in exchange get two physically unique choke points.** One place decides whether an account is usable; one place issues the token. Whether you arrive via password, TOTP, SSO, or a custom `LoginProxy`, you have to thread through both of these needle eyes.

## 2. Two Approaches: Delegate to a Filter Chain, or Funnel Into One Service

| | Delegate to a security framework (Spring Security / Shiro) | Funnel into one Service (Erupt) |
| --- | --- | --- |
| Login entry point | One Filter / Provider per authentication method | One `EruptUserService`; every other path calls it |
| Account usability (status / validity / IP) | Scattered across Providers; the OAuth2 branch often bypasses it | `checkAccountUsable` in one place; both the password and SSO paths call it |
| Issuing the token | Each branch lands in `SecurityContextHolder` on its own | `completeLogin` in one place |
| Adding an SSO provider | Edit yaml / Java config → restart | Add a row in the admin form → takes effect immediately |
| Protocol details | Maintained by the starter; upgrades track Spring | Self-maintained, ~500 lines, authorization code + PKCE only |
| Customization cost | Understand the Filter chain order first | Implement one default method of `LoginProxy` |

The second column isn't "better" — it's **a different trade-off**: Erupt gives up protocol breadth (no implicit flow, no client credentials, no resource server) in exchange for a login chain you can read from start to finish.

The cost goes up front: if your system needs to be an **OAuth2 authorization server**, needs SAML, or needs method-level `@PreAuthorize`, Erupt's road won't get you there — go with Spring Security. Erupt solves a different scenario: **the admin system itself needs to be logged into.**

## 3. How Many Gates Are Actually on This Chain

Start with the countable facts. The entire login chain lives in two modules, `erupt-upms` and `erupt-plugin/erupt-sso`:

| Gate | Where it lives | Configurable via |
| --- | --- | --- |
| Login lockout (account + IP) | `EruptUserService#isLoginLocked` | `erupt.upms.login-lock.*` |
| Image captcha | `EruptUserService#loginErrorCountPlus` | `erupt-app.verify-code-count` |
| Account status / validity / IP whitelist | `EruptUserService#checkAccountUsable` | Three fields on the user form |
| Password check (SHA-512 + salt) | `EruptUserService#checkPwd` | `erupt-app.pwd-transfer-encrypt` |
| TOTP two-factor verification | `EruptMfaService#verifyForLogin` | `erupt-app.mfa.*` |
| External identity provider | `EruptSsoService#callback` | Each row of the `EruptSso` table |
| Issue token + write login log | `EruptUserService#completeLogin` | `erupt.upms.expire-time-by-login` |

Seven gates, two modules, zero security-framework dependencies. The `pom.xml` of `erupt-sso` has a single `provided` dependency: `erupt-upms`.

## 4. An SSO Provider Is a Table Row, Not a Block of yaml

Connecting a new identity provider in Erupt isn't editing a config file — it's clicking "Add" in the admin UI, because the provider itself is an `@Erupt` entity:

```java
@Entity
@Table(name = "e_upms_sso")
@Erupt(
        name = "SSO Provider",
        orderBy = "EruptSso.sort asc",
        dataProxy = EruptSsoDataProxy.class,
        layout = @Layout(formSteps = true),
        dragSort = @DragSort(field = "sort")
)
@EruptI18n
public class EruptSso extends MetaModelUpdateVo {

    @Column(length = 512)
    @EruptField(
            edit = @Edit(title = "Issuer", desc = "OIDC issuer; endpoints below are discovered from it when left empty",
                    inputType = @InputType(fullSpan = true))
    )
    private String issuer;

    // No @View: a client secret is write only, the framework masks the form value
    // and restores the stored one when the mask comes back unchanged
    @Column(length = 512)
    @EruptField(
            edit = @Edit(title = "Client Secret", notNull = true, type = EditType.PASSWORD)
    )
    private String clientSecret;

    @Column(length = 64)
    @EruptField(
            edit = @Edit(title = "Account Claim", notNull = true,
                    desc = "Claim matched against an erupt account on first login, e.g. preferred_username")
    )
    private String accountClaim = "preferred_username";

}
```

This has several direct consequences, none of them promises in a design doc — they come for free simply "because it's an `@Erupt` entity":

- **No restart.** Add a row, and the login page grows one more button immediately.
- **The client secret never leaks by construction.** It has no `@View`, so it never appears in the list; `EditType.PASSWORD` makes the edit form echo back only a mask, and the real value is never sent down (see the [PASSWORD component](/en/field-types/password)). That isn't logic the SSO module wrote — it's existing framework behavior.
- **Who changed this row is recorded.** It goes through the same [operation log](/en/modules/erupt-upms/log).
- **Who may change this row is configurable.** The same [menu permissions](/en/modules/erupt-upms/role).

Leave `issuer` empty and the three endpoints are discovered from `/.well-known/openid-configuration` per the OIDC spec, then cached; fill in `authorizeUrl` / `tokenUrl` / `userInfoUrl` and they're used directly — the latter is for pure OAuth2 providers like GitHub and Gitee that **have no discovery document**.

:::tip A counterintuitive decision: we never read the id_token
Decoding claims straight out of the id_token is the most "standard" OIDC usage, and the only reason to bring in a JWT library. `EruptSsoService` doesn't do it — it spends the access token on exactly one call: the provider's userinfo endpoint.

The cost is one extra HTTP round trip per login. The payoff: **OIDC providers (Keycloak, Authing, Okta) and pure OAuth2 providers (GitHub, Gitee) take the same code path**, and there's no JWT library in the dependency tree — so none of that signature-verification code, the kind that has gone wrong again and again throughout history, is ours to get right.
:::

Chinese providers such as Feishu, WeCom, and DingTalk have a third shape: userinfo returns not the claims themselves but an envelope — `{code, msg, data:{...}}` — and the HTTP status is always 200. `EruptSsoService#unwrap` opens the envelope and treats a non-zero `code` as failure; otherwise a business error would silently pass as an empty set of claims.

## 5. No Token in the URL, No Back Door Around the Checks

The easiest place to get an SSO callback wrong is **after login succeeds**. The provider redirects the browser back; the server now knows who you are. How does it hand that knowledge to the frontend?

The lazy way is to redirect to `/#/login?token=xxx`. Now that token sits in browser history, in the Referer, and probably in the reverse proxy's access log.

Erupt takes two steps: the callback issues only a 60-second, single-use **ticket**; the frontend then trades the ticket for the real `LoginModel` with one `POST /erupt-api/sso/exchange`.

```java
public String callback(String providerCode, String state, String authCode, HttpServletRequest request) {
    Object raw = sessionService.get(SsoSessionKey.SSO_STATE + state);
    sessionService.remove(SsoSessionKey.SSO_STATE + state); // single use, whatever happens next
    Erupts.requireNonNull(raw, I18nTranslate.$translate("sso.state_invalid"));
    SsoState payload = GsonFactory.getGson().fromJson(raw.toString(), SsoState.class);
    EruptSso sso = this.findEnabled(providerCode);
    // the state was issued for one provider; a code replayed against another must not pass
    Erupts.requireTrue(sso.getId().equals(payload.getSsoId()), I18nTranslate.$translate("sso.state_invalid"));

    Endpoints endpoints = this.endpoints(sso);
    String accessToken = this.exchangeCode(sso, endpoints, authCode, payload.getVerifier(), request);
    JsonObject claims = this.userInfo(endpoints, accessToken);
    EruptUser eruptUser = transactionTemplate.execute(status -> this.resolveUser(sso, claims));

    String reason = eruptUserService.checkAccountUsable(eruptUser);
    if (null != reason) throw new EruptWebApiRuntimeException(reason);

    LoginModel loginModel = new LoginModel(true, eruptUser);
    eruptUserService.completeLogin(loginModel, EruptUserService.findEruptLogin());
    String ticket = Erupts.generateCode(32);
    sessionService.put(SsoSessionKey.SSO_TICKET + ticket, GsonFactory.getGson().toJson(loginModel), TICKET_EXPIRE_SECONDS, TimeUnit.SECONDS);
    return ticket;
}
```

The lines that actually earn their keep in this block are the two just above the ticket: `checkAccountUsable` and `completeLogin`.

**An external identity provider saying who you are doesn't mean you may come in.** Account disabled, account expired, source IP not in the whitelist — password login has to pass these three gates, and so does SSO login, calling the very same method. This is the "needle eye" from Section 1: if SSO wrote its own login-success logic, sooner or later one of those three gates would go missing.

The same goes for `state`: it carries no payload; it is just a key to a short-lived server-side record, burned after use, and the record stores which provider it was issued for — otherwise an authorization code from provider A could be replayed against provider B's callback. The PKCE verifier lives in that record too, never passing through the browser.

## 6. How Does It Compare to JeecgBoot / RuoYi / Yida?

| Dimension | JeecgBoot (Shiro) | RuoYi (Spring Security) | DingTalk Yida | **Erupt** |
| --- | --- | --- | --- | --- |
| Add an OAuth2 provider | Edit config + write a Controller, restart | Integrate `oauth2-client` yourself | Impossible: identity can only be DingTalk | Add a row in the admin form, no restart |
| Account usability check | In the Realm; the SSO branch easily bypasses it | `UserDetailsService`; the OAuth2 branch skips it | Not exposed | `checkAccountUsable` as the sole entry point |
| Two-factor verification | Integrate yourself | Integrate yourself | Via DingTalk | Built-in TOTP, `erupt-app.mfa.enable` |
| Login-failure lockout | Yes (per account) | Yes (per account) | Platform side | Per account + IP |
| IP whitelist | Implement yourself | Implement yourself | Enterprise policy | User form field, CIDR supported |
| Token in the URL? | Depends on implementation | Depends on implementation | — | No; exchanged via a single-use ticket |
| Security framework dependency | shiro-spring | spring-security-* | — | None |

A few of these differences deserve to be pulled out on their own, because they are about "getting the details right" rather than "having the feature".

**First: the lockout key is `account + IP`, not `account`.**

```java
// Consecutive wrong passwords for one account from one IP before the pair is locked.
// Keyed by account + IP rather than account alone, so an attacker cannot lock a user
// out of their own machine by hammering the account from elsewhere
private int maxFailures = 10;
```

Locking per account is common, but it turns the protection into a weapon: know someone's employee ID and you can keep them out for ten minutes. Locking per pair means an attacker can only lock out their own IP.

**Second: TOTP single-use is implemented in-house.** A 6-digit code is valid for the entire 30-second step, which means anyone who glances at your phone has 30 seconds to use it. `EruptMfaService#markCounterUsed` records consumed counters in the session store, and the same counter showing up a second time is rejected outright:

```java
private boolean markCounterUsed(Long uid, long counter) {
    String key = SessionKey.MFA_USED + uid + ":" + counter;
    if (sessionService.exist(key)) return false;
    long ttl = (long) (eruptAppProp.getMfa().getWindow() * 2 + 2) * TotpUtil.PERIOD;
    sessionService.put(key, "1", ttl, TimeUnit.SECONDS);
    return true;
}
```

Alongside it: 10 recovery codes, single-use, stored as SHA-256 hashes; during enrollment the secret lives only in the session, so a user who never completes the scan leaves no half-configured account in the database; failures on a ticket are counted separately, so a stolen ticket can't be brute-forced at leisure.

**Third: the IP whitelist is strict enough to reject `127.1`.** `xyz.erupt.upms.util.IpWhiteListMatcher` parses both sides into canonical bytes before comparing, so `::ffff:192.168.0.5` equals `192.168.0.5`; it also rejects hostnames, zone IDs (`fe80::1%eth0`), IPv4 shorthand, and octets with leading zeros, and **the entire parse performs no DNS lookup whatsoever** — a login check should never give external DNS a chance to influence the verdict.

:::info In passing: changing a password kicks other sessions
Both `ResetPasswordExec` and self-service password change call `eruptTokenService.logoutOtherTokens(account, currentToken)`: the current session stays, every other token for that account is invalidated. It's the only default that makes sense when "the password may have leaked", yet it's missing in many admin systems — change the password, and old sessions live on until they expire.
:::

## 7. Up and Running in 5 Minutes

From an empty project to a reachable admin page, the full flow is its own page:

**→ [Quick Start](/en/guide/quick-start)**

That page covers Maven dependencies, application.yml, the first `@Erupt` entity, the default login account, and Docker / K8S deployment.

Two things in this issue are module-specific. SSO needs its own plugin dependency (already included in `erupt-spring-boot-starter-all`):

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-sso</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

When the callback URL is left empty it defaults to `http(s)://<current host>/erupt-api/sso/callback/<code>`; paste it as-is into the provider's console. You only need to override it explicitly in the form when sitting behind a reverse proxy or when the public domain differs.

Two-factor verification and login lockout need no extra dependency and are enabled by default; tune as needed:

```yaml
erupt-app:
  mfa:
    enable: true      # only opens the feature, does not force anyone to enroll
    issuer: ""        # name shown in the authenticator app; empty falls back to spring.application.name
    window: 1         # number of time steps tolerated, absorbs client clock drift
erupt:
  upms:
    login-lock:
      enable: true
      max-failures: 10
      lock-minutes: 10
```

Note what `mfa.enable` defaulting to `true` means: it **only opens the entry point** and does not force existing users to enroll, so upgrading locks nobody out.

---

:::info Join the discussion
Source for this issue: `erupt-plugin/erupt-sso/` (`EruptSso`, `EruptSsoBind`, `EruptSsoService`), `erupt-upms/src/main/java/xyz/erupt/upms/service/EruptMfaService.java`, `xyz/erupt/upms/util/IpWhiteListMatcher.java`, `xyz/erupt/upms/service/EruptUserService.java`.

If you've wired up a less common provider, or tripped over an envelope format, come post on [GitHub Discussions](https://github.com/erupts/erupt/discussions) — we'd love to collect more real-world samples of claim mappings.
:::
