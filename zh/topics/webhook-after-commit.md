---
title: "EruptAddEvent × AFTER_COMMIT × HMAC：「数据变了通知外部」不该写在 DataProxy 里"
description: "数据变更要推给外部系统，最顺手的写法是在 DataProxy#afterAdd 里发一个 HTTP 请求。本期拆 erupt-webhook：订阅管线事件、事务提交之后才投递、请求线程不等接收方，以及它现在没有持久化队列的代价。"
outline: deep
---

# 第 22 期 · 事务没提交，别通知外部

> 数据变更要推给外部系统，最顺手的写法是在 `DataProxy#afterAdd` 里发一个 HTTP 请求——它在事务提交**之前**执行，请求会卡在接收方身上，失败了还得自己写重试。`erupt-webhook` 反过来：订阅管线已经在发的 `EruptAddEvent` / `EruptEditEvent` / `EruptDeleteEvent`，在事务提交之后才匹配订阅，交给后台线程做带签名、带重试、有日志的投递。
>
> _发布于 2026-10-19 · 阅读 ~9 min_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt 微信公众号" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · 公众号</div>
    <div class="topic-mp-qr__title">扫码关注 Erupt 公众号</div>
    <p class="topic-mp-qr__desc">每期专题首发于此，另有版本动态、源码解读、社区精选案例。</p>
  </div>
</div>

[[toc]]

## 一、为什么写这篇

「订单一入库就通知仓库系统」「客户资料一改就同步到 CRM」——这类需求在后台里每个月都会出现一次。常见的做法有三种：在业务方法里直接 `HttpClient.post`；在 `DataProxy#afterAdd` 里发；或者在低代码平台里给某个表单配一条「数据变更时调用接口」的规则。

三种做法有同一组隐患：

- **通知发在事务提交之前。** 管线里 `afterAdd` 执行时，`EruptModifyService#insertEruptData` 的事务还没提交（该方法标了 `@Transactional`）。接收方一回调查询，可能查不到这条记录；事务随后回滚，外部系统却已经收到了「新增」。
- **请求线程替接收方等着。** 接收方慢 10 秒，用户保存按钮就转 10 秒。
- **每个模型配一遍。** 第十张表有人忘了接。

本文的反向命题是：

> **对外通知是「已经提交的事实」的广播，不是某个模型生命周期里的一个步骤。** 它应该订阅事务提交之后的事件，由一个与请求无关的投递者负责重试和留痕。

## 二、两种做法：插进生命周期 vs 订阅提交后的事件

| 维度 | 写在 `DataProxy#afterXxx` 里 | 订阅管线事件（`erupt-webhook`） |
|---|---|---|
| 触发时刻 | 事务提交之前 | `TransactionPhase.AFTER_COMMIT`，回滚的写入不通知 |
| 覆盖范围 | 每个模型各写一遍 | 订阅里勾「全部模型」，或在穿梭框里挑 |
| 谁等接收方 | 请求线程 | 后台线程池，请求线程只做匹配和序列化 |
| 失败怎么办 | 自己写重试和日志 | 内置 3 次尝试 + 投递日志 + 一键重发 |
| 谁来配 | 开发者改代码、发版 | 管理员在后台填一张表单 |

## 三、可数的事实：三个事件、三次尝试、两张表

整个模块在 `erupt-plugin/erupt-webhook` 下，主代码约 830 行：

- **三个事件**：`xyz.erupt.webhook.model.WebhookEvent` 只有 `ADD`、`UPDATE`、`DELETE`，对应核心管线里的 `EruptAddEvent`、`EruptEditEvent`、`EruptDeleteEvent`。测试专门有一条 `deleteIsNotSubscribed`：没订阅的事件不会投递。
- **三次尝试**：`EruptWebhookService` 里 `ATTEMPTS = 3`，两次退避分别是 1 秒和 5 秒；单次请求超时 15 秒，连接超时 10 秒。
- **两张表**：`EruptWebhook`（订阅）和 `EruptWebhookLog`（每次投递一行：状态码、尝试次数、耗时、响应前 2000 字符、完整载荷）。两张表都是普通的 `@Erupt` 模型，订阅表可以「下钻」到自己的投递日志。
- **两个自带头**：`X-Erupt-Signature: sha256=<HMAC-SHA256(secret, body)>` 与 `X-Erupt-Delivery`；订阅里还能用 `KEY_VALUE` 字段追加任意请求头（比如接收方要的 `Authorization`）。

载荷是一份统一的信封：

```json
{
  "id": "…uuid…",
  "event": "UPDATE",
  "erupt": "Order",
  "model": "订单",
  "recordId": "1024",
  "operator": "admin",
  "timestamp": "2026-10-19T03:04:45Z",
  "before": { "status": "待支付" },
  "after":  { "status": "已支付" }
}
```

