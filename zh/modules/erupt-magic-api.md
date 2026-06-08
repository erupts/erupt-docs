# Erupt Magic API 在线 IDE

:::info
magic-api 是一个基于 Java 的接口快速开发框架，编写接口通过 magic-api 提供的 UI 界面完成，自动映射为 HTTP 接口，**无需定义 Controller、Service、Dao、Mapper、XML、VO 等 Java 对象**即可完成常见的 HTTP API 接口开发。

**在线 IDE**：提供 Web 页面，在线编写脚本，在线 DEBUG，脚本编辑后无需重启，**自动热更新**！

**丰富功能**：热更新、代码生成、分页、Redis、MongoDB、各种函数库

官网地址：[https://ssssssss.org](https://www.ssssssss.org/magic-api/)
:::

## 使用方式

**1、添加依赖**

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-magic-api</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

**2、`application.yml` / `application.properties` 添加如下配置**

```yaml
magic-api:
  web: /magic/web
  resource:
    type: database
```

**3、启动项目，左侧菜单新增「接口配置」菜单**

<img src="/magic-api/ide.png" width="900">

**4、更多使用方法详见：[https://ssssssss.org](https://www.ssssssss.org/magic-api/)**

## Magic-API 编辑器配置

在 `app.js` 中添加如下代码，可自定义编辑器标题等配置项：

```javascript
if (window.MAGIC_EDITOR_CONFIG) {
    Object.assign(window.MAGIC_EDITOR_CONFIG, {
        title: "Edge IDE", // 修改标题
    })
}
```

更多配置项详见：[编辑器配置 | magic-api](https://ssssssss.org/magic-api/pages/config/editor/)

## Magic-API 前端 IDE 权限控制

### 接口权限校验

使用 erupt-magic-api 可融合 erupt 提供的权限校验功能，保证接口安全调用。

**使用方法**：选中接口 → 点击接口选项 → 点击右侧添加按钮，即可看到如下配置，权限校验支持多个累加。

<img src="/magic-api/permission.png" width="900">

| 权限类型 | 说明 |
| --- | --- |
| `permission` | 允许拥有菜单权限的访问（对应菜单类型值） |
| `role` | 允许拥有该角色的访问（对应角色编码） |
| `require_login` | 该接口需要登录才允许访问 |

:::warning
前端请求时要携带 token，详见 [接口请求](/zh/advanced/rest-api#接口请求)
:::

### 认证集成

与 Erupt 登录认证体系无缝集成，接口自动继承当前登录用户上下文。

<img src="/magic-api/auth.png" width="900">

## 注意事项

:::warning
生产环境 HTTPS 部署时需要调整 Nginx 配置，确保 WebSocket 连接正常，否则在线 IDE 将无法使用。

```nginx
location /magic-api {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```
:::
