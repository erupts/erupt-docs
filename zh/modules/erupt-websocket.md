# Erupt WebSocket 实时交互

erupt-websocket 提供 WebSocket 实时通信能力，可用于实时数据推送、在线通知、进度反馈等场景，是 erupt-notice 通知模块的底层传输机制。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-websocket</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 实时通知演示

引入 erupt-websocket 后，配合 erupt-notice 可实现站内实时消息推送：

<img src="/websocket/demo.gif" width="900">

## 实时进度推送

在处理耗时操作（如 Excel 导入、批量处理）时，可通过 WebSocket 实时推送进度信息：

<img src="/websocket/excel.gif" width="900">

## 使用场景

- **erupt-notice**：通知模块的底层传输机制
- **进度反馈**：Excel 批量导入、耗时任务处理进度展示
- **实时数据推送**：监控数据、日志流式输出
- **操作结果反馈**：异步操作完成后实时通知前端

## 在 DataProxy 中使用

1.12.17+ 版本支持在 `DataProxy` 中通过 WebSocket 向当前操作用户推送消息：

```java
import xyz.erupt.webscoket.service.EruptWebSocketService;

@Service
public class MyDataProxy implements DataProxy<MyEntity> {

    @Resource
    private EruptWebSocketService eruptWebSocketService;

    @Override
    public void afterAdd(MyEntity entity) {
        // 向当前用户推送一条消息提示
        eruptWebSocketService.sendJsMessage("操作成功，数据已处理");
        // 或者推送一条通知（标题 + 内容）
        eruptWebSocketService.sendJsNotify("处理完成", "数据已处理");
    }
}
```

`EruptWebSocketService` 的常用方法：

| 方法 | 说明 |
| --- | --- |
| `sendJsMessage(String message)` | 向当前用户推送消息提示 |
| `sendJsNotify(String title, String message)` | 向当前用户推送通知 |
| `send(SocketCommand command, T data)` | 向当前用户会话发送自定义指令与数据 |
| `send(EruptWsSessionModel session, SocketCommand command, T data)` | 向指定会话发送自定义指令与数据 |
| `getCurrentSession()` / `getAllSession()` | 获取当前用户会话 / 全部在线会话 |

:::warning 包名注意
该类所在包为 `xyz.erupt.webscoket.service`（历史拼写如此，并非 `websocket`），import 时请勿写错。
:::

:::tip 前端能力扩展
通过 WebSocket 推送消息后，可在前端配合[消息 & 弹窗组件](/zh/advanced/frontend-notify)实现更丰富的交互效果，例如弹出通知、展示进度条、触发确认框等。
:::
