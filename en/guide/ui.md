# UI & Interaction

Erupt's screens are generated from annotations, but **how comfortable they are to use** is not. Everything below ships enabled, needs no configuration, and is mostly remembered per user and per model in the browser — reopen a page and it looks the way you left it.

## Appearance Settings

The ⚙️ button in the top-right opens the **Page config** drawer; every change applies immediately:

![Page config](/ui/page-config.png)

### Appearance

| Setting | What it does |
| --- | --- |
| Theme color | 18 presets plus a color picker, and a reset back to the default `rgb(22, 119, 255)` |
| Header color | Follow the theme / follow the theme color / a preset / a custom color |
| Color scheme | Light / Dark / System (System follows the OS live) |
| Compact mode | Tightens spacing to fit more on screen; combines with dark |
| Skin | Default / Brutalist / Liquid Glass / Workspace / Classic — mutually exclusive; since 2.3.0 the picker is a tile grid with a miniature of each shell <Badge type="tip" text="v2.3.0+" /> |
| Navigation color | Workspace skin only: 32 light / dark frame presets <Badge type="tip" text="v2.3.0+" /> |

Two skins are new in 2.3.0 <Badge type="tip" text="v2.3.0+" />:

- **Workspace**: a Slack / Feishu / DingTalk style shell — header and sidebar share one brand-tinted frame and the content floats on it as a rounded card. The frame comes in 32 light / dark presets (a light frame flips the navigation text to ink); the site default is `theme.workspaceFrame`, and when unset the frame is derived from the primary color. The login page wears the same frame under this skin
- **Classic**: the Ant Design Pro shell — navy sidebar beside a white header; in the top-menu modes the navy moves into the header


The four skins:

| Classic | Workspace |
| --- | --- |
| ![Classic skin](/ui/skin-classic.png) | ![Workspace skin](/ui/skin-workspace.png) |

| Brutalist | Liquid Glass |
| --- | --- |
| ![Brutalist skin](/ui/skin-brutalist.png) | ![Liquid Glass skin](/ui/skin-liquid-glass.png) |

`theme.customizable: false` in `app.js` <Badge type="tip" text="v2.3.0+" /> hides the branding controls — theme color, header color, skin, navigation color and menu mode — in the settings drawer, the sidebar, the login page and the home page alike, purges choices users saved earlier and forces the configured menu mode, so everyone sees one appearance. Light / dark and compact are personal comfort settings and stay switchable.

### Navigation

| Setting | What it does |
| --- | --- |
| Menu mode | Single-column / Grouped (top-level categories as flat group titles) / Dual-column (icon rail plus a submenu column) / Category (top-level categories in the header) / Top (the whole menu in the header, no sidebar, content spans the full width) / Two-row top (categories in the header, their children in a second row, no sidebar). Grouped and Two-row top are new in 2.3.0, and this drawer is now the one place to switch modes <Badge type="tip" text="v2.3.0+" /> |
| Show labels when collapsed | Menu names under the icons once the sidebar is collapsed |
| Show labels on the rail | Whether the icon rail of the dual-column mode shows menu names; only offered in that mode <Badge type="tip" text="v2.3.0+" /> |
| Multiple tabs | Pages are reused as tabs so you can jump back between menus |
| Breadcrumb nav | The path bar at the top (turned off automatically in the category and top menu modes) |

### Table

