# Template Development

A plain HTML page works as soon as it sits in the `tpl` directory. When backend data has to be rendered into the page, give the template a `@TplAction` method that returns a `Map` and pick a template engine.

## Template Engines

erupt-tpl ships adapters for six engines, selected through the `Tpl.Engine` enum:

| Engine | Enum value | Dependency you add yourself |
|---|---|---|
| Plain HTML | `Native` | none, the default |
| FreeMarker | `FreeMarker` | `org.freemarker:freemarker` |
| Thymeleaf | `Thymeleaf` | `org.thymeleaf:thymeleaf` |
| Velocity | `Velocity` | `org.apache.velocity:velocity-engine-core` |
| Beetl | `Beetl` | `com.ibeetl:beetl` |
| JFinal Enjoy | `Enjoy` | `com.jfinal:enjoy` |

All five template engines are `optional` dependencies of erupt-tpl and **are not pulled in transitively**. Add the one you use to your own `pom.xml`; Spring Boot manages the version:

```xml
<dependency>
  <groupId>org.freemarker</groupId>
  <artifactId>freemarker</artifactId>
</dependency>
```

Without the jar, startup still succeeds (the adapter is skipped silently), but rendering a template with that engine throws an assertion such as `FreeMarker jar not found`.

The `Native` engine does one thing: it reads the file as-is and replaces `${base}` with the application contextPath. It parses no other expressions and does not support `tplHandler` data binding.

## Data Binding: @EruptTpl and @TplAction

If the file named by the menu type value also has a `@TplAction` method with the same name, that method runs first and its returned `Map` becomes the template context:

```java
@EruptTpl(engine = Tpl.Engine.FreeMarker)   // engine declared on the class, FreeMarker by default
@Service                                    // must be a Spring bean
public class DashboardTpl {

    @TplAction("dashboard.ftl")             // same as the menu type value
    public Map<String, Object> dashboard() {
        Map<String, Object> map = new HashMap<>();
        map.put("title", "Operations Dashboard");
        map.put("items", Arrays.asList("Orders", "Users", "Products"));
        return map;
    }
}
```

```html
<!-- resources/tpl/dashboard.ftl -->
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body>
<h1>${title}</h1>
<ul>
<#list items as it><li>${it}</li></#list>
</ul>
</body>
</html>
```

<img src="/tpl/freemarker.png" width="700">

Key points:

- `@EruptTpl` goes on the class; its `engine` applies to every `@TplAction` in that class. The class must be Spring-managed and inside Erupt's scan package.
- `@TplAction.value` is **a file name under the `tpl` directory**, matched case-insensitively against the menu type value.
- The method returns `Map<String, Object>`. Under the `Native` engine the return value is ignored and the method may be `void`.
- When no `@TplAction` matches, the file is served as-is through the `Native` engine, so plain HTML and template files can share one directory.

## Paths and Parameters

### Decoupling the File from the Menu Value

By default the template path is `/tpl/<value>`. When several menus share one template, or the filename is awkward as a permission identifier, point `path` at the real file:

```java
@TplAction(value = "sales-report", path = "/tpl/report.ftl")
public Map<String, Object> sales() { ... }
```

The menu type value is then `sales-report` and `/tpl/report.ftl` is rendered. `path` resolves from the classpath root.

### Fixed Parameters

`path` may carry a query string. Its key-value pairs are parsed and put straight into the template context:

```java
@TplAction(value = "report-month", path = "/tpl/report.ftl?type=month")
public Map<String, Object> month() { ... }

@TplAction(value = "report-year", path = "/tpl/report.ftl?type=year")
public Map<String, Object> year() { ... }
```

Use `${type}` in the template to branch. This is the simplest way to serve several menus from one template.

### Multi-Level Paths and Wildcards

The menu type value may contain `/`, for example `report/sales`; the frontend router accepts up to five segments. `@TplAction.value` accepts Ant-style wildcards, so one method can catch a group of paths:

```java
@TplAction(value = "report/*", path = "/tpl/report.ftl")
public Map<String, Object> report() {
    // read the actual request path from request and parse the last segment yourself
    ...
}
```

Permission checks still match the menu type value exactly: `report/sales` and `report/stock` each need their own menu entry. The wildcard saves backend code, not menus.

### Runtime Parameters

Query parameters sent by the browser are not placed into the context automatically. Read them through the injected `request`:

```html
<p>${request.getParameter("id")!""}</p>
```

## Injected Variables

Whatever the engine, these three variables are always present in the context:

| Variable | Description |
|---|---|
| `request` | `HttpServletRequest`: headers, parameters, contextPath, current URI |
| `response` | `HttpServletResponse` |
| `base` | the application contextPath, for building static asset paths; same as `${request.contextPath}` |

The `Map` returned by `@TplAction` is merged with these three; on a name clash the framework-injected value wins. `@View.tpl` additionally injects `row` and `@RowOperation.tpl` injects `rows`, see [@Tpl injected variables](/en/annotation/tpl#pre-injected-template-variables).

:::tip Current user
There is no ready-made `user` variable in the template context. To show the logged-in user, inject `EruptUserService` in the `@TplAction` method, fetch the current user and put it into the `Map`.
:::

## Other Places Templates Are Used

The same engines serve four annotation scenarios. The template files still live in the `tpl` directory, but the entry point is not a menu:

| Scenario | Annotation | Notes |
|---|---|---|
| Form field | `@Edit(type = TPL, tplType = @Tpl(...))` | A custom block inside the form, see [TPL field type](/en/field-types/tpl) |
| Row button dialog | `@RowOperation(tpl = @Tpl(...))` | Selected rows injected as `rows`, see [TPL Template Dialog](/en/annotation/row-operation#tpl-template-dialog) |
| Column popup | `@View(tpl = @Tpl(...))` | Current row injected as `row`, see [@View](/en/annotation/view) |
| Multi-view | `@Vis(tplView = @Tpl(...))` | Switch the list page to a custom view, see [@Vis](/en/annotation/vis) |

These scenarios bind data through `@Tpl.tplHandler` rather than `@TplAction`. See [@Tpl Custom Template](/en/annotation/tpl) for the attribute comparison.
