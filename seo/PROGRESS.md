# SEO audit — page-by-page progress

One page per pass. Each pass produces a change log PDF in this folder covering
**technical → content/text → tracking**, then the page is marked done here.

| # | Page | Status | Report | Findings (H/M/L) |
|---|------|--------|--------|------------------|
| 01 | `index.html` — Homepage `/` | ✅ Done — 2026-09-03 | [changelog-01-index.pdf](changelog-01-index.pdf) | 11 / 14 / 7 |
| 02 | `articles.html` — Articles archive | ⬜ Next | — | — |
| 03 | `book.html` — The Book | ⬜ Pending | — | — |
| 04 | `reflect.html` — Reflect with me | ⬜ Pending | — | — |
| 05 | `about.html` — About | ⬜ Pending | — | — |
| 06 | `404.html` — Not found | ⬜ Pending | — | — |

## Site-wide findings (raised on page 01, apply everywhere)

These live in `app.js` / shared `<head>` markup, so fixing them once fixes every
page. Later reports cross-reference these IDs rather than repeating them.

| ID | Finding | Where |
|----|---------|-------|
| T1 | HTTP serves 200 with no redirect to HTTPS | GitHub Pages setting |
| T2 | Post lists render client-side from a third-party API | `app.js` |
| T3 | Feed failure publishes three fabricated articles | `app.js` `SAMPLE_POSTS` |
| T4 | Render-blocking Google Fonts CSS | every page `<head>` |
| T5 | No structured data anywhere on the site | every page `<head>` |
| T8 | Internal links point at `index.html`, not `/` | every page nav |
| T10 | `logo.png` is 600×600 at 30×30 display, 45 KB per page | every page header |
| T11 | Scripts not deferred | every page |
| C5 | Post titles render as `h2`, siblings of the section heading | `app.js` `postCard()` |
| C8 | Post thumbnails ship `alt=""` | `app.js` `postCard()` |
| K1 | GoatCounter records pageviews only — no conversion events | `app.js` |
| K2 | Protocol-relative analytics script URL | every page |
| K3 | Outbound Substack/App Store links carry no UTM tags | `app.js` |

## Not verifiable from the audit environment

Flagged for manual confirmation in a browser:

- `api.rss2json.com` is blocked by egress policy here — confirm the live homepage
  shows real posts, not the "Showing sample posts" fallback (**T3**).
- `www.blakecody.com` is blocked here — confirm it 301s to the apex domain.

## Status legend

⬜ Pending · 🟨 In progress · ✅ Done
