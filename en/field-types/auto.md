# Auto Inference AUTO

When `type` is not specified, Erupt automatically infers which edit component to use based on the Java field type.

![auto](/field-types/auto.svg)

| Field Type | Mapped Component |
|:---:|:---:|
| `Integer` / `Float` / `Double` and other numeric types | `EditType.NUMBER` |
| `Boolean` | `EditType.BOOLEAN` |
| `Date` / `LocalDate` / `LocalDateTime` / `LocalTime` | `EditType.DATE`, the sub-type follows the Java type (2.4.0+) |
| Java enum | `EditType.CHOICE` with the enum constants as options (2.4.0+) |
| `@Erupt` entity | `REFERENCE_TREE` when the target declares a tree `pid`, otherwise `REFERENCE_TABLE` (2.4.0+) |
| `Collection<@Erupt entity>` | `TAB_TABLE_REFER` under `@ManyToMany`, otherwise `TAB_TABLE_ADD` (2.4.0+) |
| `Collection<enum>` | `EditType.MULTI_CHOICE` with the enum constants as options (2.4.0+) |
| `Map` | `EditType.KEY_VALUE` (2.4.0+) |
| Others | `EditType.INPUT` |

## Basic Usage

```java
@EruptField(
    edit = @Edit(title = "Text Input") // equivalent to type = EditType.INPUT
)
private String input;

@EruptField(
    edit = @Edit(title = "Numeric Input") // equivalent to type = EditType.NUMBER
)
private Integer number;

@EruptField(
    edit = @Edit(title = "Boolean Toggle") // equivalent to type = EditType.BOOLEAN
)
private Boolean bool;

@EruptField(
    edit = @Edit(title = "Date Picker") // equivalent to type = EditType.DATE
)
private Date date;
```

## Inference from the Java Type <Badge type="tip" text="v2.4.0+" />

Since 2.4.0 `AUTO` resolves **from the Java type alone**, so references, sub-tables, enums and key-value maps no longer need an explicit `type`:

| Java type | Resolved to |
|---|---|
| `@Erupt` entity | `REFERENCE_TREE` when the target declares `@Erupt(tree = @Tree(pid = ...))`, otherwise `REFERENCE_TABLE` |
| `Collection<@Erupt entity>` | `TAB_TABLE_REFER` when the field carries `@ManyToMany`, otherwise `TAB_TABLE_ADD` |
| `Collection<enum>` | `MULTI_CHOICE` with the enum constants as options |
| `Map` | `KEY_VALUE` |
| Java enum | `CHOICE` with the enum constants as options (by name, translated through i18n for the label) |
| `LocalDate` / `LocalDateTime` / `LocalTime` / `Date` | `DATE`; `DateType.Type.AUTO` then picks date, date-time or time, see [Date Picker](/en/field-types/date#date-sub-type-inferred-from-the-java-type) |

An enum field uses its constants as options only when `@ChoiceType` declares neither `vl` nor `fetchHandler`; declared options always win.

A model with no `type` written anywhere:

```java
@Erupt(name = "Order")
public class Order extends BaseModel {

    @EruptField(edit = @Edit(title = "Created"))
    private LocalDateTime created;          // DATE, date-time

    @EruptField(edit = @Edit(title = "Status"))
    private OrderStatus status;             // CHOICE, options are the OrderStatus constants

    @ManyToOne
    @EruptField(edit = @Edit(title = "Customer"))
    private Customer customer;              // REFERENCE_TABLE

    @ManyToOne
    @EruptField(edit = @Edit(title = "Department"))
    private Dept dept;                      // REFERENCE_TREE, Dept declares tree.pid

    @OneToMany
    @EruptField(edit = @Edit(title = "Items"))
    private List<OrderItem> items;          // TAB_TABLE_ADD

    @ManyToMany
    @EruptField(edit = @Edit(title = "Tags"))
    private List<Tag> tags;                 // TAB_TABLE_REFER

    @JdbcTypeCode(SqlTypes.JSON)
    @EruptField(edit = @Edit(title = "Channels"))
    private Set<Channel> channels;          // MULTI_CHOICE, options are the Channel constants

    @JdbcTypeCode(SqlTypes.JSON)
    @EruptField(edit = @Edit(title = "Attributes"))
    private Map<String, String> attrs;      // KEY_VALUE

}
```

:::tip
Inference only decides `type`; sub-annotations such as `referenceTableType` / `choiceType` can still be added as needed, and a field with an explicit `type` is never touched.
:::
