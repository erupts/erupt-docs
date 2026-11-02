# Menu Management

A menu is the smallest unit in Erupt's permission system. It is more than the left-hand navigation: an Erupt class, an external link, a custom page, a button and an API are all registered as "menus", then ticked per role in [Role Management](/en/modules/erupt-upms/role).

## Generated Automatically

Each module declares its menus through `initMenus()`; they are written to the database at startup and kept in line with the declaration whenever it changes (controlled by `erupt.init-modules-menu`, on by default, see [Configuration](/en/guide/configuration) and [Automatic Module Menu Maintenance](#automatic-module-menu-maintenance) below). For table / tree menus Erupt also generates child **function button** menus from `@Erupt(power)`: add, edit, delete, view details, export, import. Whatever buttons a role ticks are the only ones that appear in the UI, and the backend checks the same values.

Your own business models can declare menus in code instead of entering them by hand, see [Plugin Development with EruptModule](/en/advanced/plugin).

## Automatic Module Menu Maintenance

> 2.4.0+

Before 2.4.0 module menus were inserted once, on first start, guarded by a `.erupt/<module>.loaded` marker file: a new container lost the file, every node of a cluster kept its own, and a menu added by an upgrade never reached the database. Now `EruptMenuSeeder` brings the menu table in line with each module's `initMenus()` on every start, with the state kept in the database table `e_upms_module`, shared by every instance:

| Column | Description |
| --- | --- |
| `module` | Module name, unique |
| `fingerprint` | SHA-256 fingerprint of the module's menu definition, generated function buttons included |
| `snapshot` | The field values the module wrote for each menu last time (JSON) |
| `erupt_version` / `seeded_at` | The erupt version and time of the last write |
| `enabled` | `false` once the module was switched off in the [Module Center](#module-center) |
| `payload` | A small value a module keeps per database (such as the telemetry instance id) |

Reconcile rules:

- **A matching fingerprint is skipped**: a module whose definition did not change costs one query and writes nothing.
- **Three-way merge per field**: for a changed definition, each menu's name, type, value, sort, icon, status and parent is compared field by field. A field still holding what the module wrote last time was touched by nobody, so it takes the new definition; a field an administrator edited keeps the edit. A menu the database never had is created; a menu an administrator deleted while the definition was unchanged stays deleted.
- **Function buttons are part of the definition**: a power switched on later in `@Erupt(power)` gains its button at the next start.
- **A menu no longer declared is disabled, not deleted**: a menu a module dropped (or a module switched off in the Module Center) is set to **Disabled**, which removes it from the tree and grants nothing (a hidden menu would still grant access, hence not hidden). Declaring it again opens it again. A menu several modules declare (such as the "System Management" folder) is not disabled when one of them stops declaring it.
- **Concurrent starts are safe**: instances starting together serialize on the module's row, so nothing is inserted twice.
- **`initFun()` runs once per database**, before the module's first menu seeding; an install from before 2.4.0 is recognised by its existing `.erupt/<module>.loaded` file (believed only while the database has users, so an empty database is not mistaken for an initialised one).

The same table holds two more pieces of once-per-database state: the default administrator `erupt / erupt` is created only when a database is first initialised (a lost marker file used to bring that well-known password back whenever no administrator was left), and the telemetry instance id no longer changes with the container.

:::tip erupt.init-modules-menu
`erupt.init-method-enum` is gone, replaced by `erupt.init-modules-menu: true | false`. Set it to `false` for a read-only database user, menus maintained by scripts, or all but one of several applications sharing one database. With it off `initFun()` does not run either.
:::

### Root Menu Sort Ranges

Each module's root menus sit in a fixed range by purpose, and the sidebar uses those groups to show section titles (platform menus and menus you created by hand get no title and join whichever section their sort places them in). Use the same ranges when declaring your own root menus:

| Group | Sort range | Built-in examples |
| --- | --- | --- |
| Platform `PLATFORM` | 0 – 20 | Home 0, System Management 10 |
| Business `BUSINESS` | 30 – 80 | Reports 30, Notice Manager 60, Print Manager 70 |
| AI `AI` | 100 – 150 | AI Manager 100, Knowledge Base 120, AI Staff 130, AI Decision 140, AI Dev 150 |
| Developer tools `DEV_TOOLS` | 200 – 240 | Model Atlas 230, Config 240 |
| Operations `OPS` | 300 – 340 | System Monitoring 300, Job Manager 310, Remote Desktop 330, Micronode Management 340 |

To place a menu right after a given sibling, use `MetaMenu.after(code)` instead of a hard-coded sort value, see [Plugin Development](/en/advanced/plugin#metamenu-after).

## Module Center

> 2.4.0+

**System Management → Module Center** (route `/module-center`, menu code `$modules`) lists the installed modules as cards by group: **Platform / Business / AI / Developer tools / Operations / Data sources / Other**. Each card shows the module name, a one-sentence description, a documentation link (to docs.erupt.xyz, in the language of the current UI), the number of menus it declares, and a switch.

- **Switching a module off** disables the menus it **alone** declares (menus shared with other modules stay), flushes the menu cache at once and updates the sidebar; the state is written to `e_upms_module.enabled`, survives restarts, and startup skips the module.
- **Switching it back on** reconciles its menus with the current definition; `initFun()` does not run a second time.
- **erupt-upms cannot be switched off** (its card is tagged "Core module"): doing so would take the Module Center's own menu with it.
- A module that declares no menus (data connectors, for instance) has no switch and is listed for information only.
- Group, description and documentation link come from each module's `ModuleInfo` (`group` / `description` / `docs`); a module without a group is listed under "Other", see [Plugin Development](/en/advanced/plugin#moduleinfo).

The page's endpoints `GET /erupt-api/modules` and `POST /erupt-api/modules/{name}/enabled?value=true|false` are both checked against the "Module Center" menu permission.

## Menu Types

| Menu Type | Type Value | Description |
| --- | --- | --- |
| Table | Erupt class name (case-insensitive) | Table view |
| Tree | Erupt class name (case-insensitive) | Tree view |
| Form | Erupt class name (case-insensitive) | Opens straight into the form view |
| Link | A URL | Opens inside the menu container (iframe) |
| Micro-frontend Link | A URL | Opens in the micro-frontend container (2.2.0+). For targets that refuse framing via `X-Frame-Options` / `frame-ancestors` but allow cross-origin reads |
| New Tab | A URL | Opens in a new browser tab |
| Current Window | A URL | Full-page navigation in the current window |
| Page Route | Route path | Frontend router hash |
| Full Screen | Route path | Hides navigation and sidebar, fills the screen |
| Button | Permission string | Controls button visibility, not shown in navigation |
| Interface Name | API name | API permission string, used with `@EruptMenuAuth` |
| Report | Report code | Requires the erupt-report module |
| Template | Template filename (under the tpl directory) | Requires the erupt-tpl module |

## Link vs Micro-frontend Link

Both **Micro-frontend Link** and **Link** embed an external site and take a full URL as the type value. They differ in what the target site has to allow.

The micro frontend is not affected by the target's `X-Frame-Options` or `frame-ancestors`, because the remote page is never navigated to as a frame — the host fetches it. The price is that the target must allow cross-origin reads: the HTML and every static asset need CORS headers that permit your admin domain.

**Link** (the iframe route) is the opposite: no CORS needed, but any one of the headers below makes the browser refuse it, leaving a blank area or a broken-document icon:

```
X-Frame-Options: DENY
X-Frame-Options: SAMEORIGIN
Content-Security-Policy: frame-ancestors 'none'
```

This is the target server's policy and cannot be worked around from the frontend. The only fix is to have them allow `frame-ancestors` for your admin domain.

## Fields

| Field | Description |
| --- | --- |
| Name | Text shown in navigation, i18n-aware |
| Status | Open / Hidden / Disabled. A **hidden** menu is not listed in navigation but its permission still applies, useful for pages reached only by link |
| Parent Menu | Any depth; navigation expands one level by default |
| Order | Lower values sort first |
| Icon | A Font Awesome class such as `fa fa-users`. Reference: [https://www.thinkcmf.com/font/search/index.html](https://www.thinkcmf.com/font/search/index.html) |
| Code | Unique key, read-only once generated. Automatic module menu maintenance uses it to recognise the same menu |
| Custom Param | Extra parameter passed to the page, readable from TPL pages and the frontend |

## Gating UI Elements by Menu

A menu value can also act as a switch in business code. `ViaMenuValueCtrl` implements `ExprBool.ExprHandler` and shows a field or button only when the current user holds a given menu:

```java
@RowOperation(
    title = "Approve",
    show = @ExprBool(exprHandler = ViaMenuValueCtrl.class, params = "audit_btn"),
    operationHandler = AuditHandler.class
)
```

`params` is the menu's type value. Create a menu of type "Button" with value `audit_btn`, and whichever roles receive it can see the button.

Menu permissions are loaded and cached at login. After changing menus or roles, users must log in again or press the refresh button in the navigation bar.
