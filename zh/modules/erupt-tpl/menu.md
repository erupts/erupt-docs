# 菜单页面

把模板文件挂成后台菜单只需两步：文件放进 `resources/tpl/`，菜单管理里新建一条菜单指向它。

## 菜单配置

在菜单管理中新增菜单，类型选择「自定义页面」，类型值填写模板文件名称（不含路径前缀）：

<img src="/tpl/menu.png" width="700">

类型值同时也是这条菜单的**权限标识**：后端收到 `/erupt-api/tpl/<文件名>` 请求时，会在当前用户的菜单里按这个值精确匹配（不区分大小写），匹配不到返回 403。所以同一个模板文件想给不同角色开放，只要把菜单分配给对应角色即可，不需要在模板里做权限判断。

## 两种嵌入方式

引入 erupt-tpl 后，「菜单类型」里会多出两项，它们指向同一批模板文件，区别只在于前端用什么方式把页面装进来：

| 菜单类型 | 类型值 | 前端实现 | 前端路由 |
|---|---|---|---|
| 自定义页面（iframe） | `tpl` | 原生 iframe | `/tpl/<文件名>` |
| 自定义页面（微前端） | `mtpl` | 微前端容器 | `/mtpl/<文件名>` |

`tpl` 和 `mtpl` 的「类型值」填 **`tpl` 目录下的文件名**，不要带路径前缀，也不要写成绝对路径，后端会把它拼成 classpath 上的 `/tpl/<文件名>` 去读取。文件名允许带子目录，例如 `report/sales.html`，前端路由最多支持五级。

:::warning 不要在 `mtpl` 里填 URL
`tpl` / `mtpl` 的类型值会作为路由片段，URL 里的斜杠会被路由切碎，结果是跳到 `#/tpl/https:` 这种地址。嵌外部系统请用 upms 自带的「链接」或「微前端链接」菜单类型（见[菜单管理](/zh/modules/erupt-upms/menu)），它们会对 URL 做 base64 编码后再进路由。
:::

:::warning 不要在类型值里带 `?参数`
权限校验用的是请求路径，不含查询串。类型值写成 `demo.html?type=a`，后端拿到的路径是 `demo.html`，在菜单里找不到同名项就会 403。要给模板传固定参数，写在 `@TplAction` 的 `path` 属性里，见[模板开发](./template#路径与参数)。
:::

:::tip 怎么选
子应用是你自己的，用微前端：高度天然自适应，弹窗不被框裁切，切页不重载。子应用不完全可信，或者是 SSR 流式注水框架，用 iframe。详细边界见[微前端集成](./micro-frontend)。
:::

## 目录约定

模板必须放在 `resources/tpl/` 下。菜单类型值填 `demo.html`，框架读的是 `classpath:/tpl/demo.html`。

```
src/main/resources/
└── tpl/
    ├── demo.html
    ├── dashboard.ftl
    └── report/
        └── sales.html
```

:::warning 放错位置的症状是空白页
文件直接放在 `resources/` 根目录是读不到的，此时接口会返回一段固定的 `<h1 align='center'>404 not found</h1>`，而且 HTTP 状态码仍然是 **200**，浏览器控制台不会报错，页面只是空白，很难排查。看到空白页先核对文件路径。
:::

## 静态资源路径

模板里引用 CSS、JS 时用 `${base}` 开头，它会被替换成应用的 contextPath，这样应用部署在子路径下也不会 404：

```html
<head>
    <base href="${base}/">
    <link href="ant-design/antd.min.css" rel="stylesheet">
</head>
```

纯 HTML（Native 引擎）只做这一个替换，不解析其他表达式；模板引擎下 `base` 是普通的上下文变量，按引擎自己的语法取值。

## 热更新

模板文件修改后无需重启应用，刷新页面即可看到最新效果：

<img src="/tpl/hot-reload.png" width="700">

纯 HTML 每次请求都从 classpath 重新读取。使用模板引擎时受引擎自身缓存策略影响，FreeMarker 默认几秒内会重新检查文件变化。IDE 需要把 `resources` 变更同步到输出目录（IntelliJ 为 Build Project 或开启自动构建）。

## 行按钮嵌入

除了挂成菜单，模板也可以通过 `@RowOperation` 在列表行按钮里弹出，详细用法见 [TPL 模板弹出层](/zh/annotation/row-operation#tpl-模板弹出层)。

<img src="/tpl/row-op1.png" width="700">

<img src="/tpl/row-op2.png" width="700">
