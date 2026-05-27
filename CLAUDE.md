# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn docs:dev       # Start local dev server (hot-reload)
yarn docs:build     # Build for production
yarn docs:preview   # Preview production build locally
```

## Architecture

This is a **VitePress** documentation site for the [Erupt](https://github.com/erupts/erupt) low-code framework.

### Config

All navigation, sidebars, and site settings live in `.vitepress/config.mts`. The site is **bilingual** — Chinese (`zh`)
and English (`en`). Sidebar entries are keyed by locale-prefixed paths: `/zh/guide/`, `/en/guide/`, `/zh/annotation/`,
etc. When adding a new page, add its entry to **both** the `zh` and `en` sidebar groups.

Key config flags:

- `cleanUrls: true` — no `.html` suffixes in URLs
- `ignoreDeadLinks: true` — build won't fail on broken links (but fix them anyway)

### Content Structure

All content is duplicated across two locale roots:

```
zh/             # Chinese content (primary)
  guide/          # Getting started, deployment, FAQ, changelog
  annotation/     # @Erupt, @EruptField, @Edit, @View, @Search, etc.
  field-types/    # All edit component types (INPUT, DATE, CHOICE, etc.)
  advanced/       # DataProxy, auth, datasource, REST API, plugin dev
  modules/        # Extension modules (pro/, third-party/ subdirs)
  topics/         # Long-form editorial articles ("Issues")
en/             # English content (mirrors zh/ structure)
public/         # Static assets; images organized by module name
```

### Image Convention

All images are stored locally in `public/<module-name>/`. Never reference external CDN URLs (yuque, imgdb.cn, etc.) in
markdown — always download them first with `curl` and reference via `/module-name/filename.ext`.

### Sidebar Groups for `/modules/`

| Group        | Contents                                                                                      |
|--------------|-----------------------------------------------------------------------------------------------|
| AI Module    | erupt-ai, erupt-ai-claw, erupt-ai-skill (external link)                                       |
| Core Module  | upms, jpa, mongodb, tpl, web                                                                  |
| Tool Moudle  | websocket, generator, job, notice, monitor, magic-api, print, cloud, cloud-server, cloud-node |
| Pro Module   | pro/erupt-chart, pro/erupt-flow, pro/erupt-tenant, pro/erupt-cube                             |
| Third Module | third-party/*                                                                                 |

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

Custom CSS at `.vitepress/theme/custom.css`. The `@nolebase/vitepress-plugin-enhanced-readabilities` plugin adds a
reading-width toggle to the nav bar.
