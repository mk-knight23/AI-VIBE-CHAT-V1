// Provider adapters barrel export
// Note: Provider adapters are server-side only in Nuxt 3 architecture
// to protect API keys. Import from ~/server/utils/providers instead.

export type {
  ModelRequest,
  ModelResponse,
  ProviderHealth,
  ModelAdapter,
  ProviderConfig,
  ModelRegistryEntry,
  ProviderId,
  StreamingChunk,
  RetryConfig,
  CircuitBreakerConfig
} from '../types/provider'

export {
  ProviderError,
  RateLimitError,
  AuthError
} from '../types/provider'
