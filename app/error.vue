<template>
  <div class="error-page">
    <div class="error-content">
      <Icon name="mdi:alert-circle" class="error-icon" />
      <h1>{{ error.statusCode === 404 ? 'Page Not Found' : 'An Error Occurred' }}</h1>
      <p>{{ error.message || 'Something went wrong' }}</p>
      <n-button type="primary" @click="handleError">
        Go Home
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const handleError = () => clearError({ redirect: '/' })
</script>

<style scoped lang="scss">
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  color: #f1f5f9;
}

.error-content {
  text-align: center;
  padding: 2rem;
}

.error-icon {
  font-size: 4rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

p {
  color: #94a3b8;
  margin-bottom: 1.5rem;
}
</style>
