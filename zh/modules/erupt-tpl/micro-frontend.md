# 微前端集成

微前端方式（菜单类型 `mtpl`）不使用 iframe，而是把子应用的 HTML、CSS、JS 取回来，在宿主文档里直接渲染。好处是没有 iframe 的高度和滚动条问题，页面切换更快，样式与后台浑然一体：

<img src="/tpl/micro-frontend.png" width="900">

## 子应用必须是完整 HTML 文档

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

## 沙箱模式

Erupt 固定使用 micro-app 的 **iframe 沙箱**：子应用的 DOM 渲染在宿主文档里，JS 则在一个隐藏的同源 iframe 中执行，拿到一份真实独立的 JS 全局环境。

之所以不用 micro-app 的默认沙箱，是因为默认沙箱把子应用脚本包进 `with(proxyWindow){ ... }` 再在宿主 window 里执行，而 `type="module"` 的脚本无法被这样包裹。micro-app 源码里对此有明确注释：ESM 场景下 proxyWindow 不生效。结果就是 Vite 构建的子应用要么直接报错挂不上（典型症状是控制台的 `process is not defined`），要么勉强跑起来但完全没有隔离。

:::danger 这不是安全边界
沙箱 iframe 必须与宿主同源才能被宿主脚本操控，代价是子应用的 JS 运行在**你后台的源**上：它的 `localStorage`、`sessionStorage`、cookie 都落在后台域名下，能读到后台的登录凭证，多个子应用之间也共用同一份存储。

**只对自己团队可控的子应用使用微前端。** 嵌入第三方页面请用 iframe 菜单类型，跨源 iframe 的隔离由浏览器保证。
:::

## 适用范围

| 子应用形态 | 微前端 | iframe |
|---|---|---|
| 服务端渲染的模板页（Freemarker、Thymeleaf、原生 HTML） | 支持 | 支持 |
| 传统打包的 SPA（webpack 等非 ESM 产物） | 支持 | 支持 |
| Vite / ESM 产物的现代 SPA | 支持 | 支持 |
| 带 SSR 流式注水的框架（Next.js、TanStack Start 等） | 不支持 | 支持 |
| 你无法控制的第三方站点 | 不要用 | 取决于对方响应头 |

SSR 流式注水类应用的服务端 HTML 与注水引导脚本是一体的，微前端把脚本抽出来单独执行后注水流程接不上，页面结构建出来了但渲染为空。这类子应用只能走 iframe。

## 容器行为

- **保活**：切换标签页不会卸载子应用，切回来是恢复现场而不是重新加载。
- **多实例**：容器的应用名由子应用 URL 派生，同时打开多个微前端菜单互不冲突。
- **失败可见**：子应用加载失败时会显示错误提示，不会停在空白页。

:::tip 怎么选
子应用是你自己的，用微前端：高度天然自适应，弹窗不被框裁切，切页不重载。子应用不完全可信，或者是 SSR 流式注水框架，用 iframe。
:::

## 注解场景中的微前端

`@Tpl` 注解的弹出层同样可以选微前端方式渲染，要求与这里一致：必须是完整 HTML 文档，同源沙箱不是安全边界。属性说明见 [@Tpl 自定义模板](/zh/annotation/tpl)。
