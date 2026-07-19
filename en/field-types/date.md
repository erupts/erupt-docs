# Date Picker DATE

Date/time picker. When the field type is `Date`, `LocalDate`, or `LocalDateTime`, the type is automatically inferred. Supports date, time, month, week, year, and other modes.

![date](/field-types/date.png)

## Basic Usage

```java
@EruptField(
    edit = @Edit(title = "Date")
)
private LocalDate date;
```

## Configuration

```java
public @interface DateType {

    Type type() default Type.DATE; // Display mode

    PickerMode pickerMode() default PickerMode.ALL; // Selectable time range

    enum Type {
        DATE,       // Date
        TIME,       // Time
        DATE_TIME,  // Date and time
        MONTH,      // Month
        WEEK,       // Week
        YEAR        // Year
    }

    enum PickerMode {
        ALL,     // Any time can be selected
        FUTURE,  // Only future times can be selected
        HISTORY  // Only past times can be selected
    }

}
```

## Examples

Date and time:

```java
@EruptField(
    views = @View(title = "Time"),
    edit = @Edit(title = "Time", type = EditType.DATE,
                 dateType = @DateType(type = DateType.Type.DATE_TIME))
)
private LocalDateTime dateTime;
```

Time only:

```java
@EruptField(
    views = @View(title = "Time"),
    edit = @Edit(title = "Time", type = EditType.DATE,
                 dateType = @DateType(type = DateType.Type.TIME))
)
private String time;
```

Month / Week / Year:

```java
@EruptField(
    edit = @Edit(title = "Month", type = EditType.DATE,
                 dateType = @DateType(type = DateType.Type.MONTH))
)
private String month;

@EruptField(
    edit = @Edit(title = "Week", type = EditType.DATE,
                 dateType = @DateType(type = DateType.Type.WEEK))
)
private String week;

@EruptField(
    edit = @Edit(title = "Year", type = EditType.DATE,
                 dateType = @DateType(type = DateType.Type.YEAR))
)
private String year;
```

Allow only future dates:

```java
@EruptField(
    edit = @Edit(title = "Appointment Time", type = EditType.DATE,
                 dateType = @DateType(pickerMode = DateType.PickerMode.FUTURE))
)
private LocalDateTime futureDate;
```
