# Login & Authentication (LoginProxy)

## Custom Login Logic with @EruptLogin

Override the default login logic to integrate LDAP, Single Sign-On (SSO), and other authentication systems.

### Usage

Add the `@EruptLogin` annotation to the Spring Boot entry class, with the value set to an implementation of the `LoginProxy` interface:

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

### LoginProxy Interface Definition

```java
public interface LoginProxy {

    // Login validation. Throw an exception to indicate a failed login.
    // pwd is encrypted using: md5(md5(pwd) + account)
    // To disable encryption, set erupt-app.pwdTransferEncrypt to false in the config file.
    EruptUser login(String account, String pwd);

    // Called on successful login
    default void loginSuccess(EruptUser eruptUser, String token) { }

    // Called on logout
    default void logout(String token) { }

    // Called before changing password
    default void beforeChangePwd(EruptUser eruptUser, String newPwd) { }

}
```

### EruptUser Field Reference

The `login()` method must return an `EruptUser` object, which the framework uses to identify the logged-in user. Key fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `Integer` | Yes | User ID — must correspond to a record in the `erupt_user` table |
| `account` | `String` | Yes | Login account |
| `name` | `String` | No | Display name |
| `isAdmin` | `Boolean` | No | Whether the user is an admin (admins have all permissions) |

> The `EruptUser` returned by `login()` must be a real record in the database (valid `id`). The framework will subsequently query this user's roles and permissions by `id`. To bypass the permission system entirely, set `isAdmin` to `true`.

### Implementation Example

```java
@Service
public class TestLoginProxy implements LoginProxy {

    @Resource
    private EruptDao eruptDao;

    @Autowired
    private EruptUserService eruptUserService;
    
    // Additional request parameters can be retrieved from the request object
    @Resource
    private HttpServletRequest request;

    @Override
    public EruptUser login(String account, String pwd) {
        // Option 1: Delegate to the default username/password validation logic
        // return eruptUserService.login(account, pwd);

        // Option 2: Custom validation, then return the corresponding database user object.
        // pwd is already encrypted: md5(md5(pwd) + account)
        // The query uses JPQL; field names are Java property names.
        EruptUser user = eruptDao.queryEntity(EruptUser.class, "account = '" + account + "'");
        if (user == null) {
            throw new RuntimeException("Account does not exist");
        }
        // Integrate LDAP, third-party SSO, or other external auth systems here
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

### Login Endpoint

```http
GET /erupt-api/login?account={{username}}&pwd={{password}}&verifyCode={{captcha}}
```

## Single Sign-On (OAuth 2.0)

> Supported since 1.13.1+

Using the OAuth2 standard, you can easily integrate GitHub, Google, WeChat, Feishu, DingTalk, and other standard OAuth providers for SSO.

### Integration Steps

1. Add the OAuth2 dependency:

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-oauth2-client</artifactId>
</dependency>
```

2. Add the `@Bean` configuration:

```java
@Configuration
@EnableWebSecurity
public class OauthConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                // Allow iframe embedding (used by Erupt's built-in pages)
                .headers(h -> h.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable))
                .authorizeHttpRequests(auth -> auth
                        // Allow Erupt API endpoints; Erupt handles its own token auth internally
                        .requestMatchers("/erupt-api/**", "/erupt-cloud-api/**").permitAll()
                        // Allow static resources (regex matches common static file extensions with optional query params)
                        .requestMatchers(new RegexRequestMatcher(".*\\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|csv|json|xml|txt)(\\?.*)?$", null))
                        .permitAll().anyRequest().authenticated()
                )
                // Enable OAuth2 login using the provider config in application.yml
                .oauth2Login(Customizer.withDefaults())
                .build();
    }

}
```

3. Configure the OAuth2 provider in `application.yml` (using GitHub as an example):

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
          # Feishu example
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

4. Create the authorization page `auth.html` at `/resources/public/auth.html`.

After a successful OAuth2 authentication, Spring Security will redirect to this page. Its role is to convert the OAuth2 session into an Erupt Token and store it in `localStorage` for the frontend to use.

```html
<script>
  fetch("/erupt-api/login-token").then(res => {
    if (res.ok) {
      res.text().then(data => {
        localStorage.setItem("_token", JSON.stringify({"token": data, "account": null}))
        location.href = "/"
      })
    } else {
      document.body.innerText = "Authorization failed, please try again"
    }
  })
</script>
```
