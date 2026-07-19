<script setup>
import { computed } from 'vue'

const props = defineProps({ lang: { type: String, default: 'zh' } })

const dict = {
    zh: {
        eyebrow: '// 注解驱动的低代码引擎',
        titleA: '写一个类，',
        titleB: '喷发',
        titleC: '一个系统',
        lead: '在 Java 类上添加 @Erupt 注解，即刻获得完整后台管理系统 —— 零前端代码，零 CRUD 模板，内置 AI 大模型深度集成。',
        actions: [
            { text: '快速上手', link: '/zh/guide/quick-start', primary: true },
            { text: '在线体验', link: 'https://demo.erupt.xyz' },
            { text: '项目初始化', link: 'https://start.erupt.xyz' },
        ],
        meta: ['JDK 17+', 'Spring Boot 3.x', 'Apache 2.0'],
        codeTitle: 'SysUser.java',
        codeName: '用户管理',
        uiTitle: '用户管理 — 自动生成',
        uiAdd: '+ 新增',
        uiSearch: '搜索',
        uiCols: ['用户名', '邮箱', '状态'],
        uiRows: [
            ['liyuepeng', 'erupt@erupt.xyz', true],
            ['admin', 'admin@erupt.xyz', true],
            ['guest', 'guest@erupt.xyz', false],
        ],
        flow: '编译期注解 → 运行时界面',
        stats: [
            { num: '30+', label: '字段组件' },
            { num: '15+', label: 'AI 大模型接入' },
            { num: '2s', label: '启动时间' },
            { num: '0', label: '行前端代码' },
        ],
        featuresTitle: '为什么是 Erupt',
        features: [
            { tag: '@E', title: '一个注解，完整 CRUD', desc: '类上加 @Erupt，字段上加 @EruptField，自动生成增删改查、搜索、分页、权限 —— 无需 Controller / Service / Mapper。' },
            { tag: 'UI', title: '零前端代码', desc: '框架根据注解自动渲染前端页面，彻底告别前后端联调，30+ 内置组件覆盖绝大多数业务场景。' },
            { tag: 'AI', title: '大模型深度集成', desc: 'erupt-ai 支持 ChatGPT、Claude、DeepSeek 等 15+ 主流模型，内置 MCP Server、Agent、Tool 调用。' },
            { tag: 'ACL', title: '权限开箱即用', desc: '用户、角色、菜单、组织完整权限体系，行级数据权限，操作审计，JWT / Session 双模式认证。' },
            { tag: 'MOD', title: '模块化生态', desc: '定时任务、消息通知、服务监控、WebSocket、代码生成、Magic API 在线 IDE…… 按需引入，互不干扰。' },
            { tag: 'K8S', title: '分布式云原生', desc: 'erupt-cloud 支持微服务架构，零前端代码管理集群配置，K8s 友好，支持 IP 漂移与 svc 映射。' },
        ],
        modulesTitle: '模块生态',
        moduleGroups: [
            {
                name: '核心模块',
                items: [
                    { text: 'erupt-upms · 用户权限', link: '/zh/modules/erupt-upms' },
                    { text: 'erupt-job · 定时任务', link: '/zh/modules/erupt-job' },
                    { text: 'erupt-monitor · 服务监控', link: '/zh/modules/erupt-monitor' },
                    { text: 'erupt-notice · 消息通知', link: '/zh/modules/erupt-notice' },
                    { text: 'erupt-tpl · 自定义页面', link: '/zh/modules/erupt-tpl' },
                    { text: 'erupt-magic-api · 在线 IDE', link: '/zh/modules/erupt-magic-api' },
                    { text: 'erupt-cloud · 配置中心', link: '/zh/modules/erupt-cloud' },
                ],
            },
            {
                name: 'AI 模块',
                items: [
                    { text: '🐴 Erupt AI Harness · LLM / Agent / MCP', link: '/zh/modules/erupt-ai' },
                    { text: '🦞 Erupt AI Claw · 自然语言驱动服务器', link: '/zh/modules/erupt-ai-claw' },
                ],
            },
            {
                name: '商业模块',
                items: [
                    { text: 'Erupt Flow · 流程引擎', link: '/zh/modules/pro/erupt-flow' },
                    { text: 'Erupt Tenant · SaaS 多租户', link: '/zh/modules/pro/erupt-tenant' },
                    { text: 'Erupt Cube · 语义层 BI', link: '/zh/modules/pro/erupt-cube' },
                    { text: 'Erupt Chart · SQL 报表', link: '/zh/modules/pro/erupt-chart' },
                ],
            },
        ],
        stackTitle: '技术栈',
        stack: [
            ['JDK', '17+'],
            ['Spring Boot', '3.x'],
            ['数据库', 'MySQL · PostgreSQL · Oracle · SQL Server · H2 · MongoDB'],
            ['终端适配', 'PC · 平板 · 手机'],
            ['开源协议', 'Apache 2.0'],
        ],
        ctaTitle: '三行代码，开始喷发。',
        ctaDesc: '5 分钟搭建你的第一个管理系统',
        ctaBtn: '立即开始 →',
        ctaLink: '/zh/guide/quick-start',
    },
    en: {
        eyebrow: '// Annotation-Driven Low-Code Engine',
        titleA: 'One class. ',
        titleB: 'Erupt',
        titleC: ' a system.',
        lead: 'Add @Erupt annotations to a Java class and get a complete admin system instantly — zero frontend code, zero CRUD boilerplate, with deep AI LLM integration built in.',
        actions: [
            { text: 'Quick Start', link: '/en/guide/quick-start', primary: true },
            { text: 'Online Demo', link: 'https://demo.erupt.xyz' },
            { text: 'Project Init', link: 'https://start.erupt.xyz' },
        ],
        meta: ['JDK 17+', 'Spring Boot 3.x', 'Apache 2.0'],
        codeTitle: 'SysUser.java',
        codeName: 'User Management',
        uiTitle: 'User Management — auto generated',
        uiAdd: '+ New',
        uiSearch: 'Search',
        uiCols: ['Username', 'Email', 'Enabled'],
        uiRows: [
            ['liyuepeng', 'erupt@erupt.xyz', true],
            ['admin', 'admin@erupt.xyz', true],
            ['guest', 'guest@erupt.xyz', false],
        ],
        flow: 'compile-time annotations → runtime UI',
        stats: [
            { num: '30+', label: 'field components' },
            { num: '15+', label: 'LLMs supported' },
            { num: '2s', label: 'startup time' },
            { num: '0', label: 'lines of frontend code' },
        ],
        featuresTitle: 'Why Erupt',
        features: [
            { tag: '@E', title: 'One Annotation, Full CRUD', desc: 'Add @Erupt on the class, @EruptField on fields — list, create, edit, delete, search, pagination and permissions are generated. No Controller / Service / Mapper.' },
            { tag: 'UI', title: 'Zero Frontend Code', desc: 'The UI is rendered automatically from your annotations. No frontend-backend coordination; 30+ built-in components cover almost every scenario.' },
            { tag: 'AI', title: 'Deep LLM Integration', desc: 'erupt-ai supports 15+ mainstream models (ChatGPT, Claude, DeepSeek…) with built-in MCP Server, Agent and Tool calling.' },
            { tag: 'ACL', title: 'Out-of-the-Box Auth', desc: 'Complete users / roles / menus / org permission system, row-level data permissions, operation audit, JWT / Session dual authentication.' },
            { tag: 'MOD', title: 'Modular Ecosystem', desc: 'Scheduled jobs, notifications, monitoring, WebSocket, code generation, Magic API online IDE… plug in only what you need.' },
            { tag: 'K8S', title: 'Cloud-Native & Distributed', desc: 'erupt-cloud manages cluster configuration with zero frontend code. Kubernetes-friendly, with IP drift and svc mapping.' },
        ],
        modulesTitle: 'Module Ecosystem',
        moduleGroups: [
            {
                name: 'Core Modules',
                items: [
                    { text: 'erupt-upms · users & permissions', link: '/en/modules/erupt-upms' },
                    { text: 'erupt-job · scheduled jobs', link: '/en/modules/erupt-job' },
                    { text: 'erupt-monitor · monitoring', link: '/en/modules/erupt-monitor' },
                    { text: 'erupt-notice · notifications', link: '/en/modules/erupt-notice' },
                    { text: 'erupt-tpl · custom pages', link: '/en/modules/erupt-tpl' },
                    { text: 'erupt-magic-api · online IDE', link: '/en/modules/erupt-magic-api' },
                    { text: 'erupt-cloud · config center', link: '/en/modules/erupt-cloud' },
                ],
            },
            {
                name: 'AI Modules',
                items: [
                    { text: '🐴 Erupt AI Harness · LLM / Agent / MCP', link: '/en/modules/erupt-ai' },
                    { text: '🦞 Erupt AI Claw · NL-driven server', link: '/en/modules/erupt-ai-claw' },
                ],
            },
            {
                name: 'Commercial Modules',
                items: [
                    { text: 'Erupt Flow · workflow engine', link: '/en/modules/pro/erupt-flow' },
                    { text: 'Erupt Tenant · SaaS multi-tenancy', link: '/en/modules/pro/erupt-tenant' },
                    { text: 'Erupt Cube · semantic-layer BI', link: '/en/modules/pro/erupt-cube' },
                    { text: 'Erupt Chart · SQL reports', link: '/en/modules/pro/erupt-chart' },
                ],
            },
        ],
        stackTitle: 'Tech Stack',
        stack: [
            ['JDK', '17+'],
            ['Spring Boot', '3.x'],
            ['Database', 'MySQL · PostgreSQL · Oracle · SQL Server · H2 · MongoDB'],
            ['Devices', 'PC · Tablet · Mobile'],
            ['License', 'Apache 2.0'],
        ],
        ctaTitle: 'Three lines of code. Let it erupt.',
        ctaDesc: 'Build your first admin system in 5 minutes',
        ctaBtn: 'Get Started →',
        ctaLink: '/en/guide/quick-start',
    },
}

