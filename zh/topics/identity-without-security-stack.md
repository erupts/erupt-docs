---
title: "不依赖 Spring Security 的登录链"
description: "一个后台框架接 SSO，通常意味着引 spring-security-oauth2-client、写 SecurityFilterChain、再挑一个 JWT 库。Erupt 一个都没引——这一期讲那条自己走完的登录链，以及它换来的三个收口点。"
outline: deep
---

# 第 13 期 · 不依赖 Spring Security 的登录链

> 国内后台框架处理身份，路径几乎是同一条：引 Spring Security 或 Sa-Token，配 `SecurityFilterChain`，接 OAuth2 要再加 `spring-security-oauth2-client`，验 id_token 要再挑一个 JWT 库。Erupt 一个都没引。这不是"造轮子"的偏好——是因为一旦登录链被拆进 Filter 与外部 starter，就再也没法保证"账号是否可用"这个判断在整个系统里只有一份。
>
> 发布于 2026-09-21 · 阅读 ~11 min

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt 微信公众号" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · 公众号</div>
    <div class="topic-mp-qr__title">扫码关注 Erupt 公众号</div>
    <p class="topic-mp-qr__desc">每期专题首发于此，另有版本动态、源码解读、社区精选案例。</p>
  </div>
</div>

[[toc]]

## 一、为什么写这篇

过去两周 Erupt 主仓合进了一组看起来互不相干的提交：一个新插件模块 `erupt-plugin/erupt-sso`、TOTP 二次验证、登录失败锁定、改密踢掉其他会话、IP 白名单支持 CIDR 掩码。

放在版本日志里它们是五条并列的功能。但它们改的是同一件事——**一个请求凭什么拿到 token**。

而这件事在绝大多数 Java 后台框架里，已经不属于框架自己了。RuoYi 把它交给 Spring Security，JeecgBoot 交给 Shiro，接 OAuth2 再叠一层 `spring-security-oauth2-client`。这条路的好处很实在：协议细节有人维护。代价也很实在，且很少被讲清楚：

**登录不再是一条线，而是一张网。**密码登录走 `AuthenticationProvider`，SSO 登录走 `OAuth2LoginAuthenticationFilter`，LDAP 走另一个 Provider。它们各自有各自的"成功"。于是"这个账号过期了没有""这个 IP 准不准进"这类判断，要么在每条分支里复制一遍，要么落在某个 `UserDetailsService` 里——而 OAuth2 那条分支根本不经过它。

Erupt 押的是反向：**登录链不外包，换来两个物理上唯一的收口点。**一处判断账号可不可用，一处发 token。无论你从密码、TOTP、SSO 还是自定义 `LoginProxy` 进来，都必须从这两个针眼里穿过去。

## 二、两种做法：委托给 Filter 链，还是收口到一个 Service

| | 委托给安全框架（Spring Security / Shiro） | 收口到一个 Service（Erupt） |
| --- | --- | --- |
| 登录入口 | 每种认证方式一个 Filter / Provider | 一个 `EruptUserService`，其余路径调它 |
| 账号可用性（状态 / 有效期 / IP） | 散落在各 Provider，OAuth2 分支常绕过 | `checkAccountUsable` 一处，密码与 SSO 两条路径都调它 |
| 发 token | 各分支自行 `SecurityContextHolder` 落地 | `completeLogin` 一处 |
| 加一个 SSO Provider | 改 yaml / 改 Java 配置 → 重启 | 后台表单新增一行 → 立即生效 |
| 协议细节 | starter 维护，升级跟着 Spring 走 | 自己维护，约 500 行，只覆盖授权码 + PKCE |
| 定制成本 | 要先理解 Filter 链顺序 | 实现 `LoginProxy` 的某个 default 方法 |

第二列不是"更好"，是**取舍不同**：Erupt 放弃了协议的广度（没有隐式流、没有客户端凭证、不做资源服务器），换取一条能被完整读完的登录链。

代价要说在前面：如果你的系统需要把自己做成 **OAuth2 授权服务器**、需要 SAML、或者需要细到方法级的 `@PreAuthorize`，Erupt 这条路给不了你，老老实实上 Spring Security。Erupt 解决的是另一个场景——**后台系统自己要登录进来**。

## 三、这条链上到底有几关

先给可数的事实。整条登录链的代码都在 `erupt-upms` 与 `erupt-plugin/erupt-sso` 两个模块里：

