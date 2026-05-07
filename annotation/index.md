# 核心注解概览

Erupt 的核心注解文档索引，包含所有核心功能的详细说明。

## 核心类注解

| 注解名称 | 文档链接 | 功能描述 |
|---------|----------|----------|
| `@Erupt` | [@Erupt](/annotation/erupt) | 核心注解，定义实体类的基本行为 |
| `@OrderBy` | [排序 @OrderBy](/annotation/order-by) | 数据排序规则配置 |
| `@Layout` | [布局 @Layout](/annotation/layout) | 页面布局和分页配置 |
| `@Power` | [权限控制 @Power](/annotation/power) | 增删改查等操作权限控制 |
| `@RowOperation` | [定义按钮 @RowOperation](/annotation/row-operation) | 自定义行操作按钮 |
| `@Filter` | [数据过滤 @Filter](/annotation/filter) | 数据展示过滤条件 |
| `@Tree` | [树形展示 @Tree](/annotation/tree) | 树形数据展示 |
| `@LinkTree` | [左树右表 @LinkTree](/annotation/link-tree) | 左树右表布局 |
| `@Drill` | [数据钻取 @Drill](/annotation/drill) | 数据钻取（无需外键的一对多关联） |

## 字段注解

| 注解名称 | 文档链接 | 功能描述 |
|---------|----------|----------|
| `@View` | [@EruptField](/annotation/erupt-field) | 表格展示配置 |
| `@Edit` | [@EruptField](/annotation/erupt-field) | 编辑表单配置 |
| `@Dynamic` | [动态控制 @Dynamic](/annotation/dynamic) | 动态组件控制（1.13.1+） |

## 使用建议

1. 从基础开始：先了解 `@Erupt` 核心注解，再学习其他功能注解
2. 权限优先：配置 `@Power` 注解确保数据安全
3. 布局优化：使用 `@Layout` 提升用户体验
4. 数据关联：掌握 `@Drill` 和 `@LinkTree` 实现复杂数据关系
5. 字段配置：结合 `@View` 和 `@Edit` 精细控制字段展示和编辑
6. 动态交互：使用 `@Dynamic` 实现条件化表单交互
