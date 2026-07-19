# DataProxy

DataProxy provides event-driven interfaces for add, delete, update, query, import, export, and data initialization operations — **equivalent to the service layer in traditional development**.

Use cases include: cache updates, message push, data validation, RPC calls, dynamic value assignment, and more.

Detailed usage for each capability is covered in the other documents of this group:

- [CRUD Interception (before* / after*)](/en/advanced/data-proxy-crud): inject business logic around add, update, and delete
- [Form Validation (validate)](/en/advanced/data-proxy-validate): validate data before saving, reject on failure
- [Query Conditions (beforeFetch / searchCondition)](/en/advanced/data-proxy-query): condition injection and default search values
- [Table Display (afterFetch / extraContent)](/en/advanced/data-proxy-table): cell coloring, row-button control, content injection
- [Custom Rows (extraRow)](/en/advanced/extra-row): append totals and summary rows
- [Virtual Fields (@Transient)](/en/advanced/virtual-field): display and populate non-database fields
- [Form Behaviors (addBehavior / editBehavior)](/en/advanced/data-proxy-form): pre-fill and pre-process when forms open
- [Form View (FormView)](/en/advanced/form-view): standalone full-page forms with fully custom load/save
- [Excel Import & Export (excel*)](/en/advanced/data-proxy-excel): customize export files and validate imported data
- [Print Processing (print)](/en/advanced/data-proxy-print): customize the printed HTML output
- [Inherited Proxy (@PreDataProxy)](/en/advanced/pre-data-proxy): reuse DataProxy capabilities through inheritance

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
