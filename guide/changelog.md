# 更新日志

## 1.14.2（2026-04-27） <Badge type="tip" text="Spring Boot 3.5.13" />
🐞 修复日期区间查询时分秒不生效的问题

🧩 修复 erupt-ai 切换会话时流式输出内容不会继续保持的问题

🧩 多页签场景下 iframe tpl 嵌入支持切换时UI 不刷新

🌟 新增 [erupt-test](https://github.com/erupts/erupt/tree/master/erupt-test/src/test/java/xyz/erupt/test) 模块，提供完整单元测试用例

🌟 优化启动日志样式

🌟 [默认语言](/guide/configuration)切换为 en-US，默认菜单数据使用英文存储

🌟 erupt-flow 支持子流程延迟发起

🌟 erupt-ai 聊天 UI 全面升级，支持语音播放、重新提问、会话折叠等交互

🌟 erupt-ai 支持 diff 与 echart 渲染

🌟 树节点渲染性能大幅提升，配合虚拟滚动可毫秒级展示 10W+ 节点

🌟 新增数据建模与可视化分析模块 [erupt-cube](https://www.erupt.xyz/#!/cube)

## 1.14.1（2026-04-13） <Badge type="tip" text="Spring Boot 3.5.13" />
:::info
全面拥抱 AI Harness 工程，实现 🦞 能力，支持：MCP、SKILL、Memory、ReAct、上下文工程等
:::

🐞 修复表格列宽拖动失效的问题

🐞 修复 `Date` 类型修饰 Erupt 对象时默认使用 UTC 时间的问题

🐞 修复编辑场景下 `@OnChange` 注解导致后端联动值覆盖数据库原始数据的问题

🐞 修复 `@JoinColumn` 注解 `referencedColumnName` 配置不生效的问题，感谢 [jx2047](https://github.com/jx2047) 贡献的代码

🧩 时间字段导出 Excel 时，自动根据用户当前语言环境格式化时间 `#98d579`

🧩 erupt-flow 新增多种审批方式：由其他节点分配审批人、发起人自选审批人、分管领导审批

🧩 erupt-flow 新增办理节点，优化流程画布交互体验与功能排版

🧩 重构时间格式处理逻辑，统一采用 ISO 8601（`yyyy-MM-dd'T'HH:mm:ss.SSS`）进行交互，返回时间自动跟随浏览器语言环境格式化，对国际化场景更加友好

🦞 开源 [eurpt-ai-claw](https://www.yuque.com/erupts/erupt/hnx1hac9acfacb0v) 模块，可通过 AI 操作任意 Erupt 数据，支持 Skill、File、Shell 调用等能力

🌟 Spring Boot 版本升级至 3.5.13

🌟 eruptUser 新增分管组织字段，并新增 `e_upms_user_org_division` 表用于存储分管组织数据

🌟 erupt-ai 增加安全策略，AI 对话能力不再开放给所有用户，后端 API 使用菜单权限隔离此入口

🌟 erupt-ai 完全重构：前端基于 Angular 重新构建，后端使用 Langchain4j 重写，AI Tool 声明改为方法级

🌟 erupt-ai LLM 新增 Claude、Gemini、Doubao 支持

🌟 erupt-ai 支持调用外部 MCP Server

🌟 erupt-ai 支持通过 ReAct 模式智能调度已注册的 AI 工具，并展示推理过程

🌟 新增 skill 文件，方便 AI 与 erupt 更好的交互：[SKILLS](https://github.com/erupts/erupt/tree/master/.claude/skills/erupt)

🌟 开源 [erupt-vote](https://www.yuque.com/erupts/erupt/dlh141yu2xl1glrz) 投票插件，感谢 [@PPLINGHUFEI](https://gitee.com/PPLINGHUFEI) 的贡献

🌟 EruptMenu 菜单数据统一以英文存储，前端页面自动翻译为对应语言展示

### 1.13.x → 1.14.x 升级指南
**升级注意事项**

删除项目目录下的 `.erupt/erupt-ai.loaded` 文件后重启服务，系统将重新生成 AI 模块菜单。

**破坏性变更**

+ **时间格式调整**：统一为 ISO 8601 标准格式（`yyyy-MM-dd'T'HH:mm:ss.SSS`）。直接对接 Erupt API 的前端需手动处理时间格式化，建议使用 `new Date(date).toLocaleString()` 进行转换。
+ **配置项重命名**：`erupt.ai.mcp.enabled` 已更名为 `erupt.ai.mcp.server-enabled`，请同步更新配置文件。
+ **AI Tools 声明方式变更**：功能方法的注解声明从类级别调整为方法级别，需同步修改相关代码，详见：[Erupt AI 大模型深度集成](/modules/erupt-ai#jA3q1)。
+ 用户管理新增分管组织能力，数据库新增 `e_upms_user_org_division` 表。

```plsql
create table e_upms_user_org_division (
  "id"           BIGINT not null,
  "division_org" BIGINT,
  constraint "FKh6drd4cu855cb3c7ei2ebh3cl"
  foreign key ("id") references "e_upms_user"
);
```

## 1.13.3（2026-02-04） <Badge type="tip" text="Spring Boot 3.5.9" />
🐞 修复 **TAB_TREE** 组件数据无法持久化数据的 bug (会导致角色菜单无法保存)

🐞 修复 @VL 注解 color 配置失效的 bug

🐞 修复 notice 在分页时会一直加载的 bug

🐞 修复 erupt-job 启动报错的 bug

🧩 优化 CkEditor 组件，给予初始高度，解决有概率加载失败的问题

🧩 优化 LocalDateTime 类型的 Gson 适配，支持读写 LocalDate 类型的数据

🧩 大模型名称调整 QWen 调整为 Qwen

🧩 erupt-notice 消息列表支持按照场景分组

🌟 @Tpl 注解支持跳转 Angular 路由，并且可以将当前行的数据作为 URL 参数，语法：/{field}

🌟 erupt-ai 支持渲染数学公式与流程图

🌟 erupt-ai [MCP](/modules/erupt-ai#SjygW) 增加 Open API 授权机制

🌟 erupt-flow 支持自定义打印模板的能力

🌟 所有弹出层都支持通过拖拽调整位置

🌟 支持控制全局 UI 主题色，主色不再是蓝色可自由定义（[#app.js](/guide/configuration#eqee9)）

## 1.13.2（2026-01-05） <Badge type="tip" text="Spring Boot 3.5.9" />
🐞 修复 erupt-ai 在实现 EruptPromptHandler 后项目无法启动的问题

🐞 修复 erupt-mongodb 排序参数不生效的 bug  
🐞 修复一对多组件使用 Date 类型时，表格日期比表单少一天的误差

🐞 修复 erupt-magic-api 路径 bug，感谢 [aurthurxlc](https://github.com/aurthurxlc) 贡献的代码 [#330](https://github.com/erupts/erupt/pull/330)  
🧩 @Readonly 注解默认放开前端传值，可通过 @Readonly(allowChange = false) 关闭信任

🌟 增加排序按钮，可灵活配置多字段排序

🌟 [MCP](/modules/erupt-ai#SjygW) 能力增加鉴权控制及默认实现，支持 Cursor 等工具交互访问 erupt 实体数据

🌟 Erupt-AI 增加了新的大模型支持：Grok/Fireworks/MinMax/Mistral/OpenRouter/Together

🌟 [LambdaQuery](/advanced/erupt-dao#mxI1r) 新增 Page 分页 API，链式调用更顺滑  
🌟 联动能力中 @ChoiceType.dependExpr 正式退役，请使用 [@ChoiceType.fetchHandler](/field-types/choice#S1jRs) 替代  
🌟 开源 [**erupt-notice** ](/modules/erupt-notice) 公告、站内信、邮件、短信一键发送，消息触达零门槛  
🌟 @Edit 支持 [**onchange**](/advanced/dynamic-form) 配置，值变更即可**动态驱动注解**配置，实现任意表单联动  
🌟 可视化能力全面升级，支持：[**甘特图**、**卡片视图**](/annotation/vis)、自定义视图、表格视图，数据展示更直观  

🌟 在 IDEA 中配置 erupt 注解时值将会**高亮显示**，写配置如写代码

  
🌟 继承 MetaModel / HyperModel 时，无用户上下文也能自动写入创建、更新字段，审计字段零代码

🌟 升级 spring boot 版本至 3.5.9

🌟 升级前端版本至 Angluar 20，使用 Vite 构建，编译速度提升 3 倍

## 1.13.1（2025-11-08） <Badge type="tip" text="Spring Boot 3.5.6" />
**🐞** 修复 erupt-magic-api，前置网关使用 https 协议反向代理服务的错误。 [#330](https://github.com/erupts/erupt/pull/330#pullrequestreview-3428778630)，感谢 [aurthurxlc](https://github.com/aurthurxlc) 的贡献

🧩 移除令人诟病的 @OneToMany 的负数 id 处理逻辑，由前端处理相关数据，解决所带来的各类 bug [#65](https://github.com/erupts/erupt/issues/65)

🧩 HyperModel 衍生类不会生成外键，允许关联用户被删除，删除后用户数据会返回 null

🧩 修改查询接口 sort 参数的传参方式，防止 SQL 注入

🧩 解决 TAB 组件不按照声明顺序渲染的问题

🌟 左树右表支持选择父节点能看到下面所有子级数据的能力

🌟 增加 [EruptTag](/advanced/extend) 注解，修饰于 erupt 同级的注解，修饰后的注解值会返回给前端

🌟 新增 [DataProxy 全局拦截器](/advanced/post-data-proxy)，全局拦截任何 erupt 类的行为 [#3364ab](https://github.com/erupts/erupt/commit/3516a0f2b3e6b4437cd2d84e4f4489a3ff3364ab)

🌟 dataProxy 增加 [validate](/advanced/data-proxy#dtOCn) 方法用于自定义检验 erupt 数据是否符合规则 [#1f0a64](https://github.com/erupts/erupt/commit/54a2142b55f82ea0c97735c1b515d6d2a71f0a64)

🌟 ShowBy 注解更名为 [Dynamic](/annotation/dynamic)，且支持动态的必填、只读、显示等动态能力

🌟 EruptUser 增加负责组织字段，用于配置组织负责人的身份信息

🌟 支持 OAuth2 授权，可轻松对接飞书、Google等平台的用户体系 [单点登录 （OAuth2）](/advanced/auth)

🌟 EruptUser 表增加头像字段，支持通过 API 写入的用户头像且展示（OAuth2 场景）

🌟 新增[签名组件](/field-types/signature)，用于审批签字等场景

🌟 erupt-ai 支持 [MCP](/modules/erupt-ai#SjygW)

🌟 全面支持 **Spring Boot 3.0**，JDK 最低版本要求 17

> 1.12.x 升级 1.13.x 请务必参考：[/guide/upgrade](/guide/upgrade)
>

## 1.13.1-SNAPSHOT（2025-09-28） <Badge type="tip" text="Spring Boot 3.5.6" />
🧩 HyperModel 衍生类不会生成外键，允许关联用户被删除，删除后用户数据会返回 null

🌟 EruptUser 增加负责组织字段，用于配置组织负责人的身份信息

🌟 支持 OAuth2 授权，可轻松对接飞书、Google等平台的用户体系 [单点登录 （OAuth2）](/advanced/auth)

🌟 EruptUser 表增加头像字段，支持通过 API 写入的用户头像且展示（OAuth2 场景）

🌟 新增[签名组件](/field-types/signature)，用于审批签字等场景

🌟 erupt-ai 支持 [MCP](/modules/erupt-ai#SjygW)

🌟 全面支持 **Spring Boot 3.0**，JDK 最低版本要求 17

> 注意：这是一个快照版本，使用这个快照版本需要在 pom.xml 中配置 SNAPSHOT 仓库地址
>
> 1.12.x 升级 1.13.x 详见：[/guide/upgrade](/guide/upgrade)
>

```xml
<repository>
  <id>central-snapshots</id>
  <url>https://central.sonatype.com/repository/maven-snapshots/</url>
  <snapshots>
    <enabled>true</enabled>
  </snapshots>
</repository>
```

## 1.12.23（2025-08-08） <Badge type="tip" text="Spring Boot 2.7.18" />
**🐞** 修复 EruptEditEvent 传递修改前数据对象时，数据内容不准确的 bug

**🐞** 修复 refreshTime 自动刷新时每次都会回到第一页的 bug

**🐞** 修复 erupt-magic-api 在多层反向代理场景下 https 识别不准确的问题

**🐞** 修复表格行数据大于100开启虚拟滚动时列头不随内容滚动的 bug [#298](https://github.com/erupts/erupt/issues/298)

🧩 移除导航栏多余的首页导航标记

🧩 @View→@Tpl 注解支持通过抽屉方式打开

🧩 [lambdaQuery](/advanced/erupt-dao#mxI1r) 支持链式调用执行 delete 方法，感谢 [luoben137](https://github.com/luoben137) 贡献的代码 [#314](https://github.com/erupts/erupt/pull/314) 

🧩 前端暴漏全局函数 [window.safeHtml](/advanced/frontend-notify#lFjOs) 接收 html 作为参数,转换为angular可渲染的标签，用于自定义前端组件

🧩 eruptSiteConfig.title 支持配置空字符串，如果为空字符串则会隐藏浏览器导航栏标题后缀

🧩 表格宽度支持会按照语言自动缩放，确保在葡萄牙语，法语等场景表格展示足够美观

🧩 简化 HyperMode.java 与 MetaModel.java 的继承层级，避免多层级字段一样导致序列化错误的问题

🧩 如果对象继承自 [MetaModel](/advanced/utils) 时，eruptDao.persist 与 eruptDao.merge可实现人和时间字段自动填充

🧩 Excel 模板导出时 Choice 组件下拉项支持全量渲染（解决下拉列表最多255的限制）

🌟 [新增德语、葡萄牙语、印尼语、阿拉伯语支持](/advanced/i18n#TTkZY)

🌟 数据库注释信息支持[多语言生成](/advanced/i18n#MiihI)（新增字段与表时时生效）

🌟 新增 [Markdown](/field-types/markdown) 组件的支持，感谢 [ssdlm_aifast](https://gitee.com/ssdlm_aifast) 贡献的代码[#12](https://gitee.com/erupt/erupt-web/pulls/12)

## 1.12.21 (2025-05-26) <Badge type="tip" text="Spring Boot 2.7.18" />
**🐞** 修复erupt-ai通义千问无法响应的 bug

**🐞** 修复erupt-ai带有上下文路径时404的问题

**🐞** 修复erupt-ai创建会话时内容太多会超过数据库长度的问题

**🐞** 修复erupt-ai智能体提示词动态处理器不可用的问题

**🐞** 修复代码生成功能无法正常显示的 bug

**🐞** 解决lambdaQuery listSelects中存在父类字段无无法提取的 bug

**🐞** 修复tableWidth配置px等单位无效的bug（注意：升级后需手动添加px单位）

**🐞** 修复Excel导入时ISO 8601规范的日期格式和数据库的TIMESTAMP格式导致异常[#308](https://github.com/erupts/erupt/pull/308)，感谢[hply](https://github.com/hply) 贡献的代码

🧩 erupt-ai优化大模型调用参数，提升模型效果与回复稳定性

🧩 erupt-tenant角色页面支持绑定用户

🧩 app.js支持logoFoldPath配置，用于展示折叠菜单后的图标

🧩 LambdaQuery 新增 distinct 方法，用于数据库维度的去重

🧩 数据库异常信息页面可视化，兼容 PG、Oracle、Sql Server

🧩 自定义按钮折叠时支持显示图标

🧩 主题切换区域支持拖动调整位置

🌟 左侧菜单折叠后支持配置折叠后的图标（[app.js增加logoFoldPath配置](/guide/configuration#eqee9)）

🌟 自定义按钮支持显示自定义内容而不是图标（[仅需配置icon=""即可](/annotation/row-operation#UApIg)）

🌟 表格操作区支持自定义宽度（[@layout注解增加tableOperatorWidth配置](/annotation/layout)）

🌟 页面上方的全局自定义按钮支持自定义内容显示（[r_tools 增加 render配置](/guide/configuration#eqee9)）

🌟 页面上方用户工具栏，支持自定义按钮（[app.js增加userTools配置](/guide/configuration#eqee9)）

## 1.12.20 (2025-04-22) <Badge type="tip" text="Spring Boot 2.7.18" />
🧩 时间快捷选择支持昨日

🧩 EruptDao LambadQuery支持 not in

🧩 slider 组件支持 0.x 步进，调整step参数类型为float

🧩 Layout 注解增加 [tableWidth](/annotation/layout#grAm1) 配置，用于手动定义表格的总宽度  
🧩 Choice 组件增强联动能力易用性，[Choice 组件联动机制从前端联动改为后端联动](/field-types/choice#S1jRs)

🌟 MultiChoice 组件支持[联动](/field-types/multi-choice#rrSly)能力

🌟 erupt-jap 支持多对一对象[ with 语法的 lambda 查询 ](/advanced/erupt-dao#E78b8) 

🌟 [开源erupt-ai模块](/modules/erupt-ai)

+ 支持多模型：ChatGpt、Olama、DeepSeek、GML、Gemini、Moonshot等
+ 支持智能体、Function Call、交互式聊天

## 1.12.19 (2025-02-24) <Badge type="tip" text="Spring Boot 2.7.18" />
**🐞** 修复自定义按钮模板弹出层高度失效的bug

**🐞** 修复一对多场景@View show配置不生效的bug

**🐞** 修复erupt-job如果任务过期会导致项目无法无法启动的bug

**🐞** 修复表格虚拟滚动时底部会留白的bug

🧩 升级erupt-web 至 angluar 16

🌟 TAB_TABLE_REFER 组件支持根据其他组件的值自动过滤的能力 感谢[zzy-jonay](https://github.com/zzy-jonay)贡献的代码 [#294](https://github.com/erupts/erupt/pull/294) [#79](https://github.com/erupts/erupt-web/pull/79)

🌟 drill 组件支持按钮折叠

🌟 自定义按钮，多行模式时支持折叠

🌟 树节点刷新后保持搜索状态

🌟 左树右表 dependNode = true 时支持默认选中

## 1.12.18 (2025-01-20) <Badge type="tip" text="Spring Boot 2.7.18" />
**🐞** 修复数据库异常不显示中文提示的 bug

**🐞** 修复 i18n 文件如果引号中携带逗号读取错位的 bug

**🐞** 解决 id 超过 js 极限数值长度导致精度丢失的 bug

**🐞** 解决搜索场景与导入场景参数传递不一致的 bug

🧩 源代码中移除 erupt-flow 模块 （bug较多，原作者继续打磨）

🧩 升级amis版本到6.10版本

🧩 搜索时自动去除首尾空格

🧩 修改 erupt-magic-api 默认图标与名称

🧩 修改菜单时当前用户无需重新登录，刷新后自动生效

🧩 erupt-tenant 修复已知 bug，租户管理增加联系人字段

🧩 抽屉形式的弹出层将不会渲染页头，同时使用更加友好的宽高适应度

🌟 支持初始化时[默认账号密码配置](/guide/configuration#h3nEy)

🌟 自研 session 实现，非 redisSession 场景将不依赖 cookie，

🌟 支持非 redisSession 场景下在线用户查看能力

🌟 增加多选组件 [**MULTI_CHOICE**](/field-types/multi-choice)

🌟 erupt-tpl支持[ path 路径传参](/modules/erupt-tpl#IBWWA)并且通过模板引擎通过变量名称获取。

🌟 在线日志支持搜索，链接跳转，优化日志样式  
🌟 erupt-bi 报表增加文本提示组件

🌟 dataProxy 支持 [alert](/advanced/data-proxy#fQSPY) 能力，在渲染数据的同时增加全局提示

🌟 [引入微前端能力](/modules/erupt-tpl#m2B26)，自定义模板支持**微前端**方式嵌入

🌟 自定义按钮 @Tpl 注解支持微前端方式渲染

## 1.12.17 (2024-12-16) <Badge type="tip" text="Spring Boot 2.7.18" />
**🐞** 解决commons-io版本冲突导致excel导入功能异常的bug

**🐞** 解决gson number序列化结果被科学计数法与Integer类型上传内容带.0的问题

🧩 优化excel导入，解决如果修饰类型为string，单元格类型为数值则结果带.0的问题

🧩 优化window浏览器滚动条样式，统一使用mac风格

🌟 新增erupt-cloud-server docker镜像，可通过docker的方式快速部署分布式server端 [#284](https://github.com/erupts/erupt/pull/284)

> 感谢 [Barcke](https://github.com/Barcke) 贡献的代码
>

🌟 自定义按钮支持折叠配置 [fold](/annotation/row-operation)，可将自定义按钮折叠展示, 适用于按钮过多的场景

🌟 erupt 支持增、删、改事件传递，监听erupt系统类与第三方类的变化，用于解耦 [🪡 监听Erupt类变化](/advanced/event-listener)

🌟 Excel 导入能力支持按需导入，自由定义导入时插入或更新等操作 [⚔️ 自定义数据逻辑（ DataProxy ）](/advanced/data-proxy#dtOCn)

🌟 @erupt 注解支持[自定义UI注解](/advanced/extend)，可以将其他类注解的信息传递给前端，用于自定义解析，扩展注解边界

🌟 开源 [erupt-websocket](/modules/erupt-websocket) 模块，可在任何地方执行前端JS脚本，用于错误提示，异步结果通知等频繁交互场景

🌟 erupt-tenant 兼容 erupt-bi 可开发租户报表

🌟 erupt-tenant 支持域名控制，通过域名控制网页标题，图标，国际化语言，水印等信息

## 1.12.16 (2024-11-14) <Badge type="tip" text="Spring Boot 2.7.18" />
**🐞** 解决表格场景一对多不触发查询的bug

**🐞** 解决 excel 导入数值时，单元格格式为string无法正常导入的bug

🧩 优化 excel 导入时，部分场景出现最后一行空行导入空json的问题（感谢[hply](https://github.com/hply)贡献的代码）  [#269](https://github.com/erupts/erupt/pull/269)

🧩 调整导出引擎为 XSSF ,倾向功能而非内存控制，允许dataProxy中的excelExport获得完整的内存数据

🧩 优化 checkbox UI无数据时不会空白显示

🧩 解决excel导入数值时数值过大会显示为科学计数法的问题

🧩 ifRender启动时不会自动执行，确保动态渲染函数在合适的时机执行

🧩 自定义按钮渲染默认是增加：[MULTI_ONLY](/annotation/row-operation#UApIg)，该模式多行按钮不会显示在单行中

🧩 新增 [DataProxyContext](/advanced/data-proxy#VHBn6) 工具类，支持在DataProxy中通过上下文的方式获取当前类对象与参数等数据

🌟 表格支持按[单元格设置颜色](/advanced/data-proxy#EINcZ)

🌟 表格支持按行数据动态调整编辑与删除能力 [⚔️ 自定义数据逻辑（ DataProxy ）](/advanced/data-proxy#BPV07)

🌟 新增多租户插件，适合企业开发SaaS应用 [多租户 erupt-tenant](/modules/erupt-tenant)

注：当前版本有依赖冲突的问题，会导致下载功能异常，临时解决方案：pom.xml增加如下配置，锁定commons-io版本

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>commons-io</groupId>
      <artifactId>commons-io</artifactId>
      <version>2.16.1</version>
      <scope>compile</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```

## 1.12.15 (2024-08-26) <Badge type="tip" text="Spring Boot 2.7.18" />
**🐞** 解决数值组件手动清除再查询会报错的bug [#](https://github.com/erupts/erupt-web/commit/50c85c1dd6256ea27510b32cb2775ce1ce689068)

**🐞**** **解决 ueditor 拖动上传图片保存不成功的问题 [#](https://github.com/erupts/erupt-web/commit/c284ee1b67f31e892a474a34cf4be454dad105ef)

**🐞**** **修复分页时选中按钮的删除状态未清除的bug [#](https://github.com/erupts/erupt-web/commit/81319fd296f45cc84ea703c4f6822484669c8d73)

**🐞**** **修复 bi 数据表组件声明顺序与渲染顺序不一致的问题 [#](https://github.com/erupts/erupt-web/commit/3f20d0fc02cf9c58ee5549e6bc8455d7f4fc7364)

**🐞**** **修复 bi 时间区间组件清空时查询条件报错的问题 [#](https://github.com/erupts/erupt-web/commit/7bf44e92b4ed76f60cc0d55cf7d22fa087e85379)

**🐞**** **修复级联查询时二级弹出有可能失效的bug [#](https://github.com/erupts/erupt-web/commit/0fe9bfdcd9187004ee0a9dc8771c2b56f3b9865f)

> 感谢 [shareloke](https://gitee.com/shareloke) 贡献的代码
>

🧩 [copyrightTxt](/guide/configuration#eqee9) 支持渲染标签

🧩 多附件上传场景支持选择后的查看与下载

🧩 表格自动滚动区域支持高度自适应

🌟 升级 spring boot 至 2.7.18

🌟 erupt-bi 表格支持显示百分比进度条

🌟 erupt-bi 表格支持配置长文本类型、链接类型

🌟 在线日志支持 JUL 的日志的 appender

🌟 tagType 增加 [maxTagCount](/field-types/tags#UApIg) 配置，控制最大可选择标签数

🌟 [lambdaQuery](/advanced/erupt-dao) 支持select返回目标对象

🌟 增加 [Open API](/advanced/rest-api#rUhXp) 能力，支持外部系统通过 appid + secret 获取 erupt token

🌟 增加全局函数 [msg/modal/notify](/advanced/frontend-notify)

🌟 tpl 支持使用[抽屉方式](/annotation/row-operation#UApIg)打开

🌟 节点日志使用抽屉方式打开

## 1.12.14 (2024-07-04) <Badge type="tip" text="Spring Boot 2.7.10" />
**🐞** 解决部分菜单名称 i18n 失效的问题

**🐞** 修复自定义 BUTTON 类按钮，关联 eruptClass表单，表单值报错的问题

**🐞** 解决 oneToOne 在存储 json 场景时 view报错的 bug

**🐞** 解决排序时，后端排序结果会被前端重排的bug

**🐞** 修复分布式 node 获取组配置时报缺少请求头参数问题 与 node获取当前用户时404的问题 [#28](https://gitee.com/erupt/erupt/pulls/28)

> 感谢 [shareloke](https://gitee.com/shareloke) 贡献的代码
>

🧩 优化修改菜单管理中 erupt 类名调整触发的代码逻辑，不会出现角色绑定异常的问题

🌟 @erupt注解增加dataProxyParams配置，PreDataProxy注解增加params配置，此值可在dataProxy内被DataProxyContext.get()方法中获取到，增强单个dataProxy的通用性

🌟 erupt 注解支持[热构建](/advanced/misc)，修改注解值无需重启服务

🌟 choice 组件支持 [trigger](/field-types/choice#HNqh7) 配置，选择组件值可以填充到其他组件

🌟 重构 [erupt-job](/modules/erupt-job) 模块，支持多机集群部署

🌟 erupt-job EruptJobHandler 支持定义名称、Cron、运行参数，且支持带入到界面

🌟 erupt-job 支持手动运行时填入执行参数

🌟 EruptLambdaQuery 支持 condition 语法，消除拼接时的 if

🌟 新增系统日志能力，可以实时看到服务内日志信息

🌟 erupt-cloud 支持查看节点内日志信息

注意：新的日志菜单功能在项目目录下执行如下如下命令，启动时皆可自动生成

```shell
rm .erupt/erupt-cloud-server.loaded .erupt/erupt-upms.loaded 
```

## 1.12.13 (2024-05-28) <Badge type="tip" text="Spring Boot 2.7.10" />
🧩 处理 LambdaQuery eq 方法泛型限制不准确的 bug

🧩 处理查看详情场景子对象 long 类型精度丢失的问题

🧩 解决在跨域场景下文件无法正常下载的问题

🌟 增加一对一组件的代码生成

🌟 自定义按钮支持从已选数据中[初始化 eruptClass 表单值](/annotation/row-operation#zlxgJ)

🌟 Layout 注解增加 [refreshTime](/annotation/layout#grAm1) 配置，用于控制页面接口数据自动更新控制

🌟 下钻支持自定义条件语法格式：类型.字段名，支持 and or等拼接语法 [@Drill → @link → linkCondition](/annotation/drill#NsnOt)

🌟 Lambda Query 支持[聚合函数查询](/advanced/erupt-dao#mxI1r)：count、sum、avg、min、max

## 1.12.12 (2024-04-29) <Badge type="tip" text="Spring Boot 2.7.10" />
**🐞** 修复 BI 时间区间条件无法重置的 bug

**🐞** 修复 ckeditor不能正常加载的 bug

**🐞** 解决 PWA 场景无法正常安装的bug

**🐞**** **修复 DictChoiceFetchHandler 与 DictCodeChoiceFetchHandler 无法按照 code查询的 bug

🧩 提升EruptLambdaQuery易用性 one 方法如果无数据不会抛出异常而是返回 null

🌟 [新增颜色选择组件](/field-types/color)

🌟 提升数据渲染性能，表格数据超过 100 会自动开启虚拟滚动

🌟 自定义数据源支持[全局 power 控制](/advanced/custom-datasource)，数据源可以全局的控制页面能力而不是通过 @Power 注解二次控制

## 1.12.11 (2024-04-15) <Badge type="tip" text="Spring Boot 2.7.10" />
**🐞** 修复 mongodb 场景在字段上添加org.springframework.data.mongodb.core.mapping.Field注解不生效的 bug (感谢[iszhangsc](https://github.com/iszhangsc) 的贡献[#231](https://github.com/erupts/erupt/pull/231))

**🐞** Erupt-BI 解决存在必填项时自定义模板404的 bug

🧩 Erupt-BI 兼容 JDK17

🧩 筛选场景下支持清除 choice 组件已输入值

🌟 无障碍能力支持灰色模式

🌟 Erupt-BI 查询维度支持**参照表格**组件，表格内部支持虚拟滚动，列筛选，列排序等能力

🌟 自定义按钮增加调用时提示文本配置能力（[callHint](/annotation/row-operation#UApIg)），为空则表示不提示

🌟 增加 [Linq.J](https://github.com/erupts/Linq.J) 依赖，基于内存的对象查询语言，用于内存级对象查询与 Lambda 映射

🌟 [userinfo](/advanced/rest-api) 接口增加返回组织编码、岗位编码、角色编码

🌟 将 erupt-magic-api 资源重载配置能力配置到菜单权限中

> 手动删除erupt-magic-api.loaded文件按钮重载权限会自动添加到菜单中
>

🌟 ViewType增加SAFE_TEXT类型，文本中带有脚本或标签信息不会被前端渲染

🌟 提高渲染性能，所有树组件都增加虚拟滚动能力，如果节点条数大于 50 则会开启

🌟 自定义按钮支持[代码弹出](/annotation/row-operation#kdCWH)能力，配置语言与内容即可 return "codeModal('sql',`select * from xxx`)"

🌟 EruptDao支持 [LambdaQuery](/advanced/erupt-dao) 语法查询能力

```java
List<EruptUser> eruptUsers = eruptDao.lambdaQuery(EruptUser.class)
                .like(EruptUser::getName, "erupt")
                .isNull(EruptUser::getWhiteIp).list();
```

🌟 破坏性更新：因在跨国工作等场景很容易出现本地时间和服务器事件不一致的情况导致无法登录，所以调整登录时密码加密规则 [/advanced/auth#jgeb](/advanced/auth#jgebi)

自定义登录规则的用户需要对此进行调整

```sql
md5(md5(pwd) + Calendar.DAY_OF_MONTH + account) 
→ 
md5(md5(pwd) + account) # 移除通过当前天作为加密依据
```

## 1.12.10 (2024-02-05) <Badge type="tip" text="Spring Boot 2.7.10" />
**🐞**** **修复执行自定义按钮会回到第一页的 bug

**🐞**** **修复已选语言不回显的显示 bug

**🐞**** **修复树视图不支持分场景只读的 bug

**🐞**** **解决 oracle 数据库 erupt-cloud 模块 e_cloud_node 表无法自动创建的 bug

**🐞**** **解决 oracle 数据库无法创建 upms_menu 表的问题，h2数据库默认读取提交的erupt.mv.db文件

🧩 优化触碰表格图标2秒后会出现标签的显示问题

🧩 优化 erupt-cloud 心跳检测 node 节点查找性能，避免使用 keys *

🧩 eruptDao 新增 findById 方法，防止线程内多次读取对象导致脏读的问题

🧩 支持删除菜单后自动移除关联角色能力

🧩 导出模板支持修饰字段类型是LocalDate 或 LocalDateTime时自动限制填充时间格式的能力

🧩 左树右表、下钻组件组件依据实际类型调整表达式是否需要引号（兼容 jpa6）

🧩 优化 SQL异常提示，错误信息不会统一返回数据重复这种迷惑性文本

🌟 代码生成器增加评分组件生成支持

🌟 input 组件增加 autoTrim 配置，提交内容会自动 trim 默认开启

🌟 erupt-job 增加是否记录日志配置

🌟 erupt-bi 定义图表数据为空时的占位展示 UI

🌟 erupt-bi 图表渲染自动写入ID方便自定义样式或者动态 JS 处理

🌟 erupt-bi 优化词云图交互样式

## 1.12.9 (2023-12-11) <Badge type="tip" text="Spring Boot 2.7.10" />
**🐞**** **修复附件组件拖拽能力失效的 bug

🧩 addBehavior支持 drill下钻值的传递，可通注入 request 对象从请求头中获取

🌟 erupt-bi：图表数据支持 excel 下载

🌟 erupt-bi：图表支持备注信息展示

🌟 erupt-bi：图表支持列信息自适应，会根据类型自动定义列名

## 1.12.8 (2023-11-28) <Badge type="tip" text="Spring Boot 2.7.10" />
**🐞**** **解决 oracle 数据库无法自动创建 e_upms_menu 表的 bug

**🐞**** **修复搜索是BigDecimal类型报错的问题

🧩 调整序列化过程，在类型是 Long、Double、BigDecimal 时会返给前端String类型结果，防止精度丢失

🧩 优化 query 权限的前端反馈，无 query 权限将不会显示表格相关的数据UI，而不是提示无权限

🧩 解决部分场景异常无法反馈给前端的问题 [#219](https://github.com/erupts/erupt/pull/219)，感谢 [lamperwang](https://github.com/lamperwang) 贡献的代码

🌟 支持自定义 [copyright](/guide/configuration#eqee9) 版权信息内容

## 1.12.7 (2023-11-13) <Badge type="tip" text="Spring Boot 2.7.10" />
🐞 修复如果存在上下文地址节点管理remove-node接口404的bug

🐞 修复 Monitor 组件中 Redis 连接泄漏问题 [#207](https://github.com/erupts/erupt/pull/207) 感谢 [aurthurxlc](https://github.com/aurthurxlc) 的PR贡献

🐞 修复cloud模式下drill功能报错的 bug

🐞 修复cloud模式下操作按钮定义弹出层提示无权限的bug

**🐞**** **修复因任务参数字段长度不一致导致的任务执行失败情况 [#215](https://github.com/erupts/erupt/pull/215/commits/0a55fac3126ad4f2068aaf2b76bcabb31f0589a6) 感谢 [liuhulu](https://github.com/liuhulu) 的PR贡献

🧩 优化ControllerAdvice拦截范围

🧩 解决前端console命令行会提示异常信息的问题

🧩 修复代码编辑器主题切换失效的 bug

🧩 优化水印遮挡效果

🧩 解决`erupt-app.locales`配置不生效的问题，通过该配置可屏蔽不需要的语言选项

🌟 erupt-web 升级 angluar 版本到 16，提升页面渲染性能

🌟 增加重置密码的功能开关配置`erupt-app.reset-pwd` [#211](https://github.com/erupts/erupt/pull/211) 感谢 [cryptomatrix](https://github.com/lamperwang) 的PR贡献

## 1.12.5 (2023-11-02) <Badge type="tip" text="Spring Boot 2.7.10" />
🐞 修复非超管用户使用reference_table组件提示权限不足的bug

🐞 修复H2数据源无法创建upms_menu表bug

🐞 修复左树右表`dependTree=true`出错的bug

## 1.12.4 (2023-10-25) <Badge type="tip" text="Spring Boot 2.7.10" />
🐞 修复drill组件失效的bug

🐞 修复attachment组件限制附件类型，前端不自动置灰的bug

🌟 适配 Apache POI 已标记废弃的方法 [#26](https://gitee.com/erupt/erupt/pulls/26)，感谢[山野羡民](https://gitee.com/li_yu_jiang)的贡献

🌟 优化 @antv/g2plot 包中的类型不兼容问题 [#10](https://gitee.com/erupt/erupt-web/pulls/10)，感谢[山野羡民](https://gitee.com/li_yu_jiang)的贡献

🌟 优化 erupt-node节点注册过程，反向校验node节点的通信状态

> 特别感谢[山野羡民](https://gitee.com/li_yu_jiang)在此版本提供了两个可行的PR
>

## 1.12.3 (2023-10-15) <Badge type="tip" text="Spring Boot 2.7.10" />
🐞 修复默认条件不渲染的bug

🐞 修复eruptRouterEvent路由切换事件未触发的bug

🐞 解决前端CSV语言文件被缓存问题

🐞 修复无搜索项，左树右表无法查询的bug

🧩 升级magic-api版本至

🧩 优化BI整体样式，BI图表支持伸缩，移除s2的表格渲染能力，使用table标签渲染

🧩 优化checkbox组件样式限制最大高度，[checkbox组件支持渲染remark](/field-types/checkbox)

🧩 优化TAB_TABLE_ADD组件使用方式，支持调用DataProxy生命周期接口

🌟 增加默认语言配置 [erupt.default-locales](/guide/configuration#h3nEy)

🌟 登录、登出事件触发函数移动至[eruptEvent](/guide/configuration#eqee9)中

🌟 choice组件select模式支持desc渲染

🌟 [增加分页能力支持](/annotation/layout)：支持分页大小，分页数配置

🌟 [支持分页方式配置](/annotation/layout#kgWTy)：前端分页、后端分页、不分页

破坏性更新：app.js中window.eruptSiteConfig.login与window.eruptSiteConfig.logout事件移动至window.eruptEvent中，详见：[⚙️ 参数 & 样式配置](/guide/configuration)

## 1.12.2 (2023-08-20) <Badge type="tip" text="Spring Boot 2.7.10" />
🐞 修复 excel 导入 404 的 bug

🐞 修复注解值中带有百分号会渲染失败的bug

🌟 choice 组件支持[联动](/field-types/choice#S1jRs)

## 1.12.1（2023-07-30） <Badge type="tip" text="Spring Boot 2.7.10" />
🐞 修复linkTree dependNode为true数据写入失败的问题

🐞 修复Drill注解导出不生效bug

🐞 修复Drill注解导入不生效bug

🧩 重构Drill注解能力，使用请求头的方式交互

注：Drill注解前端API破坏性更新，如果使用erupt-cloud-node也需要升级到1.12.1版本

## 1.12.0 (2023-07-10) <Badge type="tip" text="Spring Boot 2.7.10" />
🧩 erupt-flow: 解决若干已知问题 [#170](https://github.com/erupts/erupt/pull/170)

🧩 erupt-flow: 增强工作流对sqlserver数据库的支持 [#25](https://gitee.com/erupt/erupt/pulls/25)

🧩 erupt-web：参照组件支持已选数据的回显

🌟 erupt-web：前端整体UI重构，Angluar 8 升级至 Angluar 15

+ 菜单支持无限层级渲染
+ 表格支持显示多张图片
+ 支持LTR/RTL
+ 支持黑夜模式紧凑模式
+ 支持表格列手动拉伸
+ 支持周、月、年区间筛选

🌟 erupt-cloud：绘制独立的微节点管理界面，可管理已注册实例

🌟 删除与修改接口统一使用 post 请求，移除put、delete请求

🌟 增加评分组件：[RATE](/field-types/rate)

🌟 增加水印配置：[erupt-app.water-mark](/guide/configuration)，默认开启

🌟 增加 [@Layout](/annotation/layout) 布局注解，可配置列固定、表单单列布局

🌟 view注解支持打开tpl自定义模板

🌟 全新的权限控制注解，请勿使用@EruptRouter，详见：[#nitieg](/annotation/power)

🌟 完全重构多语言能力，增加法语、俄语、韩语支持，全框架无死角支持国际化

🌟 erupt-bi增加词云 + 桑基图 + 弦图等图表类型支持

## 1.12.x
**1.11.x → 1.12.x升级指南详见↓**

[v 1.12.X](/guide/upgrade)

## 1.11.7(2023-05-28) <Badge type="tip" text="Spring Boot 2.7.10" />
🌟 增加工作流模块 [erupt-flow](/modules/erupt-flow) 感谢：[@hlhutu](https://github.com/hlhutu) 贡献完整的流程引擎代码

## 1.11.6 (2023-05-14) <Badge type="tip" text="Spring Boot 2.7.10" />
🐞 修复LocalDateTime类型修饰时间字段搜索报错的bug

🧩 修改密码接口参数前端加密传输

## 1.11.5 (2023年04月10日) <Badge type="tip" text="Spring Boot 2.7.10" />
🐞 修复部分依赖未上传成功的问题

🐞 修复首页菜单初始化上下级混乱的问题

# ~~1.11.4 (2023年04月07日) ~~Spring boot版本：2.7.10
🐞 解决 excel 导出 bool 类型结果显示 Y / N 的问题

🐞 解决 declares multiple JSON fields named xxx 问题

🧩 处理 @filter 注解返回值容错，如果返回值为null则不参与条件拼接

🧩 更新数据与删除数据支持post请求

🧩 解决index.html缓存问题

🌟 升级spring boot版本至2.7.10

🌟 新增基于 @OneToOne 注解的一对一组件支持（[COMBINE](/field-types/combine)）

🌟 erupt cloud 增加 [validate-access-token](/modules/erupt-cloud#ta62E) 配置，用于设置 node 节点注册时是否校验 Access Token

## 1.11.3 (2023年03月17日) <Badge type="tip" text="Spring Boot 2.7.5" />
🐞 修复 ueditor 富文本编辑器图片上传失效的 BUG

🐞 修复 job 执行一次的按钮多条选择，只会执行第一个的 BUG

🐞 修复 RowOperation 中 button 类型的 TPL 动态绑定数据数据未带入模板BUG PR：[#143](https://github.com/erupts/erupt/pull/143)

🌟 数据初始化时会增加一个首页指向的菜单

🌟 重置条件按钮在重置条件的同时会触发查询操作

🌟 erupt bi 支持自定义汇总语句配置，在分页场景下可优化count(*)查询性能

🌟 erupt bi 文本与数值组件支持回车键触发查询操作

🌟 [富文本编辑器](/field-types/html-editor#UApIg)组件支持自定义文件上传路径配置 PR：[#135](https://github.com/erupts/erupt/pull/135)

## 1.11.2 (2023年01月08日) <Badge type="tip" text="Spring Boot 2.7.5" />
🐞 修复自定义登录页授权报错的bug

## 1.11.1 (2022年12月27日) <Badge type="tip" text="Spring Boot 2.7.5" />
🐞 修复创建新用户时超管标记无效的 BUG

🐞 修复保存时未触发动态readonly的 BUG

🐞 修复菜单管理按钮禁用状态不生效的 BUG

🐞 修复内网情况下同IP获取验证码校验失效的 BUG

🧩 简化自定义登录页授权参数

🧩 重置用户密码使用独立的按钮

🧩 修改密码接口、登录接口强制使用GET请求

🧩 修改密码接口移除account参数，通过token获取

🧩 登录用户基础信息每次都会从接口获取而不是登录后一直缓存

🧩 用户管理 → 首页菜单弹出时不会展示功能按钮类数据，方便选择有效视图菜单

🌟 弹出层表单支持默认值渲染

🌟 **@view **注解提供 [**ifRender**](/annotation/dynamic) 配置，支持动态表格列渲染

🌟 **@edit** 注解提供 [**ifRender**](/annotation/dynamic) 配置，支持动态表单渲染

## 升级指南：1.10.x 升级至 1.11.x
+ 修改密码接口：移除account参数
+ 验证码接口：必须传递mark参数（随机数），且登录时必须传递该参数
+ 登录接口：增加verifyCodeMark参数，传输验证码时必填，生成验证码时传递
+ 登录接口不会返回客户数据，只会告知token值
+ 强制使用GET请求：登出接口`/logout`、登录接口` /login`、修改密码 `/change-pwd`
+ 自定义登录页参数调整：[自定义登录页 | 短信登录 | 微信扫码登录](/advanced/custom-login-page#bH3Pe)
+ 数据库：结构无任何变化

## 1.10.15 (2022年11月07日) <Badge type="tip" text="Spring Boot 2.7.5" />
🐞 修复 mongodb 不解析 @Erupt.orderBy 配置的 bug

🐞 修复同IP网段下不同用户登录都会触发验证码校验的 bug

🐞 调整 [e_upms_operate_log](https://github.com/erupts/erupt/commit/109cc126619d98ec1efddef3744297d6057edc65#diff-af49fdc68c4b5861745193737ff007e31335fc7c04950ba4760cd9e386c6fa0c) 表字段长度定义，修复单次提交大量数据情况下不记录的 bug

🧩 调整 erupt-web 打包配置，解决源码编译可能导致404的问题

🧩 移除 hutool-cache 依赖，自定义LRU缓存实现

🧩 erupt-monitor 展示 erupt 版本信息

🧩 优化 core 包范围职责移除HikariCP依赖

🧩 完善 excel 批量导入能力，千行数据秒级导入，效率提升百倍

🧩 升级 spring boot 版本至 2.7.5

🌟 TAB 一对多组件支持@Erupt.desc注解渲染

🌟 EruptUser 表增加 expireDate 失效时间配置，控制用户再指定期间后禁止登录

## 1.10.14 (2022年09月21日) <Badge type="tip" text="Spring Boot 2.7.2" />
🐞 修复JDK17任务维护保存报错的bug

🧩 HyperModel、MetaModel 相关类增加表注释

🧩 用户密码被重置后清空密码重置时间字段值，下次登录强制修改密码

🧩 升级magic-api版本至2.0.2

🧩 更清晰的表达各菜单类型含义

🧩 EruptAppProp类转移到UPMS包下

🧩 解决在子类覆盖父类属性时，错误的使用父类EruptField设置 [#23](https://gitee.com/erupt/erupt/pulls/23)

🌟 菜单维护→菜单类型字段新增**在当前窗口打开链接**功能

🌟 EruptField 字段兼容枚举类型（需配合JPA [@Enumerated](https://blog.csdn.net/GMingZhou/article/details/103595917) 注解使用） [#120](https://github.com/erupts/erupt/pull/120)

🌟 DataProxy支持**excelImport**方法，可以将导入的**WorkBook**对象前置处理（接收类型为Object需要类型转换）

## 1.10.13 (2022年09月05日) <Badge type="tip" text="Spring Boot 2.7.2" />
🐞 修复 **keepUploadFileName** 配置为 true 时上传中文路径文件访问会 404 的 bug

🐞 修复计算表格列宽度未过滤隐藏列的问题 [#9](https://gitee.com/erupt/erupt-web/pulls/9)

🐞 修复oracle 数据源情况下无法创建 e_job_mail 表的bug

🧩 启动时检测是否存在spring-boot-devtools依赖，存在则提示异常建议移除

🧩 erupt-annotation 模块移除 POI 依赖

🧩 提升 @Erupt 自动添加表注释能力容错

🧩 **完全兼容JDK 17**, 修复JDK 17 各种问题

🌟 RowOperation 增加 **tplWidth** 配置可定义自定义弹出层宽度

🌟 erupt-cloud-node 增加聚合模块 erupt-cloud-node-jpa 开发node模块时减少依赖配置

🌟 excel导出功能单独拆分 erupt-excel 依赖，减轻 node 节点打包体积

升级提醒：该版本 DataProxy 中 excelExport 方法使用 Object 接收文档对象，使用时需强转为WorkBook对象

## 1.10.12 (2022年08月15日) <Badge type="tip" text="Spring Boot 2.7.2" />
🐞 修复链接类型菜单在某些情况下无法让左侧菜单自动选中的BUG

🐞 修复数值区间查询0值查询不生效的BUG

🧩 调整upms相关表code列默认长度为64

🧩 升级spring boot版本至2.7.2

🧩 升级poi依赖到最新版本，升级gson依赖到最新版本

🌟 [DataProxy](/advanced/data-proxy) 新增searchCondition方法，支持过滤组件自定义查询条件配置

🌟 [AutoComplete](/field-types/auto-complete)组件支持数据联动，可获取其他表单对象的值，应对更多业务场景

🌟 erupt类初始化与增加字段时会根据EruptField注解配置自动生成**数据库表注释**

注意：AutoCompleteHandler 破坏性修改，升级后completeHandler方法需要增加formData参数用于多组件联动

## 1.10.10 (2022年07月17日) <Badge type="tip" text="Spring Boot 2.6.5" />
🐞 修复cloud模式下自定义按钮执行报错的bug

🐞 修复动态readonly调用方法不正确的bug

🐞 修复由于版本升级导致 cloud node 节点序列化错误的bug

🧩 增加服务结束时销毁job能力

🧩 checkbox组件在手机端展示更加友好

🧩 eruptNode节点出错不会影响这个页面的渲染

🧩 cloud监控页面展示node节点引用模块信息

🌟 升级poi依赖到最新版本，升级gson依赖到最新版本

🌟 自定义模板支持获取当前菜单能力（获取当前页面菜单数据: [🧲 工具类（util）](/advanced/utils)）

🌟 增加 erupt.init-method-enum 配置定义初始化方式

🌟 TPL模板支持路径模糊匹配能力，如：*/xxx.html 、xxx/**.html等匹配方式同spring mvc

## 1.10.9 (2022年07月03日) <Badge type="tip" text="Spring Boot 2.6.5" />
🐞 解决自定义弹出层页面不能正确展示的问题

🐞 解决因为版本更新缓存内容不能正确更新的BUG

🐞 解决自定义页面在某些场景下展示不正确的BUG

🐞 修复cloud能力下drill 404的bug

🐞 TPL模板支持动态传参，可让模板动态复用，如：erupt.html?param=123

🧩 移除cloud能力下网络代理host配置，防止网关检测导致请求被拒绝

🧩 优化cloud注册信息的展示

🌟 增加erupt、entityManager、tpl 动态注册移除方法

🌟 增加 MetaModelCreateVo 工具类，只展示创建人与创建时间

🌟 @Erupt → desc 配置会在前端导航位置给予展示

## 1.10.8 (2022年06月06日) <Badge type="tip" text="Spring Boot 2.6.5" />
🐞 修复window系统下本地图片下载失败的bug

🧩 菜单值更新后会重新构建权限 [#93](https://github.com/erupts/erupt/pull/93)

🧩 增加redis-session自动续期配置 [#18](https://gitee.com/erupt/erupt/pulls/18)

🧩 角色管理下可查看角色下用户

🧩 EruptRole 表增加排序字段 sort

🧩 优化tab_add组件，修改和新增行为可触发dataProxy

🧩 增加时间区间组件快捷选择功能，支持近7天、近30天、本周、上周、本月、上月选择

🧩 Attachment组件支持文件类配置会后绑定UI，仅能选择已配置文件类型

🧩 excel导入配置限定文件类型为xls和xlsx

🌟 开源 erupt-tpl-ui.element-plus

🌟 BI报表支持下钻功能

🔥 开源 [erupt-cloud](/modules/erupt-cloud) 分布式开发erupt node节点，构建通用云配置中心

## 1.10.7 (2022年04月17日) <Badge type="tip" text="Spring Boot 2.6.5" />
🐞 修复 magic-api 不记录操作人信息的 bug

🐞 修复 Drill 类权限不正确的 bug

🐞 修复 500 条数据分页失效的 bug

🐞 修复手机端搜索框样式 bug

🐞 修复 iframe 高度差展示 bug

🐞 修复 bi 函数单机缓存机制

🐞 修复 auth 授权页面不支持中文参数的 bug

🌟 bi 支持后端配置分页大小与分页选项

🌟 重绘500页面，展示异常信息

## 1.10.6 (2022年03月28日) <Badge type="tip" text="Spring Boot 2.6.4" />
🐞 修复 impala 方言分页BUG

🐞 修复40x页面不展示的BUG

🐞 修复 BI 图表报表共存时显示BUG

🧩 优化 BI 报表的整体间距，提升视觉效果

🌟 增加[strictRoleMenuLegal](/guide/configuration#h3nEy)配置，配置化非管理员角色菜单权限

🌟 支持[自定义登录页](/advanced/custom-login-page)配置，可实现验证码登录与微扫码登录等个性化登录场景

🌟 升级spring boot版本至2.6.4

## 1.10.5 (2022年03月17日) <Badge type="tip" text="Spring Boot 2.6.0" />
🐞 修复uuid数据类型提示必须为数值类型的 BUG

🌟 BI新增数据源支持：达梦、人大金仓、Impala、Clickhouse

🌟 BI报表支持不分页配置

🌟 BI报表支持列属性配置：排序、宽度

🌟 修复注解代理类上下文传递不正确的bug

🌟 升级erupt-magic-api至2.0（**存在破坏性升级，务必参考：**[**升级指南**](https://www.ssssssss.org/magic-api/pages/base/upgrade2.x/)**！**）

## 1.10.4 (2022年03月09日) <Badge type="tip" text="Spring Boot 2.6.0" />
🐞 修复非管理员用户管理用户出错的 BUG

🐞 修复 REFERENCE_TREE、REFERENCE_TABLE 组件权限控制过严格问题

🧩 提升启动速度，多数据源运行时动态创建

🧩 Looker 包的类不直接实现 DataProxy 而是通过类引用的方式实现

🌟 Loading 页增加缓存清除提示

🌟 Drill 支持动态 Show配置

🌟 RowOperation ifExpr 添加行为控制（ IfExprBehavior → disable、hide ）[#87](https://github.com/erupts/erupt/pull/87)

## 1.10.3 (2022年02月26日) <Badge type="tip" text="Spring Boot 2.6.0" />
🐞 修复自定义按钮组件执行顺序错乱的 BUG

🐞 修复 erupt-bi 有查询项不显示图表的 BUG

🌟 菜单权限校验不区分大小写

## 1.10.2 (2022年02月23日) <Badge type="tip" text="Spring Boot 2.6.0" />
🐞 修复erupt-magic-api数据源管理权限不足的 BUG

🐞 修复自定义按钮组件执行顺序错乱的 BUG

🧩 优化使用细节，如用户表为空则会自动删除初始化标识文件（.erupt）重新初始化

🌟 erupt-bi 图表查询依赖必填查询项

## 1.10.1 (2022年02月21日) <Badge type="tip" text="Spring Boot 2.6.0" />
🐞 修复erupt-monitor JVM内存占用量，显示不正确的 BUG

🐞 修复自定义首页菜单刷新后未重新跳转的 BUG

🐞 修复地图组件搜索功能不可用的 BUG

🧩 移除菜单管理编码配置，code 列用随机数填充

🧩 移除报表管理编码配置，移除图表管理编码配置

🧩 登录日志移除用户关联外键，使用当前登录的用户名字符串填充

🧩 操作日志移除用户关联外键，使用当前登录的用户名字符串填充

🧩 优化 erupt-job 启动速度

🌟 全面兼容 JDK 17

🌟 使用动态代理的方式重构注解解析

🌟 erupt-monitor 增加 erupt 类与模块统计可视化

🌟 **菜单管理支持erupt类增、删、改、查、导入、导出动态配置**

🌟 用户管理增加超管用户的配置，非超管用户不可创建管理员用户

🌟 非超管用户拥有用户管理菜单时，只能看到当前用户添加的用户

🌟 新建用户登录后会弹出重置密码弹窗

🌟 解决 erupt-magic-api 页面缓存问题

🌟 解决 app.js、app.js、home.html 页面缓存问题

🌟 增加 index.html 页面转发功能，使用版本号作为转发依据

🌟 erupt-magic-api支持数据源与函数的权限控制

🌟 erupt-bi 数据源管理支持驱动自动获取

🌟 erupt-bi 支持图表缓存与报表缓存功能

🌟 增加 [MetaModel](/advanced/utils#18420919e0323a3fe4c3eecde0518e10) 工具类，可不关联用户表的情况下记录当前操作用户

🌟 新增 EruptModule 类，用于管理与实现扩展模块

🌟 增加字段覆盖功能，子类可覆盖父类的字段，提高复用性，字段用[@EruptSmartSkipSerialize](/advanced/extend)修饰

## 1.9x 至 1.10.x 升级指南
移除 ViaMenuCtr l类，请用 ViaMenuValueCtrl代替

SqlChoiceFetchHandler 更新包位置：xyz.erupt.toolkit.handler.SqlChoiceFetchHandler

由于菜单管理支持增删改查在线配置，已配置好的erupt类需要在**菜单管理**点击**修改按钮**，重新动态生成权限列表

# 版本截图

## 1.9.3 (2021年12月08日) <Badge type="tip" text="Spring Boot 2.6.0" />
+ 🐞 修复页面配置栏在多语言环境下展示不正确的bug
+ 🐞 修复年组件在多语言环境下展示错误的bug
+ 🧩 多语言增加韩语支持
+ 🌟 链接类型菜单追加token参数，传递给链接，集成erupt权限
+ 🌟 bi支持分组功能，更清晰的管理业务产生的大量报表
+ 🌟 Date组件支持 LocalDate 与 LocalDateTime
+ 🌟 优化图片上传宽配置，宽高数组分离成四个配置项 [#commit](https://gitee.com/erupt/erupt/commit/c38020e20ad28a3bc9dc604a2fb0a0737d921c81)

# 
## 1.9.2 (2021年11月30日) <Badge type="tip" text="Spring Boot 2.6.0" />
+ 🐞 修复缺少查询条件情况下excel无法导出bug
+ 🐞 修复年组件在多语言环境下展示错误的bug
+ 🐞 修复新增用户密码不加密时数据库未入库的bug
+ 🌟 增加[自定义行](/advanced/data-proxy#I2EwS)功能，可实现行合计等能力
+ 🌟 新增 /erupt-api/userinfo接口，可根据token自助获取当前用户基础信息
+ 🌟 app.js增加[login](/guide/configuration#eqee9)事件函数，增加[logout](/guide/configuration#eqee9)事件函数

# 
## 1.9.1 (2021年11月22日) <Badge type="tip" text="Spring Boot 2.6.0" />
+ 🐞 修复操作日志表oracle兼容问题
+ 🐞 修复lookerSelf清除了查询条件的bug
+ 🐞 修复 bi 自定义图表缺少分割线样式的问题
+ 🧩 美化excel导出默认列宽
+ 🧩 操作日志请求体json格式化显示
+ 🌟 升级spring boot至2.6.0
+ 🌟 增加日语支持
+ 🌟 开源erupt-i18n
+ 🌟 升级magic-api至1.7.0
+ 🌟 bi支持图表sql历史记录功能
+ 🌟 erupt-tpl增加 enjoy 模板引擎的支持 ，感谢[icefairy](https://gitee.com/icefairy)提供关键代码
+ 🌟 修改excel下载调用机制，支持下载loading功能
+ 🌟 自定义按钮ifExpr配置按钮状态不是隐藏而是禁用
+ 🌟 修复一对多新增再次关联时前端不显示的bug，感谢 [zaster](https://github.com/zaster) 提供关键代码
+ 🌟 修复view配置多级显示时查询结果不正确的缺陷（cross join），感谢[zaster](https://github.com/zaster)提供关键代码 [#76](https://github.com/erupts/erupt/pull/67)

# 
## 1.9.0 (2021年11月01日) <Badge type="tip" text="Spring Boot 2.6.0" />
+ 🧩 升级 spring boot 至 2.5.6
+ 🧩 升级 amis 至 1.4.0
+ 🌟 增加前端多语言支持
+ 🌟 增加服务端异常信息多语言支持
+ 🌟 [多数据源](/advanced/datasource)支持 Hikari 连接池配置
+ 🌟 BoolType默认值设置为 Y / N
+ 🌟 app.js支持不显示logo只显示logo文字
+ 🌟 增加HyperModelUpdateVo继承后可只显示修改人和修改时间
+ 🌟 调整DataProxy afterFetch方法执行顺序，map参数可以获取到组件原始值而不是转换值

注：依赖afterFetch做转换的程序需要调整转换逻辑，如：bool choice

## 1.9.x 使用文档 | 更新日志
## 1.8.x 使用文档 | 更新日志
## 1.7.x 使用文档 | 更新日志
## 1.6.x 使用文档 | 更新日志
## 1.5.x[ 使用文档](https://www.yuque.com/erupts/1.6.x) | 更新日志
## 更早版本

更早版本请参考旧版本文档。
