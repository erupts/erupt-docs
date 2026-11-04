---
title: "SAML 2.0 × javax.xml.crypto.dsig × EruptSso：企业登录协议最难的不是「接受」，是「拒绝」"
description: "SAML 单点登录的安全性不取决于你用了哪个库，而取决于一张拒绝清单的顺序。本期拆 erupt-sso 的 SsoSamlService：406 行、只用 JDK，怎么在验签、签名包装、重放、过期和受众上逐关拒绝，以及它刻意不做的几件事。"
outline: deep
---

# 第 23 期 · SAML 的难点是拒绝

> 接入企业 SAML 单点登录，常见的第一反应是「找个成熟库」。但库只替你解决 XML 签名的数学，**一份响应能不能登录**仍取决于你在验签前后查了哪几样、按什么顺序、哪些缺省值会放行。`erupt-sso` 反过来：`SsoSamlService` 只有 406 行，pom 里除了 `erupt-upms` 没有任何 SAML / XML 安全依赖，全部建立在 JDK 的 `javax.xml.crypto.dsig` 上，把「拒绝」写成一张读得完的清单。
>
> _发布于 2026-10-20 · 阅读 ~10 min_

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

上一期结尾我们留了个问题：企业客户一句「我们用 AD FS / Entra ID，要 SAML」，后台系统该怎么接。常见的路有三条：上 Spring Security SAML 或 OpenSAML 这类成熟库；在网关层前置一个统一认证；或者在低代码平台的「登录设置」里勾一个「企业 SSO」。

三条路的共同点是：**你没读过那段决定「谁能登录」的代码。** SAML 出过的典型事故——签名包装（Signature Wrapping）、`InResponseTo` 不校验导致的重放、断言过期不查、受众（Audience）不匹配——没有一个是密码学被攻破，全是「验了签，但验的不是后面读的那一份」「该拒绝的没拒绝」。

本文的反向命题是：

> **SAML 登录的安全边界不是签名算法，是一张拒绝清单的顺序。** 与其引入一个你不会逐行读的库，不如把清单写成一个能读完的类。

## 二、两种做法：委托给库 vs 自己走完清单

| 维度 | 引入通用 SAML 库 | `erupt-sso`（`SsoSamlService`） |
|---|---|---|
| 依赖 | 库 + 其传递的 XML 安全栈 | 仅 JDK：`javax.xml.crypto.dsig`、`DocumentBuilderFactory` |
| 能读完吗 | 几万行，行为取决于配置项 | 一个类 406 行，检查顺序写在类注释里 |
| 范围 | 完整协议：签名请求、加密断言、SLO、多 binding | 刻意收窄：SP 端 Web Browser SSO，Redirect 发、POST 收 |
| 信任锚 | 通常是元数据或证书库 | 每个供应商行**一张**证书，粘贴即用 |
| 缺什么 | 少 | 加密断言、单点登出、签名的 AuthnRequest（下文列出） |

第二列不是「更好」，是**取舍不同**：Erupt 放弃协议的广度，换取一个登录入口可以被逐条审查。

## 三、可数的事实：一个类、一个信任锚、17 条测试

- **一个类**：`xyz.erupt.sso.service.SsoSamlService`，406 行；`erupt-plugin/erupt-sso/pom.xml` 的依赖里只有 `erupt-upms`。
- **一张证书**：`EruptSso#idpCertificate` 是 SAML 供应商行里唯一的信任锚，PEM 外壳、换行和空白都能容忍，剩下的必须是 DER 编码的 X.509（`parseCertificate`）。
- **三个预设**：`SsoProviderType` 里的 `SAML`、`ADFS`、`MICROSOFT_ENTRA_SAML`，在同一份 `EruptSso` 表单里选类型，OAuth2 才有的字段（客户端密钥、scope、token 与 userinfo 端点）在 SAML 行上隐藏。
- **17 条测试**：`erupt-test/.../sso/SsoSamlFlowTest.java`，其中 9 条是「应当被拒绝」：无签名、被篡改、别人的密钥签的、别的请求的响应、过期、别的受众、别的签发者、加密断言、签名包装。
- **两个时间窗**：登录状态 10 分钟（`STATE_EXPIRE_MINUTES`），换票凭证 60 秒（`TICKET_EXPIRE_SECONDS`），时钟偏差容忍 3 分钟（`CLOCK_SKEW`）。

SAML 行和 OAuth2 行共用同一个回调链。`EruptSsoService#callback` 里，协议的差别只有一个 `switch`：

```java
JsonObject claims = switch (sso.flow()) {
    case SAML -> saml.identity(sso, authCode, SsoSamlService.requestId(state), this.redirectUri(sso, scope, request));
    case DINGTALK -> this.dingTalkIdentity(sso, endpoints, authCode);
    case WECOM -> this.weComIdentity(sso, endpoints, authCode);
    case WECHAT -> this.weChatIdentity(sso, endpoints, authCode);
    default -> this.userInfo(endpoints, this.exchangeCode(sso, endpoints, authCode, payload.getVerifier(), this.redirectUri(sso, scope, request)));
};
```

