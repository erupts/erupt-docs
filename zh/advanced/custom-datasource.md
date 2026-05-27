# 自定义数据源

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

}
```

**参数说明：**

- `EruptModel`：当前 Erupt 类的元数据，包含类信息、字段列表、注解配置等，通过 `eruptModel.getClazz()` 可获取原始 Class 对象
- `Page`：分页参数，`page.getPageIndex()` 为当前页码（从 1 开始），`page.getPageSize()` 为每页条数，查询完成后需调用 `page.setList(data)` 和 `page.setTotalErupt(total)` 回填结果
- `EruptQuery`：查询条件封装，`eruptQuery.getConditions()` 获取前端传递的筛选条件列表，`eruptQuery.getOrderBy()` 获取排序字段
- `PowerObject`：能力控制对象，通过 `new PowerObject(false, false, false, false)` 可依次关闭查看/新增/编辑/删除能力

### 2. 注册自定义数据源

```java
// 推荐在 Spring 组件的 @PostConstruct 中注册，确保 Spring 容器初始化完成后执行
@Component
public class DataSourceRegister {
    @PostConstruct
    public void init() {
        DataProcessorManager.register("数据源名称", EruptDataServiceImpl.class);
    }
}
```

> 也可以在 `static {}` 块或 `ApplicationRunner` 中注册，但 `@PostConstruct` 更符合 Spring 生命周期规范。

### 3. 在 Erupt 类上添加 @EruptDataProcessor 注解

```java
@EruptDataProcessor("已注册数据源名称")
@Erupt(name = "xxxx")
public class Test {

}
```

## 完整示例：对接 HTTP API

以下示例展示如何将外部 REST 接口的数据展示在 Erupt 表格中：

```java
@Service
public class HttpApiDataService implements IEruptDataService {

    @Resource
    private RestTemplate restTemplate;

    @Override
    public PowerObject power() {
        // 只读数据源，禁用新增、编辑、删除
        return new PowerObject(true, false, false, false);
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
