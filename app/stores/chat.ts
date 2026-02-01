import { defineStore } from 'pinia'
import type { ProviderId } from '~/server/utils/providers'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: number
  updatedAt?: number
  model?: string
  provider?: ProviderId
  tokens?: {
    input: number
    output: number
  }
  error?: string
  isStreaming?: boolean
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  model: string
  provider: ProviderId
  systemPrompt?: string
}

export interface StreamingState {
  isActive: boolean
  messageId: string | null
  content: string
  aborted: boolean
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    sessions: [] as ChatSession[],
    currentSessionId: null as string | null,
    streaming: {
      isActive: false,
      messageId: null as string | null,
      content: '',
      aborted: false,
    } as StreamingState,
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    currentSession: (state): ChatSession | undefined => {
      return state.sessions.find(s => s.id === state.currentSessionId)
    },

    currentMessages: (state): Message[] => {
      const session = state.sessions.find(s => s.id === state.currentSessionId)
      return session?.messages || []
    },

    sortedSessions: (state): ChatSession[] => {
      return [...state.sessions].sort((a, b) => b.updatedAt - a.updatedAt)
    },

    isStreamingState: (state): boolean => state.streaming.isActive,
  },

  actions: {
    createSession(
      title = 'New Chat',
      model = 'x-ai/grok-4.1-fast',
      provider: ProviderId = 'openrouter',
    ): ChatSession {
      const session: ChatSession = {
        id: generateId(),
        title,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model,
        provider,
      }
      this.sessions.unshift(session)
      this.currentSessionId = session.id
      return session
    },

    deleteSession(sessionId: string): void {
      const index = this.sessions.findIndex(s => s.id === sessionId)
      if (index > -1) {
        this.sessions.splice(index, 1)
        if (this.currentSessionId === sessionId) {
          this.currentSessionId = this.sessions[0]?.id || null
        }
      }
    },

    setCurrentSession(sessionId: string): void {
      if (this.sessions.some(s => s.id === sessionId)) {
        this.currentSessionId = sessionId
      }
    },

    addMessage(message: Omit<Message, 'id' | 'createdAt'>): Message {
      const session = this.currentSession
      if (!session) {
        throw new Error('No active session')
      }

      const newMessage: Message = {
        ...message,
        id: generateId(),
        createdAt: Date.now(),
      }

      session.messages.push(newMessage)
      session.updatedAt = Date.now()

      // Auto-update title based on first user message
      if (message.role === 'user' && session.messages.length === 1) {
        session.title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
      }

      return newMessage
    },

    updateMessage(messageId: string, updates: Partial<Message>): void {
      const session = this.currentSession
      if (!session) return

      const message = session.messages.find(m => m.id === messageId)
      if (message) {
        Object.assign(message, updates, { updatedAt: Date.now() })
      }
    },

    deleteMessage(messageId: string): void {
      const session = this.currentSession
      if (!session) return

      const index = session.messages.findIndex(m => m.id === messageId)
      if (index > -1) {
        session.messages.splice(index, 1)
      }
    },

    regenerateMessage(messageId: string): void {
      const session = this.currentSession
      if (!session) return

      const messageIndex = session.messages.findIndex(m => m.id === messageId)
      if (messageIndex > -1 && messageIndex > 0) {
        // Remove the assistant message and all messages after it
        session.messages.splice(messageIndex)
        session.updatedAt = Date.now()
      }
    },

    startStreaming(): string {
      const messageId = generateId()
      this.streaming = {
        isActive: true,
        messageId,
        content: '',
        aborted: false,
      }
      return messageId
    },

    appendStreamingContent(content: string): void {
      if (this.streaming.isActive) {
        this.streaming.content += content
      }
    },

    stopStreaming(): void {
      // Only save if we have content and were actually streaming
      if (this.streaming.isActive && this.streaming.content.trim()) {
        this.addMessage({
          role: 'assistant',
          content: this.streaming.content.trim(),
          isStreaming: false,
        })
      }
      this.resetStreaming()
    },

    resetStreaming(): void {
      this.streaming = {
        isActive: false,
        messageId: null,
        content: '',
        aborted: false,
      }
    },

    abortStreaming(): void {
      // Save partial content if we have any
      if (this.streaming.content.trim()) {
        this.addMessage({
          role: 'assistant',
          content: this.streaming.content.trim() + '\n\n_[Response stopped by user]_',
          isStreaming: false,
        })
      }
      this.streaming.aborted = true
      this.streaming.isActive = false
    },

    setLoading(loading: boolean): void {
      this.isLoading = loading
    },

    setError(error: string | null): void {
      this.error = error
    },

    clearError(): void {
      this.error = null
    },

    clearAllSessions(): void {
      this.sessions = []
      this.currentSessionId = null
    },
  },

  persist: {
    key: 'chat-store',
    paths: ['sessions', 'currentSessionId'],
  },
})

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
