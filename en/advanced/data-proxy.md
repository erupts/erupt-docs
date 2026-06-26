# DataProxy

DataProxy provides event-driven interfaces for add, delete, update, query, import, export, and data initialization operations — **equivalent to the service layer in traditional development**.

Use cases include: cache updates, message push, data validation, RPC calls, dynamic value assignment, and more.

## Usage

Add the `dataProxy` configuration to the `@Erupt` annotation and override the methods you need:

```java
@Erupt(name = "Erupt", dataProxy = EruptTestDataProxy.class)
public class EruptTest extends BaseModel{
    
    @EruptField(
            views = @View(title = "Name"),
            edit = @Edit(title = "Name")
    )
    private String name;
    
}
```

Define a class that implements the `DataProxy` interface:

```java
@Service // Add this annotation to enable dependency injection
public class EruptTestDataProxy implements DataProxy<EruptTest>{
    
    @Override
    public void beforeAdd(EruptTest eruptTest) {
        // Data validation
        if("John".equals(eruptTest.getName())){
            throw new EruptApiErrorTip("Name 'John' is not allowed!");
        }
    }

    @Override
    public void beforeUpdate(EruptTest eruptTest) {
        // Dynamically modify data before saving
        eruptTest.setName(eruptTest.getName() + "xxxxxxx");
    }
    
    @Override
    public void afterFetch(Collection<Map<String, Object>> list) {
        // TODO: post-process query results
    }

    @Override
    public Alert alert(List<Condition> conditions) {
        return Alert.info("Page notice message");
    }
    
}
```

## DataProxy Interface Definition

```java
public interface DataProxy<MODEL> {

    /** Data validation. Throw EruptException if validation fails. Since 1.13.1+ */
    default void validate(MODEL model) throws EruptException { }

    /** Before add */
    default void beforeAdd(MODEL model) { }

    /** After add */
    default void afterAdd(MODEL model) { }

    /** Before update */
    default void beforeUpdate(MODEL model) { }

    /** After update */
    default void afterUpdate(MODEL model) { }

    /** Before delete */
    default void beforeDelete(MODEL model) { }

    /** After delete */
    default void afterDelete(MODEL model) { }

    /**
     * Dynamically inject conditions before a query.
     * @param conditions Conditions already passed from the frontend
     * @return Custom query condition (JPQL WHERE clause, without the WHERE keyword)
     */
    default String beforeFetch(List<Condition> conditions) { return null; }

    /**
     * Post-process query results.
     * @param list Query result set
     */
    default void afterFetch(Collection<Map<String, Object>> list) { }

    /**
     * Global page alert, triggered each time the page opens. Return null to show nothing.
     * Alert supports four types: info / warning / error / success
     */
    default Alert alert(List<Condition> conditions) { return null; }

    /**
     * Custom rendered HTML; the returned string is displayed at the top of the view.
     */
    default String extraContent(List<Condition> conditions, Collection<Map<String, Object>> list) { return null; }

    /**
     * Called when the "add new" form opens — use to pre-populate default field values.
     */
    default void addBehavior(MODEL model) { }

    /**
     * Called when the edit form opens, after data is loaded — use to pre-process fields before rendering.
     */
    default void editBehavior(MODEL model) { }

    /**
     * Called on page load to set default search field values.
     * Map keys are entity field names; values are the default search values.
     */
    default void searchCondition(Map<String, Object> condition) { }

    /**
     * Called after Excel export is generated. Cast parameter to Apache POI Workbook to customize the file.
     */
    default void excelExport(Object workbook) { }

    /**
     * Called when an Excel file is imported (raw POI stage). Cast parameter to Apache POI Workbook.
     */
    default void excelImport(Object workbook) { }

    /**
     * Called after Excel data is parsed into model objects (structured stage) — use for batch validation or modification.
     */
    default void excelImportProcess(List<MODEL> list) { }

    /**
     * Called during print. Returns the (possibly modified) HTML content string.
     */
    default String print(MODEL model, String content) { return content; }

    /**
     * Returns additional rows (e.g. totals) appended after the normal table rows.
     */
    default List<Row> extraRow(List<Condition> conditions) { return null; }

    /**
     * Form view: called on open — load data from your source and populate model fields.
     */
    default void formViewBehavior(MODEL model) { }

    /**
     * Form view: called on save after field validation passes — persist model to your data source.
     * Throw EruptException to abort with a user-visible error message.
     */
    default void formSave(MODEL model) throws EruptException { }

}
```

## beforeFetch Condition Injection

The return value of `beforeFetch` is a JPQL (HQL) WHERE clause **without the `WHERE` keyword** — the framework appends it automatically.

```java
@Override
public String beforeFetch(List<Condition> conditions) {
    // Only query data belonging to the currently logged-in user
    String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
    return "createBy = '" + currentUser + "'";
}
```

Supported syntax examples:

