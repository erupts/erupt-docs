# Custom Data Source (EruptDataService)

If you want to use Erupt to manage data that lives outside a relational database, you can implement a custom data source.

## Use Cases

- Displaying and managing data from external APIs (HTTP, Dubbo)
- Visual management of CSV, TSV, and other data files
- Integrating other external data sources such as Elasticsearch or MongoDB

## How to Use

::: tip Most cases don't need IEruptDataService from scratch
If your source can only hand you whole rows (files, REST endpoints, SaaS tables, directory servers, object storage, ...), prefer extending [`EruptBeanDataService`](#the-easier-route-extend-eruptbeandataservice): implement a single `data()` method and the base class handles condition evaluation, sorting, paging and drill-down for you.
:::

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

    /** Batch insert. The default implementation calls addData one by one — override it for a real bulk write. */
    default void batchAddData(EruptModel eruptModel, List<?> objects) {
        for (Object o : objects) this.addData(eruptModel, o);
    }

    /** Batch delete. The default implementation calls deleteData one by one — override as needed. */
    default void batchDelete(EruptModel eruptModel, List<?> objects) {
        for (Object o : objects) this.deleteData(eruptModel, o);
    }

}
```

**Parameter reference:**

- `EruptModel`: Metadata for the current Erupt class, including class info, field list, and annotation config. Use `eruptModel.getClazz()` to get the raw `Class` object.
- `Page`: Pagination parameters. `page.getPageIndex()` is the current page number (1-based); `page.getPageSize()` is the page size. After querying, call `page.setList(data)` and `page.setTotal(total)` to fill the results (`setTotal` takes a `Long` and computes `totalPage` for you).
- `EruptQuery`: Query condition wrapper. `eruptQuery.getConditions()` returns the filter conditions passed from the frontend, `eruptQuery.getConditionStrings()` returns condition expression strings, and `eruptQuery.getSort()` returns the sort info (the same list as `page.getSort()`).
- `PowerObject`: Capability control object. It only has the `PowerObject()` and `PowerObject(Power)` constructors, and exposes 10 capability flags (`add`, `edit`, `delete`, `query`, `viewDetails`, `export`, `importable`, `print`, `copy`, `ai`), all `true` by default. Use the setters to turn individual flags off.

::: warning Always handle conditionStrings
`getConditionStrings()` carries the conditions contributed by `@Filter`, `@Link` drill-down, `@LinkTree` tree linkage, and `DataProxy.beforeFetch()`. If your implementation only handles `getConditions()` and ignores `getConditionStrings()`, drill-down and `@Filter` will silently stop working.
:::

### 2. Register the Custom Data Source

```java
// Recommended: register in a static {} block of the implementation class,
// which is what all 13 official data sources do.
@Service
public class EruptDataServiceImpl implements IEruptDataService {

    public static final String DATA_PROCESSOR = "datasource-name";

    static {
        DataProcessorManager.register(DATA_PROCESSOR, EruptDataServiceImpl.class);
    }

    // ...
}
```

::: tip Why static {} instead of @PostConstruct
`DataProcessorManager` is backed by a plain `HashMap`, and the registry may be read while Erupt models are being resolved — earlier than the `@PostConstruct` callback of a Spring bean. Registering in `@PostConstruct` or an `ApplicationRunner` can work, but risks the registry being read before your entry is present, so it is not recommended.
:::

### 3. Add the @EruptDataProcessor Annotation to the Erupt Class

```java
@EruptDataProcessor("registered-datasource-name")
@Erupt(name = "xxxx")
public class Test {

}
```

> Without `@EruptDataProcessor`, Erupt falls back to the processor named `"JPA"` (`EruptConst.DEFAULT_DATA_PROCESSOR`), i.e. the implementation shipped by `erupt-data-jpa`.

## The Easier Route: Extend EruptBeanDataService

Implementing `IEruptDataService` directly means re-writing condition evaluation, `conditionStrings` parsing, sorting and paging yourself — a lot of work, and easy to get subtly wrong.

`xyz.erupt.core.service.EruptBeanDataService<T>` is the official skeleton for data sources that can enumerate all of their rows: **you only implement a single `data()` method** and the base class does the rest. 10 of the 13 data sources under erupt-data are built on it (http, file, es, s3, k8s, ldap, redis, feishu, notion, memory); only jpa, jdbc and mongodb implement `IEruptDataService` directly.

```java
public abstract class EruptBeanDataService<T> implements IEruptDataService {

