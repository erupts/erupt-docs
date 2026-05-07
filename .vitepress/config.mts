import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Erupt Framework',
  description: '注解驱动的低代码 Java 框架，零前端代码即可生成后台管理系统',
  lang: 'zh-CN',
  lastUpdated: true,
  cleanUrls: true,
  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', href: '/logo.png' }],
    ['meta', { name: 'theme-color', content: '#646cff' }],
  ],

  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'Erupt',
    search: {
      provider: 'local'
    },

    nav: [
      { text: '指南', link: '/guide/', activeMatch: '/guide/' },
      { text: '注解参考', link: '/annotation/', activeMatch: '/annotation/' },
      { text: '组件类型', link: '/field-types/', activeMatch: '/field-types/' },
      { text: '进阶功能', link: '/advanced/', activeMatch: '/advanced/' },
      { text: '扩展模块', link: '/modules/', activeMatch: '/modules/' },
      { text: '部署', link: '/deployment/', activeMatch: '/deployment/' },
      { text: '开发参考', link: '/dev/', activeMatch: '/dev/' },
      {
        text: '相关链接',
        items: [
          { text: 'GitHub', link: 'https://github.com/erupts/erupt' },
          { text: 'Gitee', link: 'https://gitee.com/erupt/erupt' },
          { text: '在线体验', link: 'https://www.erupt.xyz/demo' },
          { text: '更新日志', link: '/guide/changelog' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始使用',
          items: [
            { text: '框架介绍', link: '/guide/' },
            { text: '快速部署', link: '/guide/quick-start' },
            { text: '入门示例', link: '/guide/getting-started' },
            { text: '参数配置', link: '/guide/configuration' },
          ],
        },
        {
          text: '其他',
          items: [
            { text: '常见问题 FAQ', link: '/guide/faq' },
            { text: '更新日志', link: '/guide/changelog' },
            { text: '升级指南', link: '/guide/upgrade' },
            { text: '社区与贡献', link: '/guide/community' },
          ],
        },
      ],

      '/annotation/': [
        {
          text: '核心注解',
          items: [
            { text: '概览', link: '/annotation/' },
            { text: '@Erupt', link: '/annotation/erupt' },
            { text: '@EruptField', link: '/annotation/erupt-field' },
          ],
        },
        {
          text: '功能注解',
          items: [
            { text: '@Filter 数据过滤', link: '/annotation/filter' },
            { text: '@Power 权限控制', link: '/annotation/power' },
            { text: '@Tree 树形展示', link: '/annotation/tree' },
            { text: '@LinkTree 左树右表', link: '/annotation/link-tree' },
            { text: '@Drill 数据钻取', link: '/annotation/drill' },
            { text: '@Layout 布局定义', link: '/annotation/layout' },
            { text: '@OrderBy 排序', link: '/annotation/order-by' },
            { text: '@RowOperation 行操作', link: '/annotation/row-operation' },
            { text: '@Dynamic 动态控制', link: '/annotation/dynamic' },
          ],
        },
      ],

      '/field-types/': [
        {
          text: '组件类型',
          items: [
            { text: '概览', link: '/field-types/' },
            { text: 'AUTO 自动推测', link: '/field-types/auto' },
            { text: 'INPUT 文本输入', link: '/field-types/input' },
            { text: 'NUMBER 数值', link: '/field-types/number' },
            { text: 'DATE 日期', link: '/field-types/date' },
            { text: 'CHOICE 选择', link: '/field-types/select' },
            { text: 'BOOLEAN 布尔开关', link: '/field-types/boolean' },
            { text: '媒体与富文本', link: '/field-types/media' },
            { text: '可视化组件', link: '/field-types/visual' },
            { text: '其他类型', link: '/field-types/other' },
          ],
        },
        {
          text: '关联组件',
          items: [
            { text: '关联类型概览', link: '/field-types/relation' },
            { text: 'REFERENCE_TABLE 多对一表引用', link: '/field-types/reference-table' },
            { text: 'REFERENCE_TREE 多对一树引用', link: '/field-types/reference-tree' },
            { text: 'CHECKBOX 多对多复选框', link: '/field-types/checkbox' },
            { text: 'TAB_TREE 多对多树引用', link: '/field-types/tab-tree' },
            { text: 'TAB_TABLE_REFER 多对多表引用', link: '/field-types/tab-table-refer' },
            { text: 'TAB_TABLE_ADD 一对多新增', link: '/field-types/tab-table-add' },
            { text: 'COMBINE 一对一新增', link: '/field-types/combine' },
          ],
        },
      ],

      '/advanced/': [
        {
          text: '进阶功能',
          items: [
            { text: 'DataProxy 数据代理', link: '/advanced/data-proxy' },
            { text: '动态表单', link: '/advanced/dynamic-form' },
            { text: '登录与认证', link: '/advanced/auth' },
            { text: '多数据源', link: '/advanced/datasource' },
            { text: '自定义文件上传', link: '/advanced/upload' },
            { text: '事件监听器', link: '/advanced/event-listener' },
            { text: '国际化（i18n）', link: '/advanced/i18n' },
            { text: '杂项功能', link: '/advanced/misc' },
            { text: '现有项目接入', link: '/advanced/integration' },
          ],
        },
      ],

      '/modules/': [
        {
          text: '扩展模块',
          items: [
            { text: '模块总览', link: '/modules/' },
            { text: 'erupt-upms 权限管理', link: '/modules/erupt-upms' },
            { text: 'erupt-job 定时任务', link: '/modules/erupt-job' },
            { text: 'erupt-monitor 服务监控', link: '/modules/erupt-monitor' },
            { text: 'erupt-notice 通知模块', link: '/modules/erupt-notice' },
            { text: 'erupt-jpa 数据库扩展', link: '/modules/erupt-jpa' },
            { text: 'erupt-bi 数据可视化', link: '/modules/erupt-bi' },
            { text: 'erupt-mongodb NoSQL', link: '/modules/erupt-mongodb' },
            { text: 'erupt-magic-api 在线IDE', link: '/modules/erupt-magic-api' },
            { text: 'erupt-tpl 自定义页面', link: '/modules/erupt-tpl' },
            { text: 'erupt-ai 大模型集成', link: '/modules/erupt-ai' },
            { text: 'erupt-flow 流程引擎', link: '/modules/erupt-flow' },
            { text: 'erupt-tenant 多租户', link: '/modules/erupt-tenant' },
            { text: 'erupt-cloud 分布式', link: '/modules/erupt-cloud' },
            { text: 'erupt-web 前端源码', link: '/modules/erupt-web' },
            { text: 'erupt-websocket 实时交互', link: '/modules/erupt-websocket' },
            { text: 'erupt-generator 代码生成', link: '/modules/erupt-generator' },
          ],
        },
      ],

      '/deployment/': [
        {
          text: '部署',
          items: [
            { text: '部署概览', link: '/deployment/' },
            { text: '数据源支持', link: '/deployment/database' },
            { text: '前后端分离部署', link: '/deployment/separation' },
            { text: 'erupt-cloud-server 部署', link: '/deployment/cloud-server' },
            { text: 'erupt-cloud-node 部署', link: '/deployment/cloud-node' },
          ],
        },
      ],

      '/dev/': [
        {
          text: '开发参考',
          items: [
            { text: '接口开发 & 操作日志', link: '/dev/rest-api' },
            { text: 'EruptDao（JDBC）', link: '/dev/erupt-dao' },
            { text: '工具类（util）', link: '/dev/utils' },
            { text: '插件开发', link: '/dev/plugin' },
            { text: '扩展 Erupt 注解', link: '/dev/extend' },
            { text: '甘特图 & 卡片视图', link: '/dev/gantt-card' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/erupts/erupt' },
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
})
