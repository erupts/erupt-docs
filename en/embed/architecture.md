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

// The embedding page (erupt-site) resizes the iframe to the content height
let ro
let lastHeight = 0
// Measure the content element, not documentElement: the latter never drops below the
// iframe viewport height, so the reported height would only ever grow
const report = () => {
    if (typeof window === 'undefined' || window.parent === window) return
    const el = document.querySelector('.ea')
    const height = el ? Math.ceil(el.getBoundingClientRect().height) : document.documentElement.scrollHeight
    if (height === lastHeight) return
    lastHeight = height
    window.parent.postMessage({ type: 'erupt-arch-height', height }, '*')
}
onMounted(() => {
    report()
    ro = new ResizeObserver(report)
    ro.observe(document.querySelector('.ea') || document.documentElement)
    // Open links in the top window instead of inside the iframe
    document.querySelectorAll('.arch-embed a[href]').forEach(a => a.setAttribute('target', '_top'))
})
onUnmounted(() => ro && ro.disconnect())
</script>

<EruptArch lang="en" embed />