`before` / `after` 是整行 JSON，新增时 `before` 为 `null`，删除时 `after` 为 `null`。

## 四、「提交之后」在代码里长什么样

监听器在 `xyz.erupt.webhook.service.EruptWebhookService`，三个方法，全部挂在 `AFTER_COMMIT` 上：

```java
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
public void onEdit(EruptEditEvent<Object> event) {
    this.dispatch(event.getEruptClass(), WebhookEvent.UPDATE, event.getBefore(), event.getSource());
}

private void dispatch(Class<?> clazz, WebhookEvent event, Object before, Object after) {
    if (!subscribable(clazz)) return;
    List<EruptWebhook> matches = this.subscriptions().stream()
            .filter(it -> it.getEvents().contains(event) && this.subscribes(it, clazz.getSimpleName()))
            .toList();
    if (matches.isEmpty()) return;
    EruptModel eruptModel = this.resolve(clazz);
    if (null == eruptModel) return;
    try {
        // everything that depends on the request thread (user, masking) is captured here, before the handoff
        JsonElement beforeJson = this.masked(eruptModel, before);
        JsonElement afterJson = this.masked(eruptModel, after);
        String recordId = this.recordId(eruptModel, null == afterJson ? beforeJson : afterJson);
        JsonObject payload = this.envelope(event.name(), eruptModel, recordId);
        payload.add("before", beforeJson);
        payload.add("after", afterJson);
        String body = payload.toString();
        for (EruptWebhook webhook : matches) {
            executor.execute(() -> this.record(webhook, eruptModel.getEruptName(), event, recordId, body, this.deliver(webhook, body)));
        }
    } catch (Exception e) {
        // a webhook must never take the change itself down
        log.warn("erupt-webhook: failed to dispatch {} of {}: {}", event, clazz.getSimpleName(), e.getMessage());
    }
}
```

三处细节值得点出：

- **`fallbackExecution = true`。** 当前没有事务时事件也照发，不会因为「没有事务可等」而静默丢失。
- **请求线程相关的东西在交接之前取完。** `MetaContext.getUser()` 取操作人、`EruptUtil.toMaskedJson` 序列化整行，都在 `dispatch` 里同步完成；后台线程拿到的只是一个已经定稿的字符串。
- **投递者永远不拖垮业务。** 整段 `try/catch` 只打 `warn`；后台线程是 2 个守护线程，请求线程只做匹配和序列化。

:::tip 反直觉的一点
重试不是在「请求里」做的，而且**签名的是最终的字节串**：`sign(secret, body)` 对的是 `payload.toString()` 的 UTF-8 字节，重发一条历史记录时用的是日志里存下来的同一份 `payload`（`redeliver`），所以接收方验签用的永远是同一串字节。测试 `resendPostsTheStoredPayloadAgain` 断言了「重发的载荷与原载荷逐字相同」。
:::

## 五、订阅本身也是一张 `@Erupt` 表

订阅表 `EruptWebhook` 几乎没有「特殊 UI」，全是前面各期讲过的注解的组合：

```java
@Erupt(
        name = "Webhook",
        orderBy = "createTime desc",
        dataProxy = EruptWebhookDataProxy.class,
        drills = @Drill(title = "Deliveries", icon = "fa fa-list-ul",
                link = @Link(linkErupt = EruptWebhookLog.class, joinColumn = "webhookId")),
        rowOperation = @RowOperation(code = "ping", title = "Send Test", icon = "fa fa-paper-plane",
                mode = RowOperation.Mode.SINGLE, operationHandler = EruptWebhookDataProxy.class)
)
@Entity
@Table(name = "e_webhook")
public class EruptWebhook extends HyperModelUpdateVo {

    @EruptField(edit = @Edit(title = "Secret", type = EditType.PASSWORD))
    private String secret;

    @JdbcTypeCode(SqlTypes.JSON)
    @EruptField(edit = @Edit(title = "Events", notNull = true, type = EditType.MULTI_CHOICE))
    private Set<WebhookEvent> events = EnumSet.allOf(WebhookEvent.class);

    @EruptField(edit = @Edit(title = "All Models", notNull = true, boolType = @BoolType(type = BoolType.Type.SWITCH)))
    private Boolean allModels = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @EruptField(edit = @Edit(title = "Models", type = EditType.MULTI_CHOICE,
            dynamic = @Dynamic(dependField = "allModels", condition = "!value", match = Dynamic.Ctrl.NOTNULL),
            multiChoiceType = @MultiChoiceType(type = MultiChoiceType.Type.TRANSFER, fetchHandler = WebhookEruptChoice.class)))
    private Set<String> erupts;
    // …
}
```

这里每个「功能」都落在一个已有的扩展点上：

