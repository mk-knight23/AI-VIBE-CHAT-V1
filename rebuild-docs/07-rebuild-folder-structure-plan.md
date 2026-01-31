# AI-VIBE-CHAT-V1: Folder Structure Plan

## Structure Philosophy

**Pattern:** Nuxt 3 Conventions with Domain Separation
**Approach:** Flatten where possible, nest by feature
**Principles:**
- File-based routing (Nuxt convention)
- Auto-imports for composables and components
- Domain-driven module organization
- Clear separation of concerns

---

## Proposed Folder Structure

```
AI-VIBE-CHAT-V1-REBUILD/
├── .nuxt/                      # Nuxt build (gitignored)
├── .output/                    # Build output (gitignored)
├── app/                        # Main application code
│   ├── components/             # Vue components
│   │   ├── chat/               # Chat-specific components
│   │   │   ├── ChatContainer.vue
│   │   │   ├── ChatHeader.vue
│   │   │   ├── ChatInput.vue
│   │   │   ├── ChatSidebar.vue
│   │   │   ├── MessageList.vue
│   │   │   ├── MessageBubble.vue
│   │   │   ├── MessageActions.vue
│   │   │   ├── TypingIndicator.vue
│   │   │   └── index.ts        # Component exports
│   │   ├── ui/                 # Reusable UI primitives
│   │   │   ├── GlassCard.vue
│   │   │   ├── GradientButton.vue
│   │   │   ├── CodeBlock.vue
│   │   │   ├── MarkdownRenderer.vue
│   │   │   ├── SkeletonList.vue
│   │   │   └── index.ts
│   │   └── settings/           # Settings components
│   │       ├── SettingsPanel.vue
│   │       ├── ProviderSettings.vue
│   │       ├── SecuritySettings.vue
│   │       ├── AppearanceSettings.vue
│   │       └── index.ts
│   │
│   ├── composables/            # Vue composables (auto-imported)
│   │   ├── useChat.ts          # Main chat logic
│   │   ├── useChatHistory.ts   # Chat session management
│   │   ├── useEncryption.ts    # Crypto operations
│   │   ├── useProviders.ts     # Provider interactions
│   │   ├── useStreaming.ts     # SSE streaming
│   │   ├── useSettings.ts      # Settings access
│   │   ├── usePWA.ts           # PWA functionality
│   │   ├── useTheme.ts         # Theme management
│   │   └── useSidebar.ts       # Sidebar state
│   │
│   ├── layouts/                # Nuxt layouts
│   │   ├── default.vue         # Main app layout
│   │   ├── chat.vue            # Chat-focused layout
│   │   └── minimal.vue         # Minimal layout (settings, etc)
│   │
│   ├── middleware/             # Route middleware
│   │   └── auth.ts             # Auth/session check
│   │
│   ├── pages/                  # File-based routes
│   │   ├── index.vue           # Home (redirects to chat)
│   │   ├── chat/               # Chat routes
│   │   │   ├── [[id]].vue      # Chat with optional ID
│   │   │   └── index.vue       # New chat
│   │   ├── settings.vue        # Settings page
│   │   ├── about.vue           # About page
│   │   └── test.vue            # Test/development
│   │
│   ├── plugins/                # Nuxt plugins
│   │   ├── naive-ui.ts         # Naive UI initialization
│   │   ├── vueuse.ts           # VueUse features
│   │   └── error-handler.ts    # Global error handling
│   │
│   ├── stores/                 # Pinia stores
│   │   ├── chat.ts             # Chat state
│   │   ├── settings.ts         # Settings state
│   │   ├── providers.ts        # Provider registry
│   │   ├── security.ts         # Encryption keys
│   │   └── ui.ts               # UI state (sidebar, etc)
│   │
│   ├── utils/                  # Utility functions
│   │   ├── constants.ts        # App constants
│   │   ├── helpers.ts          # Helper functions
│   │   ├── validators.ts       # Zod schemas
│   │   ├── encryption/         # Encryption utilities
│   │   │   ├── index.ts
│   │   │   ├── aes.ts
│   │   │   └── keys.ts
│   │   └── types/              # TypeScript types
│   │       ├── chat.ts
│   │       ├── provider.ts
│   │       ├── settings.ts
│   │       └── index.ts
│   │
│   ├── assets/                 # Static assets
│   │   ├── styles/             # Global styles
│   │   │   ├── _variables.scss
│   │   │   ├── _mixins.scss
│   │   │   ├── _animations.scss
│   │   │   └── global.scss
│   │   ├── icons/              # Custom icons
│   │   └── images/             # Images
│   │
│   ├── app.vue                 # Root component
│   └── app.config.ts           # App configuration
│
├── server/                     # Nitro server
│   ├── api/                    # API routes
│   │   ├── chat.post.ts        # Chat endpoint
│   │   ├── chat/
│   │   │   └── stream.post.ts  # Streaming endpoint
│   │   ├── providers.get.ts    # List providers
│   │   ├── providers/
│   │   │   ├── health.get.ts   # Health check
│   │   │   └── [id]/
│   │   │       └── models.get.ts
│   │   └── validate-key.post.ts
│   │
│   ├── middleware/             # Server middleware
│   │   ├── cors.ts
│   │   ├── rate-limit.ts
│   │   └── logger.ts
│   │
│   ├── utils/                  # Server utilities
│   │   ├── providers.ts        # Provider registry
│   │   ├── streaming.ts        # Stream helpers
│   │   ├── rate-limiter.ts     # Rate limiting logic
│   │   └── logger.ts           # Logging
│   │
│   └── plugins/                # Nitro plugins
│       └── scheduler.ts        # Background tasks
│
├── public/                     # Static public files
│   ├── manifest.json
│   ├── sw.js
│   ├── icons/
│   │   ├── icon-192x192.png
│   │   └── icon-512x512.png
│   └── robots.txt
│
├── tests/                      # Test files
│   ├── unit/
│   │   ├── composables/
│   │   ├── components/
│   │   └── stores/
│   ├── e2e/
│   │   └── chat.spec.ts
│   └── setup.ts
│
├── nuxt.config.ts              # Nuxt configuration
├── tsconfig.json               # TypeScript config
├── package.json
├── .env.example
├── .gitignore
├── eslint.config.mjs
├── vitest.config.ts
└── README.md
```

