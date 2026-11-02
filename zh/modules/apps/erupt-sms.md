# Erupt SMS 短信

[erupt-sms](https://github.com/erupt-io/erupt-sms) 基于 [SMS4J](https://sms4j.com) 为 Erupt 提供多厂商短信能力。加上依赖、登记一个渠道的密钥，后台就多出一个 **短信** 菜单：模板、发送与日志、验证码、黑名单一应俱全，另附一套流式 Java API。

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-sms</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

需要 erupt 2.4.0 及以上。H2 作为零配置数据库随附，设置 `spring.datasource.*` 即可换成其他数据库。

## 本地试用

```bash
mvn spring-boot:run
# http://localhost:8080  erupt / erupt
```

## 内置菜单

| 菜单 | 内容 |
| --- | --- |
| 渠道 | 厂商账号，其中一个作为默认渠道：阿里云、腾讯云、华为云、百度、京东、天翼云、七牛、网易、云片、合一、容联、亿美、创蓝、极光、赛邮等 SMS4J 支持的厂商；厂商特有配置以 `key=value` 行填写 |
| 模板 | 厂商审核通过的模板，每个带一个供代码引用的编码；内容中的 `${name}` 占位符即参数，按厂商要求的顺序排列 |
| 消息 | 保存即发送，可发一个或多个手机号；记录渲染后的文本、结果与厂商回执，可在行上重发 |
| 验证码 | 通过下方 API 发出的每个验证码及其结果 |
| 黑名单 | 任何渠道都不会发送的手机号 |

## Workspace：当前渠道

页头的 **Workspace** 选择器决定当前渠道，模板、消息、验证码都按它过滤，新建记录也落在其中。选择随每次请求以 `erupt-scope` 头发送，服务端校验它是否在用户可选范围内。Workspace 基于 [@EruptScope](/zh/annotation/erupt-scope) 实现，`SmsScope` 只是一个普通的 Erupt 表单。

## 在代码中发送

宿主应用通过 `EruptSms` 发送。模板按 **编码** 引用，参数取自一个 record 的字段，未指定渠道时使用默认渠道：

```java
@Resource
private EruptSms sms;

record OrderShipped(String name, String order) {}

sms.template(Templates.ORDER_SHIPPED).to("13800000000").params(new OrderShipped("Ann", "A-1")).send();
sms.template("ORDER_SHIPPED").to(phones).param(OrderShipped::name, "Ann").param(OrderShipped::order, "A-1").send();
sms.via("Marketing").template(Templates.SALE).to(phones).send();

sms.code("13800000000").send();
sms.code("13800000000").verify("482913");
```

`Templates` 可以是宿主应用中任意枚举，常量名即模板编码。代码发送与后台发送走同一条路径：校验黑名单、按模板参数顺序填充、在「消息」中留下记录；发送失败抛出异常并留下 FAILED 记录。

## 验证码

`sms.code(phone).send()` 通过渠道中类型为 *验证码* 的启用模板发送，自动填充 `${code}` 与 `${minutes}`（有效期）。每个手机号每天的发送次数由渠道上的配置限制，两次发送之间有冷却时间；验证码在有效期内只能校验一次。模块不暴露 HTTP 接口，由宿主应用自行对外提供。

```yaml
erupt:
  sms:
    code-length: 6
    code-ttl-seconds: 300
    resend-seconds: 60
```

:::tip 说明
- **模板与签名在厂商侧审核**。腾讯云等按位置读取参数，阿里云按名称读取，所以参数顺序可调整。
- **渠道是数据而不是配置文件**。每个启用的渠道在启动和保存时注册为一个 SMS4J `SmsBlend`；SMS4J 未内置的厂商可通过 `SmsChannels#put` 接入。
- **送达回执**因厂商而异，暂不采集；状态即厂商对发送请求的应答。
:::