| Scenario | Return value example |
| --- | --- |
| Equals | `"status = 1"` |
| Range | `"age between 18 and 60"` |
| Like | `"name like '%John%'"` |
| IN | `"id in (1, 2, 3)"` |
| Association property | `"dept.id = 10"` |
| Multiple conditions | `"status = 1 and deleteFlag = 0"` |
| Subquery | `"id in (select userId from t_order where amount > 100)"` |

> Note: This is JPQL, not native SQL. Use Java entity property names (camelCase), not database column names.

## validate() vs before* Methods

| | `validate()` | `beforeAdd()` / `beforeUpdate()` |
|---|---|---|
| Purpose | Data validation — reject the operation if it fails | Modify data or execute business logic before saving |
| Since | 1.13.1+ | All versions |
| Recommended for | Format checks, business rule validation | Auto-filling fields, calling external services |

```java
@Override
public void validate(EruptTest model) throws EruptException {
    // Recommended: pure validation logic, do not modify data here
    if (model.getEndDate().before(model.getStartDate())) {
        throw new EruptApiErrorTip("End date cannot be earlier than start date");
    }
}

@Override
public void beforeAdd(EruptTest model) {
    // Recommended: modify or supplement data
    model.setCreateBy(getCurrentUser());
}
```

## Accessing Context Information in DataProxy

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest>{
    
    @Override
    public void afterFetch(Collection<Map<String, Object>> list) {
        // Get the Erupt class currently being operated on (e.g. EruptTest.class)
        Class<?> clazz = DataProxyContext.currentClass();
        // Get the params value passed in @Erupt dataProxy (string array)
        String[] params = DataProxyContext.params();
        // Get the current HTTP request object
        HttpServletRequest request = DataProxyContext.get(HttpServletRequest.class);
    }
    
}
```

Key `DataProxyContext` methods:

| Method | Return type | Description |
| --- | --- | --- |
| `currentClass()` | `Class<?>` | The current Erupt entity class |
| `params()` | `String[]` | The `params` in `@Erupt(dataProxy = {X.class, params = {"a","b"}})` |
| `get(Class<T>)` | `T` | Retrieve a Bean from the Spring context |

## Cell Coloring

> Supported since 1.12.16+

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest>{

    @Override
    public void afterFetch(Collection<Map<String, Object>> list) {
        int i = 0;
        for (Map<String, Object> map : list) {
            i++;
            if (i % 2 != 0) {
                EruptTableStyle.cellColor(map, "text", "#09f");
            }
        }
    }
    
}
```

## Table Row Button Visibility Control

> Supported since 1.12.16+

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest>{

    @Override
    public void afterFetch(Collection<Map<String, Object>> list) {
        int i = 0;
        for (Map<String, Object> map : list) {
            // Parameters: row data, show view button, show edit button, show delete button
            EruptTableStyle.rowPower(map, ++i % 2 == 0, true, true);
        }
    }
    
}
```

## extraContent Custom Content Injection <Badge type="tip" text="v1.14.3+" />

The HTML string returned by `extraContent` is rendered at the top of the table or other view, suitable for displaying summary statistics, announcements, custom charts, and other supplementary information.

In 2.0.0 a second parameter `list` was added, giving direct access to the current page's query results:

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest>{

    @Override
    public String extraContent(List<Condition> conditions, Collection<Map<String, Object>> list) {
        // list = current page data (2.0.0+); conditions = current search filters
        return "<div style='padding:8px 12px;background:#f0f9ff;border-radius:6px'>"
             + "Total: <b>" + list.size() + "</b> records on this page"
             + "</div>";
    }
    
}
```

:::tip
- Return `null` to display nothing (default behavior)
- The `conditions` parameter contains the current page's search conditions, allowing dynamic content rendering
- The `list` parameter (2.0.0+) provides the current page query results for inline statistics
- The return value is raw HTML — avoid XSS risks by never concatenating user input directly
:::

## addBehavior / editBehavior Form Behavior

- **`addBehavior`**: Triggered when the "add new" form opens. The framework instantiates an empty object then calls this method — use it to pre-populate default values.
- **`editBehavior`**: Triggered when the edit form opens, after the record is loaded from the database. Use it to pre-process or transform field values before rendering (changes are not persisted automatically).

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest> {

    @Override
    public void addBehavior(EruptTest model) {
        // Pre-fill defaults when the add form opens
        model.setStatus("DRAFT");
        model.setCreator(getCurrentUser());
    }

    @Override
    public void editBehavior(EruptTest model) {
        // Pre-process fields before the edit form renders (not persisted)
        if (model.getContent() != null) {
            model.setContent(decrypt(model.getContent()));
        }
    }
}
```

## searchCondition Default Search Values

Triggered when the page loads to pre-set default search field values. Map keys are entity field names; values are the default search values passed to the frontend.

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest> {

    @Override
    public void searchCondition(Map<String, Object> condition) {
        // Default to the current user's own records
        condition.put("createBy", getCurrentUser());
        // Default status to "enabled"
        condition.put("status", 1);
    }
}
```

