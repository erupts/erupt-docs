# Frontend Configuration (`app.js`)

:::info Configuration is split into four pages
Erupt is configured in two places: the **backend** in `application.yml`, and the **frontend** through static files under `resources/public/`. Every entry is optional; configure only what you need.

- [Backend configuration (`application.yml`)](/en/guide/configuration): `erupt-app`, `erupt`, `erupt.upms`, `erupt.redis-session`, `erupt.telemetry`
- [Frontend configuration (`app.js`)](/en/guide/config-frontend): site info, logos, appearance defaults, PWA, router and lifecycle hooks
- [Frontend styles (`app.css`)](/en/guide/config-style): override or extend the UI styles
- [Custom home page (`home.html`)](/en/guide/config-home): replace the welcome page shown after login
:::

Create the file manually at `/resources/public/app.js`.

It covers: basic parameters, route callbacks, global lifecycle hooks, and more.

```javascript
window.eruptSiteConfig = {
    // Erupt API endpoint — required for frontend/backend separation
    domain: "",
    // Attachment URL. Since 2.3.0 an empty value is filled from the AttachmentProxy registered on the backend (e.g. erupt-data-s3); set it only as an explicit override
    fileDomain: "",
    // Title
    title: "Erupt",
    // Description
    desc: "Universal data management framework",
    // Whether to display copyright info
    copyright: true,
    // Enable multi-tab route reuse by default (v2.2.0+); the user's choice in the settings drawer wins
    tabReuse: false,
    // Custom copyright content (v1.12.8+)
    copyrightTxt: function() {
      return "Copyright xxxx"
    },
    // AMap (高德) API key — required when using the map component
    amapKey: "xxxx",
    // AMap SecurityJsCode
    amapSecurityJsCode: "xxxxx",
    // Logos: leave a key out to use the default (the bundled erupt mark); set it to null or '' to show nothing in that slot. All three keys follow this rule since v2.3.0
    // logoPath: "erupt.svg",      // expanded header logo (default: the bundled erupt mark)
    // logoFoldPath: null,         // logo once the sidebar is collapsed, v1.12.21+ (default: follows logoPath; with no logo at all the site's initial is drawn in a framed square)
    // loginLogoPath: null,        // login page logo (default: follows logoPath)
    // Logo text
    logoText: "erupt",
    // Registration page URL
    registerPage: "",
    // Browser tab icon — ico, png or svg; defaults to favicon.ico (v2.3.0+)
    // faviconPath: "https://docs.erupt.xyz/icon.svg",
    // Installed app (PWA), v2.3.0+. Name, description and color come from logoText / title / desc and the
    // header; this block only adds the icon and the icon's right-click menu
    pwa: {
        // icon: "assets/pwa-icon.svg",             // svg, or a png / jpg / webp of 512px or larger
        // shortcuts: [{name: "Home", url: "./#/"}], // hash routes work; optional icon / description
    },
    // Appearance defaults. Each one applies only until the user picks something in the
    // "Page config" drawer; that choice is remembered in the browser and wins from then on
    theme: {
        // Let users change the branding side of the appearance (theme color, header color, skin, navigation color, menu mode), v2.3.0+
        // false hides those controls, purges choices users saved earlier and forces what is configured here; light/dark and compact stay per-user
        customizable: true,
        // Primary color; the default is rgb(22, 119, 255) as of 2.2.0
        primaryColor: "rgb(22, 119, 255)",
        // Header bar color: "primary" (follow the primary color) or any CSS color
        headerColor: "primary",
        // Color scheme: false | true | "auto" (follow the OS)
        dark: false,
        // Compact mode
        compact: false,
        // Skin: "default" | "brutalist" | "liquid-glass"
        //   | "workspace" (chat-app frame: brand-tinted sidebar + header, content as a rounded card, v2.3.0+) | "classic" (Ant Design Pro: navy sidebar, white header, v2.3.0+)
        skin: "default",
        // workspace skin only: navigation frame preset, derived from primaryColor when unset (v2.3.0+)
        //   light: "mist" | "sky" | "azure" | "salt" | "gray" | "mint" | "mint-chip" | "lime" | "citrus" | "banana" | "brass" | "almond" | "peach"
        //          | "dawn" | "blush" | "raspberry" | "mauve" | "lilac" | "lavender-mint"
        //   dark:  "deep-sea" | "lagoon" | "indigo" | "slate" | "starry" | "teal" | "jade" | "pine" | "clementine" | "wine" | "aubergine" | "plum" | "graphite"
        // workspaceFrame: "sky",
        // Menu mode: "normal" sidebar | "group" categories as flat group titles (v2.3.0+) | "dual" two-column sidebar | "split" categories in the header
        //   | "top" whole menu in the header, no sidebar | "top-split" categories in the header, their children in a second row, no sidebar (v2.3.0+)
        menuMode: "normal",
        // How record forms open: "center" floating dialog | "side" right panel | "full" fullscreen (v2.3.0+)
        // formPanelMode: "center",
        // Login page layout: "center" card on the artwork | "cover" form docked right | "wide" one wide card, brand left | "wallpaper" full-screen picture, frosted card | "poster" headline brand, small card (v2.3.0+)
        // loginLayout: "center",
        // Login page picture; replaces the stock artwork in every layout ("wallpaper" adds the frosted card) (v2.3.0+)
        // loginBackground: "https://example.com/login-bg.jpg",
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
