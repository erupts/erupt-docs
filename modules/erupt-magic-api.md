# Erupt Magic API 在线 IDE

erupt-magic-api 集成 Magic API 框架，提供在线接口开发 IDE，可在浏览器中直接编写和调试接口代码，无需重启项目。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-magic-api</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 功能特性

- 在线编写 Groovy/JavaScript 代码
- 即时调试，无需重启
- 接口文档自动生成
- 权限控制集成

## 注意事项

Erupt-magic-api 生产环境 HTTPS 部署时需要调整 Nginx 配置，以确保 WebSocket 连接正常。
