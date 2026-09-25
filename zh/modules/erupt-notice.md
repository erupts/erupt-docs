# Erupt Notice 消息通知

> 1.13.2 及以上版本支持

提供全员广播与点对点消息推送能力，支持富文本格式与内容管理。默认采用 WebSocket 站内推送机制，并提供可插拔式扩展能力，支持短信、邮件、飞书、Slack 等第三方通知渠道。

## 引入方式

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-notice</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

启动后重新登录，顶部右上角出现通知铃铛图标，侧边栏出现通知管理菜单：

<img src="/notice/notification.png" width="900">

## 功能说明

### 消息公告

支持富文本编辑，发布后进入系统时全员可见公告内容：

<img src="/notice/announcement.png" width="900">

公告编辑界面：

<img src="/notice/announcement-edit.png" width="700">

公告展示效果：

<img src="/notice/announcement-show.png" width="700">

### 通知场景管理

基于不同业务来源，发送通知前需先配置通知场景，便于用户分类管理接收的通知：

<img src="/notice/scene.png" width="900">

### 消息通知

通过 API 或手动发送的消息展示在通知列表中，支持标记已读、查看详情：

<img src="/notice/message.png" width="900">

## 发送通知 API

```java
@Resource
private EruptNoticeService eruptNoticeService;

@Resource
private EruptInternalNotice eruptInternalNotice; // 内置站内信渠道

public void notifyUsers() {
    NoticeMessage message = new NoticeMessage();
    message.setTitle("消息标题");
    message.setContent("消息内容");
    message.setUrl("/some/page"); // 可选，点击通知后跳转的地址

    // 指定渠道发送，第二个参数是通知场景的 code，第三个参数是接收人的用户 ID 列表
    eruptNoticeService.send(eruptInternalNotice, "scene_code", Arrays.asList(1L, 2L), message);
}
```

也可以直接指定 `NoticeScene` 实体与多个渠道编码：

```java
// channels 为渠道 code 列表，默认取渠道类的 SimpleName
eruptNoticeService.send(noticeScene, List.of("EruptInternalNotice"), Arrays.asList(1L, 2L), message);
```

:::warning 注意
- 服务类名为 `EruptNoticeService`，没有 `broadcast` 方法；如需全员通知，请自行查询用户 ID 列表后传入。
- 接收人参数是用户 ID（`List<Long>`），不是登录账号字符串。
- `scene_code` 必须是「通知场景」中已存在的编码，否则会抛出 `Notice Scene not found` 异常。
:::

## 认证源推送渠道 <Badge type="tip" text="v2.3.0+" />

erupt-notice 内置了飞书、钉钉、企业微信、Slack 四个渠道。它们不需要单独配置 appId 或 token，而是直接借用 [erupt-sso](/zh/modules/erupt-sso) 中对应**供应商类型**的认证源行：以该行的客户端凭据作为发消息的应用身份，以用户通过该认证源登录时记录在绑定上的 Open ID 作为收件人。类路径上存在 erupt-sso 时这四个渠道才会装配。

| 渠道 | 需要的认证源类型 | 消息推送凭据 | 收件人标识（Open ID 字段的值） | 消息形态 |
| --- | --- | --- | --- | --- |
| 飞书 `FeishuNoticeChannel` | 飞书 | 不需要，用 App ID / App Secret 换取 `tenant_access_token` | `open_id` | 机器人富文本消息（post）：标题在上、正文在下，有链接时追加「查看详情」一行 |
| 钉钉 `DingTalkNoticeChannel` | 钉钉 | 需要，填应用的 **AgentId** | `unionId`，发送时查一次企业 userid 并缓存 | 工作通知，markdown 类型，标题为一级标题，有链接时追加「查看详情」 |
| 企业微信 `WeComNoticeChannel` | 企业微信 | 需要，填自建应用的 **AgentId** | `userid` | 应用消息：有链接时是带「查看详情」按钮的 textcard，否则是纯文本 |
| Slack `SlackNoticeChannel` | Slack | 需要，填 **Bot User OAuth Token**（`xoxb-...`）；OIDC 的客户端密钥发不了消息 | `https://slack.com/user_id` | 机器人私信（`chat.postMessage`）：加粗标题 + 正文，有链接时追加「查看详情」 |

接入步骤：

1. 在 **系统管理 → 单点登录** 新增一行，供应商类型选对应预设，填好客户端凭据并启用。
2. 企业微信 / 钉钉 / Slack 还要填 **消息推送凭据**（AgentId 或 Bot token）；飞书不需要。
3. 保留预设填入的 **Open ID 字段**，不要清空——它决定绑定上记录哪个标识作为收件人。
4. 让接收人通过这个认证源**登录一次**，绑定上才会有 Open ID。
5. 此时 **通知场景** 的渠道列表里会出现「Feishu (行名称)」这样的渠道项，勾选即可；用 API 发送时渠道编码就是类名，如 `FeishuNoticeChannel`。

同一类型有多个启用行时取排序最靠前的那一行；没有启用行时渠道自动从列表中隐藏（见下文 `available()`）。

:::tip 链接规则
`NoticeMessage.setUrl(...)` 传相对路径（如 `/some/page`）时，它只对站内信有意义，推送到聊天工具时会被丢弃；只有 `http://` / `https://` 开头的**绝对地址**才会生成「查看详情」链接。
:::

发送失败时，消息通知列表的错误信息列会记录原因：

| 提示 | 场景 |
| --- | --- |
| 没有启用的该类型认证源 (…) | 发送时该类型已没有启用的认证源行，括号内是类型 |
| 该用户尚未通过此认证源登录过 (…) | 接收人没有该认证源的绑定，或绑定上的 Open ID 为空；钉钉还包括用 unionId 查不到企业 userid |
| 认证源未配置消息推送凭据 (…) | 企业微信 / 钉钉 / Slack 的认证源行没填消息推送凭据 |
| 认证源响应异常 (…) | 供应商接口返回错误，括号内是它自己的错误码与文案 |

## 消息渠道

<img src="/notice/channel.png" width="900">

继承抽象类 `AbstractNoticeChannel` 即可接入其他平台（短信、邮件、Microsoft Teams 等），把通知内容同步发送过去。飞书、钉钉、企业微信、Slack 已内置，见上文，不必再写：

```java
import xyz.erupt.notice.channel.AbstractNoticeChannel;
import xyz.erupt.notice.pojo.NoticeMessage;
import xyz.erupt.upms.model.EruptUser;

@Component
public class TeamsNoticeChannel extends AbstractNoticeChannel {

    // 渠道展示名称
    @Override
    public String name() {
        return "Microsoft Teams";
    }

    // 每次向一个接收人发送
    @Override
    public void send(EruptUser receiveUser, NoticeMessage noticeMessage) {
        // 调用 Teams API 发送 noticeMessage.getTitle() / getContent()
    }
}
```

:::tip 渠道编码、排序与可用性
- `code()` 默认返回类的 `SimpleName`（如 `TeamsNoticeChannel`），即通知场景配置和 `send(...)` 入参中使用的渠道编码，如需自定义可重写。
- 重写 `order()` 可调整渠道在列表中的排列顺序，数值越小越靠前。
- 重写 `available()`（2.3.0+，默认 `true`）可让渠道在运行时配置尚不存在时把自己从渠道列表中隐藏——内置的认证源推送渠道就是这样在没有启用的认证源行时隐藏的。
- 渠道实例在构造时自动注册到 `AbstractNoticeChannel.getHandlers()`，声明为 Spring Bean 即可生效。
:::
