<script setup>
import { computed } from 'vue'

const props = defineProps({
    lang: { type: String, default: 'zh' },
    // 首页下方使用 hero 风格大标题；文档页内使用紧凑标题
    embed: { type: Boolean, default: false },
})

// 链接不带语言前缀，渲染时按 lang 补齐
const ft = (t) => ({ t, l: '/field-types/' + t.toLowerCase().replace(/_/g, '-') })
const an = (t, slug) => ({ t, l: '/annotation/' + slug })
const md = (t, slug) => ({ t, l: '/modules/' + slug })
const ad = (t, slug) => ({ t, l: '/advanced/' + slug })
const gd = (t, slug) => ({ t, l: '/guide/' + slug })

const editTypes = [
    'AUTO', 'INPUT', 'PASSWORD', 'TEXTAREA', 'NUMBER', 'SLIDER', 'DATE', 'BOOLEAN', 'MAP', 'COLOR', 'RATE',
    'CHOICE', 'MULTI_CHOICE', 'TAGS', 'AUTO_COMPLETE',
    'ATTACHMENT', 'HTML_EDITOR', 'CODE_EDITOR', 'MARKDOWN', 'SIGNATURE',
    'REFERENCE_TABLE', 'REFERENCE_TREE', 'CHECKBOX', 'TAB_TREE', 'TAB_TABLE_REFER', 'TAB_TABLE_ADD', 'MULTI_FORM', 'COMBINE',
    'GROUP', 'DIVIDE', 'CALLOUT', 'BUTTON', 'TPL', 'HIDDEN', 'EMPTY',
].map(ft)