const t = computed(() => dict[props.lang] || dict.zh)
</script>

<template>
    <div class="eh">
        <!-- ======== HERO ======== -->
        <section class="eh-hero">
            <div class="eh-hero-bg" aria-hidden="true"></div>
            <div class="eh-wrap eh-hero-inner">
                <div class="eh-hero-copy">
                    <p class="eh-eyebrow eh-reveal">{{ t.eyebrow }}</p>
                    <h1 class="eh-title eh-reveal" style="--d:.08s">
                        {{ t.titleA }}<span class="eh-title-accent">{{ t.titleB }}</span>{{ t.titleC }}
                    </h1>
                    <p class="eh-lead eh-reveal" style="--d:.16s">{{ t.lead }}</p>
                    <div class="eh-actions eh-reveal" style="--d:.24s">
                        <a v-for="a in t.actions" :key="a.text" :href="a.link"
                           :class="['eh-btn', a.primary ? 'eh-btn-primary' : 'eh-btn-ghost']"
                           :target="a.link.startsWith('http') ? '_blank' : undefined">{{ a.text }}</a>
                    </div>
                    <ul class="eh-meta eh-reveal" style="--d:.32s">
                        <li v-for="m in t.meta" :key="m">{{ m }}</li>
                    </ul>
                </div>

                <div class="eh-hero-demo eh-reveal" style="--d:.2s">
                    <div class="eh-code-card">
                        <div class="eh-window-bar">
                            <span class="eh-dot"></span><span class="eh-dot"></span><span class="eh-dot"></span>
                            <span class="eh-window-title">{{ t.codeTitle }}</span>
                        </div>
                        <pre class="eh-code"><code><span class="a">@Erupt</span>(name = <span class="s">"{{ t.codeName }}"</span>)
