---
title: "@Edit × EruptValueValidator × choice-validate：表单上声明的限制，凭什么只对浏览器生效"
description: "你在 @Edit 上写的 min、max、length、选项，API 调用会遵守吗？本期拆 EruptValueValidator：同一份注解被页面和服务端各读一次，覆盖 8 类组件、5 个写入入口，以及它仍然不查的地方。"
outline: deep
---

# 第 19 期 · 声明一次，到处生效

> 低代码平台里，「字段规则」多半是设计器里的一项 UI 配置：浏览器拦得住，直接调写入接口就未必。Erupt 的 `@Edit` 是 Java 注解，页面和服务端读的是**同一份**——`EruptValueValidator` 把表单声明的选项、长度、数值范围、日期边界在写入管线里再执行一遍，连 Excel 导入、单元格编辑、子表行、erupt-cloud 节点转发都不放过。
>
> _发布于 2026-10-15 · 阅读 ~10 min_

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

先做一个小实验。给一个状态字段声明三个选项（草稿 / 已发布 / 已归档），再把 `status` 以 `"9"` 直接 POST 给写入接口。页面上你永远选不出 `9`，但接口并不经过页面。

两周前，主仓里这件事的答案是：**写进去了**。选项下拉只存在于前端，服务端不知道 `9` 不合法。`@Edit(notNull = true)`、正则、XSS 这些早就有服务端校验，但「值是否在选项里」「数字是否超界」「评分是不是 0.5 的倍数」没有。

本文的反向命题是：

> **`@Edit` 是契约，不是皮肤。** 表单上声明过的限制，必须由服务端在写入时自己再读一遍——因为 API 调用、Excel 导入、脚本、另一个系统，都不会经过那张表单。

## 二、两种做法：校验属于界面，还是属于模型

| 维度 | 校验属于界面（常见做法） | 校验属于模型（`EruptValueValidator`） |
|---|---|---|
| 规则存在哪 | 设计器里的字段配置，前端渲染时执行 | `@Edit` 注解，服务端运行时反射读取 |
| 绕过页面直接调接口 | 取决于平台是否在服务端复核 | 同一份注解再执行一遍，拒绝并指明字段与值 |
| 规则写几遍 | 页面一遍，接口文档里再约定一遍 | **一遍**；页面和服务端都从它读 |
| 批量入口（导入） | 通常另有一套规则 | Excel 导入逐行走同一个校验方法 |
| 代价 | 低 | 每次写入多做一次反射 + 选项查询（见 §四 的缓存） |

我们并不认为前端校验没用——它负责即时反馈。我们认为的是：**服务端校验不能依赖前端校验存在**。

## 三、可数的事实：8 类组件、5 个入口

`xyz.erupt.core.util.EruptValueValidator`（`erupt-core`，一个类约 300 行）只检查它能确定含义的组件：

```java
private static final Set<EditType> CHECKED = EnumSet.of(EditType.CHOICE, EditType.MULTI_CHOICE, EditType.INPUT,
        EditType.NUMBER, EditType.SLIDER, EditType.RATE, EditType.TAGS, EditType.DATE);
```

共 **8 类**，外加 `TAB_TABLE_ADD`（子表）逐行递归。它被 **5 个入口**调用：

- `EruptModifyService` 的新增、编辑、单元格编辑，共 3 处；
- `xyz.erupt.excel.controller.EruptExcelController` 的导入，逐行调用，错误信息带行号；
- `xyz.erupt.core.util.RemoteRequestValidator`：erupt-cloud 的父节点在把写入转发给远程节点**之前**，用同一个方法按节点上报的 `edit` JSON 先验一遍。

每类组件检查什么，全部来自注解里已有的属性，没有新增任何配置项：

| 组件 | 检查的声明 |
|---|---|
| `CHOICE` / `MULTI_CHOICE` | 值必须在选项内：`vl`、枚举、`ChoiceFetchHandler` 返回的，已 `disable` 的不算 |
| `INPUT` | `inputType.length` |
| `NUMBER` | `numberType.min` / `max`，**仅当声明过** |
| `SLIDER` | `sliderType.min` / `max` |
| `RATE` | 0 ~ `count`；只有 `allowHalf` 时才允许 0.5 的步长 |
| `TAGS` | `maxTagCount`；`allowExtension = false` 时每个标签必须在 `tags` 或 `fetchHandler` 里 |
| `DATE` | `pickerMode` 为 `FUTURE` / `HISTORY`，以及 `min` / `max`（仅日期与日期时间） |
| `TAB_TABLE_ADD` | 每一行按子模型的规则走：必填、正则、XSS、`DataProxy#validate`，再加上以上各项 |

最后一行是这次提交（#426）才补上的：**此前子表行完全没有校验**。

## 四、四个细节：让「严格」不变成「难用」

严格的服务端校验最容易做成一个没人敢升级的版本。源码里有四处专门留了余地。

**1. 数字只校验声明过的边界。** `NumberType` 的 `min` / `max` 默认是 `int` 的上下界，一个 `Long` 列合法地会超出它。所以：

```java
case NUMBER -> {
    // the declared defaults are the int range, which a long column may rightly exceed: bound only what was set
    NumberType type = edit.numberType();
    Long min = type.min() == -Integer.MAX_VALUE ? null : type.min();
    Long max = type.max() == Integer.MAX_VALUE ? null : type.max();
    for (String one : submitted) range(edit, one, null == min ? null : BigDecimal.valueOf(min), null == max ? null : BigDecimal.valueOf(max));
}
```

