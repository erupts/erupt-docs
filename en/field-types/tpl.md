# Custom Template TPL

Renders field content using a FreeMarker template, allowing arbitrary HTML to be embedded. It is also the general extension point of erupt's field system: by reading and writing form values through the [form bridge](#talking-to-the-form), it can implement **any custom editing component** the framework does not ship natively. Requires the `erupt-tpl` module.

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

## Building Any Custom Component

Combined with the [form bridge](#talking-to-the-form) below, TPL is not merely "render some custom HTML" — it is the **general extension point** of erupt's field system: any editor the framework does not ship natively can be written as a TPL and behave just like a native field.

The key is that **a TPL field's value makes the full round trip** — it takes part in reading and submitting the form exactly like INPUT or TEXTAREA, rather than being a read-only display area. So a TPL field gets every capability a native field has:

| Capability | How |
|------|------|
| Read its own persisted value | `formData[fieldName]` in `erupt-tpl:init` is the field's current value (empty when adding) |
| Write its own value and have it saved with the form | Send `erupt-tpl:set` with `{formData: {'fieldName': value}}`; it is persisted alongside the other fields |
| React to other fields | Listen to `erupt-tpl:change` for all form values; use `editExpr` to rewrite other fields' edit config |
| Tell add / edit / read-only apart | `mode` and `readonly` in the `init` message |
| Fit its own height | Report `erupt-tpl:height` yourself |

### Custom Component Skeleton

On the Java side it is an ordinary field; storing JSON is enough:

```java
@Column(columnDefinition = "text")
@EruptField(
    views = @View(title = "Structure"),
    edit = @Edit(title = "Structure", type = EditType.TPL,
                 tplType = @Tpl(path = "/tpl/mind-map.ftl"))
)
private String mindMap;
```

The template is written as a controlled component:

```html
<div id="editor"></div>

<script>
    var FIELD = null;

    window.addEventListener('message', function (e) {
        var data = e.data || {};
        if (data.type !== 'erupt-tpl:init') return;
        FIELD = data.fieldName;
        // 1. Initialize your component from the persisted value
        renderEditor(data.formData[FIELD], data.readonly);
    });

    // 2. Whenever your component changes, write the new value back to the form
    function onEditorChange(value) {
        var patch = {};
        patch[FIELD] = JSON.stringify(value);
        parent.postMessage({type: 'erupt-tpl:set', formData: patch}, '*');
    }
</script>
```

When Save is clicked, the field is submitted together with the rest of the form, and the back end receives exactly the value the template wrote back.

### Scenarios That Fit TPL

- Structured editors such as mind maps, flow charts and topology diagrams
- Map pinning, polygon drawing, route plotting
- Custom editing panels for drag-and-drop layouts, kanban boards, gantt bars
- Image cropping / annotation, handwriting and formula editors
- Interactive components that must embed a third-party SDK directly
- Live cross-field calculation panels (quotes, configurators, preview cards)

:::tip
Rule of thumb: for a **widely useful** component (one most projects would want), open an issue to get it built in as a native EditType and gain the full package — search, Excel import/export, designer support. For **business-specific** interactions, ship a TPL: no waiting for a release, and no long-term maintenance burden added to the framework.
:::

:::warning
A TPL field takes no part in condition search or Excel import/export, and the list page will not render its value automatically. To show it in the list, handle it with the `template` or `tpl` attribute of [@View](/en/annotation/view).
:::

## Talking to the Form <Badge type="tip" text="2.1.2+" />

`EditType.TPL` is embedded as an iframe, so by default the template cannot see the values of the other fields in the form. The front end provides a `postMessage` bridge for field-level TPL: a template can **read all current form values**, **watch them change**, and **write back** into the form.

:::info
This bridge serves **field-level `EditType.TPL`** only, which is always embedded as an iframe. The `embedType = MICRO_FRONTEND` of `@Tpl` applies only to popup and page-level TPL (`@RowOperation(tpl = ...)`, `@View(tpl = ...)`, TPL menus) — those are not inside a form to begin with, so there is no form to talk to.
:::

### Message Protocol

Form → template:

| Message type | When | Payload |
|------|------|------|
| `erupt-tpl:init` | Sent right after the iframe finishes loading; also the reply to `erupt-tpl:get` | `eruptName` / `fieldName` / `mode` / `readonly` / `formData` |
| `erupt-tpl:change` | Any field value in the form changed (debounced by 100ms) | Same as above |

Template → form:

| Message type | Purpose | Payload |
|------|------|------|
| `erupt-tpl:get` | Ask for the latest form values; the form replies with `erupt-tpl:init` | — |
| `erupt-tpl:set` | Write back into the form | `formData?` / `editExpr?` |
| `erupt-tpl:height` | Report your own height so the form can resize the iframe | `height` (number, px) |

Notes:

- `formData` has the same shape as the form object submitted by the add/edit request, keyed by field name.
- `mode` is `ADD` or `EDIT`, and `readonly` tells whether the form is read-only, so the template can switch its own editable state.
- The `editExpr` of `erupt-tpl:set` has the same semantics as the return value of [BUTTON](/en/field-types/button): the key is a field name and the value is a snippet of JS taking `edit` as its argument, used to rewrite that field's edit config (e.g. `edit.show = false`).

### Full Example

```html
<div>
    Order total: <b id="total">-</b>
</div>
<button onclick="fillDiscount()">Fill with 10% off</button>

<script>
    var form = {};

    window.addEventListener('message', function (e) {
        var data = e.data || {};
        if (data.type === 'erupt-tpl:init' || data.type === 'erupt-tpl:change') {
            form = data.formData || {};
            document.getElementById('total').innerText =
                (form.price || 0) * (form.quantity || 0);
            reportHeight();
        }
    });

    // Re-sync in case the iframe was ready before the form was
    // (init always arrives on its own; this is just belt and braces)
    parent.postMessage({type: 'erupt-tpl:get'}, '*');

    function fillDiscount() {
        parent.postMessage({
            type: 'erupt-tpl:set',
            formData: {amount: (form.price || 0) * (form.quantity || 0) * 0.9}
        }, '*');
    }

    function reportHeight() {
        parent.postMessage({
            type: 'erupt-tpl:height',
            height: document.documentElement.scrollHeight
        }, '*');
    }
</script>
```

:::tip
A form only accepts messages coming from the TPL iframes it owns. Nested forms (`COMBINE`, `TAB_*`) are independent and never cross wires, so an `erupt-tpl:set` always writes back into the form the TPL field itself lives in.
:::

:::warning
Height reporting is optional. If the template never sends `erupt-tpl:height`, the form still measures the content once on iframe `load`; but a template that grows after loading (async rendering, charts, ...) must report its height itself, otherwise it stays stuck at the initial value.
:::
