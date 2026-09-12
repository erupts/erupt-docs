# 自定义模板 TPL

使用 FreeMarker 模板渲染字段内容，可嵌入任意 HTML。它同时是 erupt 字段体系的通用扩展点：借助[表单通信桥](#与表单通信)读写表单值，可以实现框架未内置的**任意自定义编辑组件**。需引入 `erupt-tpl` 模块。

![tpl](/field-types/tpl.png)

## 基础用法

```java
@EruptField(
    edit = @Edit(title = "自定义内容", type = EditType.TPL,
                 tplType = @Tpl(path = "/tpl/custom.ftl"))
)
private String tplField;
```

:::warning
`@Edit` 上的属性名是 **`tplType`**（不是 `tpl`）。`tpl` 只存在于 `@View` 和 `@RowOperation` 上。
:::

## 配置项

`@Tpl` 全部属性（`xyz.erupt.annotation.sub_erupt.Tpl`）：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `path` | String | 必填 | 模板文件路径或路由地址，从 classpath 根目录开始解析；支持 `?k=v` 形式追加绑定变量 |
| `enable` | boolean | `true` | 仅对 `@View(tpl = ...)` 的列弹窗生效；字段级 `tplType` 被标记为 `@Transient`，不会下发前端，因此该属性对 `EditType.TPL` 无效 |
| `engine` | Tpl.Engine | `FreeMarker` | 模板引擎：`Native` / `FreeMarker` / `Thymeleaf` / `Velocity` / `Beetl` / `Enjoy`；`Native` 模式不支持 `tplHandler` |
| `tplHandler` | Class<? extends Tpl.TplHandler> | `Tpl.TplHandler.class` | 模板数据绑定处理类，实现 `bindTplData(Map, String[])` |
| `params` | String[] | `{}` | 传入 `tplHandler` 的自定义参数 |
| `embedType` | PageEmbedType | `IFRAME` | 页面嵌入方式：`IFRAME` / `MICRO_FRONTEND` |
| `width` | String | `""` | 弹出层宽度，需带单位，如 `500px`、`80%` |
| `height` | String | `""` | 弹出层高度，需带单位 |
| `openWay` | OpenWay | `MODAL` | 弹出层打开方式：`MODAL` / `DRAWER` / `ROUTER` |
| `drawerPlacement` | Placement | `RIGHT` | 抽屉弹出方向：`TOP` / `BOTTOM` / `LEFT` / `RIGHT` |

:::tip
`width` / `height` / `openWay` / `drawerPlacement` / `embedType` 是为弹出层场景设计的（如 `@RowOperation(tpl = ...)`、`@View(tpl = ...)`）。字段级 `EditType.TPL` 直接内嵌在表单中渲染，后端渲染入口为 `/erupt-api/tpl/html-field/{erupt}/{field}`，只使用 `path` / `engine` / `tplHandler` / `params`。
:::

> 模板文件放置于资源目录下，`path` 从 classpath 根目录开始解析。详见 [erupt-tpl 模块](/zh/modules/erupt-tpl)。

## 自定义任意组件

配合下面的[表单通信桥](#与表单通信)，TPL 就不只是「展示一段自定义 HTML」，而是 erupt 字段体系的**通用扩展点**：框架没有内置的编辑器，都可以用 TPL 写出来，并且表现得和原生字段一样。

关键在于 **TPL 字段的值是完整往返的**——它和 INPUT、TEXTAREA 一样参与表单的读取与提交，并不是只读的展示区域。因此一个 TPL 字段能拿到原生字段的全部能力：

| 能力 | 做法 |
|------|------|
| 读取自己已保存的值 | `erupt-tpl:init` 的 `formData[fieldName]` 就是该字段当前值（新增态为空） |
| 写回自己的值并随表单入库 | `erupt-tpl:set` 发 `{formData: {'字段名': 值}}`，提交时与其他字段一同保存 |
| 与其他字段联动 | 监听 `erupt-tpl:change` 拿到全表单值；用 `editExpr` 反向改写其他字段的编辑配置 |
| 区分新增 / 修改 / 只读 | `init` 消息里的 `mode` 与 `readonly` |
| 高度自适应 | 自行上报 `erupt-tpl:height` |

### 自定义组件骨架

Java 侧就是一个普通字段，值存 JSON 即可：

```java
@Column(columnDefinition = "text")
@EruptField(
    views = @View(title = "结构图"),
    edit = @Edit(title = "结构图", type = EditType.TPL,
                 tplType = @Tpl(path = "/tpl/mind-map.ftl"))
)
private String mindMap;
```

模板侧把自己当成一个受控组件来写：

```html
<div id="editor"></div>

<script>
    var FIELD = null;

    window.addEventListener('message', function (e) {
        var data = e.data || {};
        if (data.type !== 'erupt-tpl:init') return;
        FIELD = data.fieldName;
        // 1. 用已保存的值初始化自己的组件
        renderEditor(data.formData[FIELD], data.readonly);
    });

    // 2. 组件内部变化时，把新值写回表单
    function onEditorChange(value) {
        var patch = {};
        patch[FIELD] = JSON.stringify(value);
        parent.postMessage({type: 'erupt-tpl:set', formData: patch}, '*');
    }
</script>
```

点保存时，这个字段就和其他字段一起提交了，后端拿到的是模板写回的那个值。

### 适合用 TPL 落地的场景

- 思维导图、流程图、拓扑图一类的结构化编辑器
- 地图打点、画多边形、轨迹绘制
- 拖拽排版、看板、甘特条的自定义编辑面板
- 图片裁剪 / 标注、手写与公式编辑器
- 需要直接嵌入第三方 SDK 的交互组件
- 跨字段的实时计算面板（报价单、配置器、预览卡片）

:::tip
选型建议：**通用性强**的组件（大多数项目都会用到）欢迎提 issue 推进内置 EditType，享受搜索、Excel 导入导出、设计器等全套支持；**业务专用**的交互用 TPL 落地，既不用等版本，也不给框架增加长期维护面。
:::

:::warning
TPL 字段不参与条件搜索与 Excel 导入导出，列表页也不会自动渲染它的值——需要在列表展示时，请配合 [@View](/zh/annotation/view) 的 `template` 或 `tpl` 自行处理。
:::

## 与表单通信 <Badge type="tip" text="2.1.2+" />

`EditType.TPL` 以 iframe 方式内嵌，模板默认看不到表单里其他字段的值。前端为字段级 TPL 提供了一条 `postMessage` 桥，模板可以**读取当前表单的全部值**、**监听值的变化**，并**反向写回**表单。

:::info
这条桥只服务于**字段级 `EditType.TPL`**，它始终以 iframe 内嵌。`@Tpl` 的 `embedType = MICRO_FRONTEND` 只对弹层与页面级 TPL（`@RowOperation(tpl = ...)`、`@View(tpl = ...)`、TPL 菜单）生效——那些场景本身不处在某张表单里，也就没有可通信的表单。
:::

### 消息协议

表单 → 模板：

| 消息类型 | 时机 | 负载 |
|------|------|------|
| `erupt-tpl:init` | iframe 加载完成后立即下发，也用于响应 `erupt-tpl:get` | `eruptName` / `fieldName` / `mode` / `readonly` / `formData` |
| `erupt-tpl:change` | 表单任意字段值变化（100ms 防抖） | 同上 |

模板 → 表单：

| 消息类型 | 作用 | 负载 |
|------|------|------|
| `erupt-tpl:get` | 主动索取一次最新表单值，表单回 `erupt-tpl:init` | — |
| `erupt-tpl:set` | 写回表单 | `formData?` / `editExpr?` |
| `erupt-tpl:height` | 自行上报高度，表单据此调整 iframe 高度 | `height`（number，单位 px） |

其中：

- `formData` 结构与新增/修改接口提交的表单对象一致，key 为字段名。
- `mode` 为 `ADD` / `EDIT`，`readonly` 标识表单是否只读，模板可据此切换可编辑状态。
- `erupt-tpl:set` 的 `editExpr` 与 [BUTTON](/zh/field-types/button) 的返回值语义相同：key 为字段名，value 是一段以 `edit` 为入参的 JS 代码，用来动态改写目标字段的编辑配置（如 `edit.show = false`）。

### 完整示例

```html
<div>
    订单金额：<b id="total">-</b>
</div>
<button onclick="fillDiscount()">按 9 折回填</button>

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

    // iframe 早于表单就绪时用它补一次同步（init 本身一定会到，这里只是保险）
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
表单只接受来自它自己那些 TPL iframe 的消息，嵌套表单（`COMBINE`、`TAB_*`）各自独立，互不串台。因此 `erupt-tpl:set` 写回的永远是该 TPL 字段所在的那张表单。
:::

:::warning
高度上报是可选的。若模板不发 `erupt-tpl:height`，表单仍会在 iframe `load` 时按内容测量一次高度；但内容加载后才撑开的模板（异步渲染、图表等）必须自行上报，否则高度会停在初始值。
:::
