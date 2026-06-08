# Relation Components Overview

Erupt provides several relation components corresponding to different relationship types in JPA.

> These components are relatively complex to use. It is recommended to familiarize yourself with JPA and understand one-to-one, one-to-many, and many-to-many relationships before using them.

## Relation Type Reference

| Component Type | JPA Relationship | Use Case | Documentation |
|---------|---------|---------|---------|
| `REFERENCE_TABLE` | `@ManyToOne` | Many-to-one, select via table popup | [Details](/en/field-types/reference-table) |
| `REFERENCE_TREE` | `@ManyToOne` | Many-to-one, select via tree popup | [Details](/en/field-types/reference-tree) |
| `CHECKBOX` | `@ManyToMany` | Many-to-many, checkbox form | [Details](/en/field-types/checkbox) |
| `TAB_TREE` | `@ManyToMany` | Many-to-many, tree selection | [Details](/en/field-types/tab-tree) |
| `TAB_TABLE_REFER` | `@ManyToMany` | Many-to-many, table selection | [Details](/en/field-types/tab-table-refer) |
| `TAB_TABLE_ADD` | `@OneToMany` | One-to-many, inline child record creation | [Details](/en/field-types/tab-table-add) |
| `COMBINE` | `@OneToOne` | One-to-one, inline creation, supports JSON storage | [Details](/en/field-types/combine) |

## Selection Guide

- **Many-to-one**: Use `REFERENCE_TABLE` (list-style data) or `REFERENCE_TREE` (hierarchical data)
- **Many-to-many**: Use `CHECKBOX` (few options), `TAB_TREE` (hierarchical), or `TAB_TABLE_REFER` (list-style)
- **One-to-many**: Use `TAB_TABLE_ADD` to manage child table data directly within the parent record's edit dialog
- **One-to-one**: Use `COMBINE`, which supports storing the associated object as JSON in the same column
