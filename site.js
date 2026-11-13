/* Home + Videos behavior: video cards, lightbox player, filters, reveal, click counts. */
(function () {
  var d = document;
  /* The <head> adds .js-motion early; this confirms the script really loaded (the head removes it otherwise). */
  var root = d.documentElement;
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var canReveal = "IntersectionObserver" in window;
  if (canReveal) root.classList.add("js-motion");
  function token(name, fallback) { var v = parseFloat(getComputedStyle(root).getPropertyValue(name)); return isNaN(v) ? fallback : v; }
  var $ = function (id) { return d.getElementById(id); };
  var esc = function (s) { return String(s || "").replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var V = (window.VIDEOS || []).map(function (v, i) { v.i = i; return v; });
  var TOPICS = ["All", "Overthinking", "Discipline", "Hard seasons", "Letting go", "Life"];
  var PLAY = '<span class="play" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M7 4l14 8-14 8z"/></svg></span>';

  function track(name) {
    try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: name, title: name, event: true }); } catch (e) {}
  }
  d.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("[data-track]");
    if (el) track(el.getAttribute("data-track"));
  });
  d.addEventListener("submit", function (e) {
    var f = e.target; if (f.matches && f.matches(".signup")) track("signup-" + (f.getAttribute("data-where") || "site"));
  });

  var y = $("year"); if (y) y.textContent = new Date().getFullYear();

  function capHtml(v) {
    var t = esc(v.title), hi = esc(v.hi);
    if (hi && t.toLowerCase().indexOf(hi.toLowerCase()) > -1) {
      var at = t.toLowerCase().indexOf(hi.toLowerCase());
      t = t.slice(0, at) + "<em>" + t.slice(at, at + hi.length) + "</em>" + t.slice(at + hi.length);
    }
    return t;
  }
  function thumb(v) {
    var inner = v.cover
      ? '<img src="' + esc(v.cover) + '" alt="" loading="lazy" decoding="async" />'
      : '<span class="cap">' + capHtml(v) + "</span>";
    return '<button type="button" class="vthumb" data-play="' + v.i + '" aria-label="Play video: ' + esc(v.title) + '">' + inner + PLAY + "</button>";
  }
  function card(v, meta) {
    return '<div class="vcard">' + thumb(v) + (meta ? '<div class="vmeta"><b>' + esc(v.title) + "</b><span>" + esc(v.topic) + "</span></div>" : "") + "</div>";
  }

  /* Home: latest four */
  var row = $("video-row");
  if (row) row.innerHTML = V.length ? V.slice(0, 4).map(function (v) { return card(v, true); }).join("") : '<p class="empty">The first videos are on the way.</p>';

  /* Videos page */
  var grid = $("video-grid"), chips = $("chips"), count = $("video-count"), feat = $("featured"), watch = $("watch-btn");
  var filter = "All";
  function shown() { return filter === "All" ? V : V.filter(function (v) { return v.topic === filter; }); }
  function renderGrid() {
    var list = shown();
    grid.innerHTML = list.length ? list.map(function (v) { return card(v, true); }).join("") : '<p class="empty">Nothing here yet. New videos land every week.</p>';
    count.textContent = list.length + (list.length === 1 ? " video" : " videos");
    Array.prototype.forEach.call(chips.children, function (b) { b.setAttribute("aria-pressed", String(b.textContent === filter)); });
  }
  if (grid && chips) {
    chips.innerHTML = TOPICS.map(function (t) { return '<button type="button" class="chip" aria-pressed="false">' + t + "</button>"; }).join("");
    chips.addEventListener("click", function (e) { var b = e.target.closest(".chip"); if (b) { filter = b.textContent; renderGrid(); } });
    renderGrid();
    if (feat && V[0]) feat.outerHTML = thumb(V[0]);
    if (watch && V[0]) { watch.setAttribute("data-play", "0"); }
    else if (watch) watch.hidden = true;
  }

  /* Lightbox player */
  var lb = $("lightbox"), stage = $("lb-stage"), lbTitle = $("lb-title"), lbTopic = $("lb-topic"), cur = -1;
  function isFile(src) { return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(src); }
  function open(i) {
    var v = V[i]; if (!v || !lb) return;
    cur = i;
    lbTitle.textContent = v.title; lbTopic.textContent = v.topic;
    if (!v.src) stage.innerHTML = '<p class="soon">This one is uploading. Check back soon.</p>';
    else if (isFile(v.src)) stage.innerHTML = '<video src="' + esc(v.src) + '"' + (v.cover ? ' poster="' + esc(v.cover) + '"' : "") + ' controls autoplay playsinline preload="metadata"></video>';
    else stage.innerHTML = '<iframe src="' + esc(v.src) + '" title="' + esc(v.title) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
    if (!lb.open) { if (lb.showModal) lb.showModal(); else lb.setAttribute("open", ""); }
    track("video-play-" + v.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  }
  function close() { if (lb.open) lb.close(); }
  if (lb) {
    lb.addEventListener("close", function () { stage.innerHTML = ""; });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    $("lb-close").addEventListener("click", close);
    var nx = $("lb-next");
    if (nx) { if (V.length < 2) nx.hidden = true; nx.addEventListener("click", function () { open((cur + 1) % V.length); }); }
    d.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-play]");
      if (b) open(parseInt(b.getAttribute("data-play"), 10));
    });
  }

  /* One passive scroll listener for everything that follows the scroll position. */
  var scrollFns = [], ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; var y = window.pageYOffset || 0; scrollFns.forEach(function (f) { f(y); }); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Hero parallax: the photo trails the scroll slightly (0.85x), 60px at most.
     Desktop pointers only, and never under reduced motion. */
  (function () {
    var media = $("hero-media");
    var fine = !!(window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches);
    if (!media || reduce || !fine) return;
    var hero = media.parentNode, idle = 0, last = -1;
    scrollFns.push(function (y) {
      if (y > hero.offsetHeight) return;
      var shift = Math.min(60, Math.round(y * 0.15 * 10) / 10);
      if (shift === last) return;
      last = shift;
      media.style.willChange = "transform";
      media.style.transform = "translate3d(0," + shift + "px,0)";
      clearTimeout(idle);
      idle = setTimeout(function () { media.style.willChange = ""; }, 200);
    });
  })();

  /* Reveal on scroll: once per element, groups stagger, classes are removed when done. */
  (function () {
    var singles = d.querySelectorAll(".rv"), groups = d.querySelectorAll("[data-rv-group]");
    function kids(g) { return Array.prototype.slice.call(g.children); }
    function finish(el) { el.classList.remove("rv", "in"); el.style.removeProperty("--d"); el.style.willChange = ""; }
    function finishGroup(g) { g.classList.add("rv-done"); kids(g).forEach(finish); }
    if (!canReveal || reduce) {
      Array.prototype.forEach.call(singles, finish);
      Array.prototype.forEach.call(groups, finishGroup);
      return;
    }
    var STAGGER = token("--stagger", 70), CAP = 350, SLOW = token("--dur-slow", 700) + 120;
    function show(el, delay) {
      el.style.setProperty("--d", delay + "ms");
      el.style.willChange = "transform, opacity";
      el.classList.add("in");
    }
    function reveal(el, instant) {
      var base = parseInt(el.getAttribute("data-rv-delay"), 10) || 0;
      if (el.hasAttribute("data-rv-group")) {
        if (instant) return finishGroup(el);
        var list = kids(el), last = 0;
        list.forEach(function (k, i) { last = base + Math.min(i * STAGGER, CAP); show(k, last); });
        setTimeout(function () { finishGroup(el); }, last + SLOW);
      } else {
        if (instant) return finish(el);
        show(el, base);
        setTimeout(function () { finish(el); }, base + SLOW);
      }
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var r = en.boundingClientRect, el = en.target;
        var passed = r.bottom <= 0 || (en.isIntersecting && r.top < 0); /* already scrolled past: show without motion */
        if (!passed && en.intersectionRatio < 0.15) return;
        io.unobserve(el);
        reveal(el, passed);
      });
    }, { threshold: [0, 0.15] });
    Array.prototype.forEach.call(singles, function (el) { io.observe(el); });
    Array.prototype.forEach.call(groups, function (el) { io.observe(el); });
  })();

  window.__motion = true; /* tells the <head> fallback that this script ran to the end */
})();
