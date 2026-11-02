# Erupt SMS

[erupt-sms](https://github.com/erupt-io/erupt-sms) brings SMS across vendors to Erupt, built on [SMS4J](https://sms4j.com). Add the dependency, register a channel with the vendor's keys, and an **SMS** menu appears with templates, sending with a log, verification codes and a blacklist, plus a fluent Java API.

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-sms</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

Needs erupt 2.4.0 or newer. H2 comes along as the zero-config database; set `spring.datasource.*` to use another.

## Try it

```bash
mvn spring-boot:run
# http://localhost:8080  erupt / erupt
```

## Built-in menus

| Menu | What |
| --- | --- |
| Channels | A vendor account, one of them the default: Alibaba Cloud, Tencent Cloud, Huawei Cloud, Baidu, JD, CTYun, Qiniu, NetEase, Yunpian, UniSMS, Cloopen, Emay, Chuanglan, Jiguang, Submail and the rest SMS4J supports; vendor-specific settings go in as `key=value` lines |
| Templates | The templates approved at the vendor, each with a code the application sends by; the `${name}` placeholders of the content become the parameters, in the vendor's order |
| Messages | Saving one sends it to one phone or many; the row keeps the rendered text, the outcome and the vendor's answer; resend from the row |
| Verification codes | Every code issued through the API below, with its outcome |
| Blacklist | Phones never sent to, on any channel |

## Workspace: the current channel

The **Workspace** picker in the header holds the channel. Templates, messages and codes are filtered by it and new rows land in it. The pick travels with every request in the `erupt-scope` header and the server checks it against the channels the user is offered. This is Erupt's [@EruptScope](/en/annotation/erupt-scope) feature; `SmsScope` is a plain Erupt form.

## Sending from code

The host application sends through `EruptSms`. A template is named by its **code**, parameters by the fields of a record, and the default channel is used unless another is named:

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

`Templates` is any enum of the host application whose constant names are the codes. Every send goes the way the admin's own does: blacklist, the template's parameter order, a row in Messages with the outcome. A failed send throws and leaves a FAILED row.

## Verification codes

`sms.code(phone).send()` goes out through the channel's enabled template of kind *Verification code*, with `${code}` and `${minutes}` (the validity) filled in. Each phone gets a limited number of codes per day (set on the channel), with a wait between two; a code is good for one check within its validity. The module ships no HTTP endpoint; the host application exposes codes to its own pages however it likes.

```yaml
erupt:
  sms:
    code-length: 6
    code-ttl-seconds: 300
    resend-seconds: 60
```

:::tip Notes
- **Templates and signatures are approved at the vendor.** Tencent reads parameters by position while Alibaba reads them by name, so the parameter order is editable.
- **Channels are rows, not files.** Each enabled channel becomes one SMS4J `SmsBlend` at startup and whenever it is saved; a vendor SMS4J does not ship can be plugged in through `SmsChannels#put`.
- **Delivery reports** differ per vendor and are not collected; the status is the vendor's answer to the send call.
:::
