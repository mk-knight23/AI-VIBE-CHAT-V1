# AI-VIBE-CHAT-V1: Rebuild Overview

## Current Project Summary

**Project Name:** CHUTES AI Chat v4.0
**Current Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Zustand
**Status:** Production-ready with enterprise features

### What Exists Today

- Multi-provider AI chat supporting 4 providers (OpenRouter, MegaLLM, Agent Router, Routeway)
- 10+ AI model integrations
- Enterprise security with AES-GCM encryption
- PWA capabilities with offline support
- WCAG 2.1 AA accessibility compliance
- Rich messaging with markdown, syntax highlighting, file uploads
- Provider health monitoring and automatic failover
- Rate limiting (30 req/min per provider)
- Session-based encryption keys
- 63 UI components using Radix UI + shadcn/ui

### Current Limitations

1. **Client-side only architecture** - No server-side rendering, limited SEO
2. **React ecosystem lock-in** - Heavy reliance on specific React patterns
3. **Build performance** - Vite builds adequate but not optimized for large scale
4. **State hydration** - Zustand persistence has edge cases with encryption
5. **Component coupling** - Radix UI components tightly coupled to implementation
6. **Testing coverage gaps** - E2E coverage incomplete for provider failover scenarios
7. **No server API layer** - All provider calls from client, exposing API key risks

### Known Risks

| Risk | Severity | Impact |
|------|----------|--------|
| API key exposure in client | High | Security vulnerability |
| No SSR affects SEO | Medium | Discoverability impact |
| React version lock | Medium | Future upgrade complexity |
| Provider rate limit handling | Medium | User experience degradation |
| Encryption key loss | High | Data unrecoverable |
| Bundle size growth | Low | Performance on slow networks |

### Rebuild vs Reuse Analysis

| Component | Decision | Rationale |
|-----------|----------|-----------|
| Provider adapters | **Reuse** | Logic is sound, needs abstraction layer |
| Encryption utilities | **Reuse** | crypto-js implementation proven |
| UI components | **Rebuild** | Switch from Radix/shadcn to Vue ecosystem |
| State management | **Rebuild** | Zustand → Pinia for Vue compatibility |
| Routing | **Rebuild** | React Router → Nuxt file-based routing |
| Build system | **Rebuild** | Vite → Nuxt build system |
| PWA configuration | **Reuse** | Adapt patterns to Nuxt PWA module |
| Test suites | **Rebuild** | Framework-specific tests need rewriting |

### Rebuild Goals

1. **Framework Migration** - Migrate from React to Vue 3 + Nuxt 3
2. **Server-Side Capabilities** - Add Nitro server for API proxying
3. **Enhanced Security** - Move provider calls to server, hide API keys
4. **Performance** - Leverage Nuxt SSR/SSG for faster initial loads
5. **Developer Experience** - Vue DevTools integration, HMR improvements
6. **Maintain Features** - Preserve all existing functionality
7. **Theme Refresh** - Glassmorphism visual identity

### Non-Goals

- Adding new AI providers (scope creep)
- Real-time collaboration features
- Voice/video chat capabilities
- Mobile native app development
- Blockchain/web3 integrations
- AI agent autonomy features

### Rebuild Success Criteria

| Criteria | Measurement |
|----------|-------------|
| Feature parity | 100% of V1 features functional |
| Build time | ≤ current Vite build time |
| Bundle size | ≤ 15% increase acceptable |
| Lighthouse score | ≥ 90 all categories |
| Test coverage | ≥ 80% unit, 60% E2E |
| Accessibility | WCAG 2.1 AA maintained |
| Security audit | Zero high/critical vulnerabilities |
| Migration guide | Complete handoff documentation |

### Timeline Estimate

| Phase | Duration |
|-------|----------|
| Audit & Planning | 3 days |
| Core Architecture | 5 days |
| UI Rebuild | 7 days |
| State Migration | 4 days |
| Provider Integration | 5 days |
| Testing & QA | 5 days |
| **Total** | **~29 days** |

---

## Rebuild Context

This is a **migration rebuild** - transforming an existing React application to Vue/Nuxt while maintaining all functionality. The codebase will be significantly restructured but feature set remains constant.

**Key Architectural Shift:**
- From: Client-side SPA with direct provider API calls
- To: Universal app with server-side provider proxy

**Risk Mitigation:**
- Parallel development - keep V1 running during rebuild
- Feature flags for gradual rollout
- Comprehensive test suite before switchover
- Rollback plan maintained
