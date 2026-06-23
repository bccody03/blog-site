/* ============================================================
   CONFIG — the only line you normally need to touch.
   Paste your Substack address between the quotes, e.g.
     "https://blakecody.substack.com"
   Leave it as-is to see the demo with sample posts.
   ============================================================ */
const CONFIG = {
  substackUrl: "https://bccody.substack.com", // <-- your Substack URL goes here
  maxPosts: 12,
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

// How many posts to show: from the list's data-limit ("0" = all),
// falling back to CONFIG.maxPosts. Lets one app.js serve home + archive.
function postLimit() {
  const dl = els.list && els.list.getAttribute("data-limit");
  if (dl === null || dl === undefined) return CONFIG.maxPosts;
  const n = parseInt(dl, 10);
  return n > 0 ? n : Infinity;
}

function render(posts) {
  if (!els.list) return; // pages without a post list (Book, Reflect, About)
  if (!posts.length) {
    setState("Nothing here yet — your latest posts will show up automatically.");
    return;
  }
  els.state.classList.add("hidden");
  els.list.innerHTML = posts
    .slice(0, postLimit())
    .map((p) => {
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
    })
    .join("");
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
  const items = Array.from(doc.querySelectorAll("item")).map((item) => {
    const text = (sel) => {
      const el = item.querySelector(sel);
      return el ? el.textContent.trim() : "";
    };
    const encEl = item.getElementsByTagName("content:encoded")[0];
    const content = encEl ? encEl.textContent : "";
    let image = firstImage(content);
    const encl = item.querySelector("enclosure");
    if (!image && encl && encl.getAttribute("url")) image = sizeImage(encl.getAttribute("url"));
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

async function loadFromSubstack(url) {
  // Substack's RSS feed has no CORS headers, so we route it through a public
  // CORS proxy and parse the XML ourselves. We try a couple of live proxies
  // first (fresh, no heavy caching) and fall back to rss2json if needed.
  const feed = url.replace(/\/$/, "") + "/feed";
  const enc = encodeURIComponent(feed);
  const bust = "&_=" + Date.now();
  const proxies = [
    "https://corsproxy.io/?url=" + enc + bust,
    "https://api.allorigins.win/raw?url=" + enc + bust,
  ];
  for (const proxy of proxies) {
    try {
      const xml = await fetchText(proxy);
      const parsed = parseFeedXml(xml);
      if (parsed.posts.length) return parsed;
    } catch (e) {
      /* try the next source */
    }
  }
  // Last resort: rss2json (can be cached/rate-limited, but better than nothing).
  const api = "https://api.rss2json.com/v1/api.json?rss_url=" + enc;
  const res = await fetch(api);
  if (!res.ok) throw new Error("feed request failed");
  const data = await res.json();
  if (data.status !== "ok") throw new Error(data.message || "feed error");
  return {
    image: (data.feed && data.feed.image) || "",
    posts: data.items.map((it) => ({
      title: it.title,
      link: it.link,
      pubDate: it.pubDate,
      content: it.content,
      description: it.description,
      image: it.enclosure && it.enclosure.link ? sizeImage(it.enclosure.link) : "",
    })),
  };
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
