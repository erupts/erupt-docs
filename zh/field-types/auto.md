# 自动推测 AUTO

不指定 `type` 时，Erupt 会根据 Java 字段类型自动推断使用哪种编辑组件。

![auto](/field-types/auto.svg)

| 字段类型 | 映射组件 |
|:---:|:---:|
| `Integer` / `Float` / `Double` 等数值类型 | `EditType.NUMBER` |
| `Boolean` | `EditType.BOOLEAN` |
| `Date` / `LocalDate` / `LocalDateTime` / `LocalTime` | `EditType.DATE`，子类型由 Java 类型决定（2.4.0+） |
| Java 枚举 | `EditType.CHOICE`，选项为枚举常量（2.4.0+） |
| `@Erupt` 实体 | 目标声明了树 `pid` 则 `REFERENCE_TREE`，否则 `REFERENCE_TABLE`（2.4.0+） |
| `Collection<@Erupt 实体>` | `@ManyToMany` 则 `TAB_TABLE_REFER`，否则 `TAB_TABLE_ADD`（2.4.0+） |
| `Collection<枚举>` | `EditType.MULTI_CHOICE`，选项为枚举常量（2.4.0+） |
| `Map` | `EditType.KEY_VALUE`（2.4.0+） |
| 其他 | `EditType.INPUT` |

## 基础用法

```java
@EruptField(
    edit = @Edit(title = "文本输入") // 相当于 type = EditType.INPUT
)
private String input;

@EruptField(
    edit = @Edit(title = "数值输入") // 相当于 type = EditType.NUMBER
)
private Integer number;

@EruptField(
    edit = @Edit(title = "布尔选择") // 相当于 type = EditType.BOOLEAN
)
private Boolean bool;

@EruptField(
    edit = @Edit(title = "时间选择") // 相当于 type = EditType.DATE
)
private Date date;
```

## 按 Java 类型推断 <Badge type="tip" text="v2.4.0+" />

2.4.0 起 `AUTO` **只看字段的 Java 类型**，引用、子表、枚举、键值对都不再需要写 `type`：

| Java 类型 | 推断结果 |
|---|---|
| `@Erupt` 实体 | 目标 `@Erupt(tree = @Tree(pid = ...))` 声明了 `pid` → `REFERENCE_TREE`，否则 `REFERENCE_TABLE` |
| `Collection<@Erupt 实体>` | 字段标了 `@ManyToMany` → `TAB_TABLE_REFER`，否则 `TAB_TABLE_ADD` |
| `Collection<枚举>` | `MULTI_CHOICE`，选项为枚举常量 |
| `Map` | `KEY_VALUE` |
| Java 枚举 | `CHOICE`，选项为枚举常量（按常量名，经 i18n 翻译后作为显示文本） |
| `LocalDate` / `LocalDateTime` / `LocalTime` / `Date` | `DATE`，并由 `DateType.Type.AUTO` 进一步决定日期、日期时间或时间，见 [日期选择](/zh/field-types/date#按-java-类型推断日期子类型) |

枚举字段在 `@ChoiceType` 既没有 `vl` 也没有 `fetchHandler` 时，才用枚举常量作为选项；显式声明了选项则以声明为准。

一个没有写任何 `type` 的模型：

```java
@Erupt(name = "订单")
public class Order extends BaseModel {

    @EruptField(edit = @Edit(title = "下单时间"))
    private LocalDateTime created;          // DATE，日期时间

    @EruptField(edit = @Edit(title = "状态"))
    private OrderStatus status;             // CHOICE，选项为 OrderStatus 的常量

    @ManyToOne
    @EruptField(edit = @Edit(title = "客户"))
    private Customer customer;              // REFERENCE_TABLE

    @ManyToOne
    @EruptField(edit = @Edit(title = "所属部门"))
    private Dept dept;                      // REFERENCE_TREE，Dept 声明了 tree.pid

    @OneToMany
    @EruptField(edit = @Edit(title = "明细"))
    private List<OrderItem> items;          // TAB_TABLE_ADD

    @ManyToMany
    @EruptField(edit = @Edit(title = "标签"))
    private List<Tag> tags;                 // TAB_TABLE_REFER

    @JdbcTypeCode(SqlTypes.JSON)
    @EruptField(edit = @Edit(title = "渠道"))
    private Set<Channel> channels;          // MULTI_CHOICE，选项为 Channel 的常量

    @JdbcTypeCode(SqlTypes.JSON)
    @EruptField(edit = @Edit(title = "扩展属性"))
    private Map<String, String> attrs;      // KEY_VALUE

}
```

:::tip
推断只决定 `type`，`referenceTableType` / `choiceType` 等子注解仍可按需追加；显式写了 `type` 的字段不受推断影响。
:::
