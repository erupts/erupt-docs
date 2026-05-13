import DefaultTheme from 'vitepress/theme'
import './custom.css'

import {h, onMounted, watch, nextTick} from 'vue'
import Floating from './Floating.vue'
import {useRoute} from 'vitepress'
import mediumZoom from 'medium-zoom'

import {
    NolebaseEnhancedReadabilitiesMenu,
    NolebaseEnhancedReadabilitiesScreenMenu,
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

    enhanceApp({app}) {
        app.use(NolebaseInlineLinkPreviewPlugin)
        app.use(NolebaseGitChangelogPlugin)
    },

    setup() {
        const route = useRoute()
        const initZoom = () => {
            mediumZoom('.main img', {background: 'var(--vp-c-bg)'})
        }
        onMounted(initZoom)
        watch(() => route.path, () => nextTick(initZoom))
    },
}
