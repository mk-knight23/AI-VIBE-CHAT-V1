import { defineStore } from 'pinia'
import type { ProviderId } from '~/server/utils/providers'

export interface ModelPreference {
  id: string
  name: string
  provider: ProviderId
  contextWindow: number
}

export interface ProviderSettings {
  enabled: boolean
  apiKey?: string
  baseUrl?: string
  defaultModel: string
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system'
  fontSize: 'small' | 'medium' | 'large'
  enterToSend: boolean
  showTimestamps: boolean
  showTokens: boolean
  soundEnabled: boolean
  autoSave: boolean
  sidebarCollapsed: boolean
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    // App UI settings
    app: {
      theme: 'dark' as const,
      fontSize: 'medium' as const,
      enterToSend: true,
      showTimestamps: false,
      showTokens: true,
      soundEnabled: false,
      autoSave: true,
      sidebarCollapsed: false,
    } as AppSettings,

    // Default model selection
    defaultProvider: 'openrouter' as ProviderId,
    defaultModel: 'x-ai/grok-4.1-fast',

    // Provider-specific settings
    providers: {
      openrouter: {
        enabled: true,
        defaultModel: 'x-ai/grok-4.1-fast',
      },
      megallm: {
        enabled: false,
        defaultModel: 'megallm-gpt-4',
      },
      agentrouter: {
        enabled: false,
        defaultModel: 'agentrouter-claude',
      },
      routeway: {
        enabled: false,
        defaultModel: 'routeway-gemini',
      },
    } as Record<ProviderId, ProviderSettings>,

    // Generation parameters
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    frequencyPenalty: 0,
    presencePenalty: 0,

    // System prompt
    systemPrompt: 'You are a helpful AI assistant.',
  }),

  getters: {
    isProviderEnabled: (state) => (provider: ProviderId): boolean => {
      return state.providers[provider]?.enabled ?? false
    },

    enabledProviders: (state): ProviderId[] => {
      return (Object.keys(state.providers) as ProviderId[])
        .filter(p => state.providers[p].enabled)
    },

    currentSettings: (state) => (provider: ProviderId) => {
      return state.providers[provider]
    },
  },

  actions: {
    // App settings
    setTheme(theme: AppSettings['theme']) {
      this.app.theme = theme
    },

    setFontSize(size: AppSettings['fontSize']) {
      this.app.fontSize = size
    },

    toggleEnterToSend() {
      this.app.enterToSend = !this.app.enterToSend
    },

    toggleTimestamps() {
      this.app.showTimestamps = !this.app.showTimestamps
    },

    toggleTokens() {
      this.app.showTokens = !this.app.showTokens
    },

    toggleSound() {
      this.app.soundEnabled = !this.app.soundEnabled
    },

    toggleSidebar() {
      this.app.sidebarCollapsed = !this.app.sidebarCollapsed
    },

    // Provider settings
    setDefaultProvider(provider: ProviderId) {
      this.defaultProvider = provider
      this.defaultModel = this.providers[provider].defaultModel
    },

    setDefaultModel(model: string) {
      this.defaultModel = model
    },

    toggleProvider(provider: ProviderId) {
      this.providers[provider].enabled = !this.providers[provider].enabled
    },

    setProviderApiKey(provider: ProviderId, apiKey: string) {
      this.providers[provider].apiKey = apiKey
    },

    // Generation parameters
    setTemperature(temp: number) {
      this.temperature = Math.max(0, Math.min(2, temp))
    },

    setMaxTokens(tokens: number) {
      this.maxTokens = Math.max(1, Math.min(8192, tokens))
    },

    setTopP(topP: number) {
      this.topP = Math.max(0, Math.min(1, topP))
    },

    setFrequencyPenalty(penalty: number) {
      this.frequencyPenalty = Math.max(-2, Math.min(2, penalty))
    },

    setPresencePenalty(penalty: number) {
      this.presencePenalty = Math.max(-2, Math.min(2, penalty))
    },

    setSystemPrompt(prompt: string) {
      this.systemPrompt = prompt
    },

    // Reset to defaults
    resetToDefaults() {
      this.$reset()
    },
  },

  persist: {
    key: 'settings-store',
  },
})