<span class="k">public class</span> <span class="t">SysUser</span> {

    <span class="a">@EruptField</span>(edit = <span class="a">@Edit</span>(title = <span class="s">"{{ t.uiCols[0] }}"</span>))
    <span class="k">private</span> <span class="t">String</span> username;

    <span class="a">@EruptField</span>(edit = <span class="a">@Edit</span>(title = <span class="s">"{{ t.uiCols[1] }}"</span>))
    <span class="k">private</span> <span class="t">String</span> email;

    <span class="a">@EruptField</span>(edit = <span class="a">@Edit</span>(title = <span class="s">"{{ t.uiCols[2] }}"</span>))
    <span class="k">private</span> <span class="t">Boolean</span> enable;
}</code></pre>
                    </div>

                    <div class="eh-flow" aria-hidden="true">
                        <span class="eh-flow-at">@</span>
                        <span class="eh-flow-line"></span>
                        <span class="eh-flow-text">{{ t.flow }}</span>
                    </div>

                    <div class="eh-ui-card">
                        <div class="eh-window-bar">
                            <span class="eh-dot"></span><span class="eh-dot"></span><span class="eh-dot"></span>
                            <span class="eh-window-title">{{ t.uiTitle }}</span>
                        </div>
                        <div class="eh-ui-toolbar">
                            <span class="eh-ui-btn-add">{{ t.uiAdd }}</span>
                            <span class="eh-ui-search">⌕ {{ t.uiSearch }}</span>
                        </div>
                        <div class="eh-ui-table">
                            <div class="eh-ui-tr eh-ui-th">
                                <span v-for="c in t.uiCols" :key="c">{{ c }}</span>
                            </div>
                            <div v-for="(r, i) in t.uiRows" :key="i" class="eh-ui-tr eh-ui-row" :style="{'--rd': (0.6 + i * 0.15) + 's'}">
                                <span>{{ r[0] }}</span>
                                <span class="eh-ui-dim">{{ r[1] }}</span>
                                <span><i :class="['eh-switch', { on: r[2] }]"></i></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ======== STATS ======== -->
        <section class="eh-stats">
            <div class="eh-wrap eh-stats-grid">
                <div v-for="s in t.stats" :key="s.label" class="eh-stat">
                    <span class="eh-stat-num">{{ s.num }}</span>
                    <span class="eh-stat-label">{{ s.label }}</span>
                </div>
            </div>
        </section>

        <!-- ======== FEATURES ======== -->
        <section class="eh-section">
            <div class="eh-wrap">
                <h2 class="eh-h2"><span class="eh-h2-mark">##</span> {{ t.featuresTitle }}</h2>
                <div class="eh-feature-grid">
                    <div v-for="(f, i) in t.features" :key="f.title" class="eh-feature">
                        <div class="eh-feature-head">
                            <span class="eh-feature-tag">{{ f.tag }}</span>
                            <span class="eh-feature-idx">0{{ i + 1 }}</span>
                        </div>
                        <h3>{{ f.title }}</h3>
                        <p>{{ f.desc }}</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- ======== MODULES ======== -->
        <section class="eh-section eh-section-alt">
            <div class="eh-wrap">
                <h2 class="eh-h2"><span class="eh-h2-mark">##</span> {{ t.modulesTitle }}</h2>
                <div class="eh-module-groups">
                    <div v-for="g in t.moduleGroups" :key="g.name" class="eh-module-group">
                        <h3>{{ g.name }}</h3>
                        <div class="eh-module-chips">
                            <a v-for="m in g.items" :key="m.text" :href="m.link" class="eh-chip">{{ m.text }}</a>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ======== STACK ======== -->
        <section class="eh-section">
            <div class="eh-wrap">
                <h2 class="eh-h2"><span class="eh-h2-mark">##</span> {{ t.stackTitle }}</h2>
                <dl class="eh-stack">
                    <div v-for="row in t.stack" :key="row[0]" class="eh-stack-row">
                        <dt>{{ row[0] }}</dt>
                        <dd>{{ row[1] }}</dd>
                    </div>
                </dl>
            </div>
        </section>

        <!-- ======== CTA ======== -->
        <section class="eh-cta">
            <div class="eh-cta-bg" aria-hidden="true"></div>
            <div class="eh-wrap eh-cta-inner">
                <h2>{{ t.ctaTitle }}</h2>
                <p>{{ t.ctaDesc }}</p>
                <a :href="t.ctaLink" class="eh-btn eh-btn-primary eh-btn-lg">{{ t.ctaBtn }}</a>
            </div>
        </section>
    </div>
