/* ============================================================
   CONFIG — the only line you normally need to touch.
   Paste your Substack address between the quotes, e.g.
     "https://blakecody.substack.com"
   Leave it as-is to see the demo with sample posts.
   ============================================================ */
const CONFIG = {
  substackUrl: "https://bccody.substack.com", // <-- your Substack URL goes here
  maxPosts: 12,
  // Free rss2json.com API key. Substack blocks bots/proxies, so rss2json is the
  // one relay that reliably reaches your feed. Without a key it's capped at ~10
  // posts; paste a free key here to load your whole feed.
  rssApiKey: "twjzn4hogufejzoxy2wgo6iajtvyqtycosvavtqv",
  // Front cover image. Leave "" to auto-use your latest post's cover,
  // or drop your own file in this folder, e.g. "cover.jpg".
  coverImage: "hero-bg.jpg",
  // Where "Reflect with me" submissions go. Paste a form endpoint that
  // emails you the message — easiest is Formspree: create a free form at
  // formspree.io and paste its URL here, e.g.
  //   "https://formspree.io/f/abcdwxyz"
  // (A Make webhook works too.) Leave "" to test in demo mode.
  coachWebhook: "https://formspree.io/f/xaqgwvwe",
  // Dedicated Formspree form for Book-page chapter requests, kept separate
  // from the Reflect inbox and from the Substack newsletter. Create a second
  // form at formspree.io and paste its URL here, e.g. "https://formspree.io/f/abcdwxyz".
  chapterWebhook: "https://formspree.io/f/mqevkrpa",
};

/* ------------------------------------------------------------
   Below here is the machinery. You shouldn't need to edit it.
   ------------------------------------------------------------ */

const els = {
  list: document.getElementById("post-list"),
  state: document.getElementById("state"),
  year: document.getElementById("year"),
  avatar: document.getElementById("avatar"),
  coverImg: document.getElementById("cover-img"),
  coverInner: document.getElementById("cover-inner"),
  header: document.getElementById("site-header"),
  subscribeFrames: document.querySelectorAll(".sub-frame"),
  revealBtn: document.getElementById("reveal-btn"),
  excerptGate: document.getElementById("excerpt-gate"),
  excerptMore: document.getElementById("excerpt-more"),
  substackLinks: [
    ...document.querySelectorAll(".js-substack"),
    document.getElementById("substack-link"),
    document.getElementById("substack-link-footer"),
    document.getElementById("book-cta"),
  ],
};

els.year.textContent = new Date().getFullYear();

/* Intro splash: the name pops in, cracks draw in from the sides after ~1s, then
   it shatters like glass to reveal the site. Plays on every load (skipped only
   for visitors who prefer reduced motion). */
const intro = document.getElementById("intro");
if (intro) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    intro.remove();
  } else {
    intro.classList.add("play");
    try {
      buildIntro(intro);
    } catch (e) {
      console.error("intro failed:", e);
      intro.remove(); // never let a hiccup leave the overlay stuck
    }
  }
}

