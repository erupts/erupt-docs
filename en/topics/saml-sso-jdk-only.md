---
title: "SAML 2.0 × javax.xml.crypto.dsig × EruptSso: The Hard Part of Enterprise Login Is Not Accepting, It Is Refusing"
description: "SAML sign-in is not secured by the library you picked but by the order of a list of refusals. This issue takes apart SsoSamlService in erupt-sso: 406 lines on the JDK alone, and how it refuses at signature, wrapping, replay, expiry and audience — plus the things it deliberately does not do."
outline: deep
---

# Issue 23 · The Hard Part of SAML Is Refusing

> The first reflex when an enterprise asks for SAML single sign-on is "find a mature library". But a library only solves the mathematics of XML signatures; **whether a response may log in** still depends on which checks you make before and after verification, in what order, and which defaults let something through. `erupt-sso` goes the other way: `SsoSamlService` is 406 lines, the pom has no SAML or XML-security dependency beyond `erupt-upms`, and everything sits on the JDK's `javax.xml.crypto.dsig` — the refusals written down as a list you can read to the end.
>
> _Published 2026-10-20 · ~10 min read_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt WeChat Official Account" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · Official Account</div>
    <div class="topic-mp-qr__title">Follow the Erupt Official Account</div>
    <p class="topic-mp-qr__desc">Every issue is published here first, along with release notes, source-code walkthroughs and community case studies.</p>
  </div>
</div>

[[toc]]

## 1. Why this issue

The last issue ended on a question: an enterprise customer says "we use AD FS / Entra ID, we need SAML" — how should a back-office system connect? There are three usual roads: bring in Spring Security SAML or OpenSAML; put a unified-auth gateway in front; or tick an "enterprise SSO" box in a low-code platform's login settings.

They share one property: **you have not read the code that decides who gets in.** The classic SAML incidents — signature wrapping, replay through an unchecked `InResponseTo`, expired assertions that nobody checked, a mismatched audience — were never a break of the cryptography. They were "the signature verified, but not the thing that was read afterwards" and "something that should have been refused wasn't".

The counter-thesis of this issue:

> **The security boundary of a SAML login is not the signature algorithm, it is the order of a list of refusals.** Instead of importing a library you will never read line by line, write the list into a class you can read to the end.

## 2. Two ways: delegate to a library vs walk the list yourself

| Dimension | A general SAML library | `erupt-sso` (`SsoSamlService`) |
|---|---|---|
| Dependencies | The library plus the XML-security stack it brings | JDK only: `javax.xml.crypto.dsig`, `DocumentBuilderFactory` |
| Can you read it? | Tens of thousands of lines, behaviour depends on configuration | One class of 406 lines, the order of checks is in the class comment |
| Scope | The full protocol: signed requests, encrypted assertions, SLO, several bindings | Deliberately narrow: SP-side Web Browser SSO, Redirect out, POST back |
| Trust anchor | Usually metadata or a certificate store | **One** certificate per provider row, paste and go |
| What is missing | Little | Encrypted assertions, single logout, signed AuthnRequest (listed below) |

The right-hand column is not "better", it is a **different trade-off**: Erupt gives up protocol breadth to get a login entry that can be audited item by item.

## 3. Countable facts: one class, one trust anchor, 17 tests

- **One class**: `xyz.erupt.sso.service.SsoSamlService`, 406 lines; the dependencies in `erupt-plugin/erupt-sso/pom.xml` are `erupt-upms` and nothing else.
- **One certificate**: `EruptSso#idpCertificate` is the only trust anchor of a SAML provider row. PEM armour, line breaks and whitespace are tolerated; what is left must be a DER-encoded X.509 certificate (`parseCertificate`).
- **Three presets**: `SAML`, `ADFS` and `MICROSOFT_ENTRA_SAML` in `SsoProviderType`, chosen in the same `EruptSso` form; the OAuth2-only fields (client secret, scopes, token and userinfo endpoints) are hidden on a SAML row.
- **17 tests**: `erupt-test/.../sso/SsoSamlFlowTest.java`, nine of them "must be refused": unsigned, tampered, signed by another key, a response to another request, expired, another audience, another issuer, an encrypted assertion, signature wrapping.
- **Three time limits**: login state 10 minutes (`STATE_EXPIRE_MINUTES`), exchange ticket 60 seconds (`TICKET_EXPIRE_SECONDS`), clock skew tolerance 3 minutes (`CLOCK_SKEW`).

