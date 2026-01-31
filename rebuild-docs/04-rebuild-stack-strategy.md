# AI-VIBE-CHAT-V1: Stack Strategy

## Stack Direction Overview

**From:** React 18 + Vite + Tailwind CSS + Zustand
**To:** Vue 3 + Nuxt 3 + Naive UI + Pinia

**Rationale:** Complete framework migration for different architectural paradigm (universal app vs SPA), improved SSR capabilities, and Vue's composition API for cleaner chat logic.

---

## Target Framework Direction

### Core: Vue 3 + Nuxt 3

| Aspect | Current | Target | Reason |
|--------|---------|--------|--------|
| Framework | React 18 | Vue 3.4 | Composition API for complex state |
| Meta-framework | Vite | Nuxt 3.11 | SSR, file routing, Nitro server |
| Language | TypeScript 5.5 | TypeScript 5.4 | Maintain type safety |
| Runtime | Browser | Node 18+ | Server-side execution |

**Vue 3 Advantages for Chat:**
- Reactivity system ideal for streaming text
- Composition API cleaner than hooks for complex logic
- Better TypeScript inference in templates
- Smaller bundle size than React

**Nuxt 3 Advantages:**
- File-based routing eliminates route config
- Nitro engine for API routes
- Auto-imports reduce boilerplate
- Hybrid rendering modes (SSR/SSG/SPA)

---

## Styling Approach Direction

### From: Tailwind CSS + Radix UI
### To: Naive UI + SCSS + UnoCSS

**Why Not Tailwind?**
- Switching to Vue ecosystem
- Naive UI provides complete component suite
- SCSS for design system tokens
- UnoCSS for utility classes when needed

**Styling Stack:**

| Layer | Technology | Purpose |
|-------|------------|---------|
| Component Library | Naive UI | Pre-built accessible components |
| CSS Framework | UnoCSS | Atomic utilities (Tailwind alternative) |
| Preprocessor | SCSS/Sass | Variables, mixins, nesting |
| Style Scope | CSS Modules | Component isolation |

**Design Token Strategy:**
```scss
// assets/styles/_variables.scss
$colors: (
  primary: #8b5cf6,
  secondary: #06b6d4,
  background: #0f172a,
  surface: #1e293b,
  text: #f1f5f9,
  muted: #94a3b8
);

$radius: (
  sm: 4px,
  md: 8px,
  lg: 16px,
  xl: 24px
);

$shadows: (
  glass: 0 8px 32px rgba(0, 0, 0, 0.3),
  glow: 0 0 20px rgba(139, 92, 246, 0.3)
);
```

---

## State Management Direction

### From: Zustand + Immer
### To: Pinia + pinia-plugin-persistedstate

**Pinia Selection Rationale:**
- Vue's official state management
- DevTools integration superior to Zustand
- TypeScript support out of box
- Modular store design
- Persistence plugin ecosystem

**Store Architecture:**

```typescript
// Option-based stores (Vue style)
export const useChatStore = defineStore('chat', {
  state: () => ({ ... }),
  getters: { ... },
  actions: { ... },
  persist: { ... }  // Plugin config
})
```

**Persistence Strategy:**
- Plugin: pinia-plugin-persistedstate
- Storage: localStorage with encryption
- Selective persistence (encrypt messages, not UI state)
- Versioned storage for migrations

---

## Backend/API Direction

### From: Client-side API calls
### To: Nitro server with API routes

**Architecture Change:**

| Before | After |
|--------|-------|
| Direct provider calls from browser | Server proxy hides API keys |
| API keys in localStorage | API keys in server env vars |
| Client handles all errors | Server handles with retries |
| No server infrastructure | Nitro server included |

**Nitro Benefits:**
- Zero-config server
- Type-safe API routes
- Middleware support
- Edge deployment ready

