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

通过 `@RowOperation` 注解可以在列表行按钮中打开自定义模板页面：

<img src="/tpl/row-op1.png" width="700">

<img src="/tpl/row-op2.png" width="700">

## 微前端集成

erupt-tpl 支持微前端架构，可将任意前端框架的页面嵌入到 Erupt 管理后台中：

<img src="/tpl/micro-frontend.png" width="900">

## Erupt TPL UI 组件库

erupt-tpl-ui 提供多套主流 UI 框架的集成方案，在自定义页面中直接使用与 Erupt 风格一致的组件。

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-tpl-ui</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

### Ant Design

<img src="/tpl/antd.png" width="900">

### Element UI / Element Plus

<img src="/tpl/element.png" width="900">

### Amis 低代码

百度 Amis 低代码框架集成，通过 JSON 配置即可生成复杂页面：

<img src="/tpl/amis.png" width="900">
