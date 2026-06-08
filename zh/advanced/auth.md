# 登录与认证

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

### EruptUser 字段说明

`login()` 方法需要返回一个 `EruptUser` 对象，框架通过该对象识别登录用户身份。常用字段如下：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `Integer` | 是 | 用户 ID，必须与数据库中 `erupt_user` 表的记录对应 |
| `account` | `String` | 是 | 登录账号 |
| `name` | `String` | 否 | 用户显示名称 |
| `isAdmin` | `Boolean` | 否 | 是否为管理员，管理员拥有所有权限 |

> `login()` 返回的 `EruptUser` 对象必须是数据库中真实存在的用户记录（`id` 有效），框架后续会根据此 `id` 查询该用户的角色和权限。若希望绕过权限体系，可将 `isAdmin` 设为 `true`。

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
        // 方式一：直接调用默认的用户名密码校验逻辑
        // return eruptUserService.login(account, pwd);

        // 方式二：自定义校验后，返回对应的数据库用户对象
        // pwd 已经过加密处理：md5(md5(pwd) + account)
        // 查询条件使用 JPQL，字段名为 Java 属性名
        EruptUser user = eruptDao.queryEntity(EruptUser.class, "account = '" + account + "'");
        if (user == null) {
            throw new RuntimeException("账号不存在");
        }
        // 在此处对接 LDAP、第三方 SSO 等外部认证系统
        return user;
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

```http
GET /erupt-api/login?account={{用户名}}&pwd={{密码}}&verifyCode={{验证码}}
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
                // 允许 iframe 嵌套（Erupt 内置页面有使用）
                .headers(h -> h.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable))
                .authorizeHttpRequests(auth -> auth
                        // 放行 Erupt API 接口，Erupt 内部已有自己的 Token 鉴权
                        .requestMatchers("/erupt-api/**", "/erupt-cloud-api/**").permitAll()
                        // 放行静态资源，正则含义：匹配以常见静态文件后缀结尾的 URL（支持带查询参数）
                        .requestMatchers(new RegexRequestMatcher(".*\\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|csv|json|xml|txt)(\\?.*)?$", null))
                        .permitAll().anyRequest().authenticated()
                )
                // 开启 OAuth2 登录，使用 application.yml 中的提供商配置
                .oauth2Login(Customizer.withDefaults())
                .build();
    }

}
```

3. 在 `application.yml` 中配置 OAuth2 提供商（以 GitHub 为例）：

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          github:
            client-id: your-github-client-id
            client-secret: your-github-client-secret
            scope: read:user, user:email
          # 飞书示例
          feishu:
            client-id: your-feishu-app-id
            client-secret: your-feishu-app-secret
            authorization-grant-type: authorization_code
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
            scope: contact:user.base:readonly
        provider:
          feishu:
            authorization-uri: https://open.feishu.cn/open-apis/authen/v1/authorize
            token-uri: https://open.feishu.cn/open-apis/authen/v2/oauth/token
            user-info-uri: https://open.feishu.cn/open-apis/authen/v1/user_info
            user-name-attribute: name
```

4. 增加授权页 `auth.html`，文件位置：`/resources/public/auth.html`

OAuth2 认证成功后，Spring Security 会重定向到此页面。该页面的作用是将 OAuth2 session 转换为 Erupt Token，并存入 `localStorage` 供前端使用。

```html
<script>
  fetch("/erupt-api/login-token").then(res => {
    if (res.ok) {
      res.text().then(data => {
        localStorage.setItem("_token", JSON.stringify({"token": data, "account": null}))
        location.href = "/"
      })
    } else {
      document.body.innerText = "授权失败，请重试"
    }
  })
</script>
```
