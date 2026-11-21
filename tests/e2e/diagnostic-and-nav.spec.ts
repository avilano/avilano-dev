import { expect, test } from '@playwright/test';

test.describe('Diagnostic flow, FAQ navigation, and Products CTA', () => {
  test('clicking FAQ in header scrolls to #faq and stays there without yanking back to #book-call', async ({
    page,
  }) => {
    await page.goto('/');

    const menuButton = page.getByRole('button', { name: 'Menu' });
    const siteMenu = page.locator('#site-menu');

    if (await menuButton.isVisible()) {
      await menuButton.click();
      await expect(siteMenu).toBeVisible();
    }

    await siteMenu.getByRole('link', { name: 'FAQ' }).click();
    await expect(page).toHaveURL(/#faq$/);

    // Wait 1500ms to confirm CalEmbed does not hydrate and yank viewport back to #book-call
    await page.waitForTimeout(1500);

    const layout = await page.evaluate(() => {
      const faq = document.getElementById('faq');
      const bookCall = document.getElementById('book-call');
      const faqRect = faq?.getBoundingClientRect();
      const bookCallRect = bookCall?.getBoundingClientRect();
      return {
        hash: window.location.hash,
        scrollY: window.scrollY,
        viewportHeight: window.innerHeight,
        faqTop: faqRect?.top ?? Infinity,
        faqBottom: faqRect?.bottom ?? -Infinity,
        bookCallTop: bookCallRect?.top ?? Infinity,
      };
    });

    expect(layout.hash).toBe('#faq');
    expect(layout.scrollY).toBeGreaterThan(0);
    // #faq must remain visible in the viewport near the top (not scrolled back up to #book-call)
    expect(layout.faqTop).toBeLessThan(layout.viewportHeight * 0.6);
    expect(layout.faqBottom).toBeGreaterThan(0);
    expect(layout.bookCallTop).toBeLessThan(layout.faqTop);
  });

  test('completes 5-step QA Diagnostic, validates email on blur/input, unlocks light scorecard, and copies summary', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.route('**/api/diagnostic', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto('/#qa-diagnostic');

    const diagnostic = page.locator('#qa-diagnostic');
    const nextBtn = diagnostic.locator('#diag-next-btn');

    // Step 1: CI Speed & Determinism
    await diagnostic.locator('label', { hasText: '10-30 min, occasional reruns' }).click();
    await nextBtn.click();

    // Step 2: Pre-Merge Release Gating
    await diagnostic.locator('label', { hasText: 'Manual QA / spot-checks before release' }).click();
    await nextBtn.click();

    // Step 3: WCAG 2.1 AA & AI Safety Gates
    await diagnostic.locator('label', { hasText: 'Periodic manual audits / ad-hoc checks' }).click();
    await nextBtn.click();

    // Step 4: Routing & Team Scale
    await diagnostic.locator('label', { hasText: 'Flaky tests blocking PR merges' }).click();
    await diagnostic.locator('label', { hasText: '11-40' }).click();
    await nextBtn.click();

    // Step 5: Verify review summary shows chosen answers
    const reviewSummary = diagnostic.locator('#diag-review-summary');
    await expect(reviewSummary).toBeVisible();
    await expect(reviewSummary.locator('#review-ci-speed')).toHaveText('10-30 min, occasional reruns');
    await expect(reviewSummary.locator('#review-release-gate')).toHaveText('Manual QA / spot-checks before release');
    await expect(reviewSummary.locator('#review-wcag-ai')).toHaveText('Periodic manual audits / ad-hoc checks');
    await expect(reviewSummary.locator('#review-friction-scale')).toHaveText(
      'Flaky tests blocking PR merges (11-40 engineers)',
    );

    // Validate email blur error and input clearing
    const emailInput = diagnostic.locator('#diag-email');
    const emailError = diagnostic.locator('#diag-email-error');

    await emailInput.fill('bad-email');
    await emailInput.blur();
    await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    await expect(emailError).toBeVisible();
    await expect(emailError).toContainText('Enter a valid work email address.');

    await emailInput.fill('alex@acme.dev');
    await expect(emailInput).not.toHaveAttribute('aria-invalid', 'true');
    await expect(emailError).toBeHidden();

    // Fill remaining contact fields and submit
    await diagnostic.locator('#diag-name').fill('Alex Rivera');
    await diagnostic.locator('#diag-company').fill('Acme Engineering');
    await diagnostic.locator('#diag-submit-btn').click();

    // Verify #diag-results is visible with Option A Light styling
    const resultsPanel = diagnostic.locator('#diag-results');
    await expect(resultsPanel).toBeVisible();
    await expect(resultsPanel).toHaveClass(/bg-white/);
    await expect(resultsPanel).not.toHaveClass(/bg-dark-900/);
    await expect(resultsPanel.locator('#res-total-score')).toHaveText('46');

    const bgColor = await resultsPanel.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor,
    );
    expect(bgColor).toBe('rgb(255, 255, 255)');

    // Click Copy Diagnostic Summary and verify confirmation state
    const copyBtn = resultsPanel.locator('#res-copy-summary-btn');
    await expect(copyBtn).toHaveText('Copy Diagnostic Summary');
    await copyBtn.click();
    await expect(copyBtn).toHaveText('Copied Summary ✓');
    await expect(resultsPanel.locator('#res-copy-status')).toContainText('copied');
  });

  test('/products displays the Need a Custom Implementation? CTA link', async ({ page }) => {
    await page.goto('/products');

    const ctaLink = page.getByRole('link', { name: 'Need a Custom Implementation?' });
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toHaveAttribute('href', '/#book-call');
  });
});
