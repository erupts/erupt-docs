<template>
  <div class="floating-promo">
    <a :href="current.link" target="_blank" class="promo-content">
      <span class="promo-icon" v-html="current.icon"></span>
      <span class="promo-text">
        <span class="promo-label">{{ current.label }}</span>
        <span class="promo-desc">{{ current.desc }}</span>
      </span>
    </a>
    <div class="promo-dots">
      <span
        v-for="(_, i) in items"
        :key="i"
        :class="['dot', { active: i === index }]"
        @click="index = i"
      />
    </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'


const svgSpark = `<svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.5 L14.3 9.7 L21.5 12 L14.3 14.3 L12 21.5 L9.7 14.3 L2.5 12 L9.7 9.7 Z" fill="#4FC8EC" stroke="#14120B" stroke-width="1.8" stroke-linejoin="round"/></svg>`
const svgCube = `<svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><polygon points="12,2.8 20.5,7.4 20.5,16.6 12,21.2 3.5,16.6 3.5,7.4" fill="#93D655" stroke="#14120B" stroke-width="1.8" stroke-linejoin="round"/><path d="M3.5 7.4 L12 12 L20.5 7.4 M12 12 V21.2" fill="none" stroke="#14120B" stroke-width="1.8" stroke-linejoin="round"/></svg>`
const svgQuery = `<svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><circle cx="10.3" cy="10.3" r="6.8" fill="#F585B4" stroke="#14120B" stroke-width="1.8"/><line x1="15.3" y1="15.3" x2="21" y2="21" stroke="#14120B" stroke-width="2.6" stroke-linecap="round"/></svg>`
const svgCloud = `<svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="#BCA0F2" stroke="#14120B" stroke-width="1.8" stroke-linejoin="round"/></svg>`

const items = [
  {
    icon: svgSpark,
    label: 'Erupt AI',
    desc: '大模型深度集成，低代码构建 AI 应用',
    link: '/modules/erupt-ai',
  },
  {
    icon: svgCube,
    label: 'Erupt Cube',
    desc: '语义层 BI 平台，对标 Google Looker',
    link: '/modules/pro/erupt-cube',
  },
  {
    icon: svgCloud,
    label: 'Erupt Cloud',
    desc: '分布式配置管理，替代 Apollo / Nacos',
    link: '/modules/erupt-cloud',
  },
  {
    icon: svgQuery,
    label: 'Linq.J',
    desc: '作者新作：通用对象查询语言',
    link: 'https://linq.erupt.xyz/',
  },
]

const index = ref(0)
const current = computed(() => items[index.value])

let timer: ReturnType<typeof setInterval>

onMounted(() => {
  timer = setInterval(() => {
    index.value = (index.value + 1) % items.length
  }, 4000)
})

onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.floating-promo {
  position: fixed;
  bottom: 28px;
  right: 24px;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 0;
  background: #FFF9EE;
  border: 2px solid #14120B;
  box-shadow: 4px 4px 0 #14120B;
  max-width: 240px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.floating-promo:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 #14120B;
}

.dark .floating-promo {
  background: #201C12;
  border-color: #F0E8D6;
  box-shadow: 4px 4px 0 #F0E8D6;
}

.dark .floating-promo:hover {
  box-shadow: 6px 6px 0 #F0E8D6;
}

.promo-content {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex: 1;
  min-width: 0;
}

.promo-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.promo-icon :deep(svg) {
  display: block;
}

.promo-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.promo-label {
  font-size: 13px;
  font-weight: 800;
  color: #14120B;
  white-space: nowrap;
}

.dark .promo-label {
  color: #F0E8D6;
}

.promo-desc {
  font-size: 11px;
  color: #5C5647;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dark .promo-desc {
  color: #B0A78F;
}

.promo-dots {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 0;
  background: #D9D2C2;
  cursor: pointer;
  transition: background 0.3s;
}

.dot.active {
  background: #4FC8EC;
}

.dark .dot {
  background: #4A453A;
}

.dark .dot.active {
  background: #4FC8EC;
}

</style>
