---
title: "@Vis × TableQuery × DataProxy：八种视图，一条查询管线"
description: "明道云、简道云、宜搭都有看板、日历、甘特。Erupt 的 @Vis 做到了同一件事，但押了不同的注：视图不是数据的副本，而是同一次查询的投影。这一期讲清读路径怎么共享，以及写路径哪里还没收敛。"
outline: deep
---

# 第 17 期 · 一张表，八种视图

> 国内的表格型低代码平台，看板、日历、甘特几乎成了标配，视图本身也越来越像一个独立对象：自己的筛选、自己的分组、自己的排序。Erupt 的 `@Vis` 这两周补齐了 TIMELINE、MAP、CUBE 和服务端列统计，一个实体现在能挂 8 种视图。我们的判断是：**视图应该是同一次查询的投影，而不是各带一套数据口径的小应用**——读路径我们已经收敛到一处，写路径上的三个拖动端点还没收敛，这一期把两边都摊开讲。
>
> 发布于 2026-10-03 · 阅读 ~10 min

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

给一张任务表加"看板视图"，听起来是个前端需求。真正的麻烦在后面：看板里统计的"进行中 12 条"，和列表页筛出来的"进行中"是不是同一批数据？销售只能看自己的客户，换到日历视图、地图视图之后还是只能看自己的吗？看板上把卡片拖到"已完成"，业务规则校验还跑不跑？

视图一多，这些问题就从"功能"变成"口径"。我们的做法不是给每种视图写一套数据接口，而是让所有视图共用同一条查询管线，视图只决定**怎么画**。

先说结论，免得读到最后才发现：读路径做到了；写路径只做到一半。§五 会列出具体差在哪里。

## 二、两种范式：视图即对象 vs 视图即投影

| | 视图即对象 | 视图即投影（`@Vis`） |
|---|---|---|
| 视图存什么 | 筛选、分组、排序、字段显隐，各自一份 | 只存"怎么画"：分组字段、日期字段、颜色字段 |
| 数据口径 | 每个视图可以不同 | 与列表页完全相同：同一个 `TableQuery`、同一组 `Condition` |
| 谁来定义 | 业务人员在界面上点出来 | 开发者在实体注解里声明，随代码进 Git |
| 权限与扩展点 | 平台统一处理，开发者难以插手 | 走 `DataProxy` 与 `@Erupt(power = @Power(...))`，开发者可以插手 |
| 代价 | 业务人员改视图改出口径漂移 | 改视图要改代码、发版 |

这不是谁对谁错，而是读者不同。给业务人员自己搭，视图就该是界面上的对象；给后端工程师交付一个口径必须稳的后台，视图就该落进代码。

## 三、可数的事实

| 项 | 数字 | 来源 |
|---|---|---|
| 视图类型 | 8 种：`TABLE` / `GANTT` / `CARD` / `BOARD` / `CALENDAR` / `TIMELINE` / `MAP` / `CUBE`，另有 `TPL` 自定义模板 | `xyz.erupt.annotation.Vis.Type` |
| 视图配置注解 | 8 个，位于 `xyz.erupt.annotation.vis.*` 与 `xyz.erupt.annotation.cube.CubeView` | `BoardView` / `CalendarView` / `CardView` / `GanttView` / `MapView` / `TableView` / `TimelineView` / `CubeView` |
| 图表类型（CUBE 视图） | 28 种 | `xyz.erupt.annotation.cube.CubeChart.Type` |
| 列统计函数 | 6 种：`COUNT` / `DISTINCT_COUNT` / `SUM` / `AVG` / `MAX` / `MIN` | `xyz.erupt.annotation.sub_field.View.Statistic` |
| 读管线入口 | 1 个：`EruptService.assembleQuery`，列表与聚合共用 | `xyz.erupt.core.service.EruptService` |
| 写回端点 | 3 个：看板、日历、甘特 | `xyz.erupt.core.controller.vis.*Controller` |

`@Vis` 挂在 `@Erupt(vis = {...})` 上，`visRawTable` 默认 `true`，也就是默认表格视图保留，其他视图作为 Tab 并排出现。

## 四、读路径：视图只是 TableQuery 上的一个字段

每个视图请求都带一个 `vis`（对应 `@Vis.code`），后端在 `EruptService.assembleQuery` 里把它翻译成附加条件，其余和列表页走同一个函数：

