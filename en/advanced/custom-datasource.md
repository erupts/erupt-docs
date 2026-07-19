# Custom Data Source (EruptDataService)

If you want to use Erupt to manage data that lives outside a relational database, you can implement a custom data source.

## Use Cases

- Displaying and managing data from external APIs (HTTP, Dubbo)
- Visual management of CSV, TSV, and other data files
- Integrating other external data sources such as Elasticsearch or MongoDB

## How to Use

### 1. Implement the IEruptDataService Interface

```java
public interface IEruptDataService {

    /**
     * Globally control the capabilities of this data source (supported since 1.12.12+).
     * For example, if the data source is read-only, disable add/edit/delete here
     * instead of repeating it in @Erupt → @Power.
     */
    default PowerObject power() {
        return new PowerObject();
    }

    /** Retrieve a single record by primary key ID (used for edit pre-population) */
    Object findDataById(EruptModel eruptModel, Object id);

    /** Query paginated data (used for list display) */
    Page queryList(EruptModel eruptModel, Page page, EruptQuery eruptQuery);

    /** Query data by column (used for dropdowns and other selection scenarios) */
    Collection<Map<String, Object>> queryColumn(EruptModel eruptModel, List<Column> columns, EruptQuery eruptQuery);

    /** Add a record */
    void addData(EruptModel eruptModel, Object object);

    /** Edit a record */
    void editData(EruptModel eruptModel, Object object);

    /** Delete a record */
    void deleteData(EruptModel eruptModel, Object object);

}
```

**Parameter reference:**

- `EruptModel`: Metadata for the current Erupt class, including class info, field list, and annotation config. Use `eruptModel.getClazz()` to get the raw `Class` object.
- `Page`: Pagination parameters. `page.getPageIndex()` is the current page number (1-based); `page.getPageSize()` is the page size. After querying, call `page.setList(data)` and `page.setTotalErupt(total)` to fill the results.
- `EruptQuery`: Query condition wrapper. Use `eruptQuery.getConditions()` to get the filter conditions passed from the frontend; `eruptQuery.getOrderBy()` returns the sort field.
- `PowerObject`: Capability control object. Use `new PowerObject(false, false, false, false)` to disable view/add/edit/delete in order.

### 2. Register the Custom Data Source

```java
// Recommended: register in @PostConstruct to ensure the Spring context is fully initialized
@Component
public class DataSourceRegister {
    @PostConstruct
    public void init() {
        DataProcessorManager.register("datasource-name", EruptDataServiceImpl.class);
    }
}
```

> You can also register in a `static {}` block or `ApplicationRunner`, but `@PostConstruct` better aligns with the Spring lifecycle.

### 3. Add the @EruptDataProcessor Annotation to the Erupt Class

```java
@EruptDataProcessor("registered-datasource-name")
@Erupt(name = "xxxx")
public class Test {

}
```

## Complete Example: Integrating an HTTP API

The following example shows how to display data from an external REST API in an Erupt table:

```java
@Service
public class HttpApiDataService implements IEruptDataService {

    @Resource
    private RestTemplate restTemplate;

    @Override
    public PowerObject power() {
        // Read-only data source — disable add, edit, and delete
        return new PowerObject(true, false, false, false);
    }

    @Override
    public Object findDataById(EruptModel eruptModel, Object id) {
        return restTemplate.getForObject("https://api.example.com/items/" + id, Map.class);
    }

    @Override
    public Page queryList(EruptModel eruptModel, Page page, EruptQuery eruptQuery) {
        // Build request parameters
        String url = "https://api.example.com/items?page=" + page.getPageIndex()
                   + "&size=" + page.getPageSize();
        
        // Call the external API
        Map<String, Object> result = restTemplate.getForObject(url, Map.class);
        
        // Fill paginated results
        page.setList((List) result.get("data"));
        page.setTotalErupt(((Number) result.get("total")).longValue());
        return page;
    }

    @Override
    public Collection<Map<String, Object>> queryColumn(EruptModel eruptModel, 
            List<Column> columns, EruptQuery eruptQuery) {
        return Collections.emptyList();
    }

    @Override
    public void addData(EruptModel eruptModel, Object object) { }

    @Override
    public void editData(EruptModel eruptModel, Object object) { }

    @Override
    public void deleteData(EruptModel eruptModel, Object object) { }
}
```

Corresponding Erupt class definition:

```java
@EruptDataProcessor("http-api")
@Erupt(name = "External API Data")
public class HttpApiModel {

    @EruptField(
        views = @View(title = "ID"),
        edit = @Edit(title = "ID")
    )
    private Long id;

    @EruptField(
        views = @View(title = "Name"),
        edit = @Edit(title = "Name")
    )
    private String name;

}
```