const dict = {
    zh: {
        kicker: 'ARCHITECTURE · 全景架构',
        title: '任意数据源，到任意界面。',
        titleHl: '每一层都可插拔。',
        desc: '从接入入口到运行环境共九层：底层接任意数据源，中层 DataProxy 任意拦截、安全贯穿全链路，AI 作为内核能力内嵌其中，上层视图与组件由注解自动生成，最上层是一套开箱即用的现代化 UI。',
        traitsTitle: '内核特性',
        traits: [
            { icon: '⚡', color: 'amber', title: '极速启动', key: '2s ~ 5s 启动', sub: '2s ~ 5s 完成启动，热构建改注解不重启',
              chips: [gd('启动 2s ~ 5s', 'quick-start'), ad('热构建', 'hot-build'), gd('5 分钟跑起来', 'quick-start')] },
            { icon: '🍃', color: 'green', title: 'Spring Boot 原生', key: '3.x · JDK 17+', sub: '标准 Spring Boot 工程，现有项目直接接入',
              chips: [gd('Spring Boot 3.x', 'getting-started'), gd('JDK 17+', 'getting-started'), ad('接入现有项目', 'integration'), gd('start.erupt.xyz 脚手架', 'quick-start')] },
            { icon: '🤖', color: 'pink', title: 'AI Native', key: '19 LLM · MCP', sub: 'AI 不是插件，而是内核能力',
              chips: [md('19 个 LLM 适配器', 'erupt-ai/'), md('MCP Server 内置', 'erupt-ai/'), md('对话操作数据', 'erupt-ai-claw/'), md('一句话生成页面', 'erupt-ai-canvas'), an('@Power(ai) 模型级开关', 'power')] },
            { icon: '📦', color: 'cyan', title: '轻量体积', key: '首屏 0.8 MB gzip', sub: '按需引入，核心极小',
              chips: [md('首屏 ≈ 0.8 MB gzip', 'erupt-web'), md('erupt-core ≈ 300 KB', 'index'), md('前端 Jar ≈ 13 MB', 'erupt-web'), md('模块化按需引入', 'index')] },
            { icon: '🧩', color: 'purple', title: '随处可扩展', key: '组件 · 页面 · 注解 · 插件', sub: '组件、页面、注解、插件，全部可自定义',
              chips: [{ t: 'TPL 自定义组件', l: '/field-types/tpl' }, md('自定义页面 Freemarker / 微前端', 'erupt-tpl'), ad('扩展注解', 'extend'), ad('插件开发', 'plugin'), md('PF4J 动态插件', 'third-party/erupt-pf4j'), ad('事件监听', 'event-listener')] },
            { icon: '🔑', color: 'amber', title: '登录方式多样', key: '验证码 · 扫码 · LDAP / SSO', sub: '内置即用，也可完全自定义',
              chips: [ad('账号密码 + 验证码', 'custom-login-page'), md('IP 白名单', 'erupt-upms'), ad('微信扫码 / 第三方登录', 'custom-login-page'), ad('LDAP / SSO LoginProxy', 'auth'), ad('自定义登录页', 'custom-login-page'), ad('Open API 应用凭证', 'open-api')] },
            { icon: '🔓', color: 'green', title: '真开源', key: 'Apache-2.0', sub: 'Apache-2.0，永不追溯变更',
              chips: [gd('Apache-2.0', 'governance'), gd('开源优先原则', 'governance'), gd('GitHub 开放治理', 'governance'), gd('贡献指南', 'contributing')] },
            { icon: '🔁', color: 'pink', title: '稳定迭代', key: '2019 起 · 60+ 版本', sub: '2019 年至今持续演进',
              chips: [gd('60+ 正式版本', 'history'), gd('1.x / 2.x 双版本线', 'upgrade'), gd('升级指南', 'upgrade'), gd('更新日志', 'changelog')] },
        ],
        railTitle: '扩展模块',
        railSub: '45 个官方与社区模块，按需引入，版本与核心一致',
        railMore: '查看全部模块 →',
        layers: [
            {
                num: 'L9', color: 'mint', title: '接入层', sub: '人、系统、AI 三类入口，同一套后端',
                panels: [
                    {
                        title: '人', sub: '浏览器与移动端', link: '/guide/ui',
                        chips: [gd('浏览器 Web', 'ui'), gd('移动端自适应', 'ui'), md('微前端嵌入', 'erupt-tpl'), ad('前后端分离部署', 'separation'), ad('自定义登录页', 'custom-login-page'), ad('12 种语言', 'i18n')],
                    },
                    {
                        title: '系统', sub: '接口与消息', link: '/advanced/open-api',
                        chips: [ad('REST 接口', 'rest-api'), ad('Open API appid + secret', 'open-api'), md('Magic-API 在线接口', 'erupt-magic-api'), md('WebSocket 实时推送', 'erupt-websocket'), md('通知渠道 邮件 / 站内信', 'erupt-notice'), ad('Excel 导入导出', 'data-proxy-excel')],
                    },
                    {
                        title: 'AI', sub: '模型与智能体直连', link: '/modules/erupt-ai',
                        chips: [md('MCP Server → Cursor / Claude Code', 'erupt-ai'), md('A2A 智能体互联', 'erupt-ai'), md('AI Claw 对话操作数据', 'erupt-ai-claw'), md('AI Staff 渠道推送', 'erupt-ai-staff'), { t: 'erupt-skill Claude 技能包', l: 'https://github.com/plinian/erupt-skill' }],
                    },
                ],
            },
            {
                num: 'L8', color: 'purple', title: 'UI 体验层', sub: 'Angular 前端 · 开箱即用 · 零前端代码',
                groups: [
                    { title: '外观', chips: [md('3 套皮肤 默认 / Brutalist / Liquid Glass', 'erupt-web'), gd('浅色 / 深色 / 跟随系统', 'ui'), gd('16 色主题 + 自定义取色', 'ui'), gd('紧凑模式', 'ui'), md('1992 个图标', 'erupt-web'), gd('色弱 / 灰度模式', 'ui')] },
                    { title: '导航', chips: [gd('菜单模式 单列 / 分栏 / 双列', 'ui'), gd('多标签页', 'ui'), gd('面包屑', 'ui'), gd('菜单搜索', 'ui'), gd('侧栏 / 树面板拖拽伸缩', 'ui'), gd('帮助入口', 'ui')] },
                    { title: '交互', chips: [gd('可拖拽弹窗', 'ui'), ad('后端触发前端消息 / 弹窗', 'frontend-notify'), md('通知中心', 'erupt-notice'), gd('全屏水印', 'configuration'), gd('全屏模式', 'ui')] },
                    { title: '终端与接入', chips: [gd('移动端自适应', 'ui'), ad('12 种语言', 'i18n'), gd('RTL 布局', 'ui'), ad('自定义登录页', 'custom-login-page'), md('微前端容器', 'erupt-upms'), ad('前后端分离', 'separation')] },
                ],
            },
            {
                num: 'L7', color: 'cyan', title: '视图层', sub: '同一模型 · 多种视图 · 顶部一键切换',
                groups: [
                    { title: '视图类型', chips: [an('表格', 'view'), an('树', 'tree'), an('左树右表', 'link-tree'), an('看板', 'vis-board'), an('日历', 'vis-calendar'), an('卡片', 'vis-card'), an('甘特图', 'vis-gantt'), an('数据钻取', 'drill')] },
                    { title: '表格能力', chips: [an('单元格编辑', 'power'), an('拖拽排序', 'drag-sort'), an('自定义行操作', 'row-operation'), gd('列显隐 / 固定 / 拖拽排序', 'ui'), gd('多字段排序', 'ui'), an('搜索操作符切换', 'search'), ad('合计行', 'extra-row'), gd('自动刷新', 'ui'), gd('一键复制行', 'ui'), gd('按模型记忆偏好', 'ui')] },
                    { title: '表单', chips: [an('分步表单', 'form-steps'), ad('表单视图 FormView', 'form-view'), gd('详情抽屉', 'ui'), an('字段联动 OnChange', 'on-change'), an('动态显隐 @IfRender', 'if-render')] },
                    { title: '输出与页面', chips: [ad('Excel 导入导出', 'data-proxy-excel'), md('打印布局', 'erupt-print'), md('SQL 报表图表', 'erupt-report/'), md('TPL 自定义页面', 'erupt-tpl'), md('AI Canvas 一句话生成页面', 'erupt-ai-canvas')] },
                ],
            },
            {
                num: 'L6', color: 'green', title: '组件层', sub: '35 种编辑组件 · 改一个枚举值即切换',
                groups: [
                    { title: '基础', chips: [...editTypes.slice(0, 11)] },
                    { title: '选择', chips: [...editTypes.slice(11, 15)] },
                    { title: '媒体与编辑器', chips: [...editTypes.slice(15, 20)] },
                    { title: '关联', chips: [...editTypes.slice(20, 28)] },
                    { title: '布局与其他', chips: [...editTypes.slice(28), an('@View 20+ 单元格展示类型', 'view'), ad('自定义上传 OSS / 本地', 'upload')] },
                ],
            },
            {
                num: 'L5', color: 'pink', title: '模型层', sub: '注解驱动 · 一个 Java 类声明即生成',
                groups: [
                    { title: '类级注解', chips: [an('@Erupt', 'erupt'), an('@Power', 'power'), an('@RowOperation', 'row-operation'), an('@Drill', 'drill'), an('@Filter', 'filter'), an('@OrderBy', 'order-by'), an('@Tree', 'tree'), an('@LinkTree', 'link-tree'), an('@Layout', 'layout'), an('@DragSort', 'drag-sort'), an('@Vis', 'vis'), an('@FormSteps', 'form-steps'), an('@Tpl', 'tpl')] },
                    { title: '字段级注解', chips: [an('@EruptField', 'erupt-field'), an('@View', 'view'), an('@Edit', 'edit'), an('@Search', 'search'), an('@Dynamic', 'dynamic'), an('@IfRender', 'if-render'), an('@OnChange', 'on-change')] },
                    { title: '入口与扩展', chips: [an('@EruptScan', 'erupt-scan'), ad('注解二次扩展', 'extend'), ad('虚拟字段', 'virtual-field'), ad('逻辑删除', 'soft-delete'), ad('热构建 无需重启', 'hot-build'), md('SaaS 多租户 PRO', 'pro/erupt-tenant/')] },
                    { title: '建模工具', chips: [md('Designer 运行时拖拽建模', 'erupt-designer'), md('Generator 代码生成', 'erupt-generator'), md('Atlas 模型图谱 / 血缘', 'erupt-atlas'), md('EZDML 建模', 'third-party/ezdml')] },
                ],
            },
            {
                num: 'L4', color: 'coral', title: '智能层', sub: 'AI 是内核能力：模型即工具，注解即提示词',
                groups: [
                    { title: '模型与知识', chips: [md('19 个 LLM 适配器', 'erupt-ai'), md('Embedding 嵌入模型', 'erupt-ai-rag'), md('向量存储', 'erupt-ai-rag'), md('RAG / Agentic RAG', 'erupt-ai-rag'), md('多模态图片输入', 'erupt-ai'), md('thinking 思考模式', 'erupt-ai')] },
                    { title: '智能体与工具', chips: [md('Expert 智能体', 'erupt-ai'), md('AI Role 角色', 'erupt-ai'), md('@AiToolbox / @Tool 工具注册', 'erupt-ai'), md('EruptModelTools 模型增删改查', 'erupt-ai-claw'), an('@Power(ai) 模型级开关', 'power'), md('AI 调用审计', 'erupt-ai')] },
                    { title: '开放协议', chips: [md('MCP Server', 'erupt-ai'), md('A2A', 'erupt-ai'), md('OpenAI 兼容接口', 'erupt-ai')] },
                    { title: 'AI 应用', chips: [md('AI 写作助手 @Edit(prompt)', 'erupt-ai'), md('AI Canvas 一句话生成页面', 'erupt-ai-canvas'), md('AI Claw 对话操作数据', 'erupt-ai-claw'), md('AI Staff 数字员工', 'erupt-ai-staff'), md('Mermaid / 公式 / 代码高亮渲染', 'erupt-ai')] },
                ],
            },
            {
                num: 'L3', color: 'amber', title: '代理与安全', sub: 'DataProxy 任意拦截 · 安全贯穿全链路',
                panels: [
                    {
                        title: 'DataProxy 数据代理', sub: '增删改查全生命周期钩子', link: '/advanced/data-proxy',
                        chips: [
                            ad('validate 校验', 'data-proxy-validate'), ad('beforeAdd / afterAdd', 'data-proxy-crud'),
                            ad('beforeUpdate / afterUpdate', 'data-proxy-crud'), ad('beforeDelete / afterDelete', 'data-proxy-crud'),
                            ad('beforeFetch 条件注入', 'data-proxy-query'), ad('afterFetch 结果加工', 'data-proxy-query'),
                            ad('searchCondition 默认值', 'data-proxy-query'), ad('addBehavior / editBehavior', 'data-proxy-form'),
                            ad('alert 页面提示', 'data-proxy-table'), ad('extraContent 自定义 HTML', 'data-proxy-table'),
                            ad('extraRow 合计行', 'extra-row'), ad('excelImport / excelExport', 'data-proxy-excel'),
                            ad('print 打印内容', 'data-proxy-print'), ad('formViewBehavior / formSave', 'form-view'),
                            ad('@PreDataProxy 继承复用', 'pre-data-proxy'), ad('PostDataProxy 全局拦截', 'post-data-proxy'),
                            ad('事件监听器', 'event-listener'), ad('EruptDao / LambdaQuery', 'erupt-dao-lambda'),
                            ad('自定义 REST 接口', 'rest-api'), md('Magic-API 在线接口', 'erupt-magic-api'),
                        ],
                    },
                    {
                        title: '安全与权限', sub: 'UPMS 内置，从登录到每个按钮', link: '/modules/erupt-upms',
                        chips: [
                            md('用户 / 角色 / 菜单 / 组织 / 岗位 / 字典', 'erupt-upms'), an('@Power 增 / 删 / 改 / 查 / 详情', 'power'),
                            an('导入 / 导出 / 打印 / 复制 开关', 'power'), an('单元格编辑 & AI 双开关', 'power'),
                            an('PowerHandler 动态权限', 'power'), md('按钮 & 接口权限串', 'erupt-upms'),
                            ad('行级数据权限 beforeFetch', 'data-proxy-query'), ad('自定义登录 LoginProxy', 'auth'),
                            ad('Token 校验', 'auth'), ad('验证码 / IP 白名单', 'custom-login-page'), md('SHA-512 加盐密码存储', 'erupt-upms'), ad('微信扫码 / 第三方 token 登录', 'custom-login-page'), ad('LDAP / SSO 对接', 'auth'),
                            md('登录日志 / 操作日志', 'erupt-upms'), ad('Open API appid + secret', 'open-api'),
                            md('MCP Bearer 鉴权', 'erupt-ai/'), md('AI 调用审计', 'erupt-ai/'), gd('全屏水印防截图', 'configuration'),
                            md('多租户数据隔离 PRO', 'pro/erupt-tenant/'),
                        ],
                    },
                ],
            },
            {
                num: 'L2', color: 'ink', title: '数据源层', sub: '任意数据源 · 统一建模 · 可自定义',
                groups: [
                    { title: '关系型', chips: [gd('MySQL', 'database'), gd('PostgreSQL', 'database'), gd('Oracle', 'database'), gd('SQL Server', 'database'), gd('H2', 'database'), md('JDBC 单表', 'erupt-jdbc')] },
                    { title: 'NoSQL 与搜索', chips: [md('MongoDB', 'erupt-mongodb'), md('Elasticsearch', 'erupt-es'), md('Redis', 'erupt-redis'), md('内存', 'erupt-memory')] },
                    { title: '文件与接口', chips: [md('文件 CSV / JSONL / TSV / INI', 'erupt-file'), md('HTTP REST 接口', 'erupt-http'), md('S3 对象存储', 'erupt-s3')] },
                    { title: '平台与目录', chips: [md('Kubernetes', 'erupt-k8s'), md('LDAP', 'erupt-ldap'), md('飞书多维表格', 'erupt-feishu'), md('Notion', 'erupt-notion')] },
                    { title: '扩展', chips: [ad('多数据源', 'datasource'), ad('自定义数据源', 'custom-datasource'), ad('EruptDao / LambdaQuery', 'erupt-dao-lambda')] },
                ],
            },
            {
                num: 'L1', color: 'slate', title: '运行与运维层', sub: '标准 Spring Boot 工程，单机到分布式',
                groups: [
                    { title: '运行环境', chips: [gd('Spring Boot 3.x', 'getting-started'), gd('JDK 17+', 'getting-started'), ad('接入现有项目', 'integration'), ad('多数据源', 'datasource'), gd('参数配置', 'configuration'), ad('热构建', 'hot-build')] },
                    { title: '部署', chips: [gd('单体 Jar 部署', 'quick-start'), ad('前后端分离部署', 'separation'), md('Docker 部署', 'cloud-server'), ad('Redis Session', 'separation'), gd('升级指南', 'upgrade')] },
                    { title: '分布式', chips: [md('erupt-cloud 分布式配置中心', 'erupt-cloud'), md('Cloud Server 注册调度', 'cloud-server'), md('Cloud Node 微节点', 'cloud-node'), md('Job 定时任务 集群去重', 'erupt-job')] },
                    { title: '运维监控', chips: [md('Monitor 服务 / 诊断 / 缓存监控', 'erupt-monitor'), md('Erupt 类注册表', 'erupt-monitor'), md('Terminal 浏览器终端', 'erupt-terminal'), md('Remote VNC / SSH', 'erupt-remote'), md('登录日志 / 操作日志', 'erupt-upms'), gd('匿名遥测 可关闭', 'telemetry')] },
                ],
            },
        ],
        joins: ['承载', '渲染', '组合', '注解驱动 · 自动生成', 'Schema 即工具 · 注解即提示词', '工具调用 · 权限校验 · 审计', '统一读写', '部署 · 调度 · 监控'],
        rail: [
            {
                title: 'AI', count: 6, color: 'pink',
                chips: [md('AI Harness', 'erupt-ai'), md('AI Claw', 'erupt-ai-claw'), md('AI Canvas', 'erupt-ai-canvas'), md('AI RAG', 'erupt-ai-rag'), md('AI Staff', 'erupt-ai-staff'), { t: 'AI Skills ↗', l: 'https://github.com/plinian/erupt-skill' }],
            },
            {
                title: '核心', count: 4, color: 'purple',
                chips: [md('Upms', 'erupt-upms'), md('Tpl', 'erupt-tpl'), md('Web', 'erupt-web'), md('Designer', 'erupt-designer')],
            },
            {
                title: '数据连接', count: 13, color: 'cyan',
                chips: [md('Jpa', 'erupt-jpa'), md('MongoDB', 'erupt-mongodb'), md('Jdbc', 'erupt-jdbc'), md('Http', 'erupt-http'), md('Es', 'erupt-es'), md('Redis', 'erupt-redis'), md('Memory', 'erupt-memory'), md('File', 'erupt-file'), md('K8s', 'erupt-k8s'), md('Ldap', 'erupt-ldap'), md('飞书', 'erupt-feishu'), md('Notion', 'erupt-notion'), md('S3', 'erupt-s3')],
            },
            {
                title: '工具', count: 14, color: 'green',
                chips: [md('Terminal', 'erupt-terminal'), md('Remote', 'erupt-remote'), md('Atlas', 'erupt-atlas'), md('WebSocket', 'erupt-websocket'), md('Generator', 'erupt-generator'), md('Job', 'erupt-job'), md('Notice', 'erupt-notice'), md('Monitor', 'erupt-monitor'), md('Magic-API', 'erupt-magic-api'), md('Print', 'erupt-print'), md('Report', 'erupt-report/'), md('Cloud', 'erupt-cloud'), md('Cloud Server', 'cloud-server'), md('Cloud Node', 'cloud-node')],
            },
            {
                title: 'PRO', count: 3, color: 'amber',
                chips: [md('Flow 流程引擎', 'pro/erupt-flow/'), md('Tenant 多租户', 'pro/erupt-tenant/'), md('Cube 指标平台', 'pro/erupt-cube')],
            },
            {
                title: '社区', count: 5, color: 'mint',
                chips: [md('Dsl', 'third-party/erupt-dsl'), md('Pf4j', 'third-party/erupt-pf4j'), md('EZDML', 'third-party/ezdml'), md('公众号采集', 'third-party/mp-crawler'), md('Vote', 'third-party/erupt-vote')],
            },
        ],
    },
    en: {
        kicker: 'ARCHITECTURE AT A GLANCE',
        title: 'Any data source, to any UI.',
        titleHl: 'Every layer is pluggable.',
        desc: 'Nine layers from entry points to runtime: any data source at the bottom, DataProxy intercepting anything in the middle with security spanning the whole chain, AI embedded as a kernel capability, views and components generated from annotations, topped by a modern UI that works out of the box.',
        traitsTitle: 'Core traits',
        traits: [
            { icon: '⚡', color: 'amber', title: 'Fast startup', key: 'Boots in 2s ~ 5s', sub: 'Boots in 2s ~ 5s; hot build applies annotation changes without restart',
              chips: [gd('Boot in 2s ~ 5s', 'quick-start'), ad('Hot build', 'hot-build'), gd('Running in 5 minutes', 'quick-start')] },
            { icon: '🍃', color: 'green', title: 'Spring Boot native', key: '3.x · JDK 17+', sub: 'A standard Spring Boot project; drop into existing apps',
              chips: [gd('Spring Boot 3.x', 'getting-started'), gd('JDK 17+', 'getting-started'), ad('Integrate into existing projects', 'integration'), gd('start.erupt.xyz scaffold', 'quick-start')] },
            { icon: '🤖', color: 'pink', title: 'AI Native', key: '19 LLM · MCP', sub: 'AI is a kernel capability, not a plugin',
              chips: [md('19 LLM adapters', 'erupt-ai/'), md('Built-in MCP Server', 'erupt-ai/'), md('Chat with your data', 'erupt-ai-claw/'), md('One-line page generation', 'erupt-ai-canvas'), an('@Power(ai) per-model switch', 'power')] },
            { icon: '📦', color: 'cyan', title: 'Lightweight', key: '0.8 MB gzip first screen', sub: 'Opt-in modules, tiny core',
              chips: [md('First screen ≈ 0.8 MB gzip', 'erupt-web'), md('erupt-core ≈ 300 KB', 'index'), md('Frontend Jar ≈ 13 MB', 'erupt-web'), md('Modular, opt-in', 'index')] },
            { icon: '🧩', color: 'purple', title: 'Extensible everywhere', key: 'Components · pages · annotations · plugins', sub: 'Components, pages, annotations, plugins: all customizable',
              chips: [{ t: 'TPL custom components', l: '/field-types/tpl' }, md('Custom pages Freemarker / micro-frontend', 'erupt-tpl'), ad('Extend annotations', 'extend'), ad('Plugin development', 'plugin'), md('PF4J dynamic plugins', 'third-party/erupt-pf4j'), ad('Event listeners', 'event-listener')] },
            { icon: '🔑', color: 'amber', title: 'Flexible login', key: 'Captcha · QR · LDAP / SSO', sub: 'Ready out of the box, fully customizable',
              chips: [ad('Password + captcha', 'custom-login-page'), md('IP whitelist', 'erupt-upms'), ad('WeChat QR / third-party login', 'custom-login-page'), ad('LDAP / SSO via LoginProxy', 'auth'), ad('Custom login page', 'custom-login-page'), ad('Open API app credentials', 'open-api')] },
            { icon: '🔓', color: 'green', title: 'Truly open source', key: 'Apache-2.0', sub: 'Apache-2.0, never relicensed retroactively',
              chips: [gd('Apache-2.0', 'governance'), gd('Open-source-first principle', 'governance'), gd('Open governance on GitHub', 'governance'), gd('Contributing guide', 'contributing')] },
            { icon: '🔁', color: 'pink', title: 'Steady iteration', key: 'Since 2019 · 60+ releases', sub: 'Evolving continuously since 2019',
              chips: [gd('60+ releases', 'history'), gd('1.x / 2.x release lines', 'upgrade'), gd('Upgrade guide', 'upgrade'), gd('Changelog', 'changelog')] },
        ],
        railTitle: 'Modules',
        railSub: '45 official and community modules, opt-in, versioned with the core',
        railMore: 'Browse all modules →',
        layers: [
            {
                num: 'L9', color: 'mint', title: 'Access Layer', sub: 'Humans, systems and AI: three entry points, one backend',
                panels: [
                    {
                        title: 'Humans', sub: 'Browser and mobile', link: '/guide/ui',
                        chips: [gd('Web browser', 'ui'), gd('Mobile responsive', 'ui'), md('Micro-frontend embedding', 'erupt-tpl'), ad('Frontend / backend separation', 'separation'), ad('Custom login page', 'custom-login-page'), ad('12 languages', 'i18n')],
                    },
                    {
                        title: 'Systems', sub: 'APIs and messaging', link: '/advanced/open-api',
                        chips: [ad('REST APIs', 'rest-api'), ad('Open API appid + secret', 'open-api'), md('Magic-API online APIs', 'erupt-magic-api'), md('WebSocket real-time push', 'erupt-websocket'), md('Notification channels: email / in-app', 'erupt-notice'), ad('Excel import / export', 'data-proxy-excel')],
                    },
                    {
                        title: 'AI', sub: 'Direct access for models and agents', link: '/modules/erupt-ai',
                        chips: [md('MCP Server → Cursor / Claude Code', 'erupt-ai'), md('A2A agent interop', 'erupt-ai'), md('AI Claw: chat with your data', 'erupt-ai-claw'), md('AI Staff channel push', 'erupt-ai-staff'), { t: 'erupt-skill Claude skills', l: 'https://github.com/plinian/erupt-skill' }],
                    },
                ],
            },
            {
                num: 'L8', color: 'purple', title: 'UI Layer', sub: 'Angular frontend · zero frontend code',
                groups: [
                    { title: 'Appearance', chips: [md('3 skins: Default / Brutalist / Liquid Glass', 'erupt-web'), gd('Light / Dark / System', 'ui'), gd('16 theme colors + custom picker', 'ui'), gd('Compact mode', 'ui'), md('1,992 icons', 'erupt-web'), gd('Color-weak / grayscale mode', 'ui')] },
                    { title: 'Navigation', chips: [gd('Menu: single / split / double column', 'ui'), gd('Multi-tab pages', 'ui'), gd('Breadcrumb', 'ui'), gd('Menu search', 'ui'), gd('Resizable sidebar / tree panel', 'ui'), gd('Help entry', 'ui')] },
                    { title: 'Interaction', chips: [gd('Draggable modals', 'ui'), ad('Backend-triggered messages / modals', 'frontend-notify'), md('Notification center', 'erupt-notice'), gd('Full-screen watermark', 'configuration'), gd('Full-screen mode', 'ui')] },
                    { title: 'Devices & access', chips: [gd('Mobile responsive', 'ui'), ad('12 languages', 'i18n'), gd('RTL layout', 'ui'), ad('Custom login page', 'custom-login-page'), md('Micro-frontend container', 'erupt-upms'), ad('Frontend / backend separation', 'separation')] },
                ],
            },
            {
                num: 'L7', color: 'cyan', title: 'View Layer', sub: 'One model · many views · switch at the top',
                groups: [
                    { title: 'View types', chips: [an('Table', 'view'), an('Tree', 'tree'), an('Tree + Table', 'link-tree'), an('Board', 'vis-board'), an('Calendar', 'vis-calendar'), an('Card', 'vis-card'), an('Gantt', 'vis-gantt'), an('Drill-down', 'drill')] },
                    { title: 'Table features', chips: [an('Cell editing', 'power'), an('Drag sort', 'drag-sort'), an('Custom row operations', 'row-operation'), gd('Column show / pin / reorder', 'ui'), gd('Multi-field sort', 'ui'), an('Switchable search operators', 'search'), ad('Summary rows', 'extra-row'), gd('Auto refresh', 'ui'), gd('Copy row', 'ui'), gd('Per-model remembered prefs', 'ui')] },
                    { title: 'Forms', chips: [an('Step form', 'form-steps'), ad('FormView', 'form-view'), gd('Detail drawer', 'ui'), an('Field linkage OnChange', 'on-change'), an('Conditional render @IfRender', 'if-render')] },
                    { title: 'Output & pages', chips: [ad('Excel import / export', 'data-proxy-excel'), md('Print layouts', 'erupt-print'), md('SQL reports & charts', 'erupt-report/'), md('TPL custom pages', 'erupt-tpl'), md('AI Canvas one-line pages', 'erupt-ai-canvas')] },
                ],
            },
            {
                num: 'L6', color: 'green', title: 'Component Layer', sub: '35 edit components · switch by changing one enum',
                groups: [
                    { title: 'Basic', chips: [...editTypes.slice(0, 11)] },
                    { title: 'Selection', chips: [...editTypes.slice(11, 15)] },
                    { title: 'Media & editors', chips: [...editTypes.slice(15, 20)] },
                    { title: 'Relations', chips: [...editTypes.slice(20, 28)] },
                    { title: 'Layout & misc', chips: [...editTypes.slice(28), an('@View 20+ cell renderers', 'view'), ad('Custom upload OSS / local', 'upload')] },
                ],
            },
            {
                num: 'L5', color: 'pink', title: 'Model Layer', sub: 'Annotation-driven · one Java class declares it all',
                groups: [
                    { title: 'Class-level', chips: [an('@Erupt', 'erupt'), an('@Power', 'power'), an('@RowOperation', 'row-operation'), an('@Drill', 'drill'), an('@Filter', 'filter'), an('@OrderBy', 'order-by'), an('@Tree', 'tree'), an('@LinkTree', 'link-tree'), an('@Layout', 'layout'), an('@DragSort', 'drag-sort'), an('@Vis', 'vis'), an('@FormSteps', 'form-steps'), an('@Tpl', 'tpl')] },
                    { title: 'Field-level', chips: [an('@EruptField', 'erupt-field'), an('@View', 'view'), an('@Edit', 'edit'), an('@Search', 'search'), an('@Dynamic', 'dynamic'), an('@IfRender', 'if-render'), an('@OnChange', 'on-change')] },
                    { title: 'Entry & extension', chips: [an('@EruptScan', 'erupt-scan'), ad('Extend annotations', 'extend'), ad('Virtual fields', 'virtual-field'), ad('Soft delete', 'soft-delete'), ad('Hot build, no restart', 'hot-build'), md('SaaS multi-tenant PRO', 'pro/erupt-tenant/')] },
                    { title: 'Modeling tools', chips: [md('Designer: drag-and-drop modeling at runtime', 'erupt-designer'), md('Generator: code generation', 'erupt-generator'), md('Atlas: model graph / lineage', 'erupt-atlas'), md('EZDML modeling', 'third-party/ezdml')] },
                ],
            },
            {
                num: 'L4', color: 'coral', title: 'Intelligence Layer', sub: 'AI as a kernel capability: models are tools, annotations are prompts',
                groups: [
                    { title: 'Models & knowledge', chips: [md('19 LLM adapters', 'erupt-ai'), md('Embedding models', 'erupt-ai-rag'), md('Vector stores', 'erupt-ai-rag'), md('RAG / Agentic RAG', 'erupt-ai-rag'), md('Multimodal image input', 'erupt-ai'), md('Thinking mode', 'erupt-ai')] },
                    { title: 'Agents & tools', chips: [md('Expert agents', 'erupt-ai'), md('AI Roles', 'erupt-ai'), md('@AiToolbox / @Tool registration', 'erupt-ai'), md('EruptModelTools model CRUD', 'erupt-ai-claw'), an('@Power(ai) per-model switch', 'power'), md('AI call audit', 'erupt-ai')] },
                    { title: 'Open protocols', chips: [md('MCP Server', 'erupt-ai'), md('A2A', 'erupt-ai'), md('OpenAI-compatible endpoints', 'erupt-ai')] },
                    { title: 'AI apps', chips: [md('AI writing assistant @Edit(prompt)', 'erupt-ai'), md('AI Canvas one-line pages', 'erupt-ai-canvas'), md('AI Claw: chat with your data', 'erupt-ai-claw'), md('AI Staff digital workers', 'erupt-ai-staff'), md('Mermaid / math / code rendering', 'erupt-ai')] },
                ],
            },
            {
                num: 'L3', color: 'amber', title: 'Proxy & Security', sub: 'DataProxy intercepts anything · security spans the chain',
                panels: [
                    {
                        title: 'DataProxy', sub: 'Hooks across the whole CRUD lifecycle', link: '/advanced/data-proxy',
                        chips: [
                            ad('validate', 'data-proxy-validate'), ad('beforeAdd / afterAdd', 'data-proxy-crud'),
                            ad('beforeUpdate / afterUpdate', 'data-proxy-crud'), ad('beforeDelete / afterDelete', 'data-proxy-crud'),
                            ad('beforeFetch condition injection', 'data-proxy-query'), ad('afterFetch result shaping', 'data-proxy-query'),
                            ad('searchCondition defaults', 'data-proxy-query'), ad('addBehavior / editBehavior', 'data-proxy-form'),
                            ad('alert page notice', 'data-proxy-table'), ad('extraContent custom HTML', 'data-proxy-table'),
                            ad('extraRow summary rows', 'extra-row'), ad('excelImport / excelExport', 'data-proxy-excel'),
                            ad('print content', 'data-proxy-print'), ad('formViewBehavior / formSave', 'form-view'),
                            ad('@PreDataProxy inheritance', 'pre-data-proxy'), ad('PostDataProxy global intercept', 'post-data-proxy'),
                            ad('Event listeners', 'event-listener'), ad('EruptDao / LambdaQuery', 'erupt-dao-lambda'),
                            ad('Custom REST APIs', 'rest-api'), md('Magic-API online APIs', 'erupt-magic-api'),
                        ],
                    },
                    {
                        title: 'Security & Permissions', sub: 'UPMS built in, from login to every button', link: '/modules/erupt-upms',
                        chips: [
                            md('User / Role / Menu / Org / Post / Dict', 'erupt-upms'), an('@Power add / delete / edit / query / details', 'power'),
                            an('Import / export / print / copy toggles', 'power'), an('Cell-edit & AI dual toggles', 'power'),
                            an('PowerHandler dynamic permissions', 'power'), md('Button & API permission strings', 'erupt-upms'),
                            ad('Row-level data permission via beforeFetch', 'data-proxy-query'), ad('Custom login via LoginProxy', 'auth'),
                            ad('Token validation', 'auth'), ad('Captcha / IP whitelist', 'custom-login-page'), md('Salted SHA-512 password storage', 'erupt-upms'), ad('WeChat QR / third-party token login', 'custom-login-page'), ad('LDAP / SSO integration', 'auth'),
                            md('Login log / operation log', 'erupt-upms'), ad('Open API appid + secret', 'open-api'),
                            md('MCP Bearer auth', 'erupt-ai/'), md('AI call audit', 'erupt-ai/'), gd('Watermark against screenshots', 'configuration'),
                            md('Tenant data isolation PRO', 'pro/erupt-tenant/'),
                        ],
                    },
                ],
            },
            {
                num: 'L2', color: 'ink', title: 'Data Source Layer', sub: 'Any data source · unified modeling · customizable',
                groups: [
                    { title: 'Relational', chips: [gd('MySQL', 'database'), gd('PostgreSQL', 'database'), gd('Oracle', 'database'), gd('SQL Server', 'database'), gd('H2', 'database'), md('JDBC single table', 'erupt-jdbc')] },
                    { title: 'NoSQL & search', chips: [md('MongoDB', 'erupt-mongodb'), md('Elasticsearch', 'erupt-es'), md('Redis', 'erupt-redis'), md('In-memory', 'erupt-memory')] },
                    { title: 'Files & APIs', chips: [md('Files CSV / JSONL / TSV / INI', 'erupt-file'), md('HTTP REST API', 'erupt-http'), md('S3 object storage', 'erupt-s3')] },
                    { title: 'Platforms & directories', chips: [md('Kubernetes', 'erupt-k8s'), md('LDAP', 'erupt-ldap'), md('Feishu Bitable', 'erupt-feishu'), md('Notion', 'erupt-notion')] },
                    { title: 'Extension', chips: [ad('Multiple data sources', 'datasource'), ad('Custom data source', 'custom-datasource'), ad('EruptDao / LambdaQuery', 'erupt-dao-lambda')] },
                ],
            },
            {
                num: 'L1', color: 'slate', title: 'Runtime & Ops Layer', sub: 'A standard Spring Boot project, from single node to distributed',
                groups: [
                    { title: 'Runtime', chips: [gd('Spring Boot 3.x', 'getting-started'), gd('JDK 17+', 'getting-started'), ad('Integrate into existing projects', 'integration'), ad('Multiple data sources', 'datasource'), gd('Configuration', 'configuration'), ad('Hot build', 'hot-build')] },
                    { title: 'Deployment', chips: [gd('Single Jar deployment', 'quick-start'), ad('Frontend / backend separation', 'separation'), md('Docker deployment', 'cloud-server'), ad('Redis Session', 'separation'), gd('Upgrade guide', 'upgrade')] },
                    { title: 'Distributed', chips: [md('erupt-cloud distributed config center', 'erupt-cloud'), md('Cloud Server registration & dispatch', 'cloud-server'), md('Cloud Node micro-nodes', 'cloud-node'), md('Job scheduler, cluster-deduplicated', 'erupt-job')] },
                    { title: 'Ops & monitoring', chips: [md('Monitor: service / diagnostics / cache', 'erupt-monitor'), md('Erupt class registry', 'erupt-monitor'), md('Terminal in the browser', 'erupt-terminal'), md('Remote VNC / SSH', 'erupt-remote'), md('Login log / operation log', 'erupt-upms'), gd('Anonymous telemetry, opt-out', 'telemetry')] },
                ],
            },
        ],
        joins: ['serve', 'render', 'compose', 'annotation-driven · auto-generated', 'schema as tools · annotations as prompts', 'tool calls · authorization · audit', 'unified read / write', 'deploy · dispatch · monitor'],
        rail: [
            {
                title: 'AI', count: 6, color: 'pink',
                chips: [md('AI Harness', 'erupt-ai'), md('AI Claw', 'erupt-ai-claw'), md('AI Canvas', 'erupt-ai-canvas'), md('AI RAG', 'erupt-ai-rag'), md('AI Staff', 'erupt-ai-staff'), { t: 'AI Skills ↗', l: 'https://github.com/plinian/erupt-skill' }],
            },
            {
                title: 'Core', count: 4, color: 'purple',
                chips: [md('Upms', 'erupt-upms'), md('Tpl', 'erupt-tpl'), md('Web', 'erupt-web'), md('Designer', 'erupt-designer')],
            },
            {
                title: 'Data', count: 13, color: 'cyan',
                chips: [md('Jpa', 'erupt-jpa'), md('MongoDB', 'erupt-mongodb'), md('Jdbc', 'erupt-jdbc'), md('Http', 'erupt-http'), md('Es', 'erupt-es'), md('Redis', 'erupt-redis'), md('Memory', 'erupt-memory'), md('File', 'erupt-file'), md('K8s', 'erupt-k8s'), md('Ldap', 'erupt-ldap'), md('Feishu', 'erupt-feishu'), md('Notion', 'erupt-notion'), md('S3', 'erupt-s3')],
            },
            {
                title: 'Tools', count: 14, color: 'green',
                chips: [md('Terminal', 'erupt-terminal'), md('Remote', 'erupt-remote'), md('Atlas', 'erupt-atlas'), md('WebSocket', 'erupt-websocket'), md('Generator', 'erupt-generator'), md('Job', 'erupt-job'), md('Notice', 'erupt-notice'), md('Monitor', 'erupt-monitor'), md('Magic-API', 'erupt-magic-api'), md('Print', 'erupt-print'), md('Report', 'erupt-report/'), md('Cloud', 'erupt-cloud'), md('Cloud Server', 'cloud-server'), md('Cloud Node', 'cloud-node')],
            },
            {
                title: 'PRO', count: 3, color: 'amber',
                chips: [md('Flow engine', 'pro/erupt-flow/'), md('Tenant multi-tenancy', 'pro/erupt-tenant/'), md('Cube metrics', 'pro/erupt-cube')],
            },
            {
                title: 'Community', count: 5, color: 'mint',
                chips: [md('Dsl', 'third-party/erupt-dsl'), md('Pf4j', 'third-party/erupt-pf4j'), md('EZDML', 'third-party/ezdml'), md('MP Crawler', 'third-party/mp-crawler'), md('Vote', 'third-party/erupt-vote')],
            },
        ],
    },
}

