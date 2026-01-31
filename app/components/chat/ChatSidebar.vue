<template>
  <div class="chat-sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <n-button type="primary" block @click="createNewChat">
        <template #icon>
          <Icon name="mdi:plus" />
        </template>
        New Chat
      </n-button>
    </div>

    <div class="sessions-list">
      <div
        v-for="session in sortedSessions"
        :key="session.id"
        class="session-item"
        :class="{ active: session.id === currentSessionId }"
        @click="switchChat(session.id)"
      >
        <Icon name="mdi:message-text" class="session-icon" />
        <div class="session-info">
          <span class="session-title">{{ session.title || 'New Chat' }}</span>
          <span class="session-date">{{ formatDate(session.updatedAt) }}</span>
        </div>
        <n-button
          text
          size="tiny"
          class="delete-btn"
          @click.stop="deleteChat(session.id)"
        >
          <template #icon>
            <Icon name="mdi:delete" />
          </template>
        </n-button>
      </div>
    </div>

    <div class="sidebar-footer">
      <n-button text block @click="showSettings = true">
        <template #icon>
          <Icon name="mdi:cog" />
        </template>
        Settings
      </n-button>
    </div>

    <!-- Settings Modal -->
    <n-modal v-model:show="showSettings" title="Settings" class="settings-modal">
      <SettingsPanel @close="showSettings = false" />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useChatStore } from '~/stores/chat'
import { useSettingsStore } from '~/stores/settings'
import { useChat } from '~/composables/useChat'
import SettingsPanel from '../settings/SettingsPanel.vue'

const chatStore = useChatStore()
const settingsStore = useSettingsStore()
const { createNewChat, deleteChat, switchChat } = useChat()

const showSettings = ref(false)
const isCollapsed = computed(() => settingsStore.app.sidebarCollapsed)

const sortedSessions = computed(() => chatStore.sortedSessions)
const currentSessionId = computed(() => chatStore.currentSessionId)

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
</script>

<style scoped lang="scss">
.chat-sidebar {
  width: 280px;
  height: 100%;
  background: rgba(30, 41, 59, 0.5);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;

  &.collapsed {
    width: 60px;
  }
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sessions-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 0.25rem;

  &:hover {
    background: rgba(255, 255, 255, 0.05);

    .delete-btn {
      opacity: 1;
    }
  }

  &.active {
    background: rgba(139, 92, 246, 0.2);
    border: 1px solid rgba(139, 92, 246, 0.3);
  }
}

.session-icon {
  color: #94a3b8;
  font-size: 1.25rem;
}

.session-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.session-title {
  font-size: 0.875rem;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-date {
  font-size: 0.75rem;
  color: #64748b;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.2s;
  color: #64748b;

  &:hover {
    color: #ef4444;
  }
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
