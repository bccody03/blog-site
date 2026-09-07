# SEO audit — complete

All seven pages of blakecody.com have been audited. Each pass produced a change
log PDF covering **technical → content/text → tracking**.

| # | Page | Report | Findings (C/H/M-L) |
|---|------|--------|--------------------|
| 01 | `index.html` — Homepage `/` | [changelog-01-index.pdf](changelog-01-index.pdf) | — / 11 / 21 |
| 02 | `articles.html` — Articles archive | [changelog-02-articles.pdf](changelog-02-articles.pdf) | 1 / 6 / 9 |
| 03 | `book.html` — The Book | [changelog-03-book.pdf](changelog-03-book.pdf) | 1 / 4 / 7 |
| 04 | `reflect.html` — Reflect with me | [changelog-04-reflect.pdf](changelog-04-reflect.pdf) | — / 3 / 9 |
| 05 | `about.html` — About | [changelog-05-about.pdf](changelog-05-about.pdf) | — / 2 / 7 |
| 06 | `404.html` — Not found | [changelog-06-404.pdf](changelog-06-404.pdf) | — / — / 3 |
| 07 | `privacy.html` — Privacy | [changelog-07-privacy.pdf](changelog-07-privacy.pdf) | — / — / 4 |

Shared stylesheet for the reports: `report.css`.

---

## Open findings, by priority

### Critical

| ID | Page | Finding |
|----|------|---------|
| **T22** | book | `chapter-1.pdf` is public, crawlable, text-extractable and linked from static HTML with no robots exclusion. The gate does not gate, and the PDF can outrank `book.html` for the chapter's own text. **10-minute mitigation:** `Disallow: /chapter-1.pdf` + drop the static `href`. |

### High

| ID | Page | Finding |
|----|------|---------|
| T23 | book | No `Book` schema on the book page (do **not** add `offers`/`isbn` — unpublished) |
| C20 C21 | book | Title omits "Lead with Love, Live with Intention"; H1 is one word |
| C27 C28 | reflect | Title and H1 target a coined phrase; the page's real search intent is unaddressed |
| T29 | reflect | Zero `<label>` elements — all fields resolve to PLACEHOLDER ONLY (WCAG 3.3.2, 1.3.1) |
| K14 | book | Chapter downloads are a floor, not a total; direct PDF hits invisible |
| T32 | about | No `ProfilePage`/`Person` schema on the page about the person |
| C34 | about | Title and H1 are both "About" |

### Site-wide, still open

| ID | Finding |
|----|---------|
| **C4** | Every article lives on Substack; the domain has nothing of its own to rank. The strategic one — it dissolves T22-Option-B, C17, C36 and half of C18. |
| T2 | Post lists render client-side from a third-party API |
| T5 | Schema exists only on `index.html` and `articles.html`; four pages have none |
| K21 | The newsletter signup is a cross-origin iframe, so the **primary conversion is unmeasurable**. Replacing it also satisfies UI finding X3. |
| T13 | 10-minute cache ceiling — a GitHub Pages limit, not fixable without a CDN |

### Medium / Low

Per-page detail is in each PDF. Recurring themes worth naming:

- **One-word H1s.** Five pages had them (`index`, `articles`, `book`, `reflect`, `about`). Two are fixed. `privacy` is the deliberate exception — see C40.
- **Heading-tree breaks.** H1 → H3 jumps or H2s arriving after H3s on `book`, `reflect`. `privacy` is the only page with a clean tree.
- **Facts with expiry dates.** "Free for now" (reflect, 5 places), "22 years old" (about, 3 places). Nothing catches either going stale.

---

## Implemented and verified

Two implementation passes landed on `main` during the audit and were each
re-verified against the live site, not the diff.

**`88fdcd1` — SEO pass 1** (homepage): T1 HTTPS enforce · T3 fake sample posts
removed · T4 fonts non-blocking · T8 internal links → `/` · T9 sitemap · T10
image weight (logo 45 KB → 4 KB) · T11 defer · T12 lazy iframe · T14 `rel="me"` ·
C5 `h3` post titles · C7 OG completeness · C8 thumbnail alt · K1 GoatCounter
events · K2 HTTPS analytics · K3 UTM tagging · K6 entry context · K9 privacy page.

**`c0a998a` — SEO pass 2** (articles): T16 **pagination removed entirely** ·
T18 `CollectionPage` + `BreadcrumbList` · T19 RSS link site-wide · T20
`og-image.png` restored · T21 dead config removed · C13 C14 C15 C16 C19 title,
description, H1, heading order, intro copy (static words 50 → 159) · K11
card-position tracking. K10 correctly obsolete.

---

## Not verifiable from the audit environment

- `api.rss2json.com` is blocked by egress policy — **T17** (how deep the Substack
  feed reaches, and whether older essays are silently absent) needs manual
  confirmation: compare the live archive's card count against the Substack archive.
- `www.blakecody.com` is blocked — confirm it 301s to the apex domain.
- The live Substack embed could not be rendered — confirm its visual fit (UI X3).

## Method

Reproducible from the repo: static HTML parse · headless Chromium render
(Playwright) with the real webfonts served locally and a realistic feed injected ·
live HTTP header, redirect and status probes · DNS · binary inspection of
`chapter-1.pdf` · WCAG contrast computed from measured colour pairs ·
accessible-name computation per form field · claim-by-claim verification of
`privacy.html` against `app.js`.
