---
layout: page
---

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  const lang = navigator.language || navigator.userLanguage;
  window.location.replace(lang.startsWith('zh') ? '/zh/' : '/en/')
})
</script>