function buildIntro(intro) {
  const NS = "http://www.w3.org/2000/svg";
  const W = window.innerWidth || 1000;
  const H = window.innerHeight || 700;

  // 1) Two clean cracks: one roughly horizontal (side to side) and one roughly
  //    vertical (top to bottom), crossing near the middle so the screen breaks
  //    into four pieces. A little jitter keeps them from being perfectly rigid.
  const jitter = () => (Math.random() - 0.5) * 10;
  const hy = 40 + Math.random() * 20; // horizontal crack's height band (40–60%)
  const vx = 40 + Math.random() * 20; // vertical crack's x band
  const lines = [
    [[0, hy + jitter()], [100, hy + jitter()]], // left edge -> right edge
    [[vx + jitter(), 0], [vx + jitter(), 100]], // top edge -> bottom edge
  ];

  // 2) Carve the full-screen rectangle into the regions those lines create, by
  //    splitting every polygon along each line (a line arrangement).
  const splitConvex = (poly, L) => {
    const a = L[1][1] - L[0][1];
    const b = -(L[1][0] - L[0][0]);
    const c = -(a * L[0][0] + b * L[0][1]);
    const pos = [];
    const neg = [];
    for (let i = 0; i < poly.length; i++) {
      const cur = poly[i];
      const nxt = poly[(i + 1) % poly.length];
      const dc = a * cur[0] + b * cur[1] + c;
      const dn = a * nxt[0] + b * nxt[1] + c;
      if (dc >= 0) pos.push(cur);
      if (dc <= 0) neg.push(cur);
      if ((dc > 0 && dn < 0) || (dc < 0 && dn > 0)) {
        const t = dc / (dc - dn);
        const ip = [cur[0] + t * (nxt[0] - cur[0]), cur[1] + t * (nxt[1] - cur[1])];
        pos.push(ip);
        neg.push(ip);
      }
    }
    return [pos.length >= 3 ? pos : null, neg.length >= 3 ? neg : null];
  };
  let regions = [[[0, 0], [100, 0], [100, 100], [0, 100]]];
  for (const L of lines) {
    const next = [];
    for (const poly of regions) {
      const [p, n] = splitConvex(poly, L);
      if (p) next.push(p);
      if (n) next.push(n);
    }
    regions = next;
  }

  // 3) One shard per region — together they form the whole screen; each flies
  //    outward from the center so it splits apart exactly along the cracks.
  const frag = document.createDocumentFragment();
  let maxEnd = 0;
  for (const region of regions) {
    const shard = document.createElement("div");
    shard.className = "tile";
    shard.style.clipPath =
      "polygon(" + region.map((p) => p[0].toFixed(2) + "% " + p[1].toFixed(2) + "%").join(", ") + ")";
    let cx = 0;
    let cy = 0;
    for (const p of region) {
      cx += p[0];
      cy += p[1];
    }
    cx /= region.length;
    cy /= region.length;
    let dirx = cx - 50;
    let diry = cy - 50;
    let dist = Math.hypot(dirx, diry);
    if (dist < 1) {
      const ang = Math.random() * Math.PI * 2;
      dirx = Math.cos(ang);
      diry = Math.sin(ang);
      dist = 1;
    }
    const fly = 42 + Math.random() * 38;
    shard.style.setProperty("--dx", ((dirx / dist) * fly).toFixed(1) + "vw");
    shard.style.setProperty("--dy", ((diry / dist) * fly).toFixed(1) + "vh");
    shard.style.setProperty("--dr", (Math.random() * 70 - 35).toFixed(0) + "deg");
    const delay = 1.6 + Math.random() * 0.16;
    shard.style.animationDelay = delay.toFixed(2) + "s";
    maxEnd = Math.max(maxEnd, delay + 1.3);
    const name = document.createElement("span");
    name.className = "intro-name";
    name.textContent = "Blake Cody";
    shard.appendChild(name);
    frag.appendChild(shard);
  }
  intro.appendChild(frag);

  // 4) Draw the solid crack lines along those same boundaries. Added ~1s in so
  //    the name is clean at first; each line is a single solid stroke.
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "cracks");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");
  for (const [p, q] of lines) {
    const pl = document.createElementNS(NS, "polyline");
    pl.setAttribute("points", p[0].toFixed(1) + "," + p[1].toFixed(1) + " " + q[0].toFixed(1) + "," + q[1].toFixed(1));
    const sl = Math.hypot((q[0] - p[0]) * (W / 100), (q[1] - p[1]) * (H / 100));
    pl.style.strokeDasharray = sl.toFixed(1);
    pl.style.strokeDashoffset = sl.toFixed(1);
    svg.appendChild(pl);
  }
  setTimeout(() => intro.appendChild(svg), 1000);
  // Clear the container's backdrop just before the break so the pieces reveal the site.
  setTimeout(() => { intro.style.background = "transparent"; }, 1550);
  setTimeout(() => intro.remove(), (maxEnd + 0.25) * 1000);
}

// Point the Substack links (nav + book CTA) at the configured URL.
if (CONFIG.substackUrl) {
  els.substackLinks.forEach((a) => a && (a.href = CONFIG.substackUrl));
}

// If a cover image is set in CONFIG, use it right away.
if (CONFIG.coverImage) setCover(CONFIG.coverImage);

/* Sneak-peek lead magnet: embed the real Substack signup, and let the
   reader unlock the rest of the chapter once they've subscribed. The
   unlock is remembered so they don't have to do it again. */
if (CONFIG.substackUrl && els.subscribeFrames.length) {
  const embedSrc = CONFIG.substackUrl.replace(/\/$/, "") + "/embed";
  els.subscribeFrames.forEach((frame) => { frame.src = embedSrc; });
}
/* Book page lead magnet: capture the reader's email to a dedicated Formspree
   (separate from Reflect + the newsletter), then deliver the chapter PDF. */
