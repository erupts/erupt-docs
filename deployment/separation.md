# 前后端分离部署

## 步骤说明

### 1. 编译前端

下载 erupt-web 前端源码进行编译：[erupt-web](https://github.com/erupts/erupt-web)

### 2. 配置前端接口地址

修改 `app.js` 文件，配置 domain 服务端接口地址：

```javascript
window.eruptSiteConfig = {
    domain: "http://127.0.0.1:9999",
    fileDomain: "",
    title: "xxxxx",
    desc: "xxxx"
};
```

### 3. 开启 Redis Session

修改 `application.yml` 配置，使用 redis 管理 session：

```yaml
erupt:
  # 关闭 csrf 防御，跨域会影响 excel 导入导出功能的使用
  csrfInspect: false
  # 使用 redis 方式管理 session
  redisSession: true

spring:
  redis:
    database: 0
    timeout: 10000
    host: 127.0.0.1
```

### 4. 移除 erupt-web 依赖

服务端移除 erupt-web 依赖：

```xml
<!--移除此依赖-->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-web</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

### 5. 处理跨域问题

如果存在跨域问题则在服务端添加如下代码：

```java
@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        // 根据实际情况修改如下配置的值
        corsConfiguration.addAllowedOrigin("*"); // 允许访问源地址
        corsConfiguration.addAllowedHeader("*"); // 允许头
        corsConfiguration.addAllowedMethod("*"); // 允许方法
        source.registerCorsConfiguration("/**", corsConfiguration); // 对接口配置跨域设置
        return new CorsFilter(source);
    }

}
```

或使用 `WebMvcConfigurer` 方式：

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOriginPatterns("*")
            .allowCredentials(true)
            .allowedMethods(CorsConfiguration.ALL)
            .allowedHeaders(CorsConfiguration.ALL)
            .maxAge(3600); // 一小时内不需要再预检
    }
}
```
