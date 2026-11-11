# AGENTS.md

This file provides guidance to coding agents (Claude Code, Codex, ...) when working with code in this repository.

## Commands

```bash
yarn docs:dev       # Start local dev server (hot-reload)
yarn docs:build     # Build for production
yarn docs:preview   # Preview production build locally
yarn docs:openapi   # Re-sync the OpenAPI spec only (also runs before docs:dev / docs:build)
```

There are no tests and no linter; `yarn docs:build` is the check. `yarn.lock` is git-ignored and `.npmrc` sets `legacy-peer-deps=true`. Build output goes to `.vitepress/dist` (ignored).

## Architecture

This is a **VitePress** documentation site for the [Erupt](https://github.com/erupts/erupt) low-code framework.

### Config

All navigation, sidebars, and site settings live in `.vitepress/config.mts`. The site is **bilingual** — Chinese (`zh`)
and English (`en`). Sidebar entries are keyed by locale-prefixed paths: `/zh/guide/`, `/en/guide/`, `/zh/annotation/`,
etc. When adding a new page, add its entry to **both** the `zh` and `en` sidebar groups.

Key config flags:

- `cleanUrls: true` — no `.html` suffixes in URLs
- `ignoreDeadLinks: true` — build won't fail on broken links (but fix them anyway)

### Bilingual Sync Rule

**Every content change must be applied to both `zh/` and `en/` in the same edit session.** Never update one locale without updating the other. This applies to new pages, edits to existing pages, and deletions.

### Content Structure

All content is duplicated across two locale roots:

```
zh/             # Chinese content (primary)
  guide/          # Getting started, deployment, FAQ, changelog
  annotation/     # @Erupt, @EruptField, @Edit, @View, @Search, etc.
  field-types/    # All edit component types (INPUT, DATE, CHOICE, etc.)
  advanced/       # DataProxy, auth, datasource, REST API, plugin dev
  modules/        # Extension modules (apps/, pro/, third-party/ subdirs)
  topics/         # Long-form editorial articles ("Issues")
  api/            # API reference, generated from the OpenAPI spec (see below)
  embed/          # Pages embedded elsewhere through an iframe
en/             # English content (mirrors zh/ structure)
public/         # Static assets; images organized by module name
index.md        # Root page: redirects to /zh/ or /en/ by browser language
```

Old URLs without a locale prefix (`/guide/...`, `/modules/...`, ...) are redirected to the reader's locale in `.vitepress/theme/index.ts` (`knownPrefixes`), which is why links inside `topics/index.md` cards may omit the prefix.

### Topics

A topic is one article in `zh/topics/` and `en/topics/` plus two registrations per locale: an `Issue NN · <tag>` group at the top of the topics sidebar in `.vitepress/config.mts`, and a `topic-card` block at the top of `topics/index.md` (newest first, numbered `#NN`).

### Image Convention

All images are stored locally in `public/<module-name>/`. Never reference external CDN URLs (yuque, imgdb.cn, etc.) in
markdown — always download them first with `curl` and reference via `/module-name/filename.ext`.

### Sidebar Groups for `/modules/`

| Group        | Contents                                                                                      |
|--------------|-----------------------------------------------------------------------------------------------|
| AI Modules   | erupt-ai/ (index + subpages), erupt-ai-claw/ (index + subpages), erupt-ai-canvas, erupt-ai-rag, erupt-ai-staff, erupt-ai-decision, erupt-ai-dev, erupt-ai-skill (external link) |
| Core Modules | erupt-upms/ (index + subpages), erupt-tpl/ (index + subpages), web, designer                                            |
| Data Connectors | erupt-jpa, erupt-mongodb, erupt-jdbc, erupt-http, erupt-es, erupt-redis, erupt-memory, erupt-file, erupt-k8s, erupt-ldap, erupt-feishu, erupt-notion, erupt-s3/ (index + subpages), erupt-dingtalk, erupt-airtable (artifactIds are `erupt-data-*`) |
| Tool Modules | terminal, remote, atlas, comment, sso, share, webhook, config, revision, file-center, websocket, generator, job, notice, monitor, magic-api, print, cloud (cloud, cloud-server, cloud-node, cloud-node-lite), erupt-sdk/ (index + one page per language), erupt-report/ (index + subpages) |
| Commercial Modules | pro/erupt-tenant/ (index + subpages), pro/erupt-flow/ (index + subpages), pro/erupt-cube (+ pro/erupt-cube/ subpages) |
| Open-source Apps | apps/* — public apps from https://github.com/erupt-io (erupt-k8s-dashboard, erupt-pm, erupt-talent, erupt-sms, erupt-wechat, erupt-miniapp) |
| Third-party Modules | third-party/*                                                                                 |

### API Reference (`/zh/api/`, `/en/api/`)

The top-nav **API** menu renders the erupt OpenAPI spec with vitepress-openapi: one static page per operation via the `[operationId].md` dynamic route, sidebar built from `x-tagGroups` in `.vitepress/openapi.mts`.
`scripts/sync-openapi.mjs` copies `$ERUPT_HOME/openapi/erupt.json` (default `../erupt`) to `public/openapi/erupt.json`;
it runs automatically before `docs:dev` / `docs:build`, or manually via `yarn docs:openapi`. When the source is missing the committed copy is kept. Never hand-edit the copy; the spec itself is regenerated in the erupt repo.

### Mermaid Diagrams

`vitepress-plugin-mermaid` is configured — Mermaid diagram blocks (` ```mermaid `) render natively in any page.

### VitePress Callout Containers

Use these (not `:::tips` — that's invalid):

```
:::tip
:::info
:::warning
:::danger
```

### Theme

The theme entry is `.vitepress/theme/index.ts`, extending the default theme, with custom CSS at
`.vitepress/theme/custom.css` and the Vue components `EruptHome.vue`, `EruptArch.vue` and `Floating.vue` beside it.
The `@nolebase/vitepress-plugin-enhanced-readabilities` plugin adds a reading-width toggle to the nav bar (full width by
default); the other nolebase plugins add the git changelog / contributors section (switched off for `/embed/` and
`/api/` pages in `config.mts`), inline link previews and targeted-heading highlight. Images in page content open in
`medium-zoom`, except images inside a link. `vitepress-openapi/dist/style.css` must stay imported after the nolebase
styles.