---

## Naming Conventions

### Components
- PascalCase: `ChatContainer.vue`, `MessageBubble.vue`
- Multi-word always (Vue style guide)
- Feature prefix for grouping: `Chat*`, `Settings*`, `Ui*`

### Composables
- camelCase with `use` prefix: `useChat.ts`, `useEncryption.ts`
- Placed in `composables/` (auto-imported)

### Stores
- camelCase: `chat.ts`, `settings.ts`
- Store ID matches filename: `defineStore('chat', ...)`

### Pages
- Lowercase: `index.vue`, `settings.vue`
- Dynamic params: `[[id]].vue` (optional), `[slug].vue` (required)

### Server Routes
- Lowercase with HTTP method suffix: `chat.post.ts`, `providers.get.ts`
- Folders for nested routes: `providers/health.get.ts`

### Utilities
- camelCase: `helpers.ts`, `validators.ts`
- Descriptive names: `formatMessageTime`, `validateApiKey`

---

## Responsibility Per Folder

| Folder | Responsibility | What Goes Here |
|--------|---------------|----------------|
| `app/components/` | UI Components | Vue SFCs, organized by feature |
| `app/composables/` | Shared Logic | Vue composables, auto-imported |
| `app/layouts/` | Page Layouts | Nuxt layout components |
| `app/middleware/` | Route Guards | Navigation guards |
| `app/pages/` | Routes | File-based routing pages |
| `app/plugins/` | Initialization | Nuxt plugins |
| `app/stores/` | State | Pinia store definitions |
| `app/utils/` | Helpers | Pure functions, types, constants |
| `app/assets/` | Static Assets | Styles, images, fonts |
| `server/api/` | API Endpoints | Nitro API routes |
| `server/middleware/` | Server Middleware | Request/response processing |
| `server/utils/` | Server Logic | Provider adapters, utilities |

---

## Separation Rules

### UI vs Logic Separation
- **Components** handle presentation only
- **Composables** handle business logic
- **Stores** handle state persistence
- **Server** handles external API calls

### Client vs Server Separation
- No direct provider calls from `app/`
- All provider communication through `server/api/`
- Environment variables only in server
- Client receives only processed data

### Feature Isolation
- Chat-related code in `components/chat/`, `composables/useChat.ts`
- Settings-related in `components/settings/`, `stores/settings.ts`
- No cross-imports between feature folders

---

## Shared vs Isolated Modules

### Shared (Reusable)
- `utils/helpers.ts` - Generic utilities
- `utils/types/` - TypeScript definitions
- `components/ui/` - Generic UI primitives
- `composables/useTheme.ts` - Theme logic
- `assets/styles/_variables.scss` - Design tokens

### Isolated (Feature-Specific)
- `components/chat/` - Chat UI only
- `stores/chat.ts` - Chat state only
- `server/api/chat*` - Chat endpoints only
- Provider adapters in `server/utils/providers.ts`

---

## Config Placement Rules

| Config Type | Location |
|-------------|----------|
| Build config | `nuxt.config.ts` |
| TypeScript | `tsconfig.json` |
| Linting | `eslint.config.mjs` |
| Testing | `vitest.config.ts` |
| Environment | `.env` / `.env.example` |
| App settings | `app/app.config.ts` |
| Tailwind/UnoCSS | Config in `nuxt.config.ts` |
| Naive UI theme | `app/plugins/naive-ui.ts` |

---

## Comparison: Old vs New Structure

### Current (React/Vite)
```
src/
├── components/ui/     # 50+ Radix components
├── features/models/   # Provider adapters
├── hooks/             # React hooks
├── lib/               # Utilities
├── pages/             # Route components
└── tests/
```

### New (Vue/Nuxt)
```
app/
├── components/        # Vue components (feature-organized)
├── composables/       # Auto-imported composables
├── layouts/           # Nuxt layouts
├── pages/             # File-based routes
├── stores/            # Pinia stores
├── utils/             # Utilities + types
└── plugins/

server/
├── api/               # API routes
├── middleware/        # Server middleware
└── utils/             # Server utilities
```

**Key Differences:**
1. File-based routing vs configured routing
2. Auto-imported composables vs manual hook imports
3. Server directory for API layer
4. Stores directory for Pinia
5. Flatter structure with domain organization
