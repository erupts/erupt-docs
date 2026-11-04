# 多选 MULTI_CHOICE

下拉多选框或复选框组，选中的多个值以 JSON 数组形式存储在单个字段中。

![multi-choice-select](/field-types/multi-choice-select.png)

## 基础用法

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

## 枚举集合即多选 <Badge type="tip" text="v2.4.0+" />

字段类型是 `Set<枚举>` / `List<枚举>` 时，不写 `type` 也不写 `vl`，Erupt 直接推断为 `MULTI_CHOICE`，选项为枚举常量（存常量名，显示文本经 i18n 翻译）：

```java
public enum Channel { WEB, APP, STORE }

@JdbcTypeCode(SqlTypes.JSON)
@EruptField(
    views = @View(title = "渠道"),
    edit = @Edit(title = "渠道") // 推断为 MULTI_CHOICE，选项 WEB / APP / STORE
)
private Set<Channel> channels;
```

`@MultiChoiceType` 声明了 `vl` 或 `fetchHandler` 时以声明为准。其他类型的推断规则见 [自动推测 AUTO](/zh/field-types/auto#按-java-类型推断)。

## 动态列表 <Badge type="tip" text="MyModel 2.0.0+" />

实现 `ChoiceFetchHandler<T>` 接口，字段声明需使用 `@JdbcTypeCode(SqlTypes.JSON)` + `Set<String>`：

```java
@JdbcTypeCode(SqlTypes.JSON)
@Column(length = 2000)
@EruptField(
    edit = @Edit(title = "技能标签", type = EditType.MULTI_CHOICE,
                 multiChoiceType = @MultiChoiceType(fetchHandler = SkillFetchHandler.class))
)
private Set<String> skills;
```

```java
@Component
public class SkillFetchHandler implements ChoiceFetchHandler<MyModel> {

    @Override
    public List<VLModel> fetch(String[] params) {
        // 初始加载，返回全量选项
        return skillService.findAll().stream()
            .map(s -> new VLModel(s.getCode(), s.getName()))
            .collect(toList());
    }

    @Override
    public List<VLModel> fetchFilter(MyModel model, String[] params) {
        // 联动：根据同表单其他字段动态过滤可选项
        String dept = model.getDept();
        return skillService.findByDept(dept).stream()
            .map(s -> new VLModel(s.getCode(), s.getName()))
            .collect(toList());
    }

}
```

## 配置项

```java
public @interface MultiChoiceType {

    Type type() default Type.CHECKBOX; // 展示方式

    VL[] vl() default {};              // 静态选项列表

    String[] fetchHandlerParams() default {}; // 传递给 fetchHandler 的参数

    Class<? extends ChoiceFetchHandler>[] fetchHandler() default {}; // 动态选项来源

    String dependField() default ""; // 联动字段名（本表字段）

    boolean validate() default true; // 服务端校验提交值是否在选项内（2.4.0+）

    enum Type {
        SELECT,   // 下拉多选
        CHECKBOX, // 复选框组（默认）
        TRANSFER, // 穿梭框，适合选项很多的场景（2.3.0+）
    }

}
```

## 服务端选项校验 <Badge type="tip" text="v2.4.0+" />

`erupt.choice-validate` **默认开启**：新增、修改、单元格编辑与 Excel 导入时，服务端会逐个检查提交的值是否在用户实际能看到的选项内（`vl`、枚举常量、`fetchHandler` / `fetchFilter` 的返回），有一个不在其中即拒绝。与库中已存的值相同的值直接通过，`disable = true` 的选项不能新选，没有声明任何选项的字段不做校验。

```java
@JdbcTypeCode(SqlTypes.JSON)
@EruptField(
    edit = @Edit(title = "标签", type = EditType.MULTI_CHOICE,
                 multiChoiceType = @MultiChoiceType(validate = false, fetchHandler = TagFetchHandler.class))
)
private Set<String> tags; // 允许存选项之外的值
```

全局关闭在 `application.yml` 中设置 `erupt.choice-validate=false`，见 [配置项](/zh/guide/configuration)；校验规则的完整说明见 [单选 CHOICE](/zh/field-types/choice#服务端选项校验)。

## 穿梭框 <Badge type="tip" text="v2.3.0+" />

选项很多时可改用可搜索的双列穿梭框，选项来源与存储方式不变，仅切换控件：

```java
@JdbcTypeCode(SqlTypes.JSON)
@Column(length = 2000)
@EruptField(
    edit = @Edit(title = "工具", type = EditType.MULTI_CHOICE,
                 multiChoiceType = @MultiChoiceType(type = MultiChoiceType.Type.TRANSFER,
                                                    fetchHandler = ToolFetchHandler.class))
)
private Set<String> tools;
```

:::tip
实体多对多关联（`@ManyToMany`）的穿梭框请使用 [TRANSFER](/zh/field-types/transfer)。
:::

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
