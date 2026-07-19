# Print Content Processing (print)

The DataProxy `print` method is triggered during a print operation. It receives the model and the framework-generated HTML string, and returns the final HTML to render — useful for watermarks, headers/footers, or custom layout.

```java
@Override
public String print(EruptTest model, String content) {
    // Append a watermark to the printed output
    return content + "<div style='color:#ccc;font-size:12px'>Printed by: " + getCurrentUser() + "</div>";
}
```
