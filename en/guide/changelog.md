# Changelog

## 2.0.4 (2026-07-19) <Badge type="tip" text="Spring Boot 3.5.16" />

🌟 New [`BUTTON` edit type](/en/field-types/button) — an in-form button that calls a backend handler with all current form values, supporting form population and dynamic field configuration.

🌟 New [`@DragSort` row drag sorting](/en/annotation/drag-sort) — reorder table rows by dragging, with the result automatically persisted to the sort field.

🌟 New [`PROGRESS` view type](/en/annotation/view#display-types-viewtype) — display numeric columns as progress bars; the SLIDER edit type contributes its max value automatically.

🌟 New [`PASSWORD` view type](/en/annotation/view#display-types-viewtype) — sensitive fields are masked and the actual value is never sent to the client.

🧩 [`PASSWORD` edit type](/en/field-types/password#masked-edit-echo) security hardening: edit echo returns only a mask placeholder; submitting it unchanged keeps the stored password.

🌟 [Card view](/en/annotation/vis-card) now supports card selection, with selected-state styling wired to action buttons.

🧩 Built-in forms for AI models, MCP servers, agents, and scheduled jobs gain test/validation buttons for one-click connection and configuration checks.

🧩 [erupt-ai](/en/modules/erupt-ai) supports an embedded chat mode; the LLM `apiKey` is now masked with the password view.

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

🌟 [erupt-ai](/en/modules/erupt-ai#agentprompt-and-contextprompt): LLM requests now support `agentPrompt` and `contextPrompt` for context-aware prompt injection per invocation.

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

## 1.14.3 (2026-05-19) <Badge type="tip" text="Spring Boot 3.5.13" />

🌟 New [erupt-terminal](/en/modules/erupt-terminal) module — operate the server terminal directly from the admin UI, no SSH client required.

🌟 erupt-ai supports [A2A (Agent-to-Agent) collaboration](/en/modules/erupt-ai#multi-agent-collaboration-a2a) — multiple AI agents can communicate and divide work among themselves.

🌟 erupt-ai introduces cross-session Memory — the AI retains user preferences and context across conversations.

🌟 erupt-ai supports fine-grained role-based control over AI tool permissions and system prompts, allowing erupt-ai-claw to be safely deployed in production.

🌟 erupt-ai supports Thinking Mode, exposing the enhanced reasoning trace inside the chat.

🌟 erupt-ai-claw adds an `enableExecShell` option to flexibly toggle [shell execution](/en/modules/erupt-ai-claw#usage).

🌟 [DataProxy](/en/advanced/data-proxy#extracontent-custom-content-injection) adds an `extraContent` method to inject custom HTML at the top of any table or view.

🌟 [erupt-cube](/en/modules/pro/erupt-cube) supports sub-models, advanced group filters, relative-date filters, rich-text reports, tree maps, heatmaps, and time-based comparison for KPIs and charts.

🌟 The MAP component supports picking coordinates by click and integrates geocoding.

🧩 Watermark feature improvements — thanks to [chenxiaolong8023](https://github.com/chenxiaolong8023) for the contribution.

🐞 Fixed: `@OnChange` did not work with `ReferenceTree` and `ReferenceTable`.

## 1.14.2 (2026-04-27) <Badge type="tip" text="Spring Boot 3.5.13" />

🐞 Fixed: hour/minute/second values were ignored in date-range queries.

🧩 Fixed: switching erupt-ai sessions caused the streaming output to stop.

🧩 The UI no longer fails to refresh when switching tabs that embed iframe TPLs.

🌟 New [erupt-test](https://github.com/erupts/erupt/tree/master/erupt-test/src/test/java/xyz/erupt/test) module with full unit-test coverage.

🌟 Polished the startup log styling.

🌟 The [default language](/en/guide/configuration) is now `en-US`, and the default menu data is stored in English.

🌟 erupt-flow supports delayed sub-process initiation.

🌟 The erupt-ai chat UI has been overhauled: voice playback, re-asking, collapsible sessions, and more.

🌟 erupt-ai supports diff and ECharts rendering.

🌟 Tree node rendering performance is dramatically improved — combined with virtual scrolling it can display 100k+ nodes in milliseconds.

🌟 New data-modeling and visual analytics module: [erupt-cube](https://www.erupt.xyz/#!/cube).

## 1.14.1 (2026-04-13) <Badge type="tip" text="Spring Boot 3.5.13" />

:::info
Erupt fully embraces the AI Harness initiative, delivering 🚀-grade capabilities: MCP, Skills, Memory, ReAct, context engineering, and more.
:::

🐞 Fixed: dragging table column widths did not take effect.

🐞 Fixed: `Date`-typed fields used UTC by default on Erupt objects.

🐞 Fixed (edit scenario): `@OnChange` caused server-side cascaded values to overwrite the original database value.

🐞 Fixed: `@JoinColumn`'s `referencedColumnName` had no effect — thanks to [jx2047](https://github.com/jx2047) for the contribution.

🧩 Time fields are now formatted according to the user's current locale when exporting to Excel `#98d579`.

🧩 erupt-flow introduces multiple approval modes: assignment by another node, requester-chosen approver, and approval by the line manager.

🧩 erupt-flow gains a "task" node, with a more polished workflow canvas and feature layout.

🧩 Refactored time-format handling — all interactions now use ISO 8601 (`yyyy-MM-dd'T'HH:mm:ss.SSS`) and returned timestamps are formatted according to the browser locale, which is friendlier to internationalized scenarios.

🚀 Open-sourced [erupt-ai-claw](/en/modules/erupt-ai-claw): operate any Erupt data through natural language, with Skill / File / Shell invocation.

🌟 Spring Boot upgraded to 3.5.13.

🌟 `eruptUser` adds a "managed organizations" field, with the new `e_upms_user_org_division` table for storage.

🌟 erupt-ai adds a security policy: the AI chat capability is no longer open to all users; the backend API is gated by menu permissions.

🌟 erupt-ai has been fully rewritten — Angular on the frontend, Langchain4j on the backend, and `AI Tool` declarations moved to the method level.

🌟 erupt-ai LLM support extends to Claude, Gemini, and Doubao.

🌟 erupt-ai can invoke external MCP servers.

🌟 erupt-ai can intelligently orchestrate registered AI tools via the ReAct pattern, while exposing the reasoning trace.

🌟 Added skill files to improve the interaction between AI and Erupt: [SKILLS](https://github.com/erupts/erupt/tree/master/.claude/skills/erupt).

🌟 Open-sourced the [erupt-vote](/en/modules/third-party/erupt-vote) plugin — thanks to [@PPLINGHUFEI](https://gitee.com/PPLINGHUFEI) for the contribution.

🌟 `EruptMenu` data is unified in English storage; the frontend auto-translates it for display.

### 1.13.x → 1.14.x Upgrade Guide

**Upgrade Notes**

Delete `.erupt/erupt-ai.loaded` in your project root and restart the service so the system regenerates the AI module menus.

**Breaking Changes**

+ **Time format**: unified to ISO 8601 (`yyyy-MM-dd'T'HH:mm:ss.SSS`). Frontends that talk directly to the Erupt API must format the value manually — `new Date(date).toLocaleString()` is recommended.
+ **Config rename**: `erupt.ai.mcp.enabled` is renamed to `erupt.ai.mcp.server-enabled`. Update your configuration files accordingly.
+ **AI Tool declarations**: function-method annotations move from class-level to method-level. Adjust your code — see [Erupt AI · LLM deep integration](/en/modules/erupt-ai#jA3q1).
+ User management gains a "managed organizations" feature, adding the `e_upms_user_org_division` table.

```plsql
create table e_upms_user_org_division (
  "id"           BIGINT not null,
  "division_org" BIGINT,
  constraint "FKh6drd4cu855cb3c7ei2ebh3cl"
  foreign key ("id") references "e_upms_user"
);
```

## Earlier Versions

For the changelog of versions older than 1.14.x, please consult the [Chinese version](/zh/guide/changelog) — an English translation will be provided in a future iteration.

## Legacy Documentation

| Version | Docs | Changelog |
| --- | --- | --- |
| 1.14.x | [Docs](http://1-14-x.docs.erupt.xyz/) | [Changelog](http://1-14-x.docs.erupt.xyz/en/guide/changelog) |
| 1.13.x | [Docs](https://www.yuque.com/erupts/1.13.x) | [Changelog](https://www.yuque.com/erupts/1.13.x/wdic2w) |
| 1.12.x | [Docs](https://www.yuque.com/erupts/1.12.x) | [Changelog](https://www.yuque.com/erupts/1.12.x/wdic2w) |
| 1.11.x | [Docs](https://www.yuque.com/erupts/1.11.x) | [Changelog](https://www.yuque.com/erupts/1.11.x/wdic2w) |
| 1.10.x | [Docs](https://www.yuque.com/erupts/1.10.x) | [Changelog](https://www.yuque.com/erupts/1.10.x/wdic2w) |
| 1.9.x | [Docs](https://www.yuque.com/erupts/1.9.x) | [Changelog](https://www.yuque.com/erupts/1.9.x/wdic2w) |
| 1.8.x | [Docs](https://www.yuque.com/erupts/1.8.x) | [Changelog](https://www.yuque.com/erupts/1.8.x/gtma0l) |
| 1.7.x | [Docs](https://www.yuque.com/erupts/1.7.x) | [Changelog](https://www.yuque.com/erupts/1.7.x/wdic2w) |
| 1.6.x | [Docs](https://www.yuque.com/erupts/1.6.x) | [Changelog](https://www.yuque.com/erupts/1.6.x/wdic2w#UvU4Y) |
| 1.5.x | [Docs](https://www.yuque.com/erupts/1.6.x) | [Changelog](https://www.yuque.com/erupts/1.6.x/wdic2w#HlkSI) |
