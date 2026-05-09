# @Edit

配置字段在新增/编辑表单中的行为，包括组件类型、是否必填、搜索、只读等。

## 属性说明

| 属性名 | 描述 |
|--------|:----:|
| `title` | 表单标签名称 |
| `desc` | 描述说明 |
| `notNull` | 是否必填，默认 `false` |
| `show` | 是否显示，默认 `true` |
| `placeHolder` | 输入框占位提示文字 |
| `type` | 组件类型，默认 `AUTO`，详见下方类型表 |
| `search` | 搜索配置，详见 [@Search](/annotation/search) |
| `readonly` | 只读配置，详见 [@Readonly](/annotation/dynamic) |
| `ifRender` | 动态控制是否渲染（`ExprBool`），可通过接口动态决定 |
| `dynamic` | 根据其他字段值动态控制当前组件状态，详见 [@Dynamic](/annotation/dynamic) |
| `onchange` | 值变更联动（1.13.2+），详见 [OnChange](/advanced/dynamic-form) |
| `orderBy` | 排序规则，HQL order by 语法；仅当字段为关联对象时可用 |
| `filter` | 过滤条件，HQL where 语法；仅当字段为关联对象时可用 |

## 组件类型（EditType）

每种类型的详细配置项与示例见[组件类型文档](/field-types/)。

### 基础组件

| 类型 | 描述 | 搜索 | 高级搜索 |
|------|------|:---:|:---:|
| `AUTO` | 默认，根据字段类型自动推断 | | |
| `INPUT` | 单行文本框 | ✅ | ✅ |
| `NUMBER` | 数值输入框 | ✅ | ✅ |
| `SLIDER` | 数字滑块 | ✅ | ✅ |
| `COLOR` | 颜色选择器 | ❌ | ❌ |
| `RATE` | 评分器 | ✅ | ✅ |
| `DATE` | 日期/时间选择器 | ✅ | ✅ |
| `BOOLEAN` | 开关 | ✅ | ❌ |
| `CHOICE` | 单选框 | ✅ | ✅ |
| `MULTI_CHOICE` | 多选框 | ❌ | ❌ |
| `TAGS` | 标签选择器 | ✅ | ❌ |
| `AUTO_COMPLETE` | 自动完成 | ✅ | ❌ |
| `TEXTAREA` | 多行文本框 | ✅ | ✅ |
| `HTML_EDITOR` | 富文本编辑器 | ✅ | ✅ |
| `CODE_EDITOR` | 代码编辑器 | ✅ | ✅ |
| `MARKDOWN` | Markdown 编辑器 | ❌ | ❌ |
| `ATTACHMENT` | 文件/图片上传 | ❌ | ❌ |
| `MAP` | 地图 | ❌ | ❌ |
| `SIGNATURE` | 手写签名 | ❌ | ❌ |
| `DIVIDE` | 分割线 | ❌ | ❌ |
| `TPL` | 自定义 HTML 模板 | ❌ | ❌ |
| `HIDDEN` | 隐藏字段 | ❌ | ❌ |
| `EMPTY` | 空占位（仍占据表单位置） | ❌ | ❌ |

### 关联组件

> 需配合 JPA 关系注解使用

| 类型 | 描述 | 搜索 |
|------|------|:---:|
| `COMBINE` | 一对一内嵌 | ❌ |
| `REFERENCE_TREE` | 多对一树引用 | ✅ |
| `REFERENCE_TABLE` | 多对一表引用 | ✅ |
| `CHECKBOX` | 多对多复选框 | ❌ |
| `TAB_TREE` | 多对多树引用 | ❌ |
| `TAB_TABLE_REFER` | 多对多表引用 | ❌ |
| `TAB_TABLE_ADD` | 一对多新增 | ❌ |
