---
title: "单元格编辑为什么走整行管线"
description: 后台表格越做越像多维表格，双击就地改一个字段。但"改一个字段"意味着一条绕过整行表单的写入路径——绕过校验、绕过 DataProxy、绕过只读。Erupt 押反向：单元格编辑不配拥有自己的路径，它把整行捞出来打上补丁，再走一遍完整的编辑管线。
outline: deep
---

# 第 10 期 · 单元格编辑为什么走整行管线

> 这两年后台表格集体向多维表格靠拢：双击单元格、就地改一个字段、回车保存。体验确实好，但它在服务端悄悄开了一条新口子——**一条只带一个字段的写入路径**。跨字段的规则没人跑，`DataProxy` 没人叫，`@Readonly` 形同虚设。
> 这一期讲 Erupt 2.2.0 的 `cellEdit`：我们的结论是**单元格编辑不该有自己的写入路径**。它把整行从库里捞出来、在 JSON 上打一个补丁、再原样走一遍编辑管线——单字段只是入参形状，不是一种新语义。
>
> _发布于 2026-09-16 · 阅读 ~10 min_

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

先说我们是怎么被推着做这个功能的。

用户的原话通常是："能不能像**简道云**那样，表格里直接改？每次改个状态还要开弹窗太慢了。" 这个诉求完全合理——后台系统里有大量"改一个枚举""补一个备注"的操作，为它开一次完整表单确实重。**明道云**、**钉钉宜搭**的在线表格、**JeecgBoot** 的 online 表单都提供了行内编辑，它已经是国内后台的标配预期。

问题出在实现的第一个岔路口上。绝大多数做法是这样的：

```
PATCH /api/{table}/{id}   body: { "status": "PUBLISHED" }
```

一条只带被改字段的接口。它看起来是最自然的设计——改了什么就传什么。然后在真实项目上，它会依次撞上四件事：

1. **跨字段规则跑不了**。"状态改成已发布时，正文不能为空"——单独看 `status` 没错，单独看 `content` 也没错，只有这一对才错。接口手里只有 `status`，它根本没有判断的材料。
2. **`DataProxy` / 拦截器收不到完整实体**。你写的 `beforeUpdate(model)` 拿到的 `model` 里只有一个字段有值，其余全是 `null`——于是要么误判，要么你被迫在每个钩子里写"这个字段是 null 到底是没传还是要清空"。
3. **只读形同虚设**。表单上灰掉的字段，在表格里是一个普通的列。前端不给编辑图标就算"控制住了"——直到有人手写一个 `curl`。
4. **回显值被写回**。`afterFetch` 里把金额格式化成 `¥1,200.00`、把手机号打成 `138****0000` 用于展示，而行内编辑器的初始值正是从这一行读的。用户没改这个字段、直接保存另一个字段？没事。**但只要他点了这一格，`138****0000` 就会作为真值提交回去。**

第 4 条尤其阴——它不报错，它把星号存进了数据库。

本文的反向命题是：

> **单元格编辑不是一种新的写入语义，它只是一种新的入参形状。凡是给它开一条独立写入路径的实现，都要在这条路径上把表单已经做过的事重做一遍——而重做就意味着漏做。**

## 二、两种做法：补丁式 vs 整行重放

把上面那四件事摊平，两种范式的差别很清楚：

| | 补丁式（PATCH 单字段） | 整行重放（Erupt `update-cell`） |
|---|---|---|
| 服务端收到的数据 | 只有被改字段 | 被改字段 + **从库里读出的整行** |
| 跨字段校验 | 做不到（缺材料） | 天然可用，与表单完全同一份规则 |
| `DataProxy` 钩子入参 | 残缺实体 | 完整实体 |
| 只读 / 权限 | 通常只在前端拦 | 服务端逐层拒绝 |
| 需要新写的校验逻辑 | 一整套 | **零**——复用 `validateEruptValue` |
| 代价 | 省一次查询 | **多一次按主键的查询** |

