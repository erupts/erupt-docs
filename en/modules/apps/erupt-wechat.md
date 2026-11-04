# Erupt WeChat Official Account

[erupt-wechat](https://github.com/erupt-io/erupt-wechat) is a WeChat Official Account admin built on Erupt. Add the dependency, register an account, and a **WeChat** menu appears with fans, tags, menus, auto replies, materials, drafts and publishing, template and mass messages, customer service and statistics. Built on [WxJava](https://github.com/binarywang/WxJava).

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-wechat</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

Needs erupt 2.4.0 or newer. H2 comes along as the zero-config database; set `spring.datasource.*` to use another.

## Try it

```bash
mvn spring-boot:run
# http://localhost:8080  erupt / erupt
```

A [sandbox test account](https://mp.weixin.qq.com/debug/cgi-bin/sandbox) is enough to try it. WeChat has to reach the portal, so pair it with a tunnel such as ngrok and put the tunnel's URL in `callback-domain`.

## Built-in menus

| Menu | Source | Actions |
| --- | --- | --- |
| Official Accounts | database | AppID, AppSecret, token and AES key; sync fans, callback IPs, clear API quota |
| Fans | database, synced | Sync, tag / untag, remark, block / unblock, send a customer service message |
| Tags | WeChat | Create, rename, delete |
| Blacklist | WeChat | Block, unblock |
| Menus | database | Two levels, click / URL / mini program; publish as the default menu plus one conditional menu per tag |
| Auto replies | database | Keyword (exact or contains), on subscribe, default; text, image or article link |
| Materials | WeChat | Image, voice and video; upload, delete |
| Drafts | WeChat | Write and edit articles, publish |
| Publications | WeChat | Take offline, open / close comments, drill into comments |
| Comments | WeChat | Feature, reply, delete |
| Templates | WeChat | Add from the library, delete, send with a log |
| Subscribe notifications | WeChat | Add from the library, delete, send |
| Mass messages | database | Saving sends it; preview, refresh status, cancel |
| Service accounts / sessions / messages | WeChat | Manage staff, open and close sessions, read the conversation log |
| QR codes | database | Temporary and permanent parameter codes |
| Inbox | database | Every message and event the portal received |
| Fan / Article / API statistics | WeChat | The last 7 days, or a searched range up to 30 days |

Pages marked *WeChat* call the API when opened and page in memory; nothing of theirs is stored. Pages marked *database* keep their rows in your database, bound to the account.

## Workspace: the current account

The **Workspace** picker in the header holds an Official Account and, optionally, one of its fan tags:

- **Official Account** is required. Database pages are filtered by it and new rows land in it; WeChat pages call its API.
- **Tag** narrows the Fans page and is the default audience of a new mass message.

The pick travels with every request in the `erupt-scope` header, the server checks it against the options the user is offered, and each browser window keeps its own. This is Erupt's [@EruptScope](/en/annotation/erupt-scope) feature; `WxScope` is a plain Erupt form.

## Connecting an account

1. Add the account under **Official Accounts** with the AppID, AppSecret and a token of your choice.
2. Copy its **Server URL** (`{callback-domain}/wechat/portal/{appid}`) into the WeChat console, *Settings and development → Basic configuration → Server configuration*, with the same token. Plain and safe (AES) modes both work.
3. Add your server's outbound IP to the console's IP whitelist.

```yaml
erupt:
  wechat:
    callback-domain: https://admin.example.com   # shown in the Server URL column
    # api-host: https://proxy.example.com        # route API calls through a proxy
```

The access token is kept in memory per account, which suits one instance; a cluster swaps in WxJava's `WxMpRedisConfigImpl` in `WxMpServices#register`. For the `wx.config` page signature, the host application calls `GET /wechat/jssdk/{appid}?url=<page URL>`.

:::warning What WeChat requires
- Mass messages, templates, customer service, comments, subscribe notifications and statistics need a **verified service account**. A sandbox account has no permanent materials and cannot mass send.
- API calls are counted per day; the WeChat pages cache what they can (tags for 30 seconds) and lists are capped (1000 materials and publications, 200 drafts).
- A customer service message reaches a fan within 48 hours of the fan's last message.
- Mass messages can be cancelled within half an hour; WeChat still counts them.
:::
