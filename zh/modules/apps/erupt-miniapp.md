# Erupt MiniApp 小程序管理

[erupt-miniapp](https://github.com/erupt-io/erupt-miniapp) 是基于 Erupt 的微信小程序管理后台。加上依赖、登记一个小程序，后台就多出一个 **小程序** 菜单：用户与登录、订阅消息与模板库、小程序码与链接、内容安全、直播间、消息收件箱与统计。基于 [WxJava](https://github.com/binarywang/WxJava)。

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-miniapp</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

需要 erupt 2.4.0 及以上。H2 作为零配置数据库随附，设置 `spring.datasource.*` 即可换成其他数据库。

## 本地试用

```bash
mvn spring-boot:run
# http://localhost:8080  erupt / erupt
```

## 内置菜单

| 菜单 | 数据来源 | 操作 |
| --- | --- | --- |
| 小程序 | 数据库 | AppID、AppSecret、Token、AES Key、推送格式 |
| 用户 | 数据库 | 通过下方接口登录过的用户及其授权手机号；备注、发送客服消息 |
| 订阅模板 | 微信 | 按模板库 ID 添加、删除、发送并记录日志 |
| 模板库 | 微信 | 按类目浏览微信公共模板及关键词，一键添加 |
| 订阅记录 | 数据库 | 用户对每个模板的接受 / 拒绝，由微信推送 |
| 小程序码 | 数据库 | 场景码（无限量）与路径码；图片保存在上传目录 |
| 链接 | 数据库 | URL Link、URL Scheme、Short Link，保存时生成 |
| 内容安全 | 数据库 | 调用微信内容安全检测并保存结果 |
| 直播间 | 微信 | 直播组件的房间列表 |
| 消息收件箱 | 数据库 | 消息推送收到的每条消息与事件 |
| 日统计 / 留存 | 微信 | 最近 7 天，或搜索最长 30 天的区间 |

标为「微信」的页面打开时实时调用 API 并在内存中分页，不落库。

## Workspace：当前小程序

页头的 **Workspace** 选择器决定当前小程序：数据库页面按它过滤，新建记录落在其中；微信页面调用它的 API。选择随每次请求以 `erupt-scope` 头发送，服务端校验它是否在用户可选范围内。Workspace 基于 [@EruptScope](/zh/annotation/erupt-scope) 实现，`MaScope` 只是一个普通的 Erupt 表单。

## 用户登录

小程序端调用两个接口即可完成登录与手机号授权，无需 erupt 会话，session key 只保存在服务端：

```
POST /miniapp/{appid}/login?code=<wx.login code>                  → {"data": {"openid": "...", "unionid": "..."}}
POST /miniapp/{appid}/phone?openid=...&code=<getPhoneNumber code> → {"data": "13800000000"}
```

每次登录会新增或更新用户，授权过的手机号保存在用户上。

## 消息推送

把小程序的 **服务器地址**（`{callback-domain}/miniapp/portal/{appid}`）与同一 Token、格式（JSON 或 XML）填入公众平台「开发 → 消息推送」。客服消息与事件进入收件箱，订阅弹窗的结果进入订阅记录，发送订阅消息时据此判断谁可以接收。

```yaml
erupt:
  miniapp:
    callback-domain: https://admin.example.com   # 显示在服务器地址列中
    # api-host: https://proxy.example.com        # 通过代理调用微信 API
```

:::tip 说明
- **订阅消息**：一次性模板每次授权只能发送一次，长期模板需要符合条件的类目。
- **小程序码与链接** 在保存时生成一次并保存，要修改请删除后重新保存。
- **统计数据** 次日上报，因此统计区间截止到昨天。
- 第三方平台的代码管理不在范围内，它需要第三方平台的 component access token。
:::
