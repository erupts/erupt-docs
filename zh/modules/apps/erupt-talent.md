# Erupt Talent 招聘管理

[erupt-talent](https://github.com/erupt-io/erupt-talent) 是基于 Erupt 的社招全流程管理系统，覆盖 **简历 → 初筛 → 多轮面试 → 拟录用 → Offer 审批与自动发件 → 候选人确认 → 待入职 → 正式入职 → 数据漏斗** 全链路。

界面由注解生成，无前端代码；邮箱抓取、Offer 发信、钉钉日程三项外部集成全部在后台表单中可视化配置，不需要改 `application.yml`，也不需要重启。

## 本地试用

```bash
mvn spring-boot:run
# http://localhost:8080  erupt / erupt
```

首次启动自动完成初始化（幂等）：H2 文件库建表（`./data/`），播种「招聘管理」菜单与按钮级权限，播种角色 `TALENT_HR`（HR 专员）、`TALENT_INTERVIEWER`（面试官），以及 6 个通知场景、1 条系统配置、2 个定时任务。

切换到 MySQL：

```bash
export MYSQL_USER=... MYSQL_PASSWORD=...
mvn spring-boot:run -Dspring-boot.run.arguments=--spring.profiles.active=mysql
```

## 菜单

| 菜单 | 类型 | 说明 |
| --- | --- | --- |
| 招聘数据看板 | TPL 页面 | 漏斗图、核心指标、渠道 / 岗位分布、CSV 导出 |
| 岗位管理 | 表格 | 岗位、HC、启停、部门负责人（Offer 首级审批人） |
| 简历管理 | 表格 | 手动录入、Excel 导入、邮箱自动抓取 |
| 面试管理 | 表格 | 一 / 二 / 终面记录、打分评价、钉钉日程 |
| Offer 管理 | 表格 | 两级审批 + 自动发件 + 全程留痕 |
| 入职管理 | 表格 | 材料核对、确认入职弹窗、闭环 |
| 流转日志 | 只读表格 | 所有状态变更永久留存 |
| 招聘系统配置 | [表单视图](/zh/advanced/form-view) | IMAP / SMTP / 钉钉 / 风控开关 / Offer 模板 |

## 自动化流程

- 定时抓取招聘邮箱，解析 PDF / DOCX 简历并按 `Message-ID` 去重录入
- 初筛通过自动创建一面任务；面试结论提交后自动同步简历状态
- 面试排期自动创建钉钉日程并提醒
- 终面拟录用自动发起 Offer 审批，审批通过自动发邮件
- Offer 接受自动生成待入职数据，确认入职后闭环

业务状态单向流转：简历、Offer、入职的状态字段都是只读，只能经服务层变更，每次变更都写入流转日志。钉钉同步、发件、通知失败都不会回滚业务数据，失败原因留在记录上，可重试。

## 可视化配置

「招聘系统配置」仅超级管理员可见，分为邮箱抓取、Offer 发信、钉钉日程、Offer 模板与风控四组，每组带「测试连接」按钮。密钥字段使用 `EditType.PASSWORD`，浏览器只拿到掩码，明文永不回传；保存时掩码或空值会保留库中原值。

Offer 邮件模板支持 `${candidateName}` `${jobPost}` `${salary}` `${onboardDate}` `${companyName}` 等变量，替换时做 HTML 转义。

## 角色

| 角色 | 效果 |
| --- | --- |
| 超级管理员 | 全功能、全数据 + 系统配置 |
| HR 专员 `TALENT_HR` | 全流程操作、数据查看导出，无系统配置权限 |
| 面试官 `TALENT_INTERVIEWER` | 只看自己的面试，只能填打分 / 评价 / 结论 |
