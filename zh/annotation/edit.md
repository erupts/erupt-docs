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
| `search` | 搜索配置，详见 [@Search](/zh/annotation/search) |
| `readonly` | 只读配置，详见 [@Readonly](/zh/annotation/dynamic) |
| `ifRender` | 动态控制是否渲染（`ExprBool`），详见 [ifRender 动态渲染](/zh/annotation/if-render) |
| `dynamic` | 根据其他字段值动态控制当前组件状态，详见 [@Dynamic](/zh/annotation/dynamic) |
| `onchange` | 值变更联动（1.13.2+），详见 [OnChange](/zh/annotation/on-change) |
| `orderBy` | 排序规则，HQL order by 语法；仅当字段为关联对象时可用 |
| `filter` | 过滤条件，HQL where 语法；仅当字段为关联对象时可用 |
| `prompt` | AI 智能体提示词，供 erupt-ai 工具调用时注入字段级上下文，2.0.0 新增 |

## 组件类型（EditType）

`type` 支持 30+ 种组件类型，每种类型的详细配置项与示例见[字段类型总览](/zh/field-types/)。
