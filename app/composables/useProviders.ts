import { computed } from 'vue'
import { useProvidersStore } from '~/stores/providers'
import { useSettingsStore } from '~/stores/settings'
import type { ProviderId, ModelRegistryEntry } from '~/server/utils/providers'

export function useProviders() {
  const providersStore = useProvidersStore()
  const settingsStore = useSettingsStore()

  const selectedProvider = computed({
    get: () => providersStore.selectedProvider,
    set: (value: ProviderId) => providersStore.setSelectedProvider(value),
  })

  const selectedModel = computed({
    get: () => providersStore.selectedModel,
    set: (value: string) => providersStore.setSelectedModel(value),
  })

  const currentModels = computed<ModelRegistryEntry[]>(() => {
    return providersStore.modelsByProvider(selectedProvider.value)
  })

  const healthyProviders = computed<ProviderId[]>(() => {
    return providersStore.healthyProviders
  })

  const isGlobalCheckRunning = computed(() => {
    return providersStore.globalHealthCheckRunning
  })

  function checkProviderHealth(provider: ProviderId) {
    return providersStore.checkProviderHealth(provider)
  }

  function checkAllProviders() {
    return providersStore.checkAllProvidersHealth()
  }

  function getProviderStatus(provider: ProviderId) {
    return providersStore.getProviderState(provider).health.status
  }

  function setProvider(provider: ProviderId) {
    selectedProvider.value = provider
    settingsStore.setDefaultProvider(provider)

    // Update selected model to the provider's default
    const models = providersStore.modelsByProvider(provider)
    if (models.length > 0) {
      selectedModel.value = models[0].id
    }
  }

  function setModel(model: string) {
    selectedModel.value = model
    settingsStore.setDefaultModel(model)
  }

  return {
    // State
    selectedProvider,
    selectedModel,
    currentModels,
    healthyProviders,
    isGlobalCheckRunning,

    // Actions
    checkProviderHealth,
    checkAllProviders,
    getProviderStatus,
    setProvider,
    setModel,
  }
}
