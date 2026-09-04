# 自定义模板 @Tpl

`@Tpl` 是 Erupt 中所有「自定义模板页面」的统一描述注解：它本身不能直接标注在类或字段上，而是作为其它注解的属性值出现，用来声明**模板文件在哪里、用什么引擎渲染、渲染结果以什么方式展示**。

:::tip
使用前需引入 [erupt-tpl](/zh/modules/erupt-tpl) 模块，否则模板引擎不会被注册。
:::

## 四个使用位置

| 宿主注解 | 属性名 | 展示形态 | 模板可用变量 |
|---|---|---|---|
| `@Edit` | `tplType` | 直接内嵌在**表单**中的 iframe | 无（仅 `request` / `response` / `base`） |
| `@View` | `tpl` | 表格列变成链接，点击后**弹出层** | `row`（当前行数据） |
| `@RowOperation` | `tpl` | 行操作按钮，点击后**弹出层** | `rows`（选中行数据数组） |
| `@Vis` | `tplView` | 多视图页签内**整页内嵌** | 无（仅 `request` / `response` / `base`） |

```java
// 1. 字段级：表单内嵌模板
@EruptField(edit = @Edit(title = "自定义内容", type = EditType.TPL,
        tplType = @Tpl(path = "/tpl/custom.ftl")))
private String tplField;

// 2. 列级：点击列值弹出模板
@EruptField(views = @View(title = "详情", tpl = @Tpl(path = "/tpl/detail.ftl")))
private String detail;
```

```java
// 3. 按钮级：点击按钮弹出模板
// 4. 视图级：多视图中的整页模板
@Entity
@Erupt(
    name = "示例",
    rowOperation = @RowOperation(
        code = "tpl", title = "模板按钮", type = RowOperation.Type.TPL,
        tpl = @Tpl(path = "/tpl/operator.ftl", width = "800px")),
    vis = @Vis(
        code = "report", title = "报表", type = Vis.Type.TPL,
        tplView = @Tpl(path = "/tpl/report.ftl", height = "600px"))
)
public class TplDemo extends BaseModel {

}
```

:::warning
`@Edit` 上的属性名是 **`tplType`**，不是 `tpl`；`@Vis` 上是 **`tplView`**。写错属性名会直接编译不过。
:::

## 全部属性

以 `xyz.erupt.annotation.sub_erupt.Tpl` 为准：

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `path` | String | **必填** | 模板文件路径或路由地址，从 classpath 根目录开始解析；支持 `?k=v` 形式在路径尾部追加绑定变量 |
| `enable` | boolean | `true` | 是否启用 |
| `params` | String[] | `{}` | 传给 `tplHandler` 的自定义参数 |
| `tplHandler` | `Class<? extends Tpl.TplHandler>` | `Tpl.TplHandler.class` | 模板数据绑定处理类，实现 `bindTplData(Map, String[])` |
| `engine` | `Tpl.Engine` | `FreeMarker` | 模板引擎，见下方枚举 |
| `embedType` | `PageEmbedType` | `IFRAME` | 弹出层内容的嵌入方式：`IFRAME` / `MICRO_FRONTEND`（微前端） |
| `width` | String | `""` | 弹出层宽度，需带单位，如 `500px`、`80%` |
| `height` | String | `""` | 弹出层高度，需带单位 |
| `openWay` | `OpenWay` | `MODAL` | 打开方式：`MODAL` / `DRAWER` / `ROUTER` |
| `drawerPlacement` | `Placement` | `RIGHT` | 抽屉弹出方向：`TOP` / `BOTTOM` / `LEFT` / `RIGHT` |

其中 `params` / `tplHandler` / `engine` 被标记为 `@Transient`，只在服务端参与渲染，不会下发到前端。

### Engine 引擎枚举

| 枚举值 | 说明 |
|---|---|
| `Native` | 原生 H5，不做模板解析；**该模式下不支持 `tplHandler`** |
| `FreeMarker` | 默认引擎 |
| `Thymeleaf` | Thymeleaf |
| `Velocity` | Velocity |
| `Beetl` | Beetl |
| `Enjoy` | JFinal Enjoy |

引擎实现在框架启动时按需注册：未引入对应引擎的 jar 包时该引擎不可用，运行时会抛出 `XXX jar not found`。

