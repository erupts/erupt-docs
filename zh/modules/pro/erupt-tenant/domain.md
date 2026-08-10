# 域名与租户定制

:::info
1.12.17 及以上版本支持
:::

每个租户可绑定独立域名，并配置专属 logo、CSS、JS —— 同一套系统按租户呈现完全不同的品牌形象，适合白标交付场景。

## 效果演示

租户域名配置后，租户可免输入企业 ID 进入租户系统，支持定义 copyright、自定义国际化语言等能力：

<img src="/tenant/domain-demo.png" width="900">

## 使用方法

在「租户配置」中填写租户域名后会出现如下选项（域名无需指定**协议**与**端口**）：

<img src="/tenant/domain-config.png" width="750">

:::info 实现原理
前端根据当前访问域名调用 `GET /erupt-api/tenant/domain-info?host=xxx` 接口，命中租户域名后返回该租户的企业 ID、名称、logo、JS、CSS 并自动应用（接口带 LRU 缓存），因此登录页无需再输入企业 ID。
:::

:::tip 技术提示
本地开发时 localhost 访问可以轻松实现域名控制的能力。例如访问地址是 `localhost:8080`，尝试 `abc.localhost:8080` 或任意二三级域名前缀可以看到均指向当前 erupt 应用，可轻松测试域名能力。
:::

## 租户专属 CSS / JS

通过域名访问时，租户配置中的 **租户 CSS** 会注入页面样式，**租户 JS** 会在页面加载时执行、可覆盖 `app.js` 中的配置项，实现按租户定制主题与行为。

### 租户 JS 变量支持

租户 JS 中上下文变量参考：

| 变量名 | 配置项参考 | JS 示例 |
| --- | --- | --- |
| eruptSiteConfig | 参考 app.js 中 eruptSiteConfig 节点配置项<br/>[前端配置说明](/zh/guide/configuration) | `//定义网站copyright信息`<br/>`eruptSiteConfig.copyrightTxt = "<a>xxx<a>"` |
| eruptAppProp | 参考 application.yml 中 erupt-app 节点配置项<br/>[后端配置说明](/zh/guide/configuration) | `//定义语言`<br/>`eruptAppProp.locales=["ja-JP","ko-KR"]`<br/>`//关闭水印`<br/>`eruptAppProp.waterMark = false` |
