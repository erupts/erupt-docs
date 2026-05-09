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
private NoticeService noticeService;

// 发送给指定用户
noticeService.sendNotice(
    "scene_code",       // 场景编码
    "消息标题",
    "消息内容",
    Arrays.asList("user1", "user2")  // 接收用户列表
);

// 全员广播
noticeService.broadcast("scene_code", "通知标题", "通知内容");
```

## 消息渠道

<img src="/notice/channel.png" width="900">

实现 `NoticeChannel` 接口即可注册自定义消息渠道，将通知内容同步发送到 Slack、飞书、短信等平台：

```java
@Component
public class SlackNoticeChannel implements NoticeChannel {

    @Override
    public String channelName() {
        return "Slack";
    }

    @Override
    public void send(String title, String content, List<String> receivers) {
        // 调用 Slack API 发送消息
    }
}
```