### OpenWay 与 Placement

| `OpenWay` | 说明 |
|---|---|
| `MODAL` | 对话框（默认），宽度取 `width`，缺省使用内置的 `modal-lg` |
| `DRAWER` | 抽屉，方向由 `drawerPlacement` 决定，`width` / `height` 缺省均为 `40%` |
| `ROUTER` | 不弹层，直接跳转前端路由；`path` 支持 `{xxx}` 占位符，运行时用当前行同名字段的值替换 |

`Placement` 取值：`TOP` / `BOTTOM` / `LEFT` / `RIGHT`。

## 属性适用范围

`@Tpl` 的属性并非在四个位置都生效，实际消费点如下：

| 属性 | `@Edit.tplType` | `@View.tpl` | `@RowOperation.tpl` | `@Vis.tplView` |
|---|---|---|---|---|
| `path` / `engine` / `tplHandler` / `params` | 生效 | 生效 | 生效 | 生效 |
| `enable` | 不生效 | **生效** | 不生效 | 不生效 |
| `openWay` / `embedType` / `drawerPlacement` | 不生效 | 生效 | 生效 | 不生效 |
| `width` | 不生效 | 生效 | 生效 | 不生效 |
| `height` | 不生效 | 生效 | 生效 | 生效 |

:::tip 为什么字段级用不上宽高
`@Edit` 的 `tplType` 被标记为 `@Transient`，整个 `@Tpl` 对象不会序列化给前端；`EditType.TPL` 字段在表单里是一个**高度自适应的内嵌 iframe**，直接指向后端渲染入口 `/erupt-api/tpl/html-field/{erupt}/{field}`，因此 `width` / `height` / `openWay` / `drawerPlacement` / `embedType` 均无从生效，只有服务端渲染相关的 `path` / `engine` / `tplHandler` / `params` 有意义。

`@View.tpl` 则相反：它需要下发给前端来决定"点击列值后怎么弹"，所以 `enable` 只在这里被真正消费 —— 为 `false` 时该列不会变成可点击链接。
:::

## 模板数据绑定 TplHandler

除框架自动注入的变量外，可通过 `tplHandler` 向模板注入任意数据。实现类需要是一个 Spring Bean：

```java
@Component
public class ReportTplHandler implements Tpl.TplHandler {

    @Resource
    private EruptDao eruptDao;

    @Override
    public void bindTplData(Map<String, Object> binding, String[] params) {
        // params 即注解上配置的 @Tpl(params = {...})
        binding.put("title", params.length > 0 ? params[0] : "报表");
        binding.put("total", eruptDao.lambdaQuery(EruptUser.class).count());
    }

}
```

```java
@RowOperation(
    code = "report", title = "查看报表", type = RowOperation.Type.TPL,
    tpl = @Tpl(
        path = "/tpl/report.ftl",
        engine = Tpl.Engine.FreeMarker,
        tplHandler = ReportTplHandler.class,
        params = {"月度报表"}
    )
)
```

## 模板预注入变量

无论使用哪个引擎，框架都会向模板上下文注入以下变量：

| 变量 | 说明 |
|---|---|
| `request` | `HttpServletRequest` 对象 |
| `response` | `HttpServletResponse` 对象 |
| `base` | 应用的 contextPath，用于拼接静态资源路径 |
| `row` | 当前行数据，**仅 `@View.tpl` 场景** |
| `rows` | 选中行数据数组，**仅 `@RowOperation.tpl` 场景**；`engine = Native` 或按钮 `mode = BUTTON` 时不注入 |

此外，`path` 中 `?` 之后的键值对会被解析并直接放入模板上下文，例如 `@Tpl(path = "/tpl/report.ftl?type=month")` 可在模板中使用 `${type}`。

## 相关文档

- [TPL 字段类型](/zh/field-types/tpl) —— `EditType.TPL` 的字段级用法
- [@RowOperation 定义按钮](/zh/annotation/row-operation) —— TPL 模板弹出层按钮
- [@View 列展示配置](/zh/annotation/view) —— 列弹出模板
- [@Vis 多视图](/zh/annotation/vis) —— TPL 视图
- [erupt-tpl 模块](/zh/modules/erupt-tpl) —— 模板目录约定、热更新、UI 组件库