| Setting | What it does |
| --- | --- |
| Table bordered | Whether cell borders are drawn |
| Table density | Compact / Middle / Large |
| Detail panel style | Centered dialog / Side panel / Fullscreen — see [Form Panel](#form-panel); replaces the former "Drawer for Details" switch <Badge type="tip" text="v2.3.0+" /> |
| Click row to view details | When on, clicking a table row opens that record's detail panel; off by default <Badge type="tip" text="v2.3.0+" /> |

### Others

Color-weak mode, grayscale mode, RTL layout, and a button to clear the local cache.

:::tip Defaults vs. personal choice
`theme` (`primaryColor`, `headerColor`, `dark`, `compact`, `skin`, `workspaceFrame`, `menuMode`, `formPanelMode`, `loginLayout`) and `tabReuse` in `app.js` are the **system defaults** — see [Frontend Configuration](/en/guide/config-frontend). What a user picks in this drawer is stored in their browser's localStorage and wins. Clearing the cache returns them to the defaults; with `theme.customizable: false` the branding items stop accepting user choices at all.
:::

## Login Page Layouts <Badge type="tip" text="v2.3.0+" />

The login page offers five layouts, switchable from the nav at the top of the page (the choice is saved in localStorage as `login-layout`; the switch is hidden when `theme.customizable` is `false`). The site default is `theme.loginLayout` in `app.js`:

| Layout | Value | What it looks like |
| --- | --- | --- |
| Centered card | `center` | The card floats on the artwork (default) |
| Side panel | `cover` | Full-bleed artwork, the form docked right as a 440px panel |
| Wide card | `wide` | One 800px card: brand pane on the left (logo top, title bottom), form on the right |
| Wallpaper | `wallpaper` | The picture full screen, a frosted card in the middle |
| Poster | `poster` | The brand as a poster-sized headline, a small card bottom right |


The `center` and `cover` layouts, both with a custom `theme.loginBackground` picture:

![Login page: center](/ui/login-center.png)

![Login page: cover](/ui/login-cover.png)

- Below 992px every layout collapses to the centered card
- `theme.loginBackground` swaps the stock artwork for your own picture in every layout (a vignette keeps brand and copyright legible); a URL that fails to load falls back to the stock artwork instead of a blank page
- Under the Workspace skin the login page wears the same frame colors as the shell
- With [erupt-sso](/en/modules/erupt-sso) installed, single sign-on buttons appear on the card: up to three providers share a row with their names, more become round icon buttons with a tooltip

## Resizable Layout

![Resizing the sidebar](/ui/sidebar-resize.png)

| Area | Range | Remembered |
| --- | --- | --- |
| Sidebar menu | 150px – 400px | Globally — long menu names fit in one go |
| Tree panel beside a table | 120px – 600px | **Per model**, and collapsible entirely |
| AI assistant panel | Drag to size | Open state and width, per model |

The sidebar footer carries a small toolbar: refresh the menu, **locate current menu** (expands and scrolls to the item you are on), **recently visited** (the same list the home page shows) and an in-place **keyword filter** of the tree <Badge type="tip" text="v2.3.0+" />. Since 2.3.0 the whole tree can no longer be reordered by drag (the menu follows the server order; favorites still drag), and the menu-mode switch has moved into the settings drawer. The search box at the top **searches menus**, showing matches with their full path — press Enter to jump straight there.

## Table Capabilities

![Table column control](/ui/table-columns.png)

### Column control

The ▦ button in the toolbar opens the column panel:

- **Visibility**: a checkbox per column
- **Order**: drag the handle on the left to reorder
- **Pinning**: the pin button cycles through pin-left → pin-right → unpinned
- **Width**: drag the header divider; "Reset widths" at the bottom of the panel restores the defaults

All of it is saved locally **per model**, so pages never interfere with each other.

### Toolbar

| Action | What it does |
| --- | --- |
| Refresh / auto refresh | Refresh manually, or every 10s / 30s / 1min / 5min — the button lights up while it is on |
| Fullscreen | Expand the table area to the full screen |
| Query | Show or hide the search area; conditions and operators are remembered per model |
| Sort | Multi-field sort configuration |
| Print layout | Print the current row, or render it through a template |
| Import / Export | Excel import, export and template download (subject to `@Power`) |
| Duplicate row | Copy the selected row into a new-record form with the primary key cleared — handy for near-identical entries |
| Reset | Clear the search conditions and start over |
| AI | Opens the AI assistant panel on the right, scoped to the current model |

### Search and views

- **Switchable operators**: every search field carries an operator dropdown (equals / like / greater than / between / multi-select …), remembered per model; the server can pin one with [@Search(lockOperator)](/en/annotation/search)
- **Multiple views**: besides the table, a model can offer a [board](/en/annotation/vis-board), [calendar](/en/annotation/vis-calendar), [card](/en/annotation/vis-card) or [gantt](/en/annotation/vis-gantt) view, switched at the top and remembered per model
- **Tree-driven filtering**: with [@LinkTree](/en/annotation/link-tree) a tree appears on the left; picking a node filters the table, and the panel can be resized or collapsed

### Cell rendering

Cells render according to [@View(type)](/en/annotation/view), and several are interactive: images zoom on click, attachments open in a preview dialog with download, plus QR codes, progress bars, color swatches, Markdown / HTML and tags for booleans and choices. Long text is truncated with the full value on hover.

Since 2.3.0 <Badge type="tip" text="v2.3.0+" />:

- **Avatar column**: `@View(type = ViewType.AVATAR)` renders a round 32px thumbnail (120px in the detail view) with a silhouette placeholder when empty — the user table shows avatars this way
- **Wrapping cells**: with [@Layout(tableTruncate = false)](/en/annotation/layout#tabletruncate-wrapping-cells) overflowing cells wrap instead of ending in an ellipsis, and a crowded operation column keeps every action visible
- **Null booleans**: a boolean cell holding null is left blank instead of drawing an empty tag

### Bitable-style Editing <Badge type="tip" text="v2.2.0+" />

Double-click a cell (or its edit icon) to change one field in place, without opening the row form — editing data the way a spreadsheet lets you.

![Cell editing](/ui/cell-edit.png)

- **The same control the form uses**: the popover hosts the row form's own edit component, so value conversion, validation and reference pickers behave identically — copy button, AI writing assistant and character count included
- **Validated as a whole row**: the server patches the stored row with the new value and validates all of it, so a cross-field rule cannot be broken one cell at a time; `DataProxy` and the operate log match a form submission
- **Two switches**: `@Power(cellEdit)` on the model and `@Edit(cellEdit)` on the field — accounts, role codes, secrets and the like are opted out by the framework already

See [@Power → cellEdit](/en/annotation/power#celledit-in-table-cell-editing) for details.

### In-row interaction

- **Drag sort**: with [@DragSort](/en/annotation/drag-sort) configured, a grip appears at the start of each row — drag to reorder and the new order is saved
- **Row actions**: view, edit, delete, and any custom [@RowOperation](/en/annotation/row-operation) buttons
- **Remembered paging**: page size and the active view (table / card / gantt …) are kept per model

::: details What each model remembers locally
Stored in the browser's localStorage under the key `erupt.<model name>`:

| Field | Meaning |
| --- | --- |
| `columns` | Per-column visibility, width and pinning |
| `columnOrder` | Column order |
| `treeWidth` / `treeCollapsed` | Tree panel width and collapsed state |
| `aiPanelOpen` / `aiPanelWidth` | AI panel state and width |
| `searchCollapsed` / `searchFieldsCollapsed` / `searchOperators` | Search area state and the operator chosen per field |
| `pageSize` | Rows per page |
| `visIndex` | The active view |

This lives only in that browser: nothing is uploaded to the server and no other user is affected.
:::

## Dialogs & Forms

![Draggable dialog](/ui/draggable-modal.png)

- **Dialogs are draggable**: add / edit, reference pickers, sub-tables, attachment pickers — every dialog moves by its title bar, so you can push it aside and read the table underneath while filling it in
- **[Step forms](/en/annotation/form-steps)**: long forms split into a wizard at each DIVIDE
- **Input helpers**: copy the current value from the left of the input, draft it with the [AI writing assistant](/en/modules/erupt-ai/writing-assistant) on the right, and watch the live character count below
- **Code and rich text**: the code editor, Markdown and rich-text fields all support fullscreen editing and copying
- **Attachments**: multi-attachment fields reorder by drag

### Form Panel <Badge type="tip" text="v2.3.0+" />

Add / edit / view forms for a record share one **form panel** that comes in three modes. Switch from the panel's title bar or the "Detail panel style" setting in the drawer; the loaded form and any unsaved input survive the switch:

| Mode | Value | Notes |
| --- | --- | --- |
| Centered dialog | `center` | A floating, draggable dialog (default) |
| Side panel | `side` | Docked on the right; drag the edge to size it and the width is remembered (full-line forms remember their own). In view mode clicks still reach the list, and the panel is recycled for the next record |
| Fullscreen | `full` | Fills the window — for long forms and forms with sub-tables |

The site default is `theme.formPanelMode` in `app.js`; the user's own choice is stored in the browser and wins.

The title bar gathers the actions on the current record:

- **Previous / next**: step through the list with an "n / total" readout, paging automatically at the edges
- **View ↔ edit**: switch in place instead of closing and reopening
- **Copy link**: copies a deep link with `?id=<pk>`; opening the table route with it pops up that record's panel (also when tab reuse reattaches an already open tab)
- **Delete**: after a popconfirm, removes the record and moves the panel to its neighbour or closes it
- **AI assistant**: opens the chat primed with the module context and the record's current values (needs [erupt-ai](/en/modules/erupt-ai/))
- **More**: print (needs [erupt-print](/en/modules/erupt-print) and a model that has not set `@Power(print = false)`)
- **Comments**: the record's comment stream (needs [erupt-comment](/en/modules/erupt-comment))

Closing the panel, stepping to another record or leaving edit mode asks before discarding unsaved changes. **Click row to view details** is off by default — a whole row is a large target that also carries links, buttons and editable cells. Turn it on in the settings drawer and clicking a row opens that record's detail panel; rows then show a pointer cursor while links, buttons and editable cells keep their own behavior.

## Drawers <Badge type="tip" text="v2.3.0+" />

Every drawer in the app now shares one 44px header (the page header's height): title on the left, a small square close button on the right. The AI chat, notice center, Cube drill-down, flow launch, flow diagram, TPL and approval-detail drawers can be resized by dragging their inner edge, and each remembers its last width.

## Lock Screen and Profile <Badge type="tip" text="v2.3.0+" />

The avatar menu in the header gains three entries: **Profile** (change your own avatar and display name; the header updates in place), **Two-factor auth** (enrol a TOTP authenticator) and **Lock screen** (a full-window cover over the running page — tabs stay put, your password unlocks it, and a refresh keeps it locked). Profile and Lock screen are shown for platform accounts only, not for tenant sessions. See [User Management → Profile and Lock Screen](/en/modules/erupt-upms/user#profile-and-lock-screen).

![Lock screen](/ui/lock-screen.png)

## Install as a Desktop App (PWA) <Badge type="tip" text="v2.3.0+" />

Erupt installs as a progressive web app: the manifest is generated from the site config, the header doubles as the draggable window title bar, and `pwa.icon` / `pwa.shortcuts` / `faviconPath` are configurable. See [Install as a Desktop App (PWA)](/en/guide/pwa).

## Elsewhere in the Shell

| Capability | Notes |
| --- | --- |
| Watermark | Tiles "nickname-custom text-date" across the screen to discourage screenshots — see [Configuration](/en/guide/configuration) |
| Notifications | The bell in the header receives in-app notices live (requires [erupt-notice](/en/modules/erupt-notice)) |
| Help entry | The question mark can point at your own docs site, via `erupt-app.show-help-entry` / `help-doc-url` |
| Languages | 12 built in, switchable from the login page and the header |
| Fullscreen | One click to take the browser fullscreen |
| Mobile | The layout adapts; the tab bar and some toolbar buttons hide on narrow screens |
