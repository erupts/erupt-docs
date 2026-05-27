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
private NoticeService noticeService;

// Send to specific users
noticeService.sendNotice(
    "scene_code",       // Scene code
    "Message Title",
    "Message Content",
    Arrays.asList("user1", "user2")  // List of recipient users
);

// Broadcast to all users
noticeService.broadcast("scene_code", "Notification Title", "Notification Content");
```

## Notification Channels

<img src="/notice/channel.png" width="900">

Implement the `NoticeChannel` interface to register a custom notification channel and simultaneously deliver notification content to platforms like Slack, Feishu, SMS, etc.:

```java
@Component
public class SlackNoticeChannel implements NoticeChannel {

    @Override
    public String channelName() {
        return "Slack";
    }

    @Override
    public void send(String title, String content, List<String> receivers) {
        // Call the Slack API to send messages
    }
}
```
