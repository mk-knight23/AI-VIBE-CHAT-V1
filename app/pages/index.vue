<template>
  <div class="chat-page">
    <ChatSidebar />
    <div class="chat-main">
      <ChatContainer />
      <ChatInput />
    </div>
  </div>
</template>

<script setup lang="ts">
import ChatSidebar from '~/components/chat/ChatSidebar.vue'
import ChatContainer from '~/components/chat/ChatContainer.vue'
import ChatInput from '~/components/chat/ChatInput.vue'
import { useChatStore } from '~/stores/chat'

// Initialize store on mount
onMounted(() => {
  const chatStore = useChatStore()
  // Create initial session if none exists
  if (chatStore.sessions.length === 0) {
    chatStore.createSession()
  }
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
</style>
