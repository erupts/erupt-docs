# 字段类型总览

Erupt 提供了丰富的字段类型，通过 `@Edit(type = EditType.XXX)` 来指定。

## 基础组件

| 类型 | 描述 | 文档 |
|------|------|------|
| `AUTO` | 默认类型，根据字段类型自动推断 | [详情](/field-types/auto) |
| `INPUT` | 文本输入框 | [详情](/field-types/input) |
| `TEXTAREA` | 多行文本输入框 | [详情](/field-types/input) |
| `DIVIDE` | 横向分割线 | [详情](/field-types/input) |
| `NUMBER` | 数值输入框 | [详情](/field-types/number) |
| `SLIDER` | 滑动输入条 | [详情](/field-types/number) |
| `DATE` | 时间选择器 | [详情](/field-types/date) |
| `BOOLEAN` | 开关 | [详情](/field-types/boolean) |
| `CHOICE` | 单选框 | [详情](/field-types/select) |
| `MULTI_CHOICE` | 多选框 | [详情](/field-types/select) |
| `TAGS` | 标签选择器 | [详情](/field-types/select) |
| `AUTO_COMPLETE` | 自动完成 | [详情](/field-types/select) |

## 媒体与编辑器组件

| 类型 | 描述 | 文档 |
|------|------|------|
| `ATTACHMENT` | 附件、图片上传 | [详情](/field-types/media) |
| `HTML_EDITOR` | 富文本编辑器 | [详情](/field-types/media) |
| `CODE_EDITOR` | 代码编辑器 | [详情](/field-types/media) |
| `Markdown` | Markdown 编辑器 | [详情](/field-types/media) |
| `SIGNATURE` | 签名板 | [详情](/field-types/media) |

## 可视化组件

| 类型 | 描述 | 文档 |
|------|------|------|
| `MAP` | 地理位置选择 | [详情](/field-types/visual) |
| `COLOR` | 颜色选择 | [详情](/field-types/visual) |
| `RATE` | 评分器 | [详情](/field-types/visual) |

## 关联组件

> 如下组件使用较为复杂，建议了解 JPA 后，懂一对一、一对多、多对多关系后使用

| 类型 | 关系 | 描述 | 文档 |
|------|------|------|------|
| `REFERENCE_TABLE` | 多对一 | 表格引用 | [详情](/field-types/reference-table) |
| `REFERENCE_TREE` | 多对一 | 树引用 | [详情](/field-types/reference-tree) |
| `CHECKBOX` | 多对多 | 复选框 | [详情](/field-types/checkbox) |
| `TAB_TREE` | 多对多 | 多选树 | [详情](/field-types/tab-tree) |
| `TAB_TABLE_REFER` | 多对多 | 多选表格 | [详情](/field-types/tab-table-refer) |
| `TAB_TABLE_ADD` | 一对多 | 一对多新增 | [详情](/field-types/tab-table-add) |
| `COMBINE` | 一对一 | 一对一新增 | [详情](/field-types/combine) |

## 其他组件

| 类型 | 描述 | 文档 |
|------|------|------|
| `TPL` | 自定义 HTML 模板 | [详情](/field-types/other) |
| `HIDDEN` | 隐藏字段 | [详情](/field-types/other) |
| `EMPTY` | 空占位 | [详情](/field-types/other) |
