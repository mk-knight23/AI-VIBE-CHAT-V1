# AI-VIBE-CHAT-V1: CHUTES AI Chat v4.0

## Project Overview

**CHUTES AI Chat v4.0** is a production-ready, multi-provider AI chat application providing a unified interface for accessing 10+ AI models across 4 different providers. It features enterprise-grade security, comprehensive testing, and advanced capabilities like provider health monitoring and automatic failover.

---

## Purpose

The application serves as a sophisticated AI chat platform that:
- Provides access to multiple AI providers through a single interface
- Offers 5 free AI models (Gemma 3 4B, GLM 4.5 Air, LongCat Flash, GPT OSS 20B, Tongyi DeepResearch)
- Ensures enterprise security with AES-GCM encryption
- Supports PWA functionality for offline use
- Maintains WCAG 2.1 AA accessibility compliance

---

## Tech Stack

### Frontend Core
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | Modern React with concurrent features |
| TypeScript | 5.5.3 | Full type safety |
| Vite | 5.4.1 | Fast build tool and dev server |
| React Router DOM | 6.26.2 | Client-side routing |

### UI/UX Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| Tailwind CSS | 3.4.11 | Utility-first styling |
| Radix UI | Latest | Accessible UI primitives (15+ components) |
| shadcn/ui | Latest | High-quality component library |
| Lucide React | Latest | Consistent iconography |
| Framer Motion | Latest | Smooth animations |
| next-themes | Latest | Theme management |

### State Management & Data
| Technology | Version | Purpose |
|------------|---------|---------|
| Zustand | 5.0.9 | Lightweight state management |
| TanStack Query | 5.56.2 | Server state management |
| Crypto-JS | 4.2.0 | Client-side encryption |
| Zod | 3.23.8 | Schema validation |

### AI Integration
- **4 Provider Adapters:**
  - OpenRouter (primary) - 6 models
  - MegaLLM - 2+ models
  - Agent Router - 2+ models
  - Routeway - 2+ models

### Development Tools
| Technology | Version | Purpose |
|------------|---------|---------|
| ESLint | 9.9.0 | Code linting |
| Prettier | 3.3.3 | Code formatting |
| Vitest | 2.1.8 | Unit testing |
| Playwright | Latest | E2E testing |

---

## Key Features

### Multi-Provider AI Architecture
- Provider Health Monitoring - Real-time status checks
- Automatic Failover - Switches to backup providers on failure
- Rate Limiting - Token bucket algorithm with burst allowance
- Model Comparison Mode - Side-by-side testing of different models

### Chat Features
- Rich Messaging - Markdown support, syntax highlighting, reactions
- File Uploads - Images, documents, code files (with validation)
- Streaming Responses - Real-time AI response streaming
- Chat Organization - Categories, starring, search, tags
- Prompt Library - Pre-built prompt templates
- Keyboard Shortcuts - Cmd/Ctrl+K (new chat), Alt+C (skip to content)

### Security & Privacy
- AES-GCM Encryption - 256-bit encryption for local data
- Session-Derived Keys - No hardcoded encryption keys
- Input Sanitization - XSS and injection prevention
- Rate Limiting - 30 requests/minute per provider
- Content Security Policy - Comprehensive CSP headers
- Secure File Handling - File type and size validation

### PWA Capabilities
- Offline Support - Service worker with dynamic caching
- Installable - Add to home screen on mobile/desktop
- Background Sync - Queue actions when offline
- Push Notifications - Re-engage users (optional)

### Accessibility (WCAG 2.1 AA)
- Screen Reader Support - ARIA labels and semantic HTML
- Keyboard Navigation - Full keyboard accessibility
- High Contrast Mode - Visual impairment support
- Reduced Motion - Respects user motion preferences
- Focus Management - Visible focus indicators

---

## Project Structure

```
AI-VIBE-CHAT-V1/
├── src/
│   ├── components/          # 63 UI components
│   │   ├── ui/              # 50+ Radix UI/shadcn components
│   │   ├── ChatSidebar.tsx
│   │   ├── ChatInput.tsx
│   │   ├── EnhancedChatMessage.tsx
│   │   ├── SettingsDashboard.tsx
│   │   ├── ModelSwitcher.tsx
│   │   ├── ModelComparison.tsx
│   │   ├── PWAInstaller.tsx
│   │   └── AccessibilityProvider.tsx
│   ├── features/models/     # AI model adapters
│   │   ├── adapters/
│   │   │   ├── openrouter.ts
│   │   │   ├── megallm.ts
│   │   │   ├── agentrouter.ts
│   │   │   └── routeway.ts
│   │   └── modelRegistry.ts
│   ├── hooks/               # Custom React hooks
│   │   └── useChat.ts
│   ├── lib/                 # Core utilities
│   │   ├── store.ts
│   │   ├── analytics.ts
│   │   ├── security.ts
│   │   ├── secureStorage.ts
│   │   ├── rateLimiter.ts
│   │   └── fileProcessor.ts
│   ├── pages/               # Route pages
│   │   ├── Index.tsx
│   │   └── NotFound.tsx
│   └── tests/               # Test suites
│       └── unit/
├── public/                  # Static assets
│   ├── manifest.json
│   └── sw.js
├── scripts/                 # Build scripts
│   └── postbuild-version.js
├── .github/workflows/       # CI/CD pipelines
│   ├── ci.yml
│   └── deploy.yml
└── Configuration files
```

