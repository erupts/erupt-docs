# Erupt Notice 通知模块

> 1.13.2 及以上版本支持

提供全员广播机制，支持富文本格式与内容管理。消息通知支持点对点/群组级消息推送，默认采用 WebSocket 站内推送机制，并提供可插拔式扩展能力，支持短信、邮件等第三方通知方式。

## 引入方式

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-notice</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

启动后重新登录会看到通知管理的菜单，右上角出现通知按钮。

## 功能说明

### 通知管理场景

基于不同的通知来源，发送的通知必须要指定场景。

### 消息通知

通过 API 或手动发送的通知将会显示在此处，通知方式可自定义，例如：短信通知、飞书通知、Slack 通知等。

### 消息公告

进入系统时，全员通告编辑的富文本信息。

## 消息渠道

可自定义消息通知渠道，将通知内容一键发送给 Slack、飞书、短信等渠道。实现 `NoticeChannel` 接口即可注册自定义渠道。
