/* =========================================================================
   guardcurry blog · 交互脚本
    1. 中文字数 / 阅读时长          7. 朗读全文（浏览器内置语音）
    2. 自动目录 + 滚动高亮          8. 顶部阅读进度条
    3. 侧边栏滚动状态               9. 字号三档调节
    4. 首页封面轻微视差            10. 继续阅读（记住上次读到哪）
    5. 点击爆出可爱表情            11. 站内搜索（搜索页）
    6. 滚动入场动画（含兜底）
   ========================================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var docEl = document.documentElement;
  var postBody = document.querySelector(".post-body");

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function store(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* 隐私模式忽略 */ }
  }
  function read(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }

  /* ---------- 1. 字数 / 阅读时长 ---------- */
  var slot = document.getElementById("reading-time");
  if (postBody && slot) {
    var text = postBody.textContent || "";
    var cjk = (text.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g) || []).length;
    var words = (text.match(/[A-Za-z0-9]+/g) || []).length;
    var totalChars = cjk + words;
    slot.textContent = totalChars.toLocaleString("zh-CN") + " 字 · 约 " +
      Math.max(1, Math.round(totalChars / 400)) + " 分钟";
  }

  /* ---------- 2. 目录 + 滚动高亮 ---------- */
  var toc = document.getElementById("TOC");
  if (toc) {
    var list = toc.querySelector("ul");
    var heads = [].slice.call(document.querySelectorAll(".post-body h2, .post-body h3"));
    if (!heads.length) {
      toc.style.display = "none";
    } else {
      heads.forEach(function (h, i) {
        if (!h.id) { h.id = "sec-" + (i + 1); }
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = "#" + h.id;
        a.textContent = h.textContent;
        li.appendChild(a);
        list.appendChild(li);
      });
      var links = [].slice.call(list.querySelectorAll("a"));
      var byId = {};
      links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
      var syncToc = function () {
        var current = null;
        heads.forEach(function (h) {
          if (h.getBoundingClientRect().top <= 140) { current = h.id; }
        });
        links.forEach(function (a) { a.classList.remove("active"); });
        if (current && byId[current]) { byId[current].classList.add("active"); }
      };
      window.addEventListener("scroll", syncToc, { passive: true });
      syncToc();
    }
  }

  /* ---------- 3. 侧边栏滚动状态 ---------- */
  var side = document.querySelector(".sidebar");
  if (side) {
    var syncSide = function () { side.classList.toggle("is-scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", syncSide, { passive: true });
    syncSide();
  }

  /* ---------- 4. 首页封面轻微视差 ---------- */
  var cover = document.querySelector(".hero-cover");
  if (cover && !reduceMotion) {
    var coverTick = false;
    var moveCover = function () {
      var y = Math.min(window.scrollY, 700);
      cover.style.transform = "translate3d(0," + (y * 0.05).toFixed(2) + "px,0) scale(" +
        (1 + y * 0.00006).toFixed(4) + ")";
      coverTick = false;
    };
    window.addEventListener("scroll", function () {
      if (!coverTick) { coverTick = true; window.requestAnimationFrame(moveCover); }
    }, { passive: true });
  }

  /* ---------- 5. 点击爆出可爱表情 ---------- */
  var POP_GLYPHS = [
    "\u2764\uFE0F", "\uD83D\uDC96", "\uD83D\uDC97", "\uD83D\uDC93",
    "\u2728", "\u2B50", "\uD83C\uDF38", "\uD83C\uDF3C",
    "\uD83C\uDF53", "\uD83D\uDC30", "\uD83E\uDDF8", "\uD83D\uDC36"
  ];
  var canAnimate = !!(window.Element && Element.prototype && typeof Element.prototype.animate === "function");

  if (!reduceMotion && canAnimate) {
    var spawnPop = function (x, y) {
      if (document.getElementsByClassName("pop-emoji").length > 140) { return; }
      var count = 5 + Math.floor(Math.random() * 4);
      for (var i = 0; i < count; i++) {
        var el = document.createElement("span");
        el.className = "pop-emoji";
        el.setAttribute("aria-hidden", "true");
        el.textContent = POP_GLYPHS[Math.floor(Math.random() * POP_GLYPHS.length)];
        el.style.left = x + "px";
        el.style.top = y + "px";
        el.style.fontSize = (13 + Math.random() * 15).toFixed(1) + "px";
        document.body.appendChild(el);

        var angle = Math.random() * Math.PI * 2;
        var dist = 45 + Math.random() * 85;
        var dx = Math.cos(angle) * dist;
        var dy = Math.sin(angle) * dist - 34;
        var rot = Math.round((Math.random() - 0.5) * 160);
        var dur = 750 + Math.round(Math.random() * 500);

        var anim = el.animate([
          { transform: "translate(-50%, -50%) scale(0.3) rotate(0deg)", opacity: 0 },
          { transform: "translate(-50%, -50%) scale(1.15) rotate(" + Math.round(rot * 0.3) + "deg)", opacity: 1, offset: 0.18 },
          { transform: "translate(calc(-50% + " + dx.toFixed(1) + "px), calc(-50% + " + dy.toFixed(1) + "px)) scale(0.8) rotate(" + rot + "deg)", opacity: 0 }
        ], { duration: dur, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" });

        anim.onfinish = (function (node) {
          return function () { node.remove(); };
        })(el);
      }
    };
    document.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) { return; }
      var t = e.target;
      if (t && t.closest && t.closest("a, button, input, textarea, select, label")) { return; }
      spawnPop(e.clientX, e.clientY);
    }, { passive: true });
  }

  /* ---------- 6. 滚动入场（threshold 必须为 0，否则手机长文会整篇隐身） ---------- */
  var items = [].slice.call(document.querySelectorAll(".reveal"));
  if (items.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
    } else {
      var show = function (el) {
        var delay = parseInt(el.getAttribute("data-delay") || "0", 10);
        window.setTimeout(function () { el.classList.add("in"); }, delay);
      };
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { show(entry.target); io.unobserve(entry.target); }
        });
      }, { rootMargin: "0px 0px -4% 0px", threshold: 0 });
      items.forEach(function (el, i) {
        if (!el.hasAttribute("data-delay")) {
          el.setAttribute("data-delay", String(Math.min(i * 70, 420)));
        }
        io.observe(el);
      });
      window.setTimeout(function () {
        items.forEach(function (el) {
          if (el.classList.contains("in")) { return; }
          if (el.getBoundingClientRect().top < window.innerHeight * 1.3) { el.classList.add("in"); }
        });
      }, 2000);
    }
  }

  /* ---------- 7. 朗读全文（浏览器内置语音，零依赖） ---------- */
  var readBtn = document.getElementById("read-btn");
  var readStop = document.getElementById("read-stop");
  var readBars = document.getElementById("read-bars");
  var readPos = document.getElementById("read-pos");
  var synth = window.speechSynthesis;
  var Utter = window.SpeechSynthesisUtterance;

  function splitSentences(input) {
    var out = [];
    var buf = "";
    var stops = "。！？!?；;…";
    for (var i = 0; i < input.length; i++) {
      var ch = input.charAt(i);
      buf += ch;
      if (stops.indexOf(ch) >= 0 || buf.length >= 80) {
        if (buf.trim()) { out.push(buf.trim()); }
        buf = "";
      }
    }
    if (buf.trim()) { out.push(buf.trim()); }
    return out;
  }

  if (readBtn && postBody && synth && Utter) {
    var chunks = [];
    var nodes = postBody.querySelectorAll("p, h2, h3, blockquote, li");
    for (var n = 0; n < nodes.length; n++) {
      var nodeText = (nodes[n].textContent || "").trim();
      if (!nodeText) { continue; }
      var parts = splitSentences(nodeText);
      for (var q = 0; q < parts.length; q++) { chunks.push(parts[q]); }
    }

    var readIndex = 0;
    var readState = "idle";
    var readIcon = readBtn.querySelector(".read-icon");
    var readLabel = readBtn.querySelector(".read-label");

    var pickVoice = function () {
      var voices = synth.getVoices() || [];
      for (var i = 0; i < voices.length; i++) {
        var v = voices[i];
        if (/^zh/i.test(v.lang) || /Chinese|中文|普通话|Yunxi|Xiaoxiao|Huihui|Kangkang/i.test(v.name)) { return v; }
      }
      return null;
    };

    var paintRead = function () {
      var playing = readState === "playing";
      var paused = readState === "paused";
      var on = playing || paused;
      if (readIcon) { readIcon.textContent = playing ? "❚❚" : "▶"; }
      if (readLabel) { readLabel.textContent = playing ? "暂停朗读" : (paused ? "继续朗读" : "朗读全文"); }
      readBtn.classList.toggle("is-on", on);
      if (readStop) { readStop.hidden = !on; }
      if (readBars) { readBars.hidden = !playing; }
      if (readPos) {
        readPos.hidden = !on;
        readPos.textContent = on ? (Math.min(readIndex + 1, chunks.length) + " / " + chunks.length) : "";
      }
    };

    var stopRead = function () {
      readState = "idle";
      readIndex = 0;
      try { synth.cancel(); } catch (e) { /* ignore */ }
      paintRead();
    };

    var speakNext = function () {
      if (readState !== "playing") { return; }
      if (readIndex >= chunks.length) { stopRead(); return; }
      var u = new Utter(chunks[readIndex]);
      u.lang = "zh-CN";
      var voice = pickVoice();
      if (voice) { u.voice = voice; }
      u.rate = 1;
      u.pitch = 1;
      u.onend = function () {
        if (readState !== "playing") { return; }
        readIndex++;
        paintRead();
        speakNext();
      };
      u.onerror = function () { /* 用户中断时忽略 */ };
      try { synth.speak(u); } catch (e) { stopRead(); }
    };

    readBtn.hidden = false;
    if (chunks.length === 0) { readBtn.hidden = true; }

    readBtn.addEventListener("click", function () {
      if (readState === "playing") {
        readState = "paused";
        try { synth.pause(); } catch (e) { /* ignore */ }
        paintRead();
        return;
      }
      if (readState === "paused") {
        readState = "playing";
        try { synth.resume(); } catch (e) { /* ignore */ }
        paintRead();
        return;
      }
      readState = "playing";
      readIndex = 0;
      try { synth.cancel(); } catch (e) { /* ignore */ }
      paintRead();
      speakNext();
    });

    if (readStop) { readStop.addEventListener("click", stopRead); }
    window.addEventListener("pagehide", function () { try { synth.cancel(); } catch (e) { /* ignore */ } });
    paintRead();
  }

  /* ---------- 8. 顶部阅读进度条 ---------- */
  var progress = null;
  var readPct = 0;
  if (postBody) {
    progress = document.createElement("div");
    progress.className = "read-progress";
    document.body.appendChild(progress);

    var syncProgress = function () {
      var rect = postBody.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      var passed = -rect.top;
      var pct = total > 40 ? passed / total : 1;
      pct = Math.max(0, Math.min(1, pct));
      readPct = pct;
      progress.style.width = (pct * 100).toFixed(2) + "%";
    };
    window.addEventListener("scroll", syncProgress, { passive: true });
    window.addEventListener("resize", syncProgress, { passive: true });
    syncProgress();
  }

  /* ---------- 9. 字号三档 ---------- */
  var fontButtons = [].slice.call(document.querySelectorAll(".font-ctrl button[data-size]"));
  if (fontButtons.length) {
    var applyFont = function (size) {
      docEl.setAttribute("data-font", size);
      fontButtons.forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-size") === size); });
    };
    applyFont(read("gcb-font") || "m");
    fontButtons.forEach(function (b) {
      b.addEventListener("click", function () {
        var size = b.getAttribute("data-size") || "m";
        applyFont(size);
        store("gcb-font", size);
      });
    });
  }

  /* ---------- 10. 继续阅读（记住上次读到哪） ---------- */
  var RESUME_KEY = "gcb-resume";
  if (postBody) {
    /* 文章页：记录进度（节流 1.5 秒） */
    var postTitle = document.querySelector(".post-title");
    var lastSave = 0;
    var saveResume = function (force) {
      var now = Date.now();
      if (!force && now - lastSave < 1500) { return; }
      lastSave = now;
      var parts = window.location.pathname.split("/");
      var slug = parts.length > 2 ? parts[parts.length - 2] : "";
      if (!slug) { return; }
      store(RESUME_KEY, JSON.stringify({
        u: "blog/" + slug + "/index.html",
        t: postTitle ? postTitle.textContent.trim() : slug,
        p: Math.round(readPct * 100)
      }));
    };
    window.addEventListener("scroll", function () { saveResume(false); }, { passive: true });
    window.addEventListener("pagehide", function () { saveResume(true); });

    /* 从首页点"继续阅读"过来时，跳回上次位置 */
    if (window.location.hash === "#resume") {
      var saved = null;
      try { saved = JSON.parse(read(RESUME_KEY) || "null"); } catch (e) { saved = null; }
      if (saved && saved.p > 8 && saved.p < 96) {
        window.setTimeout(function () {
          var rect = postBody.getBoundingClientRect();
          var total = rect.height - window.innerHeight;
          if (total > 0) {
            window.scrollTo(0, window.scrollY + rect.top + total * (saved.p / 100));
          }
        }, 260);
      }
    }
  } else {
    /* 首页：显示"继续阅读"胶囊 */
    var resumeSlot = document.getElementById("resume-slot");
    if (resumeSlot) {
      var data = null;
      try { data = JSON.parse(read(RESUME_KEY) || "null"); } catch (e) { data = null; }
      if (data && data.u && data.p > 5 && data.p < 96) {
        var pill = document.createElement("a");
        pill.className = "resume-pill";
        pill.href = data.u + "#resume";
        pill.innerHTML = "继续阅读《<b>" + esc(data.t) + "</b>》 · 已读 " + data.p + "%";
        resumeSlot.appendChild(pill);
      }
    }
  }

  /* ---------- 11. 站内搜索 ---------- */
  var searchInput = document.getElementById("search-input");
  var dataEl = document.getElementById("search-data");
  if (searchInput && dataEl) {
    var searchItems = [];
    try { searchItems = JSON.parse(dataEl.textContent || "[]"); } catch (e) { searchItems = []; }
    var results = document.getElementById("search-results");
    var emptyTip = document.getElementById("search-empty");
    var countTip = document.getElementById("search-count");

    var renderResults = function (query) {
      var terms = String(query || "").toLowerCase().split(/\s+/).filter(Boolean);
      var html = "";
      var shown = 0;
      for (var i = 0; i < searchItems.length; i++) {
        var it = searchItems[i];
        var hay = [it.t, it.d, it.c, it.x, it.y, it.b].join(" ").toLowerCase();
        var ok = true;
        for (var k = 0; k < terms.length; k++) {
          if (hay.indexOf(terms[k]) < 0) { ok = false; break; }
        }
        if (!ok) { continue; }
        shown++;
        html += '<li class="tile reveal in" style="--h:' + (it.h || 200) + '">' +
          '<a class="tile-link" href="' + esc(it.u) + '">' +
          '<span class="tile-thumb"><span class="tile-glyph">' + esc(it.g || "\u00b7") + '</span>' +
          '<span class="play-btn" aria-hidden="true">&#9654;</span></span>' +
          '<span class="tile-body">' +
          (it.c ? '<span class="cat-pill">' + esc(it.c) + '</span>' : '') +
          '<span class="tile-title">' + esc(it.t) + '</span>' +
          (it.x ? '<span class="tile-excerpt">' + esc(it.x) + '</span>' : '') +
          '<span class="tile-date">' + esc(it.d) + '</span>' +
          '</span></a></li>';
      }
      if (results) { results.innerHTML = html; }
      if (emptyTip) { emptyTip.hidden = shown > 0; }
      if (countTip) { countTip.textContent = terms.length ? ("找到 " + shown + " 篇") : ("共 " + shown + " 篇"); }
    };

    var query = "";
    var m = /[?&]q=([^&#]+)/.exec(window.location.search);
    if (m) { query = decodeURIComponent(m[1].replace(/\+/g, " ")); searchInput.value = query; }
    renderResults(query);
    searchInput.addEventListener("input", function () { renderResults(searchInput.value); });
    searchInput.focus();
  }
  /* ---------- 12. 音乐播放器（GC-music&life 页） ---------- */
  var trackListEl = document.querySelector(".track-list");
  if (trackListEl && trackListEl.children.length === 0) {
    var emptyBlock = trackListEl.closest ? trackListEl.closest(".music-block") : null;
    if (emptyBlock) { emptyBlock.style.display = "none"; }
  }

  var playTriggers = [].slice.call(document.querySelectorAll(".js-play[data-src], [data-src] .js-play"));
  if (playTriggers.length) {
    var musicAudio = new Audio();
    musicAudio.preload = "none";
    var activeHolder = null;

    var paintMusic = function () {
      var holders = [].slice.call(document.querySelectorAll("[data-src]"));
      holders.forEach(function (holder) {
        var on = holder === activeHolder && !musicAudio.paused && !musicAudio.ended;
        holder.classList.toggle("is-playing", on);
        var icons = holder.querySelectorAll(".pb-icon");
        for (var k = 0; k < icons.length; k++) {
          icons[k].textContent = on ? "\u275A\u275A" : "\u25B6";
        }
      });
    };

    var playHolder = function (holder) {
      var src = holder.getAttribute("data-src");
      if (!src) { return; }
      if (activeHolder === holder) {
        if (musicAudio.paused) { musicAudio.play(); } else { musicAudio.pause(); }
        return;
      }
      activeHolder = holder;
      musicAudio.src = src;
      try { musicAudio.play(); } catch (e) { /* 用户手势限制时忽略 */ }
      paintMusic();
    };

    document.addEventListener("click", function (e) {
      var trigger = e.target && e.target.closest ? e.target.closest(".js-play") : null;
      if (!trigger) { return; }
      var holder = trigger.closest("[data-src]");
      if (!holder) { return; }
      e.preventDefault();
      playHolder(holder);
    });

    musicAudio.addEventListener("play", paintMusic);
    musicAudio.addEventListener("pause", paintMusic);
    musicAudio.addEventListener("ended", function () { paintMusic(); });
    paintMusic();
  }
})();
