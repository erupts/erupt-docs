# 一对多新增 TAB_TABLE_ADD

在主表编辑弹窗中直接新增、编辑子表数据，对应 JPA `@OneToMany`。保存主表时子表数据同步级联保存。

## 基础用法

```java
@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
@JoinColumn(name = "main_id")
@OrderBy
@EruptField(
    edit = @Edit(title = "子表数据", type = EditType.TAB_TABLE_ADD)
)
private Set<ChildTable> items;
```

> **注意**：不要在子表实体上使用 Lombok 的 `@Data` 注解，否则 `Set` 的 `equals/hashCode` 实现会导致去重异常。

子表实体类：

```java
@Entity
@Table(name = "t_child")
@Erupt(name = "子表")
public class ChildTable extends BaseModel {

    @EruptField(views = @View(title = "顺序"), edit = @Edit(title = "顺序"))
    private Integer sort;

    @EruptField(views = @View(title = "名称"), edit = @Edit(title = "名称"))
    private String name;

}
```

## 示例：存储为 JSON 字段

适合无需关联查询、仅需 JSON 存储的场景（需 Spring Boot 3 + hibernate-types-60）：

1. 添加依赖：

```xml
<dependency>
    <groupId>com.vladmihalcea</groupId>
    <artifactId>hibernate-types-60</artifactId>
    <version>2.21.1</version>
</dependency>
```

2. 字段加 `@JdbcTypeCode` 注解：

```java
@JdbcTypeCode(SqlTypes.JSON)
@Column(columnDefinition = "json")
@EruptField(
    edit = @Edit(title = "子数据", type = EditType.TAB_TABLE_ADD)
)
private Set<ChildTable> items;
```
