<template>
  <div
    class="message-bubble"
    :class="{
      'message-user': message.role === 'user',
      'message-assistant': message.role === 'assistant',
      'message-system': message.role === 'system',
      'message-streaming': isStreaming,
      'message-error': message.error,
    }"
  >
    <div class="message-content">
      <!-- User avatar -->
      <div v-if="message.role === 'user'" class="avatar user-avatar">
        <Icon name="mdi:account" />
      </div>

      <!-- Assistant avatar -->
      <div v-else class="avatar assistant-avatar">
        <Icon name="mdi:robot" />
      </div>

      <div class="message-body">
        <!-- Message header -->
        <div class="message-header">
          <span class="role-label">
            {{ message.role === 'user' ? 'You' : 'AI' }}
          </span>
          <span v-if="message.model" class="model-label">
            {{ message.model }}
          </span>
          <span v-if="showTimestamp" class="timestamp">
            {{ formatTime(message.createdAt) }}
          </span>
        </div>

        <!-- Message text -->
        <div ref="contentRef" class="message-text" v-html="renderedContent" />

        <!-- Token info -->
        <div v-if="message.tokens && showTokens" class="token-info">
          <span>{{ message.tokens.input }} input / {{ message.tokens.output }} output tokens</span>
        </div>

        <!-- Copy confirmation toast -->
        <div v-if="copiedCode" class="copy-toast">
          Code copied to clipboard!
        </div>

        <!-- Message actions -->
        <div v-if="!isStreaming && message.role === 'assistant'" class="message-actions">
          <n-button-group size="tiny">
            <n-button @click="handleCopyMessage">
              <template #icon>
                <Icon name="mdi:content-copy" />
              </template>
              Copy
            </n-button>
            <n-button @click="handleRegenerate">
              <template #icon>
                <Icon name="mdi:refresh" />
              </template>
              Regenerate
            </n-button>
          </n-button-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useSettingsStore } from '~/stores/settings'
import type { Message } from '~/stores/chat'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'

const props = defineProps<{
  message: Message
  isStreaming?: boolean
}>()

const emit = defineEmits<{
  copy: [messageId: string]
  regenerate: [messageId: string]
}>()

const settingsStore = useSettingsStore()
const contentRef = ref<HTMLElement>()
const copiedCode = ref<string | null>(null)

const showTimestamp = computed(() => settingsStore.app.showTimestamps)
const showTokens = computed(() => settingsStore.app.showTokens)

// Configure marked with highlight.js
marked.setOptions({
  gfm: true,
  breaks: true,
  highlight: (code: string, lang: string) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch {
        return code
      }
    }
    return code
  },
})

// Render markdown content
const renderedContent = computed(() => {
  const content = props.message.content
  if (!content) return ''

  try {
    const html = marked.parse(content)
    return DOMPurify.sanitize(html, {
      ADD_ATTR: ['target'],
      FORBID_TAGS: ['script', 'style', 'iframe'],
    })
  } catch {
    return content
  }
})

// Apply syntax highlighting after render
watch(() => props.message.content, () => {
  nextTick(() => highlightCode())
}, { immediate: true })

function highlightCode() {
  if (!contentRef.value) return
  const blocks = contentRef.value.querySelectorAll('pre code')
  blocks.forEach((block) => {
    hljs.highlightElement(block as HTMLElement)
  })
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code)
    copiedCode.value = code.slice(0, 50)
    setTimeout(() => {
      copiedCode.value = null
    }, 2000)
  } catch (err) {
    console.error('Failed to copy code:', err)
  }
}

function handleCopyMessage() {
  emit('copy', props.message.id)
}

function handleRegenerate() {
  emit('regenerate', props.message.id)
}
</script>

<style scoped lang="scss">
.message-bubble {
  padding: 0.5rem 0;
}

.message-content {
  display: flex;
  gap: 1rem;
  max-width: 90%;
}

.message-user .message-content {
  flex-direction: row-reverse;
  margin-left: auto;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.25rem;
}

.user-avatar {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
}

.assistant-avatar {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #06b6d4;
}

.message-body {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1rem;
  max-width: calc(100% - 60px);
}

.message-user .message-body {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(124, 58, 237, 0.9));
  border: none;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.role-label {
  font-weight: 600;
  color: #f1f5f9;
}

.model-label {
  color: #94a3b8;
  font-size: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.timestamp {
  color: #64748b;
  font-size: 0.75rem;
  margin-left: auto;
}

.message-text {
  color: #f1f5f9;
  line-height: 1.6;
  word-wrap: break-word;

  :deep(p) {
    margin: 0 0 0.75rem 0;
    color: inherit;
  }

  :deep(p:last-child) {
    margin-bottom: 0;
  }

  :deep(pre) {
    background: rgba(15, 23, 42, 0.8);
    border-radius: 8px;
    padding: 1rem;
    overflow-x: auto;
    margin: 0.75rem 0;
  }

  :deep(code) {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.875rem;
  }

  :deep(:not(pre) > code) {
    background: rgba(139, 92, 246, 0.2);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    color: #c4b5fd;
  }

  :deep(ul), :deep(ol) {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
  }

  :deep(li) {
    margin: 0.25rem 0;
  }

  :deep(blockquote) {
    border-left: 3px solid #8b5cf6;
    margin: 0.75rem 0;
    padding-left: 1rem;
    color: #94a3b8;
  }

  :deep(a) {
    color: #06b6d4;
    text-decoration: underline;
  }
}

.token-info {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.75rem;
  color: #64748b;
}

.message-actions {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 0.5rem;
}

.message-streaming .message-text::after {
  content: '▊';
  animation: blink 1s infinite;
  color: #8b5cf6;
  margin-left: 0.25rem;
}

.message-error .message-body {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.copy-toast {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background: rgba(34, 197, 94, 0.9);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Syntax highlighting improvements */
.message-text :deep(pre) {
  position: relative;
}

.message-text :deep(.hljs) {
  background: transparent;
}
</style>