const t = computed(() => dict[props.lang] || dict.zh)
const href = (l) => (l ? (l.startsWith('http') ? l : '/' + props.lang + l) : undefined)
</script>

<template>
    <section class="ea" :class="{ 'ea-embed': embed }" id="arch">
        <div class="ea-inner">
            <header class="ea-head">
                <div class="ea-head-main">
                    <p class="ea-kicker">{{ t.kicker }}</p>
                    <h2 class="ea-title">{{ t.title }} <mark class="ea-hl">{{ t.titleHl }}</mark></h2>
                </div>
                <p class="ea-desc">{{ t.desc }}</p>
            </header>

            <!-- 贯穿全局的内核特性：一条紧凑特性条，完整列表放在悬停提示中 -->
            <div class="ea-traits">
                <a v-for="tr in t.traits" :key="tr.title" class="ea-trait" :class="'ea-c-' + tr.color"
                   :href="href(tr.chips[0].l)" :title="tr.sub + '：' + tr.chips.map(c => c.t).join(' · ')">
                    <span class="ea-trait-icon" aria-hidden="true">{{ tr.icon }}</span>
                    <span class="ea-trait-text">
                        <b class="ea-trait-title">{{ tr.title }}</b>
                        <span class="ea-trait-key">{{ tr.key }}</span>
                    </span>
                </a>
            </div>

            <div class="ea-grid">
                <!-- 主体：自上而下的分层 -->
                <div class="ea-stack">
                    <template v-for="(layer, i) in t.layers" :key="layer.num">
                        <div class="ea-layer" :class="'ea-c-' + layer.color">
                            <div class="ea-label">
                                <span class="ea-num">{{ layer.num }}</span>
                                <b class="ea-layer-title">{{ layer.title }}</b>
                                <span class="ea-layer-sub">{{ layer.sub }}</span>
                            </div>
                            <div v-if="layer.panels" class="ea-panels">
                                <div v-for="p in layer.panels" :key="p.title" class="ea-panel">
                                    <a class="ea-panel-head" :href="href(p.link)">
                                        <b>{{ p.title }}</b><span>{{ p.sub }}</span>
                                    </a>
                                    <div class="ea-chips">
                                        <component :is="c.l ? 'a' : 'span'" v-for="c in p.chips" :key="c.t" class="ea-chip" :href="href(c.l)" :target="c.l && c.l.startsWith('http') ? '_blank' : undefined" :rel="c.l && c.l.startsWith('http') ? 'noreferrer' : undefined">{{ c.t }}</component>
                                    </div>
                                </div>
                            </div>
                            <div v-else-if="layer.groups" class="ea-groups">
                                <div v-for="g in layer.groups" :key="g.title" class="ea-group">
                                    <span class="ea-group-tag">{{ g.title }}</span>
                                    <div class="ea-chips">
                                        <component :is="c.l ? 'a' : 'span'" v-for="c in g.chips" :key="c.t" class="ea-chip" :href="href(c.l)">{{ c.t }}</component>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="ea-chips">
                                <component :is="c.l ? 'a' : 'span'" v-for="c in layer.chips" :key="c.t" class="ea-chip" :href="href(c.l)">{{ c.t }}</component>
                            </div>
                        </div>
                        <div v-if="i < t.layers.length - 1" class="ea-join" aria-hidden="true">
                            <i></i><span>↕ {{ t.joins[i] }}</span><i></i>
                        </div>
                    </template>
                </div>

                <!-- 右侧：贯穿各层的扩展模块 -->
                <aside class="ea-rail">
                    <div class="ea-rail-head">
                        <b>{{ t.railTitle }}</b>
                        <span>{{ t.railSub }}</span>
                    </div>
                    <div v-for="g in t.rail" :key="g.title" class="ea-rail-group">
                        <span class="ea-rail-tag" :class="'ea-c-' + g.color">{{ g.title }} <i>{{ g.count }}</i></span>
                        <div class="ea-chips">
                            <a v-for="c in g.chips" :key="c.t" class="ea-chip" :href="href(c.l)"
                               :target="c.l.startsWith('http') ? '_blank' : undefined" :rel="c.l.startsWith('http') ? 'noreferrer' : undefined">{{ c.t }}</a>
                        </div>
                    </div>
                    <a class="ea-rail-more" :href="href('/modules/')">{{ t.railMore }}</a>
                </aside>
            </div>
        </div>
    </section>
