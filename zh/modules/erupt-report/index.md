# Erupt Report 报表图表

Erupt Report 是 erupt 体系内的通用报表图表模块，纯 SQL 定义报表与图表，零前端代码即可完成多维数据分析。图表基于 [G2Plot](https://g2plot.antv.antgroup.com/) 渲染，支持二十余种图表类型、十几种查询维度组件，以及表格下钻、图表联动、Excel 导出、报表缓存等能力。

:::tip 🎉 开源说明
Erupt Report（原商业版 erupt-bi）已随 **Erupt 2.1.0** 正式开源发布。
:::

:::info 仓库地址
[https://github.com/erupts/erupt/tree/master/erupt-report](https://github.com/erupts/erupt/tree/master/erupt-report)
:::

在线演示：[https://demo.erupt.xyz](https://demo.erupt.xyz) &nbsp; 账号：`bi` 密码：`bi`

<img src="/report/demo1.png" width="900">

<img src="/report/demo2.png" width="900">

<img src="/report/demo3.png" width="900">

## 为什么不直接用 DataEase / Superset / 自研？

| 维度 | 自研 ECharts 组件 | DataEase / Superset | **Erupt Report** |
| --- | --- | --- | --- |
| 部署成本 | 0（融入业务工程） | 单独部署 BI 服务器 + 数据库 | **0（融入业务工程）** |
| 技术栈 | 前后端各一套 | Java/Vue + Python/Node 多套 | **纯 Java + SQL** |
| 权限体系 | 自己重新实现一遍 | 单独的用户体系，要同步 | **复用 Erupt UPMS，零额外工作** |
| 钻取 / 联动 | 平均 1–2 周自研 | 配置门槛高 | **配置即得** |
| 上线速度 | 数周 | 数天 + 跨团队协作 | **30 分钟** |

## 使用方法

### 导入依赖

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-report</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

:::tip
模块基于 **Java 17** 编译，需配合 erupt 2.x 使用；依赖 `erupt-upms`（权限）与 `erupt-tpl`（模板页面），JS 脚本引擎使用内置的 `nashorn-core`，无需额外引入。
:::

## 可配置项

```yaml
erupt:
  bi:
    enable-cache: true                    # 是否开启报表缓存
    query-log: true                       # 是否打印查询 SQL 日志
    super-admin-publish: false            # 开启后仅超级管理员可发布报表
    page-size: 10                         # 默认分页大小
    page-size-options: [10, 30, 50, 100]  # 可选分页大小
    single-max-result-num: 500            # 后端分页单次查询最大返回行数
```

## 功能导航

| 功能 | 说明 |
| --- | --- |
| [数据源管理](./datasource) | 多数据源配置，连接不同数据库做多维数据分析 |
| [报表处理类](./handler) | 通过 Java 代码动态处理报表 SQL 与执行结果 |
| [参照维度](./dimension) | 通过 SQL 结果生成下拉列表、下拉树等查询条件 |
| [函数管理](./function) | JS 函数与 SQL 混编，实现动态 SQL |
| [报表配置](./report-config) | 报表、图表、查询维度、动态列、下钻等核心配置 |
| [发布报表](./publish) | 将配置好的报表发布为系统菜单 |
| [常见问题](./faq) | ES6 语法、默认值等问题 |
