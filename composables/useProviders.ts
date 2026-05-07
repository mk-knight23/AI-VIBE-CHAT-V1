// composables/useProviders.ts — Multi-LLM provider routing v2.0
// AI-VIBE-CHAT-V1 | Kazi Musharraf | mkazi.live

export interface Provider {
  id: string
  name: string
  models: Model[]
  requiresKey: boolean
  baseUrl?: string
  color: string
}

export interface Model {
  id: string
  name: string
  contextWindow: number
  streaming: boolean
  vision: boolean
  maxOutput: number
  speed: 'fast' | 'medium' | 'slow'
}

export const PROVIDERS: Provider[] = [
  {
    id: 'anthropic', name: 'Anthropic Claude', requiresKey: true, color: '#d97706',
    models: [
      { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', contextWindow: 200000, streaming: true, vision: true, maxOutput: 8192, speed: 'medium' },
      { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', contextWindow: 200000, streaming: true, vision: true, maxOutput: 8192, speed: 'slow' },
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', contextWindow: 200000, streaming: true, vision: true, maxOutput: 8192, speed: 'fast' },
    ]
  },
  {
    id: 'openai', name: 'OpenAI', requiresKey: true, color: '#10a37f',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, streaming: true, vision: true, maxOutput: 4096, speed: 'medium' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000, streaming: true, vision: true, maxOutput: 4096, speed: 'fast' },
    ]
  },
  {
    id: 'groq', name: 'Groq (Ultra-Fast)', requiresKey: true, color: '#6366f1',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', contextWindow: 128000, streaming: true, vision: false, maxOutput: 32768, speed: 'fast' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', contextWindow: 128000, streaming: true, vision: false, maxOutput: 8192, speed: 'fast' },
    ]
  },
  {
    id: 'ollama', name: 'Ollama (Local)', requiresKey: false, baseUrl: 'http://localhost:11434', color: '#22c55e',
    models: [
      { id: 'llama3.2', name: 'Llama 3.2 (Local)', contextWindow: 128000, streaming: true, vision: false, maxOutput: 8192, speed: 'medium' },
      { id: 'mistral', name: 'Mistral 7B (Local)', contextWindow: 32768, streaming: true, vision: false, maxOutput: 8192, speed: 'medium' },
    ]
  }
]

export const useProviders = () => {
  const activeProvider = useState<string>('activeProvider', () => 'anthropic')
  const activeModel = useState<string>('activeModel', () => 'claude-sonnet-4-6')

  const currentProvider = computed(() => PROVIDERS.find(p => p.id === activeProvider.value))
  const currentModel = computed(() => currentProvider.value?.models.find(m => m.id === activeModel.value))

  const setProvider = (providerId: string) => {
    activeProvider.value = providerId
    const p = PROVIDERS.find(x => x.id === providerId)
    if (p?.models[0]) activeModel.value = p.models[0].id
  }

  return { providers: PROVIDERS, activeProvider, activeModel, currentProvider, currentModel, setProvider, setModel: (id: string) => { activeModel.value = id } }
}