</template>

<style scoped>
.ea {
    --ea-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    --ea-bg: #FFFFFF;
    --ea-paper: #FFFFFF;
    --ea-line: #14120B;
    --ea-txt: #14120B;
    --ea-txt2: #5C5647;
    --ea-black: #14120B;
    --ea-pink: #F585B4;
    --ea-cyan: #4FC8EC;
    --ea-green: #93D655;
    --ea-purple: #BCA0F2;
    --ea-amber: #FFD23F;
    --ea-mint: #7FE0C3;
    --ea-coral: #FFA36C;
    --ea-slate: #C9D3E0;
    --ea-ink: #E8E2D2;
    position: relative;
    background: var(--ea-bg);
    color: var(--ea-txt);
    border-top: 2px solid var(--ea-line);
    padding: 56px 32px 72px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

.dark .ea {
    --ea-bg: #17140D;
    --ea-paper: #201C12;
    --ea-line: #F0E8D6;
    --ea-txt: #F0E8D6;
    --ea-txt2: #B0A78F;
    --ea-ink: #2B2618;
    --ea-slate: #3A4250;
}

/* 文档页内嵌：去掉外边距与分隔线，跟随文档正文宽度 */
.ea-embed {
    border-top: 0;
    padding: 8px 0 24px;
    background: transparent;
}

.ea-inner {
    max-width: 1200px;
    margin: 0 auto;
    container-type: inline-size;
}

/* ---- head ----
   有意与 hero 标题区拉开层级：一行式段落标题（左标题 / 右说明），
   不用旋转标签与大块高亮，避免看起来像 hero 复制了一份 */
.ea-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 400px);
    gap: 16px 48px;
    align-items: end;
    padding-bottom: 18px;
    border-bottom: 2px dashed var(--ea-line);
    margin-bottom: 28px;
}

