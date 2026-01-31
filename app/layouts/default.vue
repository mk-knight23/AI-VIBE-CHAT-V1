<template>
  <div class="app-layout">
    <ClientOnly>
      <n-config-provider :theme="theme" :theme-overrides="themeOverrides">
        <n-message-provider>
          <n-dialog-provider>
            <slot />
          </n-dialog-provider>
        </n-message-provider>
      </n-config-provider>
      <template #fallback>
        <div class="loading">
          <slot />
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { darkTheme } from 'naive-ui'
import type { GlobalThemeOverrides } from 'naive-ui'

const theme = darkTheme

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#8b5cf6',
    primaryColorHover: '#7c3aed',
    primaryColorPressed: '#6d28d9',
    bodyColor: '#0f172a',
    cardColor: 'rgba(30, 41, 59, 0.7)',
    modalColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: '12px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  Button: {
    textColor: '#f1f5f9',
    colorPrimary: '#8b5cf6',
    colorPrimaryHover: '#7c3aed',
    borderRadiusMedium: '8px',
  },
  Input: {
    color: 'rgba(15, 23, 42, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderHover: 'rgba(139, 92, 246, 0.5)',
    borderFocus: '#8b5cf6',
    textColor: '#f1f5f9',
    placeholderColor: '#64748b',
  },
  Card: {
    color: 'rgba(30, 41, 59, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
  },
  Modal: {
    color: 'rgba(30, 41, 59, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
  },
}
</script>

<style scoped lang="scss">
.app-layout {
  min-height: 100vh;
  background: #0f172a;
  color: #f1f5f9;
}
</style>
