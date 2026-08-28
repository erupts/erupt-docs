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

## 消息渠道

<img src="/notice/channel.png" width="900">

继承抽象类 `AbstractNoticeChannel` 即可注册自定义消息渠道，将通知内容同步发送到 Slack、飞书、短信等平台：

```java
import xyz.erupt.notice.channel.AbstractNoticeChannel;
import xyz.erupt.notice.pojo.NoticeMessage;
import xyz.erupt.upms.model.EruptUser;

@Component
public class SlackNoticeChannel extends AbstractNoticeChannel {

    // 渠道展示名称
    @Override
    public String name() {
        return "Slack";
    }

    // 每次向一个接收人发送
    @Override
    public void send(EruptUser receiveUser, NoticeMessage noticeMessage) {
        // 调用 Slack API 发送 noticeMessage.getTitle() / getContent()
    }
}
```

:::tip 渠道编码与排序
- `code()` 默认返回类的 `SimpleName`（如 `SlackNoticeChannel`），即通知场景配置和 `send(...)` 入参中使用的渠道编码，如需自定义可重写。
- 重写 `order()` 可调整渠道在列表中的排列顺序，数值越小越靠前。
- 渠道实例在构造时自动注册到 `AbstractNoticeChannel.getHandlers()`，声明为 Spring Bean 即可生效。
:::
