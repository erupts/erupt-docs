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

    Type type() default Type.AUTO; // Display mode, inferred from the Java type by default (2.4.0+)

    PickerMode pickerMode() default PickerMode.ALL; // Selectable time range

    String min() default ""; // Earliest selectable date (inclusive), format yyyy-MM-dd; empty means unbounded (2.1.1+)

    String max() default ""; // Latest selectable date (inclusive), format yyyy-MM-dd; empty means unbounded (2.1.1+)

    enum Type {
        AUTO,       // Inferred from the field's Java type (2.4.0+, default)
        DATE,       // Date
        TIME,       // Time
        DATE_TIME,  // Date and time
        MONTH,      // Month
        WEEK,       // Week
        QUARTER,    // Quarter (2.1.1+)
        YEAR        // Year
    }

    enum PickerMode {
        ALL,     // Any time can be selected
        FUTURE,  // Only future times can be selected
        HISTORY  // Only past times can be selected
    }

}
```

## Date Sub-type Inferred from the Java Type <Badge type="tip" text="v2.4.0+" />

`DateType.Type` gains `AUTO`, now the default: with no `type` written, the field's Java type decides between date, date-time and time.

| Java type | Resolved to |
|---|---|
| `LocalDate` | `DATE` |
| `LocalDateTime` | `DATE_TIME` |
| `LocalTime` | `TIME` |
| `java.util.Date` | by JPA `@Temporal`: `TemporalType.DATE` → `DATE`, `TemporalType.TIME` → `TIME`, absent → `DATE_TIME` |
| `String` | keeps `DATE` |

```java
@EruptField(edit = @Edit(title = "Created"))
private LocalDateTime created;   // DATE_TIME

@EruptField(edit = @Edit(title = "Effective Day"))
private LocalDate day;           // DATE

@EruptField(edit = @Edit(title = "Clock-in"))
private LocalTime clock;         // TIME

@Temporal(TemporalType.DATE)
@EruptField(edit = @Edit(title = "Birthday"))
private Date birthday;           // DATE

@EruptField(edit = @Edit(title = "Timestamp"))
private Date stamp;              // DATE_TIME
```

Month, week, quarter and year cannot be read from a type and still need an explicit `type`.

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

Quarter picker (2.1.1+):

```java
@EruptField(
    edit = @Edit(title = "Quarter", type = EditType.DATE,
                 dateType = @DateType(type = DateType.Type.QUARTER))
)
private String quarter;
```

Allow only future dates:

```java
@EruptField(
    edit = @Edit(title = "Appointment Time", type = EditType.DATE,
                 dateType = @DateType(pickerMode = DateType.PickerMode.FUTURE))
)
private LocalDateTime futureDate;
```

Limit the selectable date range (2.1.1+):

```java
@EruptField(
    edit = @Edit(title = "Event Date", type = EditType.DATE,
                 dateType = @DateType(min = "2026-01-01", max = "2026-12-31"))
)
private LocalDate activityDate;
```