不管协议是什么，`claims` 出来之后都走同一条：解析绑定用户、检查账号可用、签发一次性 ticket。换句话说，SAML 只是「怎样得到一份可信的 claims」的另一种答案。

## 四、清单的顺序：`identity()` 的十道关

`SsoSamlService#identity` 是整个类的主线，类注释已经把顺序写明：

```java
public JsonObject identity(EruptSso sso, String samlResponse, String requestId, String acsUrl) {
    X509Certificate certificate = this.parseCertificate(sso.getIdpCertificate());
    Element response = this.parse(decode(samlResponse)).getDocumentElement();
    Erupts.requireTrue(is(response, NS_PROTOCOL, "Response"), invalid("not a SAML response"));
    requireStatus(response);
    requireMatch("InResponseTo", response.getAttribute("InResponseTo"), requestId);
    requireMatch("Destination", response.getAttribute("Destination"), acsUrl);
    requireIssuer(sso, child(response, NS_ASSERTION, "Issuer"));

    Element assertion = child(response, NS_ASSERTION, "Assertion");
    // ... an EncryptedAssertion is refused rather than decrypted
    Erupts.requireTrue(this.verifySignature(assertion, certificate) || this.verifySignature(response, certificate),
            I18nTranslate.$translate("sso.saml_unsigned"));
    requireIssuer(sso, child(assertion, NS_ASSERTION, "Issuer"));
    Instant now = Instant.now();
    requireConditions(sso, child(assertion, NS_ASSERTION, "Conditions"), now);
    Element subject = child(assertion, NS_ASSERTION, "Subject");
    Erupts.requireTrue(null != subject, invalid("no subject"));
    requireBearerConfirmation(subject, requestId, acsUrl, now);
    return claims(assertion, subject);
}
```

读它的方法是看**每一行拒绝什么**：无 DTD 地解析；状态必须成功；`InResponseTo` 必须是我们发出的那个请求；`Destination` 必须是本服务；签发者对得上；断言或整个响应带着一个只引用自身的签名；断言在有效期内、受众是本 SP；有 bearer 确认，且确认里的 `Recipient`、`InResponseTo`、时间也都是「我们、现在」。**只有全部通过，才开始读主体。** `claims()` 是最后一步，而且 `NameID` 最后写入，「同名属性不能遮蔽主体」。

`InResponseTo` 这一关把 SAML 绑回了 OAuth2 世界里熟悉的东西：`requestId` 就是 `"_" + state`（xs:ID 不允许数字开头，所以加下划线）。`EruptSsoService#callback` 取出 state 后**立即删除**，「无论后面成败」，所以一份响应只能用一次；测试 `theStateIsSpentOnFirstUse` 断言了这一点。

## 五、签名包装：为什么 `setIdAttributeNS` 只设在被签元素上

签名包装是 SAML 最著名的攻击：攻击者保留一份**真实、签名有效**的断言，藏在 SP 不会去读的位置（例如塞进 `Extensions`），再在 SP 会读的位置放一份改了主体、ID 相同的副本。如果验签时按文档全局 `getElementById` 找被签元素，验的是真的，读的是假的。

`verifySignature` 的对策只有几行，但每行都有理由：

```java
private boolean verifySignature(Element signed, X509Certificate certificate) {
    Element signature = child(signed, XMLSignature.XMLNS, "Signature");
    if (null == signature) return false;
    String id = signed.getAttribute("ID");
    Erupts.requireTrue(StringUtils.isNotBlank(id), invalid("signed element has no ID"));
    DOMValidateContext context = new DOMValidateContext(KeySelector.singletonKeySelector(certificate.getPublicKey()), signature);
    context.setIdAttributeNS(signed, null, "ID");
    context.setProperty("org.jcp.xml.dsig.secureValidation", Boolean.TRUE);
    try {
        XMLSignature xmlSignature = signatureFactory.unmarshalXMLSignature(context);
        List<Reference> references = xmlSignature.getSignedInfo().getReferences();
        Erupts.requireTrue(references.size() == 1 && ("#" + id).equals(references.get(0).getURI()),
                invalid("signature does not cover the element it sits in"));
        for (Transform transform : references.get(0).getTransforms()) {
            Erupts.requireTrue(TRANSFORMS.contains(transform.getAlgorithm()), invalid("transform " + transform.getAlgorithm()));
        }
        Erupts.requireTrue(xmlSignature.validate(context), invalid("signature verification failed"));
        return true;
    } // ...
}
```

- **签名必须是被检查元素的直接子节点**（`child(signed, XMLSignature.XMLNS, "Signature")`），而不是文档里找到的第一个 `Signature`。
- **ID 只在这一个元素上可解析**（`setIdAttributeNS(signed, ...)`）。文档别处有同 ID 的副本，对验证上下文来说根本「不存在」。
- **引用必须恰好一个，且就是自己的 `#ID`**；变换只允许 enveloped 加规范化四种之一，其余一律拒绝，因为别的变换可以改变「被签的是什么」。
- **`child()` 只找直接子节点。** 类里的注释说得很直白：嵌得更深的元素不在 schema 规定的位置，而「用后代搜索」恰恰是被包装的伪造物被读到的方式。

