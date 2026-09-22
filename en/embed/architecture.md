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
const report = () => {
    if (typeof window === 'undefined' || window.parent === window) return
    window.parent.postMessage({ type: 'erupt-arch-height', height: document.documentElement.scrollHeight }, '*')
}
onMounted(() => {
    report()
    ro = new ResizeObserver(report)
    ro.observe(document.documentElement)
    // Open links in the top window instead of inside the iframe
    document.querySelectorAll('.arch-embed a[href]').forEach(a => a.setAttribute('target', '_top'))
})
onUnmounted(() => ro && ro.disconnect())
</script>

<EruptArch lang="en" embed />
