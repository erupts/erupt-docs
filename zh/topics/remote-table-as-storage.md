---
title: "@EruptDataProcessor × EruptHttpAdapter × 多维表：不做数据集成，只换存储引擎"
description: "数据在钉钉多维表、飞书多维表格、Airtable 或别人的 REST 接口里时，国内低代码的答案是连接器 + 同步。Erupt 换掉的是模型背后的存储引擎，校验、DataProxy、权限、日志一条管线不动。这一期讲清楚这么做换来了什么、又付出了什么。"
outline: deep
---

# 第 16 期 · 数据不在你库里的时候

> 后台要管的数据，越来越多不在自己的 MySQL 里：运营在钉钉多维表里维护的价目表、飞书多维表格里的渠道名单、另一个团队只开放了 REST 的客户中心。宜搭、明道云、简道云的答案是"连接器 + 同步"——把数据搬进平台再管。Erupt 押反向：**不搬数据，换引擎**。一个 `@Erupt` 类背后是 JPA 还是一个 HTTP 端点，只差一行 `@EruptDataProcessor`；代价是查询语义退化到对方能做的程度，而这件事我们选择写在明处。
>
> 发布于 2026-10-02 · 阅读 ~11 min

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

第 15 期结尾我们留了一个问题：**当数据不在你的数据库里，后台框架应该把多少适配逻辑留给你？**

这两周主仓里有三个提交把这个问题推到了台前：

- `e5b2a218f Add DingTalk Notable and Airtable data sources`——钉钉多维表、Airtable 成为数据源，和此前的飞书多维表格共用一个基类；
- `003fadcc9 feat(erupt-data-s3): typed S3ObjectModel ...`——S3 桶里的对象变成一张有类型的表；
- `ef34f8c1c feat(erupt-data-http): adapter hooks and per-request templates ...`——任意 REST 接口有了 8 个生命周期钩子和信封解包。

行业里对"外部数据"的默认处理是**集成**：建一个连接器，定时或由流程触发，把外部数据同步进平台自己的表，再在那张表上做表单、权限、报表。这套做法成熟，但它悄悄引入了第二份数据——以及"哪份是真的"这个永远答不干净的问题。

我们的反向命题：**后台框架的职责是管理数据，不是持有数据。** 存储在哪里，应该是模型的一个属性，而不是一次迁移。

## 二、两种范式：搬数据 vs 换引擎

| | 集成范式（连接器 + 同步） | 存储引擎范式（Erupt `@EruptDataProcessor`） |
|---|---|---|
| 外部数据的位置 | 复制一份进平台表 | 留在原处，每次请求直达 |
| 数据新鲜度 | 取决于同步周期 / 触发时机 | 就是对方此刻的数据 |
| 写回 | 再配一条反向同步或流程节点 | 同一个 `editData`，直接写对方 |
| 表单 / 权限 / 日志 | 作用在副本上 | 作用在同一条管线上，与 JPA 实体一致 |
| 查询能力 | 副本在自己库里，SQL 全能 | 退化到对方 API 能做的程度 |
| 事务 | 副本内有事务 | 跨 HTTP 无事务 |

后两行是我们付的代价，§五 末尾会逐条展开。前四行是我们换来的：**一个模型只有一份数据，一条管线。**

## 三、可数的事实

| 项 | 数字 | 来源 |
|---|---|---|
| `erupt-data` 下注册的数据处理器 | 14 个（JPA 为默认） | `DataProcessorManager.register(...)` 的调用点 |
| 其中 SaaS 表类连接器 | 3 个：飞书多维表格、钉钉多维表、Airtable | `xyz.erupt.core.service.EruptRestTableDataService` 的子类 |
| 一个数据源要实现的方法 | 6 个必选 + 3 个默认 | `xyz.erupt.core.service.IEruptDataService` |
| `EruptHttpAdapter` 钩子 | 8 个，全部有默认实现 | `url / request / query / body / list / total / item / error` |
| 内置分页约定 | 3 种 | `EruptHttp.Paging`：`PAGE_SIZE` / `PAGE_PER_PAGE` / `OFFSET_LIMIT` |
| LOCAL 模式单表拉取上限 | 5000 行，超出截断并告警 | `EruptRestTableDataService.MAX_FETCH` |
| 内存求值支持的条件表达式 | 13 种（EQ、LIKE、RANGE、IN、NULL …） | `EruptBeanDataService.match` |

