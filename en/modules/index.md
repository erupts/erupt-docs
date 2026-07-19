---
aside: false
---

<script setup>
import { ref, computed } from 'vue'

const search = ref('')

const groups = [
    {
        title: 'AI Modules',
        items: [
            {icon: '🐴', name: 'Erupt AI Harness', artifact: 'erupt-ai', desc: 'Deep LLM integration, build AI apps with low code', link: '/en/modules/erupt-ai'},
            {icon: '🦞', name: 'Erupt AI Claw', artifact: 'erupt-ai-claw', desc: 'Drive your server with natural language, chat with data & business', link: '/en/modules/erupt-ai-claw'},
            {icon: '🛠️', name: 'Erupt AI Skills', artifact: 'claude skills', desc: 'Claude skill pack for AI-assisted Erupt development', link: 'https://github.com/erupts/erupt/tree/master/.claude/skills/erupt', external: true},
        ],
    },
    {
        title: 'Core Modules',
        items: [
            {icon: '🔐', name: 'Erupt Upms', artifact: 'erupt-upms', desc: 'Full permission management: users, roles, menus, orgs', link: '/en/modules/erupt-upms'},
            {icon: '🗃️', name: 'Erupt Jpa', artifact: 'erupt-jpa', desc: 'Deeply enhanced JPA layer, essential for most projects', link: '/en/modules/erupt-jpa'},
            {icon: '🍃', name: 'Erupt Mongodb', artifact: 'erupt-mongodb', desc: 'MongoDB NoSQL data source support', link: '/en/modules/erupt-mongodb'},
            {icon: '📄', name: 'Erupt Tpl', artifact: 'erupt-tpl', desc: 'Custom HTML template pages with multiple UI kits', link: '/en/modules/erupt-tpl'},
            {icon: '🖥️', name: 'Erupt Web', artifact: 'erupt-web', desc: 'Angular frontend source, shipped as a Jar', link: '/en/modules/erupt-web'},
            {icon: '🎨', name: 'Erupt Designer', artifact: 'erupt-designer', desc: 'Drag-and-drop entity designer at runtime, exports annotation code', link: '/en/modules/erupt-designer'},
        ],
    },
    {
        title: 'Tool Modules',
        items: [
            {icon: '⌨️', name: 'Erupt Terminal', artifact: 'erupt-terminal', desc: 'Server shell terminal right in the browser', link: '/en/modules/erupt-terminal'},
            {icon: '🔌', name: 'Erupt Websocket', artifact: 'erupt-websocket', desc: 'WebSocket real-time messaging and data push', link: '/en/modules/erupt-websocket'},
            {icon: '⚙️', name: 'Erupt Generator', artifact: 'erupt-generator', desc: 'Visual generator for Erupt entity classes', link: '/en/modules/erupt-generator'},
            {icon: '⏰', name: 'Erupt Job', artifact: 'erupt-job', desc: 'Visual scheduled jobs with Cron config and logs', link: '/en/modules/erupt-job'},
            {icon: '📢', name: 'Erupt Notice', artifact: 'erupt-notice', desc: 'Announcements and in-app messages', link: '/en/modules/erupt-notice'},
            {icon: '📈', name: 'Erupt Monitor', artifact: 'erupt-monitor', desc: 'Live CPU, JVM, connection pool and online-user monitoring', link: '/en/modules/erupt-monitor'},
            {icon: '🪄', name: 'Erupt Magic Api', artifact: 'erupt-magic-api', desc: 'Online IDE for building HTTP APIs in the browser', link: '/en/modules/erupt-magic-api'},
            {icon: '🖨️', name: 'Erupt Print', artifact: 'erupt-print', desc: 'HTML-template printing for receipts and reports', link: '/en/modules/erupt-print'},
            {icon: '☁️', name: 'Erupt Cloud', artifact: 'erupt-cloud', desc: 'Distributed config center, database tables replace yml', link: '/en/modules/erupt-cloud'},
            {icon: '🛰️', name: 'Erupt Cloud Server', artifact: 'erupt-cloud-server', desc: 'Node management hub: registration and dispatch', link: '/en/modules/cloud-server'},
            {icon: '📦', name: 'Erupt Cloud Node', artifact: 'erupt-cloud-node', desc: 'Distributed micro node managed by Cloud Server', link: '/en/modules/cloud-node'},
        ],
    },
    {
        title: 'Commercial Modules',
        badge: 'PRO',
        items: [
            {icon: '📊', name: 'Erupt Chart', artifact: 'erupt-chart', desc: 'SQL-defined charts and reports, zero frontend/backend code', link: '/en/modules/pro/erupt-chart', pro: true},
            {icon: '🏢', name: 'Erupt SaaS Multi-tenant', artifact: 'erupt-tenant', desc: 'Reuse features across tenants with full data isolation', link: '/en/modules/pro/erupt-tenant', pro: true},
            {icon: '🔀', name: 'Erupt Flow', artifact: 'erupt-flow', desc: 'Universal workflow engine with visual process designer', link: '/en/modules/pro/erupt-flow', pro: true},
            {icon: '🧊', name: 'Erupt Cube BI', artifact: 'erupt-cube', desc: 'Semantic-layer BI: model with annotations, analyze by drag-and-drop', link: '/en/modules/pro/erupt-cube', pro: true},
        ],
    },
    {
        title: 'Third-party Plugins',
        badge: 'Community',
        items: [
            {icon: '🔍', name: 'Erupt Dsl', artifact: 'erupt-dsl', desc: 'Dynamic ORM queries built with a DSL syntax', link: '/en/modules/third-party/erupt-dsl'},
            {icon: '🧩', name: 'Erupt Pf4j', artifact: 'erupt-pf4j', desc: 'Dynamic plugin loading powered by PF4J', link: '/en/modules/third-party/erupt-pf4j'},
            {icon: '🛢️', name: 'EZDML', artifact: 'ezdml', desc: 'Database modeling tool that generates Erupt entity code', link: '/en/modules/third-party/ezdml'},
            {icon: '🕷️', name: 'MP Crawler', artifact: 'mp-crawler', desc: 'WeChat official-account content crawler and manager', link: '/en/modules/third-party/mp-crawler'},
            {icon: '🗳️', name: 'Erupt Vote', artifact: 'erupt-vote', desc: 'Voting plugin supporting multiple voting scenarios', link: '/en/modules/third-party/erupt-vote'},
        ],
    },
]

