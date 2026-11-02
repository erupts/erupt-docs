# Erupt SSO Single Sign-On

erupt-sso lets erupt delegate login to an external identity provider: OIDC services such as Keycloak, Authing and Okta, platforms that only offer OAuth 2.0 such as GitHub, Gitee and Feishu, and SAML 2.0 identity providers such as AD FS and Microsoft Entra ID (2.4.0+). Providers are configured as rows in the admin UI under **System Management → SSO Provider** — pick a provider preset, paste the client credentials, and that is it: no code, no config file, no restart; the login page shows the button as soon as the row is saved.

> Minimum version: **2.3.0**; SAML 2.0 and tenant providers need **2.4.0**

The module runs the OAuth 2.0 authorization code flow with PKCE enforced. The code is exchanged on the server, the resulting access token is spent on exactly one user-info call, the `id_token` is never parsed, and no JWT library is pulled in. A SAML row speaks a different protocol: the browser posts back an assertion signed by the IdP, which is verified with the JDK's own XML signature API, again without a third-party library, see [SAML 2.0 Single Sign-On](#saml-2-0-single-sign-on).

## Setup

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-sso</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

`erupt-spring-boot-starter-all` already includes this module. It depends on `erupt-upms` and `erupt-data-jpa`; auto configuration adds an **SSO Provider** menu under **System Management** (plus a hidden **SSO Binding** menu, see below).

The module announces itself to the frontend through `registerProp("erupt-sso")`; the login page then fetches the provider list and renders the buttons. A system without the module keeps its login page unchanged and gains no second way in.

## How it works

```mermaid
sequenceDiagram
    participant B as Browser
    participant E as erupt backend
    participant P as Identity provider

    B->>E: GET /erupt-api/sso/authorize/{code}
    Note over E: Generate state + PKCE verifier<br/>state → {provider, verifier} stored server side (10 min)
    E-->>B: 302 → Authorize URL?response_type=code&client_id&redirect_uri<br/>&scope&state&code_challenge&code_challenge_method=S256
    B->>P: User signs in at the provider and consents
    P-->>B: 302 → /erupt-api/sso/callback/{code}?code&state
    B->>E: GET /erupt-api/sso/callback/{code}?code&state
    Note over E: Verify and burn the state
    E->>P: POST Token URL (code + code_verifier + client credentials)
    P-->>E: access_token
    E->>P: GET User Info URL (Bearer access_token)
    P-->>E: user claims
    Note over E: Binding by subject → match by account claim → auto create<br/>Check account status / expiry / IP whitelist
    E-->>B: 302 → login page?ssoTicket=<one-time ticket> (60 s)
    B->>E: POST /erupt-api/sso/exchange { ssoTicket }
    E-->>B: token (signed in)
```

Design points worth knowing:

- **The browser carries no trusted state**: `state` is only a key into a short-lived server record (provider + PKCE verifier) that is burnt on first use; a `state` issued for one provider cannot be replayed against another.
- **The token never travels in a URL**: after the callback the browser lands on the login page with nothing but a one-time ticket valid for 60 seconds, which the frontend trades for a session token via `POST /erupt-api/sso/exchange`. The token never appears in the address bar, browser history or a Referer header.
- **The return address is never taken from the request**: the callback always redirects to `erupt-app.login-page-path` (or `<host>/#/passport/login` when unset), so there is no open redirect.
- **Client authentication at the token endpoint** defaults to `client_secret_post`; HTTP Basic is used only when the OIDC discovery document says `client_secret_basic` is the only supported method.
- **Same pipeline as password login**: account status, expiry and IP whitelist checks, and the `LoginProxy` post-login hooks, apply to SSO logins too.

### Four exchange flows

The diagram shows the plain OAuth 2.0 case. What happens once the browser comes back with the `code` is decided by the row's **Provider Type**; there are four OAuth 2.0 flows (`SsoProviderType.Flow`), and a fifth, `SAML`, that verifies an assertion instead of exchanging a code, covered in [SAML 2.0 Single Sign-On](#saml-2-0-single-sign-on):

