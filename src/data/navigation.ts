export interface NavLink {
  label: string;
  href: string;
}

export const PRIMARY_NAV_LINKS: readonly NavLink[] = [
  { label: 'Services & Pricing', href: '/#services' },
  { label: 'Digital Kits', href: '/products' },
  { label: 'WCAG Standards', href: '/#standards' },
  { label: 'Articles', href: '/blog' },
  { label: 'FAQ', href: '/#faq' },
] as const;

export const HEADER_CTA = {
  fullLabel: 'Book a 15-Min Fit Call',
  shortLabel: 'Book a Call',
  href: '/#book-call',
} as const;

/**
 * Determines whether a navigation href corresponds to the active page pathname.
 * Hash-only homepage anchors (e.g. "/#services") are never marked aria-current="page".
 */
export function isCurrentPage(href: string, pathname: string): boolean {
  if (href.includes('#')) {
    return false;
  }

  const normalizedHref = href === '/' ? '/' : href.replace(/\/+$/, '');
  const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');

  if (normalizedHref === '/') {
    return normalizedPath === '/';
  }

  return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`);
}
