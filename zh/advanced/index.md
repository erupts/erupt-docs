---
aside: false
---

<script setup>
import { ref, computed } from 'vue'

const search = ref('')

const groups = [
    {
        title: 'DataProxy 数据代理',
        items: [
            {icon: '🪝', name: 'DataProxy 概览', desc: '在增删改查各阶段注入自定义业务逻辑', link: '/zh/advanced/data-proxy'},
            {icon: '🚦', name: 'CRUD 拦截', desc: 'before* / after* 增、改、删前后注入业务逻辑', link: '/zh/advanced/data-proxy-crud'},
            {icon: '✅', name: '表单校验', desc: 'validate 保存前数据校验，不通过则拒绝操作', link: '/zh/advanced/data-proxy-validate'},
            {icon: '🔍', name: '查询条件控制', desc: 'beforeFetch 条件注入与搜索框默认值', link: '/zh/advanced/data-proxy-query'},
            {icon: '🎨', name: '表格展示扩展', desc: '单元格着色、行按钮控制、自定义内容注入', link: '/zh/advanced/data-proxy-table'},
            {icon: '➕', name: '自定义行', desc: 'extraRow 向表格追加合计、汇总行', link: '/zh/advanced/extra-row'},
            {icon: '🫥', name: '虚拟字段', desc: '@Transient 非数据库字段的展示与填充', link: '/zh/advanced/virtual-field'},
            {icon: '📝', name: '表单行为', desc: 'addBehavior / editBehavior 表单打开时预处理', link: '/zh/advanced/data-proxy-form'},
            {icon: '📋', name: '表单视图', desc: 'FormView 将 Erupt 类渲染为全页表单，适合系统设置类场景', link: '/zh/advanced/form-view'},
            {icon: '📊', name: 'Excel 导入导出', desc: 'excel* 自定义导出文件、校验导入数据', link: '/zh/advanced/data-proxy-excel'},
            {icon: '🖨️', name: '打印内容处理', desc: 'print 自定义打印输出的 HTML 内容', link: '/zh/advanced/data-proxy-print'},
            {icon: '🧬', name: '通用继承', desc: '@PreDataProxy 通过继承复用 DataProxy 能力', link: '/zh/advanced/pre-data-proxy'},
        ],
    },
    {
        title: 'EruptDao 数据库操作',
        items: [
            {icon: '🧾', name: 'EruptDao 概览', desc: '基于 JPA 的数据操作工具，增删改查与原生 SQL', link: '/zh/advanced/erupt-dao'},
            {icon: '⛓️', name: '链式查询', desc: 'LambdaQuery 强类型查询、聚合、分页、关联查询', link: '/zh/advanced/erupt-dao-lambda'},
            {icon: '🔀', name: '多数据源操作', desc: 'getEntityManager 在指定数据源上执行查询', link: '/zh/advanced/erupt-dao-datasource'},
        ],
    },
    {
        title: '数据与持久化',
        items: [
            {icon: '🎯', name: '全局拦截', desc: 'PostDataProxy 全局统一拦截数据操作，无需逐类配置', link: '/zh/advanced/post-data-proxy'},
            {icon: '🗑️', name: '逻辑删除', desc: '以删除标识字段代替物理删除', link: '/zh/advanced/soft-delete'},
            {icon: '🗄️', name: '多数据源', desc: '配置并使用多个数据库数据源', link: '/zh/advanced/datasource'},
            {icon: '🛢️', name: '自定义数据源', desc: '用 Erupt 管理数据库以外的数据', link: '/zh/advanced/custom-datasource'},
        ],
    },
    {
        title: '登录与安全',
        items: [
            {icon: '🔑', name: '登录与认证', desc: '自定义登录逻辑、Token 校验、权限扩展', link: '/zh/advanced/auth'},
            {icon: '🚪', name: '自定义登录页', desc: '验证码登录、微信扫码等个性化登录场景', link: '/zh/advanced/custom-login-page'},
            {icon: '🔓', name: '开放接口', desc: 'appid + secret 获取 token，供外部系统调用', link: '/zh/advanced/open-api'},
        ],
    },
    {
        title: '界面与交互',
        items: [
            {icon: '💬', name: '前端消息与弹窗', desc: '由后端触发前端消息提示与弹窗', link: '/zh/advanced/frontend-notify'},
            {icon: '📤', name: '自定义文件上传', desc: '对接 OSS、本地存储等自定义上传实现', link: '/zh/advanced/upload'},
            {icon: '🌐', name: '国际化', desc: '多语言支持与自定义翻译', link: '/zh/advanced/i18n'},
        ],
    },
    {
        title: '开发与扩展',
        items: [
            {icon: '🔗', name: '现有项目接入', desc: '将 Erupt 集成进已有 Spring Boot 项目', link: '/zh/advanced/integration'},
            {icon: '🧭', name: '接口开发与操作日志', desc: '自定义 REST 接口与操作日志记录', link: '/zh/advanced/rest-api'},
            {icon: '📡', name: '事件监听器', desc: '监听框架内部事件，实现解耦扩展', link: '/zh/advanced/event-listener'},
            {icon: '🔧', name: '工具类', desc: 'Erupt 内置工具类使用说明', link: '/zh/advanced/utils'},
            {icon: '🔥', name: '热构建', desc: '修改注解无需重启，刷新页面即可生效', link: '/zh/advanced/hot-build'},
            {icon: '🧬', name: '扩展 Erupt 注解', desc: '基于 Erupt 注解体系进行二次扩展', link: '/zh/advanced/extend'},
            {icon: '🧩', name: '插件开发', desc: '开发自定义插件扩展框架能力', link: '/zh/advanced/plugin'},
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

# 进阶

本章介绍 Erupt 的进阶用法与扩展开发，帮助你在实际项目中应对更复杂的业务场景。

<div class="adv-search">
    <svg class="adv-search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    <input v-model="search" placeholder="搜索功能，如 DataProxy、认证、多数据源..." />
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

<p v-if="filtered.length === 0" class="adv-empty">未找到匹配的功能</p>

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
