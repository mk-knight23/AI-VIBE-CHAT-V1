# AI-VIBE-CHAT-V1: API Layer Plan

## API Architecture Overview

**Pattern:** Server Proxy with Adapter Abstraction
**Approach:** Client → Nitro API → Provider Adapter → LLM API
**Goal:** Hide API keys, normalize responses, handle errors consistently

---

## Chat API Interface

### Client-to-Server Interface

```typescript
// Client sends to /api/chat
interface ChatRequest {
  message: string
  conversationId?: string
  provider: 'openrouter' | 'megallm' | 'agentrouter' | 'routeway'
  model: string
  temperature?: number
  maxTokens?: number
  attachments?: Attachment[]
  history?: Message[]
}

interface ChatResponse {
  id: string
  content: string
  role: 'assistant'
  model: string
  provider: string
  timestamp: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}
```

### Streaming Interface

```typescript
// SSE Event Types
interface StreamStartEvent {
  event: 'start'
  data: { messageId: string; model: string }
}

interface StreamChunkEvent {
  event: 'chunk'
  data: { content: string }
}

interface StreamErrorEvent {
  event: 'error'
  data: { code: string; message: string }
}

interface StreamEndEvent {
  event: 'end'
  data: { usage: TokenUsage }
}
```

---

## Provider Adapter Interface

### Base Adapter Contract

```typescript
interface ProviderAdapter {
  readonly name: string
  readonly baseUrl: string
  readonly defaultModels: ModelDefinition[]

  // Core methods
  chat(request: ChatRequest): Promise<ChatResponse>
  stream(request: ChatRequest): AsyncGenerator<StreamChunk>
  validateKey(apiKey: string): Promise<ValidationResult>
  listModels(apiKey: string): Promise<ModelDefinition[]>

  // Utility methods
  normalizeError(error: unknown): ProviderError
  parseRateLimit(response: Response): RateLimitInfo
}

interface ValidationResult {
  valid: boolean
  error?: string
  models?: ModelDefinition[]
}

interface RateLimitInfo {
  limit: number
  remaining: number
  resetAt: Date
}
```

### Adapter Implementation Structure

```typescript
// server/utils/providers/openrouter.ts
class OpenRouterAdapter implements ProviderAdapter {
  name = 'openrouter'
  baseUrl = 'https://openrouter.ai/api/v1'

  async chat(request: ChatRequest): Promise<ChatResponse> {
    // Implementation
  }

  async *stream(request: ChatRequest): AsyncGenerator<StreamChunk> {
    // SSE implementation
  }

  async validateKey(apiKey: string): Promise<ValidationResult> {
    // Validation logic
  }

  normalizeError(error: unknown): ProviderError {
    // Normalize to standard error format
  }
}
```

---

## API Route Design

### Route Map

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Non-streaming chat |
| `/api/chat/stream` | POST | Streaming chat (SSE) |
| `/api/providers` | GET | List all providers |
| `/api/providers/health` | GET | Health check all providers |
| `/api/providers/:id/models` | GET | List provider models |
| `/api/validate-key` | POST | Validate API key |

### Route Implementation Examples

```typescript
// server/api/chat.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody<ChatRequest>(event)

  // Validate request
  const validation = validateChatRequest(body)
  if (!validation.valid) {
    throw createError({ statusCode: 400, message: validation.error })
  }

  // Get provider adapter
  const adapter = getProviderAdapter(body.provider)

  // Call provider
  try {
    const response = await adapter.chat(body)
    return response
  } catch (error) {
    throw createError({
      statusCode: 502,
      message: adapter.normalizeError(error).message
    })
  }
})
```

```typescript
// server/api/chat/stream.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody<ChatRequest>(event)

  const adapter = getProviderAdapter(body.provider)

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send start event
        controller.enqueue(formatSSE('start', { messageId: generateId() }))

        // Stream chunks
        for await (const chunk of adapter.stream(body)) {
          controller.enqueue(formatSSE('chunk', chunk))
        }

        // Send end event
        controller.enqueue(formatSSE('end', {}))
        controller.close()
      } catch (error) {
        controller.enqueue(formatSSE('error', adapter.normalizeError(error)))
        controller.close()
      }
    }
  })

  return sendStream(event, stream)
})
```

---

## Mock Provider Strategy

### Mock Adapter Implementation

```typescript
// server/utils/providers/mock.ts
class MockAdapter implements ProviderAdapter {
  name = 'mock'

  async *stream(): AsyncGenerator<StreamChunk> {
    const words = 'This is a mock response for testing purposes.'.split(' ')
    for (const word of words) {
      await delay(100) // Simulate typing
      yield { content: word + ' ' }
    }
  }

  async validateKey(): Promise<ValidationResult> {
    return { valid: true, models: mockModels }
  }
}
```

### Mock Usage Scenarios

1. **Development Mode**
   - No API keys needed
   - Consistent responses
   - Fast iteration

2. **Testing**
   - Predictable outputs
   - Error simulation
   - Rate limit testing

3. **Demo Mode**
   - Public demonstrations
   - Onboarding flows
   - Feature showcases

---

## Future LLM Integration Path

### Adding New Providers

1. **Create Adapter Class**
   ```typescript
   // server/utils/providers/newprovider.ts
   class NewProviderAdapter implements ProviderAdapter {
     // Implementation
   }
   ```