```java
// xyz.erupt.core.service.EruptService#assembleQuery（节选）
DataProxyInvoke.invoke(eruptModel, (dataProxy ->
        Optional.ofNullable(dataProxy.beforeFetch(legalConditions)).ifPresent(conditionStrings::add)));
if (null != tableQuery.getVis()) {
    for (Vis vis : eruptModel.getErupt().vis()) {
        if (vis.code().equals(tableQuery.getVis())) {
            for (Filter filter : vis.filter()) {
                conditionStrings.add(filter.value());
            }
            if (vis.orderBy().length > 0) {
                // 仅当用户没有指定排序时，才套用视图自己的排序
            }
        }
    }
}
```

顺序值得注意：先是用户搜索条件和 link tree，然后是 `DataProxy#beforeFetch`——行级权限一般写在这里——最后才是视图自己的 `@Vis(filter = ...)`。**视图的过滤只能收窄，不能越过前面的限制**，因为它是追加的 `and`。

上周新增的服务端列统计走的是同一个函数。`POST /erupt-api/data/aggregate/{erupt}` 接收和列表完全一样的 `TableQuery`：

```java
// xyz.erupt.core.service.EruptService#getEruptAggregate（节选）
Erupts.powerLegal(eruptModel, PowerObject::isQuery);
// ……收集所有 @View(statistic = ...) 的列……
EruptQuery eruptQuery = this.assembleQuery(eruptModel, tableQuery, null);
Optional.ofNullable(DataProcessorManager.getEruptDataProcessor(eruptModel.getClazz())
        .aggregate(eruptModel, eruptQuery, aggregates)).ifPresent(result::putAll);
```

于是看板列头的合计（`@BoardView(sumField = ...)`）、分组表格的小计（`@TableView(groupField = ...)`）、表尾的总计，和列表页翻到第几页没有关系，统计的是"同一条件命中的全部行"。DataProxy 在 `afterFetch` 里算出来的瞬态列，数据源聚合不了，这时退化为内存计算，上限 2000 行，超过就返回 `null`——宁可显示"未知"，也不对着半截数据给一个看似精确的总数。

CUBE 视图把这个思路推到图表上。`@CubeView(linkSearch = true)` 会把列表的搜索条件当作过滤条件传给每一张图，字段名不一致时用 `searchMapping` 对应：

```java
@Erupt(name = "订单", vis = {
    @Vis(title = "分析", type = Vis.Type.CUBE, cubeView = @CubeView(
        explore = "overview",
        linkSearch = true,
        searchMapping = @KV(key = "customer.name", value = "customerName"),
        columns = 2,
        charts = {
            @CubeChart(title = "月度金额", type = CubeChart.Type.LINE,
                       x = "month", y = "amount"),
            @CubeChart(title = "渠道占比", type = CubeChart.Type.PIE,
                       x = "channel", y = "amount")
        }))
})
```

渲染和查询由 erupt-cube 提供，未引入该模块时视图会提示图表不可用，不会报错。

:::tip 反直觉的小结
视图越多，**越不该**给视图加数据接口。看板、日历、甘特三个控制器里没有一行查询代码——它们只负责写回。所有"读"都是 `TableQuery` 加一个 `vis` 字段，口径只有一份。
:::

## 五、写路径：三个端点，还没收敛的四件事

拖动看板卡片、拖动日历日程、拖动甘特条，都会写回数据库。这三个端点（`EruptBoardController#updateGroup`、`EruptCalendarController#updateDate`、`EruptGanttController`）的做法大体一致：校验 `isEdit` 权限，按主键取出实体，用反射改字段，调用 `DataProxy#beforeUpdate` / `afterUpdate`，保存。

这条路径是通的，`DataProxy` 的扩展点都在。但和 [第 10 期](/topics/cell-edit-whole-row) 讲的 `update-cell` 相比，它是一条**短路径**。`EruptModifyService.updateEruptCell` 会做的事，我们对照了源码，拖动端点目前没有：

- **整行校验。** `update-cell` 把改动合并进整行，再跑 `EruptUtil.validateEruptValue`。三个拖动端点只改日期或分组字段，不跑 `@Edit` 校验，也不跑 `DataProxy#validate`。
- **行级权限。** 更新入口会调用 `verifyIdPermissions`，确认这条主键在当前用户可见范围内。拖动端点（以看板、日历为例）直接 `findDataById`，不做这一步。
- **操作日志与事件。** 常规更新会写 `modifyLog` 并发布 `EruptEditEvent`；三个拖动端点都没有 `@EruptRecordOperate`，也不调用 `modifyLog`。事件方面，甘特会发布 `EruptEditEvent`，看板和日历不发——依赖该事件做通知的业务，在后两种视图里拖动时收不到。
- **树层级校验。** `eruptTreeLevelService.verify` 在常规更新里生效，拖动里没有。