.ea-embed .ea-head {
    display: none;
}

.ea-head-main {
    min-width: 0;
}

.ea-kicker {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--ea-mono);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .14em;
    color: var(--ea-txt2);
    margin: 0 0 10px;
}

.ea-kicker::before {
    content: "";
    width: 10px;
    height: 10px;
    background: var(--ea-green);
    border: 2px solid var(--ea-line);
    flex: 0 0 auto;
}

.ea-title {
    font-size: clamp(22px, 2.2vw, 30px);
    font-weight: 900;
    line-height: 1.3;
    letter-spacing: -.01em;
    margin: 0;
    color: var(--ea-txt);
    border: 0;
    padding: 0;
}

/* 标题重点：马克笔下划线，而非 hero 的整块高亮 */
.ea-hl {
    color: inherit;
    background: transparent;
    box-shadow: inset 0 -.38em 0 var(--ea-pink);
    padding: 0 2px;
}

.ea-desc {
    font-size: 13.5px;
    line-height: 1.7;
    color: var(--ea-txt2);
    margin: 0;
}

/* ---- traits strip: one compact bar ---- */
.ea-traits {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    background: var(--ea-paper);
    border: 2px solid var(--ea-line);
    box-shadow: 6px 6px 0 var(--ea-line);
    margin-bottom: 26px;
}