const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (!q) return groups
    return groups
        .map(g => ({...g, items: g.items.filter(i => (i.name + i.artifact + i.desc).toLowerCase().includes(q))}))
        .filter(g => g.items.length > 0)
})
</script>

# Modules Overview

Erupt follows a modular design — core capabilities are split into independent Maven modules so you can pull in only what you need, all versioned in lockstep with the core.

<div class="md-search">
    <svg class="md-search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    <input v-model="search" placeholder="Search modules, e.g. upms, job, workflow..." />
</div>

<template v-for="g in filtered" :key="g.title">
    <h2 class="md-group-title">{{ g.title }}<span v-if="g.badge" class="md-badge">{{ g.badge }}</span><span class="md-count">{{ g.items.length }}</span></h2>
    <div class="md-grid">
        <a v-for="item in g.items" :key="item.artifact" class="md-card" :href="item.link" :target="item.external ? '_blank' : undefined" :rel="item.external ? 'noreferrer' : undefined">
            <span class="md-icon">{{ item.icon }}</span>
            <span class="md-body">
                <span class="md-head">
                    <b>{{ item.name }}</b>
                    <i v-if="item.pro" class="md-pro">PRO</i>
                    <i v-if="item.external" class="md-ext">↗</i>
                </span>
                <code class="md-artifact">{{ item.artifact }}</code>
                <span class="md-desc">{{ item.desc }}</span>
            </span>
        </a>
    </div>
</template>

<p v-if="filtered.length === 0" class="md-empty">No matching modules found</p>

## Installation

All official modules share the same version as the erupt core, managed via `${erupt.version}`:

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>module-name</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

<style scoped>
.md-search {
    position: relative;
    margin: 24px 0 8px;
}

.md-search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--vp-c-text-3);
    pointer-events: none;
}

.md-search input {
    width: 100%;
    padding: 10px 16px 10px 40px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    background: var(--vp-c-bg);
    color: var(--vp-c-text-1);
    font-size: 14px;
    outline: none;
    transition: border-color .2s;
}

.md-search input:focus {
    border-color: var(--vp-c-brand-1);
}

.md-group-title {
    margin: 32px 0 4px;
    padding-top: 16px;
    border-top: none;
    font-size: 18px;
    font-weight: 600;
}

.md-badge {
    margin-left: 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .05em;
    color: var(--vp-c-brand-1);
    border: 1px solid var(--vp-c-brand-1);
    border-radius: 4px;
    padding: 1px 6px;
    vertical-align: 3px;
}

.md-count {
    margin-left: 8px;
    font-size: 12px;
    font-weight: 400;
    color: var(--vp-c-text-3);
    background: var(--vp-c-bg-soft);
    border-radius: 10px;
    padding: 2px 8px;
    vertical-align: 2px;
}

.md-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin: 16px 0 8px;
}

@media (max-width: 960px) {
    .md-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 560px) {
    .md-grid {
        grid-template-columns: 1fr;
    }
}

.md-card {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    border: 1px solid var(--vp-c-divider);
    border-radius: 10px;
    padding: 14px;
    text-decoration: none !important;
    color: inherit !important;
    background: var(--vp-c-bg);
    transition: box-shadow .2s, border-color .2s, transform .2s;
}

.md-card:hover {
    border-color: var(--vp-c-brand-1);
    box-shadow: 0 6px 16px rgba(0, 0, 0, .08);
    transform: translateY(-2px);
}

.md-icon {
    flex: 0 0 auto;
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    background: var(--vp-c-bg-soft);
    border-radius: 10px;
}

.md-body {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.md-head {
    display: flex;
    align-items: center;
    gap: 6px;
}

.md-head b {
    font-size: 14px;
    font-weight: 600;
    color: var(--vp-c-text-1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.md-pro {
    flex: 0 0 auto;
    font-style: normal;
    font-size: 10px;
    font-weight: 700;
    color: #fff;
    background: var(--vp-c-brand-1);
    border-radius: 3px;
    padding: 1px 5px;
}

.md-ext {
    font-style: normal;
    font-size: 12px;
    color: var(--vp-c-text-3);
}

.md-artifact {
    font-family: var(--vp-font-family-mono);
    font-size: 11.5px;
    color: var(--vp-c-text-3);
    background: none;
    padding: 0;
}

.md-desc {
    font-size: 12.5px;
    line-height: 1.55;
    color: var(--vp-c-text-2);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.md-empty {
    margin: 48px 0;
    text-align: center;
    color: var(--vp-c-text-3);
}
</style>
