---
aside: false
---

<script setup>
import { ref, computed } from 'vue'

const search = ref('')

const groups = [
    {
        title: 'DataProxy',
        items: [
            {icon: '🪝', name: 'DataProxy Overview', desc: 'Inject custom business logic at every CRUD stage', link: '/en/advanced/data-proxy'},
            {icon: '🚦', name: 'CRUD Interception', desc: 'Inject business logic around add, update, and delete via before* / after*', link: '/en/advanced/data-proxy-crud'},
            {icon: '✅', name: 'Form Validation', desc: 'Validate data before saving via validate, reject on failure', link: '/en/advanced/data-proxy-validate'},
            {icon: '🔍', name: 'Query Conditions', desc: 'beforeFetch condition injection and default search values', link: '/en/advanced/data-proxy-query'},
            {icon: '🎨', name: 'Table Display', desc: 'Cell coloring, row-button control, custom content injection', link: '/en/advanced/data-proxy-table'},
            {icon: '➕', name: 'Custom Rows', desc: 'Append totals and summary rows via extraRow', link: '/en/advanced/extra-row'},
            {icon: '🫥', name: 'Virtual Fields', desc: 'Display and populate non-database fields via @Transient', link: '/en/advanced/virtual-field'},
            {icon: '📝', name: 'Form Behaviors', desc: 'Pre-process data when forms open via addBehavior / editBehavior', link: '/en/advanced/data-proxy-form'},
            {icon: '📋', name: 'Form View', desc: 'Render an Erupt class as a full-page form, ideal for settings pages', link: '/en/advanced/form-view'},
            {icon: '📊', name: 'Excel Import & Export', desc: 'Customize export files and validate imported data via excel*', link: '/en/advanced/data-proxy-excel'},
            {icon: '🖨️', name: 'Print Processing', desc: 'Customize the printed HTML output via print', link: '/en/advanced/data-proxy-print'},
            {icon: '🧬', name: 'Inherited Proxy', desc: 'Reuse DataProxy capabilities through inheritance via @PreDataProxy', link: '/en/advanced/pre-data-proxy'},
        ],
    },
    {
        title: 'EruptDao Database Operations',
        items: [
            {icon: '🧾', name: 'EruptDao Overview', desc: 'JPA-based data operations: CRUD and native SQL', link: '/en/advanced/erupt-dao'},
            {icon: '⛓️', name: 'Chained Queries', desc: 'Strongly-typed LambdaQuery: aggregation, pagination, associations', link: '/en/advanced/erupt-dao-lambda'},
            {icon: '🔀', name: 'Multi-Datasource Operations', desc: 'Run queries against a specific data source via getEntityManager', link: '/en/advanced/erupt-dao-datasource'},
        ],
    },
    {
        title: 'Data & Persistence',
        items: [
            {icon: '🎯', name: 'Global Interception', desc: 'PostDataProxy intercepts data operations globally, no per-class config', link: '/en/advanced/post-data-proxy'},
            {icon: '🗑️', name: 'Soft Delete', desc: 'Replace physical deletion with a deleted flag field', link: '/en/advanced/soft-delete'},
            {icon: '🗄️', name: 'Multiple Data Sources', desc: 'Configure and use multiple databases', link: '/en/advanced/datasource'},
            {icon: '🛢️', name: 'Custom Data Source', desc: 'Manage non-database data with Erupt', link: '/en/advanced/custom-datasource'},
        ],
    },
    {
        title: 'Login & Security',
        items: [
            {icon: '🔑', name: 'Login & Authentication', desc: 'Custom login logic, token validation, permission extension', link: '/en/advanced/auth'},
            {icon: '🚪', name: 'Custom Login Page', desc: 'Captcha login, WeChat QR login and other custom login flows', link: '/en/advanced/custom-login-page'},
            {icon: '🔓', name: 'Open API', desc: 'Token via appid + secret for external system calls', link: '/en/advanced/open-api'},
        ],
    },
    {
        title: 'UI & Interaction',
        items: [
            {icon: '💬', name: 'Frontend Notifications', desc: 'Trigger frontend messages and dialogs from the backend', link: '/en/advanced/frontend-notify'},
            {icon: '📤', name: 'Custom File Upload', desc: 'Integrate OSS, local storage, or any custom upload backend', link: '/en/advanced/upload'},
            {icon: '🌐', name: 'Internationalization', desc: 'Multilingual support and custom translations', link: '/en/advanced/i18n'},
        ],
    },
    {
        title: 'Development & Extension',
        items: [
            {icon: '🔗', name: 'Existing Project Integration', desc: 'Plug Erupt into an existing Spring Boot project', link: '/en/advanced/integration'},
            {icon: '🧭', name: 'API Development & Logs', desc: 'Custom REST endpoints and operation-log recording', link: '/en/advanced/rest-api'},
            {icon: '📡', name: 'Event Listeners', desc: 'Listen to internal framework events for decoupled extension', link: '/en/advanced/event-listener'},
            {icon: '🔧', name: 'Utility Classes', desc: "Erupt's built-in utility classes", link: '/en/advanced/utils'},
            {icon: '🔥', name: 'Hot Build', desc: 'Annotation changes apply on page refresh, no restart needed', link: '/en/advanced/hot-build'},
            {icon: '🧬', name: 'Extending Erupt Annotations', desc: 'Build on the Erupt annotation system', link: '/en/advanced/extend'},
            {icon: '🧩', name: 'Plugin Development', desc: 'Build custom plugins on top of the framework', link: '/en/advanced/plugin'},
        ],
    },
]

