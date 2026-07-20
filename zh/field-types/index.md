---
aside: false
---

<script setup>
import { ref, computed } from 'vue'

const search = ref('')

const groups = [
    {
        title: '基础组件',
        items: [
            {name: 'AUTO', desc: '根据字段类型自动推断', link: '/zh/field-types/auto', img: '/field-types/auto.svg'},
            {name: 'INPUT', desc: '单行文本输入框', link: '/zh/field-types/input', img: '/field-types/input.svg'},
            {name: 'PASSWORD', desc: '密码输入框', link: '/zh/field-types/password', img: '/field-types/password.svg'},
            {name: 'TEXTAREA', desc: '多行文本输入框', link: '/zh/field-types/textarea', img: '/field-types/textarea.svg'},
            {name: 'NUMBER', desc: '数值输入框', link: '/zh/field-types/number', img: '/field-types/number.svg'},
            {name: 'SLIDER', desc: '滑动输入条', link: '/zh/field-types/slider', img: '/field-types/slider.svg'},
            {name: 'DATE', desc: '日期时间选择器', link: '/zh/field-types/date', img: '/field-types/date.svg'},
            {name: 'BOOLEAN', desc: '布尔开关', link: '/zh/field-types/boolean', img: '/field-types/boolean.svg'},
            {name: 'MAP', desc: '地理位置选择', link: '/zh/field-types/map', img: '/field-types/map.svg'},
            {name: 'COLOR', desc: '颜色选择器', link: '/zh/field-types/color', img: '/field-types/color.svg'},
            {name: 'RATE', desc: '评分器', link: '/zh/field-types/rate', img: '/field-types/rate.svg'},
        ],
    },
    {
        title: '选择类组件',
        items: [
            {name: 'CHOICE', desc: '单选', link: '/zh/field-types/choice', img: '/field-types/choice.svg'},
            {name: 'MULTI_CHOICE', desc: '多选', link: '/zh/field-types/multi-choice', img: '/field-types/multi-choice.svg'},
            {name: 'TAGS', desc: '标签选择器', link: '/zh/field-types/tags', img: '/field-types/tags.svg'},
            {name: 'AUTO_COMPLETE', desc: '自动完成', link: '/zh/field-types/auto-complete', img: '/field-types/auto-complete.svg'},
        ],
    },
    {
        title: '媒体与编辑器',
        items: [
            {name: 'ATTACHMENT', desc: '附件、图片上传', link: '/zh/field-types/attachment', img: '/field-types/attachment.svg'},
            {name: 'HTML_EDITOR', desc: '富文本编辑器', link: '/zh/field-types/html-editor', img: '/field-types/html-editor.svg'},
            {name: 'CODE_EDITOR', desc: '代码编辑器', link: '/zh/field-types/code-editor', img: '/field-types/code-editor.svg'},
            {name: 'MARKDOWN', desc: 'Markdown 编辑器', link: '/zh/field-types/markdown', img: '/field-types/markdown.svg'},
            {name: 'SIGNATURE', desc: '签名板', link: '/zh/field-types/signature', img: '/field-types/signature.svg'},
        ],
    },
    {
        title: '关联组件',
        note: '如下组件使用较为复杂，建议了解 JPA、懂一对一、一对多、多对多关系后使用，详见',
        noteLink: '/zh/field-types/relation',
        noteLinkText: '关联组件概览',
        items: [
            {name: 'REFERENCE_TABLE', desc: '表格弹窗选择 · 多对一', link: '/zh/field-types/reference-table', img: '/field-types/reference-table.svg'},
            {name: 'REFERENCE_TREE', desc: '树形弹窗选择 · 多对一', link: '/zh/field-types/reference-tree', img: '/field-types/reference-tree.svg'},
            {name: 'CHECKBOX', desc: '复选框 · 多对多', link: '/zh/field-types/checkbox', img: '/field-types/checkbox.svg'},
            {name: 'TAB_TREE', desc: '树形选择 · 多对多', link: '/zh/field-types/tab-tree', img: '/field-types/tab-tree.svg'},
            {name: 'TAB_TABLE_REFER', desc: '表格选择 · 多对多', link: '/zh/field-types/tab-table-refer', img: '/field-types/tab-table-refer.svg'},
            {name: 'TAB_TABLE_ADD', desc: '嵌套新增子记录 · 一对多', link: '/zh/field-types/tab-table-add', img: '/field-types/tab-table-add.svg'},
            {name: 'COMBINE', desc: '嵌套新增，支持 JSON 存储 · 一对一', link: '/zh/field-types/combine', img: '/field-types/combine.svg'},
        ],
    },
    {
        title: '其他组件',
        items: [
            {name: 'GROUP', desc: '字段分组', link: '/zh/field-types/group', img: '/field-types/group.svg'},
            {name: 'DIVIDE', desc: '横向分割线', link: '/zh/field-types/divide', img: '/field-types/divide.svg'},
            {name: 'CALLOUT', desc: '提示信息块', link: '/zh/field-types/callout', img: '/field-types/callout.svg'},
            {name: 'BUTTON', desc: '操作按钮', link: '/zh/field-types/button', img: '/field-types/button.svg'},
            {name: 'TPL', desc: '自定义 HTML 模板', link: '/zh/field-types/tpl', img: '/field-types/tpl.svg'},
            {name: 'HIDDEN', desc: '隐藏字段', link: '/zh/field-types/hidden', img: '/field-types/hidden.svg'},
            {name: 'EMPTY', desc: '空占位', link: '/zh/field-types/empty', img: '/field-types/empty.svg'},
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

# 字段类型总览

Erupt 提供了 30+ 种字段组件，通过 `@Edit(type = EditType.XXX)` 指定，覆盖文本、数值、日期、媒体、关联关系等常见场景。

<div class="ft-search">
    <svg class="ft-search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    <input v-model="search" placeholder="搜索组件，如 INPUT、日期、多对多..." />
</div>

<template v-for="g in filtered" :key="g.title">
    <h2 class="ft-group-title">{{ g.title }}<span class="ft-count">{{ g.items.length }}</span></h2>
    <p v-if="g.note" class="ft-note">{{ g.note }} <a :href="g.noteLink">{{ g.noteLinkText }}</a></p>
    <div class="ft-grid">
        <a v-for="item in g.items" :key="item.name" class="ft-card" :href="item.link">
            <div class="ft-card-head">
                <span class="ft-name">{{ item.name }}</span>
                <span class="ft-desc">{{ item.desc }}</span>
            </div>
            <div class="ft-card-img">
                <img v-if="item.img" :src="item.img" :alt="item.name" loading="lazy" />
                <span v-else class="ft-placeholder">{{ item.name }}</span>
            </div>
        </a>
    </div>
</template>

<p v-if="filtered.length === 0" class="ft-empty">未找到匹配的组件</p>

<style scoped>
.ft-search {
    position: relative;
    margin: 24px 0 8px;
}

.ft-search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(20, 18, 11, .45);
    pointer-events: none;
}

.dark .ft-search-icon {
    color: rgba(240, 232, 214, .45);
}

.ft-search input {
    width: 100%;
    padding: 10px 16px 10px 40px;
    border: 2px solid #14120B;
    border-radius: 0;
    background: #FFFFFF;
    color: #14120B;
    font-size: 14px;
    outline: none;
    transition: box-shadow .15s;
}

.dark .ft-search input {
    border-color: #F0E8D6;
    background: #201C12;
    color: #F0E8D6;
}

.ft-search input:focus {
    box-shadow: 3px 3px 0 #4FC8EC;
}

.ft-group-title {
    margin: 32px 0 4px;
    padding-top: 16px;
    border-top: none;
    font-size: 18px;
    font-weight: 800;
}

.ft-count {
    font-family: var(--vp-font-family-mono);
    margin-left: 8px;
    font-size: 11px;
    font-weight: 800;
    color: #14120B;
    background: #4FC8EC;
    border: 1.5px solid #14120B;
    border-radius: 0;
    padding: 1px 8px;
    vertical-align: 2px;
}

.ft-note {
    font-size: 13px;
    color: #5C5647;
    margin: 4px 0 0;
}

.dark .ft-note {
    color: #B0A78F;
}

.ft-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
    margin: 16px 0 8px;
}

@media (max-width: 960px) {
    .ft-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 560px) {
    .ft-grid {
        grid-template-columns: 1fr;
    }
}

.ft-card {
    display: block;
    border: 2px solid #14120B;
    border-radius: 0;
    overflow: hidden;
    text-decoration: none !important;
    color: inherit !important;
    background: #FFFFFF;
    transition: box-shadow .15s, transform .15s;
}

.dark .ft-card {
    border-color: #F0E8D6;
    background: #201C12;
}

.ft-card:hover {
    transform: translate(-2px, -2px);
    box-shadow: 5px 5px 0 #14120B;
}

.dark .ft-card:hover {
    box-shadow: 5px 5px 0 #F0E8D6;
}

.ft-card-head {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 10px 14px;
    border-bottom: 2px solid #14120B;
}

.dark .ft-card-head {
    border-bottom-color: #F0E8D6;
}

.ft-name {
    font-family: var(--vp-font-family-mono);
    font-size: 13px;
    font-weight: 800;
    color: #14120B;
    white-space: nowrap;
}

.dark .ft-name {
    color: #F0E8D6;
}

.ft-desc {
    font-size: 12px;
    color: #5C5647;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dark .ft-desc {
    color: #B0A78F;
}

.ft-card-img {
    height: 168px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    background-color: #F0F9FC;
    background-image: radial-gradient(rgba(20, 18, 11, .10) 1px, transparent 1px);
    background-size: 14px 14px;
}

.dark .ft-card-img {
    background-color: #1A170F;
    background-image: radial-gradient(rgba(79, 200, 236, .13) 1px, transparent 1px);
}

.ft-card-img img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    filter: drop-shadow(2px 2px 0 rgba(20, 18, 11, .10));
}

.ft-placeholder {
    font-family: var(--vp-font-family-mono);
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 1px;
    color: rgba(20, 18, 11, .35);
}

.dark .ft-placeholder {
    color: rgba(240, 232, 214, .35);
}

.ft-empty {
    margin: 48px 0;
    text-align: center;
    color: #5C5647;
}

.dark .ft-empty {
    color: #B0A78F;
}
</style>