A SAML row and an OAuth2 row share one callback chain. In `EruptSsoService#callback`, the protocols differ by a single `switch`:

```java
JsonObject claims = switch (sso.flow()) {
    case SAML -> saml.identity(sso, authCode, SsoSamlService.requestId(state), this.redirectUri(sso, scope, request));
    case DINGTALK -> this.dingTalkIdentity(sso, endpoints, authCode);
    case WECOM -> this.weComIdentity(sso, endpoints, authCode);
    case WECHAT -> this.weChatIdentity(sso, endpoints, authCode);
    default -> this.userInfo(endpoints, this.exchangeCode(sso, endpoints, authCode, payload.getVerifier(), this.redirectUri(sso, scope, request)));
};
```

Whatever the protocol, once `claims` comes out the path is the same: resolve the bound user, check the account is usable, issue a one-time ticket. SAML is just another answer to "how do we get a claims object we can trust".

## 4. The order of the list: the ten gates of `identity()`

`SsoSamlService#identity` is the spine of the class, and its class comment states the order:

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

Read it by asking **what each line refuses**: parse without a DTD; status must be success; `InResponseTo` must be the request we issued; `Destination` must be this service; the issuer must match; the assertion, or the response enveloping it, must carry a signature that references only itself; the assertion must be inside its validity window and name this SP as audience; there must be a bearer confirmation, and what it pins down (`Recipient`, `InResponseTo`, time) must be "us, now". **Only when everything has passed does the subject get read.** `claims()` is the last step, and `NameID` is written last so that "an attribute sharing its name cannot shadow the subject".

The `InResponseTo` gate ties SAML back to something familiar from OAuth2: `requestId` is `"_" + state` (an xs:ID may not start with a digit, hence the underscore). `EruptSsoService#callback` removes the state **immediately** after reading it, "single use, whatever happens next", so a response can be spent exactly once; the test `theStateIsSpentOnFirstUse` asserts it.

## 5. Signature wrapping: why `setIdAttributeNS` is set on the signed element only

Signature wrapping is SAML's best-known attack: the attacker keeps a **genuine, validly signed** assertion somewhere the SP will not read (say inside `Extensions`), and puts a copy with another subject and the same ID where the SP does read. If verification finds the signed element with a document-wide `getElementById`, it verifies the real one and reads the fake one.

The countermeasure in `verifySignature` is a few lines, each with a reason:

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

- **The signature must be a direct child of the element being checked** (`child(signed, XMLSignature.XMLNS, "Signature")`), not the first `Signature` found somewhere in the document.
- **The ID resolves on that one element only** (`setIdAttributeNS(signed, ...)`). A lookalike with the same ID elsewhere simply does not exist as far as the validation context is concerned.
- **Exactly one reference, and it is the element's own `#ID`**; the only transforms allowed are enveloped plus one of four canonicalisations, everything else is refused because other transforms can change what was signed.
- **`child()` looks at direct children only.** The class comment is blunt about it: an element nested deeper is not where the schema puts it, and a descendant search is how a wrapped forgery gets read.

`SsoSamlFlowTest#aWrappedAssertionIsRefused` builds exactly that attack: the genuine assertion wrapped into `Extensions`, an edited-subject copy where the SP looks, and the assertion is that it is refused and no binding gets created.

:::tip The counter-intuitive part
The longest code in this list **refuses signatures**, it does not accept them. For "a signature is present but does not verify", `verifySignature` **throws** instead of "treating it as unsigned and trying the response-level signature" — the right-hand side of the `||` is only evaluated when the assertion has **no** `Signature` element at all. "Present but failing" is a sign of attack, not a default.
:::

