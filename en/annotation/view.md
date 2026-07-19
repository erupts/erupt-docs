<script setup>
const viewTypes = [
    {
        group: 'Text & Number',
        items: [
            {type: 'AUTO', glyph: '✨', desc: 'Automatically inferred from the @Edit type or field type'},
            {type: 'TEXT', glyph: 'Aa', desc: 'Plain text'},
            {type: 'SAFE_TEXT', glyph: '🛡️', ver: '1.12.11+', desc: 'Text containing scripts or tags is not rendered, preventing XSS'},
            {type: 'NUMBER', glyph: '42', desc: 'Numeric display'},
            {type: 'BOOLEAN', glyph: '✓', desc: 'Boolean value display'},
            {type: 'PASSWORD', glyph: '••••', ver: '2.0.4+', desc: 'Password mask; the actual value is replaced with a placeholder and never sent to the client'},
            {type: 'DATE', glyph: '📅', desc: 'Date formatted display'},
            {type: 'DATE_TIME', glyph: '🕐', desc: 'Date-time formatted display'},
            {type: 'PROGRESS', bar: true, ver: '2.0.4+', desc: 'Progress bar; when the edit type is SLIDER the max value comes from SliderType.max, otherwise 100'},
        ],
    },
    {
        group: 'Image & Media',
        items: [
            {type: 'IMAGE', glyph: '🖼️', desc: 'Image'},
            {type: 'IMAGE_BASE64', glyph: '🖼️', desc: 'Base64-encoded image'},
            {type: 'QR_CODE', glyph: '▦', desc: 'QR code'},
            {type: 'MAP', glyph: '📍', desc: 'Map display'},
            {type: 'SWF', glyph: '⚡', desc: 'Flash animation'},
        ],
    },
    {
        group: 'Link & Attachment',
        items: [
            {type: 'LINK', glyph: '🔗', desc: 'Opens a link in a new window'},
            {type: 'LINK_DIALOG', glyph: '🔗', desc: 'Opens a link in a dialog'},
            {type: 'DOWNLOAD', glyph: '⬇️', desc: 'Direct download'},
            {type: 'ATTACHMENT', glyph: '📎', desc: 'Opens an attachment in a new window'},
            {type: 'ATTACHMENT_DIALOG', glyph: '📎', desc: 'Opens an attachment in a dialog'},
        ],
    },
    {
        group: 'Rich Content',
        items: [
            {type: 'HTML', glyph: '</>', desc: 'Renders an HTML fragment'},
            {type: 'MOBILE_HTML', glyph: '📱', desc: 'Renders HTML at mobile screen dimensions'},
            {type: 'CODE', glyph: '{ }', desc: 'Syntax-highlighted code display'},
            {type: 'MARKDOWN', glyph: 'M↓', desc: 'Rendered Markdown display'},
            {type: 'TAB_VIEW', glyph: '▤', desc: 'One-to-many / many-to-many sub-table display'},
        ],
    },
]
</script>

# @View

Configures how a field is displayed as a column in the list table, including the column title, width, display type, sorting, and more.

## Attributes

| Attribute | Description |
|-----------|-------------|
| `title` | Column header title |
| `desc` | Column description |
| `type` | Data display type, defaults to `AUTO`, see the type table below |
| `show` | Whether to display the column, defaults to `true` |
| `sortable` | Whether clicking the column header sorts the table, defaults to `false` |
| `export` | Whether to include in Excel exports, defaults to `true` |
| `width` | Column width with unit, e.g. `200px`, `20%` |
| `column` | When the field is an object type, specifies the property name to display (commonly used with `@ManyToOne`) |
| `className` | CSS class name applied to the column |
| `tpl` | Opens a custom template in a popup; the `row` variable is available inside the template to access current row data |
| `ifRender` | Dynamically controls whether the column is rendered (`ExprBool`), see [ifRender Dynamic Rendering](/en/annotation/if-render) |
| `template` | Column value formatting template (a JS expression evaluated by `eval` on the frontend); available variables: `value` (current cell value), `item` (full row data), `item.xxx` (specific column value) |

## Display Types (ViewType)

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
