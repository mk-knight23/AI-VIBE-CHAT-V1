<template>
  <ClientOnly>
    <div class="chat-page">
      <ChatSidebar />
      <div class="chat-main">
        <ChatContainer />
        <ChatInput />
      </div>
    </div>
    <template #fallback>
      <div class="chat-page loading">
        <div class="loading-spinner">Loading...</div>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import ChatSidebar from '~/components/chat/ChatSidebar.vue'
import ChatContainer from '~/components/chat/ChatContainer.vue'
import ChatInput from '~/components/chat/ChatInput.vue'
import { useChatStore } from '~/stores/chat'

// Prevent hydration mismatch by only rendering on client
const isClient = ref(false)
onMounted(() => {
  isClient.value = true
})

// Initialize store on mount - runs client-side only
onMounted(() => {
  const chatStore = useChatStore()

  // Small delay to ensure Pinia is fully hydrated from storage
  setTimeout(() => {
    // Create initial session if none exists after hydration
    if (chatStore.sessions.length === 0) {
      chatStore.createSession()
    }

    // Ensure current session is valid
    if (chatStore.currentSessionId && !chatStore.sessions.find(s => s.id === chatStore.currentSessionId)) {
      chatStore.currentSessionId = chatStore.sessions[0]?.id || null
    }
  }, 0)
})
</script>

<style scoped lang="scss">
.chat-page {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-page.loading {
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  color: #94a3b8;
  font-size: 1.25rem;
}
</style>
