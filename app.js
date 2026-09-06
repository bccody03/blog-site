/* ============================================================
   CONFIG — the only line you normally need to touch.
   Paste your Substack address between the quotes, e.g.
     "https://blakecody.substack.com"
   Leave it as-is to see the demo with sample posts.
   ============================================================ */
const CONFIG = {
  substackUrl: "https://bccody.substack.com", // <-- your Substack URL goes here
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

/* ------------------------------------------------------------
   Measurement. GoatCounter only counts pageviews out of the box; these
   helpers turn the things that actually matter (Substack clicks, App Store
   taps, chapter requests, reflections, feed failures) into named events.
   ------------------------------------------------------------ */
function track(name, title) {
  try {
    if (window.goatcounter && window.goatcounter.count) {
      window.goatcounter.count({ path: name, title: title || name, event: true });
    }
  } catch (e) {}
}

// Remember how this visit started (landing page, referrer, query) so form
// submissions can say where they came from.
try {
  if (!sessionStorage.getItem("entry")) {
    sessionStorage.setItem("entry", JSON.stringify({
      landing: location.pathname,
      referrer: document.referrer,
      query: location.search,
    }));
  }
} catch (e) {}
function entryContext() {
  let entry = null;
  try { entry = sessionStorage.getItem("entry"); } catch (e) {}
  return { entry, page: location.pathname };
}

// Every outbound Substack / App Store click, one delegated listener.
document.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (!a || !a.href) return;
  if (a.href.includes("substack.com")) {
    const card = a.closest(".post");
    if (card) {
      // Which card, by position — tells us whether readers grab the newest
      // post or actually browse down the list.
      const idx = [...card.parentElement.children].indexOf(card) + 1;
      track("click-substack-card-" + idx, "Substack click, card " + idx);
    } else {
      track("click-substack-" + (a.id || "other"), "Substack click");
    }
  } else if (a.href.includes("apps.apple.com")) {
    track("click-appstore", "App Store click");
  }
});

