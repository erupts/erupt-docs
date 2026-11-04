# 自定义数据源（EruptDataService）

如果你希望用 Erupt 管理数据库以外的数据，可以使用自定义数据源的方式实现。

## 使用场景

- 外部 API 接口的显示与处理（HTTP、Dubbo）
- CSV、TSV 等数据文件的可视化管理
- 对接其他外部数据源，如 ES、MongoDB

## 使用方法

::: tip 大多数场景不需要从零实现 IEruptDataService
如果你的数据源只能「把行整体捞出来」（文件、REST 接口、SaaS 表格、目录服务、对象存储……），请优先继承 [`EruptBeanDataService`](#更省事的做法-继承-eruptbeandataservice)：只需实现一个 `data()` 方法，条件求值、排序、分页、下钻全部由基类完成。
:::

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

## 更省事的做法：继承 EruptBeanDataService

直接实现 `IEruptDataService` 意味着条件求值、`conditionStrings` 解析、排序、分页都要自己写一遍，工作量与出错概率都不小。

`xyz.erupt.core.service.EruptBeanDataService<T>` 是官方为「能枚举出全部行」的数据源准备的骨架类：**只需实现一个 `data()` 方法**，其余全部由基类完成。erupt-data 的 13 个数据源中有 10 个基于它（http、file、es、s3、k8s、ldap、redis、feishu、notion、memory），只有 jpa、jdbc、mongodb 三个直接实现 `IEruptDataService`。

```java
public abstract class EruptBeanDataService<T> implements IEruptDataService {

    /** 唯一必须实现的方法：把数据捞成 Bean（或 Map）列表 */
    protected abstract List<T> data(EruptModel eruptModel, EruptQuery eruptQuery);

    /** data() 是否已在数据源侧完成条件过滤；返回 true 时基类跳过内存二次过滤 */
    protected boolean conditionsPushedDown() {
        return false;
    }
}
```

### 基类替你做的事

| 能力 | 说明 |
| --- | --- |
| 条件求值 | `EQ`、`NEQ`、`GT`、`GTE`、`LT`、`LTE`、`LIKE`、`NOT_LIKE`、`RANGE`、`IN`、`NOT_IN`、`NULL`、`NOT_NULL` 全部在内存中求值，语义与 JPA 实现对齐 |
| conditionStrings 解析 | 自动解析 `@Filter` 与 `@Link` 下钻产生的 `Entity.field = 'value'` 等值片段；更复杂的表达式会被忽略（与 mongodb 实现行为一致） |
| 类型对齐 | 前端传来的条件值是字符串，基类按字段声明类型转换后再比较，避免数字 / 日期比较错乱 |
| 排序 | `page.getSort()` 为空时回退到 `@Erupt(orderBy = ...)` |
| 分页 | 在过滤后的结果集上做内存分页，并回填 `total` |
| Bean ↔ Row | 反射把 Bean 转成前端需要的行 Map；`T` 为 `Map` 时直接透传，`findDataById` 命中 Map 行会通过 `toModel()` 物化为模型实例 |
| 写操作 | `addData` / `editData` / `deleteData` 默认抛出只读异常，能写的子类自行覆盖 |

### conditionsPushedDown()

默认返回 `false`，基类会在内存中再过滤一遍。如果你的 `data()` 已经把 `EruptQuery` 的条件下推到了数据源侧（例如拼成 ES 的 `_search` 查询），**必须覆写为 `true`**，否则会二次过滤——两侧语义（分词、大小写、时区）往往不一致，容易把本该命中的行再筛掉。

erupt-data 中只有 `EruptEsDataService` 覆写为 `true`。

### 最小示例

```java
@Service
public class WeatherDataService extends EruptBeanDataService<Weather> {

    public static final String DATA_PROCESSOR = "WEATHER";

    static {
        DataProcessorManager.register(DATA_PROCESSOR, WeatherDataService.class);
    }

    @Resource
    private WeatherClient weatherClient;

    // 唯一需要实现的方法：把数据捞成 Bean 列表
    // 筛选 / 排序 / 分页 / 下钻全部由基类处理
    @Override
    protected List<Weather> data(EruptModel eruptModel, EruptQuery eruptQuery) {
        return weatherClient.listAll();
    }
}
```

对应的模型：

```java
@Getter
@Setter
@Erupt(name = "天气", primaryKeyCol = "city",
       power = @Power(add = false, edit = false, delete = false))
@EruptDataProcessor(WeatherDataService.DATA_PROCESSOR)
public class Weather {

    @EruptField(views = @View(title = "城市"), edit = @Edit(title = "城市", search = @Search))
    private String city;

    @EruptField(views = @View(title = "温度"))
    private Double temperature;

    @EruptField(views = @View(title = "观测时间"))
    private Date observedAt;
}
```

这样就得到了一张可搜索、可排序、可分页、可导出的只读表格。若数据源也支持写入，再覆写 `addData` / `editData` / `deleteData` 即可，可参考 `EruptFileDataService`（读写文件）与 `EruptMemoryRepository`（内存 CRUD）。

:::warning 写操作默认只读，但按钮仍会显示
未覆写时 `addData` / `editData` / `deleteData` 会抛出只读异常。注意基类**没有**覆写 `power()`，所以 UI 上的新增 / 修改 / 删除按钮照常渲染，用户点进去提交后才会看到报错。只读数据源请在模型上显式声明 `@Erupt(power = @Power(add = false, edit = false, delete = false))`，或在自己的服务类中覆写 `power()`。
:::

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
