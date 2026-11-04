# Erupt MiniApp WeChat Mini Program

[erupt-miniapp](https://github.com/erupt-io/erupt-miniapp) is a WeChat Mini Program admin built on Erupt. Add the dependency, register an app, and a **Mini Program** menu appears with users and sign-in, subscribe messages and the template library, codes and links, content checks, live rooms, the inbox and statistics. Built on [WxJava](https://github.com/binarywang/WxJava).

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-miniapp</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

Needs erupt 2.4.0 or newer. H2 comes along as the zero-config database; set `spring.datasource.*` to use another.

## Try it

```bash
mvn spring-boot:run
# http://localhost:8080  erupt / erupt
```

## Built-in menus

| Menu | Source | Actions |
| --- | --- | --- |
| Mini Programs | database | AppID, AppSecret, token, AES key, push format |
| Users | database | Everyone who signed in through the API below, with the phone they shared; remark, send a customer service message |
| Subscribe templates | WeChat | Add by library id, delete, send with a log |
| Template library | WeChat | Browse WeChat's public templates by category and their keywords, add one to the app |
| Subscriptions | database | Who accepted or rejected which template, as WeChat pushes it |
| Codes | database | Scene codes (unlimited) and path codes; the image is kept under the upload path |
| Links | database | URL links, URL schemes and short links, generated on save |
| Content checks | database | Run a text through WeChat's content security check and keep the verdict |
| Live rooms | WeChat | The live streaming component's rooms |
| Inbox | database | Every message and event the portal received |
| Daily statistics / Retention | WeChat | The last 7 days, or a searched range up to 30 days |

Pages marked *WeChat* call the API when opened and page in memory; nothing of theirs is stored.

## Workspace: the current app

The **Workspace** picker in the header holds the Mini Program. Database pages are filtered by it and new rows land in it; WeChat pages call its API. The pick travels with every request in the `erupt-scope` header and the server checks it against the apps the user is offered. This is Erupt's [@EruptScope](/en/annotation/erupt-scope) feature; `MaScope` is a plain Erupt form.

## Signing users in

The Mini Program calls two endpoints, no erupt session needed. The session key stays on the server.

```
POST /miniapp/{appid}/login?code=<wx.login code>                  → {"data": {"openid": "...", "unionid": "..."}}
POST /miniapp/{appid}/phone?openid=...&code=<getPhoneNumber code> → {"data": "13800000000"}
```

Each login upserts the user; the phone is kept on the user once shared.

## Message push

Copy the app's **Server URL** (`{callback-domain}/miniapp/portal/{appid}`) into the WeChat console, *Development → Message push*, with the same token and format (JSON or XML). Customer service messages and events land in the Inbox; subscribe prompt answers are kept under Subscriptions, so the Send action knows who may receive a template.

```yaml
erupt:
  miniapp:
    callback-domain: https://admin.example.com   # shown in the Server URL column
    # api-host: https://proxy.example.com        # route API calls through a proxy
```

:::tip Notes
- **Subscribe messages** reach a user once per acceptance of a one-time template; a long-term template needs a qualified category.
- **Codes and links** are generated once on save and kept; delete and save again to change one.
- **Statistics** are reported the morning after, so the trailing window ends yesterday.
- Code management for third-party platforms is out of scope: it needs a component access token, not an app's own.
:::