// Tag outbound Substack links so Substack's own stats credit this site, with
// a distinct utm_content per placement (nav, footer, book CTA, post card).
const UTM = "utm_source=blakecody.com&utm_medium=referral";
function withUtm(url, campaign, content) {
  const sep = url.includes("?") ? "&" : "?";
  return url + sep + UTM + "&utm_campaign=" + campaign + (content ? "&utm_content=" + content : "");
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* Intro splash: name pops in, a cross + box draw around it, shine, then the
   pieces break away. Plays once per browsing session — refreshing or coming
   back to Home in the same visit skips it. (Also skipped for reduced motion.) */
const intro = document.getElementById("intro");
if (intro) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let seen = false;
  try { seen = sessionStorage.getItem("intro-seen") === "1"; } catch (e) {}
  if (reduce || seen) {
    intro.remove();
  } else {
    try { sessionStorage.setItem("intro-seen", "1"); } catch (e) {}
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

  const t0 = Date.now();

  // 1) Four backdrop quadrants. At the end each peels off into its OWN corner
  //    (top-left piece to the top-left of the screen, and so on). Once the name
  //    box is measured they get re-cut so the middle box is its own piece.
  // All pieces share the identical full-screen gradient, so they OVERLAP by a
  // little (eps) — otherwise anti-aliasing at the clip edges lets a hairline of
  // the page behind peek through as a faint seam line.
  const eps = 0.6;
  const corners = [
    { clip: `polygon(0 0, ${50 + eps}% 0, ${50 + eps}% ${50 + eps}%, 0 ${50 + eps}%)`, dx: -45, dy: -45 }, // top-left
    { clip: `polygon(${50 - eps}% 0, 100% 0, 100% ${50 + eps}%, ${50 - eps}% ${50 + eps}%)`, dx: 45, dy: -45 }, // top-right
    { clip: `polygon(0 ${50 - eps}%, ${50 + eps}% ${50 - eps}%, ${50 + eps}% 100%, 0 100%)`, dx: -45, dy: 45 }, // bottom-left
    { clip: `polygon(${50 - eps}% ${50 - eps}%, 100% ${50 - eps}%, 100% 100%, ${50 - eps}% 100%)`, dx: 45, dy: 45 }, // bottom-right
  ];
  const cornerEls = [];
  for (const cfg of corners) {
    const el = document.createElement("div");
    el.className = "corner";
    el.style.clipPath = cfg.clip;
    el.style.setProperty("--dx", cfg.dx + "vw");
    el.style.setProperty("--dy", cfg.dy + "vh");
    intro.appendChild(el);
    cornerEls.push(el);
  }

  // 2) The name, centered on top. Pops in, then jumps out at the viewer.
  const center = document.createElement("div");
  center.className = "intro-center";
  const name = document.createElement("span");
  name.className = "intro-name";
  name.textContent = "Blake Cody";
  center.appendChild(name);
  intro.appendChild(center);

  // 3) A perfect cross that splits the page into four boxes — except its four
  //    arms stop at a box traced around the name. The box is measured from the
  //    name's real on-screen size so it always hugs it. Timeline (seconds),
  //    compressed to ~2s total so it never competes with LCP:
  //    0–0.2 name pops · 0.2–0.9 lines draw (arms, then the box) ·
  //    0.9–1.6 everything shines · 1.6 corners peel + name jumps out.
  const start = () => {
    const rect = name.getBoundingClientRect();
    const padX = 32;
    const padY = 24;
    const l = Math.max(5, ((rect.left - padX) / W) * 100);
    const r = Math.min(95, ((rect.right + padX) / W) * 100);
    const t = Math.max(8, ((rect.top - padY) / H) * 100);
    const b = Math.min(92, ((rect.bottom + padY) / H) * 100);

    // Re-cut the backdrop so the pieces match the drawing: each corner piece is
    // its quadrant MINUS the name box, and the box becomes its own piece that
    // flies straight at the viewer. (Same gradient everywhere, so the re-cut is
    // invisible until the break.)
    const poly = (pts) => "polygon(" + pts.map((p) => p[0].toFixed(2) + "% " + p[1].toFixed(2) + "%").join(", ") + ")";
    // Same eps overlap as at creation, so no hairline seams show between pieces.
    const e = eps;
    const notched = [
      [[0, 0], [50 + e, 0], [50 + e, t + e], [l + e, t + e], [l + e, 50 + e], [0, 50 + e]], // top-left
      [[50 - e, 0], [100, 0], [100, 50 + e], [r - e, 50 + e], [r - e, t + e], [50 - e, t + e]], // top-right
      [[0, 50 - e], [l + e, 50 - e], [l + e, b - e], [50 + e, b - e], [50 + e, 100], [0, 100]], // bottom-left
      [[100, 50 - e], [100, 100], [50 - e, 100], [50 - e, b - e], [r - e, b - e], [r - e, 50 - e]], // bottom-right
    ];
    notched.forEach((pts, i) => { cornerEls[i].style.clipPath = poly(pts); });
    const boxEl = document.createElement("div");
    boxEl.className = "boxpiece";
    boxEl.style.clipPath = poly([[l - e, t - e], [r + e, t - e], [r + e, b + e], [l - e, b + e]]);
    // Its exit is timed in CSS from element creation, so compensate for the
    // measuring delay to fire at the same absolute moment as the corners (1.6s).
    const elapsed = (Date.now() - t0) / 1000;
    boxEl.style.animationDelay = Math.max(0, 1.6 - elapsed).toFixed(2) + "s";
    intro.appendChild(boxEl);

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "cracks");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");

    const pxLen = (pts) => {
      let sl = 0;
      for (let i = 1; i < pts.length; i++) {
        sl += Math.hypot((pts[i][0] - pts[i - 1][0]) * (W / 100), (pts[i][1] - pts[i - 1][1]) * (H / 100));
      }
      return sl;
    };
    const addLine = (pts, drawDur, drawDelay) => {
      const pl = document.createElementNS(NS, "polyline");
      pl.setAttribute("points", pts.map((p) => p[0].toFixed(2) + "," + p[1].toFixed(2)).join(" "));
      const sl = pxLen(pts);
      pl.style.strokeDasharray = sl.toFixed(1);
      pl.style.strokeDashoffset = sl.toFixed(1);
      // The three values map to: draw / shine / fade.
      pl.style.animationDuration = drawDur + "s, 0.7s, 0.2s";
      pl.style.animationDelay = drawDelay + "s, 0.7s, 1.4s";
      svg.appendChild(pl);
    };
    // Cross arms, drawing in from the edges to the box (0.4s)...
    addLine([[50, 0], [50, t]], 0.4, 0);
    addLine([[50, 100], [50, b]], 0.4, 0);
    addLine([[0, 50], [l, 50]], 0.4, 0);
    addLine([[100, 50], [r, 50]], 0.4, 0);
    // ...then the box traces around the name (0.3s), starting where the left
    // arm lands and looping the whole way round.
    addLine([[l, 50], [l, t], [r, t], [r, b], [l, b], [l, 50]], 0.3, 0.4);
    intro.appendChild(svg);
  };
  // Wait for the name to pop in (and the webfont to settle) before measuring.
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const minDelay = new Promise((res) => setTimeout(res, 200));
  const fontCap = new Promise((res) => setTimeout(res, 400)); // don't stall if fonts hang
  Promise.all([minDelay, Promise.race([fontsReady, fontCap])]).then(start);

  setTimeout(() => intro.remove(), 2100);
}

// Point the Substack links (nav + book CTA) at the configured URL.
if (CONFIG.substackUrl) {
  els.substackLinks.forEach((a) => {
    if (!a) return;
    a.href = withUtm(CONFIG.substackUrl, "site", a.id || "link");
  });
}

