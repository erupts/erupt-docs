# 自定义模板 TPL

使用 FreeMarker 模板渲染字段内容，可嵌入任意 HTML，适合展示复杂自定义内容。需引入 `erupt-tpl` 模块。

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
