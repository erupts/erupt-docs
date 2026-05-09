import {defineConfig} from 'vitepress'
import {withMermaid} from 'vitepress-plugin-mermaid'
import {
    InlineLinkPreviewElementTransform
} from '@nolebase/vitepress-plugin-inline-link-preview/markdown-it'

export default withMermaid(defineConfig({
    title: 'Erupt',
    description: 'MDD & Annotation-driven Low-code Data platform & AI Harness',
    lang: 'zh-CN',
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
        ssr: {
            noExternal: [
                '@nolebase/vitepress-plugin-enhanced-readabilities',
                '@nolebase/vitepress-plugin-highlight-targeted-heading',
                '@nolebase/vitepress-plugin-inline-link-preview',
                'vitepress-plugin-mermaid',
                'mermaid',
            ],
        },
    },

    themeConfig: {
        logo: {light: '/logo.png', dark: '/logo.png'},
        siteTitle: 'Erupt',
        search: {
            provider: 'local'
        },

        nav: [
            {text: '指南', link: '/guide/', activeMatch: '/guide/'},
            {text: '注解参考', link: '/annotation/', activeMatch: '/annotation/'},
            {text: '组件类型', link: '/field-types/', activeMatch: '/field-types/'},
            {text: '进阶', link: '/advanced/', activeMatch: '/advanced/'},
            {text: '扩展模块', link: '/modules/', activeMatch: '/modules/'},
            {text: '更新日志', link: '/guide/changelog'},
            {text: '🚀 项目初始化', link: 'https://start.erupt.xyz/'},
            {
                text: '相关链接',
                items: [
                    {text: '官网', link: 'https://www.erupt.xyz'},
                    {text: 'Linq.J', link: 'https://linq.erupt.xyz/'},
                    {text: 'GitHub', link: 'https://github.com/erupts/erupt'},
                    {text: 'Gitee', link: 'https://gitee.com/erupt/erupt'},
                    {text: '在线体验', link: 'https://www.erupt.xyz/demo'},
                ],
            },
        ],

        sidebar: {
            '/guide/': [
                {
                    text: '开始使用',
                    items: [
                        {text: '🚀 项目初始化', link: 'https://start.erupt.xyz/'},
                        {text: '框架介绍', link: '/guide/'},
                        {text: '快速部署', link: '/guide/quick-start'},
                        {text: '入门示例', link: '/guide/getting-started'},
                        {text: '参数配置', link: '/guide/configuration'},
                    ],
                },
                {
                    text: '部署',
                    items: [
                        {text: '数据源支持', link: '/guide/database'},
                        {text: '前后端分离部署', link: '/guide/separation'},
                    ],
                },
                {
                    text: '其他',
                    items: [
                        {text: '常见问题 FAQ', link: '/guide/faq'},
                        {text: '更新日志', link: '/guide/changelog'},
                        {text: '升级指南', link: '/guide/upgrade'},
                        {text: '架构图', link: '/guide/architecture'},
                        {text: '加入讨论', link: '/guide/community'},
                        {text: '贡献指南', link: '/guide/contributing'},
                        {text: '捐赠', link: '/guide/donate'},
                    ],
                },
            ],

            '/annotation/': [
                {
                    text: '核心注解',
                    items: [
                        {text: '概览', link: '/annotation/'},
                        {text: '@Erupt', link: '/annotation/erupt'},
                        {text: '@EruptField', link: '/annotation/erupt-field'},
                        {text: '@Edit 编辑配置', link: '/annotation/edit'},
                        {text: '@View 展示配置', link: '/annotation/view'},
                        {text: '@Search 搜索', link: '/annotation/search'},
                    ],
                },
                {
                    text: '功能注解',
                    items: [
                        {text: '@Filter 数据过滤', link: '/annotation/filter'},
                        {text: '@Power 权限控制', link: '/annotation/power'},
                        {text: '@Tree 树形展示', link: '/annotation/tree'},
                        {text: '@LinkTree 左树右表', link: '/annotation/link-tree'},
                        {text: '@Drill 数据钻取', link: '/annotation/drill'},
                        {text: '@Layout 布局定义', link: '/annotation/layout'},
                        {text: '@OrderBy 排序', link: '/annotation/order-by'},
                        {text: '@RowOperation 行按钮', link: '/annotation/row-operation'},
                        {text: '@Dynamic 动态控制', link: '/annotation/dynamic'},
                        {text: '@Vis 多视图', link: '/annotation/vis'},
                        {text: '卡片视图 CARD', link: '/annotation/vis-card'},
                        {text: '甘特图 GANTT', link: '/annotation/vis-gantt'},
                    ],
                },
            ],

            '/field-types/': [
                {
                    text: '组件类型',
                    items: [
                        {text: '概览', link: '/field-types/'},
                        {text: 'AUTO 自动推测', link: '/field-types/auto'},
                        {text: 'INPUT 单行文本', link: '/field-types/input'},
                        {text: 'TEXTAREA 多行文本', link: '/field-types/textarea'},
                        {text: 'NUMBER 数值输入', link: '/field-types/number'},
                        {text: 'SLIDER 数字滑块', link: '/field-types/slider'},
                        {text: 'DATE 日期', link: '/field-types/date'},
                        {text: 'BOOLEAN 布尔开关', link: '/field-types/boolean'},
                        {text: 'MAP 地理位置', link: '/field-types/map'},
                        {text: 'COLOR 颜色选择', link: '/field-types/color'},
                        {text: 'RATE 评分器', link: '/field-types/rate'}
                    ],
                },
                {
                    text: '选择类组件',
                    items: [
                        {text: 'CHOICE 单选', link: '/field-types/choice'},
                        {text: 'MULTI_CHOICE 多选', link: '/field-types/multi-choice'},
                        {text: 'TAGS 标签选择', link: '/field-types/tags'},
                        {text: 'AUTO_COMPLETE 自动完成', link: '/field-types/auto-complete'},
                    ],
                },
                {
                    text: '媒体与编辑器',
                    items: [
                        {text: 'ATTACHMENT 文件上传', link: '/field-types/attachment'},
                        {text: 'HTML_EDITOR 富文本', link: '/field-types/html-editor'},
                        {text: 'CODE_EDITOR 代码编辑器', link: '/field-types/code-editor'},
                        {text: 'MARKDOWN 编辑器', link: '/field-types/markdown'},
                        {text: 'SIGNATURE 签名板', link: '/field-types/signature'},
                    ],
                },
                {
                    text: '关联组件',
                    items: [
                        {text: '关联类型概览', link: '/field-types/relation'},
                        {text: 'REFERENCE_TABLE 多对一表引用', link: '/field-types/reference-table'},
                        {text: 'REFERENCE_TREE 多对一树引用', link: '/field-types/reference-tree'},
                        {text: 'CHECKBOX 多对多复选框', link: '/field-types/checkbox'},
                        {text: 'TAB_TREE 多对多树引用', link: '/field-types/tab-tree'},
                        {text: 'TAB_TABLE_REFER 多对多表引用', link: '/field-types/tab-table-refer'},
                        {text: 'TAB_TABLE_ADD 一对多新增', link: '/field-types/tab-table-add'},
                        {text: 'COMBINE 一对一新增', link: '/field-types/combine'},
                    ],
                },
                {
                    text: '其他类型',
                    items: [
                        {text: 'DIVIDE 分割线', link: '/field-types/divide'},
                        {text: 'TPL 自定义模板', link: '/field-types/tpl'},
                        {text: 'HIDDEN 隐藏字段', link: '/field-types/hidden'},
                        {text: 'EMPTY 空占位', link: '/field-types/empty'},
                    ],
                },
            ],

            '/advanced/': [
                {
                    text: '业务扩展',
                    items: [
                        {text: '数据代理 DataProxy', link: '/advanced/data-proxy'},
                        {text: '全局拦截 PostDataProxy', link: '/advanced/post-data-proxy'},
                        {text: '动态表单', link: '/advanced/dynamic-form'},
                        {text: '自定义文件上传', link: '/advanced/upload'},
                        {text: '事件监听器', link: '/advanced/event-listener'},
                        {text: '国际化', link: '/advanced/i18n'},
                        {text: '前端消息与弹窗', link: '/advanced/frontend-notify'},
                        {text: '杂项功能', link: '/advanced/misc'},
                    ],
                },
                {
                    text: '开发扩展',
                    items: [
                        {text: '接口开发与操作日志', link: '/advanced/rest-api'},
                        {text: '数据库操作 EruptDao', link: '/advanced/erupt-dao'},
                        {text: '工具类', link: '/advanced/utils'},
                        {text: '插件开发', link: '/advanced/plugin'},
                        {text: '扩展 Erupt 注解', link: '/advanced/extend'},
                    ],
                },
                {
                    text: '集成接入',
                    items: [
                        {text: '现有项目接入', link: '/advanced/integration'},
                        {text: '登录与认证', link: '/advanced/auth'},
                        {text: '自定义登录页', link: '/advanced/custom-login-page'},
                        {text: '多数据源', link: '/advanced/datasource'},
                        {text: '自定义数据源', link: '/advanced/custom-datasource'},
                    ],
                },
            ],

            '/modules/': [
                {
                    text: '扩展模块',
                    items: [
                        {text: '模块总览', link: '/modules/'},
                    ],
                },
                {
                    text: '核心模块',
                    items: [
                        {text: 'Erupt Upms 权限管理', link: '/modules/erupt-upms'},
                        {text: 'Erupt Jpa 数据库扩展', link: '/modules/erupt-jpa'},
                        {text: 'Erupt Mongodb NoSQL', link: '/modules/erupt-mongodb'},
                        {text: 'Erupt Tpl 自定义页面', link: '/modules/erupt-tpl'},
                        {text: 'Erupt Web 前端源码', link: '/modules/erupt-web'},
                    ],
                },
                {
                    text: '工具模块',
                    items: [
                        {text: 'Erupt Websocket 实时交互', link: '/modules/erupt-websocket'},
                        {text: 'Erupt Generator 代码生成', link: '/modules/erupt-generator'},
                        {text: 'Erupt Job 定时任务', link: '/modules/erupt-job'},
                        {text: 'Erupt Notice 消息通知', link: '/modules/erupt-notice'},
                        {text: 'Erupt Monitor 服务监控', link: '/modules/erupt-monitor'},
                        {text: 'Erupt Magic Api 在线IDE', link: '/modules/erupt-magic-api'},
                        {text: 'Erupt Print 打印模块', link: '/modules/erupt-print'},
                        {text: 'Erupt Cloud 分布式', link: '/modules/erupt-cloud'},
                        {text: 'Erupt Cloud Server 部署', link: '/modules/cloud-server'},
                        {text: 'Erupt Cloud Node 部署', link: '/modules/cloud-node'},
                    ],
                },
                {
                    text: 'AI 模块',
                    items: [
                        {text: '🐴 Erupt Ai Harness', link: '/modules/erupt-ai'},
                        {text: '🦞 Erupt Ai Claw', link: '/modules/erupt-ai-claw'},
                        {text: '🛠️ Erupt Ai Skill', link: 'https://github.com/erupts/erupt/tree/master/.claude/skills/erupt'},
                    ],
                },
                {
                    text: '商业模块',
                    items: [
                        {text: 'Erupt Chart 报表图表', link: '/modules/pro/erupt-chart'},
                        {text: 'Erupt Flow 流程引擎', link: '/modules/pro/erupt-flow'},
                        {text: 'Erupt SaaS 多租户', link: '/modules/pro/erupt-tenant'},
                        {text: 'Erupt Cube BI 平台', link: '/modules/pro/erupt-cube'},
                    ],
                },
                {
                    text: '第三方插件',
                    items: [
                        {text: 'Erupt Dsl ORM动态查询', link: '/modules/third-party/erupt-dsl'},
                        {text: 'Erupt Pf4j 动态加载', link: '/modules/third-party/erupt-pf4j'},
                        {text: 'EZDML 代码生成', link: '/modules/third-party/ezdml'},
                        {text: '公众号采集', link: '/modules/third-party/mp-crawler'},
                        {text: 'Erupt Vote 投票插件', link: '/modules/third-party/erupt-vote'},
                    ],
                },
            ],

            '/dev/': [
                {
                    text: '开发参考',
                    items: [
                        {text: '接口开发与操作日志', link: '/dev/rest-api'},
                        {text: 'EruptDao 数据操作', link: '/dev/erupt-dao'},
                        {text: '工具类', link: '/dev/utils'},
                        {text: '插件开发', link: '/dev/plugin'},
                        {text: '扩展 Erupt 注解', link: '/dev/extend'},
                    ],
                },
            ],
        },

        socialLinks: [
            {icon: 'github', link: 'https://github.com/erupts/erupt'},
        ],

        footer: {
            message: 'Released under the Apache-2.0 License.',
            copyright: 'Copyright © 2019-present YuePeng',
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
}))
