# 日期选择 DATE

日期/时间选择器，字段类型为 `Date` / `LocalDate` / `LocalDateTime` 时可自动推测，支持日期、时间、月、周、年等多种模式。

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

    Type type() default Type.DATE; // 展示方式

    PickerMode pickerMode() default PickerMode.ALL; // 可选时间范围

    enum Type {
        DATE,       // 日期
        TIME,       // 时间
        DATE_TIME,  // 日期时间
        MONTH,      // 月
        WEEK,       // 周
        YEAR        // 年
    }

    enum PickerMode {
        ALL,     // 可选任意时间
        FUTURE,  // 仅可选未来时间
        HISTORY  // 仅可选历史时间
    }

}
```

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

仅允许选择未来时间：

```java
@EruptField(
    edit = @Edit(title = "预约时间", type = EditType.DATE,
                 dateType = @DateType(pickerMode = DateType.PickerMode.FUTURE))
)
private LocalDateTime futureDate;
```