"换引擎"之所以成立，是因为引擎的接口足够窄：`IEruptDataService` 只问六件事——按主键取、分页查、按列查、增、改、删。框架里所有读写都从 `DataProcessorManager.getEruptDataProcessor(clazz)` 拿到这个接口，不知道也不关心背后是什么。

## 四、管线不动，只换最后一跳

看一次新增在 `xyz.erupt.core.service.EruptModifyService#insertEruptData` 里走过的路：

```java
R<Void> validation = EruptUtil.validateEruptValue(eruptModel, data);
if (!validation.isSuccess()) {
    throw new EruptApiErrorTip(validation.getMessage(), R.PromptWay.MESSAGE);
}
Object obj = this.eruptInsertDataProcess(eruptModel, data);
eruptTreeLevelService.verify(eruptModel, obj, true);
DataProxyInvoke.invoke(eruptModel, (dataProxy -> dataProxy.beforeAdd(obj)));
DataProcessorManager.getEruptDataProcessor(eruptModel.getClazz()).addData(eruptModel, obj);
DataProxyInvoke.invoke(eruptModel, (dataProxy -> dataProxy.afterAdd(obj)));
applicationEventPublisher.publishEvent(new EruptAddEvent<>(eruptModel.getClazz(), obj));
```

校验、树层级上限（这两周刚加的 `@Tree(maxLevel)`）、`DataProxy.beforeAdd`、事件、操作日志——七步里只有第五步跟存储有关。把 `@EruptDataProcessor("HTTP")` 挂上去，变的只有这一行落到了哪里。你写给 JPA 实体的 `DataProxy<T>`、`@Power`、`PowerHandler`，原样作用在一张钉钉多维表上。

SaaS 表这一侧，三个连接器共用 `EruptRestTableDataService<A extends Annotation>`。它负责 HTTP 传输、把单元格值拍平成 Java 标量（富文本、人员、附件取 `text` / `name` / `url` 拼成字符串，多选保留为 List），以及把模型编码回 `fields`。于是一个具体连接器只剩三件事：端点、鉴权头、信封格式。绑定注解里**只放非机密标识**：

```java
@Erupt(name = "Price List", primaryKeyCol = "id")
@EruptDingTalk(baseId = "Xxxxxxxx", sheet = "Prices")
@EruptDataProcessor(EruptDingTalkDataService.DATA_PROCESSOR)
public class PriceItem { /* id, sku, price ... */ }
```

`clientId` / `clientSecret` 走 `erupt.dingtalk.*` 配置（`xyz.erupt.dingtalk.prop.EruptDingTalkProperties`），源码里没有放凭据的位置——不是约定，是注解上根本没有这个属性。

:::tip 反直觉的一点
`EruptBeanDataService#toModel` 会把远端返回的 Map 行**物化成模型实例**，再交给编辑、钻取、详情。理由写在注释里：下游的 `BeanUtils.copyProperties`、`dataTarget` 都是对模型字段做反射的。换句话说，**是 Erupt 适配远端，而不是让管线适配 Map**——管线只认识一种东西：你的 `@Erupt` 类。
:::

## 五、REST 接口：把差异收进 8 个钩子

飞书、钉钉、Airtable 的 API 形状是已知的，可以写死。真正难的是"别人家的 REST"：分页叫 `offset/limit` 还是 `page/per_page`，列表在 `data.items` 还是 `result.list`，鉴权是 Bearer 还是 HMAC 签名。

`@EruptHttp` 把能用声明表达的收成属性，把不能的收进 `xyz.erupt.http.EruptHttpAdapter`：

