---
title: "改动历史为什么不写在 DataProxy 里"
description: "审计日志告诉你「谁动了这条记录」，不告诉你「改之前长什么样」。本期拆 erupt-revision：订阅 EruptEditEvent 做字段级 diff，回滚重新走 update 管线，以及它现在漏掉的两个入口。"
outline: deep
---

# 第 18 期 · 改动历史不属于任何一个 DataProxy

> 想给「记录改过什么」加历史，最顺手的写法是在每个模型的 `DataProxy#beforeUpdate` 里存一份旧值——然后每个模型写一遍。`erupt-revision` 反过来：不碰任何 `DataProxy`，只订阅管线已经在发的 `EruptAddEvent` / `EruptEditEvent` / `EruptDeleteEvent`，在调用方的事务里写下字段级 diff，回滚时再把旧值送回**同一条 update 管线**。
>
> _发布于 2026-10-08 · 阅读 ~9 min_

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

后台系统里有两类「历史」，经常被混为一谈：

- **操作日志**：机器写的，一行 `谁 / 什么时候 / 对哪张表做了 UPDATE`。Erupt 早就有（`@EruptRecordOperate`、`EruptModifyService#modifyLog`）。
- **字段历史**：这条记录的 `状态` 字段，上周是「待审核」，现在是「已驳回」，是谁改的，能不能改回去。

第二类需求出现时，大多数团队的第一反应是在业务代码里补：`beforeUpdate` 里查一遍旧行，比一比，写进 `xxx_history`。第一个模型写完觉得还行，第三个模型开始复制粘贴，第十个模型有人忘了写。

本文的反向命题是：

> **改动历史是管线的副产品，不是业务代码的职责。** 它应该订阅「写入已经发生」这件事，而不是插进某个模型的生命周期里。

## 二、两种做法：插进生命周期 vs 订阅管线事件

| 维度 | 写在 DataProxy / 触发器里 | 订阅管线事件（`erupt-revision`） |
|---|---|---|
| 新增一个模型的成本 | 每个模型一份实现 | **0**，引入模块即对所有模型生效 |
| 关掉某个模型 | 删代码 | `@Power(revision = false)` |
| 漏记的风险 | 有人忘写就漏 | 只要写入走管线就记；不走管线的不记（见 §五） |
| 与业务事务的关系 | 自己保证 | 监听器跑在调用方事务内，改动与历史同提交、同回滚 |
| 回滚的校验 | 通常直接 UPDATE 表，绕过校验 | 重新走 `updateEruptData`，校验与 `DataProxy` 钩子照常执行 |

代价是放弃了「按业务语义写历史」的自由：模块只知道字段名与值，不知道「驳回」这个动作。我们认为对绝大多数后台这是对的——业务语义要写，就写评论（见 [第 11 期](/topics/record-comment-crosscut)）。

## 三、一张表、三个事件、两条路由

可数的事实，模块在 `erupt-plugin/erupt-revision/`：

- 1 个实体 `xyz.erupt.revision.model.EruptRecordRevision`：`erupt`（模型名）、`recordId`（主键转字符串）、`version`、`operation`（`ADD` / `UPDATE` / `DELETE`）、`operator`、`changes`（JSON）。表带 `(erupt, recordId)` 复合索引。
- 3 个监听方法，对应核心里的 `xyz.erupt.core.event.EruptAddEvent` / `EruptEditEvent` / `EruptDeleteEvent`。
- 2 条路由：`GET /erupt-api/revision/{erupt}/{id}` 读历史，`POST .../{revisionId}/rollback` 回滚；都走 `VerifyType.ERUPT`，**能打开模型就能看它的历史，回滚另需编辑权限**。
- 1 个开关：`xyz.erupt.annotation.sub_erupt.Power#revision()`，默认 `true`。

历史表自己是只读的（`@Power(add = false, edit = false, delete = false, revision = false, comment = false)`）——历史只能由管线写入，不能手改，也不会给自己再记一层历史。

## 四、字段级 diff：「没变」比「变了」难判断

监听器本身很短：

```java
@EventListener
@Transactional
public void onEdit(EruptEditEvent<Object> event) {
    this.capture(event.getEruptClass(), RevisionOperation.UPDATE, event.getBefore(), event.getSource());
}

private void capture(Class<?> clazz, RevisionOperation operation, Object before, Object after) {
    EruptModel eruptModel = this.resolve(clazz);
    if (null == eruptModel || !eruptModel.getErupt().power().revision()) return;
    try {
        JsonObject beforeJson = this.masked(eruptModel, before);
        JsonObject afterJson = this.masked(eruptModel, after);
        List<FieldChange> changes = this.diff(eruptModel, beforeJson, afterJson);
        if (changes.isEmpty()) return;
        // ... 组装 EruptRecordRevision，version = max(version) + 1，eruptDao.persist(revision)
    } catch (Exception e) {
        log.warn("erupt-revision: failed to record {} of {}: {}", operation, eruptModel.getEruptName(), e.getMessage());
    }
}
```

难的是 `diff`。三条规则都写在源码里：

