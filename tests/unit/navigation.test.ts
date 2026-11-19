import { describe, expect, it } from 'vitest';
import { HEADER_CTA, PRIMARY_NAV_LINKS, isCurrentPage } from '../../src/data/navigation';

describe('navigation data', () => {
  it('defines all primary navigation links with root-relative paths', () => {
    expect(PRIMARY_NAV_LINKS.length).toBeGreaterThanOrEqual(5);
    for (const link of PRIMARY_NAV_LINKS) {
      expect(link.label.trim().length).toBeGreaterThan(0);
      expect(link.href.startsWith('/')).toBe(true);
    }
  });

  it('points the header CTA to the root-relative #book-call anchor', () => {
    expect(HEADER_CTA.href).toBe('/#book-call');
    expect(HEADER_CTA.shortLabel.length).toBeLessThan(HEADER_CTA.fullLabel.length);
  });
});

describe('isCurrentPage', () => {
  it('matches exact routes and nested sub-routes', () => {
    expect(isCurrentPage('/blog', '/blog')).toBe(true);
    expect(isCurrentPage('/blog', '/blog/')).toBe(true);
    expect(isCurrentPage('/blog', '/blog/killing-flaky-tests-at-scale')).toBe(true);
    expect(isCurrentPage('/products', '/products')).toBe(true);
  });

  it('does not match unrelated routes or hash-only anchors', () => {
    expect(isCurrentPage('/blog', '/products')).toBe(false);
    expect(isCurrentPage('/#services', '/')).toBe(false);
    expect(isCurrentPage('/#faq', '/blog')).toBe(false);
  });
});
