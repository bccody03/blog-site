# tools/make-accessible-pdf.py

Renders a change-log HTML report to a **tagged, accessible PDF (PDF/UA-1)**.

    pip install weasyprint
    python3 tools/make-accessible-pdf.py seo/changelog-01-index.html seo/changelog-01-index.pdf

## Why not Chromium

The reports were originally printed with headless Chromium. That produces a
visually identical file with **no accessibility layer at all**: no structure
tree, so a screen reader gets positioned text with no headings to navigate by,
no table row/column semantics, no list structure, no alt text, and no document
language. Assistive technology has to guess reading order from coordinates.

WeasyPrint builds a real structure tree from the HTML semantics, so the tags
come from writing correct markup rather than from annotating the PDF afterwards.

## What the output carries

| | |
|---|---|
| `/MarkInfo /Marked true` | the document declares itself tagged |
| `/StructTreeRoot` | real structure: `H1` → `H2` → `H3`, `P`, `L`/`LI`, `Table`/`TR`/`TH`/`TD`, `Figure`/`Caption` |
| `/Lang` | document language, so a screen reader picks the right voice |
| XMP `dc:title` + `/DisplayDocTitle` | viewers show the document title, not the filename |
| `/Outlines` | bookmarks generated from the heading structure |
| `/Alt` on every `Figure` | image descriptions, taken from each `<img alt>` |

## Keeping it accessible

The tags are only as good as the markup. When editing a report:

- Keep headings in order — never skip a level to get a size.
- Data tables need `<th>` for header cells; don't use tables for layout.
- Every `<img>` needs an `alt` that describes **what the screenshot shows as
  evidence**, not just what it is. "Screenshot of the homepage at 390px; the
  nav ends after Book, with Reflect, About and Substack cut off beyond the
  right edge" is useful. "Mobile screenshot" is not.
- Real lists, not paragraphs starting with dashes.

Verify after generating — `pikepdf` is enough to confirm the structure tree,
language, title and alt coverage are actually present.
