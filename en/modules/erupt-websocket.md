# Erupt WebSocket Real-Time Interaction

erupt-websocket provides WebSocket real-time communication capabilities for use cases such as real-time data push, online notifications, and progress feedback. It serves as the underlying transport mechanism for the erupt-notice notification module.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-websocket</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## Real-Time Notification Demo

When combined with erupt-notice, erupt-websocket enables real-time in-app message push:

<img src="/websocket/demo.gif" width="900">

## Real-Time Progress Push

For long-running operations (such as Excel imports or batch processing), progress information can be pushed to the frontend in real time via WebSocket:

<img src="/websocket/excel.gif" width="900">

## Use Cases

- **erupt-notice**: Underlying transport mechanism for the notification module
- **Progress Feedback**: Real-time progress display for Excel batch imports and time-consuming tasks
- **Real-Time Data Push**: Monitoring data, streaming log output
- **Operation Result Feedback**: Real-time frontend notification after an async operation completes

## Using WebSocket in DataProxy

From version 1.12.17+, you can send WebSocket messages to the current operating user from within a `DataProxy`:

```java
@Service
public class MyDataProxy implements DataProxy<MyEntity> {

    @Resource
    private EruptWebSocket eruptWebSocket;

    @Override
    public void afterAdd(MyEntity entity) {
        // Push a message to the current operating user
        eruptWebSocket.sendToCurrentUser("Operation successful, data has been processed");
    }
}
```

:::tip Frontend Capability Extension
After pushing a message via WebSocket, you can pair it with the [Message & Dialog Components](/en/advanced/frontend-notify) on the frontend to create richer interactions, such as pop-up notifications, progress bars, and confirmation dialogs.
:::