**2. 没变的值直接放行。** 第一行就是 `submitted.removeAll(stored)`：编辑时与库里已存的值相同的，不检查。规则收紧之前存下的旧数据（下线的选项、调低的上限），不会让你改不了这条记录的其他字段。

**3. 选项一次请求只取一次。** `options(...)` 把结果放进 `MetaContext.getVars()`，key 是「模型 | 字段 | 联动字段值」；请求结束就没了，没有跨请求缓存。联动下拉（`dependField`）则带着整张表单去问 `EruptUtil.getChoiceListFilter`——和页面请求选项时调用的是同一个方法。

**4. 只看提交了的字段，只看有把握的类型。** 单元格编辑只带一个字段，就只检查这一个；`MULTI_FORM` 的块列表、引用对象等不在 `CHECKED` 里，原样放过；一个 `CHOICE` 若没声明任何选项（没有 `vl`、没有 handler、也不是枚举），同样无从校验，直接跳过。

:::tip 反直觉的一点
选项校验会拒绝 `disable = true` 的选项——「页面上选不了」就等于「接口也写不了」。但**已经存着**这个值的旧记录，编辑别的字段时不受影响（细节 2）。所以关掉一个选项是安全的：它只管新写入，不追溯旧数据。
:::

## 五、开关与逃生口

选项校验有两层开关，范围校验没有：

```yaml
erupt:
  choice-validate: false   # 全局关闭；默认 true（xyz.erupt.core.prop.EruptProp#choiceValidate）
```

```java
@EruptField(
        edit = @Edit(title = "来源", type = EditType.CHOICE,
                choiceType = @ChoiceType(
                        fetchHandler = SourceFetchHandler.class,
                        validate = false)))   // 这个字段合法地存着选项之外的值
private String source;
```

`ChoiceType#validate` 与 `MultiChoiceType#validate` 默认 `true`。长度、数值、评分、日期边界则**始终执行**——那是你声明过的东西，没有「关掉你自己的声明」这个需求。

:::warning 升级时会遇到的
`erupt.choice-validate` 默认开启（#421），这是一次行为变化：此前靠接口写入、值不在选项里的数据，升级后会被拒绝。排查办法是看报错——格式固定为 `字段标题 + 不在可选范围内 → 具体值`；确实需要的字段用 `validate = false` 单独放行，而不是全局关闭。
:::

## 六、跟宜搭 / 简道云 / 明道云怎么比？

我们没有逐项实测这些平台。下表左列是**选型时值得拿一个非法值去验证的问题**，而不是对它们的结论；各平台的行为以官方文档与实测为准。

| 维度 | 国内对位平台：选型时该问 | Erupt |
|---|---|---|
| 选项外的值走开放 API 写入 | 宜搭、简道云、明道云各自的写入接口是否复核选项？试一次便知 | 默认拒绝；`erupt.choice-validate` 可全局关，`validate = false` 可按字段关 |
| 数值 / 日期范围经接口写入 | 字段上配的范围，接口是否同样生效？ | `NUMBER` / `SLIDER` / `RATE` / `DATE` 始终校验，报错带字段名与值 |
| 子表 / 明细行 | 明细行里的字段规则，批量写入时是否逐行执行？ | `TAB_TABLE_ADD` 每行走子模型全套规则，错误前缀 `标题 #行号` |
| Excel 导入 | 导入是否与手工录入同一套规则？ | 同一个方法，错误带行号 |
| 规则存放 | 设计器配置，随应用保存 | Java 注解，随代码评审、随 Git 版本 |
| 历史数据 | 规则收紧后旧数据的处理方式因平台而异 | 未改动的值放行，只拦新写入 |

## 七、5 分钟上手

从空项目到能访问的 admin 页面，完整流程已经独立成一篇：

**→ [快速部署 / Quick Start](/guide/quick-start)**

跑通之后，对任意一个带 `CHOICE` 或 `NUMBER` 的模型，直接对写入接口提交一个非法值，看返回的提示是否是 `字段标题 + 超出允许范围 → 值`。然后回头读本文 §三 的表，核对你的模型里哪些组件**不在**这 8 类里。

## 八、下一期预告

同一批提交里还有一个往外走的改动：`erupt-webhook`——订阅 `EruptAddEvent` / `EruptEditEvent` / `EruptDeleteEvent`，在事务提交**之后**，用 HMAC-SHA256 签名把数据变更 POST 给别人。下一期我们聊：**为什么「数据变了通知外部」不该写在 `DataProxy#afterAdd` 里**——以及投递失败最多 3 次的尝试，为什么发生在请求线程之外。

---

:::info 参与讨论
本期涉及的源码：`erupt-core/.../util/EruptValueValidator.java`、`erupt-core/.../service/EruptModifyService.java`（三处调用点）、`erupt-core/.../util/RemoteRequestValidator.java`、`erupt-core/.../prop/EruptProp.java`，以及 `erupt-annotation/.../sub_field/sub_edit/ChoiceType.java`。

时间类选择器（时间 / 月 / 周 / 季 / 年）目前不校验边界，是否要补，欢迎到 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 投一票。
:::
