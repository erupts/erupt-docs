# Domain & Customization

Each tenant can bind its own domain with its own logo, CSS and JS — one system presenting a different brand per tenant, ideal for white-label delivery.

## Result

Visiting through the tenant's domain skips the enterprise ID on the login page and applies the tenant's logo, styles, copyright and language settings:

<img src="/tenant/domain-demo.png" width="900">

## Configuration

Fill in **Tenant Domain** in Tenant Config (no protocol or port); the logo, Tenant CSS and Tenant JS options then appear:

<img src="/tenant/domain-config.png" width="750">

:::info How it works
The front end calls `GET /erupt-api/tenant/domain-info?host=xxx` with the current host; on a match it receives the tenant's enterprise ID, name, logo, CSS and JS and applies them (the endpoint is cached), so the login page can omit the enterprise ID.
:::

:::tip Testing locally
Any subdomain of `localhost` points to your machine. With the app on `localhost:8080`, set the tenant domain to `abc.localhost` and open `abc.localhost:8080`.
:::

## Tenant CSS / JS

When visited through the domain, **Tenant CSS** is injected into the page and **Tenant JS** runs on page load, able to override front-end settings — per-tenant themes and behavior.

Variables available in Tenant JS:

| Variable | Maps to | Example |
| --- | --- | --- |
| `eruptSiteConfig` | `eruptSiteConfig` in `app.js`; see [Frontend Configuration](/en/guide/config-frontend) | `eruptSiteConfig.copyrightTxt = "<a>xxx</a>"` |
| `eruptAppProp` | The `erupt-app` node of `application.yml`; see [Backend Configuration](/en/guide/configuration) | `eruptAppProp.locales = ["ja-JP", "ko-KR"]`<br/>`eruptAppProp.waterMark = false` |
