# Erupt Job 定时任务

## 引入方式

在导入 erupt 的前提下，导入 erupt-job 依赖：

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-job</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

application.yml 中增加邮件配置（如不需要邮件发送功能可跳过该步骤）：

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

配置成功后启动后，自动增加了**任务维护、任务日志、发送邮件**菜单。

## 功能说明

### 任务维护

管理需要定时执行的任务，支持 Cron 表达式配置。

<!-- TODO: 添加截图 -->

### 任务日志

可查看任务的执行时间、执行参数、任务状态等任务执行信息。

### 发送邮件

application.yml 中配置的邮箱作为发送者，可支持发送富文本内容到指定邮箱。

## 配置定时任务

### 定义处理类

处理类必须实现 `EruptJobHandler` 接口：

```java
package xyz.erupt.demo.handler;

@Service
public class JobHandlerImpl implements EruptJobHandler {

    /**
     * 任务执行的内部逻辑
     * @param code 任务编码
     * @param param 任务参数
     * @return 返回值将会被 job 表记录
     */
    @Override
    public String exec(String code, String param) {
        log.info("执行了一次定义任务");
        return null;
    }

    // 任务名称，1.12.14 及以上版本支持
    @Override
    public String name() {
        return "测试定时任务";
    }

    // 任务默认 cron 表达式，1.12.14 及以上版本支持
    @Override
    public String cron() {
        return "0/10 * * * * ?";
    }

}
```

### 在任务维护中配置任务

在任务维护界面新增任务，配置：

- **任务编码**：对应处理类中的 code 参数
- **Cron 表达式**：任务执行时间规则
- **处理类**：选择实现了 EruptJobHandler 的类
- **任务参数**：可选，对应处理类中的 param 参数
