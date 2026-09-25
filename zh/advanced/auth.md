# 登录与认证

Erupt 自带账号密码登录、图形验证码、[登录锁定](/zh/modules/erupt-upms/user#登录锁定)与[双因素认证](/zh/modules/erupt-upms/user#双因素认证-mfa)。要接入企业已有的身份体系或换一套登录界面，按需求选一条路即可，几条路可以叠加：

| 需求 | 方式 | 需要写代码 |
| --- | --- | --- |
| 用 Keycloak、Authing、飞书、钉钉、企业微信、GitHub 等外部账号登录 | [erupt-sso 单点登录](#快速接入单点登录-erupt-sso) <Badge type="tip" text="v2.3.0+" /> | 否，后台配置 |
| 校验逻辑交给 LDAP / AD、短信验证码、自有用户中心 | [LoginProxy 自定义登录逻辑](#自定义登录逻辑-loginproxy) | 一个接口实现 |
| 换一套自己的登录界面 | [自定义登录页](#自定义登录页) | 一个 HTML 页面 |
| 扫码、小程序等不经过登录页的登录 | [自行签发 Token](#自行签发-token) | 一个接口 |
| 深度定制 OAuth2 授权流程 | [Spring Security OAuth2 Client](#进阶-spring-security-oauth2-client) | Security 配置 + 回调 |

无论走哪条路，账户状态、有效期、IP 白名单、登录锁定与 MFA 的检查都在同一处生效，登录日志与 `LoginProxy` 的登录后钩子同样会被触发。

## 快速接入单点登录（erupt-sso） <Badge type="tip" text="v2.3.0+" />

[erupt-sso](/zh/modules/erupt-sso) 把登录委托给外部认证源：走 OAuth 2.0 授权码 + PKCE，认证源以数据行的形式在后台维护，内置 17 种供应商预设。四步接入：

**1. 引入依赖**（`erupt-spring-boot-starter-all` 已包含，可跳过）：

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-sso</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

**2. 新增认证源**：重启后打开 **系统管理 → 单点登录**，新增一行，在「供应商类型」里选择预设（Keycloak、Authing、Casdoor、Okta、Auth0、Entra ID、Google、GitLab、Atlassian、Slack、Zoom、GitHub、Gitee、飞书、钉钉、企业微信、微信），地址、授权范围与字段映射自动填好。

![单点登录认证源列表](/sso/providers.png)

**3. 填凭据并登记回调地址**：粘贴认证源控制台给出的客户端 ID / 密钥（自建服务还要把 Issuer 里的 `<host>` 之类占位符换成真实地址），然后把回调地址登记到认证源控制台：

```
https://<erupt 域名>/erupt-api/sso/callback/<编码>
```

**4. 保存即生效**：登录页立刻出现该认证源的按钮，用户点击后跳转认证源登录，回来后按「账号声明」匹配 erupt 用户；找不到时默认按认证源资料自动建号并赋予默认角色，也可以改为拒绝。

![登录页上的单点登录按钮](/ui/login-center.png)

:::tip 顺手就有的能力
- 用户与认证源的绑定自动维护，可在隐藏菜单「单点登录绑定」中查看或解绑
- 引入 [erupt-notice](/zh/modules/erupt-notice#认证源推送渠道) 后，飞书 / 钉钉 / 企业微信 / Slack 可直接用同一份认证源凭据向用户推送通知
- 认证源返回的资料可按需同步到 erupt 用户（每次覆盖或只补空字段），其他模块可通过 `EruptSsoBindService` 读取用户在认证源侧的标识
:::

字段含义、四种交换方式、绑定规则与全部预设见 [erupt-sso 模块文档](/zh/modules/erupt-sso)。

## 自定义登录逻辑（LoginProxy）

账号密码仍由 erupt 的登录页收集，但**校验**交给你：对接 LDAP / AD、自有用户中心、短信验证码，或在登录前后做额外动作。

### 注册方式

在 Spring Boot 入口类上加 `@EruptLogin`，值为 `LoginProxy` 的实现类：

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

### 接口定义

```java
public interface LoginProxy {

    // 登录校验，校验失败请抛异常，异常信息会显示给用户
    // pwd 是明文：前端三次 Base64 编码传输，框架在调用本方法前已解码
    // 默认实现委托给 EruptUserService.login，不重写也能正常登录
    default EruptUser login(String account, String pwd) {
        LoginModel loginModel = EruptSpringUtil.getBean(EruptUserService.class).login(account, pwd);
        if (loginModel.isPass()) {
            return loginModel.getEruptUser();
        } else {
            throw new RuntimeException(loginModel.getReason());
        }
    }

    // 登录成功（密码、SSO、自行签发 Token 都会触发）
    default void loginSuccess(EruptUser eruptUser, String token) { }

    // 注销
    default void logout(String token) { }

    // 修改密码前
    default void beforeChangePwd(EruptUser eruptUser, String newPwd) { }

    // 修改密码后
    default void afterChangePwd(EruptUser eruptUser, String originPwd, String newPwd) { }

    // 用户自助修改头像 / 姓名前，抛异常即拒绝，2.3.0+
    default void beforeUpdateProfile(EruptUser eruptUser, ProfileBody profile) { }

}
```

所有方法都是 `default` 方法，只重写需要的部分。

### 返回的 EruptUser

`login()` 必须返回**数据库中真实存在**的用户记录，框架随后按它的 `id` 加载角色与菜单权限：

| 字段 | 说明 |
| --- | --- |
| `id` | 用户 ID，必须对应 `e_upms_user` 表中的记录 |
| `account` | 登录账号 |
| `name` | 显示名称 |
| `isAdmin` | 为 `true` 时跳过所有菜单权限与数据范围过滤 |

外部身份体系里的用户在 erupt 中不存在时，先在 `login()` 里创建（或提示管理员建号），再返回。

### 示例：对接外部用户中心

```java
@Service
public class MyLoginProxy implements LoginProxy {

    @Resource
    private EruptDao eruptDao;

    // 额外的请求参数（如短信验证码）可从 request 中读取
    @Resource
    private HttpServletRequest request;

    @Override
    public EruptUser login(String account, String pwd) {
        // 1. 在此调用 LDAP / 外部接口校验 account + pwd（pwd 已是明文）
        //    存储侧校验 erupt 自己的密码请用 UpmsSecurityHelper.checkPwd
        // 2. 校验通过后返回对应的 erupt 用户
        EruptUser user = eruptDao.lambdaQuery(EruptUser.class)
                .eq(EruptUser::getAccount, account)
                .one();
        if (user == null) throw new RuntimeException("账号不存在");
        return user;
    }

    @Override
    public void loginSuccess(EruptUser eruptUser, String token) {
        // 例如：同步用户资料、写审计
    }

}
```

:::info 仍会执行的检查
`LoginProxy.login()` 只替换密码校验这一步。账户状态、有效期、IP 白名单、登录锁定在它之前生效，[MFA](/zh/modules/erupt-upms/user#双因素认证-mfa) 在它之后生效——绑定了 MFA 的账号即使走自定义校验，也要再输一次验证码。
:::

## 登录接口

自定义登录页、移动端或脚本直接调用登录接口即可，`LoginProxy` 的逻辑同样生效。

```http
POST /erupt-api/login
Content-Type: application/json

{
  "account": "erupt",
  "pwd": "<三次 Base64 编码后的密码>",
  "verifyCode": "<验证码，仅在需要时>",
  "verifyCodeMark": "<获取验证码时返回的标识>"
}
```

响应：

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

| 字段 | 说明 |
| --- | --- |
| `pass` | 是否通过；不通过时 `reason` 给出原因 |
| `useVerifyCode` | 为 `true` 表示下次登录必须携带验证码，验证码图片来自 `GET /erupt-api/code-img?mark=<随机数>` |
| `resetPwd` | 用户仍在使用初始密码，应提示修改 |
| `token` / `expire` | 会话令牌与过期时间，后续请求放在 `token` 请求头 |

- 密码默认三次 Base64 编码后传输：`btoa(btoa(btoa(pwd)))`，后端自动解码；`erupt-app.pwd-transfer-encrypt: false` 可关闭
- 同一账号 + IP 连续失败达到 `erupt-app.verify-code-count`（默认 2）次后要求验证码；达到 `erupt.upms.login-lock.max-failures`（默认 10）次后锁定 10 分钟
- 注销：`GET /erupt-api/logout`，携带 `token` 请求头

### 双因素认证的第二步 <Badge type="tip" text="v2.3.0+" />

账号绑定了 MFA 时，密码通过后**不会**返回 `token`，而是 `pass: false`、`mfaRequired: true` 和一张 5 分钟有效的 `mfaTicket`。携带 ticket 与验证器上的 6 位验证码（或一枚恢复码）再调用一次：

```http
POST /erupt-api/login-mfa
Content-Type: application/json

{
  "mfaTicket": "<上一步返回的 mfaTicket>",
  "code": "123456"
}
```

响应结构与 `/erupt-api/login` 相同。验证码错误时 `pass: false` 且仍带回 `mfaRequired` / `mfaTicket`，停留在验证码页重试即可；连续错误 5 次或 ticket 过期后不再返回 `mfaRequired`，需从密码重新开始。

## 自定义登录页

把登录界面整个换成自己的：页面可以放在项目内，也可以是任何能通过 HTTP 访问的地址。

**1. 配置页面地址**

```yaml
erupt-app:
  # 支持相对路径或完整 HTTP 地址
  login-page-path: /my-login.html
```

**2. 在页面中调用[登录接口](#登录接口)**，拿到 `token`（绑定了 MFA 的账号还要走 [`/login-mfa`](#双因素认证的第二步)）。

**3. 跳转授权中转页**：

```javascript
window.location.href = "/auth.html?token=" + token;
```

`/auth.html` 由 erupt-web 提供，它把 `token` 写入浏览器的 `localStorage` 后跳转到系统首页。

:::warning 注意
- 登录页与 erupt 不在同一域名时，需开启 `erupt.redis-session`，否则 token 无法跨域传递
- 不要在自己工程的 `/resources/public/auth.html` 放同名文件，那会覆盖框架自带页面；确有定制需求请另起路径，逻辑参考 `erupt-web/src/main/resources/public/auth.html`
- 登录页需要传递手机验证码等额外参数时，用 [LoginProxy](#自定义登录逻辑-loginproxy) 从 `HttpServletRequest` 中读取
:::

只是想换登录页的外观而不重写页面时，先看看内置的[五种登录页布局与自定义背景图](/zh/guide/ui#登录页布局)是否已经够用。

## 自行签发 Token

扫码登录、小程序、企业内部网关等不经过 `/erupt-api/login` 的场景，在自己的接口里完成身份确认后直接签发 erupt Token：

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
        // 1. 用业务参数确认身份，找到对应的 erupt 用户
        EruptUser eruptUser = eruptDao.lambdaQuery(EruptUser.class)
                .eq(EruptUser::getAccount, resolveAccount(ticket))
                .one();
        // 2. 签发 Token（有效期取 erupt.upms.expire-time-by-login）
        String token = Erupts.generateCode(16);
        eruptTokenService.loginToken(eruptUser, token);
        // 3. 与默认登录链路保持一致：触发 loginSuccess 钩子并记录登录日志
        LoginProxy loginProxy = EruptUserService.findEruptLogin();
        if (null != loginProxy) loginProxy.loginSuccess(eruptUser, token);
        eruptUserService.saveLoginLog(eruptUser, token);
        return token;
    }

}
```

浏览器端拿到 token 后同样跳转 `/auth.html?token=<token>` 即可进入系统。

## 进阶：Spring Security OAuth2 Client

:::tip 先考虑 erupt-sso
[erupt-sso](#快速接入单点登录-erupt-sso) 已覆盖 OIDC 与常见 OAuth2 平台，不需要下面这些代码。只有当授权流程需要深度定制（例如多步授权、自定义令牌校验）时才建议自建。
:::

1. 引入 `spring-boot-starter-oauth2-client`。

2. 放行 erupt 自己的接口与静态资源，开启 OAuth2 登录并指向自己的回调：

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
                        // erupt 接口有自己的 Token 鉴权
                        .requestMatchers("/erupt-api/**", "/erupt-cloud-api/**").permitAll()
                        .requestMatchers(new RegexRequestMatcher(".*\\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|csv|json|xml|txt)(\\?.*)?$", null))
                        .permitAll().anyRequest().authenticated()
                )
                .oauth2Login(o -> o.defaultSuccessUrl("/oauth-callback", true))
                .build();
    }

}
```

3. 在 `application.yml` 的 `spring.security.oauth2.client` 下配置认证源（GitHub 等标准平台只需 `client-id` / `client-secret` / `scope`，非标准平台还要在 `provider` 下写三个地址）。

4. 回调中把 OAuth2 身份映射为 erupt 用户并签发 Token，做法与[自行签发 Token](#自行签发-token) 相同，最后重定向到 `/auth.html?token=<token>`：

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
