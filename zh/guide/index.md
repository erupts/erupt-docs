---
aside: false
---

<script setup>
const steps = [
    {num: '01', title: '初始化项目', desc: '用 start.erupt.xyz 在线生成一个开箱即用的项目骨架', link: 'https://start.erupt.xyz/'},
    {num: '02', title: '快速上手', desc: '引入依赖、完成基础配置，5 分钟跑起来', link: '/zh/guide/quick-start'},
    {num: '03', title: '第一个示例', desc: '写一个 @Erupt 类，生成完整管理界面', link: '/zh/guide/getting-started'},
    {num: '04', title: '配置说明', desc: '了解常用配置项与运行参数', link: '/zh/guide/configuration'},
]

const specs = [
    {l: '操作系统', v: 'Windows · Linux · Mac'},
    {l: 'JDK', v: '17+'},
    {l: 'Spring Boot', v: '3.x'},
    {l: '启动速度', v: '2s ~ 5s'},
    {l: '终端适配', v: 'PC · 平板 · 手机'},
    {l: '数据源', v: 'MySQL · PostgreSQL · Oracle · SQL Server · H2 · NoSQL'},
    {l: '扩展模块', v: '10+'},
    {l: '组件支持', v: '20+'},
    {l: 'OSS 支持', v: '✔ 支持'},
    {l: '分布式', v: 'erupt-cloud'},
]

const features = [
    {name: '易于上手', desc: '会简单的 Spring Boot 基础知识即可'},
    {name: '使用简单', desc: '仅需了解 @Erupt 与 @EruptField 两个注解即可上手开发'},
    {name: '代码简洁', desc: '前端零代码，后端无 template / controller / service / dao，仅需一个类文件'},
    {name: '敏捷开发', desc: '单个 .java 文件即可实现后台管理功能，专注业务研发'},
    {name: '快速迭代', desc: '需求变更仅需修改注解配置，迭代速度比需求讨论还快'},
    {name: '功能强大', desc: '动态条件处理、增删改查代理接口、Session 存储机制、行为日志等'},
    {name: '自动建表', desc: '依托 JPA 自动完成数据库建表相关工作'},
    {name: '低侵入性', desc: '功能围绕注解展开，不影响 Spring Boot 其他功能或三方库'},
    {name: '多数据源', desc: 'MySQL、Oracle、SQL Server、PostgreSQL、H2，甚至 MongoDB'},
    {name: '大量组件', desc: '滑动输入、时间选择、图片上传、代码编辑器、树、地图等 23 类组件'},
    {name: '丰富展示', desc: '普通文本、二维码、链接、图片、HTML、代码段、iframe 等'},
    {name: '代码生成', desc: '代码生成器进一步提升开发效率'},
    {name: '高扩展性', desc: '自定义数据源、自定义页面、动态权限、生命周期函数、自定义 OSS 等'},
    {name: '界面美观', desc: '每个交互都精心设计，产品思维打磨操作体验'},
    {name: '权限管理', desc: '用户、角色、组织、菜单管理，登录日志、操作日志'},
    {name: '高安全性', desc: '登录白名单、权限验证、注解项检查、细颗粒度权限控制'},
    {name: '前后端分离', desc: '后端与前端可分开部署'},
    {name: '响应式布局', desc: '支持 PC、平板、手机等各种规格设备'},
    {name: '扩展页面', desc: '自定义页面与弹出层，支持原生 H5 / Freemarker / Thymeleaf 渲染'},
]
</script>

# Erupt 框架介绍

<p class="gd-sub">Erupt 通用数据管理框架</p>

<div class="gd-badges">
    <a class="gd-badge" href="https://search.maven.org/search?q=g:xyz.erupt" target="_blank" rel="noreferrer"><i class="gd-dot gd-c0"></i>Maven Central</a>
    <span class="gd-badge"><i class="gd-dot gd-c2"></i>JDK 17+</span>
    <span class="gd-badge"><i class="gd-dot gd-c1"></i>Apache-2.0</span>
    <a class="gd-badge" href="https://github.com/erupts/erupt" target="_blank" rel="noreferrer"><i class="gd-dot gd-c3"></i>GitHub ★</a>
</div>

## 简介

Erupt 是一个低代码**全栈类**框架，它使用 **Java 注解**动态生成页面以及增、删、改、查、权限控制等后台功能。

零前端代码、零 CURD、自动建表，仅需**一个类文件** + 简洁的注解配置，快速开发企业级 Admin 管理后台。

提供企业级中后台管理系统的全栈解决方案，大幅压缩研发周期，专注核心业务。

## 上手路径

<div class="gd-steps">
    <a v-for="s in steps" :key="s.num" class="gd-step" :href="s.link" :target="s.link.startsWith('http') ? '_blank' : undefined">
        <span class="gd-step-num">{{ s.num }}</span>
        <b>{{ s.title }}</b>
        <p>{{ s.desc }}</p>
    </a>
</div>

## 技术规格

<div class="gd-specs">
    <div v-for="s in specs" :key="s.l" class="gd-spec">
        <span>{{ s.l }}</span>
        <b>{{ s.v }}</b>
    </div>
</div>

## 特性

<div class="gd-feats">
    <div v-for="(f, i) in features" :key="f.name" class="gd-feat">
        <b><i class="gd-sq" :class="'gd-c' + (i % 4)"></i>{{ f.name }}</b>
        <p>{{ f.desc }}</p>
    </div>
</div>

## 在线体验

<div class="gd-demo">
    <div class="gd-demo-body">
        <b>演示环境</b>
        <p>账号密码：<code class="gd-account">guest / guest</code></p>
    </div>
    <a class="gd-btn" href="https://demo.erupt.xyz" target="_blank" rel="noreferrer">打开演示 →</a>
</div>

## 相关链接

<div class="gd-links">
    <a class="gd-link" href="https://github.com/erupts/erupt" target="_blank" rel="noreferrer">GitHub 仓库</a>
    <a class="gd-link" href="https://gitee.com/erupt/erupt" target="_blank" rel="noreferrer">Gitee 仓库</a>
    <a class="gd-link" href="https://www.erupt.xyz/" target="_blank" rel="noreferrer">官方网站</a>
</div>

---

Copyright © 2019-2035 [erupt.xyz](https://erupt.xyz) All rights reserved.

**作者**：YuePeng / erupts@126.com

<style scoped>
/* ── 上手步骤卡 ── */
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

/* ── 特性卡片 ── */
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

/* ── 在线体验 ── */
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

/* ── 相关链接 ── */
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
