# Backend Configuration (`application.yml`)

:::info Configuration is split into four pages
Erupt is configured in two places: the **backend** in `application.yml`, and the **frontend** through static files under `resources/public/`. Every entry is optional; configure only what you need.

- [Backend configuration (`application.yml`)](/en/guide/configuration): `erupt-app`, `erupt`, `erupt.upms`, `erupt.redis-session`, `erupt.telemetry`
- [Frontend configuration (`app.js`)](/en/guide/config-frontend): site info, logos, appearance defaults, PWA, router and lifecycle hooks
- [Frontend styles (`app.css`)](/en/guide/config-style): override or extend the UI styles
- [Custom home page (`home.html`)](/en/guide/config-home): replace the welcome page shown after login
:::

## erupt-app — frontend application settings

`erupt-app.*` controls **frontend presentation** (watermark, captcha policy, languages, login page). It is backed by `xyz.erupt.upms.prop.EruptAppProp` and ships with `erupt-upms`. The frontend pulls the whole set once at startup via `GET /erupt-api/erupt-app`.

```yaml
erupt-app:
  # Enable the page watermark (v1.12.0+)
  water-mark: true
  # Include the date in the watermark (v1.14.3+)
  water-mark-date: false
  # Custom watermark content; shows the current user when empty (v1.14.3+)
  water-mark-content: ""
  # Show a captcha after this many failed logins; 0 means a captcha is always required
  verify-code-count: 2
  # Encrypt the password in transit during login; turn off for scenarios such as LDAP that need the cleartext password
  pwd-transfer-encrypt: true
  # Expose the password-reset feature; when disabled the frontend hides every entry point (v1.12.7+)
  reset-pwd: true
  # Prompt users who are still on the default password to change it after login
  reset-pwd-prompt: false
  # Path to a custom login page; HTTP URLs are supported (v1.10.6+)
  login-page-path: /customer-login.html
  # Languages selectable in the login page and the language switcher; the system default is controlled by erupt.default-locales
  # An empty list falls back to ["en-US"]
  locales:
    - "zh-CN"   # Simplified Chinese
    - "zh-TW"   # Traditional Chinese
    - "en-US"   # English
    - "fr-FR"   # Français
    - "ja-JP"   # 日本語
    - "ko-KR"   # 한국어
    - "ru-RU"   # русск
    - "es-ES"   # Español
    - "de-DE"   # Deutsch
    - "pt-PT"   # Português
    - "id-ID"   # Bahasa Indonesia
    - "ar-SA"   # العربية
  # Custom key-values delivered to the frontend alongside /erupt-api/erupt-app; readable from app.js or TPL pages
  properties:
    show-help-entry: true
    help-doc-url: https://docs.your-company.com
```

:::warning `verify-code-count: 0` does not disable the captcha
`0` means **every login requires a captcha**. To relax the policy, raise the number.
:::

:::tip `reset-pwd` vs `reset-pwd-prompt`
`reset-pwd` decides whether **the feature exists at all** (disabled removes every entry point). `reset-pwd-prompt` decides whether to **nag** — when enabled, users still on the initial password are reminded on every login. `reset-pwd-prompt: true` is recommended in production.
:::

`properties` can also be registered from code. This is exactly how `erupt-websocket`, `erupt-ai`, `erupt-notice` and `erupt-print` announce "I am installed" to the frontend, which then decides whether to render the matching entry points:

```java
@Resource
private EruptAppProp eruptAppProp;

@PostConstruct
public void init() {
    eruptAppProp.registerProp("my-module", true);
}
```

The response also carries two read-only fields filled in by the server — `hash` (hashCode of the controller instance, used by the frontend to detect changes) and `version` (the current Erupt version). Setting them in yaml has no effect.

See also: [Custom Login Page](/en/advanced/auth#custom-login-page) · [Internationalization](/en/advanced/i18n)

## erupt — framework core

```yaml
erupt:
  # Enable CSRF protection
  csrf-inspect: true
  # Path where uploaded attachments are stored; defaults to /opt/erupt-attachment
  upload-path: D:/erupt/pictures
  # Keep the original file name when uploading
  keep-upload-file-name: false
  # Initialization mode: NONE - never run init code, EVERY - run on every startup, FILE - use a marker file
  init-method-enum: file
  # Default language used during initialization for text values (v1.12.3+)
  default-locales: zh-CN
  # Enable log collection — viewable under System Logs in real time (v1.12.14+)
  log-track: true
  # Maximum number of buffered log lines (v1.12.14+)
  log-track-cache-size: 1000
  security:
    # Record operation logs; viewable under System Management → Operation Logs
    record-operate-log: true
    # Max request body size (bytes) buffered for operation logging; larger or chunked bodies are not recorded. Default 1MB (v2.0.2+)
    record-operate-log-max-body-size: 1048576
  upms:
    # Login session length (minutes)
    expire-time-by-login: 60
    # Strict role-menu policy, true by default. It governs the candidate tree of Role Management -> Menu Permission:
    # when on, a non-admin can only grant menus it already holds (the union of its enabled roles' menus),
    # so a role can never receive a permission the operator lacks. Super admins are unrestricted; turning it off
    # lets anyone who can open Role Management hand out every menu, i.e. gives away privilege escalation.
    # Note: menus a role holds beyond the operator's reach are not rendered in the tree and are removed when that
    # user saves the role — keep such roles with a super admin
    strict-role-menu-legal: true
    # Default super-admin username used at system initialization (v1.12.18+)
    default-account: erupt
    # Default super-admin password used at system initialization (v1.12.18+)
    default-password: erupt
    # Login lock: after max-failures consecutive wrong passwords for one account + IP the pair is locked for lock-minutes; a wrong captcha counts too (v2.3.0+)
    login-lock:
      enable: true
      max-failures: 10
      lock-minutes: 10
```

## erupt.redis-session — distributed sessions

When enabled, sessions are stored in Redis. Add the standard Spring Boot Redis configuration alongside it:

```yaml
erupt:
  # Store sessions in Redis, default false
  redis-session: true
  # Auto-refresh the Redis session (v1.10.8+)
  redis-session-refresh: false

spring:
  data:
    redis:
      database: 0
      timeout: 10000
      host: 127.0.0.1
```

## erupt.telemetry — anonymous telemetry

```yaml
erupt:
  telemetry:
    # Report anonymous usage statistics, default true (v2.2.0+)
    # Can also be disabled with ERUPT_TELEMETRY_DISABLED=1; CI environments are skipped automatically
    enabled: true
    # Reporting endpoint, may point at a self-hosted collector
    endpoint: https://telemetry.erupt.xyz/v1/ping
```

For the full list of collected fields see [Anonymous Telemetry](/en/guide/telemetry).

## Module-specific settings

Settings that belong to an extension module (`erupt.ai.*`, `erupt.designer.*`, `erupt.remote.*`, `erupt.job.*`, `erupt.s3.*`, `erupt.dingtalk.*`, `erupt.airtable.*`, …) only take effect once that module is on the classpath, and are documented on the module's own page rather than repeated here: [Erupt AI](/en/modules/erupt-ai/) · [Erupt AI Claw](/en/modules/erupt-ai-claw/) · [Erupt Designer](/en/modules/erupt-designer) · [Erupt Remote](/en/modules/erupt-remote) · [Erupt Job](/en/modules/erupt-job) · [erupt-data-s3](/en/modules/erupt-s3/config) · [erupt-data-dingtalk](/en/modules/erupt-dingtalk) · [erupt-data-airtable](/en/modules/erupt-airtable).
