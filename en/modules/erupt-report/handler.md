# Report Handlers

Dynamically process report SQL statements and query results with Java code. Handlers can be bound in **Report Configuration**, **Chart Configuration**, and **Reference Dimensions** — ideal for data-permission filtering, result post-processing, and export customization that pure SQL can't express.

![](/report/handler-list.png)

![](/report/handler-edit.png)

## Configuration Options

| Option | Description |
| --- | --- |
| Name | Handler name |
| Handler Class | A Spring bean implementing `EruptReportHandler`; the dropdown is populated automatically |
| Handler Params | The `param` argument passed to every handler method, useful for reusing one handler in multiple places |
| Remark | |

## The EruptReportHandler Interface

Implement `xyz.erupt.report.fun.EruptReportHandler`, register it as a Spring bean (e.g. `@Service`), and override the methods you need:

```java
public interface EruptReportHandler {

    /**
     * Dynamic query expression handler
     *
     * @param param     handler parameter
     * @param condition query conditions
     * @param expr      query expression (SQL)
     * @return processed SQL
     */
    default String exprHandler(String param, Map<String, Object> condition, String expr) {
        return expr;
    }

    /**
     * Result processor
     *
     * @param param     handler parameter
     * @param condition query conditions
     * @param result    query result
     */
    default void resultHandler(String param, Map<String, Object> condition, List<Map<String, Object>> result) {
    }

    /**
     * Excel export handler
     *
     * @param param     handler parameter
     * @param condition query conditions
     * @param workbook  initialized POI workbook
     */
    default void exportHandler(String param, Map<String, Object> condition, Workbook workbook) {
    }
}
```

When each method runs:

- `exprHandler` — before SQL execution; rewrite the SQL dynamically (e.g. append data-permission conditions)
- `resultHandler` — after SQL execution; post-process the result set
- `exportHandler` — during Excel export; customize the POI workbook style and content
