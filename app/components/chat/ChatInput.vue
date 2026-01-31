<template>
  <div class="chat-input">
    <div class="input-container">
      <n-input
        v-model:value="message"
        type="textarea"
        :autosize="{ minRows: 1, maxRows: 6 }"
        :placeholder="placeholder"
        :disabled="isLoading"
        @keydown="handleKeydown"
        @focus="onFocus"
      />

      <div class="input-actions">
        <n-button
          v-if="isStreaming"
          type="error"
          circle
          @click="abortStreaming"
        >
          <template #icon>
            <Icon name="mdi:stop" />
          </template>
        </n-button>

        <n-button
          v-else
          type="primary"
          circle
          :disabled="!canSend"
          :loading="isLoading"
          @click="send"
        >
          <template #icon>
            <Icon name="mdi:send" />
          </template>
        </n-button>
      </div>
    </div>

    <div class="input-footer">
      <span class="hint">
        {{ enterToSend ? 'Enter to send, Shift+Enter for new line' : 'Click send button to send message' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSettingsStore } from '~/stores/settings'
import { useChat } from '~/composables/useChat'

const settingsStore = useSettingsStore()
const { sendMessage, isLoading, isStreaming, abortStreaming } = useChat()

const message = ref('')
const enterToSend = computed(() => settingsStore.app.enterToSend)

const canSend = computed(() => {
  return message.value.trim().length > 0 && !isLoading.value
})

const placeholder = computed(() => {
  if (isLoading.value) return 'AI is responding...'
  return 'Type your message...'
})

function handleKeydown(e: KeyboardEvent) {
  if (enterToSend.value && e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

async function send() {
  const content = message.value.trim()
  if (!content || isLoading.value) return

  message.value = ''
  await sendMessage(content)
}

function onFocus() {
  // Could emit event to parent for focus tracking
}
</script>

<style scoped lang="scss">
.chat-input {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(20px);
}

.input-container {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}

.input-container :deep(.n-input) {
  flex: 1;
  background: rgba(30, 41, 59, 0.5);
}

.input-container :deep(.n-input__textarea) {
  background: transparent;
  color: #f1f5f9;
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.input-container :deep(.n-input__placeholder) {
  color: #64748b;
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.25rem;
}

.input-footer {
  margin-top: 0.5rem;
  text-align: center;
}

.hint {
  font-size: 0.75rem;
  color: #64748b;
}
</style>
