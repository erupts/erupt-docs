# DataProxy 数据代理

提供增、删、改、查、导入、导出、数据初始化等事件触发逻辑接口，**相当于传统开发中的 service 层**。

可以实现如：缓存写入、消息推送、数据校验、RPC 调用、动态赋值等功能！

## 使用方法

在 `@Erupt` 注解中添加 dataProxy 配置，重写其中的方法即可：

```java
@Erupt(name = "Erupt", dataProxy = EruptTestDataProxy.class)
public class EruptTest extends BaseModel{
    
    @EruptField(
            views = @View(title = "名称"),
            edit = @Edit(title = "名称")
    )
    private String name;
    
}
```

定义实现 DataProxy 接口的类：

```java
@Service // 添加此注解可使用依赖注入相关功能
public class EruptTestDataProxy implements DataProxy<EruptTest>{
    
    @Override
    public void beforeAdd(EruptTest eruptTest) {
        // 数据校验
        if("张三".equals(eruptTest.getName())){
            throw new EruptApiErrorTip("名称禁止为张三！");
        }
    }

    @Override
    public void beforeUpdate(EruptTest eruptTest) {
        // 动态写数据
        eruptTest.setName(eruptTest.getName() + "xxxxxxx");
    }
    
    @Override
    public void afterFetch(Collection<Map<String, Object>> list) {
        // TODO 查询结果动态处理
    }

    @Override
    public Alert alert(List<Condition> conditions) {
        return Alert.info("页面提示信息");
    }
    
}
```

## DataProxy 接口定义

```java
public interface DataProxy<MODEL> {

    /** 数据校验，校验不通过可抛出 EruptException，1.13.1+ 支持 */
    default void validate(MODEL model) throws EruptException { }

    /** 新增前 */
    default void beforeAdd(MODEL model) { }

    /** 新增后 */
    default void afterAdd(MODEL model) { }

    /** 修改前 */
    default void beforeUpdate(MODEL model) { }

    /** 修改后 */
    default void afterUpdate(MODEL model) { }

    /** 删除前 */
    default void beforeDelete(MODEL model) { }

    /** 删除后 */
    default void afterDelete(MODEL model) { }

    /**
     * 查询前动态注入条件
     * @param conditions 前端已传递条件
     * @return 自定义查询条件（JPQL WHERE 子句，不含 WHERE 关键字）
     */
    default String beforeFetch(List<Condition> conditions) { return null; }

    /**
     * 查询结果后置处理
     * @param list 查询结果
     */
    default void afterFetch(Collection<Map<String, Object>> list) { }

    /**
     * 全局页面提示，每次打开页面时触发，返回 null 则不显示提示
     * Alert 支持 info / warning / error / success 四种类型
     */
    default Alert alert(List<Condition> conditions) { return null; }

    /**
     * 自定义渲染 HTML，返回值展示在视图顶部区域
     */
    default String extraContent(List<Condition> conditions, Collection<Map<String, Object>> list) { return null; }

    /**
     * 新增表单打开时触发，可用于设置默认值
     */
    default void addBehavior(MODEL model) { }

    /**
     * 编辑表单打开时触发，可在渲染前对数据进行预处理
     */
    default void editBehavior(MODEL model) { }

    /**
     * 页面加载时触发，设置搜索框默认值
     * Map 的 key 为字段名，value 为默认搜索值
     */
    default void searchCondition(Map<String, Object> condition) { }

    /**
     * Excel 导出后触发，参数需强转为 Apache POI Workbook 对象，可自定义导出内容
     */
    default void excelExport(Object workbook) { }

    /**
     * Excel 导入时触发（原始 POI 阶段），参数需强转为 Apache POI Workbook 对象
     */
    default void excelImport(Object workbook) { }

    /**
     * Excel 导入数据解析后触发（结构化阶段），可对 list 进行校验或批量修改
     */
    default void excelImportProcess(List<MODEL> list) { }

    /**
     * 打印时触发，返回修改后的 HTML 内容字符串
     */
    default String print(MODEL model, String content) { return content; }

    /**
     * 返回额外的表格行（如合计行），追加在正常数据行之后
     */
    default List<Row> extraRow(List<Condition> conditions) { return null; }

    /**
     * 独立表单视图：打开时触发，从数据源加载数据并填充 model
     */
    default void formViewBehavior(MODEL model) { }

    /**
     * 独立表单视图：字段校验通过后触发，将 model 持久化到数据源
     * 抛出 EruptException 可中止保存并向用户显示错误信息
     */
    default void formSave(MODEL model) throws EruptException { }

}
```

## beforeFetch 条件注入

`beforeFetch` 返回值为 JPQL（HQL）的 WHERE 子句，**不包含 `WHERE` 关键字**，框架会自动拼接。