2. **Register in Registry**
   ```typescript
   // server/utils/providers/index.ts
   const adapters = {
     openrouter: new OpenRouterAdapter(),
     megallm: new MegaLLMAdapter(),
     newprovider: new NewProviderAdapter(), // Add here
   }
   ```

3. **Add Environment Config**
   ```env
   NEWPROVIDER_API_KEY=xxx
   ```

### Provider Capabilities Matrix

| Provider | Streaming | Multi-modal | Function Calling | Reasoning |
|----------|-----------|-------------|------------------|-----------|
| OpenRouter | ✓ | ✓ | ✓ | ✓ |
| MegaLLM | ✓ | ✗ | ✗ | ✓ |
| AgentRouter | ✓ | ✗ | ✗ | ✗ |
| Routeway | ✓ | ✗ | ✓ | ✗ |

### Future Considerations

- **OpenAI GPT-5**: Already supported via OpenRouter
- **Claude 4**: Add Anthropic adapter
- **Gemini Pro**: Add Google adapter
- **Local Models**: Ollama/LM Studio integration
- **Custom Endpoints**: Generic OpenAI-compatible adapter

---

## Error Handling Model

### Error Classification

```typescript
enum ErrorType {
  NETWORK = 'network',           // Connection issues
  AUTH = 'auth',                 // Invalid API key
  RATE_LIMIT = 'rate_limit',     // Too many requests
  INVALID_REQUEST = 'invalid',   // Bad parameters
  PROVIDER = 'provider',         // Provider-side error
  TIMEOUT = 'timeout',           // Request timeout
  UNKNOWN = 'unknown'            // Uncategorized
}

interface ProviderError {
  type: ErrorType
  code: string
  message: string
  provider: string
  retryable: boolean
  suggestedAction?: string
}
```

### Error Response Format

```json
{
  "error": {
    "type": "rate_limit",
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "provider": "openrouter",
    "retryable": true,
    "retryAfter": 60
  }
}
```

---

## Retry Strategy

### Retry Configuration

```typescript
interface RetryConfig {
  maxRetries: number      // 3
  baseDelay: number       // 1000ms
  maxDelay: number        // 10000ms
  backoffMultiplier: number // 2
  retryableErrors: ErrorType[] // [NETWORK, RATE_LIMIT, TIMEOUT]
}
```

### Exponential Backoff

```
Attempt 1: Immediate
Attempt 2: 1s delay
Attempt 3: 2s delay
Attempt 4: 4s delay (max)
```

### Implementation

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let attempt = 0

  while (attempt < config.maxRetries) {
    try {
      return await fn()
    } catch (error) {
      attempt++

      if (!isRetryable(error) || attempt >= config.maxRetries) {
        throw error
      }

      const delay = calculateDelay(attempt, config)
      await sleep(delay)
    }
  }

  throw new Error('Max retries exceeded')
}
```

---

## Timeout Strategy

### Timeout Configuration

| Operation | Timeout | Action on Timeout |
|-----------|---------|-------------------|
| Initial connection | 10s | Retry |
| Response start | 30s | Retry with fallback |
| Between chunks | 60s | Continue if streaming |
| Total request | 5min | Abort with error |

### Implementation

```typescript
const TIMEOUTS = {
  connection: 10000,
  responseStart: 30000,
  chunkInterval: 60000,
  total: 300000
}

// AbortController for cancellation
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.total)
```

---

## Streaming Protocol Plan

### Server-Sent Events (SSE) Format

```
event: start
data: {"messageId": "msg_123", "model": "gpt-4"}

event: chunk
data: {"content": "Hello"}

event: chunk
data: {"content": " world"}

event: end
data: {"usage": {"totalTokens": 10}}
```

### Client Consumption

```typescript
// composables/useStreaming.ts
export function useStreaming() {
  const streamMessage = async (request: ChatRequest) => {
    const eventSource = new EventSource('/api/chat/stream', {
      method: 'POST',
      body: JSON.stringify(request)
    })

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleStreamEvent(data)
    }

    return () => eventSource.close() // Cleanup
  }

  return { streamMessage }
}
```

### Error Handling in Streams

```
event: error
data: {"type": "rate_limit", "message": "...", "retryAfter": 60}
```

---

## Security Considerations

### API Key Storage

- **Client:** Never store provider API keys
- **Server:** Environment variables only
- **User keys:** Encrypted at rest if stored

### Request Validation

```typescript
// Zod schema validation
const ChatRequestSchema = z.object({
  message: z.string().min(1).max(10000),
  provider: z.enum(['openrouter', 'megallm', 'agentrouter', 'routeway']),
  model: z.string(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().max(8192).optional()
})
```

### Rate Limiting

- Per-client IP tracking
- Per-user session limits
- Provider-specific quotas
- Sliding window algorithm

---

## Monitoring & Logging

### Structured Logging

```typescript
// Log every request
logger.info({
  event: 'chat_request',
  provider: request.provider,
  model: request.model,
  messageLength: request.message.length,
  duration: endTime - startTime,
  status: 'success' | 'error'
})
```

### Metrics

- Request count by provider
- Response time percentiles
- Error rate by type
- Token usage estimates
- Active streaming connections
