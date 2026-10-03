# UI 组件库

erupt-tpl-ui 把几套主流前端组件库打成 Spring Boot 静态资源包，引入依赖后模板里直接用 `<script>` 和 `<link>` 引用，不需要单独的前端构建流程。没有聚合包，按需引入对应坐标：

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

## 资源路径

每个包把文件放在以自己命名的目录下，通过应用根路径访问。在模板 `<head>` 里先声明 `<base href="${base}/">`，之后的相对路径就都能落到正确的 contextPath：

| 坐标 | 目录 | 主要文件 |
|---|---|---|
| `erupt-tpl-ui.ant-design` | `/ant-design/` | `vue.min.js`（Vue 2）、`antd.min.js`、`antd.min.css`、`moment.min.js`、`axios.min.js` |
| `erupt-tpl-ui.element-ui` | `/element/` | `vue.min.js`（Vue 2）、`element.min.js`、`element.min.css`、`axios.min.js`、`fonts/` 图标字体 |
| `erupt-tpl-ui.element-plus` | `/element-plus/` | `vue3.js`（含运行时模板编译器）、`element.min.js`、`element.min.css`、`element-icons.min.js`、`axios.min.js` |

## Ant Design Vue

```html
<!DOCTYPE html>
<html>
<head>
    <base href="${base}/">
    <meta charset="utf-8">
    <link href="ant-design/antd.min.css" rel="stylesheet">
</head>
<body>
<div id="app">
    <a-result status="success" title="操作成功"></a-result>
</div>
<script src="ant-design/vue.min.js"></script>
<script src="ant-design/antd.min.js"></script>
<script>
    new Vue({el: '#app'});
</script>
</body>
</html>
```

<img src="/tpl/antd.png" width="900">

## Element Plus

Element Plus 包基于 Vue 3，`vue3.js` 是带运行时模板编译器的完整构建，模板可以直接写在 HTML 里：

```html
<!DOCTYPE html>
<html>
<head>
    <base href="${base}/">
    <meta charset="utf-8">
    <link href="element-plus/element.min.css" rel="stylesheet">
</head>
<body>
<div id="app">
    <el-card>
        <el-button type="primary">按钮</el-button>
    </el-card>
</div>
<script src="element-plus/vue3.js"></script>
<script src="element-plus/element.min.js"></script>
<script src="element-plus/element-icons.min.js"></script>
<script>
    const app = Vue.createApp({});
    app.use(ElementPlus);
    for (const [name, comp] of Object.entries(ElementPlusIconsVue)) {
        app.component(name, comp);
    }
    app.mount('#app');
</script>
</body>
</html>
```

Element UI 包（Vue 2）的用法与 Ant Design Vue 一致，把目录换成 `element/` 即可。

<img src="/tpl/element.png" width="900">

:::tip 与后台主题的关系
这些组件库渲染的是模板自己的区域，不会改变 Erupt 后台的外观。页面整体仍由 Erupt 的布局与主题包裹，只是内容区交给你的模板。
:::
