# Custom Login Page

> Customize the login page to support scenarios such as SMS verification code login and WeChat QR code login.

## 1. Create the Login Page

Create a login page with a structure and logic tailored to your business needs (it can also be hosted outside the project path, as long as it is accessible via HTTP).

Configure the custom login page path:

```properties
# Supports HTTP paths or relative paths
erupt-app.loginPagePath: /xxx.html
```

## 2. Call the Login Endpoint to Get a Token

```http
GET {{host}}/erupt-api/login?account={{username}}&pwd={{password}}&verifyCode={{captcha}}
```

Response:

```json
{
  "pass": true,
  "reason": null,
  "token": "jRP2ChJz8surtU2g",
  "useVerifyCode": false
}
```

::: tip Notes
- To disable the captcha: adjust `erupt-app.verifyCodeCount` in `application.yml`
- To disable password encryption in transit: adjust `erupt-app.pwdTransferEncrypt` in `application.yml`
- To pass extra parameters: parse them via a custom `@EruptLogin` implementation — see [Custom Login Logic](/en/advanced/auth)
- Password encryption formula: `md5(md5(pwd) + account)`
:::

## 3. Redirect to the Authorization Page

After a successful login (`pass === true`), redirect to the authorization forwarding page:

```javascript
window.open("{{host}}/auth.html?token=" + token)
```

The user will be automatically redirected to the system home page after authorization.

::: warning
If the login page and the Erupt application are on different domains, you must enable the `redisSession` configuration; otherwise the token cannot be properly transferred.
:::

---

## Extension 1: Custom Parameter Parsing

To validate extra parameters such as SMS verification codes, override the login logic. See: [Custom Login Logic @EruptLogin](/en/advanced/auth)

## Extension 2: Custom Login Endpoint

A generic token registration method is available for scenarios that do not go through the `/login` endpoint (e.g., third-party QR code login):

```java
@RestController
public class LoginController {

    @Resource
    private EruptTokenService eruptTokenService;

    @Resource
    private EruptUserService eruptUserService;

    @Resource
    private EruptDao eruptDao;

    @PostMapping("/login")
    public String login() {
        // Query the user by business parameters
        EruptUser eruptUser = eruptDao.lambdaQuery(EruptUser.class)...
        String token = RandomStringUtils.randomAlphanumeric(20);
        eruptTokenService.loginToken(eruptUser, token);
        eruptUserService.saveLoginLog(eruptUser, token); // Record the login log
        return token;
    }

}
```
