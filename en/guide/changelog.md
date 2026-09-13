# Changelog

## 2.2.0 (2026-09-15) <Badge type="tip" text="Spring Boot 3.5.16" />

:::warning Breaking changes
Read the [V 2.2.0 Upgrade Guide](/en/guide/upgrade#v-2-2-0-upgrade-guide) before upgrading.

**erupt-designer data moves to an embedded SQLite file**: business data no longer lives in the main database's `e_designer_data` table and is **not migrated automatically**; the file needs its own backup and a persistent volume.

Table structures change too — see [Database Changes](#database-changes) at the end of this release.
:::

🦞 Open-sourced [erupt-atlas](/en/modules/erupt-atlas): the relations already implied by your annotations, drawn as a graph — lineage tracing, dependency layers, a module coupling matrix, impact analysis, and a structural audit for cycles, shared tables and orphan models.

🦞 Open-sourced [erupt-remote](/en/modules/erupt-remote): remote hosts in the browser — VNC desktops and SSH shells over one WebSocket, credentials stored AES-GCM encrypted, and the VNC authentication answered server-side so the password never reaches the front end.

🌟 Tables gain [bitable-style editing](/en/annotation/power#celledit-in-table-cell-editing): double-click a cell to change one field in place, without opening the row form. The server validates the whole row, so `DataProxy`, the operate log and the edit event behave exactly as a form submission — gated by `@Power(cellEdit)` on the model and `@Edit(cellEdit)` on the field.

🌟 [AI writing assistant](/en/modules/erupt-ai/writing-assistant) on text fields: generate, polish, continue, shorten or expand a value with the rest of the form as the brief. Streams over SSE and persists nothing; `@Edit(prompt)` is that field's authoring guidance.

🌟 [erupt-ai goes multimodal](/en/modules/erupt-ai/chat#multimodal-conversation): attach images with the paper-clip button or a clipboard paste and send them alongside the text. Images are persisted with the message and carried along when the history context is rebuilt, regenerated or edit-resent.

🌟 New [Liquid Glass skin](/en/modules/erupt-web#themes-and-skins): the sidebar becomes a translucent pane of glass — backdrop blur, specular top edge — floating on an ambient color field, switchable against the default and Brutalist skins from the settings drawer.

🌟 New [dark theme](/en/modules/erupt-web#themes-and-skins): light / dark / auto, where auto follows the OS live, and charts, code editors and Markdown previews follow along; compact mode combines freely with it.

🌟 [TPL fields](/en/field-types/tpl#talking-to-the-form) now talk to the form both ways: a template reads every sibling field's value and writes back formData and editExpr, so a custom editor is no longer cut off from the form it lives in.

🧩 [Theme color and header color](/en/modules/erupt-web#themes-and-skins) are now set with a color picker and remembered; the default theme color is `rgb(22, 119, 255)`.

🧩 [Menu layout](/en/modules/erupt-web#themes-and-skins) offers single-column, split and dual-column modes — dual being a first-level icon rail plus the selected category's children — and menu names can show under the icons when the sidebar is collapsed.

🧩 A [dark sidebar](/en/modules/erupt-web#themes-and-skins) can be turned on on its own while the rest of the UI stays light.

🧩 The [login page](/en/modules/erupt-web#themes-and-skins) gained a skin dropdown and a theme color picker, so the first screen can be dressed before signing in.

🧩 Multi-tab improvements: pages opened from a row operation or a link (remote host, AI canvas, cube dashboard, form designer) name their tab after their data and close it on back.

🧩 The menu tree expands one level by default, so a large menu no longer fills the screen at once.

🧩 Upgraded to Font Awesome 7, taking available icons from 675 to 1992; legacy FA4 class names keep working.

🧩 The micro-frontend container switched to the iframe sandbox, so Vite / ESM sub-apps load correctly and several micro-frontend menus can be open at once.

🧩 New [micro-frontend link menu type](/en/modules/erupt-upms#menu-management): opens an external URL in the micro-frontend container when the target refuses framing.

🧩 Gantt charts and the Markdown editor load their libraries on demand, only when a page actually shows one.

🧩 [TEXTAREA](/en/field-types/textarea#configuration) gained configuration: max length, visible row bounds, and `@` / `#` mentions (static candidates plus a `TagsFetchHandler`, served on demand).

🧩 [AUTO_COMPLETE](/en/field-types/auto-complete#static-candidates) supports static `values`; `handler` is no longer required.

🧩 The [NUMBER](/en/field-types/number) input ignores the mouse wheel, so scrolling a page can no longer nudge a value.

🧩 Tree view labels now go through [@EruptI18n](/en/advanced/i18n) translation, so tree pages such as Menu Management follow the console language instead of showing their authored text.

🧩 [erupt-designer](/en/modules/erupt-designer#data-storage) stores its data in an embedded SQLite file: one real table per published design, with filtering, sorting and paging pushed down as SQL regardless of the host database.

🧩 [erupt-ai-canvas](/en/modules/erupt-ai-canvas) enhancements: a canvas binds several data models, each with its own add / edit / delete permission; generation runs asynchronously, plus page validation and publish versions.

🧩 A [model picker](/en/modules/erupt-ai/chat#model-picker) in the chat input toolbar switches models mid-conversation; shown only when more than one enabled model exists, and hidden when the model is pinned through `?llm=`.

🧩 The AI now replies in the language the console is set to, instead of drifting to Chinese whatever language the question was asked in.

🧩 Added [`erupt.ai.request-timeout`](/en/guide/configuration#erupt-ai-—-ai-module), raising the LLM read timeout to 15 minutes by default (langchain4j defaults to 60s, which cuts off long non-streaming generations).

🧩 [erupt-print](/en/modules/erupt-print) templates are authored with CKEditor, matching the storage format the frontend print-template editor expects (Velocity tokens plus widget markup).

🧩 Added [anonymous telemetry](/en/guide/telemetry) — version and module stats only, and it can be turned off at any time.

🧩 User and role lists are no longer scoped to their creator — visibility is decided by menu and role permissions. **Review those two menu grants after upgrading**; see the [upgrade guide](/en/guide/upgrade#v-2-2-0-upgrade-guide).

🧩 WebSocket pushes go through a per-connection async queue, so business threads never block on slow clients.

🧩 ip2region loads its xdb file on demand instead of shipping the database in the jar.

🐞 Fixed 64-bit id precision loss in the browser: erupt-api responses returning bare Map / Collection bypassed Gson's safe-number serialization.

🐞 Fixed scheduled jobs crashing with `redis-session` enabled — the LockProvider is now resolved from the Spring container. Thanks to [chenxiaolong8023](https://github.com/chenxiaolong8023) for the contribution.

🐞 Fixed sub-table row corruption caused by unstable temporary primary keys.

🐞 Fixed the drag-sort grip appearing on placeholder and measuring rows.

🐞 Fixed the designer copying a field along with its original field id.


### Database Changes

:::info
Schema changes are applied automatically by JPA / Hibernate at startup. Run these manually only if automatic DDL is disabled (`spring.jpa.hibernate.ddl-auto=none` or `validate`).
:::

This release adds the table `e_ai_canvas_model`, drops two columns from `e_ai_canvas` after migrating them, adds one column to `e_ai_chat_message`, and leaves `e_designer_data` unused. Adding [erupt-remote](/en/modules/erupt-remote) also creates `e_remote_host`, which Hibernate builds on its own.

::: details Show the SQL (MySQL syntax; translate for other databases)

**New table `e_ai_canvas_model` (erupt-ai-canvas)**

```sql
CREATE TABLE e_ai_canvas_model
(
    id           BIGINT NOT NULL AUTO_INCREMENT,
    canvas_id    BIGINT,
    data_type    VARCHAR(255),
    model        VARCHAR(255),
    purpose      VARCHAR(255),
    allow_add    BIT(1),
    allow_edit   BIT(1),
    allow_delete BIT(1),
    PRIMARY KEY (id)
);
ALTER TABLE e_ai_canvas_model ADD CONSTRAINT fk_ai_canvas_model_canvas FOREIGN KEY (canvas_id) REFERENCES e_ai_canvas (id);
```

**Changed columns on `e_ai_canvas` (erupt-ai-canvas)**

Model bindings moved into `e_ai_canvas_model`. **Migrate the data first, then drop the old columns**:

```sql
INSERT INTO e_ai_canvas_model (canvas_id, data_type, model, allow_add, allow_edit, allow_delete)
SELECT id, data_type, target_model, 0, 0, 0 FROM e_ai_canvas WHERE target_model IS NOT NULL;

ALTER TABLE e_ai_canvas DROP COLUMN data_type;
ALTER TABLE e_ai_canvas DROP COLUMN target_model;
```

**New column on `e_ai_chat_message` (erupt-ai)**

```sql
ALTER TABLE e_ai_chat_message ADD COLUMN images LONGTEXT COMMENT 'JSON array of image attachment paths sent with a user message';
```

**`e_designer_data` is no longer used (erupt-designer)**

Designer business data moves to an embedded SQLite file (`data/designer.db` by default). The table is neither read nor written any more, and **Hibernate will not drop it for you**. Nothing is migrated automatically, so drop it by hand only once you are sure nothing in it is still needed (or it has been exported):

```sql
-- Irreversible: confirm the data is migrated or no longer needed first
DROP TABLE e_designer_data;
```

The design config table `e_designer` is still in use — do not drop it.

:::

## 2.1.1 (2026-08-30) <Badge type="tip" text="Spring Boot 3.5.16" />

🌟 Added the [MULTI_FORM](/en/field-types/multi-form) edit type — one-to-many child rows are edited directly as inline form blocks, ideal when child tables have many fields.

🌟 [@Layout](/en/annotation/layout) added the [formSteps step-form](/en/annotation/form-steps) wizard mode: DIVIDE fields delimit the steps, splitting long forms into guided stages.

🌟 [erupt-cube](/en/modules/pro/erupt-cube/visual-analysis#map-report) added a Map report type: ECharts-based choropleth maps with a GeoJSON map registry and region-click drill-down linkage.

🧩 [@Search](/en/annotation/search) added `lockOperator` — the query operator is enforced server-side so crafted requests cannot bypass frontend query restrictions.

🧩 Choice and reference field search now supports [IN / NOT_IN multi-select queries](/en/annotation/search#multi-select-search-with-in--not_in), matching multiple options at once.

🧩 [DATE](/en/field-types/date) picker added a QUARTER mode plus `min` / `max` selectable date bounds.

🧩 [NUMBER](/en/field-types/number) input enhanced with decimal precision, step size, prefix/suffix units, and thousands separator.

🧩 [COLOR](/en/field-types/color) picker added configuration for alpha channel, preset swatches, and color value text.

🧩 [erupt-job](/en/modules/erupt-job#cluster-deduplication) supports cluster deduplication: with `redis-session` enabled, each scheduled job runs on exactly one node across the cluster.

🧩 Security hardening: nested sub-model requests (TAB, COMBINE, reference fields, etc.) are now authorized against their parent's menu permission.

🧩 ADD/EDIT function permissions are auto-generated for FORM-type menus — no manual configuration needed.

🧩 Sidebar menu gained a toolbar: refresh, reset, expand all, and split mode.

🧩 Tree views support batch delete with checkboxes.

🧩 Table column widths are computed from measured text for better accuracy; overly long header breadcrumbs are truncated with ellipsis; the multi-tab bar is hidden on mobile.

🧩 Added the OrcaRouter LLM provider — thanks to [XiaoHuo888-hue](https://github.com/XiaoHuo888-hue) for the contribution.

🐞 Fixed RAG knowledge-base ingestion failing for remote attachments and stale embedding clients after configuration changes.

🐞 Fixed the TIME search filter being blank and unusable.

🐞 Fixed Markdown fields not displaying asynchronously loaded content — thanks to [chenxiaolong8023](https://github.com/chenxiaolong8023) for the contribution.

🐞 Fixed left-join queries in erupt-cube semantic models.

🐞 Fixed the fixed-mode multi-tab bar overlapping page content.

## 2.1.0 (2026-08-23) <Badge type="tip" text="Spring Boot 3.5.16" />

> 🦞 15 modules open-sourced &emsp; 🔌 13+ data connectors &emsp; 🤖 Major AI upgrades

🦞 Open-sourced the [Erupt Report](/en/modules/erupt-report/) module (formerly the commercial erupt-bi) — define reports and charts in pure SQL, multi-dimensional analytics with zero frontend code.

🦞 Open-sourced the [erupt-ai-canvas](/en/modules/erupt-ai-canvas) module: generate a complete page from one sentence — SSE streaming generation, version rollback, element picking, multi-device preview, one-click publish to menu, with live data from the Erupt backend.

🦞 Open-sourced the erupt-ai-rag module: [knowledge bases with vector retrieval (RAG)](/en/modules/erupt-ai-rag), pluggable embedding models and vector stores (pgvector, Redis, etc.), with Agentic RAG support.

🦞 Open-sourced the erupt-ai-staff module: [AI digital employees](/en/modules/erupt-ai-staff) bound to real system accounts, inheriting UPMS permissions, running Cron-scheduled tasks, and pushing work reports to DingTalk, WeCom, Feishu, or Slack.

🦞 Open-sourced the erupt-data connector layer: where data lives, admin follows — one unified data-source interface, letting the same annotated model perform CRUD, pagination, and search over any data. 11 new data-source modules:

| Module | Description |
|---|---|
| [erupt-data-jdbc](/en/modules/erupt-jdbc) | Plain JDBC single-table data source, no JPA mapping needed — supports ClickHouse, Doris, TDengine, DM, and other JDBC-driver-only databases |
| [erupt-data-http](/en/modules/erupt-http) | REST APIs as data sources — map any HTTP service to a manageable admin table |
| [erupt-data-es](/en/modules/erupt-es) | Elasticsearch data source for managing and full-text searching index data |
| [erupt-data-redis](/en/modules/erupt-redis) | Visual management of Redis key-value data |
| [erupt-data-memory](/en/modules/erupt-memory) | In-memory data source — manage data without a database |
| [erupt-data-file](/en/modules/erupt-file) | Files as tables, supporting CSV, JSONL, TSV, INI, and more |
| [erupt-data-k8s](/en/modules/erupt-k8s) | Visual management of Kubernetes cluster resources |
| [erupt-data-ldap](/en/modules/erupt-ldap) | LDAP directory service data source |
| [erupt-data-feishu](/en/modules/erupt-feishu) | Feishu Bitable data source |
| [erupt-data-notion](/en/modules/erupt-notion) | Notion data source |
| [erupt-data-s3](/en/modules/erupt-s3) | S3 object storage data source |

🌟 [erupt-cube](/en/modules/pro/erupt-cube/sql) gains a SQL Port: a PostgreSQL-compatible wire-protocol port (Calcite query pushdown) — any BI tool can connect to the semantic layer as if it were PostgreSQL.

🌟 [erupt-ai-claw](/en/modules/erupt-ai-claw/) enhancements: sandboxed file and shell tools, an Agent Skills library with skill sedimentation, an Erupt model CRUD toolbox, and JVM/Spring runtime diagnostics tools.

🌟 [erupt-cloud](/en/modules/erupt-cloud) enhancements: node lifecycle management, resource reporting, routing failover and graceful shutdown, plus support for mounting erupt-flow, erupt-ai-claw, and erupt-monitor.

🌟 [erupt-flow](/en/modules/pro/erupt-flow/development#flex-nodes) gains Flex automation nodes: HTTP request, script, data, variable (JS expression resolution), notify, and wait-callback — flows can now perform automated actions without human steps.

🌟 New erupt-docker all-in-one image — spin up a complete Erupt environment with a single command.

🌟 AI chat can now be stopped mid-generation; partial output is kept and marked as interrupted.

🧩 [erupt-monitor](/en/modules/erupt-monitor#erupt-class-registry) adds an Erupt class registry page listing runtime models, with one-click publish to menu.

🧩 [@Power](/en/annotation/power) adds an `ai` switch to control AI availability per entity.

🧩 Admin UI refresh: new Brutalist theme with one-click toggle, redesigned login screens and brand logo.

🧩 Table columns now filter dynamically based on [@Vis](/en/annotation/vis) field visibility.

🐞 Fixed the change-password API failing when `pwd-transfer-encrypt = false`.

🐞 Fixed operation-log recording errors caused by masking failures.

:::warning Breaking Changes
- `erupt-jpa` has been renamed to `erupt-data-jpa`, and `erupt-mongodb` to `erupt-data-mongodb` (both now part of the erupt-data connector layer) — update the artifactId in your Maven dependencies.
- The AMIS integration module in `erupt-tpl-ui` has been removed; migrate to another template engine integration if you were using it.
:::

## 2.0.4 (2026-07-19) <Badge type="tip" text="Spring Boot 3.5.16" />

🌟 New [`BUTTON` edit type](/en/field-types/button) — an in-form button that calls a backend handler with all current form values, supporting form population and dynamic field configuration.

🌟 New [`@DragSort` row drag sorting](/en/annotation/drag-sort) — reorder table rows by dragging, with the result automatically persisted to the sort field.

🌟 New [`PROGRESS` view type](/en/annotation/view#display-types-viewtype) — display numeric columns as progress bars; the SLIDER edit type contributes its max value automatically.

🌟 New [`PASSWORD` view type](/en/annotation/view#display-types-viewtype) — sensitive fields are masked and the actual value is never sent to the client.

🧩 [`PASSWORD` edit type](/en/field-types/password#masked-edit-echo) security hardening: edit echo returns only a mask placeholder; submitting it unchanged keeps the stored password.

🌟 [Card view](/en/annotation/vis-card) now supports card selection, with selected-state styling wired to action buttons.

🧩 Built-in forms for AI models, MCP servers, agents, and scheduled jobs gain test/validation buttons for one-click connection and configuration checks.

🧩 [erupt-ai](/en/modules/erupt-ai/) supports an embedded chat mode; the LLM `apiKey` is now masked with the password view.

🧩 More lenient date parsing, accepting a wider range of date/time input formats.

🐞 Fixed password fields not being masked in operation logs.

🐞 Fixed swapped "Hidden" and "Disable" labels in the menu status enum.

🐞 Fixed an error caused by the AI chat drawer opening outside the Angular zone.

## 2.0.3 (2026-07-04) <Badge type="tip" text="Spring Boot 3.5.16" />

🌟 New [`erupt-spring-boot-starter` and `erupt-spring-boot-starter-all`](/en/guide/quick-start#manual-integration-existing-project) starters — integrate Erupt core or every feature module with a single dependency.

🌟 New [`CALLOUT` edit type](/en/field-types/callout) — render static guidance content inside forms with HTML support and card/info/warning styles; the field is neither collected nor persisted.

🌟 [`@Search`](/en/annotation/search) adds an `operator` property to specify the default query operator per field; `AUTO` resolves by edit type.

🌟 [erupt-print](/en/modules/erupt-print) templates now support block-level template variables, with a new editor variable plugin, automatic print-variable generation, and loading feedback in print preview.

🧩 Operation logging enhanced: new [`record-operate-log-max-body-size`](/en/guide/configuration) property caps the recorded request body size, with improved request-context cleanup.

🧩 Admin home page visual refresh: animated blueprint background, collapsible sidebar, and refined terminal tab styling.

🐞 Fixed unbounded captcha image height parameter that could be abused to generate oversized images.

🐞 Fixed a deserialization error in erupt-designer when the form `view` field is null.

## 2.0.1 (2026-06-29) <Badge type="tip" text="Spring Boot 3.5.15" />

> 🚀 New modules ×2 &emsp; 🌟 New features ×21 &emsp; 🎨 Frontend 50+ updates

:::warning
2.0.0 contains multiple breaking changes. Please read the [1.14.x → 2.0.0 Upgrade Guide](/en/guide/upgrade) before upgrading.
:::

🚀 Open-sourced [erupt-designer](/en/modules/erupt-designer) — visually design Erupt entity models at runtime and publish them to the menu with one click.

🚀 Open-sourced [erupt-print](/en/modules/erupt-print) — define print templates and variables for any Erupt entity and print rows with a single click.

🌟 [erupt-monitor](/en/modules/erupt-monitor) **completely rewritten**: new diagnostics system covering JVM, HikariCP pool, HTTP stats, and Redis health metrics.

🌟 [erupt-ai](/en/modules/erupt-ai/prompt#llmrequest-request-level-extensions): LLM requests now support `agentPrompt` and `contextPrompt` for context-aware prompt injection per invocation.

🌟 [@Vis](/en/annotation/vis) adds **Calendar** (`CALENDAR`) and **Board** (`BOARD`) view types for richer data visualization.

🌟 [@Power](/en/annotation/power) adds a `copy` toggle — supports one-click row duplication in tables.

🌟 [@Layout](/en/annotation/layout) adds `collapseActionButton` — collapses the view-details, edit, and delete buttons into a dropdown menu.

🌟 New [`@GroupType` annotation](/en/field-types/group) — group fields inside a collapsible panel (`EditType.GROUP`).

🌟 [`@Erupt`](/en/annotation/erupt) and [`@Edit`](/en/annotation/edit) gain a `prompt` field for AI agent prompt configuration.

🌟 New [`PASSWORD` edit type](/en/field-types/password) — password fields render and transmit more securely.

🌟 Open search support — INPUT, NUMBER, and other components now let users choose the search operator (equals, not-equals, contains, range, etc.) directly in the search bar.

🌟 Dynamic dropdown refresh — `ChoiceFetchHandler` / `AutoCompleteHandler` / `TagsFetchHandler` can now reload options on demand.

🌟 Selection Handler interfaces are now generic — callbacks can directly access other form fields for cascading linkage.

🌟 New [**FormView**](/en/advanced/form-view) — dedicated backend endpoint with `DataProxy.formViewBehavior` / `formSave` hooks for single-record full-page form scenarios.

🌟 Excel export supports exporting only selected rows.

🌟 Password encryption upgraded from MD5 to SHA-512 with salt for significantly improved security — thanks to [段鹏鹏](https://gitee.com/erupt/erupt/pulls/35) for the contribution ([!35](https://gitee.com/erupt/erupt/pulls/35)).

🌟 Spring Boot upgraded to 3.5.15.

🌟 Operation logs now record the entity state **before** modification/deletion — the previous field values are visible in log details.

🌟 erupt-ai adds [Requesty](https://requesty.ai) as a new LLM provider.

🌟 OpenAPI: new `getAppid` endpoint to retrieve appid information by token.

🌟 [`EruptLambdaQuery`](/en/advanced/erupt-dao-lambda) adds `or()` support for building OR-logic composite queries.

🌟 [erupt-cube](/en/modules/pro/erupt-cube): new `drillFields` dimension filtering and `drillMeasure` measure-level drill-down support.

🌟 [erupt-cube](/en/modules/pro/erupt-cube): Cube annotations gain a `prompt` field for AI-readable semantic descriptions.

🧩 `dependField` now uses getter-style references with IDE field-name auto-complete.

🧩 [erupt-designer](/en/modules/erupt-designer): button permissions are now auto-generated when publishing a menu.

🐞 Fixed: Ollama model configuration was missing the `baseUrl` parameter — thanks to [canjian215215](https://github.com/canjian215215) for the contribution.

🎨 Frontend Complete Overhaul (erupt-web 2.0)

> Angular 20 → 21. The entire UI layer has been rewritten from architecture to interaction.

- New login page and preloader animation; new **Split Menu** mode (first-level nav on left, second-level alongside)
- Sidebar width is draggable and persisted; favourites support drag-and-drop reordering; responsive layout optimized for mobile
- Table: column drag-sort, column pinning, column density, row copy, persistent search state, collapsible search panel
- Left-tree panel is collapsible; table-tree layout supports fullscreen mode
- **AI side panel embedded in table / tree views** — chat with AI about visible data without leaving the page
- erupt-ai chat: wide-screen mode, session search, input-history navigation
- Code editor: smart hints and fullscreen mode; attachment component: drag-sort and batch update
- MultiChoice / Checkbox gain a select-all button; Choice shows color dots; input shows real-time character count
- Tree view: sort, node locate; BI / Monitor modules gain fullscreen improvements
- Terminal module ([erupt-terminal](/en/modules/erupt-terminal)) UI integrated — multi-tab switching with real-time WebSocket communication
- Table and modal now support dynamic action buttons — visibility can be controlled based on row data state
- erupt-flow approval UI fully redesigned with mobile-responsive master-detail layout and accessibility improvements
- TAGS component supports `joinSeparator = "[]"` JSON array format for tag value storage and parsing

### 1.14.x → 2.0.0 Upgrade Guide

> Full guide: [/en/guide/upgrade](/en/guide/upgrade)

**Breaking Changes**

+ **Password encryption upgraded**: MD5 → SHA-512 with salt. The upgrade is backward compatible — existing users can still log in with their current passwords; only new and reset passwords will use SHA-512 + salt going forward. Thanks to [段鹏鹏](https://gitee.com/erupt/erupt/pulls/35) for this security improvement.
+ **`DataProxy.extraContent` signature changed**: A second parameter `Collection<Map<String, Object>> list` has been added. Any class that overrides this method must update its signature.
+ **`AutoCompleteHandler`, `ChoiceFetchHandler`, `TagsFetchHandler` require a generic type parameter**: The `fetchFilter` method's `formData` parameter (`Map<String,Object>`) has been replaced with the actual model object (generic `T`).
+ **Excel import template format changed from `.xls` to `.xlsx`**: Users with cached or bookmarked download links must re-download the template.
+ **`@Search.vague` removed**: The `vague` property has been deleted. Remove all `vague = true` / `vague = false` from your code — advanced search is now the default behaviour.
+ **`EruptApiModel` deleted**: The response model is now `R<T>`. Replace `EruptApiModel.PromptWay` with `R.PromptWay` throughout your code.
+ **`ChoiceTrigger` interface removed**: Use `@ChoiceType.fetchHandler` instead.
+ **Login / change-password endpoints switched to HTTP POST**: `/login` and `/change-pwd` changed from GET to POST. Custom login pages must be updated accordingly.

## Legacy Versions

Changelogs and documentation for the 1.x release line have moved to the [Legacy Versions](/en/guide/history) page.
