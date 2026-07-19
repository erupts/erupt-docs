---
aside: false
---

<script setup>
const trees = [
    {
        anno: '@EruptScan',
        link: '/zh/annotation/erupt-scan',
        desc: '标注在启动类上，声明 Erupt 实体的扫描包路径',
        note: '入口',
        children: [],
    },
    {
        anno: '@Erupt',
        link: '/zh/annotation/erupt',
        desc: '类注解，定义实体的管理行为与页面能力',
        note: '类级',
        children: [
            {attr: 'power', anno: '@Power', desc: '增删改查等操作权限控制', link: '/zh/annotation/power'},
            {attr: 'rowOperation', anno: '@RowOperation', desc: '自定义行操作按钮', link: '/zh/annotation/row-operation'},
            {attr: 'drills', anno: '@Drill', desc: '数据钻取，无需外键的一对多关联', link: '/zh/annotation/drill'},
            {attr: 'filter', anno: '@Filter', desc: '数据展示过滤条件', link: '/zh/annotation/filter'},
            {attr: 'orderBy', anno: '@OrderBy', desc: '数据排序规则配置', link: '/zh/annotation/order-by'},
            {attr: 'tree', anno: '@Tree', desc: '树形数据展示', link: '/zh/annotation/tree'},
            {attr: 'linkTree', anno: '@LinkTree', desc: '左树右表布局', link: '/zh/annotation/link-tree'},
            {attr: 'layout', anno: '@Layout', desc: '页面布局与分页配置', link: '/zh/annotation/layout'},
            {
                attr: 'vis', anno: '@Vis', desc: '多视图切换', link: '/zh/annotation/vis',
                tags: [
                    {t: '卡片 CARD', l: '/zh/annotation/vis-card'},
                    {t: '甘特图 GANTT', l: '/zh/annotation/vis-gantt'},
                    {t: '看板 BOARD', l: '/zh/annotation/vis-board'},
                    {t: '日历 CALENDAR', l: '/zh/annotation/vis-calendar'},
                ],
            },
        ],
    },
    {
        anno: '@EruptField',
        link: '/zh/annotation/erupt-field',
        desc: '字段注解，声明字段的展示与编辑行为',
        note: '字段级',
        children: [
            {attr: 'views', anno: '@View', desc: '表格列展示配置', link: '/zh/annotation/view'},
            {
                attr: 'edit', anno: '@Edit', desc: '编辑表单配置', link: '/zh/annotation/edit',
                children: [
                    {attr: 'type', anno: 'EditType', plain: true, desc: '30+ 字段组件类型，详见字段类型总览', link: '/zh/field-types/'},
                    {attr: 'search', anno: '@Search', desc: '搜索栏配置', link: '/zh/annotation/search'},
                    {attr: 'onchange', anno: 'OnChange', plain: true, desc: '字段联动，值变更时实时联动其他字段', link: '/zh/annotation/on-change'},
                    {attr: 'dynamic', anno: '@Dynamic', desc: '动态组件控制', link: '/zh/annotation/dynamic'},
                ],
            },
        ],
    },
]
</script>

# 核心注解概览

Erupt 的注解体系由**类级**与**字段级**两条主线构成：`@Erupt` 定义实体整体行为，`@EruptField` 声明每个字段的展示与编辑。功能注解均以属性形式挂载其上，层级关系如下。

<section v-for="t in trees" :key="t.anno" class="an-root">
    <div class="an-root-head">
        <a class="an-root-anno" :href="t.link">{{ t.anno }}</a>
        <span class="an-note">{{ t.note }}</span>
        <span class="an-root-desc">{{ t.desc }}</span>
    </div>
    <ul v-if="t.children.length" class="an-tree">
        <li v-for="c in t.children" :key="c.attr + c.anno">
            <div class="an-row">
                <code class="an-attr">{{ c.attr }} =</code>
                <a class="an-anno" :class="{ plain: c.plain }" :href="c.link">{{ c.anno }}</a>
                <span class="an-desc">{{ c.desc }}</span>
            </div>
            <div v-if="c.tags" class="an-tags">
                <a v-for="g in c.tags" :key="g.t" class="an-tag" :href="g.l">{{ g.t }}</a>
            </div>
            <ul v-if="c.children" class="an-tree">
                <li v-for="s in c.children" :key="s.attr + s.anno">
                    <div class="an-row">
                        <code class="an-attr">{{ s.attr }} =</code>
                        <a class="an-anno" :class="{ plain: s.plain }" :href="s.link">{{ s.anno }}</a>
                        <span class="an-desc">{{ s.desc }}</span>
                    </div>
                </li>
            </ul>
        </li>
    </ul>
