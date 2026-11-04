# Table Display (afterFetch / extraContent)

Control how the table renders via `afterFetch` and `extraContent`: cell coloring, row-button visibility, and custom content injected above the table.

## Cell Coloring <Badge type="tip" text="1.12.16+" />

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

## Table Row Button Visibility Control <Badge type="tip" text="1.12.16+" />

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest>{

    @Override
    public void afterFetch(Collection<Map<String, Object>> list) {
        int i = 0;
        for (Map<String, Object> map : list) {
            // Parameters: row data, show view button, show edit button, show delete button
            EruptTableStyle.rowPower(map, ++i % 2 == 0, true, true);
        }
    }
    
}
```

## extraContent Custom Content Injection <Badge type="tip" text="v1.14.3+" />

The HTML string returned by `extraContent` is rendered at the top of the table or other view, suitable for displaying summary statistics, announcements, custom charts, and other supplementary information.

In 2.0.0 a second parameter `list` was added, giving direct access to the current page's query results:

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest>{

    @Override
    public String extraContent(List<Condition> conditions, Collection<Map<String, Object>> list) {
        // list = current page data (2.0.0+); conditions = current search filters
        return "<div style='padding:8px 12px;background:#f0f9ff;border-radius:6px'>"
             + "Total: <b>" + list.size() + "</b> records on this page"
             + "</div>";
    }
    
}
```

:::tip
- Return `null` to display nothing (default behavior)
- The `conditions` parameter contains the current page's search conditions, allowing dynamic content rendering
- The `list` parameter (2.0.0+) provides the current page query results for inline statistics
- The return value is raw HTML — avoid XSS risks by never concatenating user input directly
:::

## Related Capabilities

- Appending totals/summary rows: [Custom Rows (Summary Row)](/en/advanced/extra-row)
