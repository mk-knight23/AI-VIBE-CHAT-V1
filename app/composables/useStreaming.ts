import { ref, computed } from 'vue'

export interface StreamingState {
  isActive: boolean
  content: string
  aborted: boolean
}

export function useStreaming() {
  const state = ref<StreamingState>({
    isActive: false,
    content: '',
    aborted: false,
  })

  const isStreaming = computed(() => state.value.isActive)
  const streamingContent = computed(() => state.value.content)

  function startStreaming(): string {
    state.value = {
      isActive: true,
      content: '',
      aborted: false,
    }
    return generateId()
  }

  function appendStreamingContent(content: string) {
    if (state.value.isActive) {
      state.value.content += content
    }
  }

  function stopStreaming() {
    state.value.isActive = false
  }

  function abortStreaming() {
    state.value.aborted = true
    state.value.isActive = false
  }

  function resetStreaming() {
    state.value = {
      isActive: false,
      content: '',
      aborted: false,
    }
  }

  return {
    streaming: state,
    isStreaming,
    streamingContent,
    startStreaming,
    appendStreamingContent,
    stopStreaming,
    abortStreaming,
    resetStreaming,
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
