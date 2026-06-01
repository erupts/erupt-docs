import {defineConfig} from 'vitepress'
import {withMermaid} from 'vitepress-plugin-mermaid'
import {InlineLinkPreviewElementTransform} from '@nolebase/vitepress-plugin-inline-link-preview/markdown-it'
import {GitChangelog, GitChangelogMarkdownSection} from '@nolebase/vitepress-plugin-git-changelog/vite'

export default withMermaid(defineConfig({
    title: 'Erupt',
    description: 'MDD & Annotation-driven Low-code Data platform & AI Harness',
    lastUpdated: true,
    cleanUrls: true,
    ignoreDeadLinks: true,

    markdown: {
        config(md) {
            md.use(InlineLinkPreviewElementTransform)
        },
    },

    head: [
        ['link', {rel: 'icon', href: '/logo.png'}],
        ['meta', {name: 'theme-color', content: '#646cff'}],
    ],

    vite: {
        plugins: [
            GitChangelog({
                repoURL: 'https://github.com/erupts/erupt-docs',
            }),
            GitChangelogMarkdownSection(),
        ],
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        mermaid: ['mermaid'],
                    },
                },
            },
        },
        ssr: {
            noExternal: [
                /^@nolebase\/.*/,
                'vitepress-plugin-mermaid',
                'mermaid',
            ],
        },
    },

    locales: {
        en: {
            label: 'English',
            lang: 'en',
            link: '/en/',
            themeConfig: {
                nav: [
                    {text: 'Guide', link: '/en/guide/', activeMatch: '/en/guide/'},
                    {text: 'Annotations', link: '/en/annotation/', activeMatch: '/en/annotation/'},
                    {text: 'Field Types', link: '/en/field-types/', activeMatch: '/en/field-types/'},
                    {text: 'Advanced', link: '/en/advanced/', activeMatch: '/en/advanced/'},
                    {text: 'Modules', link: '/en/modules/', activeMatch: '/en/modules/'},
                    {text: 'Topics', link: '/en/topics/', activeMatch: '/en/topics/'},
                    {text: 'Changelog', link: '/en/guide/changelog'},
                    {text: '🚀 Project Init', link: 'https://start.erupt.xyz/'},
                    {
                        text: 'Links',
                        items: [
                            {text: 'Website', link: 'https://www.erupt.xyz'},
                            {text: 'Linq.J', link: 'https://linq.erupt.xyz/'},
                            {text: 'GitHub', link: 'https://github.com/erupts/erupt'},
                            {text: 'Gitee', link: 'https://gitee.com/erupt/erupt'},
                            {text: 'Live Demo', link: 'https://demo.erupt.xyz'},
                        ],
                    },
                ],

                sidebar: {
                    '/en/guide/': [
                        {
                            text: 'Getting Started',
                            items: [
                                {text: '🚀 Project Init', link: 'https://start.erupt.xyz/'},
                                {text: 'Framework Introduction', link: '/en/guide/'},
                                {text: 'Quick Start', link: '/en/guide/quick-start'},
                                {text: 'First Example', link: '/en/guide/getting-started'},
                                {text: 'Configuration', link: '/en/guide/configuration'},
                            ],
                        },
                        {
                            text: 'Deployment',
                            items: [
                                {text: 'Database Support', link: '/en/guide/database'},
                                {text: 'Frontend/Backend Separation', link: '/en/guide/separation'},
                            ],
                        },
                        {
                            text: 'More',
                            items: [
                                {text: 'FAQ', link: '/en/guide/faq'},
                                {text: 'Changelog', link: '/en/guide/changelog'},
                                {text: 'Legacy Docs', link: '/en/guide/changelog#legacy-documentation'},
                                {text: 'Upgrade Guide', link: '/en/guide/upgrade'},
                                {text: 'Architecture', link: '/en/guide/architecture'},
                                {text: 'Community', link: '/en/guide/community'},
                                {text: 'Contributing', link: '/en/guide/contributing'},
                                {text: 'Donate', link: '/en/guide/donate'},
                            ],
                        },
                    ],

                    '/en/annotation/': [
                        {
                            text: 'Core Annotations',
                            items: [
                                {text: 'Overview', link: '/en/annotation/'},
                                {text: '@Erupt', link: '/en/annotation/erupt'},
                                {text: '@EruptField', link: '/en/annotation/erupt-field'},
                                {text: '@Edit', link: '/en/annotation/edit'},
                                {text: '@View', link: '/en/annotation/view'},
                                {text: '@Search', link: '/en/annotation/search'},
                            ],
                        },
                        {
                            text: 'Feature Annotations',
                            items: [
                                {text: '@Filter', link: '/en/annotation/filter'},
                                {text: '@Power', link: '/en/annotation/power'},
                                {text: '@Tree', link: '/en/annotation/tree'},
                                {text: '@LinkTree', link: '/en/annotation/link-tree'},
                                {text: '@Drill', link: '/en/annotation/drill'},
                                {text: '@Layout', link: '/en/annotation/layout'},
                                {text: '@OrderBy', link: '/en/annotation/order-by'},
                                {text: '@RowOperation', link: '/en/annotation/row-operation'},
                                {text: '@Dynamic', link: '/en/annotation/dynamic'},
                                {text: '@Vis', link: '/en/annotation/vis'},
                                {text: 'CARD View', link: '/en/annotation/vis-card'},
                                {text: 'GANTT Chart', link: '/en/annotation/vis-gantt'},
                            ],
                        },
                    ],

                    '/en/field-types/': [
                        {
                            text: 'Field Types',
                            items: [
                                {text: 'Overview', link: '/en/field-types/'},
                                {text: 'AUTO', link: '/en/field-types/auto'},
                                {text: 'INPUT', link: '/en/field-types/input'},
                                {text: 'TEXTAREA', link: '/en/field-types/textarea'},
                                {text: 'NUMBER', link: '/en/field-types/number'},
                                {text: 'SLIDER', link: '/en/field-types/slider'},
                                {text: 'DATE', link: '/en/field-types/date'},
                                {text: 'BOOLEAN', link: '/en/field-types/boolean'},
                                {text: 'MAP', link: '/en/field-types/map'},
                                {text: 'COLOR', link: '/en/field-types/color'},
                                {text: 'RATE', link: '/en/field-types/rate'},
                            ],
                        },
                        {
                            text: 'Choice Components',
                            items: [
                                {text: 'CHOICE', link: '/en/field-types/choice'},
                                {text: 'MULTI_CHOICE', link: '/en/field-types/multi-choice'},
                                {text: 'TAGS', link: '/en/field-types/tags'},
                                {text: 'AUTO_COMPLETE', link: '/en/field-types/auto-complete'},
                            ],
                        },
                        {
                            text: 'Media & Editors',
                            items: [
                                {text: 'ATTACHMENT', link: '/en/field-types/attachment'},
                                {text: 'HTML_EDITOR', link: '/en/field-types/html-editor'},
                                {text: 'CODE_EDITOR', link: '/en/field-types/code-editor'},
                                {text: 'MARKDOWN', link: '/en/field-types/markdown'},
                                {text: 'SIGNATURE', link: '/en/field-types/signature'},
                            ],
                        },
                        {
                            text: 'Relation Components',
                            items: [
                                {text: 'Overview', link: '/en/field-types/relation'},
                                {text: 'REFERENCE_TABLE', link: '/en/field-types/reference-table'},
                                {text: 'REFERENCE_TREE', link: '/en/field-types/reference-tree'},
                                {text: 'CHECKBOX', link: '/en/field-types/checkbox'},
                                {text: 'TAB_TREE', link: '/en/field-types/tab-tree'},
                                {text: 'TAB_TABLE_REFER', link: '/en/field-types/tab-table-refer'},
                                {text: 'TAB_TABLE_ADD', link: '/en/field-types/tab-table-add'},
                                {text: 'COMBINE', link: '/en/field-types/combine'},
                            ],
                        },
                        {
                            text: 'Other Types',
                            items: [
                                {text: 'DIVIDE', link: '/en/field-types/divide'},
                                {text: 'TPL', link: '/en/field-types/tpl'},
                                {text: 'HIDDEN', link: '/en/field-types/hidden'},
                                {text: 'EMPTY', link: '/en/field-types/empty'},
                            ],
                        },
                    ],

                    '/en/advanced/': [
                        {
                            text: 'Business Extensions',
                            items: [
                                {text: 'DataProxy', link: '/en/advanced/data-proxy'},
                                {text: 'PostDataProxy', link: '/en/advanced/post-data-proxy'},
                                {text: 'Dynamic Form', link: '/en/advanced/dynamic-form'},
                                {text: 'Custom File Upload', link: '/en/advanced/upload'},
                                {text: 'Event Listener', link: '/en/advanced/event-listener'},
                                {text: 'i18n', link: '/en/advanced/i18n'},
                                {text: 'Frontend Notifications', link: '/en/advanced/frontend-notify'},
                                {text: 'Miscellaneous', link: '/en/advanced/misc'},
                            ],
                        },
                        {
                            text: 'Dev Extensions',
                            items: [
                                {text: 'REST API & Logs', link: '/en/advanced/rest-api'},
                                {text: 'EruptDao', link: '/en/advanced/erupt-dao'},
                                {text: 'Utilities', link: '/en/advanced/utils'},
                                {text: 'Plugin Development', link: '/en/advanced/plugin'},
                                {text: 'Extend Erupt Annotations', link: '/en/advanced/extend'},
                            ],
                        },
                        {
                            text: 'Integration',
                            items: [
                                {text: 'Existing Project Integration', link: '/en/advanced/integration'},
                                {text: 'Login & Auth', link: '/en/advanced/auth'},
                                {text: 'Custom Login Page', link: '/en/advanced/custom-login-page'},
                                {text: 'Multiple Datasources', link: '/en/advanced/datasource'},
                                {text: 'Custom Datasource', link: '/en/advanced/custom-datasource'},
                                {text: 'Open API', link: '/en/advanced/open-api'},
                            ],
                        },
                    ],

                    '/en/topics/': [
                        {
                            text: 'Topics',
                            items: [
                                {text: 'Topics Overview', link: '/en/topics/'},
                            ],
                        },
                        {
                            text: 'Issue 05 · Design Philosophy',
                            items: [
                                {text: 'Annotation × Spring × Git', link: '/en/topics/controllable-low-code'},
                            ],
                        },
                        {
                            text: 'Issue 04 · BI × LLM',
                            items: [
                                {text: 'Erupt Cube × LLM', link: '/en/topics/cube-llm'},
                            ],
                        },
                        {
                            text: 'Issue 03 · JPA Superset',
                            items: [
                                {text: 'JPA × UI × RBAC × AI × Flow', link: '/en/topics/jpa-superset'},
                            ],
                        },
                        {
                            text: 'Issue 02 · Design Philosophy',
                            items: [
                                {text: '@Erupt × DataProxy × Handler', link: '/en/topics/annotation-vs-canvas'},
                            ],
                        },
                        {
                            text: 'Issue 01 · AI Harness',
                            items: [
                                {text: '50+ LLM × A2A × Memory', link: '/en/topics/50-llm-a2a-memory'},
                            ],
                        },
                    ],

                    '/en/modules/': [
                        {
                            text: 'Extension Modules',
                            items: [
                                {text: 'Module Overview', link: '/en/modules/'},
                            ],
                        },
                        {
                            text: 'AI Modules',
                            items: [
                                {text: '🐴 Erupt AI Harness', link: '/en/modules/erupt-ai'},
                                {text: '🦞 Erupt AI Claw', link: '/en/modules/erupt-ai-claw'},
                                {text: '🛠️ Erupt AI Skills', link: 'https://github.com/erupts/erupt/tree/master/.claude/skills/erupt'},
                            ],
                        },
                        {
                            text: 'Core Modules',
                            items: [
                                {text: 'Erupt Upms', link: '/en/modules/erupt-upms'},
                                {text: 'Erupt Jpa', link: '/en/modules/erupt-jpa'},
                                {text: 'Erupt Mongodb', link: '/en/modules/erupt-mongodb'},
                                {text: 'Erupt Tpl', link: '/en/modules/erupt-tpl'},
                                {text: 'Erupt Web', link: '/en/modules/erupt-web'},
                            ],
                        },
                        {
                            text: 'Tool Modules',
                            items: [
                                {text: 'Erupt Terminal', link: '/en/modules/erupt-terminal'},
                                {text: 'Erupt Websocket', link: '/en/modules/erupt-websocket'},
                                {text: 'Erupt Generator', link: '/en/modules/erupt-generator'},
                                {text: 'Erupt Job', link: '/en/modules/erupt-job'},
                                {text: 'Erupt Notice', link: '/en/modules/erupt-notice'},
                                {text: 'Erupt Monitor', link: '/en/modules/erupt-monitor'},
                                {text: 'Erupt Magic Api', link: '/en/modules/erupt-magic-api'},
                                {text: 'Erupt Print', link: '/en/modules/erupt-print'},
                                {text: 'Erupt Cloud', link: '/en/modules/erupt-cloud'},
                                {text: 'Erupt Cloud Server', link: '/en/modules/cloud-server'},
                                {text: 'Erupt Cloud Node', link: '/en/modules/cloud-node'},
                            ],
                        },
                        {
                            text: 'Commercial Modules',
                            items: [
                                {text: 'Erupt Chart', link: '/en/modules/pro/erupt-chart'},
                                {text: 'Erupt SaaS Multi-tenant', link: '/en/modules/pro/erupt-tenant'},
                                {text: 'Erupt Flow', link: '/en/modules/pro/erupt-flow'},
                                {text: 'Erupt Cube BI', link: '/en/modules/pro/erupt-cube'},
                            ],
                        },
                        {
                            text: 'Third-party Plugins',
                            items: [
                                {text: 'Erupt Dsl', link: '/en/modules/third-party/erupt-dsl'},
                                {text: 'Erupt Pf4j', link: '/en/modules/third-party/erupt-pf4j'},
                                {text: 'EZDML', link: '/en/modules/third-party/ezdml'},
                                {text: 'MP Crawler', link: '/en/modules/third-party/mp-crawler'},
                                {text: 'Erupt Vote', link: '/en/modules/third-party/erupt-vote'},
                            ],
                        },
                    ],
                },

                editLink: {
                    pattern: 'https://github.com/erupts/erupt-docs/edit/main/:path',
                    text: 'Edit this page on GitHub',
                },

                lastUpdated: {
                    text: 'Last updated',
                },

                outline: {
                    label: 'On this page',
                    level: [2, 3],
                },

                docFooter: {
                    prev: 'Previous',
                    next: 'Next',
                },

                returnToTopLabel: 'Return to top',
                sidebarMenuLabel: 'Menu',
                darkModeSwitchLabel: 'Theme',
            },
        },

        zh: {
            label: '中文',
            lang: 'zh-CN',
            themeConfig: {
                nav: [
                    {text: '快速上手', link: '/zh/guide/', activeMatch: '/zh/guide/'},
                    {text: '注解参考', link: '/zh/annotation/', activeMatch: '/zh/annotation/'},
                    {text: '组件类型', link: '/zh/field-types/', activeMatch: '/zh/field-types/'},
                    {text: '进阶', link: '/zh/advanced/', activeMatch: '/zh/advanced/'},
                    {text: '扩展模块', link: '/zh/modules/', activeMatch: '/zh/modules/'},
                    {text: '专题', link: '/zh/topics/', activeMatch: '/zh/topics/'},
                    {text: '更新日志', link: '/zh/guide/changelog'},
                    {text: '🚀 项目初始化', link: 'https://start.erupt.xyz/'},
                    {
                        text: '相关链接',
                        items: [
                            {text: '官网', link: 'https://www.erupt.xyz'},
                            {text: 'Linq.J', link: 'https://linq.erupt.xyz/'},
                            {text: 'GitHub', link: 'https://github.com/erupts/erupt'},
                            {text: 'Gitee', link: 'https://gitee.com/erupt/erupt'},
                            {text: '在线体验', link: 'https://demo.erupt.xyz'},
                        ],
                    },
                ],

                sidebar: {
                    '/zh/guide/': [
                        {
                            text: '开始使用',
                            items: [
                                {text: '🚀 项目初始化', link: 'https://start.erupt.xyz/'},
                                {text: '框架介绍', link: '/zh/guide/'},
                                {text: '快速部署', link: '/zh/guide/quick-start'},
                                {text: '入门示例', link: '/zh/guide/getting-started'},
                                {text: '参数配置', link: '/zh/guide/configuration'},
                            ],
                        },
                        {
                            text: '部署',
                            items: [
                                {text: '数据源支持', link: '/zh/guide/database'},
                                {text: '前后端分离部署', link: '/zh/guide/separation'},
                            ],
                        },
                        {
                            text: '其他',
                            items: [
                                {text: '常见问题 FAQ', link: '/zh/guide/faq'},
                                {text: '更新日志', link: '/zh/guide/changelog'},
                                {text: '历史版本', link: '/zh/guide/changelog#历史版本文档'},
                                {text: '升级指南', link: '/zh/guide/upgrade'},
                                {text: '架构图', link: '/zh/guide/architecture'},
                                {text: '加入讨论', link: '/zh/guide/community'},
                                {text: '贡献指南', link: '/zh/guide/contributing'},
                                {text: '捐赠', link: '/zh/guide/donate'},
                            ],
                        },
                    ],

                    '/zh/annotation/': [
                        {
                            text: '核心注解',
                            items: [
                                {text: '概览', link: '/zh/annotation/'},
                                {text: '@Erupt', link: '/zh/annotation/erupt'},
                                {text: '@EruptField', link: '/zh/annotation/erupt-field'},
                                {text: '@Edit 编辑配置', link: '/zh/annotation/edit'},
                                {text: '@View 展示配置', link: '/zh/annotation/view'},
                                {text: '@Search 搜索', link: '/zh/annotation/search'},
                            ],
                        },
                        {
                            text: '功能注解',
                            items: [
                                {text: '@Filter 数据过滤', link: '/zh/annotation/filter'},
                                {text: '@Power 权限控制', link: '/zh/annotation/power'},
                                {text: '@Tree 树形展示', link: '/zh/annotation/tree'},
                                {text: '@LinkTree 左树右表', link: '/zh/annotation/link-tree'},
                                {text: '@Drill 数据钻取', link: '/zh/annotation/drill'},
                                {text: '@Layout 布局定义', link: '/zh/annotation/layout'},
                                {text: '@OrderBy 排序', link: '/zh/annotation/order-by'},
                                {text: '@RowOperation 行按钮', link: '/zh/annotation/row-operation'},
                                {text: '@Dynamic 动态控制', link: '/zh/annotation/dynamic'},
                                {text: '@Vis 多视图', link: '/zh/annotation/vis'},
                                {text: '卡片视图 CARD', link: '/zh/annotation/vis-card'},
                                {text: '甘特图 GANTT', link: '/zh/annotation/vis-gantt'},
                            ],
                        },
                    ],

                    '/zh/field-types/': [
                        {
                            text: '组件类型',
                            items: [
                                {text: '概览', link: '/zh/field-types/'},
                                {text: 'AUTO 自动推测', link: '/zh/field-types/auto'},
                                {text: 'INPUT 单行文本', link: '/zh/field-types/input'},
                                {text: 'TEXTAREA 多行文本', link: '/zh/field-types/textarea'},
                                {text: 'NUMBER 数值输入', link: '/zh/field-types/number'},
                                {text: 'SLIDER 数字滑块', link: '/zh/field-types/slider'},
                                {text: 'DATE 日期', link: '/zh/field-types/date'},
                                {text: 'BOOLEAN 布尔开关', link: '/zh/field-types/boolean'},
                                {text: 'MAP 地理位置', link: '/zh/field-types/map'},
                                {text: 'COLOR 颜色选择', link: '/zh/field-types/color'},
                                {text: 'RATE 评分器', link: '/zh/field-types/rate'},
                            ],
                        },
                        {
                            text: '选择类组件',
                            items: [
                                {text: 'CHOICE 单选', link: '/zh/field-types/choice'},
                                {text: 'MULTI_CHOICE 多选', link: '/zh/field-types/multi-choice'},
                                {text: 'TAGS 标签选择', link: '/zh/field-types/tags'},
                                {text: 'AUTO_COMPLETE 自动完成', link: '/zh/field-types/auto-complete'},
                            ],
                        },
                        {
                            text: '媒体与编辑器',
                            items: [
                                {text: 'ATTACHMENT 文件上传', link: '/zh/field-types/attachment'},
                                {text: 'HTML_EDITOR 富文本', link: '/zh/field-types/html-editor'},
                                {text: 'CODE_EDITOR 代码编辑器', link: '/zh/field-types/code-editor'},
                                {text: 'MARKDOWN 编辑器', link: '/zh/field-types/markdown'},
                                {text: 'SIGNATURE 签名板', link: '/zh/field-types/signature'},
                            ],
                        },
                        {
                            text: '关联组件',
                            items: [
                                {text: '关联类型概览', link: '/zh/field-types/relation'},
                                {text: 'REFERENCE_TABLE 多对一表引用', link: '/zh/field-types/reference-table'},
                                {text: 'REFERENCE_TREE 多对一树引用', link: '/zh/field-types/reference-tree'},
                                {text: 'CHECKBOX 多对多复选框', link: '/zh/field-types/checkbox'},
                                {text: 'TAB_TREE 多对多树引用', link: '/zh/field-types/tab-tree'},
                                {text: 'TAB_TABLE_REFER 多对多表引用', link: '/zh/field-types/tab-table-refer'},
                                {text: 'TAB_TABLE_ADD 一对多新增', link: '/zh/field-types/tab-table-add'},
                                {text: 'COMBINE 一对一新增', link: '/zh/field-types/combine'},
                            ],
                        },
                        {
                            text: '其他类型',
                            items: [
                                {text: 'DIVIDE 分割线', link: '/zh/field-types/divide'},
                                {text: 'TPL 自定义模板', link: '/zh/field-types/tpl'},
                                {text: 'HIDDEN 隐藏字段', link: '/zh/field-types/hidden'},
                                {text: 'EMPTY 空占位', link: '/zh/field-types/empty'},
                            ],
                        },
                    ],

                    '/zh/advanced/': [
                        {
                            text: '业务扩展',
                            items: [
                                {text: '数据代理 DataProxy', link: '/zh/advanced/data-proxy'},
                                {text: '全局拦截 PostDataProxy', link: '/zh/advanced/post-data-proxy'},
                                {text: '动态表单', link: '/zh/advanced/dynamic-form'},
                                {text: '自定义文件上传', link: '/zh/advanced/upload'},
                                {text: '事件监听器', link: '/zh/advanced/event-listener'},
                                {text: '国际化', link: '/zh/advanced/i18n'},
                                {text: '前端消息与弹窗', link: '/zh/advanced/frontend-notify'},
                                {text: '杂项功能', link: '/zh/advanced/misc'},
                            ],
                        },
                        {
                            text: '开发扩展',
                            items: [
                                {text: '接口开发与操作日志', link: '/zh/advanced/rest-api'},
                                {text: '数据库操作 EruptDao', link: '/zh/advanced/erupt-dao'},
                                {text: '工具类', link: '/zh/advanced/utils'},
                                {text: '插件开发', link: '/zh/advanced/plugin'},
                                {text: '扩展 Erupt 注解', link: '/zh/advanced/extend'},
                            ],
                        },
                        {
                            text: '集成接入',
                            items: [
                                {text: '现有项目接入', link: '/zh/advanced/integration'},
                                {text: '登录与认证', link: '/zh/advanced/auth'},
                                {text: '自定义登录页', link: '/zh/advanced/custom-login-page'},
                                {text: '多数据源', link: '/zh/advanced/datasource'},
                                {text: '自定义数据源', link: '/zh/advanced/custom-datasource'},
                                {text: 'Open API 开放接口', link: '/zh/advanced/open-api'},
                            ],
                        },
                    ],

                    '/zh/topics/': [
                        {
                            text: '专题',
                            items: [
                                {text: '专题总览', link: '/zh/topics/'},
                            ],
                        },
                        {
                            text: '第 05 期 · Design Philosophy',
                            items: [
                                {text: '注解 × Spring × Git', link: '/zh/topics/controllable-low-code'},
                            ],
                        },
                        {
                            text: '第 04 期 · BI × LLM',
                            items: [
                                {text: 'Erupt Cube × LLM', link: '/zh/topics/cube-llm'},
                            ],
                        },
                        {
                            text: '第 03 期 · JPA Superset',
                            items: [
                                {text: 'JPA × UI × RBAC × AI × Flow', link: '/zh/topics/jpa-superset'},
                            ],
                        },
                        {
                            text: '第 02 期 · Design Philosophy',
                            items: [
                                {text: '@Erupt × DataProxy × Handler', link: '/zh/topics/annotation-vs-canvas'},
                            ],
                        },
                        {
                            text: '第 01 期 · AI Harness',
                            items: [
                                {text: '50+ LLM × A2A × Memory', link: '/zh/topics/50-llm-a2a-memory'},
                            ],
                        },
                    ],

                    '/zh/modules/': [
                        {
                            text: '扩展模块',
                            items: [
                                {text: '模块总览', link: '/zh/modules/'},
                            ],
                        },
                        {
                            text: 'AI 模块',
                            items: [
                                {text: '🐴 Erupt Ai Harness', link: '/zh/modules/erupt-ai'},
                                {text: '🦞 Erupt Ai Claw', link: '/zh/modules/erupt-ai-claw'},
                                {text: '🛠️ Erupt Ai Skills', link: 'https://github.com/erupts/erupt/tree/master/.claude/skills/erupt'},
                            ],
                        },
                        {
                            text: '核心模块',
                            items: [
                                {text: 'Erupt Upms 权限管理', link: '/zh/modules/erupt-upms'},
                                {text: 'Erupt Jpa 数据库扩展', link: '/zh/modules/erupt-jpa'},
                                {text: 'Erupt Mongodb NoSQL', link: '/zh/modules/erupt-mongodb'},
                                {text: 'Erupt Tpl 自定义页面', link: '/zh/modules/erupt-tpl'},
                                {text: 'Erupt Web 前端源码', link: '/zh/modules/erupt-web'},
                            ],
                        },
                        {
                            text: '工具模块',
                            items: [
                                {text: 'Erupt Terminal 服务终端', link: '/zh/modules/erupt-terminal'},
                                {text: 'Erupt Websocket 实时交互', link: '/zh/modules/erupt-websocket'},
                                {text: 'Erupt Generator 代码生成', link: '/zh/modules/erupt-generator'},
                                {text: 'Erupt Job 定时任务', link: '/zh/modules/erupt-job'},
                                {text: 'Erupt Notice 消息通知', link: '/zh/modules/erupt-notice'},
                                {text: 'Erupt Monitor 服务监控', link: '/zh/modules/erupt-monitor'},
                                {text: 'Erupt Magic Api 在线IDE', link: '/zh/modules/erupt-magic-api'},
                                {text: 'Erupt Print 打印模块', link: '/zh/modules/erupt-print'},
                                {text: 'Erupt Cloud 分布式配置中心', link: '/zh/modules/erupt-cloud'},
                                {text: 'Erupt Cloud Server 部署', link: '/zh/modules/cloud-server'},
                                {text: 'Erupt Cloud Node 部署', link: '/zh/modules/cloud-node'},
                            ],
                        },
                        {
                            text: '商业模块',
                            items: [
                                {text: 'Erupt Chart 报表图表', link: '/zh/modules/pro/erupt-chart'},
                                {text: 'Erupt SaaS 多租户', link: '/zh/modules/pro/erupt-tenant'},
                                {text: 'Erupt Flow 流程引擎', link: '/zh/modules/pro/erupt-flow'},
                                {text: 'Erupt Cube BI 平台', link: '/zh/modules/pro/erupt-cube'},
                            ],
                        },
                        {
                            text: '第三方插件',
                            items: [
                                {text: 'Erupt Dsl ORM动态查询', link: '/zh/modules/third-party/erupt-dsl'},
                                {text: 'Erupt Pf4j 动态加载', link: '/zh/modules/third-party/erupt-pf4j'},
                                {text: 'EZDML 代码生成', link: '/zh/modules/third-party/ezdml'},
                                {text: '公众号采集', link: '/zh/modules/third-party/mp-crawler'},
                                {text: 'Erupt Vote 投票插件', link: '/zh/modules/third-party/erupt-vote'},
                            ],
                        },
                    ],
                },

                editLink: {
                    pattern: 'https://github.com/erupts/erupt-docs/edit/main/:path',
                    text: '在 GitHub 上编辑此页',
                },

                lastUpdated: {
                    text: '最后更新于',
                },

                outline: {
                    label: '本页目录',
                    level: [2, 3],
                },

                docFooter: {
                    prev: '上一页',
                    next: '下一页',
                },

                returnToTopLabel: '回到顶部',
                sidebarMenuLabel: '菜单',
                darkModeSwitchLabel: '主题',
            },
        },
    },

    themeConfig: {
        logo: {light: '/logo.png', dark: '/logo.png'},
        siteTitle: 'Erupt',
        search: {
            provider: 'local'
        },

        socialLinks: [
            {icon: 'github', link: 'https://github.com/erupts/erupt'},
        ],

        footer: {
            message: 'Released under the Apache-2.0 License.',
            copyright: 'Copyright © 2019-present YuePeng',
        },
    },
}))