| Flow | Provider types | Exchange |
| --- | --- | --- |
| `OAUTH2` | Every OIDC preset, GitHub, Gitee, Feishu, Zoom, and Custom | As in the diagram: a form-encoded POST to the Token URL answered in JSON, then a bearer GET on the User Info URL |
| `DINGTALK` | DingTalk | The token request is a JSON POST, and the user token travels in DingTalk's own request header when `contact/users/me` is read |
| `WECOM` | WeCom | The corp access token (CorpID + Secret) resolves the `code` into a member userid, the profile is then read from the contact book; the sensitive fields (phone, email, avatar) unlocked by the `snsapi_privateinfo` user ticket are merged into the claims. A visitor outside the corp fails with "The account is not a member of the enterprise" |
| `WECHAT` | WeChat | Token and user info are both GETs with query parameters; the `openid` from the token response is passed on to the user-info call |

Rows created before 2.3.0 have an empty `type` column and behave as `OAUTH2`, unchanged.

## Configuring a provider

![SSO provider list](/sso/providers.png)

**System Management → SSO Provider**; every row is one provider. The usual order of filling it in: pick the matching preset in **Provider Type**, which fills the endpoints, scopes and claim fields; paste the Client ID / Client Secret from the provider's console; and for a self-hosted service replace the `<host>`, `<realm>`, `<agentid>` style placeholders left in the URLs, then save. Choosing **Custom** leaves every field to you and runs plain OAuth 2.0. The form has four groups:

### Basic

