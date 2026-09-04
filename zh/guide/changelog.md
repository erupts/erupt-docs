# 更新日志

## 2.1.1（2026-08-30） <Badge type="tip" text="Spring Boot 3.5.16" />

🌟 新增 [MULTI_FORM 多表单块](/zh/field-types/multi-form)编辑类型，一对多子表以内联表单块方式直接编辑，适合子表字段较多的录入场景

🌟 [@Layout](/zh/annotation/layout) 新增 [formSteps 分步表单](/zh/annotation/form-steps)向导模式，以 DIVIDE 分割线为分步边界，长表单分步填写

🌟 [erupt-cube](/zh/modules/pro/erupt-cube/visual-analysis#地图报表) 新增地图报表类型：基于 ECharts 的区域分布图，GeoJSON 地图注册表统一管理，点击区域可下钻联动过滤

🧩 [@Search](/zh/annotation/search) 新增 `lockOperator` 锁定操作符配置，服务端强制查询操作符，防止构造请求绕过前端查询限制

🧩 选择与引用字段搜索支持 [IN / NOT_IN 多选查询](/zh/annotation/search#多选搜索-in--not-in)，一次命中多个选项

🧩 [DATE](/zh/field-types/date) 日期选择新增季度（QUARTER）模式与 `min` / `max` 可选日期区间

🧩 [NUMBER](/zh/field-types/number) 数值输入增强：小数精度、步进值、前后缀单位、千分位分隔符

🧩 [COLOR](/zh/field-types/color) 颜色选择新增配置项：透明度通道、预设色板、色值文本显示

🧩 [erupt-job](/zh/modules/erupt-job#集群去重执行) 定时任务支持多实例集群去重，开启 `redis-session` 后同一任务全集群仅单节点执行

🧩 安全增强：嵌套子模型（TAB、COMBINE、引用字段等）请求按其父级菜单权限进行鉴权校验

🧩 FORM 类型菜单自动生成新增/修改按钮权限，无需手动配置

🧩 侧边栏菜单新增工具栏：刷新、重置、全部展开、分栏模式

🧩 树形视图支持复选框批量删除

🧩 表格列宽按实际文本测量计算更精准，页头面包屑过长时省略显示，多标签栏在移动端自动隐藏

🧩 新增 OrcaRouter 大模型服务商，感谢 [XiaoHuo888-hue](https://github.com/XiaoHuo888-hue) 贡献的代码

🐞 修复 RAG 知识库远程附件无法摄取、嵌入模型配置变更后客户端未刷新的问题

🐞 修复 TIME 时间搜索过滤器无法输入的问题

🐞 修复 Markdown 字段异步加载数据后不显示内容的问题，感谢 [chenxiaolong8023](https://github.com/chenxiaolong8023) 贡献的代码

🐞 修复 erupt-cube 语义模型 left join 关联查询的问题

🐞 修复固定多标签模式下标签栏遮挡页面内容的问题

## 2.1.0（2026-08-23） <Badge type="tip" text="Spring Boot 3.5.16" />

> 🦞 新模块开源 ×15 &emsp; 🔌 数据连接层 13+ 数据源 &emsp; 🤖 AI 能力全面升级

🦞 开源 [Erupt Report 报表图表](/zh/modules/erupt-report/)模块（原商业版 erupt-bi），纯 SQL 定义报表与图表，零前端代码完成多维数据分析

🦞 开源 [erupt-ai-canvas](/zh/modules/erupt-ai-canvas) 模块：一句话生成一个页面，SSE 流式生成、版本回退、元素拾取修改、多设备预览、一键发布到菜单，数据实时来自 Erupt 后端

🦞 开源 erupt-ai-rag 模块：[知识库与向量检索（RAG）](/zh/modules/erupt-ai-rag)，可插拔嵌入模型与向量存储（pgvector、Redis 等），支持 Agentic RAG

🦞 开源 erupt-ai-staff 模块：[AI 数字员工](/zh/modules/erupt-ai-staff)，绑定系统账户上岗、继承 UPMS 权限、Cron 排班执行任务，工作报告自动推送到钉钉、企业微信、飞书或 Slack

🦞 开源 erupt-data 数据连接层：数据在哪，后台就在哪——统一数据源接口，同一套注解模型即可对任意数据完成增删改查、分页与检索，本次新增 11 个数据源模块：

| 模块 | 说明 |
|---|---|
| [erupt-data-jdbc](/zh/modules/erupt-jdbc) | 纯 JDBC 单表数据源，无需 JPA 实体映射，支持 ClickHouse、Doris、TDengine、达梦等仅有 JDBC 驱动的数据库 |
| [erupt-data-http](/zh/modules/erupt-http) | REST 接口即数据源，将任意 HTTP 服务映射为可管理的后台表格 |
| [erupt-data-es](/zh/modules/erupt-es) | Elasticsearch 数据源，索引数据的管理与全文检索 |
| [erupt-data-redis](/zh/modules/erupt-redis) | Redis 键值数据的可视化管理 |
| [erupt-data-memory](/zh/modules/erupt-memory) | 内存数据源，无需数据库即可管理数据 |
| [erupt-data-file](/zh/modules/erupt-file) | 文件即数据表，支持 CSV、JSONL、TSV、INI 等格式 |
| [erupt-data-k8s](/zh/modules/erupt-k8s) | Kubernetes 集群资源的可视化管理 |
| [erupt-data-ldap](/zh/modules/erupt-ldap) | LDAP 目录服务数据源 |
| [erupt-data-feishu](/zh/modules/erupt-feishu) | 飞书多维表格数据源 |
| [erupt-data-notion](/zh/modules/erupt-notion) | Notion 数据源 |
| [erupt-data-s3](/zh/modules/erupt-s3) | S3 对象存储数据源 |

🌟 [erupt-cube](/zh/modules/pro/erupt-cube/sql) 新增 SQL Port：PostgreSQL 兼容协议端口（基于 Calcite 查询下推），任意 BI 工具可像连接 PostgreSQL 一样直连语义层

🌟 [erupt-ai-claw](/zh/modules/erupt-ai-claw) 增强：沙箱化文件与 Shell 工具、Agent Skills 技能库与技能沉淀、Erupt 模型增删改查工具箱、JVM 与 Spring 运行时诊断工具

🌟 [erupt-cloud](/zh/modules/erupt-cloud) 增强：节点生命周期管理、资源上报、路由容灾与优雅停机，并支持挂载 erupt-flow、erupt-ai-claw、erupt-monitor 等模块

🌟 [erupt-flow](/zh/modules/pro/erupt-flow/development#flex-节点) 新增 Flex 自动化节点：HTTP 请求、脚本、数据、变量（JS 表达式解析）、通知、等待回调，流程无需人工介入即可执行自动化动作

🌟 新增 erupt-docker all-in-one 镜像，一条命令拉起完整 Erupt 运行环境

🌟 AI 聊天支持中途停止生成，已生成内容保留并标记中断状态

🧩 [erupt-monitor](/zh/modules/erupt-monitor#erupt-类注册表) 新增 Erupt 类注册表页面，运行时模型一览，并支持一键发布到菜单

🧩 [@Power](/zh/annotation/power) 新增 `ai` 开关，按实体控制 AI 能力的可用范围

🧩 管理后台视觉升级：新增 Brutalist 主题一键切换，登录页与品牌 Logo 全新设计

🧩 表格列跟随 [@Vis](/zh/annotation/vis) 字段可见性动态过滤

🐞 修复 `pwd-transfer-encrypt = false` 时修改密码接口报错的问题

🐞 修复操作日志脱敏失败导致日志记录异常的问题

:::warning 破坏性变更
- `erupt-jpa` 更名为 `erupt-data-jpa`，`erupt-mongodb` 更名为 `erupt-data-mongodb`（统一归入 erupt-data 数据连接层），请同步修改 Maven 依赖的 artifactId
- `erupt-tpl-ui` 中的 AMIS 集成模块已移除，如有使用请迁移至其他模板引擎集成方式
:::

## 2.0.4（2026-07-19） <Badge type="tip" text="Spring Boot 3.5.16" />

🌟 新增 [`BUTTON` 编辑类型](/zh/field-types/button)，表单内按钮点击后携带全部表单数据调用后端处理器，支持回填表单值与动态调整字段配置

🌟 新增 [`@DragSort` 行拖拽排序](/zh/annotation/drag-sort)，表格支持直接拖拽行调整顺序，结果自动持久化到排序字段

🌟 新增 [`PROGRESS` 视图类型](/zh/annotation/view#展示类型viewtype)，数值列以进度条形式展示，SLIDER 编辑类型自动取其最大值

🌟 新增 [`PASSWORD` 视图类型](/zh/annotation/view#展示类型viewtype)，敏感字段以掩码展示，实际值不再下发到客户端

🧩 [`PASSWORD` 编辑组件](/zh/field-types/password#编辑回显掩码)安全增强：编辑回显仅返回掩码占位符，占位符未修改时保留原密码

🌟 [卡片视图](/zh/annotation/vis-card)支持选中卡片，选中状态与操作按钮联动

🧩 AI 模型、MCP Server、智能体、定时任务等内置表单新增测试/校验按钮，连接与配置正确性一键验证

🧩 [erupt-ai](/zh/modules/erupt-ai) 支持嵌入式聊天模式，LLM 的 apiKey 改用密码视图掩码展示

🧩 日期解析更宽容，兼容更多日期/时间输入格式

🐞 修复操作日志中密码字段未脱敏的问题

🐞 修复菜单状态枚举「隐藏」与「禁用」标签互换的问题

🐞 修复 AI 聊天抽屉在 Angular Zone 外打开导致的异常

## 2.0.3（2026-07-04） <Badge type="tip" text="Spring Boot 3.5.16" />

🌟 新增 [`erupt-spring-boot-starter` 与 `erupt-spring-boot-starter-all`](/zh/guide/quick-start) 启动器，一个依赖即可集成 Erupt 核心能力或全部功能模块

🌟 新增 [`CALLOUT` 编辑类型](/zh/field-types/callout)，在表单中展示静态引导内容，支持 HTML 与卡片、信息、警告等多种样式，字段不采集不入库

🌟 [`@Search`](/zh/annotation/search) 新增 `operator` 属性，可为搜索字段指定默认查询操作符，`AUTO` 按组件类型自动解析

🌟 [erupt-print](/zh/modules/erupt-print) 打印模板支持块级模板变量，编辑器新增变量插件与打印变量自动生成，打印预览增加加载反馈

🧩 操作日志增强：新增 [`record-operate-log-max-body-size`](/zh/guide/configuration) 配置限制记录的请求体大小，并完善请求上下文清理逻辑

🧩 管理后台首页视觉重构：动画蓝图背景、可折叠侧边栏、终端标签页样式优化

🐞 修复验证码接口图片高度参数未限制，可能被恶意利用生成超大图片的问题

🐞 修复 erupt-designer 表单 `view` 字段反序列化遇到空值时报错的问题

## 2.0.1（2026-06-29） <Badge type="tip" text="Spring Boot 3.5.15" />

> 🚀 新模块开源 ×2 &emsp; 🌟 新功能 ×21 &emsp; 🎨 前端重构 50+ 项

:::warning
2.0.0 包含多项破坏性变更，升级前请务必阅读 [1.14.x → 2.0.0 升级指南](/zh/guide/upgrade)
:::

🚀 开源 [erupt-designer](/zh/modules/erupt-designer) 模块，可在运行时可视化设计 Erupt 实体模型，并支持动态注册与一键发布到菜单

🚀 开源 [erupt-print](/zh/modules/erupt-print) 模块，支持为 Erupt 实体定义模板、配置变量并一键打印

🌟 [erupt-monitor](/zh/modules/erupt-monitor) **完全重写**：全新诊断监控体系，覆盖 JVM、HikariCP 连接池、HTTP 统计、Redis 健康指标

🌟 [erupt-ai](/zh/modules/erupt-ai#llmrequest-请求级扩展)：LLM 请求支持 `agentPrompt` 与 `contextPrompt`，可按调用场景注入上下文感知提示词

🌟 [@Vis](/zh/annotation/vis) 新增日历视图（`CALENDAR`）与看板视图（`BOARD`）类型，数据可视化展示方式更多样

🌟 [@Power](/zh/annotation/power) 新增 `copy` 权限开关，支持表格行一键复制

🌟 [@Layout](/zh/annotation/layout) 新增 `collapseActionButton` 配置，将查看详情、修改、删除按钮折叠到下拉菜单

🌟 新增 [`@GroupType` 注解](/zh/field-types/group)，支持将字段分组到可折叠面板中（`EditType.GROUP`）

🌟 [`@Erupt`](/zh/annotation/erupt) 与 [`@Edit`](/zh/annotation/edit) 注解新增 `prompt` 字段，用于 AI 智能体场景的提示词配置

🌟 新增 [`PASSWORD` 编辑类型](/zh/field-types/password)，密码字段独立渲染，传输更安全

🌟 搜索栏支持开放式搜索，INPUT、NUMBER 等组件支持用户自主选择等于、不等于、包含、范围等搜索操作符

🌟 动态下拉刷新：`ChoiceFetchHandler` / `AutoCompleteHandler` / `TagsFetchHandler` 支持按需重新加载选项

🌟 选择类 Handler 接口泛型化，回调中可直接访问表单其他字段，支持级联联动

🌟 新增[独立表单视图（`FormView`）](/zh/advanced/form-view)，提供专用后端接口与 `DataProxy.formViewBehavior` / `formSave` 钩子，适合单记录全页表单场景

🌟 Excel 导出支持仅导出已选中的行

🌟 密码加密算法从 MD5 升级至 SHA-512 + 盐值，安全性大幅提升，感谢 [段鹏鹏](https://gitee.com/erupt/erupt/pulls/35) 贡献的代码

🌟 Spring Boot 升级至 3.5.15

🌟 操作日志新增变更前实体数据记录，修改/删除前的字段值可在日志详情中完整查看

🌟 erupt-ai 新增 [Requesty](https://requesty.ai) LLM 提供商支持

🌟 OpenAPI 新增 `getAppid` 接口，支持通过 token 获取 appid 信息

🌟 [`EruptLambdaQuery`](/zh/advanced/erupt-dao-lambda) 新增 `or` 条件支持，可构建 OR 逻辑的复合查询

🌟 [erupt-cube](/zh/modules/pro/erupt-cube) 新增 `drillFields` 维度过滤与 `drillMeasure` 指标级下钻

🌟 [erupt-cube](/zh/modules/pro/erupt-cube) Cube 注解新增 `prompt` 字段，为 AI 语义分析提供字段级描述

🧩 `dependField` 改为 getter 风格引用，支持 IDE 字段名自动补全

🧩 [erupt-designer](/zh/modules/erupt-designer) 发布菜单时自动生成对应按钮权限

🐞 修复 Ollama 模型配置中缺少 `baseUrl` 参数的问题，感谢 [canjian215215](https://github.com/canjian215215) 贡献的代码

🎨 前端全面重构（erupt-web 2.0）
>  Angular 20 → 21，UI 层从架构到交互全面重写。

- 全新登录页、预加载动画，新增分栏菜单（Split Menu）模式
- 侧边栏宽度可拖拽、收藏夹支持拖拽排序，响应式布局优化
- 表格支持列拖拽排序、列固定、列密度调整，行复制、搜索状态持久化、可折叠搜索区域
- 左树右表布局树面板可折叠，表格-树形布局支持全屏模式
- **表格 / 树形视图内嵌 AI 侧边面板**，无需离开当前页即可 AI 辅助分析数据
- erupt-ai 聊天新增宽屏模式、会话搜索、输入历史导航
- 代码编辑器支持智能提示、全屏模式；附件组件支持拖拽排序与批量更新
- MultiChoice / Checkbox 新增全选按钮；Choice 支持颜色圆点可视化；输入框实时字数计数
- 树形视图支持排序、节点定位；BI / Monitor 模块全屏优化
- 终端模块（[erupt-terminal](/zh/modules/erupt-terminal)）UI 集成，支持多标签页动态切换与 WebSocket 实时通信
- 表格与弹窗新增动态按钮，可根据行数据状态动态控制按钮显示
- erupt-flow 审批组件 UI 全面重构，新增移动端响应式主从布局与无障碍优化
- TAGS 组件支持 `joinSeparator = "[]"` JSON 数组格式标签值解析

### 1.14.x → 2.0.0 升级指南

> 完整升级指南详见：[/zh/guide/upgrade](/zh/guide/upgrade)

**破坏性变更**

+ **密码加密算法升级**：密码加密从 MD5 升级为 SHA-512 + 盐值（Salt）。升级向后兼容——现有用户可继续使用原 MD5 密码登录；新建或重置的密码将使用 SHA-512 + 盐值加密。感谢 [段鹏鹏](https://gitee.com/erupt/erupt/pulls/35) 贡献此安全改进。
+ **`DataProxy.extraContent` 签名变更**：新增第二个参数 `Collection<Map<String, Object>> list`。覆盖了此方法的类需更新方法签名。
+ **`AutoCompleteHandler`、`ChoiceFetchHandler`、`TagsFetchHandler` 需要泛型参数**：`fetchFilter` 方法的 `formData` 参数（`Map<String,Object>`）已替换为实际模型对象（泛型 `T`）。
+ **Excel 导入模板格式从 `.xls` 改为 `.xlsx`**：已缓存或收藏导入模板下载链接的用户需重新下载。
+ **`@Search.vague` 属性已移除**：删除所有 `vague = true` / `vague = false` 配置即可，高级搜索现为默认行为。
+ **`EruptApiModel` 类已删除**：响应模型统一改为 `R<T>`，需将代码中的 `EruptApiModel.PromptWay` 替换为 `R.PromptWay`。
+ **`ChoiceTrigger` 接口已移除**：请使用 `@ChoiceType.fetchHandler` 替代。
+ **登录、修改密码接口改为 HTTP POST**：`/login`、`/change-pwd` 接口由 GET 改为 POST，自定义登录页需同步调整请求方式。

## 历史版本

1.x 各版本的更新日志与历史文档已拆分至 [历史版本](/zh/guide/history) 页面。
