# Erupt Job Scheduled Tasks

erupt-job provides visual scheduled task management, supporting Cron expression configuration, task log viewing, email sending, and more. All tasks are managed through the interface with no application restart required.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-job</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

To enable email sending, add the mail configuration to `application.yml`:

```yaml
spring:
  mail:
    username: xxxxxx@qq.com
    password: 123456
    host: smtp.exmail.qq.com
    port: 465
    properties:
      mail.smtp.ssl.auth: true
      mail.smtp.ssl.enable: true
      mail.smtp.ssl.required: true
```

After starting the application, the **Task Management**, **Task Logs**, and **Send Email** menus are automatically added.

## Features

### Task Management

Add scheduled tasks, configure Cron expressions, handler classes, and task parameters. Tasks can be enabled or disabled:

<img src="/job/list.png" width="900">

Add a new task:

<img src="/job/add.png" width="700">

### Task Logs

View execution records including execution time, parameters, return values, and task status:

<img src="/job/log.png" width="900">

Log details:

<img src="/job/log-detail.png" width="700">

### Send Email

Uses the mailbox configured in `application.yml` as the sender, and supports rich-text content:

<img src="/job/email1.png" width="900">

<img src="/job/email2.png" width="700">

## Defining a Handler Class

Handler classes must implement the `EruptJobHandler` interface and be registered as Spring Beans:

```java
@Service
public class DemoJobHandler implements EruptJobHandler {

    /**
     * Task execution logic
     * @param code  Task code (matches the task code configured in the interface)
     * @param param Task parameters (matches the task parameters configured in the interface)
     * @return The return value is recorded in the task log
     */
    @Override
    public String exec(String code, String param) {
        log.info("Executing scheduled task, code={}, param={}", code, param);
        // Business logic...
        return "Execution successful";
    }

    // Task name; supported from 1.12.14+, displayed in the interface dropdown
    @Override
    public String name() {
        return "Demo Scheduled Task";
    }

    // Default Cron expression; supported from 1.12.14+
    @Override
    public String cron() {
        return "0/10 * * * * ?";
    }
}
```

## Configuration in Task Management

| Field | Description |
| --- | --- |
| Task Code | Unique identifier; corresponds to the `code` parameter of the handler's `exec` method |
| Cron Expression | Task schedule rule, e.g. `0 0 2 * * ?` means every day at 2:00 AM |
| Handler Class | Select from registered `EruptJobHandler` implementations |
| Task Parameters | Optional; passed as the `param` argument to the handler's `exec` method |
