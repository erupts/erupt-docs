# Event Listeners (@EventListener)

> Supported since 1.12.17+
>
> **Note**: This is a general-purpose listening mechanism designed to solve specific problems. For standard Erupt CRUD control, refer to [DataProxy](/en/advanced/data-proxy).

## Overview

### Targeted Listening

Enables real-time awareness of changes to Erupt system classes (such as `EruptUser`, `EruptJob`, `EruptTenantConfig`, etc.), allowing decoupled reactions to system-level changes.

- Scenario 1: When an Erupt user is added, write their user ID to another table; when deleted, revoke permissions in external systems.
- Scenario 2: Listen to Erupt tenant events — after a tenant is activated, initialize tenant data, send SMS notifications, or write business data.

### Unified Listening

Centrally capture operations on any class to implement consistent system-level features:

- Scenario 1: Record add, delete, and update operations to a dedicated logging system.
- Scenario 2: Forward all operations to a message queue for synchronization to a data warehouse or offline processing system.
- Scenario 3: Broadcast operation events to relevant users via WebSocket.

## Usage

```java
@Service
public class TestEvent {

    // EruptAddEvent: listen for add events on any Erupt class
    @EventListener
    public void addEvent(EruptAddEvent<Object> event) {
       Object eruptDict = event.getSource();
    }

    // EruptEditEvent: listen for edit events on any Erupt class
    @EventListener
    public void editEvent(EruptEditEvent<Object> event) {
        Object before = event.getBefore(); // Data before modification
        Object after = event.getSource();  // Data after modification
    }

    // EruptDeleteEvent: listen for delete events on any Erupt class
    @EventListener
    public void deleteEvent(EruptDeleteEvent<Object> event) {
        System.out.println(event.getSource());
    }


    // Targeted listening
    // Use a SPEL condition to listen to a specific Erupt class
    // For example, listen to EruptUser to run additional logic when a user is added,
    // solving the problem of not being able to directly modify EruptUser behavior.
    @EventListener(condition = "event.getEruptClass().getSimpleName().equals('EruptDict')")
    public void addEvent(EruptAddEvent<EruptDict> event) {
       EruptDict eruptDict = (EruptDict) event.getSource();
    }

}
```
