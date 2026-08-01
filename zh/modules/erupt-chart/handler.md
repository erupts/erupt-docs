# 报表处理类

通过 Java 代码的方式动态处理报表的 SQL 语句与 SQL 执行结果。处理类可在**报表配置**、**图表配置**、**参照维度**中绑定，适合处理数据权限过滤、结果二次加工、导出定制等纯 SQL 难以表达的逻辑。

![](/chart/handler-list.png)

![](/chart/handler-edit.png)

## 配置项说明

| 配置项 | 说明 |
| --- | --- |
| 名称 | 处理类名称 |
| 处理类 | 实现 `EruptReportHandler` 接口的 Spring Bean，下拉列表自动扫描 |
| 处理类参数 | 传给处理类各方法的 `param` 参数，可用于同一处理类的多处复用 |
| 备注 | |

## EruptReportHandler 接口

实现 `xyz.erupt.report.fun.EruptReportHandler` 接口，并注册为 Spring Bean（如 `@Service`），重写所需方法即可：

```java
public interface EruptReportHandler {

    /**
     * 查询表达式动态处理
     *
     * @param param     处理类参数
     * @param condition 查询条件
     * @param expr      查询表达式（SQL）
     * @return 处理后的 SQL
     */
    default String exprHandler(String param, Map<String, Object> condition, String expr) {
        return expr;
    }

    /**
     * 返回结果处理
     *
     * @param param     处理类参数
     * @param condition 查询条件
     * @param result    查询结果
     */
    default void resultHandler(String param, Map<String, Object> condition, List<Map<String, Object>> result) {
    }

    /**
     * 导出 Excel 处理
     *
     * @param param     处理类参数
     * @param condition 查询条件
     * @param workbook  创建好的 POI 对象
     */
    default void exportHandler(String param, Map<String, Object> condition, Workbook workbook) {
    }
}
```

三个方法的执行时机：

- `exprHandler`：SQL 执行前调用，可动态改写 SQL（如追加数据权限条件）
- `resultHandler`：SQL 执行后调用，可对结果集做二次加工
- `exportHandler`：导出 Excel 时调用，可自定义 POI Workbook 样式与内容