## extraRow Custom Appended Rows

Returns a list of `Row` objects appended after the normal table rows — commonly used for totals or summary rows.

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest> {

    @Override
    public List<Row> extraRow(List<Condition> conditions) {
        return List.of(
            Row.builder()
               .columns(List.of(
                   new Column("Total"),
                   new Column(String.valueOf(calcTotal(conditions)), 3)
               ))
               .className("total-row")
               .build()
        );
    }
}
```

`Row` / `Column` structure:

| Field | Type | Description |
|---|---|---|
| `Row.columns` | `List<Column>` | Cell list for the row |
| `Row.className` | `String` | CSS class for the row (optional) |
| `Column.value` | `String` | Cell content (HTML supported) |
| `Column.colspan` | `int` | Column span, default 1 |
| `Column.className` | `String` | CSS class for the cell (optional) |

## Excel Export / Import

> Requires the `erupt-excel` module

### excelExport — Customize the Export File

Triggered after the Excel file is generated. Cast the parameter to Apache POI `Workbook` to modify styles, append sheets, etc.

```java
@Override
public void excelExport(Object workbook) {
    Workbook wb = (Workbook) workbook;
    Sheet sheet = wb.getSheetAt(0);
    // Insert a title row at the top
    sheet.shiftRows(0, sheet.getLastRowNum(), 1);
    Row titleRow = sheet.createRow(0);
    titleRow.createCell(0).setCellValue("Data Export Report");
}
```

### excelImport — Raw POI Stage

Triggered after the Excel file is uploaded but before data is parsed. The parameter is the same `Workbook` object — use it for pre-validation or format correction.

```java
@Override
public void excelImport(Object workbook) {
    Workbook wb = (Workbook) workbook;
    if (wb.getNumberOfSheets() < 1) {
        throw new EruptApiErrorTip("Invalid Excel file format");
    }
}
```

### excelImportProcess — Structured Data Stage

Triggered after Excel rows are parsed into model objects, before they are saved. Use it for batch validation or to fill in extra fields.

```java
@Override
public void excelImportProcess(List<EruptTest> list) {
    for (EruptTest item : list) {
        if (item.getName() == null || item.getName().isBlank()) {
            throw new EruptApiErrorTip("Some rows have an empty name — please fix the file and retry");
        }
        item.setCreateBy(getCurrentUser());
    }
}
```

## print — Print Content Processing

Triggered during a print operation. Receives the model and the framework-generated HTML string. Return the final HTML to render.

```java
@Override
public String print(EruptTest model, String content) {
    // Append a watermark to the printed output
    return content + "<div style='color:#ccc;font-size:12px'>Printed by: " + getCurrentUser() + "</div>";
}
```

---

## Inherited Pre-Proxy with @PreDataProxy

In Erupt, you can leverage a parent class's component capabilities through inheritance. Inherited proxy methods defined via `@PreDataProxy` will also be executed automatically.

```java
public @interface PreDataProxy {

    Class<? extends DataProxy<?>> value();

}
```

`PreDataProxy` supports multi-level inheritance and can also be placed on interfaces.

### Code Example

Extending `HyperModel` not only provides creator, create time, updater, and update time fields — it also auto-populates them. This works because the `HyperModel` class is annotated with `@PreDataProxy`:

```java
@PreDataProxy(HyperDataProxy.class)
@MappedSuperclass
public class MetaModelVo extends BaseModel {

    @EruptField(
            views = @View(title = "Created By", width = "100px"),
            edit = @Edit(title = "Created By", readonly = @Readonly)
    )
    private String createBy;

    @EruptField(
            views = @View(title = "Create Time", sortable = true),
            edit = @Edit(title = "Create Time", readonly = @Readonly, dateType = @DateType(type = DateType.Type.DATE_TIME))
    )
    private LocalDateTime createTime;

    // ... more fields
}
```

```java
@Service
public class HyperDataProxy implements DataProxy<HyperModel> {

    @Autowired
    private EruptUserService eruptUserService;

    @Override
    public void beforeAdd(HyperModel hyperModel) {
        hyperModel.setCreateTime(new Date());
        hyperModel.setCreateUser(new EruptUser(eruptUserService.getCurrentUid()));
    }

    @Override
    public void beforeUpdate(HyperModel hyperModel) {
        hyperModel.setUpdateTime(new Date());
        hyperModel.setUpdateUser(new EruptUser(eruptUserService.getCurrentUid()));
    }
}
```

When `TestModel` is used, the corresponding `HyperDataProxy` methods will be invoked automatically:

```java
@Entity
@Erupt
public class TestModel extends MetaModelVo {
    
}
```
