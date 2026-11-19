import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Header from '../../src/components/Header.astro';
import { HEADER_CTA, PRIMARY_NAV_LINKS } from '../../src/data/navigation';

describe('Header.astro component', () => {
  it('renders a single primary navigation landmark with mobile popover controls', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Header, {
      request: new Request('https://avilano.dev/'),
    });

    expect(html).toContain('aria-label="Primary"');
    expect(html).toContain('popovertarget="site-menu"');
    expect(html).toContain('popovertargetaction="toggle"');
    expect(html).toContain('aria-controls="site-menu"');
    expect(html).toContain('id="site-menu"');
    expect(html).toContain('popover="auto"');
    expect(html).toContain(`href="${HEADER_CTA.href}"`);

    for (const link of PRIMARY_NAV_LINKS) {
      expect(html).toContain(`href="${link.href}"`);
      expect(html).toContain(link.label.replace(/&/g, '&amp;'));
    }
  });

  it('marks the active route with aria-current="page"', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Header, {
      request: new Request('https://avilano.dev/blog/killing-flaky-tests-at-scale'),
    });

    expect(html).toMatch(/href="\/blog"[^>]*aria-current="page"/);
    expect(html).not.toMatch(/href="\/products"[^>]*aria-current="page"/);
  });
});