</section>

## 使用建议

1. 从基础开始：先了解 `@Erupt` 核心注解，再学习其他功能注解
2. 权限优先：配置 `@Power` 注解确保数据安全
3. 布局优化：使用 `@Layout` 提升用户体验
4. 数据关联：掌握 `@Drill` 和 `@LinkTree` 实现复杂数据关系
5. 字段配置：结合 `@View` 和 `@Edit` 精细控制字段展示和编辑
6. 动态交互：使用 `@Dynamic` 实现条件化表单交互

<style scoped>
.an-root {
    margin: 28px 0;
    border: 1px solid var(--vp-c-divider);
    border-radius: 12px;
    padding: 18px 22px 14px;
    background: var(--vp-c-bg);
}

.an-root-head {
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
}

.an-root-anno {
    font-family: var(--vp-font-family-mono);
    font-size: 20px;
    font-weight: 700;
    color: var(--vp-c-brand-1);
    text-decoration: none !important;
}

.an-root-anno:hover {
    text-decoration: underline !important;
}

.an-note {
    font-size: 11px;
    font-weight: 600;
    color: var(--vp-c-brand-1);
    border: 1px solid var(--vp-c-brand-1);
    border-radius: 4px;
    padding: 1px 7px;
}

.an-root-desc {
    font-size: 13.5px;
    color: var(--vp-c-text-2);
}

.an-tree {
    list-style: none;
    margin: 10px 0 0;
    padding-left: 26px;
}

.an-tree .an-tree {
    margin-top: 2px;
}

.an-tree li {
    position: relative;
    padding: 0;
    margin: 0;
}

.an-tree li::before {
    content: '';
    position: absolute;
    left: -16px;
    top: -6px;
    width: 14px;
    height: 24px;
    border-left: 1.5px solid var(--vp-c-divider);
    border-bottom: 1.5px solid var(--vp-c-divider);
    border-bottom-left-radius: 7px;
}

.an-tree li:not(:last-child)::after {
    content: '';
    position: absolute;
    left: -16px;
    top: 18px;
    bottom: -6px;
    width: 1.5px;
    background: var(--vp-c-divider);
}

.an-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 5px 10px;
    margin-left: -10px;
    border-radius: 8px;
    flex-wrap: wrap;
}

.an-row:hover {
    background: var(--vp-c-bg-soft);
}

.an-attr {
    font-family: var(--vp-font-family-mono);
    font-size: 12.5px;
    color: var(--vp-c-text-3);
    background: none;
    padding: 0;
}

.an-anno {
    font-family: var(--vp-font-family-mono);
    font-size: 14px;
    font-weight: 700;
    color: var(--vp-c-brand-1);
    text-decoration: none !important;
    white-space: nowrap;
}

.an-anno:hover {
    text-decoration: underline !important;
}

.an-anno.plain {
    color: var(--vp-c-text-1);
}

.an-desc {
    font-size: 13px;
    color: var(--vp-c-text-2);
}

.an-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin: 2px 0 6px 8px;
}

.an-tag {
    font-family: var(--vp-font-family-mono);
    font-size: 11px;
    color: var(--vp-c-text-2);
    border: 1px solid var(--vp-c-divider);
    border-radius: 99px;
    padding: 2px 10px;
    text-decoration: none !important;
    transition: color .15s, border-color .15s;
}

.an-tag:hover {
    color: var(--vp-c-brand-1);
    border-color: var(--vp-c-brand-1);
}

@media (max-width: 560px) {
    .an-root {
        padding: 14px 14px 10px;
    }

    .an-desc {
        flex-basis: 100%;
        margin-left: 0;
    }
}
</style>
