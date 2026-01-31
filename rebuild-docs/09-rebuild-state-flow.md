# AI-VIBE-CHAT-V1: State Flow Design

## State Architecture Overview

**Pattern:** Centralized Pinia Stores with Composable Orchestration
**Approach:** Unidirectional data flow with reactive updates
**Persistence:** Encrypted localStorage via Pinia plugin

---

## Message Lifecycle

### Complete Flow

```
User Input
    ↓
[UI Layer] ChatInput Component
    ↓ (emit 'send')
[Composable] useChatEngine.sendMessage()
    ↓
[Store] chatStore.addOptimisticMessage()
    ↓ (reactive UI update)
Message appears (sending state)
    ↓
[Composable] encryptContent()
    ↓
[API Layer] $fetch('/api/chat/stream')
    ↓
[Server] Provider Adapter
    ↓
[External] LLM API
    ↑
[Server] Stream chunks
    ↑
[Composable] useStreaming (SSE events)
    ↑
[Store] chatStore.appendChunk()
    ↑ (reactive update)
Message content streams in
    ↑
[Store] chatStore.finalizeMessage()
    ↑
[Plugin] Persistence (encrypted)
    ↑
[UI] Message complete state
```

### State Transitions

| State | Description | Visual |
|-------|-------------|--------|
| `idle` | Ready for input | Normal input |
| `sending` | Message submitted | Disabled input, loading |
| `streaming` | Receiving response | Typing indicator, streaming text |
| `completed` | Response done | Full message, action buttons |
| `error` | Failed | Error message, retry button |
| `aborted` | User cancelled | Partial message, regenerate |

---

## Store Design Concept

### chatStore - Core Chat State

```typescript
interface ChatState {
  // Active conversation
  currentConversationId: string | null
  messages: Message[]
  streamingMessageId: string | null
  isGenerating: boolean

  // Conversations list
  conversations: ConversationSummary[]

  // UI state
  sidebarOpen: boolean
  selectedModel: string
  selectedProvider: string
}

interface ChatActions {
  // Message operations
  sendMessage(content: string): Promise<void>
  appendChunk(messageId: string, chunk: string): void
  finalizeMessage(messageId: string): void
  deleteMessage(messageId: string): void
  regenerateMessage(messageId: string): Promise<void>

  // Conversation operations
  createConversation(): string
  loadConversation(id: string): Promise<void>
  deleteConversation(id: string): void
  renameConversation(id: string, title: string): void

  // Stream control
  abortGeneration(): void
}
```

### settingsStore - Configuration

```typescript
interface SettingsState {
  // Provider settings
  providers: Record<string, ProviderConfig>

  // UI settings
  theme: 'dark' | 'light' | 'system'
  sidebarCollapsed: boolean
  enterToSend: boolean
  showTimestamps: boolean

  // Advanced
  defaultTemperature: number
  defaultMaxTokens: number
  codeTheme: string
}

interface ProviderConfig {
  enabled: boolean
  apiKey?: string  // Encrypted
  defaultModel: string
  customBaseUrl?: string
}
```

### providersStore - Provider Registry

```typescript
interface ProvidersState {
  // Available providers
  providers: ProviderInfo[]

  // Health status
  healthStatus: Record<string, 'healthy' | 'degraded' | 'down'>

  // Rate limits
  rateLimits: Record<string, RateLimitInfo>

  // Cached model lists
  models: Record<string, ModelDefinition[]>
}

interface ProviderActions {
  refreshHealth(): Promise<void>
  fetchModels(provider: string): Promise<void>
  selectProvider(provider: string): void
  selectModel(model: string): void
}
```

### securityStore - Encryption & Keys

```typescript
interface SecurityState {
  // Session encryption
  sessionKey: CryptoKey | null
  isUnlocked: boolean

  // Key metadata
  keyCreatedAt: Date | null
  keyRotationDue: Date | null
}

interface SecurityActions {
  initializeSession(): Promise<void>
  encrypt(data: string): Promise<string>
  decrypt(encrypted: string): Promise<string>
  rotateKey(): Promise<void>
  lock(): void
  unlock(password: string): Promise<boolean>
}
```

---

## Session Persistence Model

### Storage Structure

```typescript
// localStorage keys (all encrypted)
const STORAGE_KEYS = {
  CHAT_MESSAGES: 'chat_v1_messages',
  CONVERSATIONS: 'chat_v1_conversations',
  SETTINGS: 'chat_v1_settings',
  PROVIDER_CONFIGS: 'chat_v1_providers',
  SESSION_METADATA: 'chat_v1_session'
}

// Storage schema with versioning
interface StorageSchema {
  version: number
  encrypted: boolean
  data: string // Base64 encrypted JSON
}
```

### Persistence Flow

```
State Change
    ↓
Pinia Action
    ↓
Pinia Plugin (persistedstate)
    ↓
securityStore.encrypt()
    ↓
AES-GCM Encryption
    ↓
localStorage.setItem()
```

### Hydration Flow

```
App Mount
    ↓
Pinia Store Initialization
    ↓
Pinia Plugin Restore
    ↓
securityStore.decrypt()
    ↓
State Hydrated
    ↓
UI Renders with Data
```

---

## Cache Approach

### Memory Cache (Reactive)

```typescript
// Cached computed properties
const messageCount = computed(() => messages.value.length)
const lastMessage = computed(() => messages.value.at(-1))
const conversationTitle = computed(() => generateTitle(messages.value))
```

### API Response Cache

```typescript
// Provider model lists (cached for 1 hour)
const modelCache = new Map<string, { models: Model[]; expires: number }>()

function getCachedModels(provider: string): Model[] | null {
  const cached = modelCache.get(provider)
  if (cached && cached.expires > Date.now()) {
    return cached.models
  }
  return null
}
```

---

## Undo/Clear Strategy

### Message Undo

```typescript
// chatStore
const messageHistory = ref<Message[][]>([]) // Stack of states

function undoLastMessage() {
  if (messageHistory.value.length > 0) {
    messages.value = messageHistory.value.pop()!
  }
}
```

### Clear Options

| Action | Scope | Confirmation |
|--------|-------|--------------|
| Clear input | Current text only | No |
| Delete message | Single message | No (undo available) |
| Clear chat | All messages in conversation | Yes |
| Delete conversation | Entire conversation | Yes |
| Clear all data | Everything | Yes + password |

---

## Error State Handling

### Error Boundaries

```typescript
// plugins/error-handler.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    logger.error({ error, info })
    const uiStore = useUiStore()
    uiStore.showError('Something went wrong. Please try again.')
  }
})
```

### Recovery Patterns

1. **Network Error:** Auto-retry with backoff
2. **Rate Limit:** Wait for reset, queue message
3. **Provider Down:** Auto-failover to backup
4. **Auth Error:** Prompt for new API key
