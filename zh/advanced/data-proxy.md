# DataProxy 数据代理

提供增、删、改、查、导入、导出、数据初始化等事件触发逻辑接口，**相当于传统开发中的 service 层**。

可以实现如：缓存写入、消息推送、数据校验、RPC 调用、动态赋值等功能！

各能力的详细用法见本分组下的其他文档：

- [CRUD 拦截（before* / after*）](/zh/advanced/data-proxy-crud)：增、改、删前后注入业务逻辑
- [表单校验（validate）](/zh/advanced/data-proxy-validate)：保存前数据校验，不通过则拒绝操作
- [查询条件控制（beforeFetch / searchCondition）](/zh/advanced/data-proxy-query)：查询条件注入与搜索默认值
- [表格展示扩展（afterFetch / extraContent）](/zh/advanced/data-proxy-table)：单元格着色、行按钮控制、内容注入
- [自定义行（extraRow）](/zh/advanced/extra-row)：向表格追加合计、汇总行
- [虚拟字段（@Transient）](/zh/advanced/virtual-field)：非数据库字段的展示与填充
- [表单行为（addBehavior / editBehavior）](/zh/advanced/data-proxy-form)：表单打开时预填与预处理
- [表单视图（FormView）](/zh/advanced/form-view)：独立全页表单，加载与保存完全自定义
- [Excel 导入导出（excel*）](/zh/advanced/data-proxy-excel)：自定义导出文件、校验导入数据
- [打印内容处理（print）](/zh/advanced/data-proxy-print)：自定义打印输出的 HTML 内容
- [通用继承（@PreDataProxy）](/zh/advanced/pre-data-proxy)：通过继承复用 DataProxy 能力

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
