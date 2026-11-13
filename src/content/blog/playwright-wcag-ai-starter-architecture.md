---
title: "The Zero-Flake Playwright + WCAG 2.1 AA + AI Starter Architecture"
description: "A 5-part production test architecture combining Cursor AI guardrails, sub-50ms API auth seeding, 3-layer WCAG 2.1 AA gates, and diff-based CI risk selection."
pubDate: 2026-11-12
tags: ["Playwright", "WCAG 2.1 AA", "AI Tooling", "CI/CD"]
readTime: "6 min read"
---

Most Playwright starter repositories give you a folder of sample tests and leave the hard scaling problems—accessibility compliance, AI-generated test slop, and slow CI pipelines—as an exercise for the team.

To solve all three in a single unified scaffold, we designed the **`playwright-wcag-ai-starter`** architecture around five core engineering patterns.

---

## Repository Blueprint

```text
playwright-wcag-ai-starter/
├── .cursor/rules/                     # AI QA Guardrails (Cursor & Claude)
│   ├── a11y-standards.mdc             # Enforces WCAG 2.1 AA & semantic DOM
│   ├── keyboard-nav-patterns.mdc      # Focus management & modal trap rules
│   └── playwright-patterns.mdc        # Enforces getByRole() & zero-flake POMs
├── .github/workflows/ci.yml           # Sharded execution + a11y gates (<3 min)
├── scripts/risk-engine.ts             # Smart Risk Selector (git diff -> tags)
├── src/
│   ├── fixtures/
│   │   ├── base.fixture.ts            # Custom AxeBuilder WCAG AA fixture
│   │   └── keyboard.fixture.ts        # Focus-trap & Escape restoration helpers
│   └── pages/base.page.ts             # Accessible Page Object Model
└── tests/
    ├── auth.setup.ts                  # <50ms API auth & storageState caching
    ├── a11y/                          # Static DOM WCAG 2.1 AA suites
    ├── keyboard/                      # Tab order, focus-trap & skip-link specs
    └── screen-reader/                 # Guidepup VoiceOver audio assertions
```

---

## The 5 Architectural Pillars

### 1. AI QA Guardrails (`.cursor/rules/*.mdc`)
Without repo-level constraints, AI coding assistants default to brittle CSS selectors and `waitForTimeout()` sleeps. Pinning `.cursor/rules/*.mdc` forces assistants to emit `getByRole()`, web-first assertions, and Page Object encapsulation on the first prompt.

### 2. Sub-50ms API Session Seeding (`storageState`)
Legacy E2E suites often spend 40% of their CI runtime logging in through the UI form on every test. An isolated `auth.setup.ts` fetches the session token via API once and caches `storageState` to disk—launching every subsequent spec authenticated in under **50 milliseconds**.

### 3. 3-Layer WCAG 2.1 AA Defense
* **Static DOM (`@axe-core/playwright`):** Catches contrast, missing labels, and invalid ARIA roles (~35% of defects).
* **Deterministic Keyboard Navigation:** Verifies `Tab` stays trapped inside open modals and `Escape` restores focus to the triggering button (WCAG 2.1.2 & 2.4.3).
* **Spoken Screen-Reader Audio (`@guidepup/playwright`):** Drives native macOS VoiceOver to assert dynamic `aria-live="polite"` announcements actually speak.

### 4. Changed-File Risk Engine (`scripts/risk-engine.ts`)
Instead of running every slow test on trivial PRs, `risk-engine.ts` inspects `git diff` and selects targeted `@a11y` and `@keyboard` tags when UI components change—keeping total CI feedback under **3 minutes**.

### 5. Dual-Run Migration Recipes
When replacing legacy Selenium or Cypress suites, teams run Playwright in parallel as an informational check until domain parity is proven, avoiding feature freezes.