</template>

<style scoped>
.eh {
    --eh-accent: #ff5722;
    --eh-accent-hover: #e64a19;
    --eh-accent-soft: rgba(255, 87, 34, .1);
    --eh-mono: ui-monospace, 'JetBrains Mono', SFMono-Regular, Menlo, Consolas, monospace;
    overflow-x: hidden;
}

.eh-wrap {
    max-width: 1152px;
    margin: 0 auto;
    padding: 0 24px;
}

/* ---------- reveal animation ---------- */
.eh-reveal {
    opacity: 0;
    transform: translateY(16px);
    animation: eh-up .7s cubic-bezier(.22, .8, .3, 1) forwards;
    animation-delay: var(--d, 0s);
}

@keyframes eh-up {
    to {
        opacity: 1;
        transform: none;
    }
}

@media (prefers-reduced-motion: reduce) {
    .eh *, .eh *::before, .eh *::after {
        animation-duration: .01s !important;
        animation-delay: 0s !important;
        transition-duration: .01s !important;
    }
}

/* ---------- hero ---------- */
.eh-hero {
    position: relative;
    padding: 88px 0 72px;
}

.eh-hero-bg {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(var(--vp-c-divider) 1px, transparent 1px),
    linear-gradient(90deg, var(--vp-c-divider) 1px, transparent 1px);
    background-size: 48px 48px;
    opacity: .28;
    -webkit-mask-image: radial-gradient(ellipse 90% 80% at 50% 0%, #000 30%, transparent 75%);
    mask-image: radial-gradient(ellipse 90% 80% at 50% 0%, #000 30%, transparent 75%);
    pointer-events: none;
}

.eh-hero-bg::after {
    content: '';
    position: absolute;
    top: -180px;
    right: -120px;
    width: 560px;
    height: 560px;
    background: radial-gradient(circle, var(--eh-accent-soft) 0%, transparent 65%);
    animation: eh-breathe 6s ease-in-out infinite;
}

@keyframes eh-breathe {
    0%, 100% { opacity: .7; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.08); }
}

.eh-hero-inner {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
    gap: 56px;
    align-items: center;
}

.eh-eyebrow {
    font-family: var(--eh-mono);
    font-size: 13px;
    letter-spacing: .12em;
    color: var(--eh-accent);
    margin: 0 0 16px;
}

.eh-title {
    font-size: clamp(34px, 4.6vw, 52px);
    line-height: 1.15;
    font-weight: 800;
    letter-spacing: -.02em;
    color: var(--vp-c-text-1);
    margin: 0 0 20px;
}

.eh-title-accent {
    color: var(--eh-accent);
    position: relative;
    white-space: nowrap;
}

.eh-title-accent::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 4px;
    height: 10px;
    background: var(--eh-accent-soft);
    z-index: -1;
    transform: skewX(-12deg);
}