```java
package com.example.crm;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import xyz.erupt.annotation.config.QueryExpression;
import xyz.erupt.annotation.query.Condition;
import xyz.erupt.core.view.EruptModel;
import xyz.erupt.core.view.Page;
import xyz.erupt.http.EruptHttpAdapter;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.http.HttpRequest;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

// @Component: taken from the Spring context, so it can hold injected config
@Component
public class CrmAdapter implements EruptHttpAdapter {

    @Value("${crm.api.secret}")
    private String secret;

    @Override
    public void request(HttpRequest.Builder request, EruptModel model) {
        String ts = String.valueOf(System.currentTimeMillis());
        request.header("X-Timestamp", ts).header("X-Signature", hmac(ts));
    }

    @Override
    public void query(Map<String, String> params, Page page, List<Condition> conditions, EruptModel model) {
        EruptHttpAdapter.super.query(params, page, conditions, model);
        for (Condition c : conditions) {
            // The CRM understands name_like; push LIKE down instead of dropping it
            if (QueryExpression.LIKE == c.getExpression()) params.put(c.getKey() + "_like", String.valueOf(c.getValue()));
        }
    }

    private String hmac(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
```

模型上只剩声明：

```java
@Erupt(name = "CRM Customer", primaryKeyCol = "id")
@EruptHttp(value = "${crm.api.base}/customers",
        queryMode = EruptHttp.QueryMode.REMOTE, paging = EruptHttp.Paging.OFFSET_LIMIT,
        listPath = "data.items", totalPath = "meta.count", itemPath = "data",
        editMethod = EruptHttp.EditMethod.PATCH, adapter = CrmAdapter.class)
@EruptDataProcessor(EruptHttpDataService.DATA_PROCESSOR)
public class CrmCustomer { /* id, name, level ... */ }
```

`value` 与 `headers` 是模板，由 `xyz.erupt.http.HttpTemplate` 在**每次请求时**解析：`${...}` 读 Spring 配置，让密钥留在配置中心；`#{...}` 是绑定当前 `MetaUser` 的表达式，用于按租户拼 URL 这类简单场景。凡是带逻辑的——签名、刷新 token、改写错误信息——都应该进 Adapter：它是一个普通 Spring Bean，能注入、能单测、能打断点。

钩子的顺序就是一次请求的顺序：`url → request → query → (send) → list / total / item → error`。每个都有默认实现，所以一个"标准 REST"接口一个钩子都不用写，一个"奇怪的"接口只改它奇怪的那一处。

### 代价：查询语义会退化，我们把它写在明处

存储引擎范式不是免费的。下面四条都能在源码里对上：

1. **LOCAL 模式有天花板。** SaaS 表连接器整表拉取（游标翻页）后在内存里过滤、排序、分页，上限 `MAX_FETCH = 5000`，超出截断并打 `warn`。它适合配置、字典、名单量级，不适合流水。
2. **REMOTE 模式只默认下推等值条件。** `EruptHttpAdapter#query` 的默认实现只处理 `EQ`；LIKE、RANGE 要你在 Adapter 里翻译成对方认识的参数，否则不会生效。上面 `CrmAdapter` 的 `name_like` 就是为此写的。
3. **`DataProxy.beforeFetch` 返回的条件字符串，在非 JPA 源上只认 `字段 = 值`。** `EruptBeanDataService#parseConditionString` 只解析等值片段，`in (...)`、`or` 之类的 HQL 片段会被忽略。**如果你靠 beforeFetch 做行级数据隔离，换到远端数据源前必须改写成等值条件，或在 Adapter / 远端接口里实现隔离。**
4. **没有跨 HTTP 的事务。** `insertEruptData` 上的 `@Transactional` 只管得住本地库；远端写成功后 `afterAdd` 抛异常，远端那条不会回滚。需要补偿就在 `afterAdd` 里自己做。

:::warning 第 3 条值得单独圈出来
它不报错。行级过滤条件被忽略时，列表照样返回——只是多了不该看到的行。这是存储引擎范式在安全上最需要警惕的一处：把一个带 `beforeFetch` 的模型从 JPA 换到远端源之前，先把它的过滤条件逐条过一遍。
:::

集成范式没有这四条，因为副本就在自己库里，SQL 全能。这是一笔明确的交换：**我们用"单一数据源"换"查询能力的上限"。** 对于 5000 行以内、由别的系统或运营同学维护的数据，我们认为这笔交换是划算的；超过这个量级，答案是让对方提供 REMOTE 能力，或者老老实实做 ETL。

