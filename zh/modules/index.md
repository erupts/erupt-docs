---
aside: false
---

<script setup>
import { ref, computed } from 'vue'

const search = ref('')

const groups = [
    {
        title: 'AI 模块',
        items: [
            {icon: '🐴', name: 'Erupt AI Harness', artifact: 'erupt-ai', desc: '大模型深度集成，低代码开发 AI 应用', link: '/zh/modules/erupt-ai'},
            {icon: '🦞', name: 'Erupt AI Claw', artifact: 'erupt-ai-claw', desc: '自然语言驱动服务器，对话式操作数据与业务', link: '/zh/modules/erupt-ai-claw'},
            {icon: '🛠️', name: 'Erupt AI Skills', artifact: 'claude skills', desc: 'Claude 技能包，AI 辅助 Erupt 开发', link: 'https://github.com/erupts/erupt/tree/master/.claude/skills/erupt', external: true},
        ],
    },
    {
        title: '核心模块',
        items: [
            {icon: '🔐', name: 'Erupt Upms', artifact: 'erupt-upms', desc: '用户、角色、菜单、组织的完整权限管理', link: '/zh/modules/erupt-upms'},
            {icon: '🗃️', name: 'Erupt Jpa', artifact: 'erupt-jpa', desc: 'JPA 数据库能力高度扩展，多数项目必选', link: '/zh/modules/erupt-jpa'},
            {icon: '🍃', name: 'Erupt Mongodb', artifact: 'erupt-mongodb', desc: 'MongoDB NoSQL 数据源支持', link: '/zh/modules/erupt-mongodb'},
            {icon: '📄', name: 'Erupt Tpl', artifact: 'erupt-tpl', desc: '自定义 HTML 模板页面，多套 UI 库集成', link: '/zh/modules/erupt-tpl'},
            {icon: '🖥️', name: 'Erupt Web', artifact: 'erupt-web', desc: 'Angular 前端源码，Jar 形式分发', link: '/zh/modules/erupt-web'},
            {icon: '🎨', name: 'Erupt Designer', artifact: 'erupt-designer', desc: '运行时拖拽设计实体模型，可导出注解代码', link: '/zh/modules/erupt-designer'},
        ],
    },
    {
        title: '工具模块',
        items: [
            {icon: '⌨️', name: 'Erupt Terminal', artifact: 'erupt-terminal', desc: '浏览器内直连服务器 Shell 终端', link: '/zh/modules/erupt-terminal'},
            {icon: '🔌', name: 'Erupt Websocket', artifact: 'erupt-websocket', desc: 'WebSocket 实时通信与数据推送', link: '/zh/modules/erupt-websocket'},
            {icon: '⚙️', name: 'Erupt Generator', artifact: 'erupt-generator', desc: '可视化生成 Erupt 实体类代码', link: '/zh/modules/erupt-generator'},
            {icon: '⏰', name: 'Erupt Job', artifact: 'erupt-job', desc: '可视化定时任务，Cron 配置与任务日志', link: '/zh/modules/erupt-job'},
            {icon: '📢', name: 'Erupt Notice', artifact: 'erupt-notice', desc: '公告、站内信等消息通知', link: '/zh/modules/erupt-notice'},
            {icon: '📈', name: 'Erupt Monitor', artifact: 'erupt-monitor', desc: 'CPU、JVM、连接池、在线用户实时监控', link: '/zh/modules/erupt-monitor'},
            {icon: '🪄', name: 'Erupt Magic Api', artifact: 'erupt-magic-api', desc: '在线 IDE，界面化编写 HTTP 接口', link: '/zh/modules/erupt-magic-api'},
            {icon: '🖨️', name: 'Erupt Print', artifact: 'erupt-print', desc: 'HTML 模板打印，单据报告一键输出', link: '/zh/modules/erupt-print'},
            {icon: '☁️', name: 'Erupt Cloud', artifact: 'erupt-cloud', desc: '分布式配置中心，数据库表替代 yml 配置', link: '/zh/modules/erupt-cloud'},
            {icon: '🛰️', name: 'Erupt Cloud Server', artifact: 'erupt-cloud-server', desc: '节点管理中心，服务注册与请求调度', link: '/zh/modules/cloud-server'},
            {icon: '📦', name: 'Erupt Cloud Node', artifact: 'erupt-cloud-node', desc: '分布式微节点，向 Server 注册并接受调度', link: '/zh/modules/cloud-node'},
        ],
    },
    {
        title: '商业模块',
        badge: 'PRO',
        items: [
            {icon: '📊', name: 'Erupt Chart', artifact: 'erupt-chart', desc: '纯 SQL 定义报表图表，零前后端代码', link: '/zh/modules/pro/erupt-chart', pro: true},
            {icon: '🏢', name: 'Erupt SaaS 多租户', artifact: 'erupt-tenant', desc: '功能多租户复用，数据完全隔离', link: '/zh/modules/pro/erupt-tenant', pro: true},
            {icon: '🔀', name: 'Erupt Flow', artifact: 'erupt-flow', desc: '通用流程引擎，钉钉风格可视化流程设计', link: '/zh/modules/pro/erupt-flow', pro: true},
            {icon: '🧊', name: 'Erupt Cube BI', artifact: 'erupt-cube', desc: '语义建模 BI 平台，注解建模 + 拖拽分析', link: '/zh/modules/pro/erupt-cube', pro: true},
        ],
    },
    {
        title: '第三方插件',
        badge: '社区',
        items: [
            {icon: '🔍', name: 'Erupt Dsl', artifact: 'erupt-dsl', desc: 'ORM 动态查询，DSL 语法构建复杂查询条件', link: '/zh/modules/third-party/erupt-dsl'},
            {icon: '🧩', name: 'Erupt Pf4j', artifact: 'erupt-pf4j', desc: '基于 PF4J 的动态插件加载能力', link: '/zh/modules/third-party/erupt-pf4j'},
            {icon: '🛢️', name: 'EZDML', artifact: 'ezdml', desc: '数据库建模工具，直接生成 Erupt 实体代码', link: '/zh/modules/third-party/ezdml'},
            {icon: '🕷️', name: '公众号采集', artifact: 'mp-crawler', desc: '微信公众号内容采集与管理插件', link: '/zh/modules/third-party/mp-crawler'},
            {icon: '🗳️', name: 'Erupt Vote', artifact: 'erupt-vote', desc: '投票插件，支持多种投票场景', link: '/zh/modules/third-party/erupt-vote'},
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

# 扩展模块总览

Erupt 采用模块化设计，核心功能拆分为独立 Maven 模块，按需引入，版本号与核心保持一致。

<div class="md-search">
    <svg class="md-search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    <input v-model="search" placeholder="搜索模块，如 upms、定时任务、流程..." />
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

<p v-if="filtered.length === 0" class="md-empty">未找到匹配的模块</p>

## 引入方式

所有官方模块的版本号与 erupt 核心版本保持一致，使用 `${erupt.version}` 统一管理：

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>模块名</artifactId>
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
