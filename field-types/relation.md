# 关联组件概览

Erupt 提供了多种关联组件，对应 JPA 中的不同关系类型。

> 如下组件使用较为复杂，建议了解 JPA 后，懂一对一、一对多、多对多关系后使用

## 关联类型对照

| 组件类型 | JPA 关系 | 适用场景 | 详细文档 |
|---------|---------|---------|---------|
| `REFERENCE_TABLE` | `@ManyToOne` | 多对一，通过表格弹窗选择 | [详情](/field-types/reference-table) |
| `REFERENCE_TREE` | `@ManyToOne` | 多对一，通过树形弹窗选择 | [详情](/field-types/reference-tree) |
| `CHECKBOX` | `@ManyToMany` | 多对多，复选框形式 | [详情](/field-types/checkbox) |
| `TAB_TREE` | `@ManyToMany` | 多对多，树形选择 | [详情](/field-types/tab-tree) |
| `TAB_TABLE_REFER` | `@ManyToMany` | 多对多，表格选择 | [详情](/field-types/tab-table-refer) |
| `TAB_TABLE_ADD` | `@OneToMany` | 一对多，嵌套新增子记录 | [详情](/field-types/tab-table-add) |
| `COMBINE` | `@OneToOne` | 一对一，嵌套新增，支持 JSON 存储 | [详情](/field-types/combine) |

## 选择原则

- **多对一**：使用 `REFERENCE_TABLE`（列表型数据）或 `REFERENCE_TREE`（树形结构数据）
- **多对多**：使用 `CHECKBOX`（选项少）、`TAB_TREE`（树形）或 `TAB_TABLE_REFER`（列表型）
- **一对多**：使用 `TAB_TABLE_ADD`，可以在主表编辑界面直接管理子表数据
- **一对一**：使用 `COMBINE`，支持将关联对象以 JSON 格式存储在同一列中
