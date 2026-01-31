# AI-VIBE-CHAT-V1 — RALPH AUTONOMOUS FIX & STABILIZATION LOOP

You are running in **AUTONOMOUS RALPH MODE**.

This is a REAL execution loop.
Not advisory. Not planning-only.

All Claude capabilities are available:
- agents
- skills
- workflows
- commands
- scripts
- browser testing (Playwright + Chrome DevTools)
- build systems
- runtime debugging

Your mission is to make **AI-VIBE-CHAT-V1 STABLE, FUNCTIONAL, AND TRUSTWORTHY**.

---

## 🎯 TARGET REPOSITORY

Repository: **AI-VIBE-CHAT-V1** (Nuxt.js + Vue app)

Current state:
- app exists
- rebuild-docs exist
- .claude system exists
- app builds partially or runs with errors
- multiple features do NOT work reliably

This loop fixes that.

---

## 📚 AUTHORITATIVE SOURCES (STRICT)

You MUST obey:

1. `/rebuild-docs/*` → architecture, features, quality bar
2. `.claude/*` → agents, workflows, rules
3. Existing implementation → ONLY to be fixed, not redesigned

If code conflicts with rebuild-docs → **fix implementation**, not docs.

---

## 🔁 ITERATION RULE (CRITICAL)

You MUST run **EXACTLY 5 ITERATIONS**.

Each iteration MUST:
- modify real source files
- reduce bugs or instability
- improve runtime behavior
- be verifiable in browser
- be committed

NO EMPTY ITERATIONS
NO DOC-ONLY ITERATIONS
NO FAKE FIXES

---

## 🧠 ITERATION STRUCTURE (REPEAT 5×)

### 🔍 Iteration 1 — Hard Audit & Failure Mapping
- Run the app (`npm run dev`)
- Capture ALL build errors
- Capture ALL runtime errors
- Identify:
  - broken features
  - broken state flows
  - provider failures
  - rendering issues
  - infinite loading states
- Fix ONLY blockers that prevent basic run

Outcome:
- App runs with **fewer critical failures**

---

### 🧹 Iteration 2 — Core Runtime Stabilization
- Ensure dev server starts cleanly
- Ensure app renders consistently
- Fix crashes on refresh
- Fix state initialization bugs
- Fix provider wiring (mock allowed)
- Remove obvious race conditions

Outcome:
- App renders reliably without crashing

---

### 💬 Iteration 3 — Feature Repair Pass
- Fix broken chat flows:
  - input
  - send
  - response
  - streaming / mock streaming
- Fix message rendering
- Fix regenerate / retry
- Fix sidebar / sessions if present

Outcome:
- Core chat features work end-to-end

---

### 🎨 Iteration 4 — UX, Error Handling & Noise Removal
- Add / fix loading states
- Add / fix error states
- Add error boundaries
- Remove console errors & warnings
- Fix UI/state desync issues

Outcome:
- App feels stable, not fragile

---

### 🧪 Iteration 5 — Browser Verification & Lock-In
- Run Playwright automated flow:
  - open app
  - send message
  - receive response
  - refresh page
  - repeat send
- Use Chrome DevTools:
  - inspect console
  - inspect network
  - inspect hydration
- Fix any remaining runtime issues
- Update README with:
  - how to run
  - known limitations (honest)

Outcome:
- App is **demo-safe and predictable**

---

## 🛠️ REQUIRED AGENTS & TOOLS

Use when applicable:
- @planner
- @architect
- @code-reviewer
- @security-reviewer
- @tdd-guide

Allowed commands:
- /audit
- /build-fix
- /runtime-debug
- /verify
- /checkpoint
- /code-review

---

## 🚫 HARD CONSTRAINTS

- Do NOT redesign architecture
- Do NOT rebuild from scratch
- Do NOT change stack
- Do NOT add new features
- Do NOT bypass rebuild-docs
- Do NOT bypass .claude workflows

Goal = **STABILITY + CORRECTNESS**, not feature expansion.

---

## 🧠 HUMAN QUALITY CHECK (MANDATORY)

After each iteration ask:

"Would a senior engineer trust this app in a live demo?"

If not:
- simplify
- add guards
- remove cleverness
- make failure modes explicit

---

## ✅ FINAL COMPLETION CONDITION

ONLY when:
- app builds
- app renders
- core chat works
- no fatal console errors
- Playwright flow passes
- exactly 5 iterations committed

Then output EXACTLY:

<promise>V1_STABILIZED_AND_VERIFIED_VIA_RALPH</promise>
