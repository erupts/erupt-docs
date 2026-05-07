# Erupt 事件监听器

> 1.12.17 及以上版本支持
>
> **注意**：此方式为通用形式监听，用于解决特定问题，标准 erupt 增删改查的控制，请参考 [DataProxy](/advanced/data-proxy)

## 能力介绍

### 定向监听

实现与 erupt 系统类（EruptUser、EruptJob、EruptTenantConfig 等）实时感知能力，系统类的变化可以实时监听，实现解耦。

- 场景1：erupt 用户在新增时向其他表写入用户 ID 等信息，用户删除关闭其他系统权限
- 场景2：监听 erupt 租户类，在租户开通后写入一些租户初始化数据，例如调用短信通知，写入业务数据等

### 统一监听

任何类的操作都可以集中捕获，实现统一的系统原生功能：

- 场景1：将新增、删除、更新等操作，记录到特定的日志系统
- 场景2：统一传递给消息队列，同步到数据仓库或离线处理系统
- 场景3：将操作内容统一通过 WebSocket 能力通知到相关用户

## 使用方法

```java
@Service
public class TestEvent {

    // EruptAddEvent 监听 erupt 类新增事件
    @EventListener
    public void addEvent(EruptAddEvent<Object> event) {
       Object eruptDict = event.getSource();
    }

    // EruptEditEvent 监听 erupt 类编辑事件
    @EventListener
    public void editEvent(EruptEditEvent<Object> event) {
        Object before = event.getBefore(); // 修改前的数据
        Object after = event.getSource();  // 修改后的数据
    }

    // EruptDeleteEvent 监听 erupt 类删除事件
    @EventListener
    public void deleteEvent(EruptDeleteEvent<Object> event) {
        System.out.println(event.getSource());
    }


    // 定向监听
    // 使用 condition 配置使用 SPEL 监听特定 erupt 类的变化
    // 例如监听 eruptUser 对象，实现添加用户时额外执行其他操作，解决 eruptUser 用户对象不能直接操作的难题
    @EventListener(condition = "event.getEruptClass().getSimpleName().equals('EruptDict')")
    public void addEvent(EruptAddEvent<EruptDict> event) {
       EruptDict eruptDict = (EruptDict) event.getSource();
    }

}
```