Erupt 选了右边，代价写在明处：每次单元格保存多一次 `findDataById`。我们认为这是本世纪最划算的一次查询——它换来的是"这条路径上没有任何一条规则需要被重新实现"。

::: tip 一个反直觉的小结
行内编辑的难点从来不在前端。前端只是一个浮层加一次 `POST`。难点在于：**你刚刚新增的这条写入路径，把过去几年沉淀在"编辑表单"里的所有隐性约束，一次性全部作废了。**
:::

## 三、一次单元格保存要过几道关

`POST /erupt-api/data/modify/{erupt}/update-cell`，入参只有三个字段：

```java
package xyz.erupt.core.view;

/**
 * One cell edit: the row primary key, the field to change and its new value.
 */
@Getter
@Setter
public class EruptCellVo {
    private String id;
    private String field;
    private JsonElement value;
}
```

这三个字段落到服务端，要连过七道关，任何一道不过就是一条带文案的拒绝（`EruptApiErrorTip`，不是 500）：

1. `@Power(edit)` —— 这个模型允不允许改
2. `@Power(cellEdit)` —— 这个模型允不允许**在表格里**改
3. 字段存在且 `@Edit(title)` 非空 —— 不是编辑面上的字段，一律不认
4. `@Edit(cellEdit)` —— 这个字段允不允许在表格里改
5. `@Edit(readonly.edit)` —— 表单里就是只读的，表格里更不行
6. `verifyIdPermissions` —— 行级权限：这一行你**查得到**吗？查不到就改不了
7. 整行校验 + `DataProxy#validate`

第 6 条值得单独说一句。它不是比对某个 owner 字段，而是**用当前用户的查询条件把这一行再查一次**：

```java
public void verifyIdPermissions(EruptModel eruptModel, String id) {
    List<Condition> conditions = new ArrayList<>();
    conditions.add(new Condition(eruptModel.getErupt().primaryKeyCol(), id, QueryExpression.EQ));
    Page page = DataProcessorManager.getEruptDataProcessor(eruptModel.getClazz())
            .queryList(eruptModel, new Page(1, 1),
                    EruptQuery.builder().conditions(conditions).build());
    if (page.getList().isEmpty()) {
        throw new EruptNoLegalPowerException();
    }
}
```

—— `xyz.erupt.core.service.EruptService`

这条查询会带上 `@Filter`、`DataProxy#beforeFetch`、多租户条件等全部行级过滤。**看不见即改不了**，规则只有一份，不需要为单元格编辑再写一遍数据权限。

## 四、两级开关，而且都在服务端收口

模型级和字段级各一个 `cellEdit`，两个默认都是 `true`：

```java
// xyz.erupt.annotation.sub_erupt.Power
@Comment("Whether rows may be edited one cell at a time, directly in the table. " +
        "A cell runs the same pipeline as the edit form, so turn it off only for a table " +
        "whose rows should always be changed as a reviewed whole")
boolean cellEdit() default true;
```

```java
// xyz.erupt.annotation.sub_field.Edit
@Comment("Whether this field may be edited directly in the table, when the model allows it. " +
        "A single cell is validated as a whole row, so a cross-field rule needs no help here; " +
        "turn it off for a field the form should still edit but a grid cell should not, " +
        "such as a secret that has no place in an in-table popover")
boolean cellEdit() default true;
```

模型说"这张表可以就地改"，字段说"但我不行"。这个组合解决的是一个之前无解的场景：**某个字段在表单里应该能改，在表格里不应该能改。** 过去唯一的排除手段是 `@Readonly`，但它会把表单里的控件也一起禁掉。

框架自己就是第一批用户。`EruptUser.account`、`LLM.apiDomain`、`RemoteHost.privateKey`、`BiDataSource.connectString` 全部标了 `cellEdit = false`——凭据与连接串不该出现在一个表格浮层里：

```java
// xyz.erupt.remote.model.RemoteHost
@EruptField(
        views = @View(title = "Private Key"),
        edit = @Edit(title = "Private Key", type = EditType.TEXTAREA, cellEdit = false, ...)
)
private String privateKey;
```

