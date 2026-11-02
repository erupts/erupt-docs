# Erupt WeChat 公众号管理

[erupt-wechat](https://github.com/erupt-io/erupt-wechat) 是基于 Erupt 的微信公众号管理后台。加上依赖、登记一个公众号，后台就多出一个 **微信** 菜单：粉丝、标签、菜单、自动回复、素材、草稿与发布、模板消息与群发、客服与统计。基于 [WxJava](https://github.com/binarywang/WxJava)。

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-wechat</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

需要 erupt 2.4.0 及以上。H2 作为零配置数据库随附，设置 `spring.datasource.*` 即可换成其他数据库。

## 本地试用

```bash
mvn spring-boot:run
# http://localhost:8080  erupt / erupt
```

可使用 [测试号](https://mp.weixin.qq.com/debug/cgi-bin/sandbox) 体验。微信需要能访问到消息回调地址，本地调试请配合 ngrok 等内网穿透，并把穿透地址填入 `callback-domain`。

## 内置菜单

| 菜单 | 数据来源 | 操作 |
| --- | --- | --- |
| 公众号 | 数据库 | AppID、AppSecret、Token、AES Key；同步粉丝、回调 IP、清空 API 配额 |
| 粉丝 | 数据库（同步） | 同步、打 / 取消标签、备注、拉黑 / 取消拉黑、发送客服消息 |
| 标签 | 微信 | 新建、重命名、删除 |
| 黑名单 | 微信 | 拉黑、取消拉黑 |
| 菜单 | 数据库 | 两级菜单，点击 / 链接 / 小程序；发布默认菜单与按标签的个性化菜单 |
| 自动回复 | 数据库 | 关键词（全匹配 / 包含）、关注回复、默认回复；文本、图片或图文链接 |
| 素材 | 微信 | 图片、语音、视频；上传、删除 |
| 草稿 | 微信 | 编写与修改图文，发布 |
| 发布记录 | 微信 | 下线、开关评论、钻取评论 |
| 评论 | 微信 | 精选、回复、删除 |
| 模板消息 | 微信 | 从模板库添加、删除、发送并记录日志 |
| 订阅通知 | 微信 | 从模板库添加、删除、发送 |
| 群发 | 数据库 | 保存即发送；预览、刷新状态、撤回 |
| 客服账号 / 会话 / 聊天记录 | 微信 | 管理客服，创建与关闭会话，查看聊天记录 |
| 二维码 | 数据库 | 临时与永久带参二维码 |
| 消息收件箱 | 数据库 | 回调收到的每条消息与事件 |
| 粉丝 / 图文 / 接口统计 | 微信 | 最近 7 天，或搜索最长 30 天的区间 |

标为「微信」的页面打开时实时调用 API 并在内存中分页，不落库；标为「数据库」的页面数据保存在你的数据库中，按公众号隔离。

## Workspace：当前公众号

页头的 **Workspace** 选择器包含公众号与可选的粉丝标签：

- **公众号** 必选，所有页面都基于它：数据库页面按它过滤，新建记录落在其中；微信页面调用它的 API。
- **标签** 可选，用于收窄粉丝列表，也是新建群发的默认受众。

选择随每次请求以 `erupt-scope` 头发送，服务端校验它是否在用户可选范围内，每个浏览器窗口各自记住一份。Workspace 基于 [@EruptScope](/zh/annotation/erupt-scope) 实现，`WxScope` 只是一个普通的 Erupt 表单。

## 接入公众号

1. 在 **公众号** 中登记 AppID、AppSecret 与自定的 Token。
2. 把列表中的 **服务器地址**（`{callback-domain}/wechat/portal/{appid}`）与同一 Token 填入公众平台「设置与开发 → 基本配置 → 服务器配置」，明文与安全模式均可。
3. 把服务器出口 IP 加入公众平台的 IP 白名单。

```yaml
erupt:
  wechat:
    callback-domain: https://admin.example.com   # 显示在服务器地址列中
    # api-host: https://proxy.example.com        # 通过代理调用微信 API
```

Access token 按公众号保存在内存中，适合单实例；集群部署可在 `WxMpServices#register` 中改用 WxJava 的 `WxMpRedisConfigImpl`。`wx.config` 所需的 JS-SDK 签名由宿主应用调用 `GET /wechat/jssdk/{appid}?url=<页面地址>` 获取。

:::warning 微信侧限制
- 群发、模板消息、客服、评论、订阅通知与统计需要 **已认证的服务号**；测试号没有永久素材，也不能群发。
- 接口调用有每日配额，微信页面会尽量缓存（标签 30 秒），列表有上限（素材与发布记录 1000 条，草稿 200 条）。
- 客服消息只能在粉丝最后一次发消息后 48 小时内送达。
- 群发可在半小时内撤回，但仍计入群发次数。
:::
