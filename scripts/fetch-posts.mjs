// Fetches the COMPLETE Substack archive (server-side, no CORS limits) and
// writes posts.json for the website to read. Run by .github/workflows/sync-posts.yml.
import { writeFileSync, readFileSync } from "node:fs";

const SUBSTACK = (process.env.SUBSTACK_URL || "https://bccody.substack.com").replace(/\/$/, "");
const LIMIT = 50;
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 " +
    "(KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  Accept: "application/json, text/plain, */*",
};

async function getArchive() {
  const seen = new Set();
  const out = [];
  let offset = 0;
  for (let i = 0; i < 100; i++) {
    const url = `${SUBSTACK}/api/v1/archive?sort=new&offset=${offset}&limit=${LIMIT}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`archive HTTP ${res.status}`);
    const arr = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) break;
    let added = 0;
    for (const p of arr) {
      const link = p.canonical_url || `${SUBSTACK}/p/${p.slug}`;
      if (seen.has(link)) continue;
      seen.add(link);
      out.push({
        title: p.title || "(untitled)",
        link,
        pubDate: p.post_date,
        description: p.description || p.subtitle || "",
        image: p.cover_image || "",
      });
      added++;
    }
    if (added === 0) break;
    offset += arr.length;
  }
  return out;
}

const posts = await getArchive();
if (!posts.length) {
  console.error("No posts returned — leaving posts.json unchanged.");
  process.exit(0);
}
const json = JSON.stringify(posts, null, 2) + "\n";
let prev = "";
try { prev = readFileSync("posts.json", "utf8"); } catch {}
if (prev === json) {
  console.log(`No change (${posts.length} posts).`);
} else {
  writeFileSync("posts.json", json);
  console.log(`Wrote posts.json with ${posts.length} posts.`);
}
