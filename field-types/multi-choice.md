# 多选 MULTI_CHOICE

下拉多选框或复选框组，选中的多个值以 JSON 数组形式存储在单个字段中。

## 基础用法

静态选项：

```java
@JdbcTypeCode(SqlTypes.JSON)
@Column(length = 2000)
@EruptField(
    edit = @Edit(
        title = "多选",
        type = EditType.MULTI_CHOICE,
        multiChoiceType = @MultiChoiceType(
            vl = {
                @VL(label = "选项A", value = "A"),
                @VL(label = "选项B", value = "B"),
                @VL(label = "选项C", value = "C"),
            }
        )
    )
)
private Set<String> multiChoice;
```

:::info
`@JdbcTypeCode(SqlTypes.JSON)` 指示 Hibernate 将 `Set<String>` 序列化为 JSON 数组存入数据库单列，例如 `["A","C"]`。需要数据库列具有足够长度（建议 `length = 2000` 或更大）。
:::

## 配置项

```java
public @interface MultiChoiceType {

    Type type() default Type.CHECKBOX; // 展示方式

    VL[] vl() default {};              // 静态选项列表

    String[] fetchHandlerParams() default {}; // 传递给 fetchHandler 的参数

    Class<? extends ChoiceFetchHandler>[] fetchHandler() default {}; // 动态选项来源

    String dependField() default ""; // 联动字段名（本表字段）

    enum Type {
        SELECT,   // 下拉多选
        CHECKBOX, // 复选框组（默认）
    }

}
```

## 一对多表存储

当需要将多选值存储到独立的中间表（而非 JSON 数组存入单列）时，可结合 JPA 的 `@ElementCollection` 使用。

```java
@ElementCollection(fetch = FetchType.EAGER)
// 创建中间表 multi_table，id 为当前表的主键，呈一对多关联关系
@CollectionTable(
    name = "multi_table",
    joinColumns = @JoinColumn(name = "id"),
    foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT)
)
@Column(name = "mid")
@EruptField(
    views = @View(title = "多选"),
    edit = @Edit(
        title = "多选",
        type = EditType.MULTI_CHOICE,
        multiChoiceType = @MultiChoiceType(
            vl = {
                @VL(value = "1", label = "A"),
                @VL(value = "2", label = "B"),
                @VL(value = "3", label = "C"),
            }
        )
    )
)
private Set<Integer> mid;
```

对应的 `multi_table` 表结构：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | 与主表主键类型一致 | 外键，关联主表主键 |
| `mid` | INT / VARCHAR | 存储选中的选项值 |

:::tip
使用 `Set<Integer>` 或 `Set<String>` 作为字段类型，JPA 会自动维护中间表的增删。相比默认的 JSON 单列存储，这种方案更适合需要按选项值查询或关联的场景。
:::

## 示例：动态获取选项

实现 `ChoiceFetchHandler` 接口，与 [CHOICE](/field-types/choice) 完全相同：

```java
@EruptField(
    edit = @Edit(title = "多选", type = EditType.MULTI_CHOICE,
                 multiChoiceType = @MultiChoiceType(fetchHandler = FetchHandlerImpl.class))
)
private String multiChoice;
```
