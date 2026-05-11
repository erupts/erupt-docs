# Erupt Chart 低代码数据可视化

erupt-chart 是 erupt 体系内的通用报表图表模块，零前端代码，仅需配置即可完成数据分析能力。支持纯 SQL 定义报表图表，**零前后端代码**实现复杂数据分析，支持十几种查询维度、十几种图表组件与动态函数，适合有 SQL 编写能力但需要可视化功能的团队。

:::tip 付费插件
源码交付 · 技术支持 · 免费更新迭代 · 合理需求免费实现 · erupt 相关问题优先支持 · 无 License 限制 · 无项目数量限制 · 无商用限制 · 禁止二次开源与分发
:::

演示：[https://demo.erupt.xyz](https://demo.erupt.xyz) &nbsp; 账号：`bi` 密码：`bi`

售前咨询请添加作者微信：

<img src="/me.jpg" width="240">

---

<img src="/bi/overview.jpg" width="900">

<img src="/bi/demo1.png" width="900">

<img src="/bi/demo2.png" width="900">

<img src="/bi/demo3.png" width="900">

<img src="/bi/demo4.png" width="750">

## 菜单配置项说明

| 菜单名称 | 功能说明 |
| --- | --- |
| 数据源管理 | 多数据源配置，需配置数据源的用户名密码等信息，特殊的数据源需要指定分页语句 |
| 报表处理类 | 需实现 `xyz.erupt.bi.fun.EruptBiHandler` 接口，可实现对报表 SQL 的动态修改与查询结果的动态处理 |
| 函数管理 | 配置函数脚本，用于报表中调用，提供了动态 SQL 的能力，有 and、like、In 等基础函数 |
| 参照维度 | 统一维护下拉列表、下拉树等组件数据 |
| 报表配置 | 配置报表、图表、查询维度、动态列、缓存、分页、历史记录、菜单发布等 |
