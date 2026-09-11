# Erupt TPL 自定义页面

erupt-tpl 模块提供自定义页面能力，支持在菜单中嵌入自定义 HTML 模板页面，可使用 Freemarker 等模板引擎渲染，并提供多套 UI 组件库集成方案。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-tpl</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 菜单配置

在菜单管理中新增菜单，类型选择"模板"，类型值填写模板文件名称（不含路径前缀）：

<img src="/tpl/menu.png" width="700">

## 渲染效果

自定义模板页面可完整使用 Erupt 主题样式，无缝融入管理后台：

<img src="/tpl/result.png" width="900">

## 热更新

模板文件修改后无需重启应用，刷新页面即可看到最新效果：

<img src="/tpl/hot-reload.png" width="700">

## Freemarker 模板

在 `resources/tpl` 目录下创建 `.ftl` 文件，可使用预注入的用户信息等上下文变量：

```html
<!-- resources/tpl/demo.ftl -->
<!DOCTYPE html>
<html>
<head><title>自定义页面</title></head>
<body>
    <h1>Hello, ${user.name}!</h1>
    <p>当前用户ID：${user.id}</p>
</body>
</html>
```

<img src="/tpl/freemarker.png" width="700">

## 行按钮嵌入

通过 `@RowOperation` 注解可以在列表行按钮中打开自定义模板页面，详细用法请参考 [TPL 模板弹出层](/zh/annotation/row-operation#tpl-模板弹出层)。

<img src="/tpl/row-op1.png" width="700">

<img src="/tpl/row-op2.png" width="700">

## 两种嵌入方式

引入 erupt-tpl 后，菜单管理的「菜单类型」里会多出两项，它们指向同一批模板文件，区别只在于前端用什么方式把页面装进来：

| 菜单类型 | 类型值 | 前端实现 | 前端路由 |
|---|---|---|---|
| 自定义页面（iframe） | `tpl` | 原生 iframe | `/tpl/<文件名>` |
| 自定义页面（微前端） | `mtpl` | 微前端容器 | `/mtpl/<文件名>` |
| 外部链接（微前端） | `mlink` | 微前端容器 | `/msite/<base64 URL>` |

`tpl` 和 `mtpl` 的「类型值」填 **`tpl` 目录下的文件名**，不要带路径前缀，也不要写成绝对路径，后端会把它拼成 classpath 上的 `/tpl/<文件名>` 去读取。`mlink` 的类型值填完整 URL。

:::warning 不要在 `mtpl` 里填 URL
`tpl` / `mtpl` 的类型值会作为路由片段，URL 里的斜杠会被路由切碎，结果是跳到 `#/tpl/https:` 这种地址。嵌外部系统请用 `mlink` 或 `link`，它们会对 URL 做 base64 编码后再进路由。
:::

:::warning 模板必须放在 `resources/tpl/` 下
菜单类型值填 `demo.html`，框架读的是 `classpath:/tpl/demo.html`。文件直接放在 `resources/` 根目录是读不到的，此时接口会返回一段固定的 `<h1 align='center'>404 not found</h1>`，而且 HTTP 状态码仍然是 **200**，浏览器控制台不会报错，页面只是空白，很难排查。
:::

## 微前端集成

微前端方式不使用 iframe，而是把子应用的 HTML、CSS、JS 取回来，在宿主文档里直接渲染。好处是没有 iframe 的高度和滚动条问题，页面切换更快，样式与后台浑然一体：

<img src="/tpl/micro-frontend.png" width="900">

### 子应用必须是完整 HTML 文档

微前端容器会解析取回的 HTML，要求它至少有 `<head>`。下面这种片段是不行的：

```html
<!-- 错误：没有 head，微前端渲染为空白 -->
<h1>Hello</h1>
```

```html
<!-- 正确 -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <title>自定义页面</title>
</head>
<body>
<h1>Hello</h1>
</body>
</html>
```

不满足时浏览器控制台会打印 `[micro-app] app xxx: element head is missing`，页面区域一片空白。iframe 方式没有这个限制，片段也能显示。

### 沙箱模式

Erupt 固定使用 micro-app 的 **iframe 沙箱**：子应用的 DOM 渲染在宿主文档里，JS 则在一个隐藏的同源 iframe 中执行，拿到一份真实独立的 JS 全局环境。

之所以不用 micro-app 的默认沙箱，是因为默认沙箱把子应用脚本包进 `with(proxyWindow){ ... }` 再在宿主 window 里执行，而 `type="module"` 的脚本无法被这样包裹。micro-app 源码里对此有明确注释：ESM 场景下 proxyWindow 不生效。结果就是 Vite 构建的子应用要么直接报错挂不上（典型症状是控制台的 `process is not defined`），要么勉强跑起来但完全没有隔离。

:::danger 这不是安全边界
沙箱 iframe 必须与宿主同源才能被宿主脚本操控，代价是子应用的 JS 运行在**你后台的源**上：它的 `localStorage`、`sessionStorage`、cookie 都落在后台域名下，能读到后台的登录凭证，多个子应用之间也共用同一份存储。

**只对自己团队可控的子应用使用微前端。** 嵌入第三方页面请用 iframe 菜单类型，跨源 iframe 的隔离由浏览器保证。
:::

### 适用范围

| 子应用形态 | 微前端 | iframe |
|---|---|---|
| 服务端渲染的模板页（Freemarker、Thymeleaf、原生 HTML） | 支持 | 支持 |
| 传统打包的 SPA（webpack 等非 ESM 产物） | 支持 | 支持 |
| Vite / ESM 产物的现代 SPA | 支持 | 支持 |
| 带 SSR 流式注水的框架（Next.js、TanStack Start 等） | 不支持 | 支持 |
| 你无法控制的第三方站点 | 不要用 | 取决于对方响应头 |

SSR 流式注水类应用的服务端 HTML 与注水引导脚本是一体的，微前端把脚本抽出来单独执行后注水流程接不上，页面结构建出来了但渲染为空。这类子应用只能走 iframe。

### 容器行为

- **保活**：切换标签页不会卸载子应用，切回来是恢复现场而不是重新加载。
- **多实例**：容器的应用名由子应用 URL 派生，同时打开多个微前端菜单互不冲突。
- **失败可见**：子应用加载失败时会显示错误提示，不会停在空白页。

### 嵌入外部站点

菜单类型选 `mlink`，类型值填完整 URL。

微前端方式不受对方 `X-Frame-Options` 和 `frame-ancestors` 的限制，因为远端页面从未作为 frame 被导航，是宿主 fetch 回来的。代价是对方必须允许跨域读取——HTML 和每一个静态资源都要带上放行你后台域名的 CORS 响应头。

如果改用 iframe 方式（`link` 菜单类型），则相反：不需要 CORS，但只要对方响应头里有下面任意一条，浏览器就会拒绝，页面显示为空白或裂开的文档图标：

```
X-Frame-Options: DENY
X-Frame-Options: SAMEORIGIN
Content-Security-Policy: frame-ancestors 'none'
```

这是对方服务端的策略，前端无法绕过，只能请对方把 `frame-ancestors` 放开到你的后台域名。

:::tip 怎么选
子应用是你自己的，用微前端：高度天然自适应，弹窗不被框裁切，切页不重载。子应用不完全可信，或者是 SSR 流式注水框架，用 iframe。
:::

## Erupt TPL UI 组件库

erupt-tpl-ui 提供多套主流 UI 框架的集成方案，在自定义页面中直接使用与 Erupt 风格一致的组件。没有聚合包，请按需引入对应坐标：

```xml
<!-- Ant Design Vue -->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-tpl-ui.ant-design</artifactId>
  <version>${erupt.version}</version>
</dependency>

<!-- Element UI -->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-tpl-ui.element-ui</artifactId>
  <version>${erupt.version}</version>
</dependency>

<!-- Element Plus -->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-tpl-ui.element-plus</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

### Ant Design

<img src="/tpl/antd.png" width="900">

### Element UI / Element Plus

<img src="/tpl/element.png" width="900">
