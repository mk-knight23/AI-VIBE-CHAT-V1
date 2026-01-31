# AI-VIBE-CHAT-V1: Rebuild Audit Plan

## Repository Audit Checklist

### 1. Code Inventory

- [ ] Catalog all 63 UI components
- [ ] Document 4 provider adapter implementations
- [ ] List all custom hooks (useChat, etc.)
- [ ] Inventory utility functions in lib/
- [ ] Document test files and coverage
- [ ] Identify dead/stale code
- [ ] Map component dependencies

### 2. Build Verification Steps

```bash
# Pre-rebuild baseline
npm install
npm run build        # Record build time
npm run test         # Record coverage %
npm run lint         # Record error count
npm run type-check   # Record TS error count
npm run analyze      # Record bundle sizes
```

**Record Baseline Metrics:**
- Build time: ___ seconds
- Bundle size: ___ KB (main), ___ KB (vendor)
- Test coverage: ___%
- TypeScript errors: ___
- ESLint warnings: ___

### 3. Dependency Review

#### Current Dependencies Analysis

| Category | Count | Review Action |
|----------|-------|---------------|
| React ecosystem | 8 | Plan Vue equivalents |
| Radix UI | 15 | Map to Naive UI |
| shadcn/ui | N/A | Custom build in Vue |
| Utilities | 12 | Verify Vue compatibility |
| Testing | 5 | Replace with Vue test utils |

#### Audit Steps

- [ ] Run `npm audit` - document vulnerabilities
- [ ] Check for deprecated packages
- [ ] Identify packages with Vue alternatives
- [ ] List packages to remove entirely
- [ ] Document version constraints

### 4. Dead Code Detection Plan

**Tools to Use:**
- `knip` - Find unused exports
- `depcheck` - Find unused dependencies
- Manual code review for:
  - Unused components
  - Orphaned styles
  - Dead provider configurations
  - Unused test mocks

**Dead Code Categories:**

| Category | Detection Method | Action |
|----------|-----------------|--------|
| Unused exports | knip scan | Remove or mark deprecated |
| Unused deps | depcheck | Remove from package.json |
| Commented code | grep "^\\s*//" | Delete or restore |
| Unused CSS | PurgeCSS analysis | Remove selectors |
| Test orphans | Coverage report | Delete or fix tests |

### 5. Folder Cleanup Plan

**Pre-Rebuild Cleanup:**

```
BEFORE REBUILD:
├── src/components/ui/     # 50+ Radix components
├── src/features/models/   # Provider adapters
├── src/hooks/             # React hooks
├── src/lib/               # Utilities
├── src/pages/             # Route pages
├── src/tests/             # Test suites
└── scripts/               # Build scripts

CLEANUP ACTIONS:
- [ ] Backup current codebase
- [ ] Archive old docs versions
- [ ] Remove .cache, dist, build folders
- [ ] Clean node_modules (fresh install)
- [ ] Remove stale config files
```

### 6. Risk Scan Checklist

**Security Risks:**
- [ ] Hardcoded API keys in source
- [ ] Encryption key storage method
- [ ] LocalStorage sensitive data exposure
- [ ] XSS vulnerabilities in markdown rendering
- [ ] CSP header configuration gaps

**Technical Risks:**
- [ ] React version compatibility issues
- [ ] Third-party library maintenance status
- [ ] Provider API deprecation risks
- [ ] Browser compatibility gaps
- [ ] Mobile responsiveness issues

**Business Risks:**
- [ ] Provider pricing changes
- [ ] Feature scope creep
- [ ] Timeline estimation accuracy
- [ ] Resource availability

### 7. Technical Debt Identification

**Debt Categories:**

| Debt Item | Severity | Effort | Location |
|-----------|----------|--------|----------|
| Mixed component patterns | Medium | Medium | components/ |
| Inconsistent error handling | Medium | Low | lib/ |
| Missing test coverage | High | High | tests/ |
| Inline styles scattered | Low | Low | Various |
| Provider error fallback gaps | High | Medium | adapters/ |
| Chat state monolith | Medium | High | store.ts |

**Measurement Method:**
- Code climate analysis
- SonarQube scan (if available)
- Manual architecture review
- Team retrospective input

### 8. Asset Inventory

**Document All:**
- [ ] Icons (Lucide usage patterns)
- [ ] Images and logos
- [ ] PWA manifest assets
- [ ] Font files
- [ ] Sound files (if any)
- [ ] Third-party CSS

### 9. Configuration Audit

| Config File | Purpose | Rebuild Action |
|-------------|---------|----------------|
| vite.config.ts | Build config | Replace with nuxt.config.ts |
| tsconfig.json | TypeScript | Adapt for Nuxt |
| tailwind.config.ts | Styling | Remove (use Naive UI) |
| vercel.json | Deployment | Adapt for Nitro |
| .env.example | Env template | Update for server vars |
| manifest.json | PWA | Migrate to Nuxt PWA |

### 10. Documentation Audit

- [ ] README accuracy check
- [ ] API documentation completeness
- [ ] Setup instructions validity
- [ ] Environment variable documentation
- [ ] Security guidelines currency
- [ ] Contributing guide (if exists)

---

## Audit Report Template

```markdown
# V1 Rebuild Audit Report
Date: ___
Auditor: ___

## Executive Summary
[High-level findings]

## Code Metrics
- Total files: ___
- Total LOC: ___
- Test coverage: ___%
- Dead code found: ___ instances

## Risk Assessment
| Risk | Level | Mitigation |
|------|-------|------------|
| | | |

## Recommendations
1.
2.
3.

## Approved For Rebuild: YES / NO
```
