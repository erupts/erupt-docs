# Erupt WebSocket 实时交互

erupt-websocket 提供 WebSocket 实时通信能力，可用于实时数据推送、在线通知等场景。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-websocket</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 功能特性

- WebSocket 连接管理
- 实时消息推送
- 与 erupt-notice 配合使用实现站内信
- 支持在 DataProxy 中使用 WebSocket 传递错误信息（1.12.17+）

## 使用场景

- erupt-notice 通知模块的底层传输机制
- 自定义实时数据推送
- 操作结果实时反馈
