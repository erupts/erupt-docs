# 日期选择 DATE

日期/时间选择器，字段类型为 `Date` / `LocalDate` / `LocalDateTime` 时可自动推测，支持日期、时间、月、周、年等多种模式。

![date](/field-types/date.png)

## 基础用法

```java
@EruptField(
    edit = @Edit(title = "日期")
)
private LocalDate date;
```

## 配置项

```java
public @interface DateType {

    Type type() default Type.AUTO; // 展示方式，默认按 Java 类型推断（2.4.0+）

    PickerMode pickerMode() default PickerMode.ALL; // 可选时间范围

    String min() default ""; // 最早可选日期（含），格式 yyyy-MM-dd，空表示不限（2.1.1+）

    String max() default ""; // 最晚可选日期（含），格式 yyyy-MM-dd，空表示不限（2.1.1+）

    enum Type {
        AUTO,       // 按字段 Java 类型推断（2.4.0+，默认）
        DATE,       // 日期
        TIME,       // 时间
        DATE_TIME,  // 日期时间
        MONTH,      // 月
        WEEK,       // 周
        QUARTER,    // 季度（2.1.1+）
        YEAR        // 年
    }

    enum PickerMode {
        ALL,     // 可选任意时间
        FUTURE,  // 仅可选未来时间
        HISTORY  // 仅可选历史时间
    }

}
```

## 按 Java 类型推断日期子类型 <Badge type="tip" text="v2.4.0+" />

`DateType.Type` 新增 `AUTO` 并成为默认值：不写 `type` 时，由字段的 Java 类型决定是日期、日期时间还是时间。

| Java 类型 | 推断结果 |
|---|---|
| `LocalDate` | `DATE` |
| `LocalDateTime` | `DATE_TIME` |
| `LocalTime` | `TIME` |
| `java.util.Date` | 按 JPA `@Temporal` 决定：`TemporalType.DATE` → `DATE`，`TemporalType.TIME` → `TIME`，未标注 → `DATE_TIME` |
| `String` | 保持 `DATE` |

```java
@EruptField(edit = @Edit(title = "下单时间"))
private LocalDateTime created;   // DATE_TIME

@EruptField(edit = @Edit(title = "生效日"))
private LocalDate day;           // DATE

@EruptField(edit = @Edit(title = "打卡时间"))
private LocalTime clock;         // TIME

@Temporal(TemporalType.DATE)
@EruptField(edit = @Edit(title = "生日"))
private Date birthday;           // DATE

@EruptField(edit = @Edit(title = "时间戳"))
private Date stamp;              // DATE_TIME
```

月、周、季度、年这几种模式无法从类型推出，仍需显式写 `type`。

## 示例

日期时间：

```java
@EruptField(
    views = @View(title = "时间"),
    edit = @Edit(title = "时间", type = EditType.DATE,
                 dateType = @DateType(type = DateType.Type.DATE_TIME))
)
private LocalDateTime dateTime;
```

仅选时间：

```java
@EruptField(
    views = @View(title = "时间"),
    edit = @Edit(title = "时间", type = EditType.DATE,
                 dateType = @DateType(type = DateType.Type.TIME))
)
private String time;
```

月 / 周 / 年：

```java
@EruptField(
    edit = @Edit(title = "月份", type = EditType.DATE,
                 dateType = @DateType(type = DateType.Type.MONTH))
)
private String month;

@EruptField(
    edit = @Edit(title = "周", type = EditType.DATE,
                 dateType = @DateType(type = DateType.Type.WEEK))
)
private String week;

@EruptField(
    edit = @Edit(title = "年份", type = EditType.DATE,
                 dateType = @DateType(type = DateType.Type.YEAR))
)
private String year;
```

季度选择（2.1.1+）：

```java
@EruptField(
    edit = @Edit(title = "季度", type = EditType.DATE,
                 dateType = @DateType(type = DateType.Type.QUARTER))
)
private String quarter;
```

仅允许选择未来时间：

```java
@EruptField(
    edit = @Edit(title = "预约时间", type = EditType.DATE,
                 dateType = @DateType(pickerMode = DateType.PickerMode.FUTURE))
)
private LocalDateTime futureDate;
```

限定可选日期区间（2.1.1+）：

```java
@EruptField(
    edit = @Edit(title = "活动日期", type = EditType.DATE,
                 dateType = @DateType(min = "2026-01-01", max = "2026-12-31"))
)
private LocalDate activityDate;
```
