# AI-VIBE-CHAT-V1: Quality Standards

## Build Requirements

### Build Must Pass

- [ ] `npm run build` exits with code 0
- [ ] No TypeScript compilation errors
- [ ] No Vue template errors
- [ ] No build warnings (or documented exceptions)
- [ ] Bundle size under budget (see below)

### Bundle Size Budgets

| Chunk | Max Size | Notes |
|-------|----------|-------|
| Entry (app) | 150 KB | Core app logic |
| Vendor (vue, pinia) | 100 KB | Framework code |
| Naive UI | 200 KB | Component library |
| Chat components | 100 KB | Feature-specific |
| **Total Initial** | **550 KB** | First load |
| **Lazy Loaded** | **+300 KB** | On-demand chunks |

---

## Lint Rules

### ESLint Configuration

```javascript
// eslint.config.mjs
export default [
  {
    rules: {
      // Vue specific
      'vue/multi-word-component-names': 'error',
      'vue/no-unused-refs': 'error',
      'vue/require-default-prop': 'error',

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'error',

      // General
      'no-console': ['warn', { allow: ['error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error'
    }
  }
]
```

### Prettier Configuration

```javascript
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid"
}
```

### Code Style Rules

| Rule | Standard |
|------|----------|
| Component names | PascalCase, multi-word |
| Composables | camelCase with `use` prefix |
| Props | camelCase, typed with defaults |
| Emits | camelCase, typed |
| Stores | camelCase file, camelCase ID |
| CSS classes | kebab-case |
| CSS variables | kebab-case with `--` prefix |

---

## Naming Conventions

### Components

```vue
<!-- Good -->
<ChatMessageBubble />
<SettingsProviderCard />
<UiGradientButton />

<!-- Bad -->
<Message />
<Provider />
<Button />
```

### Composables

```typescript
// Good
useChatEngine()
useProviderHealth()
useEncryptedStorage()

// Bad
useChat()
useHealth()
useStorage()
```

### Files

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase | `ChatInput.vue` |
| Composables | camelCase | `useChat.ts` |
| Stores | camelCase | `chat.ts` |
| Utils | camelCase | `helpers.ts` |
| Types | camelCase | `chat.types.ts` |
| Styles | kebab-case | `chat-styles.scss` |

---

## Documentation Coverage

### Required Documentation

| Item | Location | Required |
|------|----------|----------|
| Component props | JSDoc in component | Yes |
| Composable usage | JSDoc + README | Yes |
| Store actions | JSDoc in store | Yes |
| API routes | README in server/ | Yes |
| Type definitions | JSDoc | Yes |
| Complex logic | Inline comments | When needed |

### Component Documentation Template

```vue
<script setup lang="ts">
/**
 * ChatMessageBubble - Displays a single chat message
 *
 * @prop {Message} message - The message object to display
 * @prop {boolean} showActions - Whether to show action buttons
 * @emit {void} copy - When copy button clicked
 * @emit {void} regenerate - When regenerate clicked
 */
interface Props {
  message: Message
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true
})

const emit = defineEmits<{
  copy: []
  regenerate: []
}>()
</script>
```

---

## Error Handling Coverage

### Error Boundary Requirements

- [ ] Global Vue error handler
- [ ] 404 page for unknown routes
- [ ] Error state for failed API calls
- [ ] Retry mechanism for network errors
- [ ] Graceful degradation for features

### Error Handling Checklist

| Scenario | Handling |
|----------|----------|
| Network failure | Retry + user notification |
| API error | Formatted error message |
| Provider down | Auto-failover |
| Rate limited | Queue + countdown |
| Invalid API key | Prompt for re-entry |
| Encryption failure | Lockout + recovery |
| Storage full | Warning + export option |

---

## UI States Coverage

### Required States

| Component | States Required |
|-----------|-----------------|
| ChatInput | empty, typing, sending, disabled |
| MessageBubble | streaming, complete, error, deleted |
| SendButton | idle, loading, success, error |
| Sidebar | loading, loaded, empty, error |
| Settings | loading, editing, saving, saved |
| ProviderCard | healthy, degraded, down, loading |

### Loading State Requirements

- [ ] Skeleton screens for async data
- [ ] Progressive loading for messages
- [ ] Optimistic updates for sends
- [ ] Loading indicators for >300ms operations
- [ ] Disabled states during operations

---

## Performance Goals

### Core Web Vitals

| Metric | Target | Minimum |
|--------|--------|---------|
| LCP (Largest Contentful Paint) | < 2.0s | < 2.5s |
| FID (First Input Delay) | < 50ms | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.05 | < 0.1 |
| TTFB (Time to First Byte) | < 200ms | < 600ms |
| FCP (First Contentful Paint) | < 1.0s | < 1.8s |

### Runtime Performance

| Metric | Target |
|--------|--------|
| Message render | < 16ms |
| Input response | < 50ms |
| Stream chunk display | < 10ms |
| Page transition | < 200ms |
| Memory usage | < 100MB |

### Bundle Performance

- [ ] Tree-shaking enabled
- [ ] Dynamic imports for heavy features
- [ ] Lazy load settings panel
- [ ] Lazy load provider adapters
- [ ] Image optimization
- [ ] Font subsetting

---

## Accessibility Goals

### WCAG 2.1 AA Compliance

- [ ] Color contrast ratio ≥ 4.5:1 for text
- [ ] Color contrast ratio ≥ 3:1 for UI components
- [ ] Keyboard accessible all interactive elements
- [ ] Focus indicators visible
- [ ] Screen reader announcements for dynamic content
- [ ] No keyboard traps
- [ ] Skip navigation link
- [ ] Page title updates

### Accessibility Checklist

| Feature | Requirement |
|---------|-------------|
| Images | Alt text provided |
| Forms | Labels associated |
| Buttons | Descriptive text |
| Links | Purpose clear |
| Headings | Proper hierarchy |
| Landmarks | Main, nav, complementary |
| Live regions | For streaming content |
| Focus order | Logical sequence |

---

## Testing Requirements

### Coverage Targets

| Type | Target | Minimum |
|------|--------|---------|
| Unit tests | 85% | 80% |
| Component tests | 80% | 70% |
| E2E tests | Critical paths | All happy paths |

### Test Requirements

- [ ] Every composable has unit tests
- [ ] Every store has unit tests
- [ ] Critical components have tests
- [ ] E2E for: send message, switch provider, change settings
- [ ] Error scenarios tested
- [ ] Accessibility tests (axe-core)

### Quality Gates

```bash
# Pre-commit checks
npm run lint        # Must pass
npm run type-check  # Must pass
npm run test:unit   # Coverage ≥ 80%

# Pre-merge checks
npm run build       # Must pass
npm run test:e2e    # Must pass
npm run lighthouse  # Score ≥ 90
```

---

## Security Standards

### Security Checklist

- [ ] No hardcoded secrets
- [ ] API keys in server only
- [ ] Encryption for sensitive data
- [ ] Input sanitization
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Secure headers (HSTS, CSP)
- [ ] Dependencies audited

### Security Audit Requirements

| Check | Tool | Frequency |
|-------|------|-----------|
| Dependency vulnerabilities | npm audit | Weekly |
| Static analysis | ESLint security | Every commit |
| Secrets scanning | git-secrets | Every commit |
| Container scanning | Trivy | On build |