关键在最后一句：**两个开关都在写入处再判一次**。控制器先 `powerLegal(eruptModel, PowerObject::isCellEdit)`，服务里再查字段级开关。一个手搓的请求打到一个从没开过单元格编辑的模型上，拿到的是拒绝，而不是一次成功的写入。前端不渲染编辑图标，只是让界面别撒谎，不是权限本身。

## 五、整行重放：把补丁打在库里的那一行上

这是整个设计的核心，源码比任何解释都直白：

```java
// xyz.erupt.core.service.EruptModifyService#updateEruptCell
Object old = DataProcessorManager.getEruptDataProcessor(eruptModel.getClazz())
        .findDataById(eruptModel, TypeUtil.typeStrConvertObject(id, pkField.getType()));

// the stored row patched with the new value is validated as a whole, so a single cell runs
// exactly the rules the edit form runs: every field's own rules, a @Dynamic rule that reads
// another field, and DataProxy#validate against a complete entity
JsonObject merged = GsonFactory.getGson().toJsonTree(old).getAsJsonObject();
merged.add(fieldName, value);
R<Void> validation = EruptUtil.validateEruptValue(eruptModel, merged);
if (!validation.isSuccess()) {
    throw new EruptApiErrorTip(validation.getMessage(), R.PromptWay.MESSAGE);
}
```

`validateEruptValue` 就是行表单提交时调用的那一个方法，**同一个符号，没有单元格专用分支**。于是跨字段规则自动生效。erupt-test 里钉死这件事的用例长这样：

```java
@Component
public class CellEditRowDataProxy implements DataProxy<CellEditRowModel> {

    /**
     * A cross-field rule: neither status nor content is wrong on its own, only the pair is.
     * Reachable from a cell edit only when the whole row is validated.
     */
    @Override
    public void validate(CellEditRowModel model) throws EruptException {
        if ("PUBLISHED".equals(model.getStatus())
                && (null == model.getContent() || model.getContent().isBlank())) {
            throw new EruptException("Published records need content");
        }
    }
}
```

测试单改 `status = PUBLISHED`，断言被拒；补上 `content` 之后，同一个补丁通过。**一个补丁式实现无论如何都过不了这个用例**，因为它手里永远只有 `status`。

写入之后的部分同样是原班人马：`beforeUpdate` / `afterUpdate` 拿到的是完整实体，操作日志按 `oldData -> {改动字段}` 落，`EruptEditEvent` 照常发，`PASSWORD` 字段在日志里照常打码。

### 附带的一次破坏性修正：表格返回原始值

要做行内编辑，有一件事必须先改掉：**表格查询过去返回的是展示文本**——布尔返回 `trueText` / `falseText` 的措辞，选择项返回 label。这对"只读表格"没问题，对"可编辑表格"是致命的：编辑器要拿到的是**值**，不是**措辞**；而且措辞会被 `@EruptI18n` 翻译，把文本反推回值既有歧义（两个选项可能共用 label）又会随界面语言漂移。

2.2.0 起，`/erupt-api/data/table/{erupt}` 原样返回存储值，`convertDataToEruptView` 只保留 `PASSWORD` 打码。Excel 导出在写单元格时自行套用措辞与 label，导出结果不变。

::: warning 升级注意
`@RowOperation(ifExpr)` 与 `@View(template)` 是在浏览器里对着这一行求值的，涉及 BOOLEAN / CHOICE 字段的表达式必须改写：

```
ifExpr = "item.status == '启用'"   ->   "item.status === true"
ifExpr = "item.level == '高'"      ->   "item.level == 'HIGH'"
```

自定义调用表格接口的代码同理。顺带一提，这类表达式**原本就是脆的**——它比对的是翻译后的文本，界面切一次语言语义就变了。
:::

### 还有一个坑：`afterFetch` 的重写会进编辑器

这是第一节第 4 条的正解，它写在 `DataProxy` 的 Javadoc 里：

