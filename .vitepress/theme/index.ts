import DefaultTheme from 'vitepress/theme'
import './custom.css'

import {h, onMounted, watch, nextTick} from 'vue'
import {useRoute} from 'vitepress'
import mediumZoom, {type Zoom} from 'medium-zoom'
import Floating from './Floating.vue'

import {
    NolebaseEnhancedReadabilitiesMenu,
    NolebaseEnhancedReadabilitiesScreenMenu,
    InjectionKey,
    LayoutMode,
} from '@nolebase/vitepress-plugin-enhanced-readabilities/client'
import '@nolebase/vitepress-plugin-enhanced-readabilities/client/style.css'

import {
    NolebaseHighlightTargetedHeading,
} from '@nolebase/vitepress-plugin-highlight-targeted-heading/client'
import '@nolebase/vitepress-plugin-highlight-targeted-heading/client/style.css'

import {
    NolebaseInlineLinkPreviewPlugin,
} from '@nolebase/vitepress-plugin-inline-link-preview/client'
import '@nolebase/vitepress-plugin-inline-link-preview/client/style.css'

import {
    NolebaseGitChangelogPlugin,
} from '@nolebase/vitepress-plugin-git-changelog/client'
import '@nolebase/vitepress-plugin-git-changelog/client/style.css'

export default {
    extends: DefaultTheme,

    Layout: () => {
        return h(DefaultTheme.Layout, null, {
            'nav-bar-content-after': () => h(NolebaseEnhancedReadabilitiesMenu),
            'nav-screen-content-after': () => h(NolebaseEnhancedReadabilitiesScreenMenu),
            'layout-top': () => h(NolebaseHighlightTargetedHeading),
            'layout-bottom': () => h(Floating),
        })
    },

    // @ts-ignore
    enhanceApp({app, router}) {
        const knownPrefixes = ['/guide', '/annotation', '/field-types', '/advanced', '/modules', '/topics']
        const redirect = (path: string) => {
            const lang = typeof navigator !== 'undefined' ? navigator.language : ''
            const locale = lang.toLowerCase().startsWith('zh') ? 'zh' : 'en'
            window.location.replace('/' + locale + path)
        }
        // 直接访问旧 URL（初始加载）
        if (typeof window !== 'undefined') {
            const path = window.location.pathname
            if (knownPrefixes.some(p => path.startsWith(p))) redirect(path)
        }
        // SPA 站内导航
        router.onBeforeRouteChange = (to: string) => {
            if (knownPrefixes.some(p => to.startsWith(p))) {
                redirect(to)
                return false
            }
        }
        app.provide(InjectionKey, {
            layoutSwitch: {
                defaultMode: LayoutMode.FullWidth,
            },
        })
        if (typeof localStorage !== 'undefined') {
            const key = 'vitepress-nolebase-enhanced-readabilities-layout-switch-mode'
            if (!localStorage.getItem(key))
                localStorage.setItem(key, String(LayoutMode.FullWidth))
        }
        app.use(NolebaseInlineLinkPreviewPlugin)
        app.use(NolebaseGitChangelogPlugin)
    },

    setup() {
        const route = useRoute()
        let zoom: Zoom | null = null
        // 单实例：路由切换时先解绑旧图片再绑定新页面的图片，避免重复创建实例
        const initZoom = () => {
            if (!zoom) zoom = mediumZoom({background: 'var(--vp-c-bg)', margin: 24})
            zoom.detach()
            zoom.attach('.main img')
        }
        onMounted(initZoom)
        watch(() => route.path, () => nextTick(initZoom))
    },
}