| Field | Description | Default |
| --- | --- | --- |
| Provider Type | 20 presets (Keycloak, Authing, Casdoor, Okta, Auth0, Microsoft Entra ID, Google, GitLab, Atlassian, Slack, Zoom, GitHub, Gitee, Feishu, DingTalk, WeCom, WeChat, plus the three SAML presets SAML 2.0, AD FS and Microsoft Entra ID (SAML)) plus **Custom**, see [Provider Presets](#provider-presets). Picking a preset fills in the icon, the issuer or the three URLs, the scopes, the account / name / email / phone / avatar claims and the Open ID Claim; the Code (the preset name in lower case, e.g. `keycloak`) and Name are only suggested into blank fields, never overwritten; the hints under Client ID / Client Secret switch to the provider console's own wording (Entra's "Application (client) ID", Feishu's "App ID"). Any `<placeholder>` a preset leaves in a URL must be replaced, otherwise the save is refused. The type also selects the login exchange, see [Four exchange flows](#four-exchange-flows) | Custom |
| Code | 2–32 letters, digits, `-` or `_`, unique. **Part of the callback URL**, so it cannot be edited after creation — changing it would silently break the callback registered at the provider | — |
| Name | Label of the button on the login page; i18n keys are translated | — |
| Icon | Font Awesome icon picker, shown on the button | — |
| Status | Enabled / Disabled; a disabled provider is neither listed on the login page nor accepted on callback | Enabled |
| Sort | Order of the buttons on the login page; the list supports drag sorting | — |

### Endpoint

| Field | Description | Default |
| --- | --- | --- |
| Issuer | OIDC issuer. When the three URLs below are empty they are discovered from `<issuer>/.well-known/openid-configuration`; the result is cached per issuer and evicted when the row changes or is deleted | — |
| Authorize URL | authorization endpoint | discovered from Issuer |
| Token URL | token endpoint | discovered from Issuer |
| User Info URL | userinfo endpoint | discovered from Issuer |
| Redirect URI | Where the provider sends the browser back; must match what is registered at the provider **verbatim**. When empty it is derived from the incoming request as `http(s)://<this host>/erupt-api/sso/callback/<code>` (for a tenant's SAML row `/erupt-api/sso/tenant/<tenant code>/callback/<code>`, see [Tenant Providers](#tenant-providers)); fill it in only behind a reverse proxy or when the public domain differs from the backend's | empty, derived |

Validation on save: either all three URLs are filled in, or an Issuer is given and it serves a discovery document. An issuer without one (GitHub, Gitee and Feishu all fall in this group) is refused on save with "The issuer publishes no OpenID discovery document, fill in the Authorize, Token and User Info URLs" rather than failing at the first login. The URLs may also be filled in partially; whatever is filled overrides the discovered value.

### Client

| Field | Description | Default |
| --- | --- | --- |
| Client ID | Issued when registering the application at the provider | — |
| Client Secret | Write only: not shown in the table, masked in the form, and the stored value is kept when the mask is submitted unchanged | — |
| Messaging Key | Shown only when the Provider Type is WeCom, DingTalk or Slack; write only as well. WeCom and DingTalk take the app's **AgentId**, Slack the **Bot User OAuth Token** (`xoxb-...`). Login never reads it; it is used only when an erupt-notice [provider-backed channel](/en/modules/erupt-notice#provider-backed-channels) sends a message, so a row used for login alone may leave it empty | — |
| Scopes | Tag input **joined with spaces**; presets are the OIDC standard scopes `openid` `profile` `email` `phone` `address` `groups`, and provider-specific ones (such as GitHub's `read:user`) are simply typed in | `openid profile email` |

### User Mapping

The user info the provider returns is a JSON object; this group decides which fields are read:

| Field | Description | Default |
| --- | --- | --- |
| Account Claim | Claim matched against an erupt user's **account** on first login; when empty the Email Claim is used instead | `preferred_username` |
| Name Claim | Mapped to the user's name | `name` |
| Email Claim | Mapped to the user's email | `email` |
| Phone Claim | Mapped to the user's phone; usually `phone_number` for OIDC, `mobile` for Feishu | — |
| Avatar Claim | URL of the picture; usually `picture` for OIDC, `avatar_url` for Feishu | — |
| Open ID Claim | The claim other modules (such as notifications) use to reach this user at the provider: Feishu `open_id`, DingTalk `unionId`, WeCom `userid`, Slack `https://slack.com/user_id`. Its value is stored in the binding's Open ID column and refreshed on every login; when empty the binding carries no Open ID and push channels cannot reach the user | filled by the preset |
| Sync Profile | **Every login**: name, email, phone and avatar are overwritten from the provider each time; **Fill empty only**: only blank fields in erupt are filled, so values an administrator set by hand survive | Every login |
| Auto Create | **Create**: an unknown identity creates a user from the provider's profile; **Reject**: login fails with "No matching account in this system, please contact an administrator" plus the claim name and value, so the administrator knows what to create | Create |
| Default Roles | Role set given to a user the first time this provider creates it | — |
| Grant Roles On Login | When on, a bound user is topped up with any missing default role on every login; **roles are only ever added, never revoked**, so grants by an administrator or another provider stay | Off |
| Remark | Free text | — |

The subject (unique identifier) needs no configuration: the module tries `sub`, `id`, `openid`, `open_id`, `unionid`, `union_id`, `userId`, `user_id` in turn and takes the first non-empty value.

## Account binding and auto creation

How one SSO login lands on an erupt user:

1. **Look up the binding**: search the binding table by "provider + subject"; a hit is the user. A binding keys on the subject only and **never** falls back to email or account name afterwards — those get renamed and reused, the subject does not.
2. **First login matches by account claim**: with no binding, the value of the Account Claim (or the Email Claim when that is empty) is compared with the `account` column of the erupt user table. A match creates the binding; this happens exactly once in a binding's life.
3. **Auto create**: still no match and Auto Create is on — a user is created with the account claim as account, the name claim as name (falling back to the account), enabled, non-admin, holding the Default Roles. The user has **no usable password** (a random, irreversible hash), can only sign in through the provider, and is never nagged to change an initial password. With Auto Create off the login is rejected.
4. **Profile sync and role top-up**: name, email, phone, avatar and roles are updated according to Sync Profile and Grant Roles On Login.
5. **Usability check**: a disabled, expired or out-of-whitelist account is rejected even though the provider let it through, exactly as for password login.

:::tip Connecting existing accounts
Make the provider's account claim equal the account name in erupt: the binding is created the first time the user presses the SSO button, and renaming the account afterwards no longer matters.
:::

## Login page behaviour

![SSO buttons on the login page](/ui/login-center.png)

While rendering, the login page calls `GET /erupt-api/sso/providers` for the enabled providers (code, name, icon — no secrets):

- Up to 3 providers share one row as buttons with icon and name
- More than 3 collapse into a row of round icon buttons with the name as tooltip
- A click navigates to `GET /erupt-api/sso/authorize/<code>`; after authentication the browser returns to the login page, which exchanges the ticket and enters the system automatically
- When the provider refuses or something fails midway, the login page shows the error (`ssoError` parameter) and the user can retry

The buttons adapt to all five login layouts (`theme.loginLayout`) and the workspace skin without extra settings.

## Provider Presets

Each of the 20 presets in **Provider Type** fills in the endpoints (an issuer for OIDC services, the single sign-on URL and IdP entity id for SAML, the three URLs otherwise), the scopes, the claim mapping and the Open ID Claim; what is left for you is the client credentials from the provider's console and the `<placeholder>` parts in a self-hosted service's URLs. The values follow each provider's documentation as of the release — when a login fails, check the row against the provider's current docs first.

| Type | Protocol | Placeholders to replace | Account Claim | Open ID Claim | Notes |
| --- | --- | --- | --- | --- | --- |
| SAML 2.0 | SAML | `<idp-host>` (single sign-on URL) | `nameId` | — | Generic preset; Name Claim `displayName`, Email Claim `email`, adjust to the attribute names your IdP sends |
| AD FS | SAML | `<adfs-host>` (single sign-on URL and entity id) | `nameId` | — | SSO URL `https://<adfs-host>/adfs/ls/`, entity id `http://<adfs-host>/adfs/services/trust`; name / email claims are the full `.../ws/2005/05/identity/claims/name` and `.../emailaddress` URIs; Client ID hint "Relying party identifier" |
| Microsoft Entra ID (SAML) | SAML | `<tenant-id>` | `nameId` | `http://schemas.microsoft.com/identity/claims/objectidentifier` | SSO URL `https://login.microsoftonline.com/<tenant-id>/saml2`, entity id `https://sts.windows.net/<tenant-id>/`; Name Claim `.../identity/claims/displayname`; Client ID hint "Identifier (Entity ID)" |
| Keycloak | OIDC discovery | `<host>`, `<realm>` | `preferred_username` | — | Issuer `https://<host>/realms/<realm>` |
| Authing | OIDC discovery | `<app>` | `preferred_username` | — | Issuer `https://<app>.authing.cn/oidc`; scopes include `phone` |
| Casdoor | OIDC discovery | `<host>` | `preferred_username` | — | Name Claim `displayName`, Phone Claim `phone` |
| Okta | OIDC discovery | `<org>` | `preferred_username` | — | Issuer points at the `oauth2/default` authorization server |
| Auth0 | OIDC discovery | `<tenant>` | `nickname` | — | — |
| Microsoft Entra ID | OIDC discovery | `<tenant-id>` | `email` | — | Credential hints "Application (client) ID" / "Client secret value" |
| Google | OIDC discovery | none | `email` | — | — |
| GitLab | OIDC discovery | none (change the issuer for a self-hosted instance) | `preferred_username` | — | Credential hints "Application ID" / "Secret" |
| Atlassian | OIDC discovery | none | `email` | `sub` | — |
| Slack | OIDC discovery | none | `email` | `https://slack.com/user_id` | Slack namespaces its claims by URL; sending messages needs the Bot User OAuth Token in Messaging Key |
| Zoom | OAuth2 | none | `email` | `id` | The token endpoint takes the client credentials as **HTTP Basic**; scope `user:read:user` |
| GitHub | OAuth2 | none | `login` | — | Scopes `read:user user:email`; a private email comes back as null and only affects profile sync |
| Gitee | OAuth2 | none | `login` | — | Scopes `user_info emails` |
| Feishu | OAuth2 | none | `user_id` | `open_id` | Enveloped user-info response, opened by the module; four `contact:user.*:readonly` scopes; Lark (international) works by changing the domain of the three URLs |
| DingTalk | DingTalk | none | `mobile` | `unionId` | Credential hints "AppKey" / "AppSecret"; for messaging the unionId is resolved to the corp userid once and cached, Messaging Key = AgentId |
| WeCom | WeCom | `<agentid>` (in the Authorize URL) | `userid` | `userid` | Client ID = CorpID, Client Secret = the self-built app's Secret; Messaging Key = the same AgentId |
| WeChat | WeChat | none | `openid` | `openid` | Website QR login, scope `snsapi_login` |
| Custom | OAuth2 | — | by hand | by hand | Leaves the form alone, plain OAuth 2.0 |

### Keycloak walkthrough

1. Choose **Keycloak** as the Provider Type; the issuer arrives as `https://<host>/realms/<realm>` — replace both placeholders, e.g. `https://sso.example.com/realms/erupt`. The three URLs come from the discovery document and stay empty.
2. Create a confidential client in Keycloak and paste its Client ID and Client Secret into the Client group.
3. In that client set **Valid redirect URIs** to `https://<erupt host>/erupt-api/sso/callback/keycloak` (`keycloak` being the Code the preset suggested).

Authing, Casdoor, Okta, Auth0, Entra ID and the other OIDC presets work the same way: replace the placeholder in the issuer, paste the credentials, register the callback.

### Feishu, WeCom and DingTalk

Besides pasting the credentials, these three need two things done in their own consoles:

- **Register the callback**: add `https://<erupt host>/erupt-api/sso/callback/<code>` to the app's redirect URLs / trusted domains.
- **Enable the scopes**: grant the app the permissions matching the scopes the preset filled in — Feishu's four `contact:user.*:readonly` scopes, WeCom's `snsapi_privateinfo` (members' sensitive fields), DingTalk's `openid` login scope.

A few more notes: WeCom needs the `<agentid>` in the Authorize URL replaced with the AgentId of the self-built app (put the same value in Messaging Key if the row will also push notifications); Feishu's user-info endpoint answers with an envelope, `{ "code": 0, "msg": "success", "data": { ... } }`, which the module opens — `data` becomes the claims and a non-zero `code` fails with "The identity provider could not be reached (code: msg)", WeCom and DingTalk envelopes being handled the same way; Lark, the international edition, only needs the domain of the three URLs changed to Lark's.

## SAML 2.0 Single Sign-On

> 2.4.0+

With the Provider Type set to **SAML 2.0**, **AD FS** or **Microsoft Entra ID (SAML)** the row runs SAML 2.0 Web Browser SSO, SP-initiated: erupt, as the SP, builds an `AuthnRequest` and sends the browser to the IdP's single sign-on URL over the **HTTP-Redirect** binding (deflated, base64, unsigned); after authentication the IdP has the browser submit the signed `Response` to erupt's assertion consumer service (ACS) over the **HTTP-POST** binding. The server-side `state` doubles as the `AuthnRequest` `ID` (`_<state>`) and as the `RelayState`, and `InResponseTo` is checked against it on the way back. From the claims on, a SAML row behaves exactly like an OAuth 2.0 one: binding by subject, match by account claim, auto create, one-time ticket exchanged for a token.

### Field mapping

A SAML row reuses the same form, with the fields read under their SAML names; Token URL, User Info URL, Client Secret and Scopes are hidden on a SAML row:

| Form field | SAML meaning | Notes |
| --- | --- | --- |
| Issuer | **IdP entity id** | When set, the `Issuer` of the response and of the assertion must equal it; empty skips the check |
| Authorize URL | **IdP single sign-on URL** (HTTP-Redirect binding) | Required |
| Client ID | **SP entity id** | The identifier you register erupt under at the IdP; also the `Issuer` of the `AuthnRequest` and the expected `Audience` of the assertion |
| Redirect URI | **Assertion consumer service (ACS)** | Empty derives `http(s)://<this host>/erupt-api/sso/callback/<code>` from the request; the response's `Destination` and `Recipient` must match it |
| IdP Certificate | **IdP signing certificate** | The X.509 certificate from the IdP metadata, PEM or bare base64; parsed on save and refused when unreadable. It is the **only trust anchor** of a SAML login |
| Account / Name / Email / Phone / Avatar / Open ID Claim | Assertion attribute names | See "Claims" below |

### Claims

Every `Attribute` in the assertion becomes a claim under its `Name`; one with a `FriendlyName` is copied under that name as well, so an AD FS email can be mapped either by the full `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress` or simply as `emailaddress`. A multi-valued attribute maps to an array. The `Subject/NameID` is published as `nameId` (its format as `nameIdFormat`) and is the first choice for the subject — it is what the binding's Subject column holds. The presets default the Account Claim to `nameId`; when the IdP's NameID is not the account name, point it at the right attribute.

### Setup steps

1. Under **System Management → SSO Provider** add a row, pick the matching SAML preset, and replace the `<placeholder>` in the single sign-on URL and entity id.
2. Put the SP entity id you intend to give erupt (such as `https://admin.example.com/erupt`) in **Client ID**; **Redirect URI** usually stays empty.
3. Take the signing certificate from the IdP metadata (`FederationMetadata.xml` for AD FS, the "SAML Signing Certificate" of the enterprise application for Entra), paste it into **IdP Certificate**, save.
4. Register erupt as an SP at the IdP: import the SP metadata served at `GET https://<erupt host>/erupt-api/sso/saml/<code>/metadata`, or enter the SP entity id and the ACS URL `https://<erupt host>/erupt-api/sso/callback/<code>` by hand. The metadata declares `AuthnRequestsSigned="false"`, `WantAssertionsSigned="true"` and the `unspecified` NameID format.
5. Have the IdP send a **signed, unencrypted assertion** (either the assertion or the whole response may carry the signature); leave assertion encryption off.
6. Press the button on the login page to test; failures are listed in the error table under [Endpoints](#endpoints).

### Verification and limits

A response is accepted only after, in order: XML parsing with DTDs disallowed, a `Status` of Success, `InResponseTo` equal to the request id, `Destination` equal to the ACS, `Issuer` matching the row, an enveloped signature on the assertion (or the response) that references the very element it sits in (only the enveloped and canonicalisation transforms are allowed and secureValidation is on, so signature wrapping cannot get through) and verifies with the IdP certificate, `NotBefore` / `NotOnOrAfter` within the validity window (3 minutes of clock skew tolerated), an `Audience` containing the SP entity id, and a bearer `SubjectConfirmation` whose `Recipient`, `InResponseTo` and times all agree.

- Only the JDK's `javax.xml.crypto.dsig` is used; no OpenSAML or similar library is pulled in.
- **Encrypted assertions are not supported**: an `EncryptedAssertion` is refused outright, so configure the IdP to send a signed assertion in clear (decrypting would need an SP key pair, and every mainstream IdP can send clear assertions).
- The `AuthnRequest` is not signed; an IdP that requires signed requests by default needs that requirement switched off.
- A row trusts one certificate; on certificate rotation update the row, and plan the switch around the old certificate's expiry.
- No single logout (SLO); responses are capped at 1 MB.
- Verified end to end against [mocksaml.com](https://mocksaml.com), a convenient first stop before wiring up a real IdP.

## Tenant Providers

> 2.4.0+, requires [erupt-tenant](/en/modules/pro/erupt-tenant/)

`e_upms_sso` and `e_upms_sso_bind` both carry a `tenant_id` column (`"0"` for the platform), restricted and stamped automatically by Hibernate's `@TenantId`: a row a tenant administrator adds under "SSO Provider" in their own back office belongs to that tenant, invisible to the platform and to other tenants. The provider code is unique **per tenant**, so several tenants may each have a `feishu`.

The tenant login page runs the same flow as the platform's with one extra tenant code:

- The page calls `GET /erupt-api/sso/providers?tenant=<tenant code>` for its buttons, and a click goes to `GET /erupt-api/sso/authorize/<code>?tenant=<tenant code>`. An unknown tenant code gets an empty provider list (indistinguishable from a tenant with no providers, so the page tells nobody which codes exist), and authorize fails with "Company not found".
- The tenant code is resolved to a tenant id through the `UpmsTenantLogin` SPI (implemented by erupt-tenant); from then on **the tenant lives only in the server-side state**, nothing the browser sends back carries or can change it. Provider rows, bindings and users are read and written in a session of that tenant.
- **Callback address**: an OAuth 2.0 row of a tenant still defaults its callback to the platform's `/erupt-api/sso/callback/<code>` — the tenant is in the state, so **one Feishu / WeCom app can serve every tenant** with a single callback registered at the provider. A SAML IdP tells service providers apart by the ACS URL, so a tenant's SAML row defaults to `/erupt-api/sso/tenant/<tenant code>/callback/<code>`, with the SP metadata at `/erupt-api/sso/tenant/<tenant code>/saml/<code>/metadata`. A callback arriving on a tenant path is checked against the tenant in the state.
- Once authenticated, `UpmsTenantLogin.login` finishes the job: a locked or expired tenant is refused, otherwise a **tenant token** is issued and the browser returns to that tenant's login page to exchange the ticket.
- Without a `tenant` parameter, or without erupt-tenant, everything behaves as for the platform.

## Managing SSO bindings

The **SSO Binding** menu records "which erupt user signs in with which subject of which provider", plus the profile snapshot the provider returned at login. Bindings are created by signing in, and an administrator only needs them to investigate or unbind, so the menu is **hidden** by default (`MenuStatus.HIDE`) — switch it to visible in **Menu Management** when needed. The menu is not the only way in: on the **SSO Provider** list, the "SSO Binding" drill-down on a provider row shows only the bindings of that provider.

| Column | Description |
| --- | --- |
| Provider | The owning provider |
| User | The bound erupt user |
| Subject | The provider-side unique identifier, picked by the login flow itself (`sub` / `id` / `open_id`…), not configurable |
| Open ID | The messaging identifier mapped through the provider's Open ID Claim, refreshed on every login; push channels address the user by it |
| Last Login | When the user last signed in through this provider |
| Claims | The raw user info the provider returned at the last login (JSON, envelope removed), rewritten in full on every login. A snapshot, not a source of truth |

The menu allows viewing and deleting only. After a binding is deleted, the user's next login through that provider goes through "match by account claim → auto create" again.

### Reading bindings from other modules

`EruptSsoBindService` (a Spring bean) exposes what a binding holds to other modules. Every method reads the stored binding only and **never** calls the provider; a user who has never signed in through a provider has no binding there and gets an empty result:

| Method | Returns |
| --- | --- |
| `find(userId, providerCode)` | `Optional<EruptSsoBind>`, the user's binding with the provider (by code) |
| `findAll(userId)` | `List<EruptSsoBind>`, the bindings of every provider the user has signed in through |
| `openId(userId, providerCode)` | `Optional<String>`, the binding's Open ID |
| `claim(userId, providerCode, name)` | `Optional<String>`, any top-level field of the user-info snapshot, such as Feishu's `tenant_key` or WeCom's `department`, without a column for it; a non-primitive value comes back as its JSON text |
| `claims(userId, providerCode)` | `Optional<JsonObject>`, the whole snapshot |

```java
@Resource
private EruptSsoBindService eruptSsoBindService;

public void reachOnFeishu(Long userId) {
    // The user's open_id at Feishu; present only if they signed in through the provider whose code is "feishu"
    eruptSsoBindService.openId(userId, "feishu").ifPresent(openId -> {
        // call the Feishu API with the open_id ...
    });
}
```

A module that needs to call the provider **as the application** rather than as the user can inject `SsoProviderApi` and call `appAccessToken(EruptSso)`: it fetches an app-level token with the row's client credentials (Feishu `tenant_access_token`, DingTalk accessToken, WeCom access_token), caches it per row until shortly before expiry and drops it when the row changes; only the Feishu, DingTalk and WeCom types support it, any other type throws "This provider type has no application level API access". This is how the erupt-notice push channels send their messages.

## Endpoints

All endpoints are reachable **without a session** — they serve users who are not signed in yet, and each carries its own proof: a state, a ticket, a signed assertion, or nothing worth protecting:

| Endpoint | Description |
| --- | --- |
| `GET /erupt-api/sso/providers` | Enabled providers (code, name, icon) for the login page buttons; `?tenant=<tenant code>` lists a tenant's |
| `GET /erupt-api/sso/authorize/{provider}` | Generates state and PKCE, then 302 to the provider's authorize URL (SAML: the single sign-on URL with a `SAMLRequest`); `?tenant=<tenant code>` starts the flow as a tenant |
| `GET /erupt-api/sso/callback/{provider}` | The OAuth 2.0 callback; on success 302 to the login page with `ssoTicket`, on failure with `ssoError` |
| `POST /erupt-api/sso/callback/{provider}` | The SAML assertion consumer service (ACS), taking `SAMLResponse` and `RelayState`; same outcome as the GET callback |
| `GET /erupt-api/sso/saml/{provider}/metadata` | SP metadata (`application/samlmetadata+xml`) for the IdP to import; SAML rows only |
| `.../sso/tenant/{tenant}/callback/{provider}`, `.../sso/tenant/{tenant}/saml/{provider}/metadata` | Tenant paths of the callback and metadata endpoints, used by a tenant's SAML rows by default |
| `POST /erupt-api/sso/exchange` | Body `{ "ssoTicket": "..." }`; returns the same `LoginModel` (with token) as password login. The ticket is single-use and valid for 60 seconds; expired tickets get "Sign-in ticket expired, please sign in again" |

Common messages and what they mean:

| Message | Situation |
| --- | --- |
| Sign-in request is invalid or expired, please start again | The state is missing, expired (10 minutes), already used, or belongs to another provider |
| Provider not found or disabled | Wrong code or a disabled row |
| The issuer publishes no OpenID discovery document… | On save, the three URLs could not be discovered from the Issuer |
| Could not obtain an access token | The token endpoint returned no `access_token`, usually a client id / secret / redirect URI mismatch |
| The identity provider could not be reached (…) | The token or user-info endpoint returned non-2xx, non-JSON, or an envelope with non-zero `code`; the brackets carry the provider's own code and message |
| The provider returned no user identifier | No usable subject field in the user info; the brackets list the field names that were returned |
| The provider returned no account claim | Both the Account Claim and the Email Claim are empty |
| No matching account in this system, please contact an administrator | Auto Create is off and no account matched; the brackets show the claim name and value |
| Replace the `<placeholder>` in the URL before saving (…) | On save a URL still contains a preset placeholder such as `<host>`, `<realm>` or `<agentid>`; the brackets show that URL |
| The account is not a member of the enterprise | WeCom: the account that scanned the code is not in the corp's contact book |
| This provider type has no application level API access | `SsoProviderApi.appAccessToken` was called on a row whose type is not Feishu / DingTalk / WeCom |
| Fill in the IdP single sign-on URL and certificate | A SAML row was saved without a single sign-on URL or an IdP certificate |
| The IdP certificate could not be read… | On save the certificate is not a valid X.509 certificate |
| Invalid SAML response (…) | One of the checks failed; the brackets say which: `InResponseTo is …`, `Destination is …`, `audience is not …`, `expired, NotOnOrAfter …`, `signature verification failed` and so on |
| The SAML response carries no signature verifiable with the configured IdP certificate | Neither the assertion nor the response is signed; a signature that fails to verify falls under the previous row |
| Encrypted assertions are not supported… | The response carries an `EncryptedAssertion` |
| The identity provider rejected the sign-in (…) | The IdP returned a `Status` other than Success; the brackets carry its status code and message |
| Company not found | The `tenant` parameter names no tenant, or erupt-tenant is not installed |

## Database tables

| Table | Description |
| --- | --- |
| `e_upms_sso` | Providers, extends `MetaModelUpdateVo`; columns mirror the form: `tenant_id` VARCHAR(64) NOT NULL default `'0'` (2.4.0+), `type` VARCHAR(32) (the Provider Type enum name; empty on rows created before 2.3.0, treated as Custom), `code`, `name`, `icon`, `status`, `sort`, `issuer`, `authorize_url`, `token_url`, `user_info_url`, `redirect_uri` (all VARCHAR(512)), `client_id`, `client_secret` VARCHAR(512), `idp_certificate` LONGTEXT (2.4.0+, SAML rows), `messaging_key` VARCHAR(255), `scopes` VARCHAR(255), `account_claim` / `name_claim` / `email_claim` / `phone_claim` / `avatar_claim` / `open_id_claim` VARCHAR(64), `sync_profile`, `auto_create`, `grant_roles_on_login`, `remark`; unique constraint `uk_upms_sso_code (tenant_id, code)` — the pre-2.4.0 single-column unique index on `code` has to be dropped by hand |
| `e_upms_sso_role` | Default roles of a provider, `sso_id` + `role_id` |
| `e_upms_sso_bind` | Bindings, extends `MetaModelUpdateVo`: `tenant_id` (2.4.0+), `sso_id`, `erupt_user_id`, `subject` VARCHAR(255) NOT NULL, `open_id` VARCHAR(255), `last_login_time` DATETIME(6), `claims` VARCHAR(10485760) (`AnnotationConst.CONFIG_LENGTH`, mapped to LONGTEXT on MySQL); unique constraint `(sso_id, subject)` |

Projects with JPA schema generation enabled get the tables on upgrade; projects that maintain their schema by hand should create them from the table above.

:::tip Relation to the Spring Security OAuth2 approach
Before 2.3.0 the documented approach was to add `spring-boot-starter-oauth2-client`, configure the provider in `application.yml` and write your own callback controller that exchanges the identity for an erupt token — see [Login & Authentication → Advanced: Spring Security OAuth2 Client](/en/advanced/auth#advanced-spring-security-oauth2-client). It still works and suits deep customisation of the authorization flow; for ordinary integrations erupt-sso is recommended: configure it in the admin UI, with no code and no restart.
:::
