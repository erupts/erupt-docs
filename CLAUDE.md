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

All navigation, sidebars, and site settings live in `.vitepress/config.mts`. The sidebar is keyed by path prefix — `/guide/`, `/annotation/`, `/field-types/`, `/advanced/`, `/modules/`. When adding a new page, add its entry to the corresponding sidebar group in this file.

Key config flags:
- `cleanUrls: true` — no `.html` suffixes in URLs
- `ignoreDeadLinks: true` — build won't fail on broken links (but fix them anyway)

### Content Structure

```
guide/          # Getting started, deployment, FAQ, changelog
annotation/     # @Erupt, @EruptField, @Edit, @View, @Search, etc.
field-types/    # All edit component types (INPUT, DATE, CHOICE, etc.)
advanced/       # DataProxy, auth, datasource, REST API, plugin dev
modules/        # Official extension modules
  pro/          # Commercial (paid) plugins
  third-party/  # Community plugins
public/         # Static assets; images are organized by module name
```

### Image Convention

All images are stored locally in `public/<module-name>/`. Never reference external CDN URLs (yuque, imgdb.cn, etc.) in markdown — always download them first with `curl` and reference via `/module-name/filename.ext`.

### Sidebar Groups for `/modules/`

| Group | Contents |
| --- | --- |
| 核心模块 | upms, jpa, mongodb, tpl, web |
| 工具模块 | websocket, generator, job, notice, monitor, magic-api, print, cloud, cloud-server, cloud-node |
| AI 模块 | erupt-ai, erupt-ai-claw, erupt-ai-skill (external link) |
| 商业模块 | pro/erupt-chart, pro/erupt-flow, pro/erupt-tenant, pro/erupt-cube |
| 第三方插件 | third-party/* |

### VitePress Callout Containers

Use these (not `:::tips` — that's invalid):
```
:::tip
:::info
:::warning
:::danger
```

### Theme

Custom CSS at `.vitepress/theme/custom.css`. The `@nolebase/vitepress-plugin-enhanced-readabilities` plugin adds a reading-width toggle to the nav bar.
