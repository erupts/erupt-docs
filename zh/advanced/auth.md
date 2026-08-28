# 登录与认证（LoginProxy）

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
    // pwd 是明文：前端三次 Base64 编码传输，框架在调用本方法前已 SecretUtil.decodeSecret(pwd, 3) 解回明文
    // 如不希望传输时编码，请前往配置文件，将：erupt-app.pwdTransferEncrypt 设置为 false 即可
    // 注意：这是一个 default 方法，默认已委托给 EruptUserService.login，不重写也能正常登录
    default EruptUser login(String account, String pwd) {
        LoginModel loginModel = EruptSpringUtil.getBean(EruptUserService.class).login(account, pwd);
        if (loginModel.isPass()) {
            return loginModel.getEruptUser();
        } else {
            throw new RuntimeException(loginModel.getReason());
        }
    }

    // 登录成功
    default void loginSuccess(EruptUser eruptUser, String token) { }

    // 注销事件
    default void logout(String token) { }

    // 修改密码
    default void beforeChangePwd(EruptUser eruptUser, String newPwd) { }

    // 密码修改完成
    default void afterChangePwd(EruptUser eruptUser, String originPwd, String newPwd) { }

}
```

> 接口中的所有方法都是 `default` 方法，实现类只需按需重写其中一部分即可。

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
        // pwd 是明文（框架已解码），存储侧校验请用 UpmsSecurityHelper.checkPwd
        EruptUser user = eruptDao.lambdaQuery(EruptUser.class)
                .eq(EruptUser::getAccount, account)
                .one();
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

登录接口为 `POST`，参数通过 JSON 请求体（`LoginBody`）传递：

```http
POST /erupt-api/login
Content-Type: application/json

{
  "account": "{{用户名}}",
  "pwd": "{{密码}}",
  "verifyCode": "{{验证码}}",
  "verifyCodeMark": "{{验证码标识}}"
}
```

- `verifyCode` / `verifyCodeMark` 仅在需要验证码时必填，`verifyCodeMark` 是获取验证码时返回的标识
- 默认情况下 `pwd` 需三次 Base64 编码后传输（`btoa(btoa(btoa(pwd)))`），将 `erupt-app.pwdTransferEncrypt` 设为 `false` 可关闭

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

4. 将 OAuth2 认证结果换成 Erupt Token

`erupt-web` 已内置授权中转页 `/auth.html`（源码位于 `erupt-web/src/main/resources/public/auth.html`）。它的逻辑非常简单：从 URL 查询参数中读取 `token`，写入 `localStorage` 的 `_token` 键，然后跳转回后台首页。

```js
// 内置 auth.html 的核心逻辑（无需自己编写）
localStorage.setItem("_token", JSON.stringify({ token: param["token"] }));
window.location = "./";
```

因此第三方登录的完整流程是：**外部认证成功 → 服务端签发 Erupt Token → 浏览器重定向到 `/auth.html?token=xxx`**。

服务端签发 Token 使用 `EruptTokenService`：

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
        // 将 OAuth2 身份映射为 erupt_user 表中的用户
        String account = oAuth2User.getAttribute("login");
        EruptUser eruptUser = eruptDao.lambdaQuery(EruptUser.class)
                .eq(EruptUser::getAccount, account)
                .one();
        if (null == eruptUser) throw new RuntimeException("account not found");
        // 签发 Erupt Token（过期时间取 erupt.upms 配置）
        String token = Erupts.generateCode(16);
        eruptTokenService.loginToken(eruptUser, token);
        // 与框架默认登录链路保持一致：触发 loginSuccess 钩子并记录登录日志
        LoginProxy loginProxy = EruptUserService.findEruptLogin();
        if (null != loginProxy) loginProxy.loginSuccess(eruptUser, token);
        eruptUserService.saveLoginLog(eruptUser, token);
        return "redirect:/auth.html?token=" + token;
    }

}
```

最后，把第 2 步 `SecurityFilterChain` 中的 `.oauth2Login(Customizer.withDefaults())` **替换**为下面这行，让登录成功后跳转到上面的回调接口：

```java
.oauth2Login(o -> o.defaultSuccessUrl("/oauth-callback", true))
```

::: warning 是替换不是追加
同一个 `HttpSecurity` 上重复调用 `.oauth2Login(...)`，后一次会覆盖前一次的配置。请直接改掉第 2 步那一行，不要两行都写。
:::

::: warning 不要自建 auth.html
`/auth.html` 由 `erupt-web` 提供。若在自己工程的 `/resources/public/auth.html` 放置同名文件，会覆盖框架自带页面。确有定制需求时，请参考上述内置文件的实现另起一个路径。
:::
