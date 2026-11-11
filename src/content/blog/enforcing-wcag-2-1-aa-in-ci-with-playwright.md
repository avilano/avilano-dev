---
title: "Enforcing US Government WCAG 2.1 AA Compliance on Every Pull Request with Playwright"
description: "How to automate accessibility testing beyond basic linters using @axe-core, keyboard focus traps, and Guidepup VoiceOver audio gates."
pubDate: 2026-11-08
tags: ["Accessibility", "WCAG 2.1 AA", "Playwright", "Guidepup"]
readTime: "7 min read"
---

With the **US Department of Justice (DOJ) ADA Title II Final Rule** and the **HHS Section 504 Rule** taking effect across 2026 and 2027, digital accessibility has shifted from a "nice-to-have" frontend polish item into a **mandatory legal and enterprise procurement requirement**.

Both federal rules explicitly codify **WCAG 2.1 Level AA** as the technical standard.

Yet, most SaaS companies still rely on one of two flawed approaches:
1. **Third-party overlay widgets:** Widely rejected by disability rights organizations and federal courts; they fail enterprise vendor security audits.
2. **Static PDF audits:** Teams pay \$25,000 for a 100-page audit that becomes obsolete the moment developers push new code.

Here is how we build a **permanent 3-layer automated accessibility defense** wired directly into Playwright and GitHub Actions.

---

## Layer 1: Static DOM Auditing with `@axe-core/playwright`

The open-source `@axe-core/playwright` library catches roughly 35% of accessibility defects (missing alt text, color contrast ratios below 4.5:1, duplicate element IDs, and invalid ARIA roles).

We wrap it into a composable test fixture that fails CI builds on any `critical` or `serious` violation:

```typescript
// fixtures/base.fixture.ts
import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export const test = base.extend({
  checkA11y: async ({ page }, use, testInfo) => {
    const scanner = async (options = {}) => {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      const critical = results.violations.filter((v) =>
        ['critical', 'serious'].includes(v.impact || '')
      );

      // Attach complete JSON audit trace to the Playwright HTML report
      await testInfo.attach('wcag-audit', {
        body: JSON.stringify(results.violations, null, 2),
        contentType: 'application/json',
      });

      expect(critical.length, `Found ${critical.length} critical WCAG violations`).toBe(0);
    };
    await use(scanner);
  },
});
```

---

## Layer 2: Deterministic Keyboard Navigation & Focus Traps

Automated scanners like Axe cannot evaluate interactive behavior. Under **WCAG 2.1.2 (No Keyboard Trap)** and **WCAG 2.4.3 (Focus Order)**, every modal and dropdown must be keyboard operable.

We test these using Playwright's native `page.keyboard`:

```typescript
test('modal dialog traps focus and restores focus on escape', async ({ page }) => {
  await page.goto('/dashboard');
  const trigger = page.getByRole('button', { name: /open settings/i });
  await trigger.focus();
  await page.keyboard.press('Enter');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // Assert Tab cannot leak outside the modal
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
    const isInside = await page.evaluate(() => {
      const active = document.activeElement;
      const modal = document.querySelector('[role="dialog"]');
      return modal ? modal.contains(active) : false;
    });
    expect(isInside).toBe(true);
  }

  // Press Escape to dismiss and verify focus restores to trigger
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
```

---

## Layer 3: Assistive Technology Spoken Audio via Guidepup

The third layer tests what screen reader users actually hear. Using **[Guidepup](https://www.guidepup.dev/)**, we drive native macOS VoiceOver programmatically:

```typescript
import { test, expect } from '@playwright/test';
import { voiceOver } from '@guidepup/playwright';

test('VoiceOver announces live cart updates', async ({ page }) => {
  await page.goto('/shop');
  await voiceOver.navigateToWebContent();

  await page.getByRole('button', { name: /add to cart/i }).click();

  // Validate that VoiceOver announces the dynamic aria-live update
  const spokenText = await voiceOver.itemText();
  expect(spokenText).toMatch(/cart updated|1 item added/i);
});
```

---

## Summary
By combining all three layers, your engineering team catches accessibility regressions on every pull request in under **3 minutes of CI time**—ensuring continuous compliance and unblocking enterprise software procurement.

---

*Preparing for an enterprise RFP or US ADA Title II / HHS 504 review? [Book a 15-Minute Architecture Call](https://cal.com/avilano/15min) or explore our [21-Day WCAG Compliance Sprint](https://avilano.dev/#services).*