```java
// 看板拖动，EruptBoardController#updateGroup（节选）
Object obj = DataProcessorManager.getEruptDataProcessor(eruptModel.getClazz())
        .findDataById(eruptModel, command.getPk());
this.assign(eruptModel, obj, vis.boardView().groupField(), command.getGroupValue());
DataProxyInvoke.invoke(eruptModel, (dataProxy -> dataProxy.beforeUpdate(obj)));
DataProcessorManager.getEruptDataProcessor(eruptModel.getClazz()).editData(eruptModel, obj);
DataProxyInvoke.invoke(eruptModel, (dataProxy -> dataProxy.afterUpdate(obj)));
```

:::warning 我们还欠的一笔
如果你的业务规则写在 `DataProxy#validate` 或依赖 `EruptEditEvent`，在启用看板 / 日历 / 甘特拖动之前，请先在 `beforeUpdate` 里补一遍校验，或暂时不要开放拖动。我们的计划是让这三个端点走 `update-cell` 同一条整行管线；在那之前，这是一个已知差距，不是设计取舍。
:::

把它写进专题而不是悄悄修掉，是因为第 10 期的结论——"凡是写，就走整行管线"——对视图同样成立，而我们在自己的代码里还没做到。

## 六、跟明道云 / 简道云 / 宜搭怎么比？

下表对位的是产品形态，我们没有逐项实测这些平台的内部实现，细节以各自官方文档为准。

| 维度 | 国内对位平台 | Erupt |
|---|---|---|
| 视图的定义者 | 业务人员在界面上配置，视图是平台里的一等对象 | 开发者在 `@Erupt(vis = ...)` 声明，随实体进 Git |
| 视图类型 | 看板、日历、甘特、画廊等，随平台版本演进 | 8 种内置，另有 `TPL` 自定义模板视图承接其余形态 |
| 数据口径 | 视图各带筛选与分组，需要人工保证一致 | 读路径一条 `assembleQuery`，视图只追加 `and` 条件 |
| 行级权限 | 平台权限体系处理 | `DataProxy#beforeFetch` 对所有视图一次生效 |
| 拖动写回 | 平台内部处理 | 触发 `beforeUpdate` / `afterUpdate`；校验、行级权限与日志尚未对齐（§五） |
| 图表 | 平台自带仪表盘 / 图表组件 | `CubeView` 在同一个 Tab 体系里嵌入 28 种图表，查询走 `@EruptCube` 语义层 |
| 适合谁 | 业务人员自助搭建 | 需要口径稳定、可审计、可版本管理的后端团队 |

## 七、5 分钟上手

从空 Spring Boot 项目到能访问的 admin 页面，完整流程已经独立成一篇：

**→ [快速部署 / Quick Start](/guide/quick-start)**

那一页覆盖 Maven 依赖、application.yml、第一个 @Erupt 实体、默认登录账号，以及 Docker / K8S 部署。

跑通之后，参考主仓 `erupt-sample` 里的 `xyz.erupt.sample.model.Gantt`：同一个实体挂了卡片、甘特、日历、时间线四个视图，抄过去换成你自己的字段名即可。各视图的完整属性见 [@Vis 多视图](/zh/annotation/vis)。

## 八、下一期预告

视图讲的是"数据怎么被看"。同期主仓里还有一个相反方向的改动：`S3AttachmentProxy` 让 Erupt 的附件直接存进对象存储桶，`erupt-data-s3` 同时提供了带类型的 `S3ObjectModel`。下一期我们聊：**附件应该跟着业务数据走，还是跟着对象存储走**——以及钉钉宜搭、明道云的"附件字段"在文件归属上留了什么口子。

---

:::info 参与讨论
本期涉及的源码：`erupt-annotation/.../Vis.java`、`vis/*View.java`、`cube/CubeView.java`、`cube/CubeChart.java`，`erupt-core/.../service/EruptService.java`（`assembleQuery`、`getEruptAggregate`）、`controller/vis/EruptBoardController.java`、`EruptCalendarController.java`、`EruptGanttController.java`。

§五 列出的四处差距，欢迎到 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 说说你更在意哪一条，我们会按反馈排收敛顺序。
:::
