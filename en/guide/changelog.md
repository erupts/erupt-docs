# Changelog

> Only the most recent versions are translated to English at this time.
> For earlier versions, please refer to the [Chinese changelog](/zh/guide/changelog).

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
Erupt fully embraces the AI Harness initiative, delivering 🦞-grade capabilities: MCP, Skills, Memory, ReAct, context engineering, and more.
:::

🐞 Fixed: dragging table column widths did not take effect.

🐞 Fixed: `Date`-typed fields used UTC by default on Erupt objects.

🐞 Fixed (edit scenario): `@OnChange` caused server-side cascaded values to overwrite the original database value.

🐞 Fixed: `@JoinColumn`'s `referencedColumnName` had no effect — thanks to [jx2047](https://github.com/jx2047) for the contribution.

🧩 Time fields are now formatted according to the user's current locale when exporting to Excel `#98d579`.

🧩 erupt-flow introduces multiple approval modes: assignment by another node, requester-chosen approver, and approval by the line manager.

🧩 erupt-flow gains a "task" node, with a more polished workflow canvas and feature layout.

🧩 Refactored time-format handling — all interactions now use ISO 8601 (`yyyy-MM-dd'T'HH:mm:ss.SSS`) and returned timestamps are formatted according to the browser locale, which is friendlier to internationalized scenarios.

🦞 Open-sourced [erupt-ai-claw](/en/modules/erupt-ai-claw): operate any Erupt data through natural language, with Skill / File / Shell invocation.

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

## Legacy Version Documentation

| Version | Docs | Changelog |
| --- | --- | --- |
| 1.13.x | [Docs](https://www.yuque.com/erupts/1.13.x) | [Changelog](https://www.yuque.com/erupts/1.13.x/wdic2w) |
| 1.12.x | [Docs](https://www.yuque.com/erupts/1.12.x) | [Changelog](https://www.yuque.com/erupts/1.12.x/wdic2w) |
| 1.11.x | [Docs](https://www.yuque.com/erupts/1.11.x) | [Changelog](https://www.yuque.com/erupts/1.11.x/wdic2w) |
| 1.10.x | [Docs](https://www.yuque.com/erupts/1.10.x) | [Changelog](https://www.yuque.com/erupts/1.10.x/wdic2w) |
| 1.9.x | [Docs](https://www.yuque.com/erupts/1.9.x) | [Changelog](https://www.yuque.com/erupts/1.9.x/wdic2w) |
| 1.8.x | [Docs](https://www.yuque.com/erupts/1.8.x) | [Changelog](https://www.yuque.com/erupts/1.8.x/gtma0l) |
| 1.7.x | [Docs](https://www.yuque.com/erupts/1.7.x) | [Changelog](https://www.yuque.com/erupts/1.7.x/wdic2w) |
| 1.6.x | [Docs](https://www.yuque.com/erupts/1.6.x) | [Changelog](https://www.yuque.com/erupts/1.6.x/wdic2w#UvU4Y) |
| 1.5.x | [Docs](https://www.yuque.com/erupts/1.6.x) | [Changelog](https://www.yuque.com/erupts/1.6.x/wdic2w#HlkSI) |
