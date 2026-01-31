# AI-VIBE-CHAT-V1 - Rebuilt with Vue 3 + Nuxt 3

> Production-ready AI chat application rebuilt with Vue 3, Nuxt 3, and Naive UI. Multi-provider support with enterprise security.

## 🎯 Rebuild Overview

This project has been rebuilt from React/Vite to **Vue 3 + Nuxt 3** following the specifications in `/rebuild-docs/`.

### What's Changed

| Aspect | Before (v4.0) | After (Rebuilt) |
|--------|---------------|-----------------|
| **Framework** | React 18 + Vite | Vue 3.4 + Nuxt 3.11 |
| **State** | Zustand | Pinia with persistence |
| **UI** | Radix UI + shadcn | Naive UI |
| **Styling** | Tailwind CSS | SCSS + Glassmorphism |
| **Server** | Client-side only | Nitro SSR/SSG |
| **Security** | Client API calls | Server proxy (hidden keys) |

### Preserved Features

- ✅ Multi-provider support (OpenRouter, MegaLLM, AgentRouter, Routeway)
- ✅ 10+ AI models
- ✅ AES-GCM encryption
- ✅ PWA capabilities
- ✅ WCAG 2.1 AA accessibility
- ✅ Provider health monitoring
- ✅ Rate limiting

### New Features

- ✅ Server-side rendering for SEO
- ✅ Server-side API proxy (secure API keys)
- ✅ Glassmorphism UI theme
- ✅ File-based routing
- ✅ Auto-imported composables

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your API keys

# Run development server
npm run dev

# Open http://localhost:3000
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        NUXT 3 APP                           │
├─────────────────────────────────────────────────────────────┤
│  UI Layer        │  Vue SFCs + Naive UI                      │
│  State Layer     │  Pinia stores (persisted + encrypted)     │
│  Chat Engine     │  Composables (useChat, useStreaming)      │
│  API Layer       │  $fetch → Nitro routes                    │
└─────────────────────────────────────────────────────────────┘
                             │
┌─────────────────────────────────────────────────────────────┐
│                      NITRO SERVER                           │
├─────────────────────────────────────────────────────────────┤
│  API Routes      │  /api/chat, /api/providers                │
│  Adapters        │  OpenRouter, MegaLLM, AgentRouter, Routeway│
│  Middleware      │  CORS, rate limiting, auth                │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
app/
├── components/          # Vue components
│   ├── chat/           # Chat-specific components
│   ├── settings/       # Settings components
│   └── ui/             # Reusable UI primitives
├── composables/        # Auto-imported composables
│   ├── useChat.ts
│   ├── useStreaming.ts
│   └── useProviders.ts
├── layouts/            # Nuxt layouts
├── pages/              # File-based routes
├── plugins/            # Nuxt plugins
│   ├── naive-ui.ts
│   └── error-handler.ts
├── stores/             # Pinia stores
│   ├── chat.ts
│   ├── settings.ts
│   ├── providers.ts
│   └── security.ts
├── utils/              # Utilities
│   ├── encryption/     # AES encryption
│   ├── providers/      # Provider adapters (client)
│   └── types/          # TypeScript types
└── assets/styles/      # SCSS styles
    ├── _variables.scss
    ├── _mixins.scss
    └── global.scss

server/
├── api/                # API routes
│   ├── chat.post.ts
│   ├── chat/stream.post.ts
│   ├── providers.get.ts
│   └── providers/health.get.ts
├── middleware/         # Server middleware
└── utils/              # Server utilities
    ├── providers/      # Provider adapters (server)
    ├── rateLimiter.ts
    └── modelRegistry.ts
```

## 🎨 Theme

**Glassmorphism Design System:**

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0f172a` | Main background |
| `--bg-secondary` | `#1e293b` | Card backgrounds |
| `--accent-primary` | `#8b5cf6` | Purple accent |
| `--accent-secondary` | `#06b6d4` | Cyan accent |
| `--text-primary` | `#f1f5f9` | Main text |
| `--text-secondary` | `#94a3b8` | Muted text |

**Glass Card Effect:**
```scss
background: rgba(30, 41, 59, 0.7);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.1);
```

## 🔧 Environment Variables

```env
# Server-side only (API keys hidden from client)
OPENROUTER_API_KEY=your_key
MEGALLM_API_KEY=your_key
AGENTROUTER_API_KEY=your_key
ROUTEWAY_API_KEY=your_key

# Encryption
ENCRYPTION_KEY=your_32_char_key

# Public (exposed to client)
NUXT_PUBLIC_APP_NAME=AI-VIBE-CHAT
NUXT_PUBLIC_DEFAULT_PROVIDER=openrouter
```

## 📦 Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type check |

## 📚 Rebuild Documentation

See `/rebuild-docs/` for detailed specifications:

| File | Description |
|------|-------------|
| `01-rebuild-overview.md` | Project overview and goals |
| `02-rebuild-audit-plan.md` | Audit checklist |
| `03-rebuild-architecture.md` | Target architecture |
| `04-rebuild-stack-strategy.md` | Technology decisions |
| `05-rebuild-ui-ux-plan.md` | UI/UX specifications |
| `06-rebuild-feature-matrix.md` | Feature mapping |
| `07-rebuild-folder-structure-plan.md` | Structure plan |
| `08-rebuild-api-layer-plan.md` | API design |
| `09-rebuild-state-flow.md` | State management |
| `10-rebuild-migration-steps.md` | Migration roadmap |
| `11-rebuild-quality-standards.md` | Quality requirements |

## 🔒 Security

- **AES-GCM Encryption** - Client-side encryption for sensitive data
- **Server Proxy** - API keys hidden on server
- **Rate Limiting** - Token bucket algorithm
- **Input Validation** - Zod schema validation
- **CSP Headers** - Content Security Policy

## ♿ Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation
- Screen reader support
- Focus management
- Reduced motion support

## 📄 License

MIT License - see LICENSE file for details.

---

**Rebuilt with ❤️ using Vue 3 + Nuxt 3 + Naive UI**

See `rebuild-docs/rebuild-report.md` for audit findings and `quality-report.md` for quality assessment.
