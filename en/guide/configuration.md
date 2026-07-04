# Configuration

## Backend Configuration (`application.yml`)

> All entries are optional — configure only what you need.

```yaml
erupt-app:
  # Whether to enable watermark (v1.12.0+)
  water-mark: true
  # Whether the watermark should include the date (v1.14.3+)
  water-mark-date: false
  # Custom watermark content (v1.14.3+)
  water-mark-content: ""
  # Show captcha after this many failed login attempts. 0 means captcha is always required.
  verify-code-count: 2
  # Encrypt the password during login. In special cases like LDAP login this can be turned off to keep the cleartext password.
  pwd-transfer-encrypt: true
  # Whether to expose the password-reset feature; when disabled the frontend hides all reset entries (v1.12.7+)
  reset-pwd: true
  # Available languages. The system default language is controlled by erupt.default-locales.
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
  # Path to a custom login page (v1.10.6+). Supports HTTP URLs.
  login-page-path: /customer-login.html
erupt:
  # Whether to enable CSRF protection
  csrf-inspect: true
  # Manage sessions via Redis (default false). When enabled, add the standard Spring Boot Redis configuration.
  redis-session: false
  # Auto-refresh Redis session (v1.10.8+)
  redis-session-refresh: false
  # Path where uploaded attachments are stored. Defaults to /opt/erupt-attachment.
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
  # Whether to record operation logs (default true). Logs can be viewed under System Management → Operation Logs.
  security:
    record-operate-log: true
    # Max request body size (bytes) buffered for operation logging; larger or chunked bodies are passed through without buffering. Default 1MB (v2.0.2+)
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

# Redis config — required when erupt.redis-session is true
spring:
  data:
    redis:
      database: 0
      timeout: 10000
      host: 127.0.0.1
```

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