.eh-lead {
    font-size: 16px;
    line-height: 1.8;
    color: var(--vp-c-text-2);
    margin: 0 0 28px;
    max-width: 30em;
}

.eh-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 24px;
}

.eh-btn {
    display: inline-block;
    padding: 10px 22px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none !important;
    transition: transform .2s, box-shadow .2s, background .2s, border-color .2s;
}

.eh-btn-primary {
    background: var(--eh-accent);
    color: #fff !important;
    box-shadow: 0 4px 14px rgba(255, 87, 34, .35);
}

.eh-btn-primary:hover {
    background: var(--eh-accent-hover);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 87, 34, .4);
}

.eh-btn-ghost {
    border: 1px solid var(--vp-c-divider);
    color: var(--vp-c-text-1) !important;
    background: var(--vp-c-bg);
}

.eh-btn-ghost:hover {
    border-color: var(--eh-accent);
    color: var(--eh-accent) !important;
    transform: translateY(-2px);
}

.eh-btn-lg {
    padding: 14px 34px;
    font-size: 16px;
    border-radius: 8px;
}

.eh-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
    list-style: none;
    margin: 0;
    padding: 0;
}

.eh-meta li {
    font-family: var(--eh-mono);
    font-size: 12px;
    color: var(--vp-c-text-3);
}

.eh-meta li::before {
    content: '✓ ';
    color: var(--eh-accent);
}

/* ---------- hero demo ---------- */
.eh-hero-demo {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0;
}

.eh-window-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px 14px;
    border-bottom: 1px solid var(--vp-c-divider);
    background: var(--vp-c-bg-soft);
}

.eh-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--vp-c-divider);
}

.eh-code-card .eh-dot:first-child, .eh-ui-card .eh-dot:first-child {
    background: var(--eh-accent);
}

.eh-window-title {
    margin-left: 8px;
    font-family: var(--eh-mono);
    font-size: 11px;
    color: var(--vp-c-text-3);
}

.eh-code-card {
    border: 1px solid var(--vp-c-divider);
    border-radius: 10px;
    overflow: hidden;
    background: var(--vp-c-bg);
    box-shadow: 0 12px 32px rgba(0, 0, 0, .08);
}

