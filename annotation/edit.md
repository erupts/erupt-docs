# Edit（编辑器注解）

> 占位文档，内容待补充。

`@Edit` 注解配置字段在新增/编辑表单中的行为，包括编辑器类型、是否必填、默认值等。

## 核心属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `title` | String | 字段标签 |
| `type` | EditType | 编辑器类型，默认 `AUTO` |
| `notNull` | boolean | 是否必填 |
| `desc` | String | 字段说明 |
| `readonly` | ReadOnly | 只读配置 |
