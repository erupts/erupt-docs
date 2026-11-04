# Frontend Styles (`app.css`)

:::info Configuration is split into four pages
- [Backend configuration (`application.yml`)](/en/guide/configuration): `erupt-app`, `erupt`, `erupt.upms`, `erupt.redis-session`, `erupt.telemetry`
- [Frontend configuration (`app.js`)](/en/guide/config-frontend): site info, logos, appearance defaults, PWA, router and lifecycle hooks
- [Frontend styles (`app.css`)](/en/guide/config-style): override or extend the UI styles
- [Custom home page (`home.html`)](/en/guide/config-home): replace the welcome page shown after login
:::

`app.css` overrides the framework's default styles or adds your own. Create it by hand at `/resources/public/app.css`, next to `app.js`; without the file the frontend runs on its defaults.

## How it is loaded

`index.html` injects `app.css` after the framework stylesheets with a cache-busting stamp that changes on every build (`app.css?_=<hash>`), so its rules naturally come last. Edit the file and reload the page; no frontend build is needed.

Where to change what:

| To change | Use |
| --- | --- |
| Primary color, header color, skin, menu mode, login layout | the [`theme` block in app.js](/en/guide/config-frontend), not CSS |
| Logo, title, favicon | `logoPath` / `title` / `faviconPath` in app.js |
| Spacing, radius or font of a component, hiding a button, custom icon classes | `app.css` |
| The whole welcome page | [home.html](/en/guide/config-home) |

## Selector precedence

Component styles shipped by the framework rank fairly high; prefix your selector with `:root` (or `html`) to outrank them:

```css
/* Example: wider login card, bigger radius, primary-colored top edge */
:root layout-passport .lp-card {
    max-width: 420px;
    border-radius: 16px;
    border-top: 4px solid var(--ant-primary-color);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
}
```

Avoid `!important`: the framework recomputes styles when dark or compact mode is toggled, and `!important` rules break those states.

## Per theme and per skin

Every appearance state is a class on `<html>`, so `app.css` can style them apart:

| Class on `<html>` | Meaning |
| --- | --- |
| `dark` | Dark mode (also toggled live when following the OS) |
| `compact` | Compact mode |
| `brutalist-theme` | Brutalist skin |
| `liquid-glass` | Liquid Glass skin |
| `workspace` | Workspace skin |
| `classic` | Classic skin |
| (no skin class) | Default skin |

```css
/* Dark glass login card in dark mode */
:root.dark layout-passport .lp-card {
    background: rgba(20, 20, 20, 0.72);
}

/* Smaller sidebar type in the Workspace skin only */
:root.workspace .alain-default__aside .sidebar-nav__item {
    font-size: 13px;
}
```

## Design tokens (CSS variables)

Colors and fonts are defined as CSS variables that switch automatically in dark mode. Reference them instead of hard-coding colors so dark mode, compact mode and every skin keep working:

| Variable | Purpose |
| --- | --- |
| `--ant-primary-color` | Primary color (from `theme.primaryColor` in app.js or the user's choice) |
| `--erupt-bg-layout` | Page / canvas background |
| `--erupt-bg-container` | Cards, panels, table headers |
| `--erupt-bg-elevated` | Popups and floating panels |
| `--erupt-bg-spotlight` | Subtle emphasis: table header, zebra rows |
| `--erupt-text` / `--erupt-text-secondary` / `--erupt-text-tertiary` / `--erupt-text-quaternary` | Four text levels |
| `--erupt-border` / `--erupt-border-secondary` | Borders |
| `--erupt-fill` / `--erupt-fill-secondary` / `--erupt-fill-tertiary` | Neutral fills for hover, pressed, tracks |
| `--erupt-header-bg` / `--erupt-header-text` / `--erupt-header-fill` / `--erupt-header-active-bg` / `--erupt-header-border` | Header palette, written by the header color setting; rarely needs overriding |
| `--erupt-scrollbar-track` / `--erupt-scrollbar-thumb` | Scrollbars |
| `--erupt-font` / `--erupt-code-font` | UI font / monospace font |

The variables themselves can be overridden in `app.css`, for example to swap the global font:

```css
:root {
    --erupt-font: "Inter", "PingFang SC", "Microsoft YaHei", sans-serif;
}
```

## Common recipes

**Custom icon classes**: icons for menus, row operations and the like are CSS class names, so you can define your own in `app.css` (the shipped `app.css` does exactly this) and enter `icon-rocket` in menu management:

```css
.icon-rocket:before {
    content: "🚀";
}
```

**Hide a header button you do not need**:

```css
/* Hide the fullscreen button in the header */
:root .alain-default__header [data-action="fullscreen"] {
    display: none;
}
```

**Denser tables**:

```css
:root .erupt-table .ant-table-tbody > tr > td {
    padding-top: 6px;
    padding-bottom: 6px;
}
```

:::tip Finding selectors
Inspect the target element in the browser dev tools, copy its class and prefix `:root`. Component classes may change between framework versions, so re-check custom styles after an upgrade.
:::
