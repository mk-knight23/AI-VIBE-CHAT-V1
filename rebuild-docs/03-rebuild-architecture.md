# AI-VIBE-CHAT-V1: Target Architecture

## Architecture Philosophy

**Pattern:** Universal Vue Application with Server Proxy
**Approach:** Layered architecture with clear separation of concerns
**Paradigm:** Composition API with Pinia state management

---

## Layer Architecture

### 1. UI Layer (Presentation)

**Responsibility:** Render interface, capture user input, display output

**Components:**
- Vue Single File Components (.vue)
- Naive UI component library
- Scoped styles with SCSS

**Key Elements:**
- ChatContainer - Main chat interface wrapper
- MessageList - Scrollable message history
- MessageBubble - Individual message display
- ChatInput - User input with attachments
- Sidebar - Chat history and navigation
- SettingsPanel - Configuration interface

**Design Principles:**
- Stateless components (receive props, emit events)
- Composables for shared logic
- Slot-based composition for flexibility
- CSS modules for style isolation

### 2. State Layer (Pinia Stores)

**Responsibility:** Manage application state, caching, persistence

**Stores:**

#### chatStore
```typescript
// Responsibilities:
// - Message history
// - Current conversation
// - Streaming state
// - Message editing/deletion
```

#### settingsStore
```typescript
// Responsibilities:
// - Provider configuration
// - API keys (encrypted)
// - UI preferences
// - Theme settings
```

#### providersStore
```typescript
// Responsibilities:
// - Available providers list
// - Provider health status
// - Model selection
// - Rate limit tracking
```

#### securityStore
```typescript
// Responsibilities:
// - Encryption keys
// - Session management
// - Secure storage interface
```

**Persistence Strategy:**
- Pinia persistedstate plugin
- Encryption for sensitive data
- Versioned storage schema

### 3. Chat Engine Layer (Composables)

**Responsibility:** Orchestrate chat flow, message lifecycle, streaming

**Composables:**

#### useChatEngine
- Message sending orchestration
- Stream handling
- Error recovery
- Retry logic

#### useStreaming
- Server-sent events consumption
- Chunk processing
- Abort controller management
- Typing indicator control

#### useMessageLifecycle
- Message creation
- Status tracking (sending/streaming/completed/error)
- History management
- Branching conversations

### 4. API Abstraction Layer

**Responsibility:** HTTP communication, server API routes

