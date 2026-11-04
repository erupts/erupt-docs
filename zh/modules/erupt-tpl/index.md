# Erupt TPL 自定义页面

erupt-tpl 让你用一个 HTML 文件给后台加一个页面：把文件放进 `resources/tpl/`，在菜单管理里新建一条「自定义页面」菜单填上文件名，这个页面就以后台的主题、权限和登录态出现在侧边栏里。需要动态数据时，用 `@EruptTpl` + `@TplAction` 给模板绑一个 `Map`，再交给 FreeMarker、Thymeleaf 等引擎渲染。

| 能力 | 做什么 | 入口 |
| --- | --- | --- |
| **菜单页面** | 把 `tpl` 目录下的 HTML 挂成菜单，iframe 或微前端两种嵌入方式 | [菜单页面](./menu) |
| **模板引擎与数据绑定** | 五种模板引擎按需启用，`@TplAction` 向模板注入数据，路径与参数约定 | [模板开发](./template) |
| **微前端集成** | 不用 iframe，把子应用直接渲染进宿主文档；边界、限制与选型 | [微前端集成](./micro-frontend) |
| **UI 组件库** | Ant Design Vue、Element UI、Element Plus 的静态资源包，模板里直接引 | [UI 组件库](./ui) |

模块同时也是 `@Tpl` 注解的运行时：`EditType.TPL` 字段、`@RowOperation` 弹出层、`@View` 列弹窗、`@Vis` 视图渲染模板都走这里的引擎。注解层面的属性说明见 [@Tpl 自定义模板](/zh/annotation/tpl)。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-tpl</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

引入后菜单管理的「菜单类型」会多出 **自定义页面（iframe）** 与 **自定义页面（微前端）** 两项；纯 HTML 页面开箱即用。要用 FreeMarker 等模板引擎，需要自行再加对应引擎的依赖，见[模板开发](./template#模板引擎)。

## 渲染效果

自定义页面完整复用 Erupt 的主题样式，与后台其他页面没有割裂感：

<img src="/tpl/result.png" width="900">

## 页面导航

- [菜单页面](./menu) —— 菜单配置、`tpl` 与 `mtpl` 两种嵌入方式、目录约定、热更新
- [模板开发](./template) —— 模板引擎、`@EruptTpl` / `@TplAction` 数据绑定、预注入变量、路径与参数
- [微前端集成](./micro-frontend) —— 完整 HTML 要求、iframe 沙箱、适用范围、容器行为
- [UI 组件库](./ui) —— erupt-tpl-ui 三个坐标与引用方式
