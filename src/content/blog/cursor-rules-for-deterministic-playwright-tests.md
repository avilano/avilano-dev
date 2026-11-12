---
title: "Stop Generating Flaky Tests with AI: Cursor Rules for Deterministic Playwright Suites"
description: "How to prevent LLMs from emitting brittle XPath selectors, arbitrary sleeps, and unmaintainable test slop using strict Cursor and Claude rules."
pubDate: 2026-11-10
tags: ["AI Tooling", "Playwright", "Cursor", "Best Practices"]
readTime: "5 min read"
---

AI coding assistants like **Cursor** and **Claude** have radically accelerated initial feature development. But when developers prompt an LLM with *"Write an end-to-end test for our checkout flow"*, the AI almost universally outputs **test automation anti-patterns**:

- Brittle CSS hierarchy selectors: `page.locator('div.container > form > div:nth-child(2) > input')`
- Non-deterministic sleep statements: `await page.waitForTimeout(5000)`
- Fragile XPath locators that break the second a UI style changes.
- Monolithic 200-line test scripts with zero Page Object Model encapsulation.

The result? The team ships 50 tests in an afternoon, and spends the next six months debugging CI failures.

Here is the exact **Cursor Rules (`.cursor/rules/*.mdc`)** architecture we enforce to make AI assistants generate rock-solid, deterministic Playwright suites on the first prompt.

---

## 1. The Core Problem: LLMs Default to Visual DOM Scraping

LLMs trained on public GitHub repositories have ingested a decade of legacy Selenium and Puppeteer scripts. Unless you constrain them with deterministic system rules, they will default to 2018 testing practices.

To produce maintainable test suites, an AI assistant must be strictly instructed to interact with the application **through the browser's Accessibility Tree**, exactly like a real user or assistive screen reader.

---

## 2. The Production Cursor Rule (`.cursor/rules/playwright-standards.mdc`)

Create this file in your project repository under `.cursor/rules/playwright-standards.mdc`:

```markdown
---
description: Enforces deterministic Playwright standards, POM architecture, and WCAG accessibility
globs: tests/**/*.ts, src/pages/**/*.page.ts
alwaysApply: false
---

# Playwright Test Standards & Architecture

You are a Senior SDET and AI Quality Engineer. When writing or refactoring Playwright tests, you MUST strictly adhere to the following rules:

## 1. Locator Priority Hierarchy (Accessibility First)
Never use XPath or brittle CSS selectors (`div > span`, classes, or IDs). Always query through user-facing accessibility semantics in this exact priority:
1. `page.getByRole('button', { name: /save changes/i })`
2. `page.getByLabel('Work Email')`
3. `page.getByPlaceholder('name@company.com')`
4. `page.getByText('Success')`
5. `page.getByTestId('checkout-summary')` (ONLY when semantic roles cannot apply)

## 2. Zero-Tolerance for Arbitrary Sleeps
- BANNED: `page.waitForTimeout()` or `setTimeout()`.
- REQUIRED: Use Playwright's built-in web-first assertions (`expect(locator).toBeVisible()`, `expect(locator).toHaveText()`). Let Playwright's auto-retrying mechanism handle microtask reconciliation.

## 3. Strict Page Object Model (POM)
- Tests (`tests/**/*.spec.ts`) must NEVER invoke raw locators directly.
- All DOM queries and UI interactions must be encapsulated inside Page Objects (`src/pages/*.page.ts`).
- Method names must represent user intent (`checkoutPage.submitPayment()`), not implementation details.

## 4. Accessibility Testing Integration
- Every critical user flow must execute `@axe-core/playwright` validation with `axe.include()`.
- Keyboard navigation must verify focus trapping on modals and `Escape` key restoration.
```

---

## 3. The Before and After

### ❌ What Cursor Generates Without Rules:
```typescript
test('user logs in', async ({ page }) => {
  await page.goto('https://app.com/login');
  await page.locator('#email_input_field').fill('user@test.com');
  await page.locator('input[type="password"]').fill('secret');
  await page.click('.btn-primary-blue');
  await page.waitForTimeout(4000);
  expect(await page.locator('.dashboard-title').innerText()).toBe('Dashboard');
});
```

### ✅ What Cursor Generates With the Rule Enabled:
```typescript
import { test, expect } from '../fixtures/base.fixture';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';

test('user authenticates and arrives at dashboard', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  await loginPage.navigate();
  await loginPage.login('user@test.com', 'secret');

  await expect(dashboardPage.heading).toBeVisible();
  await loginPage.checkAccessibility();
});
```

---

## 4. Takeaway

AI isn't bad at writing tests; it is bad at **guessing your architectural standards**. 

By pinning your AI coding assistant to explicit rules, your team can generate high-velocity tests that actually run green in CI for years.
