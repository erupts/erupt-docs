// erupt OpenAPI 文档（scripts/sync-openapi.mjs 从 erupt 仓库同步）→ 动态路由 + 侧边栏
import {readFileSync} from 'node:fs'
import {usePaths, useSidebar} from 'vitepress-openapi'
import type {DefaultTheme} from 'vitepress'

export const spec = JSON.parse(readFileSync(new URL('../public/openapi/erupt.json', import.meta.url), 'utf8'))

/** 每个接口一个页面：/{locale}/api/{operationId} */
export const apiPaths = () => usePaths({spec}).getPathsByVerbs()
    .map(({operationId, summary}) => ({params: {operationId, title: summary}}))

/** x-tagGroups → 两级侧边栏（分组 → tag → 接口） */
export function apiSidebar(locale: 'zh' | 'en'): DefaultTheme.SidebarItem[] {
    const linkPrefix = `/${locale}/api/`
    const sidebar = useSidebar({spec, linkPrefix})
    return [
        {text: locale === 'zh' ? '概览' : 'Overview', link: linkPrefix},
        ...(spec['x-tagGroups'] as { name: string, tags: string[] }[]).map(group => ({
            text: group.name,
            items: group.tags.map(tag => ({...sidebar.generateSidebarGroup({tag, text: tag}), collapsed: true})),
        })),
    ]
}
