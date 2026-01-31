import { defineStore } from 'pinia'
import type { ProviderId, ProviderHealth, ModelRegistryEntry } from '~/server/utils/providers'

export interface ProviderState {
  health: ProviderHealth
  models: ModelRegistryEntry[]
  isLoading: boolean
  error: string | null
  lastChecked: number | null
}

export const useProvidersStore = defineStore('providers', {
  state: () => ({
    providerStates: {} as Record<ProviderId, ProviderState>,
    selectedProvider: 'openrouter' as ProviderId,
    selectedModel: 'x-ai/grok-4.1-fast',
    globalHealthCheckRunning: false,
  }),

  getters: {
    getProviderState: (state) => (provider: ProviderId): ProviderState => {
      return state.providerStates[provider] || {
        health: { status: 'unknown', lastChecked: new Date() },
        models: [],
        isLoading: false,
        error: null,
        lastChecked: null,
      }
    },

    isProviderHealthy: (state) => (provider: ProviderId): boolean => {
      return state.providerStates[provider]?.health.status === 'healthy'
    },

    availableModels: (state): ModelRegistryEntry[] => {
      const allModels: ModelRegistryEntry[] = []
      for (const providerState of Object.values(state.providerStates)) {
        allModels.push(...providerState.models)
      }
      return allModels.filter(m => m.status === 'available')
    },

    modelsByProvider: (state) => (provider: ProviderId): ModelRegistryEntry[] => {
      return state.providerStates[provider]?.models || []
    },

    healthyProviders: (state): ProviderId[] => {
      return (Object.keys(state.providerStates) as ProviderId[])
        .filter(p => state.providerStates[p]?.health.status === 'healthy')
    },
  },

  actions: {
    setSelectedProvider(provider: ProviderId) {
      this.selectedProvider = provider
    },

    setSelectedModel(model: string) {
      this.selectedModel = model
    },

    setProviderHealth(provider: ProviderId, health: ProviderHealth) {
      if (!this.providerStates[provider]) {
        this.providerStates[provider] = {
          health,
          models: [],
          isLoading: false,
          error: null,
          lastChecked: Date.now(),
        }
      } else {
        this.providerStates[provider].health = health
        this.providerStates[provider].lastChecked = Date.now()
      }
    },

    setProviderModels(provider: ProviderId, models: ModelRegistryEntry[]) {
      if (!this.providerStates[provider]) {
        this.providerStates[provider] = {
          health: { status: 'unknown', lastChecked: new Date() },
          models,
          isLoading: false,
          error: null,
          lastChecked: null,
        }
      } else {
        this.providerStates[provider].models = models
      }
    },

    setProviderLoading(provider: ProviderId, loading: boolean) {
      if (!this.providerStates[provider]) {
        this.providerStates[provider] = {
          health: { status: 'unknown', lastChecked: new Date() },
          models: [],
          isLoading: loading,
          error: null,
          lastChecked: null,
        }
      } else {
        this.providerStates[provider].isLoading = loading
      }
    },

    setProviderError(provider: ProviderId, error: string | null) {
      if (!this.providerStates[provider]) {
        this.providerStates[provider] = {
          health: { status: 'unknown', lastChecked: new Date() },
          models: [],
          isLoading: false,
          error,
          lastChecked: null,
        }
      } else {
        this.providerStates[provider].error = error
      }
    },

    async checkProviderHealth(provider: ProviderId) {
      this.setProviderLoading(provider, true)
      this.setProviderError(provider, null)

      try {
        const response = await fetch(`/api/providers/${provider}/health`)
        const data = await response.json()

        if (data.success) {
          this.setProviderHealth(provider, data.data)
        } else {
          this.setProviderError(provider, data.error || 'Health check failed')
          this.setProviderHealth(provider, {
            status: 'unhealthy',
            lastChecked: new Date(),
            error: data.error,
          })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Network error'
        this.setProviderError(provider, errorMessage)
        this.setProviderHealth(provider, {
          status: 'unknown',
          lastChecked: new Date(),
          error: errorMessage,
        })
      } finally {
        this.setProviderLoading(provider, false)
      }
    },

    async checkAllProvidersHealth() {
      this.globalHealthCheckRunning = true
      const providers: ProviderId[] = ['openrouter', 'megallm', 'agentrouter', 'routeway']

      try {
        await Promise.all(providers.map(p => this.checkProviderHealth(p)))
      } finally {
        this.globalHealthCheckRunning = false
      }
    },

    async fetchProviderModels(provider: ProviderId) {
      this.setProviderLoading(provider, true)

      try {
        const response = await fetch(`/api/providers/${provider}/models`)
        const data = await response.json()

        if (data.success) {
          this.setProviderModels(provider, data.data)
        }
      } catch (error) {
        console.error(`Failed to fetch models for ${provider}:`, error)
      } finally {
        this.setProviderLoading(provider, false)
      }
    },
  },

  persist: {
    key: 'providers-store',
    paths: ['selectedProvider', 'selectedModel'],
  },
})
