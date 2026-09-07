# UI / visual design audit — complete

All seven pages of blakecody.com have been audited from a design lens: does the
page catch a reader's eye, hold it, and turn it into a subscriber. Hierarchy,
typography, colour, spacing, imagery, CTA design, mobile, accessibility.

| # | Page | Report | UX score | Findings (C/H/M-L) |
|---|------|--------|----------|--------------------|
| 01 | `index.html` — Homepage | [changelog-01-index.pdf](changelog-01-index.pdf) | 45 | 1 / 10 / 13 |
| 02 | `articles.html` — Archive | [changelog-02-articles.pdf](changelog-02-articles.pdf) | 58 | — / 1 / 6 |
| 03 | `book.html` — The Book | [changelog-03-book.pdf](changelog-03-book.pdf) | 60 | — / 1 / 5 |
| 04 | `reflect.html` — Reflect | [changelog-04-reflect.pdf](changelog-04-reflect.pdf) | 72 | — / 1 / 4 |
| 05 | `about.html` — About | [changelog-05-about.pdf](changelog-05-about.pdf) | 68 | — / — / 5 |
| 06 | `404.html` — Not found | [changelog-06-404.pdf](changelog-06-404.pdf) | 74 | — / — / 3 |
| 07 | `privacy.html` — Privacy | [changelog-07-privacy.pdf](changelog-07-privacy.pdf) | **76** | — / — / 3 |

Page 01's score predates the implementation passes; several of its findings have
since shipped. Shared stylesheet: `report.css`. Evidence renders: `assets/`.

---

## Four fixes close almost everything still open

The same items recur on every page. In priority order:

| ID | One change | Closes |
|----|-----------|--------|
| **R1** | A menu button below 560px. At 390px, Reflect, About and Substack render off-screen with no hamburger and no visible scrollbar (`clientW 170 · scrollW 385`). | all 7 pages · **Critical** |
| **V2** | Stop using `--accent-soft #c46a4f` for text — it measures 3.38 against `--bg`. `privacy.html` already uses `--ink-soft` for the same component and passes at 5.52, so the fix is propagating a colour you already ship. | 5 pages, 8 measured failures |
| **V1** | Breakpoints at 1024 and 1280 so `.wrap` reaches ~1100px. Currently 720px on a 1440px screen, which is what makes archive cards 207px wide and the About photo 4% of the viewport. | all 7 pages |
| **R3** | A `:focus-visible` rule — seven lines, site-wide. Currently `outline: auto 1px rgb(16,16,16)`, invisible on the dark hero. | all 7 pages · accessibility |

## Page-specific findings still open

| ID | Page | Finding |
|----|------|---------|
| U8 | book | No book cover art exists anywhere in the repo; the only image on the page is the 30px header logo |
| U1 | articles | Removing pagination fixed the SEO and produced an 8.83-viewport mobile page at 14 posts |
| U14 | reflect | Topic chips are 35px tall; "Life" is 59×35 — the smallest control on the site |
| U20 | about | The shipped iOS app — the page's only hard evidence — sits under a 13.12px H2 that fails contrast |
| U9 | book | The gate is the least designed moment on the page (revisit only if the chapter stays gated — see SEO T22) |
| U3 | articles | 14 thumbnails, 4 aspect ratios, no unifying treatment |
| H5 / U5 / U26 | index, articles, 404 | Card CTAs bottom-misaligned by 24px — two lines of flexbox in `.post-body` fixes all three |
| U12 / U17 | book, reflect | Form failure states are native `alert()` dialogs |
| U29 | privacy | ~95–100 characters per line; needs `max-width: 62ch` on prose |

## Fixed during the audit — verified against current `main`

| ID | Was | Now |
|----|-----|-----|
| H2 | Zero buttons on the entire site | Real buttons everywhere, 46–49px tall |
| X3 | Subscribe was a cross-origin Substack iframe | Native `.sub-form` in the site palette, with UTM params — also closes SEO K21 |
| T10 | No image dimensions; logo 600×600 for a 30px slot | All images carry `width`/`height`; logo 60×60 at 4 KB |
| V8 | No photograph of Blake anywhere | `blake.jpg` on the homepage and in `Person` schema |
| C38 | 404 was a dead end | Three real essays, and the page still fits one screen |
| — | Five one-word H1s | Rewritten as sentences on index, articles, book, reflect, about |

## Corrections

- **V7 (page 01) was wrong.** It claimed `cover.jpg` was unused book cover art.
  It is a photograph of Blake at the 2025 U.S. Open, now correctly used on
  `about.html`. There is no cover art anywhere — see U8. The work is to create
  one, not to display one.
- **R2 (page 01) was too broad.** It counted every sub-44px interactive element.
  WCAG 2.5.8 exempts links inline in a sentence, so prose links are not in scope.
  The finding applies to standalone controls — nav links, chips, arrow CTAs —
  which makes it a smaller and more actionable job than the raw count implied.

## Method

Reproducible from the repo: headless Chromium (Playwright) at 1440×900,
820×1180 and 390×844 · real Fraunces and Inter woff2 served locally so renders
are typographically faithful · a 14-post feed injected via route interception ·
computed styles and geometry read from the live DOM · WCAG contrast computed
from measured colour pairs rather than estimated.

## Not verifiable from the audit environment

- The live Substack confirmation flow after the native form submits —
  `substack.com` is blocked by egress policy here.