.ea-trait {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    padding: 10px 10px;
    color: var(--ea-txt);
    text-decoration: none;
    border-right: 2px solid var(--ea-line);
    transition: background .12s ease;
}

.ea-trait:nth-child(8n) { border-right: 0; }

.ea-c-pink.ea-trait:hover { background: var(--ea-pink); color: var(--ea-black); }
.ea-c-cyan.ea-trait:hover { background: var(--ea-cyan); color: var(--ea-black); }
.ea-c-green.ea-trait:hover { background: var(--ea-green); color: var(--ea-black); }
.ea-c-purple.ea-trait:hover { background: var(--ea-purple); color: var(--ea-black); }
.ea-c-amber.ea-trait:hover { background: var(--ea-amber); color: var(--ea-black); }

.ea-trait:hover .ea-trait-key { color: var(--ea-black); }

.ea-trait-icon {
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    font-size: 15px;
    border: 2px solid var(--ea-line);
    color: var(--ea-black);
}

.ea-c-pink .ea-trait-icon { background: var(--ea-pink); }
.ea-c-cyan .ea-trait-icon { background: var(--ea-cyan); }
.ea-c-green .ea-trait-icon { background: var(--ea-green); }
.ea-c-purple .ea-trait-icon { background: var(--ea-purple); }
.ea-c-amber .ea-trait-icon { background: var(--ea-amber); }