    /** The only method you must implement: fetch the data as a list of beans (or maps) */
    protected abstract List<T> data(EruptModel eruptModel, EruptQuery eruptQuery);

    /** Whether data() already filtered by the query's conditions at the source.
     *  When true, the base class skips its in-memory re-evaluation. */
    protected boolean conditionsPushedDown() {
        return false;
    }
}
```

### What the Base Class Handles for You

| Capability | Details |
| --- | --- |
| Condition evaluation | `EQ`, `NEQ`, `GT`, `GTE`, `LT`, `LTE`, `LIKE`, `NOT_LIKE`, `RANGE`, `IN`, `NOT_IN`, `NULL`, `NOT_NULL` are all evaluated in memory, with the same semantics as the JPA implementation |
| conditionStrings parsing | Parses the `Entity.field = 'value'` equality fragments produced by `@Filter` and `@Link` drill-down; anything more complex is ignored (same behavior as the mongodb implementation) |
| Type alignment | Frontend condition values arrive as strings; the base class coerces them to the declared field type before comparing, so numeric / date comparisons behave correctly |
| Sorting | Falls back to `@Erupt(orderBy = ...)` when `page.getSort()` is empty |
| Paging | Pages the filtered result set in memory and fills in `total` |
| Bean ↔ Row | Reflects a bean into the row map the frontend expects; when `T` is a `Map` it is passed through as-is, and `findDataById` materializes a matched map row into a model instance via `toModel()` |
| Writes | `addData` / `editData` / `deleteData` throw a read-only error by default — override them in subclasses that can actually write |

### conditionsPushedDown()

Defaults to `false`, meaning the base class re-filters in memory. If your `data()` already pushed the `EruptQuery` conditions down to the source (for example by translating them into an ES `_search` query), you **must** override it to return `true`. Otherwise the rows are filtered twice, and the two sides rarely agree (analysis, case sensitivity, time zones), so legitimately matching rows get dropped.

`EruptEsDataService` is the only implementation in erupt-data that overrides it to `true`.

### Minimal Example

```java
@Service
public class WeatherDataService extends EruptBeanDataService<Weather> {

    public static final String DATA_PROCESSOR = "WEATHER";

    static {
        DataProcessorManager.register(DATA_PROCESSOR, WeatherDataService.class);
    }

    @Resource
    private WeatherClient weatherClient;

    // The only method you need to implement: fetch the data as a list of beans.
    // Filtering / sorting / paging / drill-down are all handled by the base class.
    @Override
    protected List<Weather> data(EruptModel eruptModel, EruptQuery eruptQuery) {
        return weatherClient.listAll();
    }
}
```

And the corresponding model:

```java
@Getter
@Setter
@Erupt(name = "Weather", primaryKeyCol = "city",
       power = @Power(add = false, edit = false, delete = false))
@EruptDataProcessor(WeatherDataService.DATA_PROCESSOR)
public class Weather {

    @EruptField(views = @View(title = "City"), edit = @Edit(title = "City", search = @Search))
    private String city;

    @EruptField(views = @View(title = "Temperature"))
    private Double temperature;

    @EruptField(views = @View(title = "Observed At"))
    private Date observedAt;
}
```

That gives you a read-only table that is searchable, sortable, pageable and exportable. If the source also supports writes, override `addData` / `editData` / `deleteData` — see `EruptFileDataService` (read/write files) and `EruptMemoryRepository` (in-memory CRUD) for reference.

:::warning Writes are read-only by default — but the buttons still show
Unless overridden, `addData` / `editData` / `deleteData` throw a read-only error. Note that the base class does **not** override `power()`, so the add / edit / delete buttons still render in the UI and the user only sees the error after submitting. For a read-only source, declare `@Erupt(power = @Power(add = false, edit = false, delete = false))` on the model, or override `power()` in your own service class.
:::

## Complete Example: Integrating an HTTP API

The following example shows how to display data from an external REST API in an Erupt table:

```java
@Service
public class HttpApiDataService implements IEruptDataService {

    static {
        DataProcessorManager.register("http-api", HttpApiDataService.class);
    }

    @Resource
    private RestTemplate restTemplate;

    @Override
    public PowerObject power() {
        // Read-only data source — disable add, edit, and delete
        PowerObject power = new PowerObject();
        power.setAdd(false);
        power.setEdit(false);
        power.setDelete(false);
        return power;
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
        page.setTotal(((Number) result.get("total")).longValue());
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