// The default hero (hero-bg.jpg) is declared in styles.css and preloaded from
// index.html so it starts downloading before this script even runs. Only
// touch it here if CONFIG points somewhere else.
if (CONFIG.coverImage && CONFIG.coverImage !== "hero-bg.jpg") setCover(CONFIG.coverImage);

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
          body: JSON.stringify({ email, request: "Chapter 1 PDF", submittedAt: new Date().toISOString(), ...entryContext() }),
        });
        if (!res.ok) throw new Error("submit failed");
      } else {
        console.info("[demo mode] chapter request:", email);
      }
      track("chapter-request", "Chapter 1 requested");
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
      ...entryContext(),
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
      track("reflect-submit-" + (reflectCatInput && reflectCatInput.value || "none"), "Reflection sent");
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

// How many posts to show, from the list's data-limit ("0" or missing = all).
// Lets one app.js serve home (latest 3) + the full archive.
function postLimit() {
  const n = parseInt((els.list && els.list.getAttribute("data-limit")) || "0", 10);
  return n > 0 ? n : Infinity;
}

// Build the HTML for a single post card.
function postCard(p) {
  const img = p.image || firstImage(p.content);
  const title = escapeHtml(p.title);
  const thumb = img
    ? `<div class="post-thumb"><img src="${img}" alt="${title}" loading="lazy" width="480" height="320" /></div>`
    : "";
  const campaign = (els.list && els.list.getAttribute("data-campaign")) || "home-latest";
  const href = withUtm(p.link, campaign, "card");
  return `
      <a class="post${img ? " has-thumb" : ""}" href="${href}" target="_blank" rel="noopener">
        ${thumb}
        <div class="post-body">
          <div class="post-meta">${fmtDate(p.pubDate)}</div>
          <h3 class="post-title">${title}</h3>
          <p class="post-excerpt">${excerpt(p.content || p.description, 110)}</p>
          <span class="post-more">Read on Substack →</span>
        </div>
      </a>`;
}

let allPosts = [];

function renderList(posts) {
  els.list.innerHTML = posts.slice(0, postLimit()).map(postCard).join("");
}

/* Topic chips on the archive. Built from whatever categories the posts carry
   in the feed; if they carry none, the row stays empty and hidden. Filtering
   is client-side only — it changes what's shown, not the URL. */
function renderFilters(posts) {
  const box = document.getElementById("post-filters");
  if (!box) return;
  const counts = new Map();
  posts.forEach((p) => (p.categories || []).forEach((c) => counts.set(c, (counts.get(c) || 0) + 1)));
  const cats = [...counts.keys()].sort((a, b) => counts.get(b) - counts.get(a));
  if (cats.length < 2) { box.innerHTML = ""; return; }
  box.innerHTML =
    `<button type="button" class="cat active" data-cat="">All</button>` +
    cats.map((c) => `<button type="button" class="cat" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("");
  box.addEventListener("click", (e) => {
    const chip = e.target.closest(".cat");
    if (!chip) return;
    box.querySelectorAll(".cat").forEach((c) => c.classList.toggle("active", c === chip));
    const cat = chip.dataset.cat;
    renderList(cat ? allPosts.filter((p) => (p.categories || []).includes(cat)) : allPosts);
    track("archive-filter-" + (cat || "all"), "Archive filter: " + (cat || "all"));
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
  renderFilters(posts);
  renderList(posts);
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
      categories: Array.from(item.querySelectorAll("category")).map((c) => c.textContent.trim()).filter(Boolean),
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
        categories: Array.isArray(it.categories) ? it.categories.filter(Boolean) : [],
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

// Sample posts for local development only. They are never shown to real
// visitors: add ?demo to the URL to see them.
const SAMPLE_POSTS = [
  {
    title: "Why I Started Writing in Public",
    link: "#",
    pubDate: "2026-06-10",
    categories: ["Intention"],
    description:
      "I kept a private notebook for years. Here's what changed when I started putting the messy drafts out where people could actually read them — and why it made the thinking sharper.",
  },
  {
    title: "The Case for Doing Less, Better",
    link: "#",
    pubDate: "2026-05-22",
    categories: ["Life", "Intention"],
    description:
      "Most of my best work came from the weeks I said no to almost everything. A short argument for narrowing your focus until it almost feels uncomfortable.",
  },
  {
    title: "Notes on Building Small Things",
    link: "#",
    pubDate: "2026-05-01",
    categories: ["Life"],
    description:
      "A scaffold you can actually look at beats a perfect plan you never ship. Some scattered thoughts on starting tiny and letting the shape reveal itself.",
  },
];

async function init() {
  // Only the Home and Writing pages list posts; the About page wants the
  // Substack avatar. Other pages (Book, Reflect) need no feed at all.
  if (!els.list && !els.avatar) return;
  const demo = new URLSearchParams(location.search).has("demo");
  if (!CONFIG.substackUrl || demo) {
    setState("Demo mode — showing sample posts.");
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
    track("feed-error", "Substack feed failed");
    // Never render placeholder articles to real visitors — point them at
    // Substack instead, and the feed-error event above says it happened.
    if (els.state) {
      els.state.innerHTML = `Latest posts are on <a href="${withUtm(CONFIG.substackUrl, "site", "feed-error")}" target="_blank" rel="noopener">Substack →</a>`;
      els.state.classList.remove("hidden");
      els.state.classList.remove("error");
    }
  }
}

init();
