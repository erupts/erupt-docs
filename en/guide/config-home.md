# Custom Home Page (`home.html`)

:::info Configuration is split into four pages
- [Backend configuration (`application.yml`)](/en/guide/configuration): `erupt-app`, `erupt`, `erupt.upms`, `erupt.redis-session`, `erupt.telemetry`
- [Frontend configuration (`app.js`)](/en/guide/config-frontend): site info, logos, appearance defaults, PWA, router and lifecycle hooks
- [Frontend styles (`app.css`)](/en/guide/config-style): override or extend the UI styles
- [Custom home page (`home.html`)](/en/guide/config-home): replace the welcome page shown after login
:::

The welcome page opened after login comes from `home.html`. It is a standalone static page embedded in the workspace content area as an iframe, so it can be written with any technology and does not depend on Angular.

## The default home page

Without any configuration the framework's own home page is used:

![Default home page](/ui/skin-classic.png)

- Greets the current user by time of day, above a row of tiles: reachable menus, **account security**, unread notices (needs erupt-notice) and pinned menus (an **AI prompt box** once erupt-ai is installed) — see [Home Page Tiles](#home-page-tiles) below
- **Pinned**: click the pin on a sidebar item to keep it on the home page; with nothing pinned, the most visited menus are shown instead
- **Recently opened**: grouped into today / yesterday / earlier, one click to jump back
- The top-right controls switch light / dark and the skin, sharing the saved choices with the settings drawer

### Home Page Tiles <Badge type="tip" text="v2.4.0+" />

Two tiles changed in 2.4.0:

- **Account security** (formerly "Data models"): the big number is the days since the password was last changed (from `pwdChangedTime` in `/erupt-api/userinfo`), and the label reads "Password changed" plus MFA on / off (`mfaBound`). The tile turns orange when the password is older than 90 days, was never changed, or the site offers MFA (`mfa.enable` in `/erupt-api/erupt-app`) and the account has not bound it; a tenant session has no platform MFA, so no MFA state is shown
- **AI prompt box** (formerly "Pinned menus"): when `properties["erupt-ai"]` in `/erupt-api/erupt-app` is true and the account has the AI chat menu (the router menu with code `ai-chat`), the tile becomes an input; type a question and press Enter to open `/ai/chat?q=<question>`, which sends it as the first message of a new conversation. Otherwise the tile keeps counting pinned menus

### Strings and Languages <Badge type="tip" text="v2.4.0+" />

The default page no longer hard-codes its texts: it reads the shell's shared `erupt.i18n.csv` (the column named by `_lang` on the iframe URL, falling back to `en-US`), so overriding the translation sheet changes the home page too. Every key starts with `home.`:

| Key | Used for |
| --- | --- |
| `home.morning` / `home.noon` / `home.afternoon` / `home.evening` / `home.night` | The greeting by time of day |
| `home.menus` | The "Menus" tile |
| `home.security` / `home.days_ago` / `home.pwd_changed` / `home.pwd_unchanged` / `home.mfa_on` / `home.mfa_off` | The "Account security" tile: title, "days ago" unit, password changed / unchanged, MFA state |
| `home.unread` | The "Unread notices" tile |
| `home.pinned` / `home.ai` / `home.ask` | The "Pinned menus" tile, and the AI prompt box's label and placeholder |
| `home.quick` / `home.frequent` / `home.recent` / `home.none` | Headings of the quick-access area (Pinned / Frequent / Quick access) and its empty state |
| `home.opened` / `home.opened_none` / `home.today` / `home.yesterday` / `home.earlier` | Heading, empty state and groups of "Recently opened" |
| `home.dark` / `home.light` / `home.skin` / `home.skin_default` | Tooltips of the appearance controls |

Your own home page can fetch `erupt.i18n.csv?v=<build version>` and reuse the same sheet.

## Replacing it

Put your own page at `/resources/public/home.html` in the project. A static resource with the same name overrides the one bundled in erupt-web; nothing else needs configuring:

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

:::tip Three sources of the home page
1. If the user has a "home menu" set in [User Management](/en/modules/erupt-upms/user), that menu opens after login and `home.html` is not loaded
2. Otherwise the project's `/resources/public/home.html` is loaded when present
3. Otherwise the framework's default home page is used
:::

## What the page receives

The workspace loads the page with this URL, from which it can read the session and language:

```
home.html?v=<build version>&_token=<session token>&_lang=<current language>
```

| Parameter | Description |
| --- | --- |
| `_token` | The session token; send it in the `token` header when calling `/erupt-api/**` |
| `_lang` | The UI language, e.g. `zh-CN` or `en-US`; send it in the `lang` header to get localized texts back |
| `v` | Frontend build version, only for cache busting |

When embedded on the same origin the page can also read the host's `eruptSiteConfig` through `window.parent` (for example `domain` and `fileDomain` in a split deployment).

```javascript
var params = new URLSearchParams(location.search);
var token = params.get("_token"), lang = params.get("_lang") || "en-US";
var api = "erupt-api";
try {
    var cfg = window.parent.eruptSiteConfig;
    if (cfg && cfg.domain) api = cfg.domain + "/erupt-api";
} catch (e) { /* cross-origin embed: the host object is unreachable, keep the relative path */ }

fetch(api + "/userinfo", {headers: {token: token, lang: lang}})
    .then(r => r.json())
    .then(user => document.getElementById("hello").textContent = "Hello, " + user.nickname);
```

The endpoints the default page uses are available to yours as well:

| Endpoint | Purpose |
| --- | --- |
| `GET /erupt-api/userinfo` | Account, display name and avatar of the current user, plus `pwdChangedTime` (when the password was last changed, null if never) and `mfaBound` (whether an authenticator is bound) <Badge type="tip" text="v2.4.0+" /> |
| `GET /erupt-api/menu` | The menu tree the user may reach, handy for rendering your own navigation |
| `GET /erupt-api/notice/unread-count` | Unread notice count (needs erupt-notice) |
| `GET /erupt-api/erupt-app` | Site info, version, enabled modules (`properties`) and whether MFA is offered (`mfa.enable`) |

Any other data comes from the [erupt data endpoints](/en/advanced/rest-api) or your own APIs, with the same permission checks as inside the workspace.

## Working with the workspace

**Following the theme**: the host writes the current color scheme into the iframe's `color-scheme`, so switching light / dark never leaves a white sheet behind the page. For finer control read the `dark` class and the `--ant-primary-color` variable on the host's `<html>` and watch them with a `MutationObserver`:

```javascript
var root = window.parent.document.documentElement;
function syncTheme() {
    document.documentElement.classList.toggle("dark", root.classList.contains("dark"));
    document.documentElement.style.setProperty("--accent",
        getComputedStyle(root).getPropertyValue("--ant-primary-color").trim());
}
syncTheme();
new MutationObserver(syncTheme).observe(root, {attributes: true, attributeFilter: ["class", "style"]});
```

**Jumping to a menu**: change the host's hash to open a page inside the workspace; the path follows the menu type:

| Menu type | Path |
| --- | --- |
| Table / tree / form | `#/build/table/<model>`, `#/build/tree/<model>`, `#/build/form/<model>` |
| TPL custom page | `#/tpl/<template>` |
| Report / cube | `#/bi/<code>`, `#/cube/<code>` |
| Router | `#<route>` |

```javascript
window.parent.location.hash = "#/build/table/EruptUser";
```

**Switching the skin**: the host exposes `window.eruptApplySkin(skin)` with `default` / `classic` / `workspace` / `material` / `liquid-glass` / `brutalist` / `terminal` (`material` and `terminal` are new in 2.4.0); the default page's skin switcher is built on it.

:::warning Notes
- `_token` travels in the iframe URL, so the home page must be served from the same origin as the workspace; never host it on a third-party site
- In a cross-origin embed `window.parent` is unreachable: theme sync and menu jumps are unavailable, only the API calls work
- The home page is not kept alive by the multi-tab cache; it reloads every time the user returns, so keep it light
:::

## Complete example

A minimal page that reads the user and menus and follows the theme:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
    <style>
        :root { --accent: #1677ff; --text: rgba(0, 0, 0, .85); }
        html.dark { --text: rgba(255, 255, 255, .88); }
        body { margin: 0; padding: 32px; font-family: -apple-system, "Segoe UI", sans-serif; color: var(--text); }
        h1 { font-weight: 600; }
        h1 b { color: var(--accent); }
        .menus a { display: inline-block; margin: 6px 8px 0 0; padding: 6px 12px; border: 1px solid var(--accent); border-radius: 6px; color: var(--accent); text-decoration: none; }
    </style>
</head>
<body>
<h1>Hello, <b id="name"></b></h1>
<div class="menus" id="menus"></div>
<script>
    var params = new URLSearchParams(location.search);
    var headers = {token: params.get("_token"), lang: params.get("_lang") || "en-US"};
    var root = window.parent.document.documentElement;
    function syncTheme() {
        document.documentElement.classList.toggle("dark", root.classList.contains("dark"));
        document.documentElement.style.setProperty("--accent", getComputedStyle(root).getPropertyValue("--ant-primary-color").trim());
    }
    syncTheme();
    new MutationObserver(syncTheme).observe(root, {attributes: true, attributeFilter: ["class", "style"]});

    fetch("erupt-api/userinfo", {headers: headers}).then(r => r.json())
        .then(u => document.getElementById("name").textContent = u.nickname || u.account);
    fetch("erupt-api/menu", {headers: headers}).then(r => r.json()).then(menus => {
        var box = document.getElementById("menus");
        menus.filter(m => m.type === "table").slice(0, 8).forEach(m => {
            var a = document.createElement("a");
            a.textContent = m.name;
            a.href = "javascript:void(0)";
            a.onclick = () => window.parent.location.hash = "#/build/table/" + m.value;
            box.appendChild(a);
        });
    });
</script>
</body>
</html>
```
