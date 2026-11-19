import { expect, test } from '@playwright/test';

const NAV_LABELS = [
  'Services & Pricing',
  'Digital Kits',
  'WCAG Standards',
  'Articles',
  'FAQ',
];

test.describe('Header navigation', () => {
  test('mobile menu opens, navigates, closes on Escape, and has no horizontal overflow', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'Mobile-only assertions');

    await page.goto('/');

    const menuButton = page.getByRole('button', { name: 'Menu' });
    const siteMenu = page.locator('#site-menu');

    await expect(menuButton).toBeVisible();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(siteMenu).toBeHidden();

    // Verify no horizontal overflow on mobile viewport
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    // Open mobile menu
    await menuButton.click();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    await expect(siteMenu).toBeVisible();

    for (const label of NAV_LABELS) {
      await expect(siteMenu.getByRole('link', { name: label })).toBeVisible();
    }

    // Dismiss via Escape key
    await page.keyboard.press('Escape');
    await expect(siteMenu).toBeHidden();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    // Re-open and navigate to Articles (/blog)
    await menuButton.click();
    await expect(siteMenu).toBeVisible();
    await siteMenu.getByRole('link', { name: 'Articles' }).click();
    await expect(page).toHaveURL(/\/blog\/?$/);

    // Verify header CTA on /blog points back to /#book-call
    const ctaLink = page.locator('header a[href="/#book-call"]');
    await expect(ctaLink).toBeVisible();

    // Verify /blog has no horizontal overflow and all tag pills stay inside their article cards
    const blogLayout = await page.evaluate(() => {
      const hasOverflow =
        document.documentElement.scrollWidth > document.documentElement.clientWidth;
      const clippedPills: string[] = [];
      for (const article of document.querySelectorAll('article')) {
        const cardRight = article.getBoundingClientRect().right;
        for (const pill of article.querySelectorAll('span.whitespace-nowrap')) {
          if (pill.getBoundingClientRect().right > cardRight + 1) {
            clippedPills.push(pill.textContent?.trim() ?? '');
          }
        }
      }
      return { hasOverflow, clippedPills };
    });
    expect(blogLayout.hasOverflow).toBe(false);
    expect(blogLayout.clippedPills).toEqual([]);
  });

  test('desktop navigation renders inline without mobile menu button', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Desktop-only assertions');

    await page.goto('/');

    const menuButton = page.getByRole('button', { name: 'Menu' });
    const siteMenu = page.locator('#site-menu');

    await expect(menuButton).toBeHidden();
    await expect(siteMenu).toBeVisible();

    for (const label of NAV_LABELS) {
      await expect(siteMenu.getByRole('link', { name: label })).toBeVisible();
    }

    // Navigate to /products and verify aria-current="page"
    await siteMenu.getByRole('link', { name: 'Digital Kits' }).click();
    await expect(page).toHaveURL(/\/products\/?$/);
    await expect(siteMenu.getByRole('link', { name: 'Digital Kits' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