const chapterForm = document.getElementById("chapter-form");
if (chapterForm) {
  chapterForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = chapterForm.querySelector(".chapter-submit");
    const email = document.getElementById("chapter-email").value.trim();
    btn.disabled = true;
    btn.textContent = "Sending…";
    try {
      if (CONFIG.chapterWebhook) {
        const res = await fetch(CONFIG.chapterWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ email, request: "Chapter 1 PDF", submittedAt: new Date().toISOString() }),
        });
        if (!res.ok) throw new Error("submit failed");
      } else {
        console.info("[demo mode] chapter request:", email);
      }
      const gate = document.getElementById("excerpt-gate");
      const done = document.getElementById("chapter-done");
      if (gate) gate.hidden = true;
      if (done) {
        done.hidden = false;
        done.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      // Hand them the PDF straight away
      const a = document.createElement("a");
      a.href = "chapter-1.pdf";
      a.download = "Aligned-Chapter-1.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.textContent = "Send me the chapter →";
      alert("Something went wrong sending that. Mind trying again in a moment?");
    }
  });
}

/* "Reflect with me" — send the reader's answer to Blake. In production
   this POSTs to a Make webhook (which can drop it in Notion + email you).
   With no webhook set it runs in demo mode so the flow is still testable. */
const reflectForm = document.getElementById("reflect-form");
const reflectThanks = document.getElementById("reflect-thanks");
const reflectCats = document.getElementById("reflect-cats");
const reflectCatInput = document.getElementById("reflect-cat");

// Topic chips — click to pick (or unpick) a category.
if (reflectCats) {
  reflectCats.addEventListener("click", (e) => {
    const chip = e.target.closest(".cat");
    if (!chip) return;
    const isActive = chip.classList.contains("active");
    reflectCats.querySelectorAll(".cat").forEach((c) => c.classList.remove("active"));
    if (!isActive) {
      chip.classList.add("active");
      reflectCatInput.value = chip.dataset.cat;
    } else {
      reflectCatInput.value = "";
    }
  });
}

if (reflectForm) {
  reflectForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = reflectForm.querySelector(".reflect-submit");
    btn.disabled = true;
    btn.textContent = "Sending…";

    const payload = {
      category: (reflectCatInput && reflectCatInput.value) || "Unspecified",
      message: document.getElementById("reflect-answer").value.trim(),
      name: document.getElementById("reflect-name").value.trim(),
      email: document.getElementById("reflect-email").value.trim(),
      submittedAt: new Date().toISOString(),
    };

    try {
      if (CONFIG.coachWebhook) {
        const res = await fetch(CONFIG.coachWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("submit failed");
      } else {
        console.info("[demo mode] Reflection captured (no webhook set):", payload);
      }
      reflectForm.hidden = true;
      reflectThanks.hidden = false;
      reflectThanks.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.textContent = "Send it to Blake →";
      alert("Something went wrong sending that. Mind trying again in a moment?");
    }
  });
}

function setCover(url) {
  if (url && els.coverImg) els.coverImg.style.backgroundImage = `url("${url}")`;
}

/* Scroll choreography: fade + lift the cover text as you scroll down,
   and swap the header from transparent to solid once past the cover.
   Pages without a cover (e.g. the Writing archive) keep a solid header. */
const hasCover = !!document.querySelector(".cover");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (hasCover) {
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    if (!prefersReducedMotion && els.coverInner) {
      const p = Math.min(y / (vh * 0.8), 1);
      els.coverInner.style.opacity = String(1 - p);
      els.coverInner.style.transform = `translateY(${y * 0.25}px)`;
    }
    els.header.classList.toggle("scrolled", y > vh * 0.6);
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  });
  onScroll();
} else if (els.header) {
  els.header.classList.add("scrolled");
}

function fmtDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function excerpt(html, max = 180) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html || "";
  const text = (tmp.textContent || "").replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

// Pull the first image out of a post's HTML to use as its preview.
function firstImage(html) {
  const m = (html || "").match(/<img[^>]+src="([^"]+)"/i);
  return m ? sizeImage(m[1]) : "";
}

// Substack serves resizable image URLs (…,w_1456,…). Ask for a smaller
// version so thumbnails load fast instead of pulling the full-size cover.
function sizeImage(url, width = 480) {
  return url.replace(/,w_\d+,/, `,w_${width},`);
}

