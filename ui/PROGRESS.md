# UI / visual design audit — page-by-page progress

Companion to `seo/`. Same page-by-page format: one page per pass, a change log
PDF per page, then marked done here.

**Lens:** does the page catch a reader's eye, hold it, and turn it into a
subscriber — hierarchy, typography, colour, spacing, imagery, CTA design,
above-the-fold impact, mobile, accessibility.

| # | Page | Status | Report | UX score | Findings (C/H/M-L) |
|---|------|--------|--------|----------|--------------------|
| 01 | `index.html` — Homepage `/` | ✅ Done — 2026-09-04 | [changelog-01-index.pdf](changelog-01-index.pdf) | 45/100 | 1 / 10 / 13 |
| 02 | `articles.html` — Articles archive | ⬜ Next | — | — | — |
| 03 | `book.html` — The Book | ⬜ Pending | — | — | — |
| 04 | `reflect.html` — Reflect with me | ⬜ Pending | — | — | — |
| 05 | `about.html` — About | ⬜ Pending | — | — | — |
| 06 | `404.html` — Not found | ⬜ Pending | — | — | — |

## Site-wide findings (raised on page 01, apply everywhere)

These live in `styles.css` or shared markup — fix once, fixes every page.

| ID | Finding | Severity |
|----|---------|----------|
| R1 | 3 of 6 nav items render off-screen on mobile; no hamburger, no visible scrollbar | Critical |
| R2 | Every tap target under 44px; all nav links 24px tall | High |
| R3 | Focus ring is the browser default; no `:focus-visible` anywhere in the stylesheet | High |
| V1 | One breakpoint in the whole stylesheet (`max-width: 560px`); `.wrap` capped at 720px | High |
| V2 | `.section-label` and `.post-meta` fail WCAG AA at 3.38:1 | High |
| H2 | No button used anywhere except About, though `.substack-btn` exists at `styles.css:963` | High |
| R5 | 6-second intro splash before content is visible on first load of a session | Medium |
| R6 | No `prefers-color-scheme` support | Low |

## Method

Reproducible from the repo:

- Headless Chromium (Playwright) at 1440×900, 820×1180, 390×844
- Real Fraunces + Inter woff2 served locally, so renders are typographically faithful
- Realistic Substack feed injected via route interception (the live API is blocked in CI)
- Computed styles and geometry extracted from the live DOM; WCAG contrast computed
  from measured colour pairs rather than eyeballed

## Not verifiable from the audit environment

- The real Substack embed in the subscribe block (`X3`) — substack.com is blocked.
  Confirm its visual fit against the page palette in a browser.

## Status legend

⬜ Pending · 🟨 In progress · ✅ Done