const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (!q) return groups
    return groups
        .map(g => ({...g, items: g.items.filter(i => (i.name + i.desc).toLowerCase().includes(q))}))
        .filter(g => g.items.length > 0)
})
</script>

# Advanced

This chapter covers Erupt's advanced usage and extension development, helping you tackle more complex business scenarios in real-world projects.

<div class="adv-search">
    <svg class="adv-search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    <input v-model="search" placeholder="Search features, e.g. DataProxy, auth, datasource..." />
</div>

<template v-for="g in filtered" :key="g.title">
    <h2 class="adv-group-title">{{ g.title }}<span class="adv-count">{{ g.items.length }}</span></h2>
    <div class="adv-grid">
        <a v-for="item in g.items" :key="item.name" class="adv-card" :href="item.link">
            <span class="adv-icon">{{ item.icon }}</span>
            <span class="adv-body">
                <b>{{ item.name }}</b>
                <span class="adv-desc">{{ item.desc }}</span>
            </span>
        </a>
    </div>
</template>

<p v-if="filtered.length === 0" class="adv-empty">No matching features found</p>

<style scoped>
.adv-search {
    position: relative;
    margin: 24px 0 8px;
}

.adv-search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--vp-c-text-3);
    pointer-events: none;
}

.adv-search input {
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

.adv-search input:focus {
    border-color: var(--vp-c-brand-1);
}

.adv-group-title {
    margin: 32px 0 4px;
    padding-top: 16px;
    border-top: none;
    font-size: 18px;
    font-weight: 600;
}

.adv-count {
    margin-left: 8px;
    font-size: 12px;
    font-weight: 400;
    color: var(--vp-c-text-3);
    background: var(--vp-c-bg-soft);
    border-radius: 10px;
    padding: 2px 8px;
    vertical-align: 2px;
}

.adv-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin: 16px 0 8px;
}

@media (max-width: 960px) {
    .adv-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 560px) {
    .adv-grid {
        grid-template-columns: 1fr;
    }
}

.adv-card {
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

.adv-card:hover {
    border-color: var(--vp-c-brand-1);
    box-shadow: 0 6px 16px rgba(0, 0, 0, .08);
    transform: translateY(-2px);
}

.adv-icon {
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

.adv-body {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.adv-body b {
    font-size: 14px;
    font-weight: 600;
    color: var(--vp-c-text-1);
}

.adv-desc {
    font-size: 12.5px;
    line-height: 1.55;
    color: var(--vp-c-text-2);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.adv-empty {
    margin: 48px 0;
    text-align: center;
    color: var(--vp-c-text-3);
}
</style>
