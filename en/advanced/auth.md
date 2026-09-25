# Login & Authentication

Erupt ships with account/password login, an image captcha, [login lock](/en/modules/erupt-upms/user#login-lock) and [two-factor authentication](/en/modules/erupt-upms/user#two-factor-authentication-mfa). To plug in an identity system your company already runs, or to swap in a different login screen, pick the route that matches the need; the routes can be combined:

| Need | Route | Code required |
| --- | --- | --- |
| Sign in with external accounts from Keycloak, Authing, Feishu, DingTalk, WeCom, GitHub and the like | [erupt-sso single sign-on](#quick-single-sign-on-with-erupt-sso) <Badge type="tip" text="v2.3.0+" /> | No, configured in the admin UI |
| Hand verification to LDAP / AD, SMS codes or your own user directory | [Custom login logic with LoginProxy](#custom-login-logic-loginproxy) | One interface implementation |
| Replace the login screen with your own | [Custom login page](#custom-login-page) | One HTML page |
| QR-code, mini-program and other logins that bypass the login page | [Issue tokens yourself](#issuing-tokens-yourself) | One endpoint |
| Deeply customise the OAuth2 authorization flow | [Spring Security OAuth2 Client](#advanced-spring-security-oauth2-client) | Security config + callback |

Whichever route you take, the checks on account status, expiry, IP whitelist, login lock and MFA apply in the same place, and the login log and the post-login hook of `LoginProxy` fire just the same.

## Quick Single Sign-On with erupt-sso <Badge type="tip" text="v2.3.0+" />

[erupt-sso](/en/modules/erupt-sso) delegates login to an external identity provider: it runs the OAuth 2.0 authorization-code flow with PKCE, providers are maintained as rows in the admin UI, and 17 provider presets are built in. Four steps:

**1. Add the dependency** (already included in `erupt-spring-boot-starter-all`, skip if you use it):

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-sso</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

**2. Add a provider**: after restarting, open **System Management → SSO Provider**, add a row and pick a preset under "Provider Type" (Keycloak, Authing, Casdoor, Okta, Auth0, Entra ID, Google, GitLab, Atlassian, Slack, Zoom, GitHub, Gitee, Feishu, DingTalk, WeCom, WeChat); the endpoints, scopes and claim mapping are filled in for you.

![SSO provider list](/sso/providers.png)

**3. Paste the credentials and register the callback URL**: paste the client ID / secret issued by the provider's console (for a self-hosted service, also replace placeholders such as `<host>` in the Issuer with the real address), then register the callback URL in the provider's console:

```
https://<erupt host>/erupt-api/sso/callback/<code>
```

**4. Save, and it is live**: the login page immediately shows a button for that provider. Clicking it sends the user to the provider's login; on return the user is matched to an erupt user by the "Account claim". When no match is found, an account is created from the provider's profile and granted the default roles by default; this can be switched to rejecting instead.

![SSO buttons on the login page](/ui/login-center.png)

:::tip What you get for free
- The binding between a user and a provider is maintained automatically and can be viewed or unbound in the hidden menu "SSO Binding"
- With [erupt-notice](/en/modules/erupt-notice#provider-backed-channels) added, Feishu / DingTalk / WeCom / Slack can push notifications to users with the very same provider credentials
- The profile returned by the provider can be synced to the erupt user on demand (overwrite each time, or fill empty fields only), and other modules can read the user's identifier on the provider side through `EruptSsoBindService`
:::

Field meanings, the four exchange modes, binding rules and the full list of presets are in the [erupt-sso module docs](/en/modules/erupt-sso).

## Custom Login Logic (LoginProxy)

The account and password are still collected by erupt's login page, but the **verification** is yours: integrate LDAP / AD, your own user directory or SMS codes, or run extra actions before and after login.

### Registering

Add `@EruptLogin` to the Spring Boot entry class, with the value set to your `LoginProxy` implementation:

```java
@EruptLogin(MyLoginProxy.class)
@SpringBootApplication
@EntityScan
@EruptScan
public class EruptDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(EruptDemoApplication.class, args);
    }

}
```

### Interface

```java
public interface LoginProxy {

    // Login verification. Throw an exception on failure; its message is shown to the user
    // pwd is plain text: the front end sends it Base64-encoded three times and the framework decodes it before calling this method
    // The default implementation delegates to EruptUserService.login, so login works even if you do not override it
    default EruptUser login(String account, String pwd) {
        LoginModel loginModel = EruptSpringUtil.getBean(EruptUserService.class).login(account, pwd);
        if (loginModel.isPass()) {
            return loginModel.getEruptUser();
        } else {
            throw new RuntimeException(loginModel.getReason());
        }
    }

    // Successful login (fired by password login, SSO and self-issued tokens alike)
    default void loginSuccess(EruptUser eruptUser, String token) { }

    // Logout
    default void logout(String token) { }

    // Before a password change
    default void beforeChangePwd(EruptUser eruptUser, String newPwd) { }

    // After a password change
    default void afterChangePwd(EruptUser eruptUser, String originPwd, String newPwd) { }

    // Before a self-service avatar / name update; throw to reject. 2.3.0+
    default void beforeUpdateProfile(EruptUser eruptUser, ProfileBody profile) { }

}
```

Every method is a `default` method; override only the ones you need.

### The Returned EruptUser

`login()` must return a user record that **really exists in the database**; the framework then loads roles and menu permissions by its `id`:

| Field | Description |
| --- | --- |
| `id` | User ID; must correspond to a record in the `e_upms_user` table |
| `account` | Login account |
| `name` | Display name |
| `isAdmin` | When `true`, all menu permission and data-scope filtering is skipped |

When a user from the external identity system does not yet exist in erupt, create it inside `login()` first (or ask an administrator to create the account), then return it.

### Example: an External User Directory

```java
@Service
public class MyLoginProxy implements LoginProxy {

    @Resource
    private EruptDao eruptDao;

    // Extra request parameters (such as an SMS code) can be read from the request
    @Resource
    private HttpServletRequest request;

    @Override
    public EruptUser login(String account, String pwd) {
        // 1. Verify account + pwd against LDAP / an external API here (pwd is already plain text)
        //    To verify erupt's own stored password, use UpmsSecurityHelper.checkPwd
        // 2. Once verified, return the matching erupt user
        EruptUser user = eruptDao.lambdaQuery(EruptUser.class)
                .eq(EruptUser::getAccount, account)
                .one();
        if (user == null) throw new RuntimeException("Account does not exist");
        return user;
    }

    @Override
    public void loginSuccess(EruptUser eruptUser, String token) {
        // e.g. sync the user profile, write an audit record
    }

}
```

:::info Checks that still run
`LoginProxy.login()` replaces only the password-verification step. Account status, expiry, IP whitelist and login lock are enforced before it, and [MFA](/en/modules/erupt-upms/user#two-factor-authentication-mfa) after it: an account with MFA enabled still has to enter a code even when it goes through custom verification.
:::

## Login API

A custom login page, a mobile client or a script can call the login API directly; the `LoginProxy` logic applies just the same.

```http
POST /erupt-api/login
Content-Type: application/json

{
  "account": "erupt",
  "pwd": "<password, Base64-encoded three times>",
  "verifyCode": "<captcha, only when required>",
  "verifyCodeMark": "<the mark returned when the captcha was issued>"
}
```

Response:

```json
{
  "pass": true,
  "resetPwd": false,
  "useVerifyCode": false,
  "reason": null,
  "token": "jRP2ChJz8surtU2g",
  "expire": "2026-01-01T12:00:00"
}
```

| Field | Description |
| --- | --- |
| `pass` | Whether the login passed; when it did not, `reason` explains why |
| `useVerifyCode` | `true` means the next login attempt must carry a captcha; the captcha image comes from `GET /erupt-api/code-img?mark=<random>` |
| `resetPwd` | The user is still on the initial password and should be prompted to change it |
| `token` / `expire` | Session token and its expiry; send the token in the `token` request header on later requests |

- By default the password is Base64-encoded three times before transmission: `btoa(btoa(btoa(pwd)))`, and the backend decodes it automatically; `erupt-app.pwd-transfer-encrypt: false` disables this
- After `erupt-app.verify-code-count` (default 2) consecutive failures from the same account + IP a captcha is required; after `erupt.upms.login-lock.max-failures` (default 10) the account is locked for 10 minutes
- Logout: `GET /erupt-api/logout` with the `token` request header

### Second Step for Two-Factor Accounts <Badge type="tip" text="v2.3.0+" />

When the account has MFA enabled, a correct password does **not** return a `token`; the response is `pass: false`, `mfaRequired: true` and an `mfaTicket` valid for 5 minutes. Call once more with the ticket and the 6-digit code from the authenticator (or a recovery code):

```http
POST /erupt-api/login-mfa
Content-Type: application/json

{
  "mfaTicket": "<mfaTicket from the previous response>",
  "code": "123456"
}
```

The response has the same shape as `/erupt-api/login`. On a wrong code it is `pass: false` and still carries `mfaRequired` / `mfaTicket`, so stay on the code screen and retry; after 5 consecutive wrong codes or once the ticket expires, `mfaRequired` is no longer returned and the flow restarts from the password.

## Custom Login Page

Replace the login screen entirely with your own: the page can live inside the project or at any address reachable over HTTP.

**1. Configure the page address**

```yaml
erupt-app:
  # A relative path or a full HTTP URL
  login-page-path: /my-login.html
```

**2. Call the [login API](#login-api) from the page** to obtain a `token` (accounts with MFA enabled also go through [`/login-mfa`](#second-step-for-two-factor-accounts)).

**3. Redirect to the auth handoff page**:

```javascript
window.location.href = "/auth.html?token=" + token;
```

`/auth.html` is served by erupt-web; it writes the `token` to the browser's `localStorage` and then redirects to the system home page.

:::warning Notes
- When the login page is not on the same domain as erupt, enable `erupt.redis-session`, otherwise the token cannot be passed across domains
- Do not place a file with the same name at `/resources/public/auth.html` in your own project; it would shadow the built-in page. If you genuinely need a customised version, serve it from a different path and use `erupt-web/src/main/resources/public/auth.html` as the reference
- When the login page needs to pass extra parameters such as an SMS code, read them from `HttpServletRequest` in a [LoginProxy](#custom-login-logic-loginproxy)
:::

If you only want to change how the login page looks without rewriting it, first check whether the built-in [five login page layouts and custom background image](/en/guide/ui#login-page-layouts) already cover the need.

## Issuing Tokens Yourself

For QR-code login, mini programs, an internal corporate gateway and other scenarios that do not go through `/erupt-api/login`, confirm the identity in your own endpoint and issue an erupt token directly:

```java
@RestController
public class QrLoginController {

    @Resource
    private EruptDao eruptDao;

    @Resource
    private EruptTokenService eruptTokenService;

    @Resource
    private EruptUserService eruptUserService;

    @PostMapping("/qr-login")
    public String login(@RequestParam String ticket) {
        // 1. Confirm the identity from your business parameters and find the matching erupt user
        EruptUser eruptUser = eruptDao.lambdaQuery(EruptUser.class)
                .eq(EruptUser::getAccount, resolveAccount(ticket))
                .one();
        // 2. Issue the token (expiry comes from erupt.upms.expire-time-by-login)
        String token = Erupts.generateCode(16);
        eruptTokenService.loginToken(eruptUser, token);
        // 3. Match the default login flow: fire the loginSuccess hook and record the login log
        LoginProxy loginProxy = EruptUserService.findEruptLogin();
        if (null != loginProxy) loginProxy.loginSuccess(eruptUser, token);
        eruptUserService.saveLoginLog(eruptUser, token);
        return token;
    }

}
```

Once the browser has the token, redirect to `/auth.html?token=<token>` in the same way to enter the system.

## Advanced: Spring Security OAuth2 Client

:::tip Consider erupt-sso first
[erupt-sso](#quick-single-sign-on-with-erupt-sso) already covers OIDC and the common OAuth2 platforms, with none of the code below. Build your own only when the authorization flow needs deep customisation (for example multi-step authorization or custom token validation).
:::

1. Add `spring-boot-starter-oauth2-client`.

2. Permit erupt's own endpoints and static resources, enable OAuth2 login and point it at your own callback:

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
                        // erupt endpoints have their own token authentication
                        .requestMatchers("/erupt-api/**", "/erupt-cloud-api/**").permitAll()
                        .requestMatchers(new RegexRequestMatcher(".*\\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|csv|json|xml|txt)(\\?.*)?$", null))
                        .permitAll().anyRequest().authenticated()
                )
                .oauth2Login(o -> o.defaultSuccessUrl("/oauth-callback", true))
                .build();
    }

}
```

3. Configure the provider under `spring.security.oauth2.client` in `application.yml` (standard platforms such as GitHub need only `client-id` / `client-secret` / `scope`; non-standard platforms also need the three endpoints under `provider`).

4. In the callback, map the OAuth2 identity to an erupt user and issue a token, exactly as in [Issuing Tokens Yourself](#issuing-tokens-yourself), then redirect to `/auth.html?token=<token>`:

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
        EruptUser eruptUser = eruptDao.lambdaQuery(EruptUser.class)
                .eq(EruptUser::getAccount, oAuth2User.getAttribute("login"))
                .one();
        if (null == eruptUser) throw new RuntimeException("account not found");
        String token = Erupts.generateCode(16);
        eruptTokenService.loginToken(eruptUser, token);
        LoginProxy loginProxy = EruptUserService.findEruptLogin();
        if (null != loginProxy) loginProxy.loginSuccess(eruptUser, token);
        eruptUserService.saveLoginLog(eruptUser, token);
        return "redirect:/auth.html?token=" + token;
    }

}
```
