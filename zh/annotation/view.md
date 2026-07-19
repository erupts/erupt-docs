<script setup>
const viewTypes = [
    {
        group: '文本与数值',
        items: [
            {type: 'AUTO', glyph: '✨', desc: '根据 @Edit 类型或字段类型自动识别'},
            {type: 'TEXT', glyph: 'Aa', desc: '普通文本'},
            {type: 'SAFE_TEXT', glyph: '🛡️', ver: '1.12.11+', desc: '文本中含脚本/标签时不渲染，防 XSS'},
            {type: 'NUMBER', glyph: '42', desc: '数值展示'},
            {type: 'BOOLEAN', glyph: '✓', desc: '布尔值展示'},
            {type: 'PASSWORD', glyph: '••••', ver: '2.0.4+', desc: '密码掩码展示，实际值以占位符替代，不会下发到客户端'},
            {type: 'DATE', glyph: '📅', desc: '日期格式化展示'},
            {type: 'DATE_TIME', glyph: '🕐', desc: '日期时间格式化展示'},
            {type: 'PROGRESS', bar: true, ver: '2.0.4+', desc: '进度条展示；编辑类型为 SLIDER 时最大值取 SliderType.max，否则为 100'},
        ],
    },
    {
        group: '图像与媒体',
        items: [
            {type: 'IMAGE', glyph: '🖼️', desc: '图片'},
            {type: 'IMAGE_BASE64', glyph: '🖼️', desc: 'Base64 编码图片'},
            {type: 'QR_CODE', glyph: '▦', desc: '二维码'},
            {type: 'MAP', glyph: '📍', desc: '地图展示'},
            {type: 'SWF', glyph: '⚡', desc: 'Flash 动画'},
        ],
    },
    {
        group: '链接与附件',
        items: [
            {type: 'LINK', glyph: '🔗', desc: '新窗口打开链接'},
            {type: 'LINK_DIALOG', glyph: '🔗', desc: '对话框打开链接'},
            {type: 'DOWNLOAD', glyph: '⬇️', desc: '直接下载'},
            {type: 'ATTACHMENT', glyph: '📎', desc: '新窗口打开附件'},
            {type: 'ATTACHMENT_DIALOG', glyph: '📎', desc: '对话框打开附件'},
        ],
    },
    {
        group: '富内容渲染',
        items: [
            {type: 'HTML', glyph: '</>', desc: '渲染 HTML 片段'},
            {type: 'MOBILE_HTML', glyph: '📱', desc: '以手机屏幕尺寸渲染 HTML'},
            {type: 'CODE', glyph: '{ }', desc: '代码高亮展示'},
            {type: 'MARKDOWN', glyph: 'M↓', desc: 'Markdown 渲染展示'},
            {type: 'TAB_VIEW', glyph: '▤', desc: '一对多/多对多子表格展示'},
        ],
    },
]
</script>

# @View

配置字段在列表表格中的列展示行为，包括列名、宽度、展示类型、排序等。

## 属性说明

| 属性名 | 描述 |
|--------|------|
| `title` | 表格列名称 |
| `desc` | 列描述 |
| `type` | 数据展示类型，默认 `AUTO`，详见下方类型表 |
| `show` | 是否显示，默认 `true` |
| `sortable` | 是否支持点击列头排序，默认 `false` |
| `export` | 是否包含在 Excel 导出中，默认 `true` |
| `width` | 列宽度，需带单位，如 `200px`、`20%` |
| `column` | 字段为对象类型时，指定要展示的属性名（`@ManyToOne` 场景常用） |
| `className` | 表格列的 CSS 类名 |
| `tpl` | 弹出自定义模板，模板中可用 `row` 变量获取当前行数据 |
| `ifRender` | 动态控制列是否渲染（`ExprBool`），详见 [ifRender 动态渲染](/zh/annotation/if-render) |
| `template` | 列值格式化模板（前端 `eval` 执行的 JS 表达式），可用变量：`value`（当前值）、`item`（整行数据）、`item.xxx`（某列值） |

## 展示类型（ViewType）

<template v-for="g in viewTypes" :key="g.group">
    <h4 class="vt-group">{{ g.group }}<span class="vt-count">{{ g.items.length }}</span></h4>
    <div class="vt-grid">
        <div v-for="t in g.items" :key="t.type" class="vt-card">
            <span class="vt-glyph">
                <span v-if="t.bar" class="vt-bar"><i></i></span>
                <template v-else>{{ t.glyph }}</template>
            </span>
            <span class="vt-body">
                <span class="vt-head"><code>{{ t.type }}</code><em v-if="t.ver" class="vt-ver">{{ t.ver }}</em></span>
                <span class="vt-desc">{{ t.desc }}</span>
            </span>
        </div>
    </div>
</template>

<style scoped>
.vt-group {
    margin: 24px 0 0;
    font-size: 15px;
    font-weight: 600;
}

.vt-count {
    margin-left: 8px;
    font-size: 12px;
    font-weight: 400;
    color: var(--vp-c-text-3);
    background: var(--vp-c-bg-soft);
    border-radius: 10px;
    padding: 2px 8px;
    vertical-align: 1px;
}

.vt-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin: 12px 0 4px;
}

@media (max-width: 640px) {
    .vt-grid {
        grid-template-columns: 1fr;
    }
}

.vt-card {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    padding: 12px 14px;
    background: var(--vp-c-bg);
}

.vt-glyph {
    flex: none;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: var(--vp-c-bg-soft);
    font-family: var(--vp-font-family-mono);
    font-size: 14px;
    color: var(--vp-c-text-2);
}

.vt-bar {
    width: 26px;
    height: 6px;
    border-radius: 3px;
    background: var(--vp-c-divider);
    overflow: hidden;
}

.vt-bar i {
    display: block;
    width: 65%;
    height: 100%;
    border-radius: 3px;
    background: var(--vp-c-brand-1);
}

.vt-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.vt-head {
    display: flex;
    align-items: center;
    gap: 8px;
}

.vt-head code {
    font-size: 13px;
    font-weight: 600;
}

.vt-ver {
    font-style: normal;
    font-size: 11px;
    color: var(--vp-c-brand-1);
    background: var(--vp-c-brand-soft);
    border-radius: 8px;
    padding: 1px 7px;
}

.vt-desc {
    font-size: 13px;
    line-height: 1.5;
    color: var(--vp-c-text-2);
}
</style>
