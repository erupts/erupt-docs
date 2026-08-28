# 自定义数据源（EruptDataService）

如果你希望用 Erupt 管理数据库以外的数据，可以使用自定义数据源的方式实现。

## 使用场景

- 外部 API 接口的显示与处理（HTTP、Dubbo）
- CSV、TSV 等数据文件的可视化管理
- 对接其他外部数据源，如 ES、MongoDB

## 使用方法

### 1. 实现 IEruptDataService 接口

```java
public interface IEruptDataService {

    /**
     * 全局控制数据源的功能能力（1.12.12 及以上版本支持）
     * 如当前数据源是只读的，可在此关闭新增/编辑/删除，无需在 @Erupt → @Power 处重复声明
     */
    default PowerObject power() {
        return new PowerObject();
    }

    /** 根据主键 id 获取单条数据，用于编辑回显 */
    Object findDataById(EruptModel eruptModel, Object id);

    /** 查询分页数据，用于列表展示 */
    Page queryList(EruptModel eruptModel, Page page, EruptQuery eruptQuery);

    /** 根据列查询关联数据，用于下拉选择等场景 */
    Collection<Map<String, Object>> queryColumn(EruptModel eruptModel, List<Column> columns, EruptQuery eruptQuery);

    /** 新增数据 */
    void addData(EruptModel eruptModel, Object object);

    /** 修改数据 */
    void editData(EruptModel eruptModel, Object object);

    /** 删除数据 */
    void deleteData(EruptModel eruptModel, Object object);

    /** 批量新增，默认实现为逐条调用 addData，可按需重写为真正的批量写入 */
    default void batchAddData(EruptModel eruptModel, List<?> objects) {
        for (Object o : objects) this.addData(eruptModel, o);
    }

    /** 批量删除，默认实现为逐条调用 deleteData，可按需重写 */
    default void batchDelete(EruptModel eruptModel, List<?> objects) {
        for (Object o : objects) this.deleteData(eruptModel, o);
    }

}
```

**参数说明：**

- `EruptModel`：当前 Erupt 类的元数据，包含类信息、字段列表、注解配置等，通过 `eruptModel.getClazz()` 可获取原始 Class 对象
- `Page`：分页参数，`page.getPageIndex()` 为当前页码（从 1 开始），`page.getPageSize()` 为每页条数，查询完成后需调用 `page.setList(data)` 和 `page.setTotal(total)` 回填结果（`setTotal` 接收 `Long`，并会自动计算 `totalPage`）
- `EruptQuery`：查询条件封装，`eruptQuery.getConditions()` 获取前端传递的筛选条件列表，`eruptQuery.getConditionStrings()` 获取条件表达式字符串，`eruptQuery.getSort()` 获取排序信息（与 `page.getSort()` 同源）
- `PowerObject`：能力控制对象，只有 `PowerObject()` 与 `PowerObject(Power)` 两个构造器，共 10 个能力位（`add`、`edit`、`delete`、`query`、`viewDetails`、`export`、`importable`、`print`、`copy`、`ai`），默认全部为 `true`，需要关闭时用 setter 逐个设置

::: warning 务必处理 conditionStrings
`getConditionStrings()` 承载了 `@Filter`、`@Link` 下钻、`@LinkTree` 树形联动以及 `DataProxy.beforeFetch()` 追加的条件。自定义实现如果只处理 `getConditions()` 而忽略 `getConditionStrings()`，下钻与 `@Filter` 将全部失效。
:::

### 2. 注册自定义数据源

```java
// 推荐在实现类的 static {} 块中注册，与官方 13 个数据源保持一致
@Service
public class EruptDataServiceImpl implements IEruptDataService {

    public static final String DATA_PROCESSOR = "数据源名称";

    static {
        DataProcessorManager.register(DATA_PROCESSOR, EruptDataServiceImpl.class);
    }

    // ...
}
```

::: tip 为什么用 static {} 而不是 @PostConstruct
`DataProcessorManager` 内部是一个普通 `HashMap`，解析 Erupt 模型时就可能读取注册表，时机早于 Spring Bean 的 `@PostConstruct` 回调。用 `@PostConstruct` 或 `ApplicationRunner` 注册虽然也能工作，但存在「读取时尚未注册」的时机风险，不推荐。
:::

### 3. 在 Erupt 类上添加 @EruptDataProcessor 注解

```java
@EruptDataProcessor("已注册数据源名称")
@Erupt(name = "xxxx")
public class Test {

}
```

> 不写 `@EruptDataProcessor` 时，Erupt 默认使用名为 `"JPA"` 的处理器（`EruptConst.DEFAULT_DATA_PROCESSOR`），即 `erupt-data-jpa` 提供的实现。

## 完整示例：对接 HTTP API

以下示例展示如何将外部 REST 接口的数据展示在 Erupt 表格中：

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
        // 只读数据源，禁用新增、编辑、删除
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
        // 构建请求参数
        String url = "https://api.example.com/items?page=" + page.getPageIndex()
                   + "&size=" + page.getPageSize();
        
        // 调用外部接口
        Map<String, Object> result = restTemplate.getForObject(url, Map.class);
        
        // 回填分页结果
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

对应的 Erupt 类定义：

```java
@EruptDataProcessor("http-api")
@Erupt(name = "外部接口数据")
public class HttpApiModel {

    @EruptField(
        views = @View(title = "ID"),
        edit = @Edit(title = "ID")
    )
    private Long id;

    @EruptField(
        views = @View(title = "名称"),
        edit = @Edit(title = "名称")
    )
    private String name;

}
```
