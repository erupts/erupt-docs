# Custom Template TPL

Renders field content using a FreeMarker template, allowing arbitrary HTML to be embedded. Suitable for displaying complex custom content. Requires the `erupt-tpl` module.

![tpl](/field-types/tpl.png)

## Basic Usage

```java
@EruptField(
    edit = @Edit(title = "Custom Content", type = EditType.TPL,
                 tplType = @Tpl(path = "/tpl/custom.ftl"))
)
private String tplField;
```

:::warning
The attribute on `@Edit` is named **`tplType`**, not `tpl`. `tpl` only exists on `@View` and `@RowOperation`.
:::

## Configuration

All attributes of `@Tpl` (`xyz.erupt.annotation.sub_erupt.Tpl`):

| Attribute | Type | Default | Description |
|------|------|--------|------|
| `path` | String | required | Template file path or route address, resolved from the classpath root; supports appending bound variables via `?k=v` |
| `enable` | boolean | `true` | Only honored by the column popup of `@View(tpl = ...)`. The field-level `tplType` is marked `@Transient` and is never sent to the front end, so this attribute has no effect on `EditType.TPL` |
| `engine` | Tpl.Engine | `FreeMarker` | Template engine: `Native` / `FreeMarker` / `Thymeleaf` / `Velocity` / `Beetl` / `Enjoy`. `tplHandler` is not supported in `Native` mode |
| `tplHandler` | Class<? extends Tpl.TplHandler> | `Tpl.TplHandler.class` | Template data binding class implementing `bindTplData(Map, String[])` |
| `params` | String[] | `{}` | Custom parameters passed to `tplHandler` |
| `embedType` | PageEmbedType | `IFRAME` | Page embed mode: `IFRAME` / `MICRO_FRONTEND` |
| `width` | String | `""` | Popup width, unit required, e.g. `500px`, `80%` |
| `height` | String | `""` | Popup height, unit required |
| `openWay` | OpenWay | `MODAL` | Popup open mode: `MODAL` / `DRAWER` / `ROUTER` |
| `drawerPlacement` | Placement | `RIGHT` | Drawer open direction: `TOP` / `BOTTOM` / `LEFT` / `RIGHT` |

:::tip
`width` / `height` / `openWay` / `drawerPlacement` / `embedType` are designed for popup scenarios such as `@RowOperation(tpl = ...)` and `@View(tpl = ...)`. A field-level `EditType.TPL` is embedded directly in the form; its backend render endpoint is `/erupt-api/tpl/html-field/{erupt}/{field}` and it only uses `path` / `engine` / `tplHandler` / `params`.
:::

> Template files are placed in the resources directory; `path` is resolved from the classpath root. See [erupt-tpl module](/en/modules/erupt-tpl) for details.
