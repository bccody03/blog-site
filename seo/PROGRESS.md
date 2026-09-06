# SEO audit — page-by-page progress

One page per pass. Each pass produces a change log PDF in this folder covering
**technical → content/text → tracking**, then the page is marked done here.

| # | Page | Status | Report | Findings (C/H/M-L) |
|---|------|--------|--------|--------------------|
| 01 | `index.html` — Homepage `/` | ✅ Done — 2026-09-03 | [changelog-01-index.pdf](changelog-01-index.pdf) | — / 11 / 21 |
| 02 | `articles.html` — Articles archive | ✅ Done — 2026-09-06 | [changelog-02-articles.pdf](changelog-02-articles.pdf) | 1 / 6 / 9 |
| 03 | `book.html` — The Book | ✅ Done — 2026-09-06 | [changelog-03-book.pdf](changelog-03-book.pdf) | 1 / 4 / 7 |
| 04 | `reflect.html` — Reflect with me | ✅ Done — 2026-09-06 | [changelog-04-reflect.pdf](changelog-04-reflect.pdf) | — / 3 / 9 |
| 05 | `about.html` — About | ⬜ Next | — | — |
| 06 | `404.html` — Not found | ⬜ Pending | — | — |
| 07 | `privacy.html` — Privacy | ⬜ Pending (new — added 2026-09-04) | — | — |

## Implementation status of page-01 site-wide findings

`main` commit `88fdcd1` ("SEO audit pass 1") implemented most of the page-01
report. Each was re-verified against the **live site** during the page-02 pass.

### Fixed and verified ✅

| ID | Fix | Verification |
|----|-----|--------------|
| T1 | Enforce HTTPS | `curl -I http://blakecody.com/…` → 301 → https |
| T3 | Fake sample posts removed | `SAMPLE_POSTS` gated behind `?demo`; honest error state + `feed-error` event |
| T4 | Fonts non-blocking | `rel="preload" as="style"` + onload swap, `<noscript>` fallback |
| T8 | Internal links → `/` | brand, Home, "← Home" eyebrow |
| T9 | Sitemap | accurate `lastmod`, `<priority>` dropped, `privacy.html` added |
| T10 | Image weight | logo 45 KB → 4 KB @ 60×60 with width/height · og-image → JPEG 46 KB · cover 443 → 207 KB · hero 92 → 79 KB |
| T11 | Scripts deferred | `defer` in `<head>` |
| T12 | Lazy subscribe iframe | `loading="lazy"` |
| T14 | `rel="me"` | on Substack nav link |
| C5 | Post titles → `h3` | confirmed in rendered DOM |
| C7 | OG completeness | `og:locale`, `og:image:alt` |
| C8 | Thumbnail alt text | alt = post title, plus width/height |
| K1 | GoatCounter events | `track()` + delegated outbound listener + `feed-error` |
| K2 | HTTPS analytics URL | `https://gc.zgo.at/count.js` |
| K3 | UTM tagging | per-placement `utm_content`, per-page `utm_campaign` |
| K6 | Form source attribution | `entryContext()` → `sessionStorage` |
| K9 | Privacy page | `/privacy.html` live, footer-linked, in sitemap |

### Still open (site-wide)

| ID | Finding | Note |
|----|---------|------|
| T2 | Post lists render client-side from a third-party API | worst on `articles.html`, where the list *is* the page |
| T5 | Structured data exists only on `index.html` | 5-node graph there, 0 on every other page |
| C4 | Every article lives on Substack; domain has nothing to rank | the strategic one — dissolves T16, T2-A, C17 and half of C18 |
| T13 | 10-minute cache ceiling | GitHub Pages limitation, not fixable without a CDN |

## Page-02 findings — closed

`main c0a998a` ("SEO audit pass 2") implemented these; verified during the
page-03 pass.

| ID | Outcome |
|----|---------|
| T16 | ✅ Pagination removed entirely — one crawlable URL for every essay |
| T18 | ✅ `CollectionPage` + `BreadcrumbList` added |
| T19 | ✅ RSS `<link rel=alternate>` now on every page |
| T20 | ✅ `og-image.png` restored |
| T21 | ✅ dead `maxPosts` config removed |
| C13 C14 C15 C16 C19 | ✅ title, description, H1, heading order, intro copy — static words 50 → 159 |
| K11 | ✅ card-position tracking |
| K10 | ⊘ Obsolete — existed only to decide T16, which was solved by deleting pagination |
| T17 | ⬜ Still open — feed depth needs manual verification (rss2json blocked here) |

## Page-04 findings carried forward

| ID | Finding | Severity |
|----|---------|----------|
| C27 C28 | Title and H1 both target "Reflect with me", a coined phrase — the page's real search opportunity (free personal replies) is unaddressed | High |
| T29 | Zero `<label>` elements; all three fields resolve to PLACEHOLDER ONLY (WCAG 3.3.2, 1.3.1) | High |
| T27 | No schema — and unlike book.html, the offer here is real and free, so `Service` + zero-price `Offer` is honest | Medium |
| C29 | No proof the service is real: no example exchange, no reply shown | Medium |
| C31 | Privacy linked only in the footer, not at the point of personal disclosure | Medium |
| T28 | "Free for now" asserted in 5 places with nothing to catch it going stale | Medium |
| K18 | Submissions tracked, attempts not — abandonment rate unknown | Medium |
| T30 T31 | Chips lack `aria-pressed`; success region lacks `role="status"` | Low |

## Page-03 findings carried forward

| ID | Finding | Severity |
|----|---------|----------|
| T22 | `chapter-1.pdf` is public, crawlable, text-extractable and linked from static HTML — the gate does not gate, and the PDF competes with `book.html` in search | Critical |
| T23 | No `Book` schema on the book page | High |
| T24 | No book cover image exists anywhere on the site | Medium |
| K14 | Chapter downloads undercounted; direct PDF hits unmeasurable | High |

## Not verifiable from the audit environment

- `api.rss2json.com` is blocked by egress policy — confirm feed depth (**T17**) by
  comparing the live archive's card count against the Substack archive.
- `www.blakecody.com` is blocked — confirm it 301s to the apex domain.

## Status legend

⬜ Pending · 🟨 In progress · ✅ Done
