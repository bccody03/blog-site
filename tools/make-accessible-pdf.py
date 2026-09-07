"""Render a change-log HTML report to a tagged, accessible PDF (PDF/UA-1).

Chromium's print-to-PDF produces an untagged document: no structure tree, so a
screen reader gets a soup of positioned text with no headings, no table
semantics and no alt text. WeasyPrint can emit a real structure tree from the
HTML semantics, which is what makes the document navigable.
"""
import sys, os, re
from weasyprint import HTML, CSS

src, out = sys.argv[1], sys.argv[2]
base = os.path.dirname(os.path.abspath(src))
html = open(src, encoding="utf-8").read()

title = re.search(r"<title>(.*?)</title>", html, re.S).group(1).strip()

# Print-specific additions: page numbers in a margin box, and a light touch to
# keep WeasyPrint's flex handling from collapsing the KPI/score strips.
print_css = CSS(string="""
@page {
  size: A4;
  margin: 16mm 14mm 18mm 14mm;
  @bottom-center {
    content: "blakecody.com change log \\2014 page " counter(page) " of " counter(pages);
    font: 8pt -apple-system, "Segoe UI", Roboto, sans-serif;
    color: #8a817c;
  }
}
.kpi { display: table; width: 100%; border-spacing: 4px 0; }
.kpi > div { display: table-cell; width: 20%; }
.score { display: block; }
.score > b { display: block; margin-bottom: 4px; }
figure img { max-width: 100%; }
""")

HTML(string=html, base_url=base).write_pdf(
    out,
    stylesheets=[print_css],
    pdf_variant="pdf/ua-1",   # tagged structure tree, /Lang, DisplayDocTitle
    uncompressed_pdf=False,
)
print(f"wrote {out} — title: {title}")