```java
/**
 * Rewrites the rows a table query is about to return. The row form is unaffected, because it
 * reads a record through its own endpoint, but in-table cell editing seeds its editor from the
 * row shown here: a field rewritten for display (masked, formatted, turned into markup) would
 * be written back in that form. Rewrite view-only fields, or mark an editable one
 * {@code @Edit(cellEdit = false)}.
 */
default void afterFetch(Collection<Map<String, Object>> list) {
}
```

—— `xyz.erupt.annotation.fun.DataProxy`

规则一句话：**`afterFetch` 里重写过的字段，要么是纯展示字段，要么标 `@Edit(cellEdit = false)`。** 这是一个框架无法替你判断的约束（它不知道 `¥1,200.00` 是格式化还是真值），所以我们把它写进了扩展点自己的文档里，而不是写进某一页手册的角落。

## 六、跟简道云 / 明道云 / JeecgBoot 怎么比？

| 维度 | 简道云 / 明道云 / 宜搭 | JeecgBoot online 表单 | Erupt `cellEdit` |
|---|---|---|---|
| 行内编辑入口 | 有，产品内置 | 有，online 配置 | `@Power(cellEdit)`，默认开 |
| 字段级排除 | 靠"只读"，表单一起禁 | 字段配置只读 | `@Edit(cellEdit=false)`，**表单仍可改** |
| 跨字段校验 | 需在表单规则里再配一份 | 需写 online 增强 JS / Java | **不用配**，与表单同一份 `validate` |
| 扩展钩子入参 | 无源码级钩子 | 增强类可拿到 | 完整实体，与表单提交完全一致 |
| 行级数据权限 | 平台规则，黑盒 | 需自行接 `DataScope` | 复用查询侧过滤，看不见即改不了 |
| 手搓请求绕过前端 | 依赖平台 | 取决于增强是否落在服务端 | 七道关全在服务端 |
| 操作日志 | 有，平台格式 | 需配置 | 与表单提交同一条日志链路 |

差别可以概括成一句：**别人是"给表格加了一个编辑能力"，我们是"给表单加了一个入参形状"。** 前者要为新能力补齐一整套约束，后者天生就带着旧约束。

## 七、5 分钟从注解到界面

从一个空 Spring Boot 项目到能访问的 admin 页面，完整流程已经独立成一篇：

**→ [快速部署 / Quick Start](/zh/guide/quick-start)**

那一页覆盖 Maven 依赖、`application.yml`、第一个 `@Erupt` 实体、默认登录账号，以及 Docker / K8S 部署。

跑通之后，单元格编辑**不需要任何额外配置**——`@Power(cellEdit)` 默认为 `true`，双击单元格即可。真正要做的只有两件收口动作：

```java
// 这张表的行数据必须整体审阅后修改，整体关闭
@Erupt(name = "结算单", power = @Power(cellEdit = false))
public class Settlement extends BaseModel { }

// 或者只把某个字段挡在表格外，表单里照改
@EruptField(
        views = @View(title = "API Key"),
        edit = @Edit(title = "API Key", cellEdit = false)
)
private String apiKey;
```

配置项与界面行为详见 [@Power → cellEdit 单元格编辑](/zh/annotation/power#celledit-单元格编辑)，表格交互见 [界面指南](/zh/guide/ui#单元格呈现)。

---

:::info 参与讨论
本期专题对应的核心源码在 [`EruptModifyService#updateEruptCell`](https://github.com/erupts/erupt/blob/master/erupt-core/src/main/java/xyz/erupt/core/service/EruptModifyService.java)，两级开关在 [`Power`](https://github.com/erupts/erupt/blob/master/erupt-annotation/src/main/java/xyz/erupt/annotation/sub_erupt/Power.java) 与 [`Edit`](https://github.com/erupts/erupt/blob/master/erupt-annotation/src/main/java/xyz/erupt/annotation/sub_field/Edit.java)，整行校验的用例在 `erupt-test` 的 `CellEditRowModel`。欢迎在 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 留贴，说说你项目里哪些字段最不该出现在表格浮层里。
:::
