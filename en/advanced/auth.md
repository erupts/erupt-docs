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
    // pwd is plain text: the front end sends it Base64-encoded three times, and the framework
    // already called SecretUtil.decodeSecret(pwd, 3) before invoking this method
    // To disable encryption, set erupt-app.pwdTransferEncrypt to false in the config file.
    // Note: this is a default method — it already delegates to EruptUserService.login,
    // so login works even if you do not override it.
    default EruptUser login(String account, String pwd) {
        LoginModel loginModel = EruptSpringUtil.getBean(EruptUserService.class).login(account, pwd);
        if (loginModel.isPass()) {
            return loginModel.getEruptUser();
        } else {
            throw new RuntimeException(loginModel.getReason());
        }
    }

    // Called on successful login
    default void loginSuccess(EruptUser eruptUser, String token) { }

    // Called on logout
    default void logout(String token) { }

    // Called before changing password
    default void beforeChangePwd(EruptUser eruptUser, String newPwd) { }

    // Called after the password has been changed
    default void afterChangePwd(EruptUser eruptUser, String originPwd, String newPwd) { }

}
```

> Every method on the interface is a `default` method — implementations only need to override the ones they care about.

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
        // pwd is plain text (already decoded by the framework); verify it with UpmsSecurityHelper.checkPwd
        EruptUser user = eruptDao.lambdaQuery(EruptUser.class)
                .eq(EruptUser::getAccount, account)
                .one();
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

The login endpoint is a `POST`; parameters are sent as a JSON request body (`LoginBody`):

```http
POST /erupt-api/login
Content-Type: application/json

{
  "account": "{{username}}",
  "pwd": "{{password}}",
  "verifyCode": "{{captcha}}",
  "verifyCodeMark": "{{captcha mark}}"
}
```

- `verifyCode` / `verifyCodeMark` are only required when a captcha is in play; `verifyCodeMark` is the identifier returned when the captcha was issued.
- By default `pwd` must be Base64-encoded three times before transmission (`btoa(btoa(btoa(pwd)))`); set `erupt-app.pwdTransferEncrypt` to `false` to disable this.

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

4. Exchange the OAuth2 authentication result for an Erupt Token

`erupt-web` already ships a handoff page at `/auth.html` (source: `erupt-web/src/main/resources/public/auth.html`). Its logic is deliberately simple: read `token` from the URL query string, write it to the `_token` key in `localStorage`, then redirect back to the admin home page.

```js
// Core logic of the built-in auth.html — you do not need to write this yourself
localStorage.setItem("_token", JSON.stringify({ token: param["token"] }));
window.location = "./";
```

So the full third-party login flow is: **external authentication succeeds → the server issues an Erupt Token → the browser is redirected to `/auth.html?token=xxx`**.

Issue the token server-side with `EruptTokenService`:

```java
@Controller
public class OauthCallbackController {

    @Resource
    private EruptDao eruptDao;

    @Resource
    private EruptTokenService eruptTokenService;

    @Resource
    private EruptUserService eruptUserService;

    @GetMapping("/oauth-callback")
    public String callback(@AuthenticationPrincipal OAuth2User oAuth2User) {
        // Map the OAuth2 identity onto a row in the erupt_user table
        String account = oAuth2User.getAttribute("login");
        EruptUser eruptUser = eruptDao.lambdaQuery(EruptUser.class)
                .eq(EruptUser::getAccount, account)
                .one();
        if (null == eruptUser) throw new RuntimeException("account not found");
        // Issue an Erupt Token (expiry comes from the erupt.upms configuration)
        String token = Erupts.generateCode(16);
        eruptTokenService.loginToken(eruptUser, token);
        // Match the framework's own login flow: fire the loginSuccess hook and record the login log
        LoginProxy loginProxy = EruptUserService.findEruptLogin();
        if (null != loginProxy) loginProxy.loginSuccess(eruptUser, token);
        eruptUserService.saveLoginLog(eruptUser, token);
        return "redirect:/auth.html?token=" + token;
    }

}
```

Finally, **replace** the `.oauth2Login(Customizer.withDefaults())` line in the step 2 `SecurityFilterChain` with the line below, so a successful login lands on the callback endpoint above:

```java
.oauth2Login(o -> o.defaultSuccessUrl("/oauth-callback", true))
```

::: warning Replace, don't append
Calling `.oauth2Login(...)` twice on the same `HttpSecurity` means the second call overrides the first. Edit the line from step 2 in place rather than adding both.
:::

::: warning Do not create your own auth.html
`/auth.html` is served by `erupt-web`. Placing a file with the same name at `/resources/public/auth.html` in your own project will shadow the built-in page. If you genuinely need a customized version, use the built-in file as a reference and serve it from a different path.
:::
