# Erupt TPL 自定义页面

erupt-tpl 模块提供自定义页面能力，支持在菜单中嵌入自定义的 HTML 页面，可使用 Freemarker 等模板引擎渲染。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-tpl</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 使用方式

1. 在 resources/tpl 目录下创建模板文件（如 `demo.ftl`）
2. 在菜单管理中添加菜单，类型选择"模板"，类型值填写模板文件名称（不含路径前缀）

## 模板文件示例

```html
<!-- resources/tpl/demo.ftl -->
<!DOCTYPE html>
<html>
<head>
    <title>自定义页面</title>
</head>
<body>
    <h1>Hello, ${user.name}!</h1>
    <!-- 使用预注入的变量 -->
</body>
</html>
```

## Erupt TPL UI 自定义页面 UI 库

erupt-tpl-ui 提供了一套 UI 组件库，可以在自定义页面中使用 erupt 风格的 UI 组件。

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-tpl-ui</artifactId>
  <version>${erupt.version}</version>
</dependency>
```
