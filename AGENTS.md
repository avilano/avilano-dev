# Codebase Directives: avilano.dev

## 1. Technical Architecture
* **Framework:** Astro 4 + Tailwind CSS (Static site generation, zero render-blocking scripts).
* **Target Audience:** Technical engineering leaders inspecting portfolio, case studies, and engineering blog posts.

---

## 2. Performance & Quality Mandates
* **Lighthouse Audits:** Must maintain 100/100 across Performance, Accessibility, Best Practices, and SEO.
* **Font Loading:** External Google Fonts must load asynchronously via non-blocking print-swap stylesheets. Never use blocking `@import` or synchronous render-blocking `<link rel="stylesheet">` tags in `<head>`.
* **Third-Party Scripts:** Embeds (e.g. scheduling widgets, analytics) must be lazy-loaded on viewport intersection (`rootMargin: "350px 0px"`) or interaction. Zero third-party cookies on initial page load.

---

## 3. Accessibility Standards (WCAG 2.1 / 2.2 AA)
* **Contrast Ratios:**
  - Standard body copy: Minimum 4.5:1.
  - Large / bold text: Minimum 3:1.
  - Dark mode muted text: Must use high-contrast slate-400 (`#94a3b8`, 7.4:1 ratio against `#070a12`). Never use slate-500 on dark backgrounds.
  - High-contrast interactive buttons: Obsidian text on pure white (`#030712` on `#ffffff`, 18.7:1 ratio).
* **Keyboard Navigation:**
  - High-visibility keyboard skip-link (`#main-content`) anchored to the primary `<main id="main-content">` wrapper.
  - All interactive elements must have visible focus rings (`focus:ring-2 focus:ring-brand-400`).

---

## 4. Carousel Asset Compilation Pipeline
* **Dimensions:** 1080px × 1350px (4:5 portrait ratio).
* **Source Templates:** `public/carousels/*.html`
* **Compiled PDF Outputs:** `public/carousels/*.pdf`
* **Compilation Command:**
  ```bash
  /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --headless --disable-gpu --no-pdf-header-footer --print-to-pdf=<output.pdf> <input.html>
  ```
