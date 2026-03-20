# 🚀 AI-VIBE-CHAT-V1 (Collective Production Edition)

## 💎 Overview
Fully production-grade implementation of AI-VIBE-CHAT-V1, refactored by the **69-Agent Opencode Collective**.

## 🛡️ Trust & Compliance
- **CI/CD**: Automated GitHub Actions with Gitleaks security scans.
- **Security**: Standardized [SECURITY.md](SECURITY.md) protocol.
- **Design**: Opencode Premium Design Tokens integrated.

## 🏁 48-Hour Roadmap
1. Initialize infrastructure via `.github/workflows`.
2. Set your secrets in GitHub Environment settings.
3. Deploy to production via Vercel/Docker.

<p align="center">
  <img src="https://img.shields.io/badge/AI--VIBE-CHAT--V1-blue?style=for-the-badge&logo=nuxt.js&logoColor=white" alt="AI Vibe Project">
  <br>
  <b>Production-ready AI chat application rebuilt with Vue 3, Nuxt 3, and Naive UI.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Nuxt-3.11+-00DC82.svg?logo=nuxt.js&logoColor=white" alt="Nuxt 3">
  <img src="https://img.shields.io/badge/Vue-3.4+-42b883.svg?logo=vue.js&logoColor=white" alt="Vue 3">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
</p>

---

## 🗺️ Quick Navigation

- [🎯 Rebuild Overview](#-rebuild-overview)
- [🚀 Quick Start](#-quick-start)
- [🏗️ Architecture](#%EF%B8%8F-architecture)
- [📁 Project Structure](#-project-structure)
- [🎨 Theme](#-theme)
- [🔧 Environment Variables](#-environment-variables)
- [📦 Commands](#-commands)
- [🔒 Security](#-security)
- [♿ Accessibility](#-accessibility)

---

## 🛠️ Engineered With

<p align="left">
  <a href="https://nuxt.com"><img src="https://skillicons.dev/icons?i=nuxtjs" alt="Nuxt.js"></a>
  <a href="https://vuejs.org"><img src="https://skillicons.dev/icons?i=vue" alt="Vue.js"></a>
  <a href="https://pinia.vuejs.org"><img src="https://img.shields.io/badge/Pinia-Store-yellow" alt="Pinia"></a>
  <a href="https://sass-lang.com"><img src="https://skillicons.dev/icons?i=sass" alt="Sass"></a>
  <a href="https://typescriptlang.org"><img src="https://skillicons.dev/icons?i=ts" alt="TypeScript"></a>
</p>

---

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

---

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

---

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

---

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

---

## 📁 Project Structure

<details>
<summary>View Detailed Directory Map</summary>

```
app/
├── components/          # Vue components
│   ├── chat/           # Chat-specific components
│   ├── settings/       # Settings components
│   └── ui/             # Reusable UI primitives
├── composables/        # Auto-imported composables
├── layouts/            # Nuxt layouts
├── pages/              # File-based routes
├── plugins/            # Nuxt plugins
├── stores/             # Pinia stores
├── utils/              # Utilities
└── assets/styles/      # SCSS styles
```
</details>


---

## 🎨 Theme

**Glassmorphism Design System:**

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0f172a` | Main background |
| `--bg-secondary` | `#1e293b` | Card backgrounds |
| `--accent-primary` | `#8b5cf6` | Purple accent |
| `--accent-secondary` | `#06b6d4` | Cyan accent |

**Glass Card Effect:**
```scss
background: rgba(30, 41, 59, 0.7);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.1);
```

---

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

---

## 📦 Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type check |

---

## 🔒 Security

- **AES-GCM Encryption** - Client-side encryption for sensitive data
- **Server Proxy** - API keys hidden on server
- **Rate Limiting** - Token bucket algorithm
- **Input Validation** - Zod schema validation
- **CSP Headers** - Content Security Policy

---

## ♿ Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation
- Screen reader support
- Focus management
- Reduced motion support

---

## ✅ Stabilization Status (Ralph 5-Iteration Loop)

| Iteration | Focus | Status |
|-----------|-------|--------|
| 1 | Hard Audit & Failure Mapping | ✅ Complete |
| 2 | Core Runtime Stabilization | ✅ Complete |
| 3 | Feature Repair Pass | ✅ Complete |
| 4 | UX, Error Handling & Noise Removal | ✅ Complete |
| 5 | Browser Verification & Lock-In | ✅ Complete |

**Current State:**
- ✅ App builds successfully
- ✅ Dev server runs on http://localhost:3000
- ✅ API endpoints working
- ✅ Vue 3 + Nuxt 3 + Naive UI stack operational

---

## 📄 License

MIT License - see LICENSE file for details.

---

<p align="center">
  <i>Rebuilt with ❤️ using Vue 3 + Nuxt 3 + Naive UI</i>
</p>


## 🎯 Problem Solved

This repository provides a streamlined approach to modern development needs, enabling developers to build robust applications with minimal complexity and maximum efficiency.

## ✨ Features

- **Core Functionality:** Primary features and capabilities
- **Production Ready:** Built for real-world deployment scenarios
- **Optimized Performance:** Efficient resource utilization
- **Developer Experience:** Clear documentation and intuitive API

## 🌐 Deployment

### Live URLs

| Platform | URL |
|----------|-----|
| Vercel | [Deployed Link] |
| GitHub Pages | [Deployed Link] |

## Security

This project follows security best practices:
- No hardcoded credentials
- Dependency scanning enabled
- Security headers configured
- Regular security audits performed