## 六、跟宜搭 / 明道云 / 简道云 / JeecgBoot 怎么比？

下表依据各平台截至发稿的公开文档，比较的是**"把一份外部数据纳入后台管理"**这件事的典型做法；具体能力以对方最新版本为准。

| 维度 | 宜搭（连接器） | 明道云（API 集成） | 简道云（数据集成） | JeecgBoot（API 数据集） | Erupt |
|---|---|---|---|---|---|
| 外部数据落在哪 | 由流程写入宜搭表单 | 由工作流写入工作表 | 同步 / 抽取进简道云表单 | 报表、大屏直接读接口 | 不落地，模型直连 |
| 能否在后台直接改并写回 | 需再配写回流程 | 需再配写回流程 | 依同步方向配置 | 一般只读展示 | 是，走 `editData` |
| 表单校验 / 钩子是否同一套 | 作用在副本 | 作用在副本 | 作用在副本 | 报表不涉及 | 同一条管线，`DataProxy<T>` 原样生效 |
| 适配代码写在哪 | 平台内配置 | 平台内配置 | 平台内配置 | 平台内配置 | 一个 Java 类，`EruptHttpAdapter` |
| 凭据存放 | 平台连接器配置 | 平台集成配置 | 平台配置 | 平台配置 | Spring 配置（`erupt.dingtalk.*` / `${...}`） |
| 大数据量 / 复杂查询 | 副本上 SQL 全能 | 副本上全能 | 副本上全能 | 依接口 | 受限，见 §五「代价」 |

最后一行我们不占优，这是实话。前五行的差别归结为一件事：**集成范式把"外部"变成"内部"，存储引擎范式让"外部"保持外部，只把管理能力伸过去。**

## 七、5 分钟上手

以钉钉多维表为例，加一个依赖（`erupt-spring-boot-starter-all` 已包含）：

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-data-dingtalk</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

```yaml
erupt:
  dingtalk:
    client-id: ${DINGTALK_CLIENT_ID}
    client-secret: ${DINGTALK_CLIENT_SECRET}
    operator-id: ${DINGTALK_OPERATOR_UNION_ID}
```

然后把第四节的 `PriceItem` 挂到菜单上即可。飞书、Airtable、REST 的写法分别见 [erupt-feishu](/zh/modules/erupt-feishu)、[erupt-airtable](/zh/modules/erupt-airtable)、[erupt-http](/zh/modules/erupt-http)；自己写一个数据源见 [自定义数据源](/zh/advanced/custom-datasource)。

如果你还没有一个能跑的 Erupt 工程，从这里开始：

**→ [快速部署 / Quick Start](/guide/quick-start)**

那一页覆盖 Maven 依赖、application.yml、第一个 @Erupt 实体、默认登录账号，以及 Docker / K8S 部署。

跑通之后，回头看 §五「代价」的四条，决定你的数据该用 LOCAL、REMOTE，还是干脆留在 JPA。

## 八、下一期预告

数据换了引擎，视图也在换：同一周主仓里 `@Vis` 加了 `TIMELINE`、`MAP`、`CUBE` 三种视图，`EditType.MAP` 的值从一段字符串变成了带坐标系的 `xyz.erupt.annotation.model.Location`（GCJ02 / BD09 / WGS84）。下一期我们聊：**为什么一个后台框架要在乎坐标系**——以及"地图视图"在宜搭、简道云里为什么常常只是一个插件。

---

:::info 参与讨论
本期涉及的源码：`erupt-core` 的 `service/IEruptDataService`、`service/EruptBeanDataService`、`service/EruptRestTableDataService`、`invoke/DataProcessorManager`、`service/EruptModifyService`；`erupt-data/erupt-data-http`（`EruptHttpAdapter`、`HttpTemplate`、`HttpEnvelope`）；`erupt-data/erupt-data-{dingtalk,feishu,airtable}`。

你把哪些"别人家的数据"接进过后台、用的是同步还是直连？欢迎到 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 留贴——尤其想听「代价」第 3 条在你那里有没有踩过。
:::
