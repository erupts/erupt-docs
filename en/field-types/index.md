# Field Types Overview

Erupt ships with a rich set of field types, selected via `@Edit(type = EditType.XXX)`.

## Basic Components

| Type | Description | Docs |
|------|------|------|
| `AUTO` | Default. Inferred from the field's Java type | [Details](/en/field-types/auto) |
| `INPUT` | Single-line text input | [Details](/en/field-types/input) |
| `TEXTAREA` | Multi-line text input | [Details](/en/field-types/textarea) |
| `NUMBER` | Numeric input | [Details](/en/field-types/number) |
| `SLIDER` | Slider input | [Details](/en/field-types/slider) |
| `DATE` | Date/time picker | [Details](/en/field-types/date) |
| `BOOLEAN` | Boolean switch | [Details](/en/field-types/boolean) |
| `MAP` | Geolocation picker | [Details](/en/field-types/map) |
| `COLOR` | Color picker | [Details](/en/field-types/color) |
| `RATE` | Rating | [Details](/en/field-types/rate) |

## Selection Components

| Type | Description | Docs |
|------|------|------|
| `CHOICE` | Single-select | [Details](/en/field-types/choice) |
| `MULTI_CHOICE` | Multi-select | [Details](/en/field-types/multi-choice) |
| `TAGS` | Tag picker | [Details](/en/field-types/tags) |
| `AUTO_COMPLETE` | Autocomplete | [Details](/en/field-types/auto-complete) |

## Media & Editors

| Type | Description | Docs |
|------|------|------|
| `ATTACHMENT` | Attachment / image upload | [Details](/en/field-types/attachment) |
| `HTML_EDITOR` | Rich-text editor | [Details](/en/field-types/html-editor) |
| `CODE_EDITOR` | Code editor | [Details](/en/field-types/code-editor) |
| `MARKDOWN` | Markdown editor | [Details](/en/field-types/markdown) |
| `SIGNATURE` | Signature pad | [Details](/en/field-types/signature) |

## Relation Components

> These components are more involved. Make sure you understand JPA's one-to-one / one-to-many / many-to-many relationships before using them.

| Type | Relation | Description | Docs |
|------|------|------|------|
| `REFERENCE_TABLE` | many-to-one | Table dialog selector | [Details](/en/field-types/reference-table) |
| `REFERENCE_TREE` | many-to-one | Tree dialog selector | [Details](/en/field-types/reference-tree) |
| `CHECKBOX` | many-to-many | Checkboxes | [Details](/en/field-types/checkbox) |
| `TAB_TREE` | many-to-many | Tree selector | [Details](/en/field-types/tab-tree) |
| `TAB_TABLE_REFER` | many-to-many | Table selector | [Details](/en/field-types/tab-table-refer) |
| `TAB_TABLE_ADD` | one-to-many | Nested inline add | [Details](/en/field-types/tab-table-add) |
| `COMBINE` | one-to-one | Nested inline add (JSON-backed) | [Details](/en/field-types/combine) |

## Others

| Type | Description | Docs |
|------|------|------|
| `DIVIDE` | Horizontal divider | [Details](/en/field-types/divide) |
| `TPL` | Custom HTML template | [Details](/en/field-types/tpl) |
| `HIDDEN` | Hidden field | [Details](/en/field-types/hidden) |
| `EMPTY` | Empty placeholder | [Details](/en/field-types/empty) |
