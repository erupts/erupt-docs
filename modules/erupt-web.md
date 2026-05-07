# Erupt WEB 前端源码

erupt-web 是 erupt 框架的前端模块，基于 Angular 开发，提供完整的后台管理界面。以 Jar 形式分发，无需单独部署前端。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-web</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

在前后端分离部署场景下，可以不添加此依赖，将前端单独部署。

## 前端源码

前端源码仓库：
- GitHub：[https://github.com/erupts/erupt-web](https://github.com/erupts/erupt-web)

## 自定义前端

可以通过修改 `resources/public/app.js` 和 `resources/public/app.css` 来自定义前端外观，详见：[参数配置](/guide/configuration)。

## 前后端分离部署

详见：[前后端分离部署](/deployment/separation)
