export interface DigitalProduct {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  price: number;
  format: string;
  badge: string;
  highlights: string[];
  checkoutUrl: string;
  matchKeywords: string[];
}

export const ALL_ACCESS_BUNDLE = {
  id: 'all-access-bundle',
  title: 'All-Access QA, A11y & AI Engineering Bundle (All 5 Kits)',
  tagline:
    'Get every checklist, ADA Title II playbook, keyboard spec, Cursor/ESLint guardrail pack, and LLM eval CI workflow in one commercial team bundle.',
  price: 69,
  compareAtPrice: 117,
  format: '5 PDFs + Rules + TS/YML/CSV',
  checkoutUrl: 'https://buy.polar.sh/polar_cl_Nhb9w5woD1H16q8zZFaUhZFA8Q6nnQTSqnd6N0xWRVo',
  highlights: [
    'All 5 production kits included (save 41% vs. buying individually)',
    'Commercial team license for unlimited internal repositories',
    'Instant download + VAT/Sales Tax compliant invoice via Polar',
  ],
};

export const DIGITAL_PRODUCTS: DigitalProduct[] = [
  {
    id: '01-wcag-signoff',
    slug: 'wcag-component-signoff-kit',
    title: 'WCAG 2.1 AA Component Sign-Off Kit',
    tagline:
      'Desk-ready verification rubric for Modals, Forms, Data Tables, and Live Regions with Playwright assertion hooks.',
    price: 19,
    format: 'PDF + Jira/PR Templates',
    badge: 'Best Seller',
    highlights: [
      'Component-by-component Pass/Fail WCAG 2.1 AA checklist (PDF)',
      'Copy-paste Jira/Linear accessibility defect report template (.md)',
      'GitHub PR review checklist for frontend & QA sign-off (.md)',
    ],
    checkoutUrl: 'https://buy.polar.sh/polar_cl_1n6LQL8q3MbzbaqdARu9nAOTqmF2NiN0WhjFn4HN0Rl',
    matchKeywords: ['wcag', 'a11y', 'accessibility', 'enforcing-wcag'],
  },
  {
    id: '02-ada-title-ii',
    slug: 'ada-title-ii-compliance-playbook',
    title: 'ADA Title II & WCAG 2.1 AA Triage Playbook',
    tagline:
      'Severity triage matrix (P0-P3), 30-day remediation rollout, and broken-vs-compliant AI HTML patterns.',
    price: 25,
    format: 'PDF + CSV Tracker',
    badge: '2026 Compliance',
    highlights: [
      'ADA Title II & WCAG 2.1 AA engineering triage playbook (PDF)',
      '35% automated / 65% manual CI gate coverage architecture',
      'Spreadsheet-ready remediation & ownership tracker (.csv)',
    ],
    checkoutUrl: 'https://buy.polar.sh/polar_cl_4WRvn1tdquxFPldQ5wuMxUnArbKqQLA1kkk1o4K1Hl6',
    matchKeywords: ['ada', 'title-ii', 'compliance'],
  },
  {
    id: '03-keyboard-sr',
    slug: 'keyboard-screenreader-qa-guide',
    title: 'Keyboard & Screen Reader QA Field Guide',
    tagline:
      'VoiceOver & NVDA keystroke desk card, ARIA live-region rules, and a drop-in Playwright focus-trap spec.',
    price: 15,
    format: 'PDF + Playwright Spec',
    badge: 'Quick Win',
    highlights: [
      'macOS VoiceOver & Windows NVDA testing cheat sheet (PDF)',
      'Modal focus-trap, Escape restoration & roving tabindex contract',
      'Drop-in keyboard-focus-audit.spec.ts for Playwright',
    ],
    checkoutUrl: 'https://buy.polar.sh/polar_cl_6XJT1Joap5EwQQ7eDY4YPrMyCDDwG6pPBOtYv17PRF1',
    matchKeywords: ['keyboard', 'screen-reader', 'voiceover'],
  },
  {
    id: '04-playwright-ai-rules',
    slug: 'deterministic-playwright-ai-rules',
    title: 'Deterministic Playwright AI Rules & Guardrails',
    tagline:
      'Stop Cursor and Claude from emitting XPath and waitForTimeout() slop with modular .mdc rules and ESLint enforcement.',
    price: 29,
    format: 'PDF + 3 .mdc Rules + ESLint',
    badge: 'AI Native',
    highlights: [
      '3 modular glob-scoped .cursor/rules/*.mdc files (Playwright, A11y, Keyboard)',
      'Hard CI enforcement via eslint-playwright-guardrails.mjs',
      '5-tier locator hierarchy & sub-50ms storageState guide (PDF)',
    ],
    checkoutUrl: 'https://buy.polar.sh/polar_cl_D8E10dvjjzbuFgwdN5NwnuTyEeYCGJkI1PJX71HNeAE',
    matchKeywords: ['cursor', 'playwright', 'flaky', 'migrated'],
  },
  {
    id: '05-llm-eval-gate',
    slug: 'two-tier-llm-eval-cicd-kit',
    title: 'Two-Tier LLM Eval CI/CD Gate & Review Kit',
    tagline:
      'Prevent prompt regressions without burning CI token budgets. Includes GitHub Actions workflow and 4-persona spec prompts.',
    price: 29,
    format: 'PDF + GitHub YML + Prompts',
    badge: 'AI Quality',
    highlights: [
      'Tier 1 ($0 deterministic) + Tier 2 (cost-capped judge) blueprint (PDF)',
      'Ready-to-adapt GitHub Actions eval-gate-workflow.yml',
      '4-persona multi-agent spec review prompt pack (.md)',
    ],
    checkoutUrl: 'https://buy.polar.sh/polar_cl_WO1gQfvjfHKRIHbYPwKpVt5dPVsiOCsTu91ss1C2vUM',
    matchKeywords: ['llm', 'eval', 'multi-agent', 'goldfish', 'policy'],
  },
];

export function matchProductForPost(slug: string, tags: string[]): DigitalProduct {
  const haystack = `${slug} ${tags.join(' ')}`.toLowerCase();
  const matched = DIGITAL_PRODUCTS.find((product) =>
    product.matchKeywords.some((kw) => haystack.includes(kw))
  );
  return matched ?? DIGITAL_PRODUCTS[0];
}
