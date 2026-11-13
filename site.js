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
    var f = e.target;
    if (!f.matches || !f.matches(".signup")) return;
    track("signup-" + (f.getAttribute("data-where") || "site"));
    /* Brief "Sending…" state. The form itself still goes to Substack exactly as before. */
    var b = f.querySelector('button[type="submit"]');
    if (!b || b.getAttribute("aria-busy")) return;
    var label = b.textContent;
    b.style.minWidth = b.offsetWidth + "px";
    b.textContent = "Sending\u2026";
    b.setAttribute("aria-busy", "true");
    setTimeout(function () { b.textContent = label; b.removeAttribute("aria-busy"); b.style.minWidth = ""; }, 1400);
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
  var countLive = $("video-count-live"), chipInd = null, swapTimer = 0, tickRaf = 0;
  function countText(n) { return n + (n === 1 ? " video" : " videos"); }
  function chipButtons() { return Array.prototype.slice.call(chips.querySelectorAll(".chip")); }
  function drawCards() {
    var list = shown();
    grid.innerHTML = list.length ? list.map(function (v) { return card(v, true); }).join("") : '<p class="empty">Nothing here yet. New videos land every week.</p>';
    return list.length;
  }
  /* The count ticks to its new value over about 300ms; screen readers hear only the final number. */
  function setCount(n, animate) {
    if (countLive) countLive.textContent = countText(n);
    var from = parseInt(count.textContent, 10);
    cancelAnimationFrame(tickRaf);
    if (!animate || reduce || isNaN(from) || from === n) { count.textContent = countText(n); return; }
    var t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / 300);
      count.textContent = countText(Math.round(from + (n - from) * p));
      if (p < 1) tickRaf = requestAnimationFrame(step);
    })(t0);
  }
  /* One shared highlight slides between chips. It is built from two round caps and a
     stretchable middle so it stays a clean pill while only transforms animate. */
  function moveIndicator(animate) {
    if (!chipInd) return;
    var on = chips.querySelector('.chip[aria-pressed="true"]');
    if (!on) return;
    var box = chips.getBoundingClientRect(), r = on.getBoundingClientRect();
    var x = r.left - box.left, y = r.top - box.top, w = r.width, h = r.height;
    var parts = chipInd.children;
    chipInd.classList.toggle("snap", !animate);
    for (var i = 0; i < 3; i++) parts[i].style.height = h + "px";
    parts[0].style.width = parts[2].style.width = h + "px";
    parts[0].style.transform = "translate(" + x + "px," + y + "px)";
    parts[1].style.transform = "translate(" + (x + h / 2 - 1) + "px," + y + "px) scaleX(" + Math.max(0, (w - h + 2) / 100) + ")";
    parts[2].style.transform = "translate(" + (x + w - h) + "px," + y + "px)";
  }
  function setFilter(t) {
    if (t === filter) return;
    filter = t;
    chipButtons().forEach(function (b) { b.setAttribute("aria-pressed", String(b.textContent === filter)); });
    moveIndicator(true);
    setCount(shown().length, true);
    clearTimeout(swapTimer);
    grid.classList.add("rv-done"); /* the scroll reveal is finished with this grid from here on */
    if (reduce) { drawCards(); return; }
    /* Simple fade: everything eases out, the grid swaps, the matches ease back in. */
    grid.classList.remove("entering");
    grid.classList.add("leaving");
    swapTimer = setTimeout(function () {
      drawCards();
      Array.prototype.forEach.call(grid.children, function (el, i) { el.style.setProperty("--i", Math.min(i, 6)); });
      grid.classList.remove("leaving");
      grid.classList.add("entering");
      swapTimer = setTimeout(function () { grid.classList.remove("entering"); }, 900);
    }, 200);
  }
  if (grid && chips) {
    chips.innerHTML = '<span class="chip-ind" aria-hidden="true"><i></i><i></i><i></i></span>' +
      TOPICS.map(function (t) { return '<button type="button" class="chip" aria-pressed="' + (t === filter) + '">' + t + "</button>"; }).join("");
    chipInd = chips.querySelector(".chip-ind");
    chips.classList.add("has-ind");
    chips.addEventListener("click", function (e) { var b = e.target.closest(".chip"); if (b) setFilter(b.textContent); });
    setCount(drawCards(), false);
    moveIndicator(false);
    window.addEventListener("resize", function () { moveIndicator(false); });
    window.addEventListener("load", function () { moveIndicator(false); });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { moveIndicator(false); });
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

  /* Nav: solid after 40px. Past the first screen it tucks away on the way down and
     returns on the way up (small thresholds stop it flickering on tiny movements). */
  (function () {
    var top = d.querySelector(".top");
    if (!top) return;
    var lastY = window.pageYOffset || 0, run = 0;
    function update(y) {
      top.classList.toggle("stuck", y > 40);
      var dy = y - lastY; lastY = y;
      if (reduce) return;
      if (y < 320) { run = 0; top.classList.remove("away"); return; }
      if ((dy > 0) !== (run > 0)) run = 0;
      run += dy;
      if (run > 56) top.classList.add("away");
      else if (run < -12) top.classList.remove("away");
    }
    scrollFns.push(update);
    update(lastY);
    top.addEventListener("focusin", function () { top.classList.remove("away"); });
  })();

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

  /* ALIGNED, letter by letter. The heading keeps its full name for screen readers. */
  (function () {
    var h = d.querySelector("[data-letters]");
    if (!h || reduce || !canReveal) return;
    var text = h.textContent, html = "";
    for (var i = 0; i < text.length; i++) html += text[i] === " " ? " " : '<span class="ch" aria-hidden="true" style="--i:' + i + '">' + esc(text[i]) + "</span>";
    h.setAttribute("aria-label", text);
    h.innerHTML = html;
    h.classList.add("letters");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var r = en.boundingClientRect, passed = r.bottom <= 0;
        if (!passed && en.intersectionRatio < 0.6) return;
        io.disconnect();
        if (passed) { h.classList.remove("letters"); return; }
        h.classList.add("in");
        setTimeout(function () { h.classList.remove("letters", "in"); }, 200 + text.length * 30 + 700);
      });
    }, { threshold: [0, 0.6] });
    io.observe(h);
  })();

  window.__motion = true; /* tells the <head> fallback that this script ran to the end */
})();
