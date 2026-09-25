# Erupt Notice Message Notifications

> Requires version 1.13.2 or above

Provides broadcast-to-all and point-to-point message push capabilities, with support for rich-text formatting and content management. The default transport mechanism is WebSocket in-app push, with a pluggable extension model that supports third-party notification channels such as SMS, email, Feishu (Lark), and Slack.

## Adding the Dependency

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-notice</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

After starting and logging in again, a notification bell icon appears in the top-right corner and a notification management menu appears in the sidebar:

<img src="/notice/notification.png" width="900">

## Features

### Announcements

Supports rich-text editing. Published announcements are visible to all users when they enter the system:

<img src="/notice/announcement.png" width="900">

Announcement edit interface:

<img src="/notice/announcement-edit.png" width="700">

Announcement display:

<img src="/notice/announcement-show.png" width="700">

### Notification Scene Management

Based on different business sources, notification scenes must be configured before sending notifications, making it easier for users to categorize and manage received notifications:

<img src="/notice/scene.png" width="900">

### Message Notifications

Messages sent via the API or manually appear in the notification list, with support for marking as read and viewing details:

<img src="/notice/message.png" width="900">

## Send Notification API

```java
@Resource
private EruptNoticeService eruptNoticeService;

@Resource
private EruptInternalNotice eruptInternalNotice; // Built-in in-app channel

public void notifyUsers() {
    NoticeMessage message = new NoticeMessage();
    message.setTitle("Message Title");
    message.setContent("Message Content");
    message.setUrl("/some/page"); // Optional, the page opened when the notification is clicked

    // Send through a channel. The 2nd argument is the notice scene code,
    // the 3rd one is the list of recipient user IDs.
    eruptNoticeService.send(eruptInternalNotice, "scene_code", Arrays.asList(1L, 2L), message);
}
```

You can also pass a `NoticeScene` entity together with multiple channel codes:

```java
// channels is a list of channel codes, which default to the channel class SimpleName
eruptNoticeService.send(noticeScene, List.of("EruptInternalNotice"), Arrays.asList(1L, 2L), message);
```

:::warning Note
- The service class is `EruptNoticeService` and it has no `broadcast` method. To notify everyone, query the user IDs yourself and pass them in.
- Recipients are user IDs (`List<Long>`), not login account strings.
- `scene_code` must be an existing code in "Notification Scene", otherwise a `Notice Scene not found` exception is thrown.
:::

## Provider-backed Channels <Badge type="tip" text="v2.3.0+" />

erupt-notice ships four channels — Feishu, DingTalk, WeCom and Slack — that need no appId or token of their own. Each sends through the [erupt-sso](/en/modules/erupt-sso) provider row of the matching **Provider Type**: the row's client credentials are the app the message is sent from, and the Open ID recorded on the user's binding when they signed in through that provider is the recipient. The four channels are wired up only when erupt-sso is on the classpath.

| Channel | Provider type required | Messaging Key | Recipient identifier (value of the Open ID Claim) | Message shape |
| --- | --- | --- | --- | --- |
| Feishu `FeishuNoticeChannel` | Feishu | Not needed; the App ID / App Secret obtain a `tenant_access_token` | `open_id` | Bot rich-text message (post): title on top, content below, plus a "View details" line when there is a link |
| DingTalk `DingTalkNoticeChannel` | DingTalk | Needed: the app's **AgentId** | `unionId`, resolved to the corp userid once at send time and cached | Work notification in markdown, the title as a heading, plus "View details" when there is a link |
| WeCom `WeComNoticeChannel` | WeCom | Needed: the self-built app's **AgentId** | `userid` | Application message: a textcard with a "View details" button when there is a link, plain text otherwise |
| Slack `SlackNoticeChannel` | Slack | Needed: the **Bot User OAuth Token** (`xoxb-...`); the OIDC client secret cannot post | `https://slack.com/user_id` | Direct message from the bot (`chat.postMessage`): bold title + content, plus "View details" when there is a link |

Steps:

1. Add a row under **System Management → SSO Provider**, pick the matching preset as Provider Type, fill in the client credentials and enable it.
2. For WeCom / DingTalk / Slack also fill in the **Messaging Key** (AgentId or bot token); Feishu needs none.
3. Keep the **Open ID Claim** the preset filled in — do not clear it; it decides which identifier the binding records as the recipient.
4. Have the recipient **sign in once** through that provider, so their binding gets an Open ID.
5. The channel list of a **Notification Scene** now offers an entry such as "Feishu (row name)"; tick it. When sending through the API the channel code is the class name, e.g. `FeishuNoticeChannel`.

With several enabled rows of one type the first by sort is used; with none, the channel hides itself from the list (see `available()` below).

:::tip Link rule
A relative path passed to `NoticeMessage.setUrl(...)` (such as `/some/page`) only means something to the in-app channel and is dropped when pushing to a chat app; only an **absolute URL** starting with `http://` / `https://` becomes a "View details" link.
:::

When a send fails, the error column of the notification log records why:

| Message | Situation |
| --- | --- |
| No enabled SSO provider of this type is configured (…) | At send time there is no enabled provider row of that type; the brackets show the type |
| The user has never signed in through this provider (…) | The recipient has no binding with that provider, or the binding's Open ID is empty; for DingTalk also when the unionId resolves to no corp userid |
| The provider row has no Messaging Key (…) | The WeCom / DingTalk / Slack row has no Messaging Key |
| The identity provider could not be reached (…) | The provider's API returned an error; the brackets carry its own code and message |

## Notification Channels

<img src="/notice/channel.png" width="900">

Extend the abstract class `AbstractNoticeChannel` to connect another platform (SMS, email, Microsoft Teams, ...) and deliver notification content there. Feishu, DingTalk, WeCom and Slack are already built in, see above, so there is no need to write them again:

```java
import xyz.erupt.notice.channel.AbstractNoticeChannel;
import xyz.erupt.notice.pojo.NoticeMessage;
import xyz.erupt.upms.model.EruptUser;

@Component
public class TeamsNoticeChannel extends AbstractNoticeChannel {

    // Display name of the channel
    @Override
    public String name() {
        return "Microsoft Teams";
    }

    // Called once per recipient
    @Override
    public void send(EruptUser receiveUser, NoticeMessage noticeMessage) {
        // Call the Teams API with noticeMessage.getTitle() / getContent()
    }
}
```

:::tip Channel code, ordering and availability
- `code()` returns the class `SimpleName` by default (e.g. `TeamsNoticeChannel`). That value is the channel code used in notice scene configuration and in `send(...)`. Override it if you need a custom code.
- Override `order()` to control the position of the channel in the list — lower values come first.
- Override `available()` (2.3.0+, default `true`) to let a channel hide itself from the channel list until its runtime configuration exists — this is how the built-in provider-backed channels disappear while no enabled provider row of their type exists.
- Channel instances register themselves into `AbstractNoticeChannel.getHandlers()` in the constructor, so declaring the class as a Spring Bean is enough.
:::
