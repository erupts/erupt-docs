# Frontend / Backend Separation Deployment

## Steps

### 1. Build the Frontend

Download and build the erupt-web frontend source code: [erupt-web](https://github.com/erupts/erupt-web).

### 2. Configure the Frontend API Endpoint

Edit `app.js` and set the `domain` to the backend API URL:

```javascript
window.eruptSiteConfig = {
    domain: "http://127.0.0.1:9999",
    fileDomain: "",
    title: "xxxxx",
    desc: "xxxx"
};
```

### 3. Enable Redis Sessions

Edit `application.yml` to manage sessions with Redis:

```yaml
erupt:
  # Disable CSRF protection — required because cross-origin requests interfere with Excel import/export
  csrfInspect: false
  # Manage sessions via Redis
  redisSession: true

spring:
  redis:
    database: 0
    timeout: 10000
    host: 127.0.0.1
```

### 4. Remove erupt-web Dependency

Remove the erupt-web dependency from the backend:

```xml
<!-- Remove this dependency -->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-web</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

### 5. Handle CORS

If you run into CORS issues, add the following on the backend:

```java
@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        // Adjust the values below to match your environment
        corsConfiguration.addAllowedOrigin("*"); // allowed origin
        corsConfiguration.addAllowedHeader("*"); // allowed headers
        corsConfiguration.addAllowedMethod("*"); // allowed methods
        source.registerCorsConfiguration("/**", corsConfiguration); // apply CORS to all endpoints
        return new CorsFilter(source);
    }

}
```

Or using `WebMvcConfigurer`:

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
            .maxAge(3600); // skip preflight for one hour
    }
}
```