- **「发一条测试」** 一份 `EruptWebhookDataProxy` 同时实现了 `DataProxy`、`OperationHandler`（行按钮，测已保存的行）和 `EruptButtonHandler`（表单按钮，**按表单里当前输入的值**测，保存之前就能验证 URL 通不通）。编辑表单里密码是占位符，`click` 会回库取真实密钥。
- **模型穿梭框的选项** 来自 `WebhookEruptChoice`，一个普通的 `fetchHandler`。
- **「所有模型」开关控制穿梭框显隐** 是 `@Dynamic`，但必填校验写在 `EruptWebhookDataProxy#validate` 里——注释写得很直白：表单只是把选择器藏起来，必填检查必须在服务端。
- **投递日志** `EruptWebhookLog` 的 `Power(add = false, edit = false)`，只能读、筛、导出和「重发」（`WebhookResendHandler` 是一个 `OperationHandler`）。

没有一行代码是「webhook 专用的 UI」。管理员看到的订阅列表、日志下钻、测试按钮，都是注解渲染出来的。

## 六、跟宜搭 / 简道云 / 明道云怎么比？

我们没有逐项实测这些平台。下表左列是**选型时值得问的问题**，不是对它们的结论；各平台能力以官方文档和实测为准。

| 维度 | 国内对位平台：选型时该问 | Erupt |
|---|---|---|
| 触发点 | 宜搭、简道云、明道云里，「数据变更时调用接口」是配在某张表单 / 某条流程上，还是平台级订阅？新增一张表要不要再配一遍？ | 一条订阅可覆盖「全部模型」，系统自带的两张表除外（`subscribable`） |
| 通知时刻 | 回调发生在数据落库之前还是之后？回滚的写入会不会被通知？ | `AFTER_COMMIT`，事务回滚不通知 |
| 请求线程 | 接收方变慢会不会拖慢用户的保存？ | 后台 2 线程投递，请求线程只做序列化 |
| 验签 | 接收方能否验证调用方？ | `X-Erupt-Signature: sha256=` HMAC-SHA256，密钥不回显 |
| 失败可见性 | 失败后能否看到响应、能否一键重发？ | 日志里有状态码、响应、尝试次数、完整载荷，可重发 |
| 载荷里的敏感字段 | 密码类字段会不会被带出去？ | `PASSWORD` 字段（含 `COMBINE` 子结构）替换为占位符 |

## 七、5 分钟上手

从空项目到能访问的 admin 页面，完整流程已经独立成一篇：

**→ [快速部署 / Quick Start](/guide/quick-start)**

`erupt-webhook` 是可选模块，在 `erupt-upms` 的基础上额外引入 `erupt-webhook` 依赖（坐标 `xyz.erupt:erupt-webhook`）即可，不需要任何 yaml 配置。启动后在管理菜单里出现「Webhook」，新建订阅、点「发送测试」，随后在「下钻 → Deliveries」里就能看到每次投递。

## 八、代价与下一期预告

这一期不替它遮掩，下面几条都能在源码里对上：

- **没有持久化队列。** 投递任务在内存线程池里，进程在重试期间重启，这几条投递就没了——它们既不会重试，也不会留下日志行（日志在每次投递结束后才写）。需要「至少一次」语义的场景，请把接收方当作「尽力而为」，用 `recordId` 对账。
- **失败有三次机会，不是无限次。** 之后只留一条失败日志，要靠管理员手动「重发」。
- **订阅缓存只在本节点刷新。** `refresh()` 只清空本进程里的 `enabled` 列表；多节点部署时，别的节点要等自己的缓存被清空才会看到新订阅。
- **脱敏只管 `PASSWORD`。** `EruptUtil.maskPasswordFields` 只处理 `EditType.PASSWORD`（以及 `COMBINE` 里嵌套的）；手机号、身份证号这类字段，载荷里是原样的——需要脱敏请不要把整张表订阅出去。
- **只有三种事件。** 没有「某个字段变成了某个值」这类条件订阅；筛选目前由接收方自己做。

下一期换个方向：主仓这两周 `erupt-sso` 加了 SAML 2.0（#401），租户也能用自己的登录提供方（#424）。`SsoSamlService` 只有约 400 行，`erupt-sso` 的 `pom.xml` 里除了 `erupt-upms` 没有任何 SAML 库。**企业登录协议里最难写对的是哪几步，为什么我们选择自己走完**——以及它和钉钉、飞书扫码登录的边界。

---

:::info 参与讨论
本期涉及的源码：`erupt-plugin/erupt-webhook/.../service/EruptWebhookService.java`、`model/EruptWebhook.java`、`model/EruptWebhookLog.java`、`handler/EruptWebhookDataProxy.java`、`handler/WebhookResendHandler.java`，`erupt-core/.../service/EruptModifyService.java`（事件发布点），`erupt-core/.../util/EruptUtil.java`（`toMaskedJson`），以及 `erupt-test/.../webhook/WebhookTest.java`。

要不要给订阅加「字段条件」、要不要提供持久化的投递队列，欢迎到 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 投一票。
:::
