<template>
  <div class="floating-promo">
    <a :href="current.link" target="_blank" class="promo-content">
      <span class="promo-icon">{{ current.icon }}</span>
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


const items = [
  {
    icon: '🤖',
    label: 'Erupt AI',
    desc: '大模型深度集成，低代码构建 AI 应用',
    link: '/modules/erupt-ai',
  },
  {
    icon: '📊',
    label: 'Erupt Cube',
    desc: '语义层 BI 平台，对标 Google Looker',
    link: '/modules/pro/erupt-cube',
  },
  {
    icon: '🆕',
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
  border-radius: 12px;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  max-width: 240px;
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
  font-size: 22px;
  flex-shrink: 0;
}

.promo-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.promo-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  white-space: nowrap;
}

.promo-desc {
  font-size: 11px;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.promo-dots {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--vp-c-divider);
  cursor: pointer;
  transition: background 0.3s;
}

.dot.active {
  background: var(--vp-c-brand-1);
}

</style>
