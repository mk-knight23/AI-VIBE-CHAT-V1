<div align="center">

# 🌌 AI-VIBE-CHAT-V1

### **The Encrypted Glassmorphic AI Chat Interface**
*Built with Vue 3 · Nuxt 3 · Naive UI · AES-256 Encryption*

[![Nuxt 3](https://img.shields.io/badge/Nuxt-3.13+-00DC82?style=for-the-badge&logo=nuxt.js&logoColor=white)](https://nuxt.com)
[![Vue 3](https://img.shields.io/badge/Vue-3.5+-42b883?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Pinia](https://img.shields.io/badge/Pinia-2.2+-FFD859?style=for-the-badge)](https://pinia.vuejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**[🚀 Live Demo](https://ai-vibe-chat-v1.vercel.app)** · **[📖 Docs](./Docs)** · **[🐛 Issues](https://github.com/mk-knight23/AI-VIBE-CHAT-V1/issues)** · **[⭐ Star](https://github.com/mk-knight23/AI-VIBE-CHAT-V1)**

</div>

---

## 🎯 What Is This?

AI-VIBE-CHAT-V1 is the **first pillar** of the AI-VIBE ecosystem — a production-grade AI chat interface built with **Nuxt 3 + Vue 3**, featuring military-grade **AES-256 encryption** for all chat history, a stunning **glassmorphism design system**, and multi-provider LLM routing.

> **Pillar 1 of 4** — The foundation. Where glassmorphism meets encryption meets AI.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **AES-256 Encryption** | All chat history encrypted client-side with CryptoJS |
| 🌊 **Streaming Responses** | Token-by-token streaming from any LLM provider |
| 🧠 **Multi-Provider** | OpenAI, Anthropic Claude, Groq, local Ollama |
| 🎨 **Glassmorphism UI** | Frosted glass panels, blur effects, depth layers |
| 🌙 **Dark/Light Mode** | Seamless theme switching via Nuxt Color Mode |
| 📱 **PWA Ready** | Service worker, offline mode, installable |
| 🗄️ **Pinia State** | Reactive chat store with persistence |
| 🎙️ **Voice Input** | Browser Speech API integration |
| 📤 **Export Chat** | JSON, Markdown, PDF export |
| ♿ **Accessible** | WCAG 2.1 AA compliant |

---

## 🏗️ Architecture

```
ai-vibe-chat-v1/
├── 📁 assets/
│   └── styles/
│       ├── global.scss          # Global glassmorphism utilities
│       ├── _variables.scss      # Design tokens (blur, opacity, colors)
│       └── _mixins.scss         # Glass panel, neon glow mixins
├── 📁 components/
│   ├── chat/
│   │   ├── ChatWindow.vue       # Main chat container
│   │   ├── MessageBubble.vue    # Individual message with glass effect
│   │   ├── InputBar.vue         # Message composer with voice input
│   │   └── ProviderSelector.vue # Multi-LLM switcher
│   └── layout/
│       ├── Sidebar.vue          # Conversation history sidebar
│       └── Header.vue           # Nav with settings
├── 📁 composables/
│   ├── useChat.ts               # Core chat logic & streaming
│   ├── useEncryption.ts         # AES-256 encrypt/decrypt
│   ├── useProviders.ts          # LLM provider routing
│   └── useVoiceInput.ts         # Speech-to-text
├── 📁 server/
│   └── api/
│       ├── chat.post.ts         # Unified chat endpoint
│       ├── stream.post.ts       # Streaming endpoint (SSE)
│       └── providers.get.ts     # Available providers
├── 📁 stores/
│   ├── chatStore.ts             # Conversation state
│   ├── settingsStore.ts         # User preferences
│   └── encryptionStore.ts       # Encryption key management
└── 📁 public/
    ├── sw.js                    # Service worker (PWA)
    └── manifest.json            # Web app manifest
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm/pnpm/yarn

### Installation

```bash
# Clone
git clone https://github.com/mk-knight23/AI-VIBE-CHAT-V1.git
cd AI-VIBE-CHAT-V1

# Install
npm install

# Configure environment
cp .env.example .env
```

### Environment Variables

```env
# LLM Providers (add the ones you use)
NUXT_OPENAI_API_KEY=sk-...
NUXT_ANTHROPIC_API_KEY=sk-ant-...
NUXT_GROQ_API_KEY=gsk_...

# Encryption (auto-generated if not set)
NUXT_ENCRYPTION_SECRET=your-32-char-secret-key-here

# Optional: Ollama local endpoint
NUXT_OLLAMA_BASE_URL=http://localhost:11434
```

### Development

```bash
npm run dev      # Start dev server → http://localhost:3000
npm run build    # Production build
npm run preview  # Preview production build
npm run test     # Run Vitest + Playwright
```

---

## 🔐 Encryption Architecture

All chat history is encrypted using **AES-256-GCM** before being stored in localStorage or IndexedDB:

```typescript
// composables/useEncryption.ts
import CryptoJS from 'crypto-js'

export const useEncryption = () => {
  const encrypt = (data: string, key: string): string => {
    return CryptoJS.AES.encrypt(data, key).toString()
  }

  const decrypt = (encrypted: string, key: string): string => {
    const bytes = CryptoJS.AES.decrypt(encrypted, key)
    return bytes.toString(CryptoJS.enc.Utf8)
  }

  return { encrypt, decrypt }
}
```

---

## 🌊 Multi-Provider Streaming

```typescript
// server/api/stream.post.ts
export default defineEventHandler(async (event) => {
  const { provider, model, messages } = await readBody(event)
  
  setHeader(event, 'Content-Type', 'text/event-stream')
  
  const stream = await getProviderStream(provider, model, messages)
  
  return sendStream(event, stream)
})
```

---

## 🎨 Design System

The glassmorphism design uses three layers:

| Layer | Blur | Opacity | Use Case |
|-------|------|---------|----------|
| **Glass Heavy** | 20px | 0.15 | Modal panels, sidebars |
| **Glass Medium** | 12px | 0.10 | Cards, message bubbles |
| **Glass Light** | 6px | 0.06 | Hover states, tooltips |

---

## 📦 Commands

```bash
npm run dev          # Development with HMR
npm run build        # Production build (SSR)
npm run build:static # Static site generation
npm run preview      # Preview production
npm run lint         # ESLint + Prettier
npm run type-check   # TypeScript strict check
npm run test:unit    # Vitest unit tests
npm run test:e2e     # Playwright E2E tests
npm run analyze      # Bundle analyzer
```

---

## 🔒 Security

- ✅ AES-256 client-side encryption
- ✅ DOMPurify for XSS prevention
- ✅ CSP headers via Nuxt security module
- ✅ API keys never exposed to client
- ✅ Gitleaks secret scanning in CI/CD
- See [SECURITY.md](SECURITY.md) for vulnerability reporting

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
npx vercel --prod
```

### Docker
```bash
docker build -t ai-vibe-chat-v1 .
docker run -p 3000:3000 --env-file .env ai-vibe-chat-v1
```

### Node.js Server
```bash
npm run build
node .output/server/index.mjs
```

---

## 🛣️ Roadmap

- [x] AES-256 encryption
- [x] Multi-provider routing
- [x] Streaming responses
- [x] PWA support
- [ ] **v2.0**: RAG with local files
- [ ] **v2.0**: Image generation support
- [ ] **v2.0**: Plugin marketplace
- [ ] **v2.1**: Real-time collaboration

---

## 🔗 Ecosystem

> AI-VIBE-CHAT-V1 is part of the **[AI-VIBE Ecosystem](https://github.com/mk-knight23/AI-VIBE-ECOSYSTEM)** — a collection of 11 production-grade AI applications.

| Project | Description |
|---------|-------------|
| [AI-VIBE-CHAT-V2](https://github.com/mk-knight23/AI-VIBE-CHAT-V2) | SvelteKit 5 high-performance chat |
| [AI-VIBE-CHAT-V3](https://github.com/mk-knight23/AI-VIBE-CHAT-V3) | Next.js 15 multi-agent interface |
| [AI-VIBE-CHAT-V4](https://github.com/mk-knight23/AI-VIBE-CHAT-V4) | AI provider benchmarking dashboard |
| [AI-VIBE-CLI-PYTHON](https://github.com/mk-knight23/AI-VIBE-CLI-PYTHON) | Enterprise Python CLI agent |
| [AI-VIBE-ECOSYSTEM](https://github.com/mk-knight23/AI-VIBE-ECOSYSTEM) | Master hub for all projects |

---

<div align="center">

**Built with 🔥 by [Kazi Musharraf](https://mkazi.live)**

[![GitHub](https://img.shields.io/badge/GitHub-mk--knight23-181717?style=flat&logo=github)](https://github.com/mk-knight23)
[![Twitter](https://img.shields.io/badge/Twitter-@mk__knight__23-1DA1F2?style=flat&logo=twitter)](https://twitter.com/mk_knight_23)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-kazi--musharraf-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/kazi-musharraf-0674871a4)
[![Website](https://img.shields.io/badge/Website-mkazi.live-FF6B6B?style=flat&logo=safari)](https://mkazi.live)

*Part of the [AI-VIBE Ecosystem](https://github.com/mk-knight23/AI-VIBE-ECOSYSTEM) · 11 Projects · Built in India 🇮🇳*

</div>
