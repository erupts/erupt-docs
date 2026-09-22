---
layout: page
navbar: false
sidebar: false
aside: false
footer: false
pageClass: arch-embed
---

<script setup>
import { onMounted, onUnmounted } from 'vue'
import EruptArch from '../../.vitepress/theme/EruptArch.vue'

// 嵌入方（erupt-site）按内容高度调整 iframe，避免内层滚动条
let ro
const report = () => {
    if (typeof window === 'undefined' || window.parent === window) return
    window.parent.postMessage({ type: 'erupt-arch-height', height: document.documentElement.scrollHeight }, '*')
}
onMounted(() => {
    report()
    ro = new ResizeObserver(report)
    ro.observe(document.documentElement)
    // 站外链接在顶层窗口打开，而不是困在 iframe 里
    document.querySelectorAll('.arch-embed a[href]').forEach(a => a.setAttribute('target', '_top'))
})
onUnmounted(() => ro && ro.disconnect())
</script>

<EruptArch lang="zh" embed />
