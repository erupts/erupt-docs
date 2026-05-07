import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Erupt Framework',
  description: '注解驱动的低代码 Java 框架，零前端代码即可生成后台管理系统',
  lang: 'zh-CN',
  lastUpdated: true,
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#646cff' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Erupt',

    nav: [
      { text: '指南', link: '/guide/', activeMatch: '/guide/' },
      { text: '核心注解', link: '/annotation/', activeMatch: '/annotation/' },
      { text: '模块', link: '/modules/', activeMatch: '/modules/' },
      { text: '进阶', link: '/advanced/', activeMatch: '/advanced/' },
      {
        text: '相关链接',
        items: [
          { text: 'GitHub', link: 'https://github.com/erupts/erupt' },
          { text: 'Gitee', link: 'https://gitee.com/erupt/erupt' },
          { text: '在线体验', link: 'https://www.erupt.xyz/demo' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始使用',
          items: [
            { text: '简介', link: '/guide/' },
            { text: '快速上手', link: '/guide/quick-start' },
            { text: '项目配置', link: '/guide/configuration' },
            { text: '目录结构', link: '/guide/project-structure' },
          ],
        },
        {
          text: '基础',
          items: [
            { text: '创建第一个页面', link: '/guide/first-page' },
            { text: '字段类型总览', link: '/guide/field-types' },
            { text: '数据关联', link: '/guide/data-relations' },
            { text: '搜索与筛选', link: '/guide/search-filter' },
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
            { text: '@EruptI18n', link: '/annotation/erupt-i18n' },
          ],
        },
        {
          text: '字段注解',
          items: [
            { text: 'Edit（编辑器）', link: '/annotation/edit' },
            { text: 'Search（搜索）', link: '/annotation/search' },
            { text: 'View（视图）', link: '/annotation/view' },
            { text: 'Filter（过滤）', link: '/annotation/filter' },
          ],
        },
        {
          text: '编辑器类型',
          items: [
            { text: 'INPUT / TEXTAREA', link: '/annotation/edit-input' },
            { text: 'NUMBER / SLIDER', link: '/annotation/edit-number' },
            { text: 'DATE / DATE_RANGE', link: '/annotation/edit-date' },
            { text: 'CHOICE / TAGS', link: '/annotation/edit-choice' },
            { text: 'BOOLEAN / SWITCH', link: '/annotation/edit-boolean' },
            { text: 'ATTACHMENT / IMAGE', link: '/annotation/edit-attachment' },
            { text: 'REFERENCE_TABLE', link: '/annotation/edit-reference' },
            { text: 'CODE_EDITOR / HTML', link: '/annotation/edit-code' },
          ],
        },
      ],
      '/modules/': [
        {
          text: '官方模块',
          items: [
            { text: '模块总览', link: '/modules/' },
            { text: 'erupt-web（前端）', link: '/modules/erupt-web' },
            { text: 'erupt-upms（权限管理）', link: '/modules/erupt-upms' },
            { text: 'erupt-job（定时任务）', link: '/modules/erupt-job' },
            { text: 'erupt-monitor（系统监控）', link: '/modules/erupt-monitor' },
            { text: 'erupt-log（操作日志）', link: '/modules/erupt-log' },
          ],
        },
      ],
      '/advanced/': [
        {
          text: '进阶',
          items: [
            { text: '数据代理', link: '/advanced/data-proxy' },
            { text: '自定义操作', link: '/advanced/custom-action' },
            { text: '行操作', link: '/advanced/row-operation' },
            { text: '权限扩展', link: '/advanced/permission' },
            { text: '多数据源', link: '/advanced/multi-datasource' },
            { text: '自定义 SQL', link: '/advanced/custom-sql' },
            { text: '前端扩展', link: '/advanced/frontend-extension' },
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