**Client Side:**
- $fetch (Nuxt's wrapper)
- Typed API calls
- Error interceptors

**Server Side (Nitro):**
```typescript
// server/api/chat.post.ts
// server/api/providers.get.ts
// server/api/health.get.ts
```

**Responsibilities:**
- Route provider calls through server
- Hide API keys from client
- Handle provider errors
- Implement retry logic
- Rate limiting enforcement

### 5. Provider Adapter Layer

**Responsibility:** Normalize different LLM provider APIs

**Adapter Interface:**
```typescript
interface ProviderAdapter {
  name: string
  models: Model[]
  sendMessage(request: ChatRequest): Promise<ChatResponse>
  streamMessage(request: ChatRequest): AsyncIterable<Chunk>
  validateKey(key: string): Promise<boolean>
}
```

**Adapters:**
- OpenRouterAdapter
- MegaLLMAdapter
- AgentRouterAdapter
- RoutewayAdapter

**Pattern:** Strategy pattern with factory for instantiation

### 6. Storage/Session Layer

**Responsibility:** Data persistence, encryption, retrieval

**Components:**

#### SecureStorage
- AES-GCM encryption/decryption
- Key derivation from session
- localStorage wrapper

#### SessionManager
- Session initialization
- Key rotation
- Cleanup on logout

#### MigrationHandler
- Storage schema versioning
- Data migration between versions
- Backup/restore functionality

### 7. Error Handling Layer

**Responsibility:** Error detection, reporting, recovery

**Error Types:**
- NetworkError - Connection issues
- ProviderError - API failures
- ValidationError - Input issues
- SecurityError - Encryption/auth issues
- StreamingError - SSE failures

**Handling Strategy:**
- Global error boundary (Vue error handler)
- Store-specific error states
- User-friendly error messages
- Automatic retry with backoff
- Fallback provider selection

---

## Data Flow Architecture

### Message Send Flow

```
User Input
    ↓
ChatInput Component
    ↓ (emit send event)
useChatEngine composable
    ↓ (encrypt)
securityStore
    ↓ (API call)
Nuxt $fetch → Nitro API Route
    ↓ (proxy)
Provider Adapter
    ↓ (HTTP)
LLM Provider API
    ↑ (stream)
Provider Adapter
    ↑ (chunks)
Nitro API Route (SSE)
    ↑
useStreaming composable
    ↑ (decrypt/render)
MessageBubble Component
    ↑
User Sees Response
```

### State Synchronization Flow

```
User Action
    ↓
Component emits event
    ↓
Pinia Store Action
    ↓
State Mutation
    ↓
Persistence Plugin
    ↓
Encrypted localStorage
    ↓
Other Components (reactivity)
    ↓
UI Updates
```

---

## Module Boundaries

### Strict Separation Rules

1. **UI Layer** → Can use: State Layer, Composables
   - Cannot directly call: API Layer, Provider Adapters

2. **State Layer** → Can use: Composables, Storage Layer
   - Cannot: Import UI components

3. **Composables** → Can use: API Layer, Utilities
   - Cannot: Import stores directly (accept as params)

4. **API Layer** → Can use: Provider Adapters
   - Cannot: Import UI or State layers

5. **Provider Adapters** → Standalone
   - Only dependency: HTTP client, types

---

## Server-Side Architecture (Nitro)

### API Routes

```typescript
// server/api/chat.post.ts
// Body: { message, provider, model, history }
// Response: SSE stream or JSON

// server/api/providers.get.ts
// Response: { providers: [...], healthy: [...] }

// server/api/validate-key.post.ts
// Body: { provider, key }
// Response: { valid: boolean }
```

### Server Utilities

```typescript
// server/utils/providers.ts
// - Provider registry
// - Adapter factory
// - Health check scheduler

// server/utils/rate-limit.ts
// - Token bucket implementation
// - Per-client tracking

// server/utils/logger.ts
// - Structured logging
// - Error tracking
```

### Middleware

```typescript
// server/middleware/auth.ts
// - Session validation
// - API key injection (from env)

// server/middleware/cors.ts
// - CORS configuration
// - Security headers
```

---

## Security Architecture

### Encryption Flow

```
User Data
    ↓
Client-side AES-GCM encrypt
    ↓
Store in localStorage (encrypted)
    ↓
On send: decrypt → send to server
    ↓
Server has provider keys (env vars)
    ↓
Provider API (HTTPS)
```

### Key Management

- **Client Keys:** Derived from user session, never stored raw
- **Provider Keys:** Server environment variables only
- **Rotation:** Automatic key rotation every 90 days
- **Backup:** Encrypted backup with recovery key

---

## Performance Architecture

### Optimization Strategies

1. **SSR for Initial Render**
   - First paint from server
   - Hydrate with client state

2. **Lazy Loading**
   - Settings panel async component
   - Provider adapters dynamic import
   - Heavy utilities on-demand

3. **Virtual Scrolling**
   - Message list virtualization for long chats
   - Windowed rendering

4. **State Hydration**
   - Deserialize from localStorage on mount
   - Incremental restoration

5. **Request Deduplication**
   - TanStack Query-style caching
   - Prevent duplicate in-flight requests

---

## Scalability Considerations

### Horizontal Scaling (Server)

- Stateless server design
- Provider keys in environment
- Session storage in Redis (future)
- Load balancer compatible

### Client Performance

- Bundle splitting by route
- Component lazy loading
- Image optimization (Nuxt Image)
- Service worker caching

---

## Monitoring & Observability

### Instrumentation Points

- Message send latency
- Provider response times
- Error rates by provider
- Streaming chunk latency
- State hydration time
- Encryption/decryption time

### Health Checks

- Provider connectivity
- Server resource usage
- Client storage quota
- Encryption key validity
