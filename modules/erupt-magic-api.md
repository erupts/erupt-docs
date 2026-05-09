# Erupt Magic API 在线 IDE

:::info
magic-api 是一个基于 Java 的接口快速开发框架，可在浏览器中编写脚本代码并立即生成 HTTP 接口，无需重启应用。erupt-magic-api 将其深度集成进 Erupt 体系，统一权限管控。
:::

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-magic-api</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 在线 IDE

内置完整的在线 IDE，支持代码高亮、自动补全、接口调试，所有接口实时生效。

<img src="/magic-api/ide.png" width="900">

## 权限管理

magic-api 的接口权限与 Erupt 权限体系统一管理，可精细控制每个接口的访问权限。

<img src="/magic-api/permission.png" width="900">

## 认证集成

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
