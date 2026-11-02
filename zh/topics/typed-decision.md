---
title: "NOUL × CHOICE × SCORE：AI 判断的阈值应该写在代码里"
description: "工作流里的 AI 节点吐出一段文本，下游再用条件分支去猜它的意思。erupt-ai-decision 换了一条路：问题带类型，答案是概率，阈值留在你的 if 语句里。这一期讲清楚为什么判断和决定必须拆开。"
outline: deep
---

# 第 15 期 · 让 AI 判断回到 if 语句里

> 国内低代码平台给工作流加 AI，最常见的形态是一个"大模型节点"：输入提示词，输出一段文本，下游条件分支再对这段文本做字符串匹配。erupt-ai-decision 这两周进了主仓，它不产出文本，只回答三种类型化的问题——是 / 否、多选一、有序打分——每个答案都带一个概率分布。我们的判断是：**模型负责"有多像"，代码负责"算不算"，阈值永远不该交给模型。**
>
> 发布于 2026-10-01 · 阅读 ~10 min

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

后台系统里大部分 AI 需求，拆到最后都不是"生成"，而是"判断"：这张工单急不急、该派给哪个组、客户有多生气、这条退款申请要不要人工复核。

判断的下游是一条 `if`。而大模型天生的输出是一段话。两者之间的那层胶水——提示词里写"只回答是或否"、拿回结果后 `contains("是")`、再兜底处理"是的，但是……"——就是今天大多数 AI 工作流里最脆弱的一环。

第 01 期写了 erupt-ai 的 Harness：50+ 模型、A2A、Memory，回答的是"怎么让 Agent 跑起来"。这一期的 erupt-ai-decision 回答的是另一个问题：**当业务代码只需要一个能分支的值时，为什么还要经过一段文本？**

它在 `2ee84e8eb Add erupt-ai-decision: typed judgements a program can branch on` 里进入主仓，随后 `a95daf280` 加入了可本地部署的 Laya。整个模块不依赖 erupt-ai，只依赖 erupt-data-jpa。

## 二、两种范式：文本节点 vs 类型化判断

| | 文本节点范式 | 类型化判断范式（erupt-ai-decision） |
|---|---|---|
| 你提交给模型的 | 一段提示词，里面夹着"请只输出 A/B/C" | 一个状态 + 若干带类型的问题 |
| 模型返回的 | 一段文本（或一段你希望它合法的 JSON） | `{ "noul": 0.93 }`、`{ "choice": "BILLING", "probabilities": {...} }` |
| 阈值在哪 | 隐含在模型"觉得是"的那一刻 | 写在调用方代码里：`yes(0.9)`、`above(0.8)` |
| 不确定时 | 模型照样给一个答案，你看不出它在犹豫 | 置信度低 → `Optional.empty()` → 转人工 |
| 改判断标准 | 改提示词，祈祷解析逻辑还能用 | 改问题的 criteria，答案结构不变 |

关键区别在第三行。文本范式里，"0.51 的把握"和"0.99 的把握"都会被模型压成同一个"是"，信息在模型内部就丢了。类型化范式把这一刀留给调用方：同一个 `URGENT` 问题，客服派单可以用 `0.6`，自动退款必须 `0.95`——**阈值是业务风险的函数，不是模型能力的函数。**

## 三、可数的事实

| 项 | 数字 | 来源 |
|---|---|---|
| 基本问题类型 | 3 种：`NOUL` / `CHOICE` / `SCORE` | `xyz.erupt.decision.constant.PrimitiveType` |
| CHOICE 选项上限 | 255 | `DecisionConst.MAX_CHOICE_OPTIONS` |
| SCORE 等级数 | 2 ~ 10 | `DecisionConst.MIN_SCORE_LEVELS` / `MAX_SCORE_LEVELS` |
| 内置服务商 | 2 个：TypeSafe Jev（托管）、Laya（本地开源） | `xyz.erupt.decision.core.Jev` / `Laya` |
| 线协议 | 1 个 POST：`{api}/v1/systemone` | `HttpDecisionCore.PATH` |
| 自动重试的状态码 | 429、529 | `HttpDecisionCore.RETRYABLE` |
| 入口 | 3 个：Java API、后台定义的决策、HTTP 接口 | `Decisions` / `DecisionDef` / `DecisionController` |
| 新增表 | 3 张：`e_ai_decision_def` / `_model` / `_question` | 模块 `model/` 包 |

三种问题类型是刻意的小。凡是"判断"，最后都能落到这三种形状之一：真假、分类、程度。再多一种，调用方就要多学一种答案的读法。

## 四、答案是类型，不是字符串