```java
@Override
public String beforeFetch(List<Condition> conditions) {
    // 只查询当前登录用户自己的数据
    String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
    return "createBy = '" + currentUser + "'";
}
```

支持的语法示例：

| 场景 | 返回值示例 |
| --- | --- |
| 等于 | `"status = 1"` |
| 范围 | `"age between 18 and 60"` |
| 模糊 | `"name like '%张%'"` |
| IN | `"id in (1, 2, 3)"` |
| 关联属性 | `"dept.id = 10"` |
| 多条件 | `"status = 1 and deleteFlag = 0"` |
| 子查询 | `"id in (select userId from t_order where amount > 100)"` |

> 注意：这里是 JPQL 而非原生 SQL，字段名应使用 Java 实体属性名（驼峰），而非数据库列名。

## validate() 与 before* 的区别

| | `validate()` | `beforeAdd()` / `beforeUpdate()` |
|---|---|---|
| 用途 | 数据校验，不通过则拒绝操作 | 在保存前修改数据或执行业务逻辑 |
| 适用版本 | 1.13.1+ | 全版本 |
| 推荐场景 | 格式校验、业务规则校验 | 自动填充字段、调用外部服务 |

```java
@Override
public void validate(EruptTest model) throws EruptException {
    // 推荐：用于纯校验逻辑，不修改数据
    if (model.getEndDate().before(model.getStartDate())) {
        throw new EruptApiErrorTip("结束时间不能早于开始时间");
    }
}

@Override
public void beforeAdd(EruptTest model) {
    // 推荐：用于修改/补充数据
    model.setCreateBy(getCurrentUser());
}
```

## DataProxy 上下文信息获取

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest>{
    
    @Override
    public void afterFetch(Collection<Map<String, Object>> list) {
        // 获取当前操作的 Erupt 类信息（如 EruptTest.class）
        Class<?> clazz = DataProxyContext.currentClass();
        // 获取 @Erupt dataProxy 中 params 参数传入的值（字符串数组）
        String[] params = DataProxyContext.params();
        // 获取当前 HTTP 请求对象
        HttpServletRequest request = DataProxyContext.get(HttpServletRequest.class);
    }
    
}
```

`DataProxyContext` 主要方法：

| 方法 | 返回值 | 说明 |
| --- | --- | --- |
| `currentClass()` | `Class<?>` | 当前 Erupt 实体类 |
| `params()` | `String[]` | `@Erupt(dataProxy = {X.class, params = {"a","b"}})` 中的 params |
| `get(Class<T>)` | `T` | 从 Spring 上下文获取 Bean |

## 单元格着色

> 1.12.16 及以上版本支持

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

## 表格行按钮显示控制

> 1.12.16 及以上版本支持

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest>{

    @Override
    public void afterFetch(Collection<Map<String, Object>> list) {
        int i = 0;
        for (Map<String, Object> map : list) {
            // 参数说明：行数据，查看详情是否显示，编辑按钮是否显示，删除按钮是否显示
            EruptTableStyle.rowPower(map, ++i % 2 == 0, true, true);
        }
    }
    
}
```

## extraContent 自定义内容注入 <Badge type="tip" text="v1.14.3+" />

`extraContent` 方法返回的 HTML 字符串将渲染到表格或其他视图的顶部区域，适合用于展示统计摘要、公告提示、自定义图表等补充信息。

2.0.0 起方法签名增加第二个参数 `list`，可直接访问当前页查询结果：

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest>{

    @Override
    public String extraContent(List<Condition> conditions, Collection<Map<String, Object>> list) {
        // list 为当前页数据（2.0.0+），conditions 为搜索条件
        return "<div style='padding:8px 12px;background:#f0f9ff;border-radius:6px'>"
             + "📊 当前共 <b>" + list.size() + "</b> 条记录"
             + "</div>";
    }
    
}
```

:::tip
- 返回 `null` 时不展示任何内容（默认行为）
- `conditions` 参数为当前页面的搜索条件，可据此动态渲染内容
- `list` 参数（2.0.0+）为当前页查询结果，可直接读取展示统计信息
- 返回内容为原始 HTML，注意避免 XSS 风险，不要直接拼接用户输入
:::

## addBehavior / editBehavior 表单行为

- **`addBehavior`**：打开新增表单时触发，框架会先实例化一个空对象再调用此方法，可用于设置默认值。
- **`editBehavior`**：打开编辑表单时触发，框架从数据库加载完数据后调用，可在渲染前对字段进行预处理或动态替换。

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest> {

    @Override
    public void addBehavior(EruptTest model) {
        // 新增表单打开时预填默认值
        model.setStatus("DRAFT");
        model.setCreator(getCurrentUser());
    }

    @Override
    public void editBehavior(EruptTest model) {
        // 编辑表单打开时对字段进行预处理（不会持久化，仅影响表单展示）
        if (model.getContent() != null) {
            model.setContent(decrypt(model.getContent()));
        }
    }
}
```

