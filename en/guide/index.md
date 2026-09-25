---
aside: false
---

<script setup>
const steps = [
    {num: '01', title: 'Bootstrap a Project', desc: 'Generate a ready-to-run skeleton at start.erupt.xyz', link: 'https://start.erupt.xyz/'},
    {num: '02', title: 'Quick Start', desc: 'Add dependencies, finish basic config, run in 5 minutes', link: '/en/guide/quick-start'},
    {num: '03', title: 'First Example', desc: 'Write one @Erupt class and get a full admin UI', link: '/en/guide/getting-started'},
    {num: '04', title: 'Configuration', desc: 'Learn common config options and runtime parameters', link: '/en/guide/configuration'},
]

const specs = [
    {l: 'OS Support', v: 'Windows · Linux · macOS'},
    {l: 'JDK', v: '17+'},
    {l: 'Spring Boot', v: '3.x'},
    {l: 'Startup Time', v: '2s ~ 5s'},
    {l: 'Devices', v: 'PC · Tablet · Mobile'},
    {l: 'Database', v: 'MySQL · PostgreSQL · Oracle · SQL Server · H2 · NoSQL'},
    {l: 'Modules', v: '10+'},
    {l: 'Components', v: '20+'},
    {l: 'Object Storage', v: '✔ Supported'},
    {l: 'Distributed', v: 'erupt-cloud'},
]

const features = [
    {name: 'Easy to start', desc: 'Basic Spring Boot knowledge is enough'},
    {name: 'Simple to use', desc: 'Get productive by learning only @Erupt and @EruptField'},
    {name: 'Concise code', desc: 'Zero frontend code, no template / controller / service / dao — just one class file'},
    {name: 'Agile development', desc: 'A single .java file delivers a full admin module'},
    {name: 'Fast iteration', desc: 'Requirement changes only need annotation tweaks'},
    {name: 'Powerful features', desc: 'Dynamic conditions, CRUD proxy hooks, session storage, behavior logging'},
    {name: 'Auto schema', desc: 'Thanks to JPA, database tables are created automatically'},
    {name: 'Low intrusion', desc: 'Annotation-driven, never interferes with Spring Boot or third-party libraries'},
    {name: 'Multi data source', desc: 'MySQL, Oracle, SQL Server, PostgreSQL, H2, and even MongoDB'},
    {name: 'Rich components', desc: '23+ categories — slider, datetime, image upload, code editor, tree, map…'},
    {name: 'Rich display', desc: 'Plain text, QR code, link, image, HTML, code snippet, iframe, and more'},
    {name: 'Code generation', desc: 'The generator pushes productivity even further'},
    {name: 'High extensibility', desc: 'Custom data sources, custom pages, dynamic permissions, lifecycle hooks, custom OSS'},
    {name: 'Polished UI', desc: 'Every interaction is carefully designed for the best experience'},
    {name: 'Permission management', desc: 'Users, roles, organizations, menus, login audit, operation logs'},
    {name: 'Strong security', desc: 'Login allowlist, permission validation, annotation checks, fine-grained access control'},
    {name: 'FE / BE separation', desc: 'Deploy frontend and backend independently'},
    {name: 'Responsive layout', desc: 'Works on desktops, tablets, and phones'},
    {name: 'Custom pages', desc: 'Custom pages and dialogs with native H5 / Freemarker / Thymeleaf rendering'},
]
</script>

# Erupt Framework Introduction

<p class="gd-sub">Erupt — Universal Data Management Framework</p>

<div class="gd-badges">
    <a class="gd-badge" href="https://search.maven.org/search?q=g:xyz.erupt" target="_blank" rel="noreferrer"><i class="gd-dot gd-c0"></i>Maven Central</a>
    <span class="gd-badge"><i class="gd-dot gd-c2"></i>JDK 17+</span>
    <span class="gd-badge"><i class="gd-dot gd-c1"></i>Apache-2.0</span>
    <a class="gd-badge" href="https://github.com/erupts/erupt" target="_blank" rel="noreferrer"><i class="gd-dot gd-c3"></i>GitHub ★</a>
</div>

## Overview

Erupt is a low-code, **full-stack** framework that uses **Java annotations** to dynamically generate pages and backend features such as create, read, update, delete, and permission control.

Zero frontend code, zero CRUD, automatic table creation — with just **one class file** and concise annotation configuration, you can rapidly build enterprise-grade admin systems.

It provides a full-stack solution for enterprise admin platforms, drastically shortening development cycles so you can focus on core business logic.

## Getting Started Path

<div class="gd-steps">
    <a v-for="s in steps" :key="s.num" class="gd-step" :href="s.link" :target="s.link.startsWith('http') ? '_blank' : undefined">
        <span class="gd-step-num">{{ s.num }}</span>
        <b>{{ s.title }}</b>
        <p>{{ s.desc }}</p>
    </a>