`Question<A extends Answer>` 用泛型把"问题"和"答案类型"绑死。问一个 `Choice<Dept>`，拿回的是 `ChoiceAnswer<Dept>`，里面的 `value()` 就是枚举常量——业务代码里永远不会出现一个裸的 `"BILLING"` 字符串。

```java
package com.example.ticket;

import xyz.erupt.decision.Decision;
import xyz.erupt.decision.Decisions;
import xyz.erupt.decision.question.Choice;
import xyz.erupt.decision.question.Criteria;
import xyz.erupt.decision.question.Noul;
import xyz.erupt.decision.question.Score;

public class TicketTriage {

    enum Dept implements Criteria {
        BILLING("Invoices, refunds, payment failures"),
        TECH("Bugs, errors, integration problems"),
        SALES("Pricing, upgrades, new licenses");

        private final String criteria;

        Dept(String criteria) { this.criteria = criteria; }

        @Override
        public String criteria() { return criteria; }
    }

    // Questions are immutable values: declare once, reuse everywhere
    static final Noul URGENT = Noul.of("Does this convey urgency?");
    static final Choice<Dept> DEPT = Choice.of("Which team should handle this?", Dept.class);
    static final Score MOOD = Score.of("How frustrated is the customer?", "Calm", "Frustrated", "Very angry");

    public void triage(Ticket ticket) {
        // One round trip, one charge: the state is read once and every question answered against it
        Decision d = Decisions.of(ticket).ask(URGENT, DEPT, MOOD);
        if (d.get(URGENT).yes(0.9)) escalate(ticket);
        d.get(DEPT).above(0.8).ifPresentOrElse(dept -> route(ticket, dept), () -> queueForHuman(ticket));
        if (d.get(MOOD).value() > 1.5) notifyLead(ticket);
    }
}
```

这里有三处设计值得停一下：

1. **`d.get(DEPT)` 的返回类型是编译期确定的**。`Decision` 内部用一个 `IdentityHashMap<Question<?>, String>` 记住"哪个问题对象对应哪个答案 id"，`get(Question<A>)` 直接返回 `A`。你不可能把 `MOOD` 的答案当成 `NoulAnswer` 去读——编译器不让。
2. **`Answer` 是 `sealed interface`**，只 `permits NoulAnswer, ChoiceAnswer, ScoreAnswer`。下游如果要 `switch` 所有答案类型，不存在第四种漏网之鱼。
3. **枚举实现 `xyz.erupt.decision.question.Criteria`**，每个常量自己带一句"何时适用"。`Choice.of(..., Dept.class)` 会把 `criteria()` 而不是常量名发给模型——模型读的是规则，代码读的是常量。

:::tip 反直觉的一点
`NoulAnswer` 没有独立的置信度字段。源码里它的 `confidence()` 是 `Math.abs(value - 0.5) * 2`：离硬币正反面越远，越有把握。**一个是 / 否问题的"答案"和"把握"本来就是同一个数**，再让模型额外报一个 confidence 只会多一个可以不一致的地方。
:::

## 五、"不确定"是一等公民

文本范式最大的问题不是答错，而是**答错时看起来和答对一模一样**。

erupt-ai-decision 把"不确定"做成了返回值的一部分。`ChoiceAnswer` 与 `ScoreAnswer` 都有：

```java
public Optional<T> above(double minConfidence) {
    return this.confident(minConfidence) ? Optional.of(value) : Optional.empty();
}
```

`Optional.empty()` 不是异常，是一条正常分支——它的语义就是"转人工"。于是一段派单逻辑天然分成三段：高把握自动处理、低把握排队、中间带由阈值决定。这和你在风控、反作弊里写了十年的打分卡逻辑是同一种形状，只是分数现在来自一个模型。

`ScoreAnswer` 还多做了一步：它不四舍五入。`value()` 是概率加权后的位置，`1.05` 在"平静 / 不满 / 愤怒"三档上读作"不满，带一点火气"。想要整数就调 `level()`，想要标签就调 `label()`——取整这个动作，同样交还给调用方。

**后台定义的决策**把同样的类型系统搬到了数据行上。`xyz.erupt.decision.model.DecisionDef` 是一个普通的 `@Erupt` 实体，问题列表是 `TAB_TABLE_ADD` 子表；`DecisionQuestion` 按 `type` 用 `@Dynamic` 切换编辑组件——CHOICE 显示键值列表，SCORE 显示有序标签，NOUL 显示两行"是 / 否的含义"。保存时 `DecisionDefDataProxy` 会把每一行用 `Question.of(type, instructions, criteria)` 真正构造一遍：criteria 不合法，保存就失败，而不是等到生产环境被服务商 422 打回来。

