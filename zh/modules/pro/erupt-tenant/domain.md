# 域名与租户定制

每个租户可以绑定独立域名，并配置专属 logo、CSS、JS —— 同一套系统按租户呈现不同的品牌形象，适合白标交付。

## 效果

通过租户域名访问时，登录页无需输入企业 ID，并应用该租户的 logo、样式、版权信息与语言等配置：

<img src="/tenant/domain-demo.png" width="900">

## 配置

在「租户配置」中填写 **租户域名**（不需要协议与端口），随后出现 logo、租户 CSS、租户 JS 等选项：

<img src="/tenant/domain-config.png" width="750">

:::info 实现原理
前端按当前访问域名调用 `GET /erupt-api/tenant/domain-info?host=xxx`，命中后返回该租户的企业 ID、名称、logo、CSS、JS 并自动应用（接口带缓存），因此登录页可以省略企业 ID。
:::

:::tip 本地测试
本地开发时 `localhost` 的任意子域名都指向本机，例如应用运行在 `localhost:8080`，把租户域名配置为 `abc.localhost`，访问 `abc.localhost:8080` 即可测试。
:::

## 租户 CSS / JS

通过域名访问时，**租户 CSS** 会注入页面样式，**租户 JS** 在页面加载时执行，可以覆盖前端配置，实现按租户定制主题与行为。

租户 JS 中可用的变量：

| 变量 | 对应配置 | 示例 |
| --- | --- | --- |
| `eruptSiteConfig` | `app.js` 中的 `eruptSiteConfig`，见 [前端配置](/zh/guide/config-frontend) | `eruptSiteConfig.copyrightTxt = "<a>xxx</a>"` |
| `eruptAppProp` | `application.yml` 中的 `erupt-app` 节点，见 [后端配置](/zh/guide/configuration) | `eruptAppProp.locales = ["ja-JP", "ko-KR"]`<br/>`eruptAppProp.waterMark = false` |
