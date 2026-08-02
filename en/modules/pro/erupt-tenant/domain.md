# Domain & Tenant Customization

:::info
Supported in 1.12.17 and above
:::

Each tenant can bind an independent domain and configure its own logo, CSS, and JS — one system presenting a completely different brand per tenant, ideal for white-label delivery.

## Demo

Once a tenant domain is configured, tenants can enter the system without typing an enterprise ID, with support for custom copyright, custom i18n languages, and more:

<img src="/tenant/domain-demo.png" width="900">

## Usage

After entering a tenant domain in Tenant Config, the following options appear (no **protocol** or **port** required in the domain):

<img src="/tenant/domain-config.png" width="750">

:::info How it works
The frontend calls `GET /erupt-api/tenant/domain-info?host=xxx` with the current host. When a tenant domain matches, the API returns that tenant's enterprise ID, name, logo, JS, and CSS, which are applied automatically (backed by an LRU cache) — so the login page no longer asks for an enterprise ID.
:::

:::tip
During local development, domain control is easy to test with localhost: if your address is `localhost:8080`, try `abc.localhost:8080` or any second/third-level domain prefix — all point to the current erupt application.
:::

## Tenant-specific CSS / JS

When accessed via the tenant domain, the **Tenant CSS** in Tenant Config is injected as page styles, and the **Tenant JS** runs on page load and can override configuration in `app.js`, enabling per-tenant theming and behavior.

### Tenant JS Variables

Context variables available in tenant JS:

| Variable | Reference | JS Example |
| --- | --- | --- |
| eruptSiteConfig | The eruptSiteConfig node in app.js<br/>[Frontend configuration](/en/guide/configuration) | `//Set website copyright`<br/>`eruptSiteConfig.copyrightTxt = "<a>xxx<a>"` |
| eruptAppProp | The erupt-app node in application.yml<br/>[Backend configuration](/en/guide/configuration) | `//Set languages`<br/>`eruptAppProp.locales=["ja-JP","ko-KR"]`<br/>`//Disable watermark`<br/>`eruptAppProp.waterMark = false` |
