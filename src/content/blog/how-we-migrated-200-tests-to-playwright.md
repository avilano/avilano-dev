---
title: "How We Migrated 200+ Legacy Tests to Playwright and Slashed CI Runtime by 30%"
description: "A battle-tested blueprint for executing a zero-downtime test migration from legacy Selenium/Cypress suites to modern TypeScript Playwright."
pubDate: 2026-11-01
tags: ["Playwright", "Migration", "CI/CD", "TypeScript"]
readTime: "6 min read"
---

When fast-shipping SaaS companies scale past their initial MVP, test automation suites written 3 to 5 years ago in Selenium or Cypress often become their single biggest bottleneck.

In a fast-growing, multi-tenant enterprise SaaS environment, we faced this exact challenge: a legacy test suite that was slow, prone to arbitrary timing flakes, and delaying pull request merges.

Here is the exact architectural blueprint we used to migrate **200+ end-to-end tests to Playwright and TypeScript**, cutting overall pipeline runtime by **30%** with zero deployment downtime.

---

## 1. The Strategy: Dual-Run CI (Never Stop The Line)

The biggest mistake teams make during a test migration is attempting a "Big Bang" cutover. Freezing developer releases for a month while rewriting tests always fails.

Instead, we established a **Dual-Run CI pipeline** in GitHub Actions:

```
[Pull Request Created]
  ├── Job 1: Legacy Suite (Active Gate - Blocks merge)
  └── Job 2: Playwright Migrated Suite (Informational - Parity verification)
```

1. **Phase 1 (Dual-Run):** The legacy suite remained the required merge gate. As tests were converted to Playwright, they ran in parallel.
2. **Phase 2 (Parity Check):** We verified that the Playwright version ran in under 1/3rd the time with zero false positives.
3. **Phase 3 (Cutover):** Once parity was reached for a domain, we removed the legacy test and flipped Playwright to the required status.

---

## 2. Page Object Model (POM) Encapsulation

Rather than copying procedural test scripts, we architected a modular, component-based Page Object Model adhering strictly to the browser's **Accessibility Tree**:

```typescript
// pages/schedule-management.page.ts
import { Page, Locator } from '@playwright/test';

export class ScheduleManagementPage {
  readonly submitButton: Locator;
  readonly searchField: Locator;

  constructor(private page: Page) {
    // We replaced brittle XPaths with accessible role locators
    this.submitButton = page.getByRole('button', { name: /save changes/i });
    this.searchField = page.getByLabel(/search courses/i);
  }

  async searchAndSave(query: string) {
    await this.searchField.fill(query);
    await this.submitButton.click();
  }
}
```

By prioritizing `getByRole()` and `getByLabel()`, our selectors stopped breaking whenever frontend engineers refactored CSS classes or updated Tailwind styling.

---

## 3. Sub-50ms API Session Seeding

Our legacy suite spent nearly 40% of its total runtime repeatedly logging in through the UI form for every single test.

We replaced this with Playwright's native `storageState` caching. An isolated `auth.setup.ts` fetches a JWT session cookie via direct REST API calls once, caching the session state to `.auth/user.json`. Every subsequent test launched already authenticated in under **50 milliseconds**.

---

## Key Results
* **200+ tests** successfully migrated to TypeScript Playwright.
* **Pipeline runtime slashed by 30%** across CI workflows.
* **Test maintenance drops by >60%** due to auto-waiting assertions and resilient role-based locators.

---

*Need help migrating your legacy test suite or eliminating flaky tests? [Book a 15-Minute Architecture Call](https://cal.com/avilano/15min) or explore our [21-Day Migration Sprint](https://avilano.dev/#services).*