| 关卡 | 落点 | 可配项 |
| --- | --- | --- |
| 登录锁定（account + IP） | `EruptUserService#isLoginLocked` | `erupt.upms.login-lock.*` |
| 图形验证码 | `EruptUserService#loginErrorCountPlus` | `erupt-app.verify-code-count` |
| 账号状态 / 有效期 / IP 白名单 | `EruptUserService#checkAccountUsable` | 用户表单三个字段 |
| 密码校验（SHA-512 + 盐） | `EruptUserService#checkPwd` | `erupt-app.pwd-transfer-encrypt` |
| TOTP 二次验证 | `EruptMfaService#verifyForLogin` | `erupt-app.mfa.*` |
| 外部身份提供方 | `EruptSsoService#callback` | `EruptSso` 表的每一行 |
| 发 token + 写登录日志 | `EruptUserService#completeLogin` | `erupt.upms.expire-time-by-login` |

七关，两个模块，零个安全框架依赖。`erupt-sso` 的 `pom.xml` 只有一个 `provided` 依赖：`erupt-upms`。

## 四、SSO Provider 是一张表，不是一段 yaml

接一个新的身份提供方，在 Erupt 里不是改配置文件，是在后台点"新增"——因为 provider 本身就是一个 `@Erupt` 实体：

```java
@Entity
@Table(name = "e_upms_sso")
@Erupt(
        name = "SSO Provider",
        orderBy = "EruptSso.sort asc",
        dataProxy = EruptSsoDataProxy.class,
        layout = @Layout(formSteps = true),
        dragSort = @DragSort(field = "sort")
)
@EruptI18n
public class EruptSso extends MetaModelUpdateVo {

    @Column(length = 512)
    @EruptField(
            edit = @Edit(title = "Issuer", desc = "OIDC issuer; endpoints below are discovered from it when left empty",
                    inputType = @InputType(fullSpan = true))
    )
    private String issuer;

    // No @View: a client secret is write only, the framework masks the form value
    // and restores the stored one when the mask comes back unchanged
    @Column(length = 512)
    @EruptField(
            edit = @Edit(title = "Client Secret", notNull = true, type = EditType.PASSWORD)
    )
    private String clientSecret;

    @Column(length = 64)
    @EruptField(
            edit = @Edit(title = "Account Claim", notNull = true,
                    desc = "Claim matched against an erupt account on first login, e.g. preferred_username")
    )
    private String accountClaim = "preferred_username";

}
```

这带来几个直接后果，都不是设计文档里的承诺，而是"因为它是 `@Erupt` 实体"自动就有的：