## 6. How does it compare with Yida / Jiandaoyun / Mingdao / JeecgBoot / RuoYi?

We have not tested these platforms item by item. The left column below lists **questions worth asking when choosing**, not conclusions about them; check each platform's own documentation and test it yourself.

| Dimension | Chinese platforms: what to ask | Erupt |
|---|---|---|
| Enterprise SAML | Do Yida, Jiandaoyun and Mingdao connect to an enterprise IdP (AD FS, Entra ID) over SAML 2.0? Which library do JeecgBoot and RuoYi make you integrate yourself? | `erupt-sso` ships `SAML` / `ADFS` / `MICROSOFT_ENTRA_SAML` presets: fill a form in the admin, paste a certificate |
| Can you audit it? | Can you read the code that verifies signatures and checks assertions? In what order? | One class of 406 lines, the order is `identity()` |
| Replay | Can a response be used only once? Is it bound to the request that was issued? | One-use state (`sessionService.remove` before validation), `InResponseTo` against `"_" + state` |
| Multi-tenancy | Can a tenant configure its own IdP, and can the callback address tell tenants apart? | A tenant's SAML row uses `/erupt-api/sso/tenant/{tenant}/callback/{code}`; the IdP tells SPs apart by that URL |
| QR-code logins | DingTalk / Feishu / WeCom QR logins are OAuth-style, not SAML | Same callback chain: one `Flow` each for `DINGTALK` / `WECOM` / `WECHAT` in `EruptSsoService` |

## 7. From annotation to UI in 5 minutes

The full flow from an empty project to a reachable admin page is a separate page:

**→ [Quick Start](/guide/quick-start)**

One module-specific note, since this issue is about one module: `erupt-sso` is already part of `erupt-spring-boot-starter-all`; on its own it is `xyz.erupt:erupt-sso`, with no yaml. Open **System → Single Sign-On**, pick type `SAML`, enter the IdP's single sign-on URL (HTTP-Redirect) and its signing certificate, then import the content of `/erupt-api/sso/saml/<code>/metadata` at the IdP.

## 8. The costs, and what is next

We will not hide these; each can be matched against the source:

- **Encrypted assertions are refused, not decrypted.** A response with an `EncryptedAssertion` and no clear assertion fails outright; decrypting needs an SP key pair, and the class comment says the IdPs that matter can send them in clear. If your IdP insists on encryption, this road is closed.
- **The AuthnRequest is not signed.** The metadata says `AuthnRequestsSigned="false"`, `WantAssertionsSigned="true"`; an IdP that requires signed requests has to be told otherwise on its side.
- **SP-side Web Browser SSO only.** There is no single logout (SLO), and Erupt cannot be the IdP — the line "if you need SAML, go with Spring Security" in *A Login Chain Without Spring Security* is out of date on the **consuming** side and still true on the **being** an IdP side.
- **One certificate per provider row.** No metadata-URL auto refresh; when the IdP rotates its signing certificate, an administrator replaces it by hand.
- **Attribute mapping is by convention.** `claims()` stores each attribute under both its `Name` and its `FriendlyName`, so the mapping column has to name the right one; when `NameID` is missing the stable identifier has to come from an attribute.

The next issue turns to what just landed in the main repo, `erupt-file-center`: the upload directory, local folders and S3 side by side as Finder columns, and **why a file-management page should not own a metadata table** — and how the ten lines of `FileStore.normalize` make "write" just a button under a menu.

---

:::info Join the discussion
Source covered in this issue: `erupt-plugin/erupt-sso/.../service/SsoSamlService.java`, `service/EruptSsoService.java` (`authorizeUrl` / `callback`), `controller/EruptSsoController.java` (the ACS and metadata endpoints), `model/EruptSso.java`, `constant/SsoProviderType.java`, and `erupt-test/.../sso/SsoSamlFlowTest.java`.

Whether to support encrypted assertions, whether to auto-refresh from a metadata URL — cast your vote in [GitHub Discussions](https://github.com/erupts/erupt/discussions).
:::
