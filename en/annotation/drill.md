# Data Drill-Down @Drill

Drill down from a single record to view related data from another table. Supports **unlimited levels** of table association — no foreign key required, enabling low-coupling one-to-many relationships.

## Usage

### Main Table Configuration

```java
@Erupt(
    name = "TestDrill",
    drills = {
        @Drill(code = "drill",
               title = "Drill Down",
               // The generated expression will be: EruptTest.id = DrillErupt.eruptTestId
               link = @Link(column = "id",                 // join column in the current table
                            linkErupt = DrillErupt.class,  // target related table
                            joinColumn = "eruptTestId"))   // join column in the target table
    }
)
@Entity
@Table
public class EruptTest extends BaseModel {
}
```

### Related Table Configuration

```java
@Erupt(name = "Drill Target")
@Entity
@Table
public class DrillErupt extends BaseModel {

    // Primary key of EruptTest
    private Long eruptTestId;

    @EruptField(
        views = @View(title = "Text"),
        edit  = @Edit(title = "Text", notNull = true)
    )
    private String input;
}
```

:::warning
`DrillErupt` must have menu permissions configured; otherwise a 403 error will occur when drilling down.
:::

<img src="/drill/demo1.png" width="900">

<img src="/drill/demo2.png" width="900">

## Configuring Menu Permissions for Drill-Down (403 on Drill)

For example: a dictionary can drill down to its dictionary items.

Add the drill target class name as a menu entry with type **Table View** and status **Hidden**.

<img src="/drill/menu-config.png" width="900">

## Annotation Definition

```java
public @interface Drill {

    // Unique identifier for this drill-down
    String code();

    // Display name
    String title();

    // Whether to collapse the button (supported in 1.12.19+)
    boolean fold() default false;

    // Icon, refer to Font Awesome
    String icon() default "fa fa-sitemap";

    // Dynamically control button visibility
    ExprBool show() default @ExprBool;

    Link link();
}
```

```java
public @interface Link {

    // The related Erupt class
    Class<?> linkErupt();

    // The join field in the related Erupt class
    String joinColumn();

    // The join field in the current class
    String column() default "id";

    // Additional condition when joining
    String linkCondition() default "";

    // Result preview: this.column = linkErupt.joinColumn [ and {linkCondition}]
}
```
