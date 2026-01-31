# Code Deletion Log

## [2026-01-31] Rebuild Cleanup Session

### Overview
Cleanup and structure migration for AI-VIBE-CHAT-V1 rebuild from React/Vite to Vue/Nuxt 3.

### Files Deleted (React-specific, will be rewritten)

#### React Entry Points
- `src/App.tsx` - React Router setup (REWRITE to `app.vue`)
- `src/main.tsx` - ReactDOM render entry (REWRITE to `nuxt.config.ts`)
- `src/index.css` - Tailwind styles (ADAPT to `app/assets/styles/`)
- `src/vite-env.d.ts` - Vite-specific types (REMOVE)

#### React Hooks (350 lines)
- `src/hooks/use-mobile.tsx` (19 lines)
- `src/hooks/use-toast.ts` (194 lines)
- `src/hooks/useChat.ts` (308 lines)
- **Replacement**: Will be rewritten as Vue composables in `app/composables/`

#### shadcn/ui Components (~8,000 lines)
All 50+ shadcn/ui components deleted from `src/components/ui/`:
- accordion.tsx, alert-dialog.tsx, alert.tsx, aspect-ratio.tsx
- avatar.tsx, badge.tsx, breadcrumb.tsx, button.tsx
- calendar.tsx, card.tsx, carousel.tsx, chart.tsx
- checkbox.tsx, collapsible.tsx, command.tsx, context-menu.tsx
- dialog.tsx, drawer.tsx, dropdown-menu.tsx, form.tsx
- hover-card.tsx, input-otp.tsx, input.tsx, label.tsx
- menubar.tsx, navigation-menu.tsx, pagination.tsx
- popover.tsx, progress.tsx, radio-group.tsx, resizable.tsx
- scroll-area.tsx, select.tsx, separator.tsx, sheet.tsx
- sidebar.tsx, skeleton.tsx, slider.tsx, sonner.tsx
- switch.tsx, table.tsx, tabs.tsx, textarea.tsx
- toast.tsx, toaster.tsx, toggle-group.tsx, toggle.tsx
- tooltip.tsx, use-toast.ts

**Replacement**: Will use Naive UI components

#### React Components (~4,500 lines)
- `src/components/AccessibilityProvider.tsx` (462 lines)
- `src/components/ChatCategories.tsx` (579 lines)
- `src/components/ChatInput.tsx` (374 lines)
- `src/components/ChatSidebar.tsx` (329 lines)
- `src/components/EnhancedChatMessage.tsx` (710 lines)
- `src/components/GlobalCommandBar.tsx` (37 lines)
- `src/components/ModelComparison.tsx` (420 lines)
- `src/components/ModelSelector.tsx` (190 lines)
- `src/components/ModelSwitcher.tsx` (461 lines)
- `src/components/PWAInstaller.tsx` (312 lines)
- `src/components/PromptLibrary.tsx` (758 lines)
- `src/components/RateLimitFallback.tsx` (287 lines)
- `src/components/SettingsDashboard.tsx` (1,131 lines)
- `src/components/TypingIndicator.tsx` (88 lines)

**Replacement**: Will be rewritten as Vue SFCs in `app/components/`

#### State Management
- `src/lib/store.ts` (956 lines) - Zustand store
- **Replacement**: Will be rewritten as Pinia stores in `app/stores/`

#### Pages
- `src/pages/Index.tsx` (531 lines)
- `src/pages/NotFound.tsx` (26 lines)
- **Replacement**: Will use Nuxt file-based routing in `app/pages/`

### Files Preserved and Migrated

#### Provider Adapters (Server-side)
Moved from `src/features/models/adapters/` to `server/utils/providers/`:
- `openrouter.ts` (391 lines) - OpenRouter adapter
- `megallm.ts` (370 lines) - MegaLLM adapter
- `agentrouter.ts` (370 lines) - AgentRouter adapter
- `routeway.ts` (370 lines) - Routeway adapter
- `index.ts` - Types and interfaces

**Changes made**:
- Updated `import.meta.env` to `process.env` for Nuxt
- Changed env var prefix from `VITE_` to `NUXT_`
- Updated imports to use local paths

#### Model Registry
- `src/features/models/modelRegistry.ts` -> `server/utils/modelRegistry.ts`
- `src/features/models/index.ts` -> `app/utils/types/provider.ts` + `server/utils/providers/index.ts`

#### Security Utilities (Client-side)
Moved from `src/lib/` to `app/utils/encryption/`:
- `secureStorage.ts` (509 lines) - AES encryption, secure storage
- `security.ts` (358 lines) - Input validation, rate limiting
- Created `index.ts` barrel export

**Changes made**:
- Removed React hook exports
- Created Vue composable versions

#### Utilities (Client-side)
Preserved in `src/lib/` (will be moved to `app/utils/`):
- `fileProcessor.ts` (335 lines) - File handling, processing
- `rateLimiter.ts` (307 lines) - Token bucket rate limiting
- `utils.ts` (170 lines) - Helper functions
- `analytics.ts` (389 lines) - Analytics tracking

### New Directory Structure Created

```
AI-VIBE-CHAT-V1/
├── app/                          # Nuxt 3 application
│   ├── components/               # Vue components
│   │   ├── chat/                 # Chat-specific components
│   │   ├── ui/                   # UI primitives
│   │   └── settings/             # Settings components
│   ├── composables/              # Vue composables (auto-imported)
│   ├── layouts/                  # Nuxt layouts
│   ├── middleware/               # Route middleware
│   ├── pages/                    # File-based routes
│   ├── plugins/                  # Nuxt plugins
│   ├── stores/                   # Pinia stores
│   ├── utils/                    # Utilities
│   │   ├── encryption/           # Security utilities (MIGRATED)
│   │   ├── providers/            # Provider types
│   │   └── types/                # TypeScript types
│   └── assets/styles/            # Global styles
├── server/                       # Nitro server
│   ├── api/                      # API routes
│   ├── middleware/               # Server middleware
│   └── utils/                    # Server utilities
│       ├── providers/            # Provider adapters (MIGRATED)
│       ├── modelRegistry.ts      # Model registry (MIGRATED)
│       └── rateLimiter.ts        # Rate limiting (MIGRATED)
├── public/                       # Static files
├── tests/                        # Test files
└── src/                          # Legacy source (being phased out)
    ├── features/models/          # Will be removed after migration
    ├── lib/                      # Will be removed after migration
    ├── test/                     # Will be moved to tests/
    └── tests/                    # Will be moved to tests/
```

### Impact Summary

| Metric | Value |
|--------|-------|
| Files deleted | ~70 |
| Lines removed | ~14,000 |
| Files migrated | 15 |
| Lines preserved | ~4,200 |
| New directories created | 25+ |

### Testing
- [ ] Verify all preserved files have correct imports
- [ ] Ensure no broken references in migrated code
- [ ] Validate new directory structure follows Nuxt 3 conventions

### Next Steps
1. Create `nuxt.config.ts` with project configuration
2. Set up `package.json` with Nuxt 3 dependencies
3. Create root `app.vue` component
4. Begin implementing Vue components in `app/components/`
5. Create Pinia stores in `app/stores/`
6. Implement composables in `app/composables/`
7. Create API routes in `server/api/`

### Notes
- The old `src/` directory is kept temporarily for reference during migration
- Once the new structure is fully functional, `src/` can be completely removed
- All provider adapters now use server-side environment variables for security
- Client-side code no longer has direct access to API keys