- **不重启。**新增一行，登录页的按钮立刻多一个。
- **client secret 天然不外泄。**它没有 `@View`，所以不进列表；`EditType.PASSWORD` 让编辑回显只返回掩码，原值永不下发（见 [PASSWORD 组件](/zh/field-types/password#编辑回显掩码)）。这条不是 SSO 写的逻辑，是框架的既有行为。
- **谁改过这一行有记录。**它走的是同一套[操作日志](/zh/modules/erupt-upms/log)。
- **谁能改这一行可配。**同一套[菜单权限](/zh/modules/erupt-upms/role)。

`issuer` 留空则按 OIDC 规范从 `/.well-known/openid-configuration` 发现三个端点，并缓存；填了 `authorizeUrl` / `tokenUrl` / `userInfoUrl` 则直接用——后者是留给 GitHub、Gitee 这类**没有发现文档**的纯 OAuth2 提供方的。

:::tip 一个反直觉的决定：我们从不读 id_token
拿到 id_token 就地解出 claims，是 OIDC 最"标准"的用法，也是引入 JWT 库的唯一理由。`EruptSsoService` 不这么做——它把 access token 只花在一次调用上，就是 provider 的 userinfo 端点。

代价是每次登录多一个 HTTP 往返。收益是：**OIDC 提供方（Keycloak、Authing、Okta）和纯 OAuth2 提供方（GitHub、Gitee）走的是同一条代码路径**，而依赖树里没有 JWT 库，也就没有那一类历史上反复出问题的签名校验代码需要我们自己写对。
:::

飞书、企微、钉钉这类国内提供方还有第三种形态：userinfo 返回的不是 claims 本身，而是一个信封——`{code, msg, data:{...}}`，且 HTTP 状态码永远是 200。`EruptSsoService#unwrap` 把信封拆开，并把非零 `code` 当成失败，否则一个业务错误会被当成一份空 claims 静默通过。

## 五、token 不进 URL，检查不留后门

SSO 回调最容易出错的地方，是**登录成功之后**。provider 把浏览器重定向回来，此时服务端已经知道你是谁了，怎么把这个"知道"交给前端？

最省事的写法是重定向到 `/#/login?token=xxx`。于是这个 token 留在浏览器历史里、留在 Referer 里、可能留在反向代理的访问日志里。

Erupt 走两步：回调只发一张 60 秒、一次性的 **ticket**，前端拿 ticket 走一次 `POST /erupt-api/sso/exchange` 换回真正的 `LoginModel`。

```java
public String callback(String providerCode, String state, String authCode, HttpServletRequest request) {
    Object raw = sessionService.get(SsoSessionKey.SSO_STATE + state);
    sessionService.remove(SsoSessionKey.SSO_STATE + state); // single use, whatever happens next
    Erupts.requireNonNull(raw, I18nTranslate.$translate("sso.state_invalid"));
    SsoState payload = GsonFactory.getGson().fromJson(raw.toString(), SsoState.class);
    EruptSso sso = this.findEnabled(providerCode);
    // the state was issued for one provider; a code replayed against another must not pass
    Erupts.requireTrue(sso.getId().equals(payload.getSsoId()), I18nTranslate.$translate("sso.state_invalid"));

    Endpoints endpoints = this.endpoints(sso);
    String accessToken = this.exchangeCode(sso, endpoints, authCode, payload.getVerifier(), request);
    JsonObject claims = this.userInfo(endpoints, accessToken);
    EruptUser eruptUser = transactionTemplate.execute(status -> this.resolveUser(sso, claims));

    String reason = eruptUserService.checkAccountUsable(eruptUser);
    if (null != reason) throw new EruptWebApiRuntimeException(reason);

    LoginModel loginModel = new LoginModel(true, eruptUser);
    eruptUserService.completeLogin(loginModel, EruptUserService.findEruptLogin());
    String ticket = Erupts.generateCode(32);
    sessionService.put(SsoSessionKey.SSO_TICKET + ticket, GsonFactory.getGson().toJson(loginModel), TICKET_EXPIRE_SECONDS, TimeUnit.SECONDS);
    return ticket;
}
```

这段里真正值钱的是倒数第六行那两句：`checkAccountUsable` 与 `completeLogin`。

**外部身份提供方说你是谁，不等于你可以进来。**账号被停用、账号过期、来源 IP 不在白名单——这三关密码登录要过，SSO 登录一样要过，而且是调的同一个方法。这就是第一节说的"针眼"：如果 SSO 自己写一套登录成功逻辑，这三关迟早会漏掉一关。

同理 `state`：它不携带任何 payload，只是一把指向服务端短期记录的钥匙，用完即焚，且记录里存着它是为哪个 provider 签发的——否则 A 提供方的授权码可以拿去 B 提供方的回调上重放。PKCE 的 verifier 也存在这条记录里，不经过浏览器。

## 六、跟 JeecgBoot / RuoYi / 宜搭怎么比？

| 维度 | JeecgBoot（Shiro） | 若依 RuoYi（Spring Security） | 钉钉宜搭 | **Erupt** |
| --- | --- | --- | --- | --- |
| 新增一个 OAuth2 提供方 | 改配置 + 写 Controller，重启 | 自行接入 `oauth2-client` | 不可能：身份只能是钉钉 | 后台表单新增一行，不重启 |
| 账号可用性检查 | Realm 里，SSO 分支易绕过 | `UserDetailsService`，OAuth2 分支不经过 | 不暴露 | `checkAccountUsable` 唯一入口 |
| 二次验证 | 需自行集成 | 需自行集成 | 走钉钉 | 内置 TOTP，`erupt-app.mfa.enable` |
| 登录失败锁定 | 有（account 维度） | 有（account 维度） | 平台侧 | account + IP 维度 |
| IP 白名单 | 需自行实现 | 需自行实现 | 企业策略 | 用户表单字段，支持 CIDR |
| token 是否进 URL | 视实现 | 视实现 | — | 否，一次性 ticket 换取 |
| 安全框架依赖 | shiro-spring | spring-security-* | — | 无 |

有两处差异值得单独拎出来，因为它们是"细节做对了"而不是"功能有没有"。

**其一：锁定的键是 `account + IP`，不是 `account`。**

```java
// Consecutive wrong passwords for one account from one IP before the pair is locked.
// Keyed by account + IP rather than account alone, so an attacker cannot lock a user
// out of their own machine by hammering the account from elsewhere
private int maxFailures = 10;
```

按 account 锁定的实现很常见，但它把防护变成了武器：知道你的工号，就能让你十分钟登不上去。按 pair 锁定则攻击者只能锁死自己那个 IP。

**其二：TOTP 的一次性是自己实现的。**一个 6 位码在整个 30 秒步长内都合法，这意味着旁观者看一眼你的手机就有 30 秒可用。`EruptMfaService#markCounterUsed` 把已消费的 counter 记进 session 存储，同一个 counter 第二次出现直接拒绝：

```java
private boolean markCounterUsed(Long uid, long counter) {
    String key = SessionKey.MFA_USED + uid + ":" + counter;
    if (sessionService.exist(key)) return false;
    long ttl = (long) (eruptAppProp.getMfa().getWindow() * 2 + 2) * TotpUtil.PERIOD;
    sessionService.put(key, "1", ttl, TimeUnit.SECONDS);
    return true;
}
```

配套的还有：恢复码 10 个、一次性、以 SHA-256 存哈希；enroll 阶段密钥只在 session 里，用户没扫成功就不会在库里留下一个半配置的账号；ticket 上的失败次数单独计，防止偷到 ticket 后慢慢爆破。

**其三：IP 白名单严格到拒绝 `127.1`。**`xyz.erupt.upms.util.IpWhiteListMatcher` 把两边都解析成规范字节再比，所以 `::ffff:192.168.0.5` 和 `192.168.0.5` 相等；同时拒绝主机名、zone-id（`fe80::1%eth0`）、IPv4 简写和前导零八位组，且**整个解析过程不做任何 DNS 查询**——一次登录校验不该给外部 DNS 一个影响判定结果的机会。

:::info 顺带一提：改密码会踢掉其他会话
`ResetPasswordExec` 与用户自助改密都会调 `eruptTokenService.logoutOtherTokens(account, currentToken)`：当前这个会话留着，该账号其他所有 token 一律失效。这是"密码可能已泄露"时唯一有意义的默认行为，但它在很多后台里是缺失的——改完密码，旧会话照样活到过期。
:::

## 七、5 分钟上手

从空项目到能访问的 admin 页面，完整流程已经独立成一篇：

**→ [快速部署 / Quick Start](/guide/quick-start)**

那一页覆盖 Maven 依赖、application.yml、第一个 `@Erupt` 实体、默认登录账号，以及 Docker / K8S 部署。

本期涉及的两处是模块特定的。SSO 需要单独引一个插件（`erupt-spring-boot-starter-all` 已包含）：

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-sso</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

回调地址留空时默认是 `http(s)://<当前主机>/erupt-api/sso/callback/<code>`，把它原样填进提供方后台即可；只有在反向代理后或公网域名不同时才需要在表单里显式覆盖。

二次验证与登录锁定无需额外依赖，默认即开启，可按需调整：

```yaml
erupt-app:
  mfa:
    enable: true      # 只是开放功能，不强制任何人绑定
    issuer: ""        # 验证器 App 里显示的名称，留空取 spring.application.name
    window: 1         # 容忍的时间步长数，吸收客户端时钟漂移
erupt:
  upms:
    login-lock:
      enable: true
      max-failures: 10
      lock-minutes: 10
```

注意 `mfa.enable` 默认为 `true` 的含义：它**只是开放入口**，不会强制存量用户绑定，所以升级不会把任何人关在门外。

## 八、下一期预告

这一期讲的是"人怎么进来"。下一期 **#14** 打算讲反方向的一件事：`erupt-generator` 现在能反读一个已有数据库，把表结构倒推成 `@Erupt` 模型代码。

那意味着一个有意思的处境——**注解派的低代码，第一次有了"生成"这个动词**。第 05 期我们曾把"没有生成"当成立身之本，所以这一期得交代清楚：这个 generator 生成的是**一次性的源码**，而不是运行时解释的 DSL，它落进你的 Git 之后框架就再也不认识它了。差别在哪，为什么这条线不能越，下期见。

---

:::info 参与讨论
本期涉及的源码：`erupt-plugin/erupt-sso/`（`EruptSso`、`EruptSsoBind`、`EruptSsoService`）、`erupt-upms/src/main/java/xyz/erupt/upms/service/EruptMfaService.java`、`xyz/erupt/upms/util/IpWhiteListMatcher.java`、`xyz/erupt/upms/service/EruptUserService.java`。

接了非主流提供方、或者在信封格式上踩到坑，欢迎去 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 留贴，claim 映射那块我们很想多收集几个真实样本。
:::
