# Configuration

Erupt is configured in two places: the **backend** in `application.yml`, and the **frontend** through static files under `resources/public/` (`app.js`, `app.css`, `home.html`). Every entry is optional — configure only what you need.

## Backend Configuration (`application.yml`)

### erupt-app — frontend application settings

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

See also: [Custom Login Page](/en/advanced/custom-login-page) · [Internationalization](/en/advanced/i18n)

### erupt — framework core

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
  # Enable job scheduling (effective when erupt-job is imported)
  job.enable: true
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
    # Strict role-menu legality check
    strict-role-menu-legal: true
    # Default super-admin username used at system initialization (v1.12.18+)
    default-account: erupt
    # Default super-admin password used at system initialization (v1.12.18+)
    default-password: erupt
```

### erupt.redis-session — distributed sessions

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

### erupt.telemetry — anonymous telemetry

```yaml
erupt:
  telemetry:
    # Report anonymous usage statistics, default true (v2.1.2+)
    # Can also be disabled with ERUPT_TELEMETRY_DISABLED=1; CI environments are skipped automatically
    enabled: true
    # Reporting endpoint, may point at a self-hosted collector
    endpoint: https://telemetry.erupt.xyz/v1/ping
```

For the full list of collected fields see [Anonymous Telemetry](/en/guide/telemetry).

### erupt.ai — AI module

```yaml
erupt:
  ai:
    # Max sequential tool calls per conversation turn
    max-sequential-tools-invocations: 30
    claw:
      # Without an explicit enabled: true, none of the claw @Tool methods are registered
      enabled: false
      # Allow the AI to execute shell commands. High risk, false by default
      enable-exec-shell: false
      # Absolute paths outside the sandbox (~/.erupt/{account}) where execShell may run
      shell-allowed-paths: []
      # Archive stale skills daily (moved to .archive, never deleted)
      skill-curator-enabled: true
      # Days without use before a skill is considered stale
      skill-stale-days: 30
```

System prompt, SSE timeout and the remaining options are documented in [Erupt AI](/en/modules/erupt-ai) and [Erupt AI Claw](/en/modules/erupt-ai-claw).

## Frontend Configuration (`app.js`)

Create the file manually at `/resources/public/app.js`.

It covers: basic parameters, route callbacks, global lifecycle hooks, and more.

```javascript
window.eruptSiteConfig = {
    // Erupt API endpoint — required for frontend/backend separation
    domain: "",
    // Attachment URL — usually not required, but needed when using a custom object-storage provider
    fileDomain: "",
    // Title
    title: "Erupt",
    // Description
    desc: "Universal data management framework",
    // Whether to display copyright info
    copyright: true,
    // Custom copyright content (v1.12.8+)
    copyrightTxt: function() {
      return "Copyright xxxx"
    },
    // AMap (高德) API key — required when using the map component
    amapKey: "xxxx",
    // AMap SecurityJsCode
    amapSecurityJsCode: "xxxxx",
    // Logo path
    logoPath: "erupt.svg",
    // Logo shown when the sidebar is collapsed (v1.12.21+)
    logoFoldPath: null,
    // Logo text
    logoText: "erupt",
    // Registration page URL
    registerPage: "",
    // Theme configuration
    theme: {
        // Primary color
        primaryColor: "#00B515"
    },
    // Custom items shown in the user-avatar menu (v1.12.21+)
    userTools: [{
        text: "Custom user tool",
        icon: "fa fa-snowflake-o",
        click: function (event) {
            alert("On Click")
        }
    }],
    // Custom buttons in the top-right navigation bar
    r_tools: [{
        icon: "fa-eercast",
        render: () => {
          return `<h2>Custom render</h2>`
        },
        mobileHidden: false,
        click: function (event) {
            alert("Function button");
        }
    }],
};

// Route callbacks
window.eruptRouterEvent = {
    demo: {
        load: function (e) { },
        unload: function (e) { }
    },
    $: {
        load: function (e) { },
        unload: function (e) { }
    }
};

// Erupt lifecycle hooks
window.eruptEvent = {
    startup: function () { },
    login: function(user){
      window.notify.success("Tip", "login success")
    },
    logout: function(user){ }
}
```

Minimal recommended configuration:

```javascript
window.eruptSiteConfig = {
  title: "Your App Title",
  desc: "description",
  copyright: false,
  logoPath: "erupt.svg",
  logoText: "APP",
};
```

## Frontend Styles (`app.css`)

Create the file manually at `/resources/public/app.css`.

Use `app.css` to override default styles or define new ones.

```css
/* Example: customize the login page */
layout-passport > .container {
    background-position: center !important;
    background-repeat: repeat !important;
    background-size: cover !important;
    background-color: #fff !important;
    background-image: url(https://www.erupt.xyz/login-bg.svg) !important;
}
```

## Custom Home Page (`home.html`)

Create the file manually at `/resources/public/home.html`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
</head>
<body>
    <h1>Hello World</h1>
</body>
</html>
```