---

## Developer Information

- **Project Name:** vite_react_shadcn_ts
- **Version:** 4.0.0 (via VITE_APP_VERSION)
- **Author:** mk-knight23
- **License:** MIT
- **Repository:** https://github.com/mk-knight23/gpt-clone-app
- **Live Demo:** https://chutes-ai-chat.vercel.app

---

## Setup Guide

### Prerequisites
- Node.js 18+
- npm 8+
- API keys from AI providers

### Installation

```bash
# Clone repository
git clone https://github.com/mk-knight23/gpt-clone-app.git
cd gpt-clone-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

### Environment Variables

```env
# Required: OpenRouter API key
VITE_OPENROUTER_API_KEY=your_openrouter_key

# Optional: Additional providers
VITE_MEGA_LLM_API_KEY=your_megallm_key
VITE_AGENT_ROUTER_API_KEY=your_agentrouter_key
VITE_ROUTEWAY_API_KEY=your_routeway_key

# Optional: Analytics
VITE_ANALYTICS_ID=your_google_analytics_id
VITE_SENTRY_DSN=your_sentry_dsn

# Application
VITE_APP_VERSION=4.0.0
NODE_ENV=development
```

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| dev | `npm run dev` | Development server |
| build | `npm run build` | Production build |
| build:dev | `npm run build:dev` | Dev build |
| lint | `npm run lint` | Lint code |
| lint:fix | `npm run lint:fix` | Fix lint issues |
| type-check | `npm run type-check` | Type checking |
| preview | `npm run preview` | Preview build |
| test | `npm run test` | Run tests |
| test:ui | `npm run test:ui` | Tests with UI |
| test:coverage | `npm run test:coverage` | Coverage report |
| test:smoke | `npm run test:smoke` | E2E tests |
| clean | `npm run clean` | Clean build |
| format | `npm run format` | Format code |
| analyze | `npm run analyze` | Bundle analysis |

---

## Dependencies

### Production Dependencies (39 packages)
- react ^18.3.1
- react-dom ^18.3.1
- react-router-dom ^6.26.2
- zustand ^5.0.9
- @tanstack/react-query ^5.56.2
- immer ^11.0.1
- @radix-ui/react-* (15 packages)
- class-variance-authority ^0.7.1
- clsx ^2.1.1
- tailwind-merge ^2.5.2
- tailwindcss-animate ^1.0.7
- date-fns ^3.6.0
- crypto-js ^4.2.0
- zod ^3.23.8
- uuid ^13.0.0
- react-markdown ^10.1.0
- react-syntax-highlighter ^16.1.0
- remark-gfm ^4.0.1
- rehype-katex ^7.0.1

### Development Dependencies (24 packages)
- vite ^5.4.1
- @vitejs/plugin-react-swc ^3.5.0
- typescript ^5.5.3
- typescript-eslint ^8.0.1
- vitest ^2.1.8
- @vitest/coverage-v8 ^2.1.8
- jsdom ^27.3.0
- eslint ^9.9.0
- eslint-plugin-react-hooks ^5.1.0-rc.0
- tailwindcss ^3.4.11
- autoprefixer ^10.4.20
- postcss ^8.4.47

---

## Configuration Files

### vite.config.ts
- React SWC plugin for fast compilation
- Path alias: `@/` -> `./src`
- Manual chunk splitting for optimal caching
- Development server on port 8080

### tailwind.config.ts
- Dark mode support via class
- Custom theme colors (CSS variables)
- Custom shadows and gradients
- Animation keyframes
- Chat-specific color palette

### tsconfig.json
- Target: ES2020
- Strict type checking enabled
- Path mapping for clean imports
- Module resolution: bundler

### vercel.json
- Build command: npm run build
- Output directory: dist
- Security headers (CSP, X-Frame-Options, etc.)
- Cache control for static assets
- SPA routing support

---

## Security Features

- AES-GCM encryption standards
- API key rotation guidelines (90 days)
- Rate limiting policies
- Security response protocol
- Content-Security-Policy headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

---

## Performance Optimizations

- Code Splitting - Manual chunks for vendor libraries
- Lazy Loading - Dynamic imports for heavy components
- Service Worker - Intelligent caching strategies
- Image Optimization - WebP support, lazy loading
- Bundle Analysis - vite-bundle-analyzer integration
- Core Web Vitals - LCP < 2.5s, FID < 100ms, CLS < 0.1

---

## Browser Support

**Production:**
- \>0.2% market share
- Not dead browsers
- Not Opera Mini

**Development:**
- Latest Chrome, Firefox, Safari