## searchCondition 搜索默认值

页面加载时触发，可为搜索框预设默认值。Map 的 key 为实体字段名，value 为默认搜索值。

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest> {

    @Override
    public void searchCondition(Map<String, Object> condition) {
        // 默认筛选当前登录用户的数据
        condition.put("createBy", getCurrentUser());
        // 默认状态为"启用"
        condition.put("status", 1);
    }
}
```

## extraRow 自定义附加行

返回额外的 `Row` 对象列表，追加在表格正常数据行之后，常用于展示合计行、汇总行。

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest> {

    @Override
    public List<Row> extraRow(List<Condition> conditions) {
        // 构造一个合计行
        return List.of(
            Row.builder()
               .columns(List.of(
                   new Column("合计"),
                   new Column(String.valueOf(calcTotal(conditions)), 3)
               ))
               .className("total-row")
               .build()
        );
    }
}
```

`Row` / `Column` 结构：

| 字段 | 类型 | 说明 |
|---|---|---|
| `Row.columns` | `List<Column>` | 该行的单元格列表 |
| `Row.className` | `String` | 行的 CSS class（可选） |
| `Column.value` | `String` | 单元格内容（支持 HTML） |
| `Column.colspan` | `int` | 列合并数，默认 1 |
| `Column.className` | `String` | 单元格 CSS class（可选） |

## Excel 导出 / 导入

> 需引入 `erupt-excel` 模块

### excelExport — 自定义导出文件

Excel 文件生成完毕后触发，参数为 Apache POI `Workbook` 对象，可修改样式、追加 Sheet 等。

```java
@Override
public void excelExport(Object workbook) {
    Workbook wb = (Workbook) workbook;
    Sheet sheet = wb.getSheetAt(0);
    // 在第一行前插入标题
    sheet.shiftRows(0, sheet.getLastRowNum(), 1);
    Row titleRow = sheet.createRow(0);
    titleRow.createCell(0).setCellValue("数据导出报表");
}
```

### excelImport — 原始 POI 阶段处理

Excel 文件上传后、数据解析前触发，参数同为 `Workbook`，可做预校验或格式修正。

```java
@Override
public void excelImport(Object workbook) {
    Workbook wb = (Workbook) workbook;
    // 校验 Sheet 数量
    if (wb.getNumberOfSheets() < 1) {
        throw new EruptApiErrorTip("Excel 文件格式错误");
    }
}
```

### excelImportProcess — 结构化数据阶段处理

Excel 数据已解析为 Model 列表后触发，可对每条记录进行批量校验或补充字段。

```java
@Override
public void excelImportProcess(List<EruptTest> list) {
    for (EruptTest item : list) {
        if (item.getName() == null || item.getName().isBlank()) {
            throw new EruptApiErrorTip("导入数据中存在名称为空的记录，请检查后重试");
        }
        item.setCreateBy(getCurrentUser());
    }
}
```

## print 打印内容处理

打印操作时触发，接收当前 model 和框架生成的 HTML 内容字符串，返回最终要渲染的 HTML。

```java
@Override
public String print(EruptTest model, String content) {
    // 在打印内容末尾追加水印
    return content + "<div style='color:#ccc;font-size:12px'>打印人：" + getCurrentUser() + "</div>";
}
```

---

## 通用继承 @PreDataProxy

在 erupt 中可以通过继承，获取父类的组件的能力，也支持通过继承执行父组件预定义的方法。

```java
public @interface PreDataProxy {

    Class<? extends DataProxy<?>> value();

}
```

`PreDataProxy` 支持多级继承，也可以修饰在接口上。

### 代码示例

继承 `HyperModel` 不仅可以使用创建人、创建时间、修改人、修改时间字段，还可以自动的将这些值注入，原理是 `HyperModel` 类上存在有 `@PreDataProxy` 注解：

```java
@PreDataProxy(HyperDataProxy.class)
@MappedSuperclass
public class MetaModelVo extends BaseModel {

    @EruptField(
            views = @View(title = "创建人", width = "100px"),
            edit = @Edit(title = "创建人", readonly = @Readonly)
    )
    private String createBy;

    @EruptField(
            views = @View(title = "创建时间", sortable = true),
            edit = @Edit(title = "创建时间", readonly = @Readonly, dateType = @DateType(type = DateType.Type.DATE_TIME))
    )
    private LocalDateTime createTime;

    // ... 更多字段
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

调用 TestModel 则会自动执行 HyperDataProxy 的对应方法：

```java
@Entity
@Erupt
public class TestModel extends MetaModelVo {
    
}
```
