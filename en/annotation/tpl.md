# Custom Template @Tpl

`@Tpl` is the single annotation Erupt uses to describe every kind of "custom template page". It is never placed on a class or field directly — it always appears as the value of another annotation's attribute, declaring **where the template lives, which engine renders it, and how the rendered result is presented**.

:::tip
Import the [erupt-tpl](/en/modules/erupt-tpl) module first, otherwise no template engine is registered.
:::

## Four Usage Sites

| Host annotation | Attribute | Presentation | Variables available in the template |
|---|---|---|---|
| `@Edit` | `tplType` | An iframe embedded directly in the **form** | none (only `request` / `response` / `base`) |
| `@View` | `tpl` | The table column becomes a link that opens a **popup** | `row` (current row data) |
| `@RowOperation` | `tpl` | A row action button that opens a **popup** | `rows` (array of selected rows) |
| `@Vis` | `tplView` | A **full-page embed** inside a multi-view tab | none (only `request` / `response` / `base`) |

```java
// 1. Field level: template embedded in the form
@EruptField(edit = @Edit(title = "Custom Content", type = EditType.TPL,
        tplType = @Tpl(path = "/tpl/custom.ftl")))
private String tplField;

// 2. Column level: clicking the cell value opens the template
@EruptField(views = @View(title = "Detail", tpl = @Tpl(path = "/tpl/detail.ftl")))
private String detail;
```

```java
// 3. Button level: clicking the button opens the template
// 4. View level: a full-page template inside a multi-view tab
@Entity
@Erupt(
    name = "Example",
    rowOperation = @RowOperation(
        code = "tpl", title = "Template Button", type = RowOperation.Type.TPL,
        tpl = @Tpl(path = "/tpl/operator.ftl", width = "800px")),
    vis = @Vis(
        code = "report", title = "Report", type = Vis.Type.TPL,
        tplView = @Tpl(path = "/tpl/report.ftl", height = "600px"))
)
public class TplDemo extends BaseModel {

}
```

:::warning
The attribute on `@Edit` is named **`tplType`**, not `tpl`; on `@Vis` it is **`tplView`**. Using the wrong name simply will not compile.
:::

## All Attributes

Source of truth: `xyz.erupt.annotation.sub_erupt.Tpl`.

| Attribute | Type | Default | Description |
|---|---|---|---|
| `path` | String | **required** | Template file path or route address, resolved from the classpath root; a trailing `?k=v` query string can be used to append binding variables |
| `enable` | boolean | `true` | Whether the template is enabled |
| `params` | String[] | `{}` | Custom parameters passed to `tplHandler` |
| `tplHandler` | `Class<? extends Tpl.TplHandler>` | `Tpl.TplHandler.class` | Template data binding class implementing `bindTplData(Map, String[])` |
| `engine` | `Tpl.Engine` | `FreeMarker` | Template engine, see the enum below |
| `embedType` | `PageEmbedType` | `IFRAME` | How the popup content is embedded: `IFRAME` / `MICRO_FRONTEND` |
| `width` | String | `""` | Popup width, unit required, e.g. `500px`, `80%` |
| `height` | String | `""` | Popup height, unit required |
| `openWay` | `OpenWay` | `MODAL` | How the template opens: `MODAL` / `DRAWER` / `ROUTER` |
| `drawerPlacement` | `Placement` | `RIGHT` | Drawer direction: `TOP` / `BOTTOM` / `LEFT` / `RIGHT` |

`params`, `tplHandler` and `engine` are marked `@Transient` — they take part in server-side rendering only and are never sent to the frontend.

### Engine

| Value | Description |
|---|---|
| `Native` | Raw HTML, no template parsing; **`tplHandler` is not supported in this mode** |
| `FreeMarker` | Default engine |
| `Thymeleaf` | Thymeleaf |
| `Velocity` | Velocity |
| `Beetl` | Beetl |
| `Enjoy` | JFinal Enjoy |

