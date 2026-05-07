# 认证与登录

## 自定义登录 @EruptLogin

覆盖默认登录逻辑，可使用此功能对接 LDAP、单点登录等能力。

### 使用方法

在 Spring Boot 入口类中增加 `@EruptLogin` 注解，注解值为 `LoginProxy` 接口的实现类：

```java
@EruptLogin(TestLoginProxy.class)
@SpringBootApplication
@EntityScan
@EruptScan
public class EruptDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(EruptDemoApplication.class, args);
    }

}
```

### LoginProxy 接口定义

```java
public interface LoginProxy {

    // 登录校验，如要提示校验结果请抛异常
    // pwd 是加密的，加密逻辑：md5(md5(pwd) + account)
    // 如果不希望加密，请前往配置文件，将：erupt-app.pwdTransferEncrypt 设置为 false 即可
    EruptUser login(String account, String pwd);

    // 登录成功
    default void loginSuccess(EruptUser eruptUser, String token) { }

    // 注销事件
    default void logout(String token) { }

    // 修改密码
    default void beforeChangePwd(EruptUser eruptUser, String newPwd) { }

}
```

### 方法示例

```java
@Service
public class TestLoginProxy implements LoginProxy {

    @Resource
    private EruptDao eruptDao;

    @Autowired
    private EruptUserService eruptUserService;
    
    // 额外请求参数可从 request 对象中获取
    @Resource
    private HttpServletRequest request;

    @Override
    public EruptUser login(String account, String pwd) {
        // 调用默认登录方法
        // eruptUserService.login(account, pwd);        
        // 错误提示
        // throw new RuntimeException("账号或密码错误"); 
        return eruptDao.queryEntity(EruptUser.class, "account = 'bi'");
    }

    @Override
    public void loginSuccess(EruptUser eruptUser, String token) {
        // TODO
    }

    @Override
    public void logout(String token) {
        // TODO
    }

    @Override
    public void beforeChangePwd(EruptUser eruptUser, String newPwd) {
        // TODO
    }
    
}
```

### 登录接口

```
http://localhost:8080/erupt-api/login?account=xxx&pwd=xxxx
```

## 单点登录（OAuth 2.0）

> 1.13.1 及以上版本支持

借助 OAuth2 标准，可轻松对接 GitHub、Google、微信、飞书、钉钉等标准 OAuth 体系，快速完成 SSO 单点登录。

### 接入流程

1. 添加 oauth2 依赖：

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-oauth2-client</artifactId>
</dependency>
```

2. 增加 @Bean 配置：

```java
@Configuration
@EnableWebSecurity
public class OauthConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .headers(h -> h.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/erupt-api/**", "/erupt-cloud-api/**").permitAll()
                        .requestMatchers(new RegexRequestMatcher(".*\\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|csv|json|xml|txt)(\\?.*)?$", null))
                        .permitAll().anyRequest().authenticated()
                )
                .oauth2Login(Customizer.withDefaults())
                .build();
    }

}
```

3. 增加授权页 `auth.html`，文件位置：`/resources/public/auth.html`

```html
<script>
  fetch("/erupt-api/login-token").then(res => {
    res.text().then(data => {
      localStorage.setItem("_token", JSON.stringify({"token": data, "account": null}))
      location.href = "/"
    })
  })
</script>
```
