# 自定义登录页

> 自定义登录页，可实现验证码登录与微信扫码登录等个性化登录场景

## 1. 创建登录页

创建登录页面，结构与逻辑根据业务自行定义（也可存放于非项目路径下，能通过 HTTP 访问即可）。

配置自定义登录页路径：

```properties
# 支持 HTTP 路径或相对路径
erupt-app.loginPagePath: /xxx.html
```

## 2. 调用登录接口获取 token

```http
GET {{host}}/erupt-api/login?account={{用户名}}&pwd={{密码}}&verifyCode={{验证码}}
```

响应结果：

```json
{
  "pass": true,
  "reason": null,
  "token": "jRP2ChJz8surtU2g",
  "useVerifyCode": false
}
```

::: tip 注意事项
- 不希望启用验证码：在 `application.yml` 中调整 `erupt-app.verifyCodeCount` 配置
- 不希望密码加密传输：在 `application.yml` 中调整 `erupt-app.pwdTransferEncrypt` 配置
- 需要传递额外参数：通过自定义 `@EruptLogin` 解析，详见[自定义登录逻辑](/advanced/auth)
- 密码加密规则：`md5(md5(pwd) + account)`
:::

## 3. 跳转授权页面

登录成功后（`pass === true`），跳转到授权转发页面：

```javascript
window.open("{{host}}/auth.html?token=" + token)
```

授权成功后会自动跳转到系统首页。

::: warning
若登录页与 Erupt 应用不在同一域名下，需开启 `redisSession` 配置，否则 token 无法正常传递。
:::

---

## 扩展 1：自定义参数解析

如需校验手机验证码等额外参数，建议重写登录逻辑，详见：[自定义登录逻辑 @EruptLogin](/advanced/auth)

## 扩展 2：自定义登录接口

提供通用的 token 注册方法，适用于不走 `/login` 接口的场景（如第三方扫码登录）：

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
        // 通过业务参数查询用户信息
        EruptUser eruptUser = eruptDao.lambdaQuery(EruptUser.class)...
        String token = RandomStringUtils.randomAlphanumeric(20);
        eruptTokenService.loginToken(eruptUser, token);
        eruptUserService.saveLoginLog(eruptUser, token); // 记录登录日志
        return token;
    }

}
```