Engine implementations are registered on demand at startup. If the corresponding jar is not on the classpath, the engine is unavailable and rendering fails at runtime with `XXX jar not found`.

### OpenWay and Placement

| `OpenWay` | Description |
|---|---|
| `MODAL` | Dialog (default); width comes from `width`, falling back to the built-in `modal-lg` |
| `DRAWER` | Drawer; direction comes from `drawerPlacement`, and both `width` and `height` default to `40%` |
| `ROUTER` | No popup — navigates to a frontend route instead. `path` supports `{xxx}` placeholders, replaced at runtime with the same-named field value of the current row |

`Placement` values: `TOP` / `BOTTOM` / `LEFT` / `RIGHT`.

## Which Attributes Apply Where

Not every `@Tpl` attribute is consumed at all four sites:

| Attribute | `@Edit.tplType` | `@View.tpl` | `@RowOperation.tpl` | `@Vis.tplView` |
|---|---|---|---|---|
| `path` / `engine` / `tplHandler` / `params` | yes | yes | yes | yes |
| `enable` | no | **yes** | no | no |
| `openWay` / `embedType` / `drawerPlacement` | no | yes | yes | no |
| `width` | no | yes | yes | no |
| `height` | no | yes | yes | yes |

:::tip Why width/height do not apply at field level
`@Edit.tplType` is marked `@Transient`, so the whole `@Tpl` object is never serialized to the frontend. An `EditType.TPL` field renders as a **height-adaptive inline iframe** inside the form, pointing straight at the backend rendering endpoint `/erupt-api/tpl/html-field/{erupt}/{field}`. `width`, `height`, `openWay`, `drawerPlacement` and `embedType` therefore have nothing to act on — only the server-side attributes `path`, `engine`, `tplHandler` and `params` are meaningful.

`@View.tpl` is the opposite: it must reach the frontend to decide *how the popup opens when the cell is clicked*, which is why `enable` is only really consumed here — setting it to `false` stops the column from becoming a clickable link.
:::

## Binding Data with TplHandler

Beyond the variables the framework injects automatically, `tplHandler` can push arbitrary data into the template. The implementation must be a Spring bean:

```java
@Component
public class ReportTplHandler implements Tpl.TplHandler {

    @Resource
    private EruptDao eruptDao;

    @Override
    public void bindTplData(Map<String, Object> binding, String[] params) {
        // params holds whatever was configured via @Tpl(params = {...})
        binding.put("title", params.length > 0 ? params[0] : "Report");
        binding.put("total", eruptDao.lambdaQuery(EruptUser.class).count());
    }

}
```

```java
@RowOperation(
    code = "report", title = "View Report", type = RowOperation.Type.TPL,
    tpl = @Tpl(
        path = "/tpl/report.ftl",
        engine = Tpl.Engine.FreeMarker,
        tplHandler = ReportTplHandler.class,
        params = {"Monthly Report"}
    )
)
```

## Pre-injected Template Variables

Regardless of the engine, the framework injects the following variables into the template context:

| Variable | Description |
|---|---|
| `request` | The `HttpServletRequest` object |
| `response` | The `HttpServletResponse` object |
| `base` | The application context path, useful for building static resource URLs |
| `row` | Current row data — **`@View.tpl` only** |
| `rows` | Array of selected rows — **`@RowOperation.tpl` only**; not injected when `engine = Native` or the button's `mode = BUTTON` |

In addition, key/value pairs after `?` in `path` are parsed and placed directly into the template context. For example `@Tpl(path = "/tpl/report.ftl?type=month")` makes `${type}` available in the template.

## Related Pages

- [TPL Field Type](/en/field-types/tpl) — field-level usage of `EditType.TPL`
- [@RowOperation](/en/annotation/row-operation) — TPL template popup buttons
- [@View](/en/annotation/view) — column popup templates
- [@Vis](/en/annotation/vis) — the TPL view
- [erupt-tpl module](/en/modules/erupt-tpl) — template directory conventions, hot reload, UI component library
