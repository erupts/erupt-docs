# Erupt Job 定时任务

erupt-job 提供可视化定时任务管理能力，支持 Cron 表达式配置、任务日志查看、邮件发送等功能，所有任务通过界面管理，无需重启应用。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-job</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

如需邮件发送功能，在 `application.yml` 中增加邮件配置：

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

配置成功并启动后，自动增加**任务维护、任务日志、发送邮件**菜单。

## 功能说明

### 任务维护

新增定时任务，配置 Cron 表达式、处理类、任务参数，支持启用/停用：

<img src="/job/list.png" width="900">

新增任务：

<img src="/job/add.png" width="700">

### 任务日志

查看任务的执行时间、执行参数、返回结果、任务状态等执行记录：

<img src="/job/log.png" width="900">

日志详情：

<img src="/job/log-detail.png" width="700">

### 发送邮件

以 `application.yml` 中配置的邮箱作为发送者，支持富文本内容：

<img src="/job/email1.png" width="900">

<img src="/job/email2.png" width="700">

## 定义处理类

处理类必须实现 `EruptJobHandler` 接口并注册为 Spring Bean：

```java
@Service
public class DemoJobHandler implements EruptJobHandler {

    /**
     * 任务执行逻辑
     * @param code  任务编码（对应界面配置的任务编码）
     * @param param 任务参数（对应界面配置的任务参数）
     * @return 返回值将被记录到任务日志
     */
    @Override
    public String exec(String code, String param) {
        log.info("执行定时任务，code={}, param={}", code, param);
        // 业务逻辑...
        return "执行成功";
    }

    // 任务名称，1.12.14+ 支持，用于界面下拉显示
    @Override
    public String name() {
        return "示例定时任务";
    }

    // 默认 Cron 表达式，1.12.14+ 支持
    @Override
    public String cron() {
        return "0/10 * * * * ?";
    }
}
```

## 在任务维护中配置

| 配置项 | 说明 |
| --- | --- |
| 任务编码 | 唯一标识，对应处理类 `exec` 方法的 `code` 参数 |
| Cron 表达式 | 任务执行时间规则，如 `0 0 2 * * ?` 表示每天凌晨 2 点 |
| 处理类 | 从已注册的 `EruptJobHandler` 实现类中选择 |
| 任务参数 | 可选，透传给处理类 `exec` 方法的 `param` 参数 |