.ea-trait-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 1px;
}

.ea-trait-title {
    font-size: 12.5px;
    font-weight: 900;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.ea-trait-key {
    font-family: var(--ea-mono);
    font-size: 10px;
    font-weight: 700;
    line-height: 1.3;
    color: var(--ea-txt2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ---- grid: stack + rail ---- */
.ea-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 236px;
    gap: 20px;
    align-items: stretch;
}

.ea-stack {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

/* ---- layer band ---- */
.ea-layer {
    display: grid;
    grid-template-columns: 168px minmax(0, 1fr);
    background: var(--ea-paper);
    border: 2px solid var(--ea-line);
    box-shadow: 6px 6px 0 var(--ea-line);
    transition: transform .15s ease, box-shadow .15s ease;
}

.ea-layer:hover {
    transform: translate(-2px, -2px);
    box-shadow: 8px 8px 0 var(--ea-line);
}

.ea-label {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    padding: 16px 14px;
    border-right: 2px solid var(--ea-line);
    color: var(--ea-black);
}

.ea-c-pink .ea-label { background: var(--ea-pink); }
.ea-c-cyan .ea-label { background: var(--ea-cyan); }
.ea-c-green .ea-label { background: var(--ea-green); }
.ea-c-purple .ea-label { background: var(--ea-purple); }
.ea-c-amber .ea-label { background: var(--ea-amber); }
.ea-c-mint .ea-label { background: var(--ea-mint); }
.ea-c-coral .ea-label { background: var(--ea-coral); }
.ea-c-slate .ea-label { background: var(--ea-slate); }
.dark .ea .ea-c-slate .ea-label { color: var(--ea-txt); }
.ea-c-ink .ea-label { background: var(--ea-ink); color: var(--ea-txt); }

.ea-num {
    align-self: flex-start;
    font-family: var(--ea-mono);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .1em;
    color: var(--ea-paper);
    background: var(--ea-black);
    padding: 1px 7px;
}

.dark .ea .ea-num {
    color: #17140D;
    background: #F0E8D6;
}

.ea-c-ink .ea-num {
    color: var(--ea-paper);
    background: var(--ea-line);
}

.ea-layer-title {
    font-size: 17px;
    font-weight: 900;
    line-height: 1.2;
}

.ea-layer-sub {
    font-size: 11px;
    line-height: 1.5;
    opacity: .78;
}

/* ---- chips ---- */
.ea-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 14px 16px;
    align-content: flex-start;
}

.ea-chip {
    display: inline-block;
    font-family: var(--ea-mono);
    font-size: 11.5px;
    font-weight: 700;
    line-height: 1.3;
    color: var(--ea-txt);
    background: var(--ea-paper);
    border: 1.5px solid var(--ea-line);
    padding: 4px 9px;
    text-decoration: none;
    transition: transform .12s ease, box-shadow .12s ease, background .12s ease;
}

a.ea-chip:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 var(--ea-line);
}

.ea-c-pink a.ea-chip:hover { background: var(--ea-pink); color: var(--ea-black); }
.ea-c-cyan a.ea-chip:hover { background: var(--ea-cyan); color: var(--ea-black); }
.ea-c-green a.ea-chip:hover { background: var(--ea-green); color: var(--ea-black); }
.ea-c-purple a.ea-chip:hover { background: var(--ea-purple); color: var(--ea-black); }
.ea-c-amber a.ea-chip:hover { background: var(--ea-amber); color: var(--ea-black); }
.ea-c-mint a.ea-chip:hover { background: var(--ea-mint); color: var(--ea-black); }
.ea-c-coral a.ea-chip:hover { background: var(--ea-coral); color: var(--ea-black); }
.ea-c-slate a.ea-chip:hover { background: var(--ea-slate); color: var(--ea-black); }
.ea-c-ink a.ea-chip:hover { background: var(--ea-ink); }

/* ---- grouped rows inside a layer ---- */
.ea-groups {
    display: flex;
    flex-direction: column;
}

.ea-group {
    display: grid;
    grid-template-columns: 104px minmax(0, 1fr);
    align-items: start;
}

.ea-group + .ea-group {
    border-top: 1.5px dashed var(--ea-line);
}

.ea-group-tag {
    padding: 11px 6px 0 14px;
    font-family: var(--ea-mono);
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: .06em;
    line-height: 1.4;
    color: var(--ea-txt2);
}

.ea-group .ea-chips {
    padding: 8px 14px 8px 0;
}

/* ---- two panels inside L2 ---- */
.ea-panels {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
}

.ea-panel + .ea-panel {
    border-left: 2px solid var(--ea-line);
}

.ea-panel-head {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 16px;
    border-bottom: 1.5px dashed var(--ea-line);
    text-decoration: none;
    color: var(--ea-txt);
}

.ea-panel-head b {
    font-size: 13.5px;
    font-weight: 900;
}

.ea-panel-head span {
    font-size: 11px;
    color: var(--ea-txt2);
}

.ea-panel-head:hover b {
    text-decoration: underline;
    text-decoration-thickness: 2px;
}

/* ---- joins between layers ---- */
.ea-join {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 10px;
    height: 34px;
    padding: 0 24px;
}

.ea-join i {
    display: block;
    height: 0;
    border-top: 2px dashed var(--ea-line);
    opacity: .35;
}

.ea-join span {
    font-family: var(--ea-mono);
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: .08em;
    color: var(--ea-txt2);
}

/* ---- rail ---- */
.ea-rail {
    display: flex;
    flex-direction: column;
    background: var(--ea-paper);
    border: 2px solid var(--ea-line);
    box-shadow: 6px 6px 0 var(--ea-line);
    min-width: 0;
}

.ea-rail-head {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 16px 14px;
    background: var(--ea-amber);
    color: var(--ea-black);
    border-bottom: 2px solid var(--ea-line);
}

.ea-rail-head b {
    font-size: 17px;
    font-weight: 900;
}

.ea-rail-head span {
    font-size: 11px;
    opacity: .78;
}

.ea-rail-group {
    padding: 12px 0 4px;
}

.ea-rail-group + .ea-rail-group {
    border-top: 1.5px dashed var(--ea-line);
}

.ea-rail-tag {
    display: inline-block;
    margin: 0 14px;
    font-family: var(--ea-mono);
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: .1em;
    color: var(--ea-black);
    border: 1.5px solid var(--ea-line);
    padding: 1px 8px;
}

.ea-rail-tag.ea-c-pink { background: var(--ea-pink); }
.ea-rail-tag.ea-c-cyan { background: var(--ea-cyan); }
.ea-rail-tag.ea-c-green { background: var(--ea-green); }
.ea-rail-tag.ea-c-amber { background: var(--ea-amber); }
.ea-rail-tag.ea-c-purple { background: var(--ea-purple); }
.ea-rail-tag.ea-c-mint { background: var(--ea-mint); }

.ea-rail-tag i {
    font-style: normal;
    opacity: .6;
    margin-left: 2px;
}

.ea-rail-more {
    display: block;
    margin-top: auto;
    padding: 12px 14px;
    border-top: 2px solid var(--ea-line);
    font-size: 12.5px;
    font-weight: 800;
    color: var(--ea-txt);
    text-decoration: none;
    background: var(--ea-paper);
}

.ea-rail-more:hover {
    background: var(--ea-amber);
    color: var(--ea-black);
}

.ea-rail .ea-chips {
    padding: 8px 14px 10px;
    gap: 5px;
}

.ea-rail .ea-chip {
    font-size: 11px;
    padding: 3px 7px;
}

.ea-rail a.ea-chip:hover {
    background: var(--ea-amber);
    color: var(--ea-black);
}

/* ---- responsive (by component width, not viewport) ---- */
@container (max-width: 1000px) {
    .ea-traits { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .ea-trait { border-bottom: 2px solid var(--ea-line); }
    .ea-trait:nth-child(4n) { border-right: 0; }
    .ea-trait:nth-child(n+5) { border-bottom: 0; }
    .ea-grid { grid-template-columns: 1fr; }
    .ea-rail { margin-top: 8px; }
    .ea-rail-group { display: grid; grid-template-columns: auto 1fr; align-items: start; padding: 10px 0; }
    .ea-rail-tag { margin-top: 12px; }
}

@container (max-width: 760px) {
    .ea-head { grid-template-columns: 1fr; align-items: start; }
    .ea-traits { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .ea-trait { border-bottom: 2px solid var(--ea-line); }
    .ea-trait:nth-child(4n) { border-right: 2px solid var(--ea-line); }
    .ea-trait:nth-child(2n) { border-right: 0; }
    .ea-trait:nth-child(n+5) { border-bottom: 2px solid var(--ea-line); }
    .ea-trait:nth-child(n+7) { border-bottom: 0; }
    .ea-layer { grid-template-columns: 1fr; }
    .ea-label { border-right: 0; border-bottom: 2px solid var(--ea-line); padding: 12px 14px; }
    .ea-panels { grid-auto-flow: row; grid-auto-columns: auto; }
    .ea-group { grid-template-columns: 1fr; }
    .ea-group-tag { padding: 10px 14px 0; }
    .ea-group .ea-chips { padding: 6px 14px 10px; }
    .ea-panel + .ea-panel { border-left: 0; border-top: 2px solid var(--ea-line); }
    .ea-rail-group { grid-template-columns: 1fr; }
    .ea-rail-tag { margin-top: 0; }
    .ea-join { padding: 0 8px; }
}

@media (max-width: 720px) {
    .ea { padding: 48px 20px 56px; }
}
</style>
