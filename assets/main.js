/* =========================================================================
   guardcurry blog · 交互脚本
   1. 中文字数 / 阅读时长
   2. 自动目录 + 滚动高亮
   3. 导航栏滚动状态（玻璃加深）
   4. 滚动入场动画（IntersectionObserver，尊重 prefers-reduced-motion）
   ========================================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. 字数 / 阅读时长 ---------- */
  var body = document.querySelector(".post-body");
  var slot = document.getElementById("reading-time");
  if (body && slot) {
    var text = body.textContent || "";
    var cjk = (text.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g) || []).length;
    var words = (text.match(/[A-Za-z0-9]+/g) || []).length;
    var total = cjk + words;
    var minutes = Math.max(1, Math.round(total / 400));
    slot.textContent = total.toLocaleString("zh-CN") + " 字 · 约 " + minutes + " 分钟";
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

  /* ---------- 3. 导航栏滚动状态 ---------- */
  var nav = document.querySelector(".navbar");
  if (nav) {
    var syncNav = function () {
      nav.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    window.addEventListener("scroll", syncNav, { passive: true });
    syncNav();
  }

  /* ---------- 4. 首页封面轻微视差 ---------- */
  var cover = document.querySelector(".hero-cover");
  if (cover && !reduceMotion) {
    var coverTick = false;
    var moveCover = function () {
      var y = Math.min(window.scrollY, 700);
      cover.style.transform =
        "translate3d(0," + (y * 0.05).toFixed(2) + "px,0) scale(" + (1 + y * 0.00006).toFixed(4) + ")";
      coverTick = false;
    };
    window.addEventListener("scroll", function () {
      if (!coverTick) { coverTick = true; window.requestAnimationFrame(moveCover); }
    }, { passive: true });
  }

  /* ---------- 5. 点击爆出可爱表情 ---------- */
  var POP_GLYPHS = [
    "\u2764\uFE0F",   /* 红心 */
    "\uD83D\uDC96",   /* 闪亮心 */
    "\uD83D\uDC97",   /* 成长心 */
    "\uD83D\uDC93",   /* 跳动心 */
    "\u2728",         /* 闪光 */
    "\u2B50",         /* 星星 */
    "\uD83C\uDF38",   /* 樱花 */
    "\uD83C\uDF3C",   /* 雏菊 */
    "\uD83C\uDF53",   /* 草莓 */
    "\uD83D\uDC30",   /* 兔子 */
    "\uD83E\uDDF8",   /* 玩偶 */
    "\u2601\uFE0F"    /* 云 */
  ];

  if (!reduceMotion) {
    var spawnPop = function (x, y) {
      /* 防止连点造成粒子堆积 */
      if (document.getElementsByClassName("pop-emoji").length > 140) { return; }

      var count = 5 + Math.floor(Math.random() * 4); /* 每次 5~8 个 */
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
        var dy = Math.sin(angle) * dist - 34; /* 整体略微向上飘 */
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
      if (e.button !== 0) { return; }   /* 只响应左键 / 单指触摸 */
      spawnPop(e.clientX, e.clientY);
    }, { passive: true });
  }

  /* ---------- 6. 滚动入场 ---------- */
  var items = [].slice.call(document.querySelectorAll(".reveal"));
  if (!items.length) { return; }

  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("in"); });
    return;
  }

  var show = function (el) {
    var delay = parseInt(el.getAttribute("data-delay") || "0", 10);
    window.setTimeout(function () { el.classList.add("in"); }, delay);
  };

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        show(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });

  items.forEach(function (el, i) {
    /* 未显式指定延迟时按顺序轻微错峰，观感接近苹果页面的逐条浮现 */
    if (!el.hasAttribute("data-delay")) {
      el.setAttribute("data-delay", String(Math.min(i * 70, 420)));
    }
    io.observe(el);
  });
})();
