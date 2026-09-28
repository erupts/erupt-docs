# 更新日志

## 2.3.0（2026-09-24） <Badge type="tip" text="Spring Boot 3.5.16" />

:::warning 升级须知
升级前请阅读 [V 2.3.0 升级指南](/zh/guide/upgrade#v-2-3-0-升级指南)：登录锁定默认开启、改密后其他会话下线、`app.js` 中 `logoPath: null` 改为不显示 Logo，并有[数据库变更](#数据库变更)。
:::

🦞 开源 [erupt-sso](/zh/modules/erupt-sso) 单点登录模块：OAuth2 授权码 + PKCE，内置 Keycloak、Okta、Auth0、Entra ID、GitHub、飞书、钉钉、企业微信、微信等 17 种[供应商预设](/zh/modules/erupt-sso#供应商预设)，选好类型贴上凭据即可；认证源在后台配置、不用重启，授权码在服务端交换，token 不经 URL 传递

🦞 开源 [erupt-comment](/zh/modules/erupt-comment) 记录评论模块：任意记录可评论，支持一级回复、置顶 / 已解决、表格行评论计数，@提及经 erupt-notice 通知并深链到该记录；`@Power(comment = false)` 可按模型关闭

🦞 开源 [erupt-ai-decision](/zh/modules/erupt-ai-decision) AI 决策模块：把「是否 / 选项 / 评分」三类判断交给 System One 决策模型，返回带概率分布的类型化答案，代码按阈值分支而不是解析一句话；支持 TypeSafe Jev 与可本地部署的开源 Laya

🦞 开源 [erupt-data-dingtalk](/zh/modules/erupt-dingtalk) 钉钉多维表与 [erupt-data-airtable](/zh/modules/erupt-airtable) 数据源，与飞书、Notion 共用同一套 REST 表格基座

🌟 新增 [ICON 图标选择](/zh/field-types/icon) 编辑组件：在完整的 Font Awesome 图标库中检索选取，表格直接渲染图标

🌟 新增 [KEY_VALUE 键值对](/zh/field-types/key-value) 编辑组件：编辑 JSON 对象，可存 String 或 JSON 列上的 `Map`

🌟 新增 [TRANSFER 穿梭框](/zh/field-types/transfer) 编辑组件：以可搜索的双列表处理多对多关联，`@MultiChoiceType(type = TRANSFER)` 让多选值列表也能用穿梭框

🌟 表格支持[多级表头](/zh/annotation/view#group-多级表头)：`@View(group)` 相同的相邻列合并到同一个上级表头，列设置仍按单列操作

🌟 [表单面板](/zh/guide/ui#表单面板)：记录表单支持居中 / 侧栏 / 全屏三种模式，切换不丢未保存内容；标题栏可上一条 / 下一条翻页、查看与编辑互切、复制链接、删除、AI 助手、打印，`?id=` 深链直接打开记录

🌟 [登录页布局](/zh/guide/ui#登录页布局)：新增 cover / wide / wallpaper / poster 四种布局与自定义登录图片（`theme.loginLayout` / `theme.loginBackground`），登录页上就能切换

🌟 [Workspace 与 Classic 皮肤](/zh/guide/ui#外观)：Workspace 是 Slack / 飞书式一体化导航框架，内置 32 组明暗色预设；Classic 是 Ant Design Pro 经典深色侧栏；Brutalist 皮肤按 raft.build 重绘

🌟 [安装为桌面应用（PWA）](/zh/guide/pwa)：manifest 按站点配置实时生成，顶栏充当可拖拽的窗口标题栏，`pwa.icon` / `pwa.shortcuts` / `faviconPath` 可定制

🌟 [双因素认证（MFA）](/zh/modules/erupt-upms/user#双因素认证-mfa)：TOTP 动态口令，用户在头像菜单自助绑定，密码正确后还要再输 6 位验证码才发放会话；恢复码单次有效并哈希存储，管理员可一键重置 MFA

🌟 [登录锁定](/zh/modules/erupt-upms/user#登录锁定)：同一账号 + IP 连续密码错误 10 次锁定 10 分钟（`erupt.upms.login-lock`），错误验证码同样计数；修改密码后该账号其他会话立即下线

🌟 erupt-notice 新增[认证源推送渠道](/zh/modules/erupt-notice#认证源推送渠道)：飞书、钉钉、企业微信、Slack 四个渠道直接借用 erupt-sso 的认证源凭据向用户推送通知，用户通过该认证源登录过即可送达，无需再单独配置机器人；`EruptSsoBindService` 可供其他模块读取用户在认证源侧的标识与资料快照

🌟 [erupt-generator 重写](/zh/modules/erupt-generator#从数据库导入)：从任意已注册数据源读取表结构直接生成实体类，注释成标题、外键成引用、注释里的枚举说明成 `@Choice`，代码编辑器抽屉预览，多选打包 zip 下载

🌟 [S3AttachmentProxy](/zh/modules/erupt-s3/upload)：`erupt-data-s3` 内置附件代理，`erupt.s3.*` 配好即可把全部附件上传到 S3 / MinIO / OSS / COS / R2；附件域名改由后端下发，不用再改 app.js

🌟 [erupt-remote SFTP 文件传输](/zh/modules/erupt-remote#sftp-文件传输)：SSH 终端旁新增文件面板，浏览远程目录、拖拽上传、下载、建目录、删文件，可按主机开关，与终端共用凭据与授权

🧩 新增 [`ViewType.AVATAR`](/zh/annotation/view#展示类型-viewtype) 圆形头像展示类型，用户表的头像列已采用

🧩 [`@Tree(maxLevel)`](/zh/annotation/tree#maxlevel-限制层级) 限制树的最大层级：前端不再提供越级的「添加子节点」，服务端拒绝任何会让节点更深的保存

🧩 [`@Layout(tableTruncate = false)`](/zh/annotation/layout#tabletruncate-单元格换行) 让超长单元格换行而非省略，操作列按钮多时不再被截断

🧩 [`@BoolType(type)`](/zh/field-types/boolean#控件类型) 可指定开关或单选，默认 AUTO：必填字段渲染为开关，其余为单选；表格中的空值不再显示空标签

🧩 [`theme.customizable = false`](/zh/guide/config-frontend) 可锁定外观（主题色、顶栏色、皮肤、菜单模式）让全员界面一致，明暗与紧凑仍由用户自选

🧩 `app.js` Logo 语义明确：不写取默认、`null` / `''` 不显示；折叠侧栏无 Logo 时显示站点首字母而非 Erupt 标识；新增 `faviconPath`

🧩 报表、设计器、图谱、AI 画布的「发布到菜单」可直接选择菜单图标

🧩 [个人资料与锁屏](/zh/modules/erupt-upms/user#个人资料与锁屏)：用户可自助修改头像与姓名（`LoginProxy.beforeUpdateProfile` 可否决），头像菜单新增锁屏，凭密码解锁且不产生新会话

🧩 IP 白名单支持 IPv4 / IPv6 CIDR 网段，感谢 [chenxiaolong8023](https://github.com/chenxiaolong8023) 贡献的代码

🧩 [erupt-atlas 使用方追溯](/zh/modules/erupt-atlas#使用方追溯)：模块通过 `EruptUsageProvider` 上报模型被谁使用（流程表单与自定义节点、菜单、Cube 仪表盘、打印模板、行操作表单），图谱视图改为自适应全屏宽度

🐞 修复开启 `redis-session` 且宿主应用用 `@ComponentScan` 扫描 `xyz.erupt` 时，定时任务因找不到 ShedLock `LockProvider` 而全部失败的问题；缺少锁时任务改为跳过并记入任务日志，不会在多节点上无锁执行

🐞 修复周选择器抛 RangeError 的问题

🐞 修复 `@Power(print = false)` 仍显示打印入口的问题

🐞 修复 `@View(column)` 在 COMBINE 字段上不显示的问题（Gitee IKGOKN）

🐞 修复 `@View(template)` 中 `item.xxx` 读到的是存储值而非单元格显示文案的问题

### 数据库变更

:::info
表结构变更由 JPA / Hibernate 在启动时自动执行，仅当项目禁用了自动 DDL（`spring.jpa.hibernate.ddl-auto=none` 或 `validate`）时才需手动执行。
:::

本版本涉及：

- `e_upms_user` 新增三列（MFA）
- `e_generator_class`、`e_generator_field` 新增列（引入 erupt-generator 时）
- `e_remote_host` 新增一列（引入 erupt-remote 时）

新引入的模块建表由 Hibernate 自动完成，无需手动执行：

- erupt-sso：`e_upms_sso`、`e_upms_sso_role`、`e_upms_sso_bind`
- erupt-comment：`e_record_comment`
- erupt-ai-decision：`e_ai_decision_def`、`e_ai_decision_model`、`e_ai_decision_question`

::: details 展开 SQL（MySQL 语法，其他数据库请自行转换）

**`e_upms_user` 新增字段（erupt-upms）**

```sql
ALTER TABLE e_upms_user ADD COLUMN mfa_enabled        BIT(1)        COMMENT '是否开启双因素认证';
ALTER TABLE e_upms_user ADD COLUMN mfa_secret         VARCHAR(64)   COMMENT 'TOTP 密钥';
ALTER TABLE e_upms_user ADD COLUMN mfa_recovery_codes VARCHAR(2000) COMMENT '恢复码哈希 JSON 数组';
```

**`e_generator_class` 新增字段（erupt-generator）**

```sql
ALTER TABLE e_generator_class ADD COLUMN super_class  VARCHAR(255) COMMENT '父类';
ALTER TABLE e_generator_class ADD COLUMN package_name VARCHAR(255) COMMENT '包名';
```

**`e_generator_field` 新增字段（erupt-generator）**

```sql
ALTER TABLE e_generator_field ADD COLUMN column_name    VARCHAR(255) COMMENT '列名';
ALTER TABLE e_generator_field ADD COLUMN java_type      VARCHAR(255) COMMENT 'Java 类型';
ALTER TABLE e_generator_field ADD COLUMN length         INT          COMMENT '长度';
ALTER TABLE e_generator_field ADD COLUMN type_code      VARCHAR(255) COMMENT 'JDBC 类型编码';
ALTER TABLE e_generator_field ADD COLUMN primary_key    BIT(1)       COMMENT '是否主键';
ALTER TABLE e_generator_field ADD COLUMN auto_increment BIT(1)       COMMENT '是否自增';
```

**`e_remote_host` 新增字段（erupt-remote）**

```sql
ALTER TABLE e_remote_host ADD COLUMN file_transfer BIT(1) DEFAULT b'1' COMMENT 'SSH 主机是否允许 SFTP 文件传输';
```

:::

## 2.2.0（2026-09-15） <Badge type="tip" text="Spring Boot 3.5.16" />

:::warning 破坏性变更
升级前请阅读 [V 2.2.0 升级指南](/zh/guide/upgrade#v-2-2-0-升级指南)。

**erupt-designer 数据迁移到内嵌 SQLite**：业务数据不再存放于主库 `e_designer_data` 表，**不会自动迁移**，该文件需单独纳入备份与持久化卷。

另有数据库表结构变更，见本版本末尾的[数据库变更](#数据库变更-1)。
:::

🦞 开源 [erupt-atlas](/zh/modules/erupt-atlas) 模型图谱模块：注解里已有的关系直接画成图，含血缘追溯、依赖分层、模块耦合矩阵、影响面分析，以及循环引用 / 共享表 / 孤岛模型的结构体检

🦞 开源 [erupt-remote](/zh/modules/erupt-remote) 远程访问模块：浏览器内直连远程主机，VNC 桌面与 SSH 终端共用一条 WebSocket，凭据 AES-GCM 加密存储，VNC 认证由服务端代答，密码不下发到前端

🌟 表格新增[多维表格能力](/zh/annotation/power#celledit-单元格编辑)：双击单元格就地改一个字段，无需打开行表单。服务端按整行校验，`DataProxy`、操作日志与事件的表现同表单提交完全一致；模型级 `@Power(cellEdit)` 与字段级 `@Edit(cellEdit)` 两级开关

🌟 文本字段新增 [表单 AI 写作助手](/zh/modules/erupt-ai/writing-assistant)：以同表单其他字段为背景，生成 / 润色 / 续写 / 缩写 / 扩写字段内容，SSE 流式返回且不落库，`@Edit(prompt)` 即该字段的写作指引

🌟 [erupt-ai 支持多模态对话](/zh/modules/erupt-ai/chat#多模态对话)：回形针按钮或剪贴板粘贴即可上传图片，与文本一并发给大模型；图片随消息持久化，重建历史上下文、重新生成、编辑重发时一并带上

🌟 新增 [Liquid Glass 液态玻璃皮肤](/zh/modules/erupt-web#主题与皮肤)：侧边栏是一块带背景模糊与高光边缘的半透明玻璃面板，悬浮在环境色场之上，与默认、Brutalist 皮肤在设置抽屉中一键切换

🌟 新增[暗色主题](/zh/modules/erupt-web#主题与皮肤)：亮色 / 暗色 / 跟随系统三档，跟随系统随 OS 实时切换，图表、代码编辑器、Markdown 预览同步适配；紧凑模式可与之自由组合

🌟 [TPL 字段](/zh/field-types/tpl#与表单通信)与表单双向通信：模板可读取同表单全部字段值，也能回写 formData 与 editExpr，自定义编辑器不再是信息孤岛

🧩 [主题色与顶栏色](/zh/modules/erupt-web#主题与皮肤)支持取色器自定义并记住选择，默认主题色调整为 `rgb(22, 119, 255)`

🧩 [菜单布局](/zh/modules/erupt-web#主题与皮肤)新增单列 / 分栏 / 双列三种模式，双列为一级图标栏 + 所选分类子菜单；侧边栏折叠时可在图标下方显示菜单名

🧩 亮色主题下可单独启用[深色侧边栏](/zh/modules/erupt-web#主题与皮肤)

🧩 [登录页](/zh/modules/erupt-web#主题与皮肤)新增皮肤下拉与主题色取色器，登录前就能把界面调成想要的样子

🧩 多标签页增强：行操作或链接打开的非菜单页面（远程主机、AI 画布、Cube 仪表盘、表单设计器）按其数据命名标签，返回时自动关闭

🧩 菜单树默认只展开一级，菜单较多时不再一次铺满屏幕

🧩 图标库升级至 Font Awesome 7，可用图标由 675 个增加到 1992 个，FA4 旧类名继续可用

🧩 微前端容器改用 iframe 沙箱，Vite / ESM 构建的子应用可正常加载，多个微前端菜单可同时打开

🧩 菜单新增[微前端链接类型](/zh/modules/erupt-upms/menu)：目标站点拒绝被 iframe 嵌入时，改在微前端容器中打开

🧩 甘特图与 Markdown 编辑器按需加载，页面真正用到时才拉取依赖

🧩 [TEXTAREA](/zh/field-types/textarea#配置项) 新增配置项：最大长度、可见行数区间，以及 `@` / `#` 提及（静态候选项 + `TagsFetchHandler` 动态候选项，服务端按需下发）

🧩 [AUTO_COMPLETE](/zh/field-types/auto-complete#静态候选项) 支持 `values` 静态候选项，`handler` 不再必填

🧩 [NUMBER](/zh/field-types/number) 数值输入框不再响应鼠标滚轮，滚动页面时不会误改数值

🧩 树视图标签支持 [@EruptI18n](/zh/advanced/i18n) 多语言翻译，菜单管理等树形页面不再固定显示中文

🧩 [erupt-designer](/zh/modules/erupt-designer#数据存储) 数据改存内嵌 SQLite：每个已发布设计对应一张真实表，过滤 / 排序 / 分页全部下推为 SQL，不再受宿主数据库类型影响

🧩 [erupt-ai-canvas](/zh/modules/erupt-ai-canvas) 增强：一个画布可绑定多个数据模型并分别配置增 / 改 / 删权限，生成改为异步轮询，新增页面校验与发布版本

🧩 AI 对话输入栏新增[模型选择器](/zh/modules/erupt-ai/chat#模型选择器)，存在多个已启用模型时可随时切换，`?llm=` 锁定模型时自动隐藏

🧩 AI 回复语言跟随控制台当前语言，不再无论用什么语言提问都倾向中文作答

🧩 新增 [`erupt.ai.request-timeout`](/zh/modules/erupt-ai/) 配置，LLM 请求读超时默认放宽到 15 分钟（langchain4j 默认 60 秒，长文本非流式生成会被截断）

🧩 [erupt-print](/zh/modules/erupt-print) 打印模板内容改用 CKEditor 编辑，与前端打印模板编辑器的存储格式（Velocity 占位符 + 组件标记）保持一致

🧩 新增[匿名遥测](/zh/guide/telemetry)，仅上报版本、模块等匿名信息，可随时关闭

🧩 用户与角色列表不再按创建人过滤，可见性统一由菜单与角色权限决定，**升级后请复核这两个菜单的授权范围**，详见[升级指南](/zh/guide/upgrade#v-2-2-0-升级指南)

🧩 WebSocket 推送改为按连接异步队列，业务线程不再被慢客户端阻塞

🧩 ip2region 改为按需加载 xdb 文件，不再随包分发内置库

🐞 修复 erupt-api 返回 Map / Collection 时绕过 Gson 安全序列化，导致 64 位 ID 在浏览器端精度丢失的问题

🐞 修复开启 `redis-session` 后定时任务崩溃的问题，改为从 Spring 容器获取 LockProvider，感谢 [chenxiaolong8023](https://github.com/chenxiaolong8023) 贡献的代码

🐞 修复子表临时主键不稳定导致行数据错乱的问题

🐞 修复拖拽排序时占位行与测量行也带出拖拽手柄的问题

🐞 修复设计器复制字段时沿用原字段 id 的问题


### 数据库变更

:::info
表结构变更由 JPA / Hibernate 在启动时自动执行，仅当项目禁用了自动 DDL（`spring.jpa.hibernate.ddl-auto=none` 或 `validate`）时才需手动执行。
:::

本版本涉及：新增 `e_ai_canvas_model` 表；`e_ai_canvas` 迁移后删除两列；`e_ai_chat_message` 新增一列；`e_designer_data` 不再使用。引入 [erupt-remote](/zh/modules/erupt-remote) 时会新建 `e_remote_host` 表，由 Hibernate 自动创建。

::: details 展开 SQL（MySQL 语法，其他数据库请自行转换）

**`e_ai_canvas_model` 新增表（erupt-ai-canvas）**

```sql
CREATE TABLE e_ai_canvas_model
(
    id           BIGINT NOT NULL AUTO_INCREMENT,
    canvas_id    BIGINT,
    data_type    VARCHAR(255),
    model        VARCHAR(255),
    purpose      VARCHAR(255),
    allow_add    BIT(1),
    allow_edit   BIT(1),
    allow_delete BIT(1),
    PRIMARY KEY (id)
);
ALTER TABLE e_ai_canvas_model ADD CONSTRAINT fk_ai_canvas_model_canvas FOREIGN KEY (canvas_id) REFERENCES e_ai_canvas (id);
```

**`e_ai_canvas` 字段调整（erupt-ai-canvas）**

数据模型绑定移入 `e_ai_canvas_model`，原单模型字段不再使用。**先迁移数据，再删除旧列**：

```sql
INSERT INTO e_ai_canvas_model (canvas_id, data_type, model, allow_add, allow_edit, allow_delete)
SELECT id, data_type, target_model, 0, 0, 0 FROM e_ai_canvas WHERE target_model IS NOT NULL;

ALTER TABLE e_ai_canvas DROP COLUMN data_type;
ALTER TABLE e_ai_canvas DROP COLUMN target_model;
```

**`e_ai_chat_message` 新增字段（erupt-ai）**

```sql
ALTER TABLE e_ai_chat_message ADD COLUMN images LONGTEXT COMMENT '用户消息携带的图片附件路径 JSON 数组';
```

**`e_designer_data` 不再使用（erupt-designer）**

设计器业务数据改存内嵌 SQLite（默认 `data/designer.db`），该表不再被读写，**Hibernate 也不会再自动删除它**。数据不会自动迁移，请确认已无需要保留的数据（或已导出）后再手动删除：

```sql
-- 删除前务必确认数据已迁移或不再需要，该操作不可逆
DROP TABLE e_designer_data;
```

设计配置表 `e_designer` 仍在使用，请勿删除。

:::

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
| [erupt-data-s3](/zh/modules/erupt-s3/) | S3 对象存储数据源 |

🌟 [erupt-cube](/zh/modules/pro/erupt-cube/sql) 新增 SQL Port：PostgreSQL 兼容协议端口（基于 Calcite 查询下推），任意 BI 工具可像连接 PostgreSQL 一样直连语义层

🌟 [erupt-ai-claw](/zh/modules/erupt-ai-claw/) 增强：沙箱化文件与 Shell 工具、Agent Skills 技能库与技能沉淀、Erupt 模型增删改查工具箱、JVM 与 Spring 运行时诊断工具

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

🧩 [erupt-ai](/zh/modules/erupt-ai/) 支持嵌入式聊天模式，LLM 的 apiKey 改用密码视图掩码展示

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

🌟 [erupt-ai](/zh/modules/erupt-ai/prompt#llmrequest-请求级扩展)：LLM 请求支持 `agentPrompt` 与 `contextPrompt`，可按调用场景注入上下文感知提示词

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