</div>

## Specifications

<div class="gd-specs">
    <div v-for="s in specs" :key="s.l" class="gd-spec">
        <span>{{ s.l }}</span>
        <b>{{ s.v }}</b>
    </div>
</div>

## Highlights

<div class="gd-feats">
    <div v-for="(f, i) in features" :key="f.name" class="gd-feat">
        <b><i class="gd-sq" :class="'gd-c' + (i % 4)"></i>{{ f.name }}</b>
        <p>{{ f.desc }}</p>
    </div>
</div>

## Online Demo

<div class="gd-demo">
    <div class="gd-demo-body">
        <b>Demo Environment</b>
        <p>Credentials: <code class="gd-account">guest / guest</code></p>
    </div>
    <a class="gd-btn" href="https://demo.erupt.xyz" target="_blank" rel="noreferrer">Open Demo →</a>
</div>

## Links

<div class="gd-links">
    <a class="gd-link" href="https://github.com/erupts/erupt" target="_blank" rel="noreferrer">GitHub Repo</a>
    <a class="gd-link" href="https://gitee.com/erupt/erupt" target="_blank" rel="noreferrer">Gitee Repo</a>
    <a class="gd-link" href="https://www.erupt.xyz/" target="_blank" rel="noreferrer">Official Site</a>
</div>

---

Copyright © 2019-2035 [erupt.xyz](https://erupt.xyz) All rights reserved.

**Author**: YuePeng / erupts@126.com

<style scoped>
/* ── Step cards ── */
.gd-steps {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin: 16px 0 8px;
}

.gd-step {
    position: relative;
    display: block;
    border: 2px solid #14120B;
    background: #FFFFFF;
    padding: 18px 16px 14px;
    text-decoration: none !important;
    color: inherit !important;
    overflow: hidden;
    transition: box-shadow .15s, transform .15s;
}

.dark .gd-step {
    border-color: #F0E8D6;
    background: #201C12;
}

.gd-step:hover {
    transform: translate(-2px, -2px);
    box-shadow: 5px 5px 0 #14120B;
}

.dark .gd-step:hover {
    box-shadow: 5px 5px 0 #F0E8D6;
}

.gd-step-num {
    position: absolute;
    top: 2px;
    right: 10px;
    font-family: var(--vp-font-family-mono);
    font-size: 44px;
    font-weight: 800;
    line-height: 1;
    color: rgba(20, 18, 11, .08);
    pointer-events: none;
}

.dark .gd-step-num {
    color: rgba(240, 232, 214, .1);
}

.gd-step b {
    display: block;
    font-size: 15px;
    font-weight: 800;
    color: #14120B;
    margin-bottom: 6px;
}

.dark .gd-step b {
    color: #F0E8D6;
}

.gd-step p {
    font-size: 12.5px;
    line-height: 1.6;
    color: #5C5647;
    margin: 0;
}

.dark .gd-step p {
    color: #B0A78F;
}

/* ── Feature cards ── */
.gd-feats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin: 16px 0 8px;
}

.gd-feat {
    border: 2px solid #14120B;
    background: #FFFFFF;
    padding: 14px 16px;
    transition: box-shadow .15s, transform .15s;
}

.dark .gd-feat {
    border-color: #F0E8D6;
    background: #201C12;
}

.gd-feat:hover {
    transform: translate(-2px, -2px);
    box-shadow: 4px 4px 0 #14120B;
}

.dark .gd-feat:hover {
    box-shadow: 4px 4px 0 #F0E8D6;
}

.gd-feat b {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 14px;
    font-weight: 800;
    color: #14120B;
    margin-bottom: 4px;
}

.dark .gd-feat b {
    color: #F0E8D6;
}

.gd-sq {
    width: 8px;
    height: 8px;
    border: 1.5px solid #14120B;
    flex-shrink: 0;
}