// A stable key for a Substack image (its underlying S3 filename). Lets us tell
// when a post's "cover" is really just the publication's profile picture, which
// Substack uses as a filler enclosure for posts that have no image of their own.
function imgKey(u) {
  if (!u) return "";
  let s = u;
  try { s = decodeURIComponent(u); } catch (e) {}
  const m = s.match(/images\/([^/?#]+)$/);
  return m ? m[1] : s;
}

// How many posts to show: from the list's data-limit ("0" = all),
// falling back to CONFIG.maxPosts. Lets one app.js serve home + archive.
function postLimit() {
  const dl = els.list && els.list.getAttribute("data-limit");
  if (dl === null || dl === undefined) return CONFIG.maxPosts;
  const n = parseInt(dl, 10);
  return n > 0 ? n : Infinity;
}

// Build the HTML for a single post card.
function postCard(p) {
  const img = p.image || firstImage(p.content);
  const thumb = img
    ? `<div class="post-thumb"><img src="${img}" alt="" loading="lazy" /></div>`
    : "";
  return `
      <a class="post${img ? " has-thumb" : ""}" href="${p.link}" target="_blank" rel="noopener">
        ${thumb}
        <div class="post-body">
          <div class="post-meta">${fmtDate(p.pubDate)}</div>
          <h2 class="post-title">${p.title}</h2>
          <p class="post-excerpt">${excerpt(p.content || p.description, 110)}</p>
          <span class="post-more">Read on Substack →</span>
        </div>
      </a>`;
}

let allPosts = [];

// Posts per page when the list opts into pagination (data-page-size="7").
// Returns 0 when pagination is off (e.g. the home page's "latest 3").
function pageSize() {
  const ps = els.list && els.list.getAttribute("data-page-size");
  const n = ps ? parseInt(ps, 10) : 0;
  return n > 0 ? n : 0;
}

function renderPage(page) {
  const size = pageSize();
  const total = Math.max(1, Math.ceil(allPosts.length / size));
  const cur = Math.min(Math.max(1, page), total);
  const start = (cur - 1) * size;
  els.list.innerHTML = allPosts.slice(start, start + size).map(postCard).join("");
  renderPagination(total, cur);
  if (page !== 1) {
    const top = els.list.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top, behavior: "smooth" });
  }
}

function renderPagination(total, cur) {
  const nav = document.getElementById("pagination");
  if (!nav) return;
  if (total <= 1) { nav.innerHTML = ""; return; }
  let html = `<button class="page-btn page-prev" ${cur === 1 ? "disabled" : ""} data-page="${cur - 1}" aria-label="Previous page">←</button>`;
  for (let i = 1; i <= total; i++) {
    html += `<button class="page-btn page-num${i === cur ? " active" : ""}" data-page="${i}" aria-label="Page ${i}"${i === cur ? ' aria-current="page"' : ""}>${i}</button>`;
  }
  html += `<button class="page-btn page-next" ${cur === total ? "disabled" : ""} data-page="${cur + 1}" aria-label="Next page">→</button>`;
  nav.innerHTML = html;
}

const paginationEl = document.getElementById("pagination");
if (paginationEl) {
  paginationEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".page-btn");
    if (!btn || btn.disabled) return;
    const p = parseInt(btn.getAttribute("data-page"), 10);
    if (!Number.isNaN(p)) renderPage(p);
  });
}

function render(posts) {
  if (!els.list) return; // pages without a post list (Book, Reflect, About)
  if (!posts.length) {
    setState("Nothing here yet — your latest posts will show up automatically.");
    return;
  }
  els.state.classList.add("hidden");
  allPosts = posts;
  if (pageSize() > 0) {
    renderPage(1);
  } else {
    els.list.innerHTML = posts.slice(0, postLimit()).map(postCard).join("");
  }
}

function setState(msg, isError = false) {
  if (!els.state) return; // no status element on pages without a post list
  els.state.textContent = msg;
  els.state.classList.remove("hidden");
  els.state.classList.toggle("error", isError);
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("http " + res.status);
  return res.text();
}

// Parse a Substack RSS XML string into our post shape.
function parseFeedXml(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("xml parse error");
  const chImg = doc.querySelector("channel > image > url");
  const profileKey = imgKey(chImg ? chImg.textContent.trim() : "");
  const items = Array.from(doc.querySelectorAll("item")).map((item) => {
    const text = (sel) => {
      const el = item.querySelector(sel);
      return el ? el.textContent.trim() : "";
    };
    const encEl = item.getElementsByTagName("content:encoded")[0];
    const content = encEl ? encEl.textContent : "";
    let image = firstImage(content);
    const encl = item.querySelector("enclosure");
    const enclUrl = encl && encl.getAttribute("url");
    // Use the enclosure only if it isn't just the publication's profile picture.
    if (!image && enclUrl && imgKey(enclUrl) !== profileKey) image = sizeImage(enclUrl);
    return {
      title: text("title"),
      link: text("link"),
      pubDate: text("pubDate"),
      description: text("description"),
      content,
      image,
    };
  });
  return { image: chImg ? chImg.textContent.trim() : "", posts: items };
}

