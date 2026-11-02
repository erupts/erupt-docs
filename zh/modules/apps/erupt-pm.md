# Erupt PM 项目管理

[erupt-pm](https://github.com/erupt-io/erupt-pm) 是基于 Erupt 的项目管理应用：项目 → 迭代 → 任务（子任务、前置依赖、里程碑）→ 工时，外加风险登记。全部界面由注解生成，仓库里没有前端代码。

它同时是 [@Vis 多视图](/zh/annotation/vis) 的完整示例：同一张任务表以看板、甘特图、日历、时间线和表格五种视图呈现。

## 本地试用

```bash
mvn spring-boot:run
# http://localhost:8080  erupt / erupt
```

默认使用 `./data` 下的 H2 文件库，首次启动自动写入一个演示项目（两个迭代、13 个任务、工时与风险）。改用 MySQL 时以 `--spring.profiles.active=mysql` 启动，并通过环境变量提供 `MYSQL_USER` / `MYSQL_PASSWORD`。

需要 Java 17。

## 模型与视图

| 模型 | 视图 | 说明 |
| --- | --- | --- |
| 项目 | 表格、卡片 | 负责人、排期、状态、颜色 |
| 迭代 | 表格、甘特图（按项目分组）、日历 | 带目标的迭代时间盒 |
| 任务 | 看板（状态 × 负责人泳道，合计预估工时）、甘特图（子任务树、完成-开始依赖、里程碑、按优先级着色、拖拽改期）、日历（截止日）、时间线（创建时间）、表格、我的任务 | `TaskProxy` 填充报告人、同步状态与进度并通知负责人 |
| 工时 | 表格 | 按任务记工时，`WorklogProxy` 回写 `Task.spentHours` |
| 风险 | 表格、看板（状态 × 项目） | 概率、影响、负责人、应对措施 |

「我的任务」是一个看板视图，用 `FilterHandler` 只显示当前用户的任务，跨项目聚合。

## 演示的框架能力

- [@Vis](/zh/annotation/vis)：[看板](/zh/annotation/vis-board) 泳道与 `sumField`，[甘特图](/zh/annotation/vis-gantt) 的 `pidField` / `dependencyField` / `milestoneField` / `progressField` / `colorField`，[日历](/zh/annotation/vis-calendar)，[时间线](/zh/annotation/vis-timeline)
- 通过轻量投影实体（`TaskRef`，与 `Task` 同表）实现自引用选择
- `ReferenceTableType.dependField`：按所选项目过滤迭代
- [DataProxy](/zh/advanced/data-proxy) 生命周期与更新前快照（`OldEntityTL`）
- `FilterHandler` 行级过滤，既作用于实体，也作用于单个 `@Vis`
- [erupt-comment](/zh/modules/erupt-comment) 记录讨论，[erupt-revision](/zh/modules/erupt-revision) 字段级历史与回滚
- [erupt-notice](/zh/modules/erupt-notice) 通知场景（任务指派、即将到期）与 [erupt-job](/zh/modules/erupt-job) 每日提醒
- 模块注册（`EruptModule`）、`ApplicationReadyEvent` 幂等初始化、i18n CSV
