// Fetches the Substack RSS feed server-side and writes posts.json for the site.
// Run by .github/workflows/sync-posts.yml. Substack's archive API blocks
// datacenter IPs (Cloudflare), but the RSS feed is reachable; it carries the
// most recent ~20 posts. Fails soft (exit 0) so it never spams failure emails.
import { writeFileSync, readFileSync } from "node:fs";

const SUBSTACK = (process.env.SUBSTACK_URL || "https://bccody.substack.com").replace(/\/$/, "");
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 " +
    "(KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
};

function pick(block, tag) {
  const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!m) return "";
  return m[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

function parseFeed(xml) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  return items.map((it) => {
    let image = (it.match(/<enclosure[^>]*url="([^"]+)"/) || [])[1] || "";
    if (!image) {
      const content = pick(it, "content:encoded");
      image = (content.match(/<img[^>]+src="([^"]+)"/) || [])[1] || "";
    }
    return {
      title: pick(it, "title"),
      link: pick(it, "link"),
      pubDate: pick(it, "pubDate"),
      description: pick(it, "description"),
      image,
    };
  });
}

try {
  const res = await fetch(`${SUBSTACK}/feed`, { headers: HEADERS });
  if (!res.ok) {
    console.error(`Feed HTTP ${res.status} — leaving posts.json unchanged.`);
    process.exit(0);
  }
  const posts = parseFeed(await res.text());
  if (!posts.length) {
    console.error("No posts parsed — leaving posts.json unchanged.");
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
} catch (err) {
  console.error("Sync failed (non-fatal):", err.message);
  process.exit(0);
}
