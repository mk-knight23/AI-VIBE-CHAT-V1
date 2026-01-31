<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
// Root app component
useHead({
  title: 'AI-VIBE-CHAT-V1',
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'description', content: 'Multi-provider AI chat application' }
  ]
})
</script>