// Substack endpoints have no CORS headers, so we route requests through a
// public CORS proxy. Try a couple of live proxies (fresh, no heavy caching).
async function fetchViaProxy(targetUrl) {
  const enc = encodeURIComponent(targetUrl);
  const bust = "&_=" + Date.now();
  const proxies = [
    "https://corsproxy.io/?url=" + enc + bust,
    "https://api.allorigins.win/raw?url=" + enc + bust,
  ];
  let lastErr;
  for (const proxy of proxies) {
    try {
      return await fetchText(proxy);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("all proxies failed");
}

function mapRss2json(data) {
  const profileKey = imgKey((data.feed && data.feed.image) || "");
  return {
    image: (data.feed && data.feed.image) || "",
    posts: data.items.map((it) => {
      let image = (it.enclosure && it.enclosure.link) || "";
      // Skip the filler profile picture; leave real covers.
      image = image && imgKey(image) !== profileKey ? sizeImage(image) : "";
      return {
        title: it.title,
        link: it.link,
        pubDate: it.pubDate,
        content: it.content,
        description: it.description,
        image,
      };
    }),
  };
}

// Substack blocks datacenter IPs (Cloudflare), so the archive API and even the
// raw feed return HTTP 403 to servers and most proxies. rss2json is the one
// relay that reliably reaches Substack: with a (free) API key it returns the
// whole feed; without one it's capped at ~10, so we also try live CORS proxies.
async function loadFromSubstack(url) {
  const feed = url.replace(/\/$/, "") + "/feed";
  const enc = encodeURIComponent(feed);

  // 1) rss2json WITH an API key — reliable, returns the full feed.
  if (CONFIG.rssApiKey) {
    try {
      const api =
        "https://api.rss2json.com/v1/api.json?rss_url=" + enc +
        "&api_key=" + encodeURIComponent(CONFIG.rssApiKey) + "&count=50";
      const data = await (await fetch(api)).json();
      if (data.status === "ok" && data.items && data.items.length) return mapRss2json(data);
    } catch (e) {
      /* fall through */
    }
  }

  // 2) Live CORS proxies + XML parse (full feed when they're reachable).
  try {
    const xml = await fetchViaProxy(feed);
    const parsed = parseFeedXml(xml);
    if (parsed.posts.length) return parsed;
  } catch (e) {
    /* fall through */
  }

  // 3) Last resort: rss2json without a key (capped at ~10 items).
  const res = await fetch("https://api.rss2json.com/v1/api.json?rss_url=" + enc);
  if (!res.ok) throw new Error("feed request failed");
  const data = await res.json();
  if (data.status !== "ok") throw new Error(data.message || "feed error");
  return mapRss2json(data);
}

const SAMPLE_POSTS = [
  {
    title: "Why I Started Writing in Public",
    link: "#",
    pubDate: "2026-06-10",
    description:
      "I kept a private notebook for years. Here's what changed when I started putting the messy drafts out where people could actually read them — and why it made the thinking sharper.",
  },
  {
    title: "The Case for Doing Less, Better",
    link: "#",
    pubDate: "2026-05-22",
    description:
      "Most of my best work came from the weeks I said no to almost everything. A short argument for narrowing your focus until it almost feels uncomfortable.",
  },
  {
    title: "Notes on Building Small Things",
    link: "#",
    pubDate: "2026-05-01",
    description:
      "A scaffold you can actually look at beats a perfect plan you never ship. Some scattered thoughts on starting tiny and letting the shape reveal itself.",
  },
];

async function init() {
  // Only the Home and Writing pages list posts; the About page wants the
  // Substack avatar. Other pages (Book, Reflect) need no feed at all.
  if (!els.list && !els.avatar) return;
  if (!CONFIG.substackUrl) {
    setState("Demo mode — add your Substack URL in app.js to go live.");
    render(SAMPLE_POSTS);
    els.state.classList.remove("hidden"); // keep the demo note visible
    return;
  }
  try {
    setState("Loading the latest…");
    const { posts, image } = await loadFromSubstack(CONFIG.substackUrl);
    if (image && els.avatar) {
      els.avatar.src = image;
      els.avatar.parentElement.classList.remove("hidden");
    }
    // If no cover was set in CONFIG, use the newest post's cover image
    // at full size so the front cover stays crisp.
    if (!CONFIG.coverImage && posts.length) {
      const hero = firstImage(posts[0].content);
      if (hero) setCover(sizeImage(hero, 1600));
    }
    render(posts);
  } catch (err) {
    console.error(err);
    setState("Couldn't reach the Substack feed right now. Showing sample posts.", true);
    render(SAMPLE_POSTS);
  }
}

init();
