<template>
  <div class="chat-input">
    <div class="input-container">
      <div class="input-wrapper">
        <n-input
          ref="inputRef"
          v-model:value="message"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 6 }"
          :placeholder="placeholder"
          :disabled="isLoading"
          :maxlength="MAX_MESSAGE_LENGTH"
          @keydown="handleKeydown"
          @focus="onFocus"
          @paste="handlePaste"
        />
        <span v-if="message.length > 0" class="char-count" :class="{ 'near-limit': message.length > MAX_MESSAGE_LENGTH * 0.9 }">
          {{ message.length }}/{{ MAX_MESSAGE_LENGTH }}
        </span>
      </div>

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
      <span v-if="sendError" class="error-message">{{ sendError }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useSettingsStore } from '~/stores/settings'
import { useChat } from '~/composables/useChat'

const MAX_MESSAGE_LENGTH = 4000

const settingsStore = useSettingsStore()
const { sendMessage, isLoading, isStreaming, abortStreaming } = useChat()

const message = ref('')
const inputRef = ref<any>(null)
const isSending = ref(false)
const sendError = ref<string | null>(null)

const enterToSend = computed(() => settingsStore.app.enterToSend)

const canSend = computed(() => {
  const trimmed = message.value.trim()
  return trimmed.length > 0 && trimmed.length <= MAX_MESSAGE_LENGTH && !isLoading.value && !isSending.value
})

const placeholder = computed(() => {
  if (isLoading.value) return 'AI is responding...'
  if (isSending.value) return 'Sending...'
  return 'Type your message...'
})

function handleKeydown(e: KeyboardEvent) {
  if (enterToSend.value && e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

async function handlePaste(e: ClipboardEvent) {
  // Allow normal paste, but validate after
  await nextTick()
  if (message.value.length > MAX_MESSAGE_LENGTH) {
    sendError.value = `Message truncated to ${MAX_MESSAGE_LENGTH} characters`
    message.value = message.value.slice(0, MAX_MESSAGE_LENGTH)
    setTimeout(() => {
      sendError.value = null
    }, 3000)
  }
}

async function send() {
  const content = message.value.trim()
  if (!content || isLoading.value || isSending.value) return
  if (content.length > MAX_MESSAGE_LENGTH) {
    sendError.value = `Message too long (max ${MAX_MESSAGE_LENGTH} characters)`
    return
  }

  // Clear input immediately for better UX
  message.value = ''
  sendError.value = null
  isSending.value = true

  try {
    await sendMessage(content)
  } catch (err) {
    // Error is handled in useChat, but we could restore the message here if needed
    console.error('Failed to send message:', err)
  } finally {
    isSending.value = false
    // Refocus input after sending
    await nextTick()
    inputRef.value?.focus?.()
  }
}

function onFocus() {
  sendError.value = null
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

.input-wrapper {
  flex: 1;
  position: relative;
}

.char-count {
  position: absolute;
  bottom: 0.5rem;
  right: 0.75rem;
  font-size: 0.75rem;
  color: #64748b;
  background: rgba(15, 23, 42, 0.8);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  pointer-events: none;
}

.char-count.near-limit {
  color: #f59e0b;
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

.error-message {
  font-size: 0.75rem;
  color: #ef4444;
  margin-left: 1rem;
}
</style>
