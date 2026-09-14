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

The settings drawer in the top-right switches the look at runtime, and the choice is kept in the browser's localStorage: **skin** (Default / Brutalist / Liquid Glass), **color scheme** (light / dark / system), **compact mode**, **theme and header colors** (presets plus a picker), **menu mode** (single-column / category / dual-column) and labels under collapsed icons. The login page carries the same skin dropdown and color picker — it is the first screen a user ever sees, and it can be dressed before signing in.

**Liquid Glass** is a translucent material skin: the sidebar becomes a pane of glass — tint, backdrop blur, a specular top edge — floating on an ambient color field, with the content area inset by the same gutter so the field shows through. Components inside the content area are untouched.

For the full list of settings and the rest of the interface behavior, see [UI & Interaction](/en/guide/ui).

:::tip Default theme color
As of 2.2.0 the default theme color is `rgb(22, 119, 255)`; override it with `theme.primaryColor` in `app.js`.
:::

## Icon Set <Badge type="tip" text="v2.2.0+" />

The icon set moves from `font-awesome` 4.7 (last released in 2016) to `@fortawesome/fontawesome-free` 7.x, taking the available glyphs from 675 to 1992. That is a product surface here, not an internal detail: menu icons and the `@Drill` / `@RowOperation` icon names are strings users type themselves.

Legacy FA4 class names keep resolving through `v4-shims` (the `-o` outline icons fall back to the regular weight). One visual change: FA7 gives every `.fa` a default width of `1.25em`, so icons now sit in a uniform box — set `--fa-width: auto` for the old metrics.

## Customizing the Appearance

You can customize the frontend appearance by modifying `resources/public/app.js` and `resources/public/app.css`. See [Configuration](/en/guide/configuration).
