<template>
  <div class="chat-container">
    <!-- Empty state when no session or messages -->
    <div v-if="!currentSession || currentMessages.length === 0" class="empty-state">
      <div class="welcome-content">
        <h1 class="gradient-text">AI-VIBE-CHAT-V1</h1>
        <p class="subtitle">Multi-provider AI chat with enterprise security</p>
        <div class="quick-actions">
          <n-button type="primary" size="large" @click="startNewChat">
            <template #icon>
              <Icon name="mdi:chat-plus" />
            </template>
            Start New Chat
          </n-button>
        </div>
        <div class="features">
          <div class="feature">
            <Icon name="mdi:shield-check" class="feature-icon" />
            <span>AES-GCM Encryption</span>
          </div>
          <div class="feature">
            <Icon name="mdi:lightning-bolt" class="feature-icon" />
            <span>Real-time Streaming</span>
          </div>
          <div class="feature">
            <Icon name="mdi:server" class="feature-icon" />
            <span>Multi-provider Support</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat messages -->
    <div v-else class="chat-messages" ref="messagesContainer">
      <MessageBubble
        v-for="message in currentMessages"
        :key="message.id"
        :message="message"
        @regenerate="regenerateMessage"
        @copy="copyMessage"
      />

      <!-- Streaming message -->
      <MessageBubble
        v-if="isStreaming"
        :message="streamingMessage"
        :is-streaming="true"
      />

      <!-- Loading indicator -->
      <TypingIndicator v-if="isLoading && !isStreaming" />

      <!-- Error display -->
      <n-alert
        v-if="error"
        type="error"
        closable
        @close="clearError"
        class="error-alert"
      >
        {{ error }}
      </n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useChat } from '~/composables/useChat'
import MessageBubble from './MessageBubble.vue'
import TypingIndicator from './TypingIndicator.vue'

const {
  currentSession,
  currentMessages,
  isLoading,
  isStreaming,
  error,
  streamingContent,
  createNewChat,
  regenerateMessage,
  copyMessage,
  clearError,
} = useChat()

const messagesContainer = ref<HTMLElement>()

// Computed streaming message for display
const streamingMessage = computed(() => ({
  id: 'streaming',
  role: 'assistant' as const,
  content: streamingContent.value,
  createdAt: Date.now(),
  isStreaming: true,
}))

// Auto-scroll to bottom when new messages arrive
watch(currentMessages, async () => {
  await nextTick()
  scrollToBottom()
}, { deep: true })

watch(streamingContent, async () => {
  await nextTick()
  scrollToBottom()
})

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function startNewChat() {
  createNewChat()
}
</script>

<style scoped lang="scss">
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.welcome-content {
  text-align: center;
  max-width: 600px;
}

.gradient-text {
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
}

.subtitle {
  font-size: 1.25rem;
  color: #94a3b8;
  margin-bottom: 2rem;
}

.quick-actions {
  margin-bottom: 3rem;
}

.features {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.feature {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.875rem;
}

.feature-icon {
  color: #8b5cf6;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.error-alert {
  margin-top: 1rem;
}
</style>