1. **值取自 `EruptUtil.toMaskedJson`**。`PASSWORD` 字段已经是掩码，密码不会进历史表。
2. **「空」等于 null**。空集合、空对象、空串与 null 视为相同，因为表单对空值就是这么提交的——否则「打开表单、什么都没改、点保存」会产生一条空历史。`changes.isEmpty()` 时直接不写。
3. **引用只比主键**。`REFERENCE_TABLE`、`CHECKBOX`、`TRANSFER` 等引用字段存成 `{主键, label}`，比较时丢掉 label。单元格编辑与回滚只带主键，不能因此被读成「标签变了」。

:::tip 反直觉的一点
历史里**不存整行快照**，只存「变了的字段」的 `{field, title, before, after}`。好处是回滚一个旧版本只撤销那一次改动，不会把后来别人改的其他字段一起冲掉。
:::

## 五、回滚：不是 UPDATE 表，而是再提交一次表单

```java
@Transactional
public void rollback(String erupt, String recordId, Long revisionId) {
    EruptModel eruptModel = EruptCoreService.getErupt(erupt);
    Erupts.powerLegal(eruptModel, PowerObject::isEdit);
    EruptRecordRevision revision = eruptDao.find(EruptRecordRevision.class, revisionId);
    // ... 校验 revision 属于该模型与记录，且 operation == UPDATE
    Object current = DataProcessorManager.getEruptDataProcessor(eruptModel.getClazz())
            .findDataById(eruptModel, EruptUtil.toEruptId(eruptModel, recordId));
    JsonObject data = GSON.toJsonTree(current).getAsJsonObject();
    for (FieldChange change : RevisionVo.parse(revision.getChanges())) {
        EruptFieldModel fieldModel = eruptModel.getEruptFieldMap().get(change.getField());
        if (null == fieldModel || fieldModel.getEruptField().edit().type() == EditType.PASSWORD) continue;
        data.add(change.getField(), null == change.getBefore() ? JsonNull.INSTANCE : change.getBefore());
    }
    eruptModifyService.updateEruptData(eruptModel, data);
}
```

关键是最后一行：把旧值写回**当前记录的 JSON**，再交给 `EruptModifyService#updateEruptData`。于是 `DataProxy#beforeUpdate` 的校验、`@Edit` 的必填与长度、行级权限，一个都不会被绕过；同时这次回滚本身又触发一条新的 `UPDATE` 修订——**回滚也有历史**，可以再回滚回来。

这条路径也带来明确的边界：只能回滚 `UPDATE`（`ADD` / `DELETE` 会抛 `revision.rollback_update_only`）；已从模型里删掉的字段、`PASSWORD` 字段会被跳过。

:::warning 已知差距
当前有两个写入入口**不会**留下修订：`EruptModifyService#dragSortEruptData`（拖拽排序）只写操作日志，不发 `EruptEditEvent`；任何不经过 `EruptModifyService` 直接调 `eruptDao.persist` / SQL 的代码，管线看不见，历史自然也看不见。另外 `capture` 里捕获了所有异常只打 warn——「历史不能拖垮业务」是有意为之，代价是历史写失败时没有人会被通知。
:::

## 六、跟宜搭 / 简道云 / 明道云怎么比？

下表对位的是产品形态，我们没有逐项实测这些平台，细节以各自官方文档为准。

| 维度 | 国内对位平台 | Erupt |
|---|---|---|
| 谁来开启 | 业务人员按表单 / 工作表在界面上配置 | 引入模块即全局生效，模型用 `@Power(revision = false)` 退出 |
| 记录粒度 | 平台内置的数据修改记录 / 动态，格式由平台定 | 字段级 `{field, title, before, after}` JSON，可直接导出（`export = true`） |
| 回滚 | 通常是查看为主，恢复靠人工改回 | 单击回滚，走完整 update 管线，回滚本身也留修订 |
| 事务一致 | 平台内部保证 | 监听器与业务写入同一事务 |
| 能不能扩展 | 平台封闭 | 同一批 `EruptEditEvent` 你自己也能 `@EventListener` |
| 适合谁 | 业务人员自助 | 需要把「改过什么」当作系统能力、而不是每张表一份代码的后端团队 |

## 七、5 分钟上手

本期只多一个依赖：

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-revision</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

`erupt-spring-boot-starter-all` 已包含本模块；模块依赖 `erupt-upms`，要求 **2.3.0** 及以上，且需要 JPA 数据源（历史表是 JPA 实体）。引入后，**系统管理**下出现只读的「Record Revision」菜单，记录面板出现历史入口。

其余步骤与普通 Erupt 项目一致：

**→ [快速部署 / Quick Start](/guide/quick-start)**

跑通之后，对不想留痕的模型加 `@Power(revision = false)`，再去 §四 对照一次「什么都没改点保存」是否真的不产生历史。

## 八、下一期预告

同期主仓还有一个方向相反的改动：`S3AttachmentProxy` 让附件直接进对象存储桶，`erupt-data-s3` 另有带类型的 `S3ObjectModel`。下一期我们聊：**附件应该跟着业务数据走，还是跟着对象存储走**——以及宜搭、明道云的附件字段在文件归属上留了什么口子。

---

:::info 参与讨论
本期涉及的源码：`erupt-plugin/erupt-revision/.../service/EruptRevisionService.java`、`model/EruptRecordRevision.java`、`controller/EruptRevisionController.java`，`erupt-core/.../service/EruptModifyService.java`（事件发布点），`erupt-annotation/.../sub_erupt/Power.java`。

拖拽排序补发事件、历史写失败时是否该告警，欢迎到 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 投一票。
:::