.eh-code {
    margin: 0;
    padding: 16px 18px;
    font-family: var(--eh-mono);
    font-size: 12.5px;
    line-height: 1.75;
    overflow-x: auto;
    color: var(--vp-c-text-2);
    background: var(--vp-c-bg);
}

.eh-code .a { color: var(--eh-accent); font-weight: 600; }
.eh-code .k { color: var(--vp-c-text-1); font-weight: 600; }
.eh-code .t { color: #2f9e8f; }
.eh-code .s { color: #b26a00; }

.dark .eh-code .t { color: #4ec9b0; }
.dark .eh-code .s { color: #ce9178; }

.eh-flow {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 6px;
}

.eh-flow-at {
    font-family: var(--eh-mono);
    font-size: 18px;
    font-weight: 700;
    color: var(--eh-accent);
    animation: eh-pulse 1.8s ease-in-out infinite;
}

@keyframes eh-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .35; }
}

.eh-flow-line {
    flex: 1;
    height: 1px;
    background: repeating-linear-gradient(90deg, var(--eh-accent) 0 6px, transparent 6px 12px);
    opacity: .6;
}

.eh-flow-text {
    font-family: var(--eh-mono);
    font-size: 11px;
    color: var(--vp-c-text-3);
    letter-spacing: .06em;
}

.eh-ui-card {
    border: 1px solid var(--vp-c-divider);
    border-radius: 10px;
    overflow: hidden;
    background: var(--vp-c-bg);
    box-shadow: 0 12px 32px rgba(0, 0, 0, .08);
}

.eh-ui-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
}

.eh-ui-btn-add {
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    background: var(--eh-accent);
    border-radius: 4px;
    padding: 4px 12px;
}

.eh-ui-search {
    font-size: 12px;
    color: var(--vp-c-text-3);
    border: 1px solid var(--vp-c-divider);
    border-radius: 4px;
    padding: 4px 12px;
    min-width: 120px;
}

.eh-ui-table {
    padding: 0 14px 14px;
}

.eh-ui-tr {
    display: grid;
    grid-template-columns: 1.1fr 1.6fr .7fr;
    gap: 8px;
    align-items: center;
    padding: 8px 10px;
    font-size: 12.5px;
}

.eh-ui-th {
    font-weight: 600;
    color: var(--vp-c-text-2);
    background: var(--vp-c-bg-soft);
    border-radius: 6px;
    font-size: 12px;
}

.eh-ui-row {
    border-bottom: 1px dashed var(--vp-c-divider);
    color: var(--vp-c-text-1);
    opacity: 0;
    animation: eh-up .5s ease forwards;
    animation-delay: var(--rd, .6s);
}

.eh-ui-row:last-child {
    border-bottom: none;
}

.eh-ui-dim {
    color: var(--vp-c-text-3);
    font-family: var(--eh-mono);
    font-size: 11.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.eh-switch {
    display: inline-block;
    width: 28px;
    height: 16px;
    border-radius: 8px;
    background: var(--vp-c-divider);
    position: relative;
    transition: background .3s;
}

.eh-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    transition: transform .3s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, .25);
}

.eh-switch.on {
    background: var(--eh-accent);
}

.eh-switch.on::after {
    transform: translateX(12px);
}

/* ---------- stats ---------- */
.eh-stats {
    border-top: 1px solid var(--vp-c-divider);
    border-bottom: 1px solid var(--vp-c-divider);
    background: var(--vp-c-bg-soft);
}

.eh-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding-top: 32px;
    padding-bottom: 32px;
}

.eh-stat {
    text-align: center;
}

.eh-stat-num {
    display: block;
    font-family: var(--eh-mono);
    font-size: clamp(28px, 3.4vw, 40px);
    font-weight: 800;
    color: var(--eh-accent);
    line-height: 1.1;
}

.eh-stat-label {
    display: block;
    margin-top: 6px;
    font-size: 13px;
    color: var(--vp-c-text-2);
}

/* ---------- sections ---------- */
.eh-section {
    padding: 72px 0;
}

.eh-section-alt {
    background: var(--vp-c-bg-soft);
    border-top: 1px solid var(--vp-c-divider);
    border-bottom: 1px solid var(--vp-c-divider);
}

