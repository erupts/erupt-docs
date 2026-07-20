---
aside: false
---

<script setup>
const trees = [
    {
        anno: '@EruptScan',
        link: '/en/annotation/erupt-scan',
        desc: 'Placed on the boot class to declare package paths to scan for Erupt entities',
        note: 'Entry',
        children: [],
    },
    {
        anno: '@Erupt',
        link: '/en/annotation/erupt',
        desc: 'Class-level annotation defining entity behavior and page capabilities',
        note: 'Class',
        children: [
            {attr: 'power', anno: '@Power', desc: 'Permission control for CRUD actions', link: '/en/annotation/power'},
            {attr: 'rowOperation', anno: '@RowOperation', desc: 'Custom row-action buttons', link: '/en/annotation/row-operation'},
            {attr: 'drills', anno: '@Drill', desc: 'Data drilldown, one-to-many without foreign keys', link: '/en/annotation/drill'},
            {attr: 'filter', anno: '@Filter', desc: 'Conditional data filters', link: '/en/annotation/filter'},
            {attr: 'orderBy', anno: '@OrderBy', desc: 'Sort rules', link: '/en/annotation/order-by'},
            {attr: 'tree', anno: '@Tree', desc: 'Tree-based data display', link: '/en/annotation/tree'},
            {attr: 'linkTree', anno: '@LinkTree', desc: 'Tree-on-the-left, table-on-the-right layout', link: '/en/annotation/link-tree'},
            {attr: 'layout', anno: '@Layout', desc: 'Page layout and pagination', link: '/en/annotation/layout'},
            {
                attr: 'vis', anno: '@Vis', desc: 'Multi-view switching', link: '/en/annotation/vis',
                tags: [
                    {t: 'CARD', l: '/en/annotation/vis-card'},
                    {t: 'GANTT', l: '/en/annotation/vis-gantt'},
                    {t: 'BOARD', l: '/en/annotation/vis-board'},
                    {t: 'CALENDAR', l: '/en/annotation/vis-calendar'},
                ],
            },
        ],
    },
    {
        anno: '@EruptField',
        link: '/en/annotation/erupt-field',
        desc: 'Field-level annotation declaring how a field is displayed and edited',
        note: 'Field',
        children: [
            {attr: 'views', anno: '@View', desc: 'Table-column display configuration', link: '/en/annotation/view'},
            {
                attr: 'edit', anno: '@Edit', desc: 'Edit-form configuration', link: '/en/annotation/edit',
                children: [
                    {attr: 'type', anno: 'EditType', plain: true, desc: '30+ field components, see Field Types overview', link: '/en/field-types/'},
                    {attr: 'search', anno: '@Search', desc: 'Search bar configuration', link: '/en/annotation/search'},
                    {attr: 'onchange', anno: 'OnChange', plain: true, desc: 'Data-change linkage, update other fields in real time', link: '/en/annotation/on-change'},
                    {attr: 'dynamic', anno: '@Dynamic', desc: 'Dynamic component control', link: '/en/annotation/dynamic'},
                ],
            },
        ],
    },
]
</script>

# Annotations Overview

Erupt's annotation system is organized along two main lines: **class-level** and **field-level**. `@Erupt` defines the entity's overall behavior, while `@EruptField` declares how each field is displayed and edited. Feature annotations attach to them as attributes, forming the hierarchy below.

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

## Recommendations

1. Start with the basics — understand `@Erupt` first, then move on to feature annotations.
2. Permissions first — configure `@Power` to keep your data safe.
3. Polish your layout with `@Layout` for a better UX.
4. Master `@Drill` and `@LinkTree` to model complex data relationships.
5. Combine `@View` and `@Edit` for fine-grained control over display and editing.
6. Use `@Dynamic` to build conditional, interactive forms.

<style scoped>
.an-root {
    margin: 28px 0;
    border: 2px solid #14120B;
    padding: 18px 22px 14px;
    background: #FFFFFF;
    box-shadow: 5px 5px 0 #14120B;
}

.dark .an-root {
    border-color: #F0E8D6;
    background: #201C12;
    box-shadow: 5px 5px 0 #F0E8D6;
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
    font-weight: 800;
    color: #14120B;
    text-decoration: none !important;
}

.dark .an-root-anno {
    color: #F0E8D6;
}

.an-root-anno:hover {
    background: #4FC8EC;
    color: #14120B;
}

.an-note {
    font-family: var(--vp-font-family-mono);
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: .06em;
    color: #14120B;
    background: #4FC8EC;
    border: 1.5px solid #14120B;
    padding: 1px 8px;
}

.an-root-desc {
    font-size: 13.5px;
    color: #5C5647;
}

.dark .an-root-desc {
    color: #B0A78F;
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
    border-left: 1.5px solid rgba(20, 18, 11, .3);
    border-bottom: 1.5px solid rgba(20, 18, 11, .3);
}

.an-tree li:not(:last-child)::after {
    content: '';
    position: absolute;
    left: -16px;
    top: 18px;
    bottom: -6px;
    width: 1.5px;
    background: rgba(20, 18, 11, .3);
}

.dark .an-tree li::before {
    border-color: rgba(240, 232, 214, .3);
}

.dark .an-tree li:not(:last-child)::after {
    background: rgba(240, 232, 214, .3);
}

.an-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 5px 10px;
    margin-left: -10px;
    flex-wrap: wrap;
}

.an-row:hover {
    background: rgba(79, 200, 236, .15);
}

.an-attr {
    font-family: var(--vp-font-family-mono);
    font-size: 12.5px;
    color: rgba(20, 18, 11, .5);
    background: none;
    padding: 0;
}

.dark .an-attr {
    color: rgba(240, 232, 214, .5);
}

.an-anno {
    font-family: var(--vp-font-family-mono);
    font-size: 14px;
    font-weight: 800;
    color: #14120B;
    text-decoration: none !important;
    white-space: nowrap;
    border-bottom: 2px solid #4FC8EC;
}

.dark .an-anno {
    color: #F0E8D6;
}

.an-anno:hover {
    background: #4FC8EC;
    color: #14120B;
}

.an-anno.plain {
    border-bottom-color: #BCA0F2;
}

.an-anno.plain:hover {
    background: #BCA0F2;
}

.an-desc {
    font-size: 13px;
    color: #5C5647;
}

.dark .an-desc {
    color: #B0A78F;
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
    font-weight: 700;
    color: #14120B;
    border: 1.5px solid #14120B;
    padding: 2px 10px;
    text-decoration: none !important;
    transition: background .15s;
}

.dark .an-tag {
    color: #F0E8D6;
    border-color: #F0E8D6;
}

.an-tag:hover {
    background: #4FC8EC;
    color: #14120B;
    border-color: #14120B;
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