**API Route Structure:**
```
server/
├── api/
│   ├── chat.post.ts          # Main chat endpoint
│   ├── chat/stream.post.ts   # SSE streaming endpoint
│   ├── providers.get.ts      # List providers
│   ├── providers/health.get.ts  # Health check
│   └── validate-key.post.ts  # Key validation
├── middleware/
│   ├── cors.ts               # CORS headers
│   └── rate-limit.ts         # Rate limiting
└── utils/
    ├── providers.ts          # Provider registry
    └── encryption.ts         # Server-side crypto
```

---

## Streaming Support Plan

### Streaming Architecture

**Current:** ReadableStream in browser
**Target:** Server-sent events (SSE) via Nitro

**Flow:**
```
1. Client POST to /api/chat/stream
2. Nitro establishes SSE connection
3. Server calls provider streaming API
4. Server forwards chunks as SSE events
5. Client EventSource receives chunks
6. Vue reactivity updates UI
```

**Implementation:**
- useEventStream() composable
- AbortController for cancellation
- Automatic reconnection
- Error event handling

---

## LLM/Provider Abstraction Readiness

### Provider Adapter Pattern

**Interface Design:**
```typescript
interface LLMProvider {
  readonly name: string
  readonly models: ModelDefinition[]

  chat(request: ChatRequest): Promise<ChatResponse>
  stream(request: ChatRequest): AsyncGenerator<StreamChunk>
  validate(apiKey: string): Promise<ValidationResult>
}
```

**Adapter Implementation:**
- Class-based adapters (OOP pattern)
- Factory for instantiation
- Error normalization across providers
- Rate limit header parsing

**Provider Roadmap:**

| Phase | Providers | Priority |
|-------|-----------|----------|
| 1 | OpenRouter, MegaLLM | Must have |
| 2 | Agent Router, Routeway | Must have |
| 3 | Groq, Anthropic | Nice to have |
| 4 | Custom providers | Future |

---

## Development Tooling

| Category | Current | Target |
|----------|---------|--------|
| Linter | ESLint 9 | ESLint 9 (maintain) |
| Formatter | Prettier 3 | Prettier 3 (maintain) |
| Testing | Vitest + Playwright | Vitest + Playwright (maintain) |
| Git Hooks | Husky | simple-git-hooks (lighter) |
| DevTools | React DevTools | Vue DevTools |

---

## Dependencies Map

### Core Dependencies

```json
{
  "vue": "^3.4.0",
  "nuxt": "^3.11.0",
  "naive-ui": "^2.38.0",
  "pinia": "^2.1.0",
  "@pinia/nuxt": "^0.5.0",
  "pinia-plugin-persistedstate": "^3.2.0",
  "crypto-js": "^4.2.0",
  "zod": "^3.22.0"
}
```

### Dev Dependencies

```json
{
  "typescript": "^5.4.0",
  "sass": "^1.72.0",
  "unocss": "^0.58.0",
  "@unocss/nuxt": "^0.58.0",
  "vitest": "^1.4.0",
  "@nuxt/test-utils": "^3.12.0",
  "@vue/test-utils": "^2.4.0"
}
```

---

## Migration Complexity Assessment

| Area | Complexity | Risk |
|------|------------|------|
| Component migration | High | Medium |
| State management | Medium | Low |
| Provider adapters | Low | Low |
| Styling | Medium | Medium |
| Testing | High | Medium |
| Build/deploy | Medium | Low |

---

## Stack Compatibility Matrix

| Feature | Vue 3 | Nuxt 3 | Pinia | Naive UI | Status |
|---------|-------|--------|-------|----------|--------|
| SSR | ✓ | ✓ | ✓ | ✓ | ✅ Ready |
| TypeScript | ✓ | ✓ | ✓ | ✓ | ✅ Ready |
| Streaming | ✓ | ✓ | N/A | N/A | ✅ Ready |
| PWA | N/A | ✓ | N/A | N/A | ✅ Ready |
| Encryption | N/A | N/A | N/A | N/A | ✅ Via crypto-js |
| Accessibility | ✓ | ✓ | N/A | ✓ | ✅ Ready |