```java
Decision d = Decisions.run("ticket_triage", ticket);
boolean refund = d.noul("refund_requested").yes(0.85);
String dept = d.choice("dept").value();   // stored definitions answer with the option key
```

代码、工作流、外部服务（经 `POST /erupt-api/decision/{code}`）调的是同一条定义。改判断标准是运营在后台改一行，不是研发发一个版本；而服务商 API Key 始终只在服务器端。

## 六、跟宜搭 / 简道云 / JeecgBoot / Dify 怎么比？

下表对比的是各平台在**"让 AI 做一个可分支的判断"**这件事上的典型做法，依据为各家截至发稿的公开文档；具体能力以对方最新版本为准。

| 维度 | 宜搭 / 简道云 / 明道云（工作流 AI 节点） | JeecgBoot（AI 流程编排） | Dify（问题分类器节点） | Erupt（erupt-ai-decision） |
|---|---|---|---|---|
| 输出形态 | 文本字段，下游条件节点按文本匹配 | LLM 节点文本 / JSON 输出 | 选中一个分类，走对应分支 | 类型化答案：概率 / 赢家 + 分布 / 加权位置 |
| 是否给出概率 | 否 | 否 | 否，只给分类结果 | 是，每个选项都有概率 |
| 阈值归属 | 模型内部隐式决定 | 模型内部隐式决定 | 模型内部隐式决定 | 调用方代码：`yes(0.9)` / `above(0.8)` |
| "拿不准"怎么表达 | 无专门通道 | 无专门通道 | 无专门通道 | `Optional.empty()`，一条正常分支 |
| 在业务代码里的形态 | 平台内节点，难以被 Java 代码直接调用 | 流程内节点 | 外部 API，返回 JSON | `Decisions.of(x).ask(Q)`，返回 Java 类型 |
| 本地化部署 | 依平台方案 | 可接本地模型 | 可接本地模型 | Laya sidecar，Apache 2.0，GPU 单题约 35 ms |

LangChain4j 的结构化输出（让 `AiServices` 返回一个 POJO 或枚举）离我们最近——erupt-ai 本身就跑在 LangChain4j 上。区别仍在第二、三行：结构化输出保证了**形状**，但没有给出**分布**；一个枚举返回值告诉你模型选了 `TECH`，不告诉你 `BILLING` 只差 0.02。

:::info 什么时候不该用它
需要生成文本（回复草稿、摘要、SQL）时，请用 erupt-ai 的对话与 Agent。erupt-ai-decision 只回答三种问题；它的价值恰恰在于不能做别的。
:::

## 七、5 分钟上手

模块本身只有一个依赖，`erupt-spring-boot-starter-all` 已经包含它：

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-ai-decision</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

启动后进入 **AI 决策 → 决策模型** 新建一条连接：用托管的 Jev 就填 API Key；想完全离线，按 [erupt-ai-decision 模块文档](/zh/modules/erupt-ai-decision#本地部署-laya) 起一个 Laya sidecar，API 域名填 `http://127.0.0.1:8000`，Key 留空。表单里的 **连接测试** 会发一个最便宜的 NOUL 问题验证连通。

如果你还没有一个能跑的 Erupt 工程，从这里开始：

**→ [快速部署 / Quick Start](/guide/quick-start)**

那一页覆盖 Maven 依赖、application.yml、第一个 @Erupt 实体、默认登录账号，以及 Docker / K8S 部署。

跑通之后，把 §四 的 `TicketTriage` 粘进去，换成你自己的实体当 state——对象会以结构化 JSON 交给模型，比拼字符串更准。

## 八、下一期预告

这一期讲的是"把 AI 的输出收窄成一个能分支的值"。同一周主仓里还有一个方向相反的改动：`erupt-data-http` 加了 `EruptHttpAdapter` 生命周期钩子和 `listPath` / `totalPath` 信封解包，把任意一个 REST 接口"放宽"成一张能增删改查的 `@Erupt` 表。下一期我们聊：**当数据不在你的数据库里，后台框架应该把多少适配逻辑留给你**——以及宜搭"连接器"、明道云"API 集成"为什么走了另一条路。

---

:::info 参与讨论
本期涉及的源码：`erupt-ai/erupt-ai-decision/`（`Decisions`、`Decision`、`question/`、`answer/`、`core/DecisionCore`、`core/HttpDecisionCore`、`model/DecisionDef`、`model/DecisionQuestion`），Laya sidecar 在同目录的 `laya/`。

如果你在业务里已经有"AI 判断 + 人工兜底"的流程，欢迎到 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 分享你的阈值是怎么定的——我们想收集几组真实的校准数据。
:::