`SsoSamlFlowTest#aWrappedAssertionIsRefused` 把上面的攻击原样搭了一遍：真断言包进 `Extensions`，改过主体的副本放在 SP 会读的位置，断言：被拒绝，且没有产生任何绑定。

:::tip 反直觉的一点
这条清单里最长的代码是**拒绝签名**，不是接受签名。`verifySignature` 对「有签名但验不过」是**直接抛错**，而不是「当作没签名、试试响应级的签名」——`||` 的右侧只在断言上**没有** `Signature` 元素时才会被求值。「存在但失败」是攻击信号，不是缺省。
:::

## 六、跟宜搭 / 简道云 / 明道云 / JeecgBoot / 若依怎么比？

我们没有逐项实测这些平台。下表左列是**选型时值得问的问题**，不是对它们的结论；各平台能力以官方文档和实测为准。

| 维度 | 国内对位平台：选型时该问 | Erupt |
|---|---|---|
| 企业 SAML | 宜搭、简道云、明道云是否支持以 SAML 2.0 接企业 IdP（AD FS、Entra ID）？JeecgBoot、若依需要自己集成哪个库？ | `erupt-sso` 内置 `SAML` / `ADFS` / `MICROSOFT_ENTRA_SAML` 三个预设，后台填表单、贴证书 |
| 能审查吗 | 验签与断言校验的代码你能读到吗？校验的顺序是什么？ | 一个类 406 行，顺序见 `identity()` |
| 重放 | 响应只能用一次吗？绑不绑定发出的请求？ | state 一次性（`sessionService.remove` 先于校验），`InResponseTo` 对 `"_" + state` |
| 多租户 | 租户能否配自己的 IdP，回调地址能否区分租户？ | 租户的 SAML 行使用 `/erupt-api/sso/tenant/{tenant}/callback/{code}`，IdP 靠这个 URL 分辨 SP |
| 扫码类登录 | 钉钉 / 飞书 / 企业微信扫码是 OAuth 类，不走 SAML | 同一个回调链：`EruptSsoService` 里 `DINGTALK` / `WECOM` / `WECHAT` 各一个 `Flow` |

## 七、5 分钟上手

从空项目到能访问的 admin 页面，完整流程已经独立成一篇：

**→ [快速部署 / Quick Start](/guide/quick-start)**

本期是模块特定主题，补一句：`erupt-sso` 已包含在 `erupt-spring-boot-starter-all` 里；单独引入则是 `xyz.erupt:erupt-sso`，不需要 yaml 配置。进入 **系统管理 → 单点登录**，类型选 `SAML`，填 IdP 的单点登录地址（HTTP-Redirect）和签名证书，把 `/erupt-api/sso/saml/<code>/metadata` 的内容导入 IdP 即可。

## 八、代价与下一期预告

这一期不替它遮掩，下面几条都能在源码里对上：

- **加密断言被拒绝，不是解密。** 响应里出现 `EncryptedAssertion` 且没有明文断言，直接报错；解密需要 SP 密钥对，类注释说「重要的 IdP 都可以发明文」。IdP 强制加密时，这条路走不通。
- **AuthnRequest 不签名。** 元数据里 `AuthnRequestsSigned="false"`、`WantAssertionsSigned="true"`；强制要求签名请求的 IdP 要在那边关掉。
- **只有 SP 端的 Web Browser SSO。** 没有单点登出（SLO），也不能把 Erupt 做成 IdP——《不依赖 Spring Security 的登录链》里「需要 SAML 就上 Spring Security」那句话，在**接入** IdP 这一侧已经过期，在**充当** IdP 这一侧依然成立。
- **一个供应商行一张证书。** 没有元数据 URL 自动刷新，IdP 轮换签名证书时需要管理员手动换。
- **属性映射靠约定。** `claims()` 把每个属性按 `Name` 和 `FriendlyName` 各放一份，映射列要填对名字；`NameID` 缺失时靠属性里的稳定标识。

下一期换个方向，回到主仓这周新进来的 `erupt-file-center`：上传目录、本地文件夹和 S3 排成一列 Finder，**文件管理页为什么不该有自己的元数据表**——以及 `FileStore.normalize` 那 10 行路径检查，是怎么让「写入」只是菜单下的一个按钮的。

---

:::info 参与讨论
本期涉及的源码：`erupt-plugin/erupt-sso/.../service/SsoSamlService.java`、`service/EruptSsoService.java`（`authorizeUrl` / `callback`）、`controller/EruptSsoController.java`（ACS 与 metadata 端点）、`model/EruptSso.java`、`constant/SsoProviderType.java`，以及 `erupt-test/.../sso/SsoSamlFlowTest.java`。

要不要支持加密断言、要不要做元数据 URL 自动刷新，欢迎到 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 投一票。
:::
