import { useChatStore, type Message } from '~/stores/chat'
import { useSettingsStore } from '~/stores/settings'
import { useStreaming } from './useStreaming'
import type { ProviderId, ModelRequest } from '~/server/utils/providers'

export interface SendMessageOptions {
  regenerate?: boolean
  messageId?: string
}

// Timeout for streaming requests (5 minutes)
const STREAMING_TIMEOUT = 5 * 60 * 1000

export function useChat() {
  const chatStore = useChatStore()
  const settingsStore = useSettingsStore()
  const { streaming, startStreaming, stopStreaming, abortStreaming, appendStreamingContent } = useStreaming()

  // Abort controller for fetch cancellation
  let currentAbortController: AbortController | null = null

  const currentSession = computed(() => chatStore.currentSession)
  const currentMessages = computed(() => chatStore.currentMessages)
  const isLoading = computed(() => chatStore.isLoading)
  const isStreaming = computed(() => chatStore.streaming.isActive)
  const error = computed(() => chatStore.error)

  async function sendMessage(content: string, _options: SendMessageOptions = {}) {
    if (!content.trim()) return

    // Cancel any ongoing request
    if (currentAbortController) {
      currentAbortController.abort()
    }

    const session = currentSession.value
    if (!session) {
      chatStore.createSession()
    }

    // Add user message
    chatStore.addMessage({
      role: 'user',
      content: content.trim(),
    })

    // Clear any previous error
    chatStore.clearError()
    chatStore.setLoading(true)

    // Create new abort controller for this request
    currentAbortController = new AbortController()
    const timeoutId = setTimeout(() => {
      currentAbortController?.abort('Timeout')
    }, STREAMING_TIMEOUT)

    try {
      const request: ModelRequest = {
        messages: [
          ...(session?.systemPrompt || settingsStore.systemPrompt
            ? [{ role: 'system' as const, content: session?.systemPrompt || settingsStore.systemPrompt }]
            : []),
          ...currentMessages.value.map((m: Message) => ({
            role: m.role,
            content: m.content,
          })),
        ],
        model: session?.model || settingsStore.defaultModel,
        temperature: settingsStore.temperature,
        maxTokens: settingsStore.maxTokens,
        topP: settingsStore.topP,
        frequencyPenalty: settingsStore.frequencyPenalty,
        presencePenalty: settingsStore.presencePenalty,
        stream: true,
      }

      // Start streaming
      chatStore.startStreaming()

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: currentAbortController.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let receivedContent = false

      try {
        while (true) {
          // Check if aborted
          if (currentAbortController.signal.aborted) {
            throw new Error('Request aborted')
          }

          const { done, value } = await reader.read()
          if (done) break

          receivedContent = true
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                if (parsed.error) {
                  throw new Error(parsed.error)
                }
                if (parsed.content) {
                  chatStore.appendStreamingContent(parsed.content)
                }
              } catch (e) {
                // Skip invalid JSON, but re-throw if it's an error
                if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                  throw e
                }
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
        clearTimeout(timeoutId)
      }

      // If no content was received, throw an error
      if (!receivedContent) {
        throw new Error('No response received from AI')
      }

      // Finalize the streaming message
      chatStore.stopStreaming()

    } catch (err) {
      // Don't treat abort as error
      if (err instanceof Error && err.name === 'AbortError') {
        chatStore.abortStreaming()
        chatStore.setLoading(false)
        currentAbortController = null
        return
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
      chatStore.setError(errorMessage)
      chatStore.abortStreaming()

      // Add error message
      chatStore.addMessage({
        role: 'assistant',
        content: `Error: ${errorMessage}. Please try again.`,
        error: errorMessage,
      })
    } finally {
      chatStore.setLoading(false)
      currentAbortController = null
    }
  }

  function cancelStreaming() {
    if (currentAbortController) {
      currentAbortController.abort()
      currentAbortController = null
    }
    chatStore.abortStreaming()
    chatStore.setLoading(false)
  }

  function regenerateMessage(messageId: string) {
    chatStore.regenerateMessage(messageId)
    // Find the user message before this assistant message
    const session = currentSession.value
    if (!session) return

    const messageIndex = session.messages.findIndex((m: Message) => m.id === messageId)
    if (messageIndex > 0) {
      const userMessage = session.messages[messageIndex - 1]
      if (userMessage?.role === 'user') {
        sendMessage(userMessage.content, { regenerate: true, messageId })
      }
    }
  }

  function copyMessage(messageId: string) {
    const session = currentSession.value
    if (!session) return

    const message = session.messages.find((m: Message) => m.id === messageId)
    if (message?.content) {
      navigator.clipboard.writeText(message.content)
        .then(() => {
          // Could show toast here
          console.log('Message copied to clipboard')
        })
        .catch(err => {
          console.error('Failed to copy message:', err)
        })
    }
  }

  function createNewChat() {
    return chatStore.createSession()
  }

  function deleteChat(sessionId: string) {
    chatStore.deleteSession(sessionId)
  }

  function switchChat(sessionId: string) {
    chatStore.setCurrentSession(sessionId)
  }

  return {
    // State
    currentSession,
    currentMessages,
    isLoading,
    isStreaming,
    error,
    streamingContent: computed(() => chatStore.streaming.content),

    // Actions
    sendMessage,
    regenerateMessage,
    copyMessage,
    createNewChat,
    deleteChat,
    switchChat,
    clearError: chatStore.clearError,
    cancelStreaming,
  }
}
