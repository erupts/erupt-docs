# Erupt Web Frontend

erupt-web is the frontend module of the Erupt framework, built with Angular. It provides a complete admin management interface and is distributed as a Jar file — no separate frontend deployment is needed.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-web</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

For a frontend/backend separated deployment, you can omit this dependency and deploy the frontend independently. See [Frontend/Backend Separation](/en/advanced/separation).

## Frontend Source Code

Frontend repository: [https://github.com/erupts/erupt-web](https://github.com/erupts/erupt-web)

## Themes and Skins <Badge type="tip" text="v2.2.0+" />

The settings drawer in the top-right switches the look at runtime, and the choice is kept in the browser's localStorage: **skin** (Default / Brutalist / Liquid Glass / Workspace / Classic — since 2.3.0 picked from a tile grid with miniatures), **color scheme** (light / dark / system), **compact mode**, **theme and header colors** (presets plus a picker), **menu mode** (single-column / grouped / dual-column / category / top / two-row top) and labels under collapsed icons. The login page carries the same skin dropdown and color picker — it is the first screen a user ever sees, and it can be dressed before signing in. A site that wants one fixed brand look sets `theme.customizable: false` in `app.js` <Badge type="tip" text="v2.3.0+" />, leaving only light / dark and compact to the individual user.

**Liquid Glass** is a translucent material skin: the sidebar becomes a pane of glass — tint, backdrop blur, a specular top edge — floating on an ambient color field, with the content area inset by the same gutter so the field shows through. Components inside the content area are untouched.

**Workspace** <Badge type="tip" text="v2.3.0+" /> is a Slack / Feishu / DingTalk style shell: header and sidebar share one brand-tinted frame and the content floats on it as a rounded card, with 32 light / dark frame presets (`theme.workspaceFrame`). **Classic** <Badge type="tip" text="v2.3.0+" /> is the Ant Design Pro look — navy sidebar, white header.

For the full list of settings and the rest of the interface behavior, see [UI & Interaction](/en/guide/ui).

:::tip Default theme color
As of 2.2.0 the default theme color is `rgb(22, 119, 255)`; override it with `theme.primaryColor` in `app.js`.
:::

### Login Page Layouts <Badge type="tip" text="v2.3.0+" />

The login page comes in five layouts — centered card, side panel, wide card, wallpaper and poster — switchable from the login nav, with `theme.loginLayout` as the site default and `theme.loginBackground` for your own picture. See [UI & Interaction → Login Page Layouts](/en/guide/ui#login-page-layouts).

### Form Panel <Badge type="tip" text="v2.3.0+" />

Record forms open in one form panel that switches between a centered dialog, a side panel and fullscreen (`theme.formPanelMode`); its title bar offers previous / next, view ↔ edit, copy link, delete, AI, print and comments, and `?id=` deep links open a record directly. See [UI & Interaction → Form Panel](/en/guide/ui#form-panel).

### Install as a Desktop App (PWA) <Badge type="tip" text="v2.3.0+" />

Erupt installs as a PWA: the manifest is generated from the site config, `pwa.icon` / `pwa.shortcuts` add the icon and shortcuts, the header doubles as the window title bar and `faviconPath` sets the tab icon. See [UI & Interaction → Install as a Desktop App (PWA)](/en/guide/pwa).

## Icon Set <Badge type="tip" text="v2.2.0+" />

The icon set moves from `font-awesome` 4.7 (last released in 2016) to `@fortawesome/fontawesome-free` 7.x, taking the available glyphs from 675 to 1992. That is a product surface here, not an internal detail: menu icons and the `@Drill` / `@RowOperation` icon names are strings users type themselves.

Legacy FA4 class names keep resolving through `v4-shims` (the `-o` outline icons fall back to the regular weight). One visual change: FA7 gives every `.fa` a default width of `1.25em`, so icons now sit in a uniform box — set `--fa-width: auto` for the old metrics.

## Customizing the Appearance

You can customize the frontend appearance by modifying `resources/public/app.js` and `resources/public/app.css`. See [Frontend Configuration (`app.js`)](/en/guide/config-frontend) and [Frontend Styles (`app.css`)](/en/guide/config-style).