.gd-c0 { background: #4FC8EC; }
.gd-c1 { background: #F585B4; }
.gd-c2 { background: #93D655; }
.gd-c3 { background: #BCA0F2; }

.gd-feat p {
    font-size: 12.5px;
    line-height: 1.6;
    color: #5C5647;
    margin: 0;
}

.dark .gd-feat p {
    color: #B0A78F;
}

/* ── Demo card ── */
.gd-demo {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
    border: 2px solid #14120B;
    background: #FFF9EE;
    box-shadow: 5px 5px 0 #14120B;
    padding: 20px 24px;
    margin: 16px 0 8px;
}

.dark .gd-demo {
    border-color: #F0E8D6;
    background: #201C12;
    box-shadow: 5px 5px 0 #F0E8D6;
}

.gd-demo-body {
    flex: 1;
    min-width: 220px;
}

.gd-demo-body b {
    display: block;
    font-size: 15px;
    font-weight: 800;
    margin-bottom: 4px;
}

.gd-demo-body p {
    font-size: 13px;
    color: #5C5647;
    margin: 0;
}

.dark .gd-demo-body p {
    color: #B0A78F;
}

.gd-account {
    font-family: var(--vp-font-family-mono);
    font-weight: 700;
    border: 1.5px solid #14120B;
    background: #FFFFFF;
    border-radius: 0;
    padding: 1px 8px;
}

.dark .gd-account {
    border-color: #F0E8D6;
    background: #17140D;
}

.gd-btn {
    display: inline-block;
    font-size: 14px;
    font-weight: 800;
    text-decoration: none !important;
    color: #14120B !important;
    background: #F585B4;
    border: 2px solid #14120B;
    padding: 10px 24px;
    box-shadow: 3px 3px 0 #14120B;
    transition: transform .15s, box-shadow .15s;
}

.gd-btn:hover {
    transform: translate(-2px, -2px);
    box-shadow: 5px 5px 0 #14120B;
}

/* ── Link chips ── */
.gd-links {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin: 16px 0 8px;
}

.gd-link {
    font-size: 13.5px;
    font-weight: 700;
    color: #14120B !important;
    text-decoration: none !important;
    border: 2px solid #14120B;
    background: #FFFFFF;
    padding: 7px 18px;
    transition: background .15s;
}

.dark .gd-link {
    color: #F0E8D6 !important;
    border-color: #F0E8D6;
    background: #201C12;
}

.gd-link:hover {
    background: #4FC8EC;
    color: #14120B !important;
}

/* ── 标题区 ── */
.gd-sub {
    font-size: 15px;
    font-weight: 700;
    color: #5C5647;
    margin: -6px 0 16px;
}

.dark .gd-sub {
    color: #B0A78F;
}

.gd-badges {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin: 0 0 8px;
}

.gd-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: var(--vp-font-family-mono);
    font-size: 11.5px;
    font-weight: 700;
    color: #14120B !important;
    text-decoration: none !important;
    border: 1.5px solid #14120B;
    background: #FFFFFF;
    padding: 4px 10px;
    transition: background .15s;
}

.dark .gd-badge {
    color: #F0E8D6 !important;
    border-color: #F0E8D6;
    background: #201C12;
}

a.gd-badge:hover {
    background: #4FC8EC;
    color: #14120B !important;
}

.gd-dot {
    width: 7px;
    height: 7px;
    border: 1.5px solid #14120B;
    flex-shrink: 0;
}

/* ── 技术规格网格 ── */
.gd-specs {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    border: 2px solid #14120B;
    background: #FFFFFF;
    box-shadow: 5px 5px 0 #14120B;
    margin: 16px 0 8px;
}

.dark .gd-specs {
    border-color: #F0E8D6;
    background: #201C12;
    box-shadow: 5px 5px 0 #F0E8D6;
}

.gd-spec {
    padding: 12px 14px;
    border-right: 1.5px solid #14120B;
    border-bottom: 1.5px solid #14120B;
}

.dark .gd-spec {
    border-color: #F0E8D6;
}

.gd-spec:nth-child(5n) { border-right: none; }
.gd-spec:nth-last-child(-n+5) { border-bottom: none; }

.gd-spec span {
    display: block;
    font-family: var(--vp-font-family-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: #5C5647;
    margin-bottom: 4px;
}

.dark .gd-spec span {
    color: #B0A78F;
}

.gd-spec b {
    font-size: 13.5px;
    font-weight: 800;
    color: #14120B;
}

.dark .gd-spec b {
    color: #F0E8D6;
}

/* ── 响应式 ── */
@media (max-width: 960px) {
    .gd-steps { grid-template-columns: repeat(2, 1fr); }
    .gd-feats { grid-template-columns: repeat(2, 1fr); }
    .gd-specs { grid-template-columns: 1fr 1fr; }
    .gd-spec:nth-child(5n) { border-right: 1.5px solid #14120B; }
    .gd-spec:nth-child(2n) { border-right: none; }
    .gd-spec:nth-last-child(-n+5) { border-bottom: 1.5px solid #14120B; }
    .gd-spec:nth-last-child(-n+2) { border-bottom: none; }
    .dark .gd-spec:nth-child(5n) { border-right-color: #F0E8D6; }
    .dark .gd-spec:nth-child(2n) { border-right: none; }
    .dark .gd-spec:nth-last-child(-n+5) { border-bottom-color: #F0E8D6; }
    .dark .gd-spec:nth-last-child(-n+2) { border-bottom: none; }
}

@media (max-width: 560px) {
    .gd-steps { grid-template-columns: 1fr; }
    .gd-feats { grid-template-columns: 1fr; }
}
</style>