.eh-h2 {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -.01em;
    color: var(--vp-c-text-1);
    margin: 0 0 32px;
}

.eh-h2-mark {
    font-family: var(--eh-mono);
    color: var(--eh-accent);
    margin-right: 6px;
    font-weight: 700;
}

/* ---------- features ---------- */
.eh-feature-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

.eh-feature {
    border: 1px solid var(--vp-c-divider);
    border-radius: 10px;
    padding: 22px;
    background: var(--vp-c-bg);
    transition: border-color .25s, transform .25s, box-shadow .25s;
}

.eh-feature:hover {
    border-color: var(--eh-accent);
    transform: translateY(-4px);
    box-shadow: 0 10px 28px rgba(255, 87, 34, .12);
}

.eh-feature-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
}

.eh-feature-tag {
    font-family: var(--eh-mono);
    font-size: 12px;
    font-weight: 700;
    color: var(--eh-accent);
    background: var(--eh-accent-soft);
    border-radius: 4px;
    padding: 3px 8px;
    letter-spacing: .04em;
}

.eh-feature-idx {
    font-family: var(--eh-mono);
    font-size: 12px;
    color: var(--vp-c-text-3);
}

.eh-feature h3 {
    font-size: 16px;
    font-weight: 700;
    color: var(--vp-c-text-1);
    margin: 0 0 8px;
}

.eh-feature p {
    font-size: 13.5px;
    line-height: 1.7;
    color: var(--vp-c-text-2);
    margin: 0;
}

/* ---------- modules ---------- */
.eh-module-groups {
    display: flex;
    flex-direction: column;
    gap: 28px;
}

.eh-module-group h3 {
    font-family: var(--eh-mono);
    font-size: 13px;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--vp-c-text-3);
    margin: 0 0 12px;
}

.eh-module-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.eh-chip {
    font-size: 13px;
    color: var(--vp-c-text-1) !important;
    text-decoration: none !important;
    border: 1px solid var(--vp-c-divider);
    background: var(--vp-c-bg);
    border-radius: 999px;
    padding: 7px 16px;
    transition: border-color .2s, color .2s, transform .2s;
}

.eh-chip:hover {
    border-color: var(--eh-accent);
    color: var(--eh-accent) !important;
    transform: translateY(-2px);
}

/* ---------- stack ---------- */
.eh-stack {
    margin: 0;
    border: 1px solid var(--vp-c-divider);
    border-radius: 10px;
    overflow: hidden;
}

.eh-stack-row {
    display: grid;
    grid-template-columns: 180px 1fr;
    border-bottom: 1px solid var(--vp-c-divider);
}

.eh-stack-row:last-child {
    border-bottom: none;
}

.eh-stack-row:nth-child(odd) {
    background: var(--vp-c-bg-soft);
}

.eh-stack dt {
    font-family: var(--eh-mono);
    font-size: 13px;
    font-weight: 600;
    color: var(--eh-accent);
    padding: 12px 18px;
}

.eh-stack dd {
    margin: 0;
    font-size: 13.5px;
    color: var(--vp-c-text-2);
    padding: 12px 18px;
}

/* ---------- CTA ---------- */
.eh-cta {
    position: relative;
    padding: 88px 0;
    overflow: hidden;
}

.eh-cta-bg {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 60% 90% at 50% 100%, var(--eh-accent-soft) 0%, transparent 70%);
    pointer-events: none;
}

.eh-cta-inner {
    position: relative;
    text-align: center;
}

.eh-cta h2 {
    font-size: clamp(26px, 3.6vw, 40px);
    font-weight: 800;
    letter-spacing: -.02em;
    color: var(--vp-c-text-1);
    margin: 0 0 12px;
}

.eh-cta p {
    font-size: 15px;
    color: var(--vp-c-text-2);
    margin: 0 0 28px;
}

/* ---------- responsive ---------- */
@media (max-width: 960px) {
    .eh-hero-inner {
        grid-template-columns: 1fr;
        gap: 40px;
    }

    .eh-feature-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .eh-stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 560px) {
    .eh-hero {
        padding: 56px 0 48px;
    }

    .eh-feature-grid {
        grid-template-columns: 1fr;
    }

    .eh-stack-row {
        grid-template-columns: 1fr;
    }

    .eh-stack dt {
        padding-bottom: 0;
    }
}
</style>
