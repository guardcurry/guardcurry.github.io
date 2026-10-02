/* 站点交互：字数统计、自动目录、滚动高亮 */
(function () {
  "use strict";

  /* ---------- 1. 中文字数 / 阅读时长 ---------- */
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

  /* ---------- 2. 自动生成目录（无标题时隐藏） ---------- */
  var toc = document.getElementById("TOC");
  if (toc) {
    var list = toc.querySelector("ul");
    var heads = [].slice.call(document.querySelectorAll(".post-body h2, .post-body h3"));
    if (!heads.length) {
      toc.style.display = "none";
    } else {
      var used = {};
      heads.forEach(function (h, i) {
        var id = h.id || "sec-" + (i + 1);
        h.id = id;
        used[id] = (used[id] || 0) + 1;
        var li = document.createElement("li");
        li.className = h.tagName === "H3" ? "toc-h3" : "toc-h2";
        var a = document.createElement("a");
        a.href = "#" + id;
        a.textContent = h.textContent;
        li.appendChild(a);
        list.appendChild(li);
      });

      /* ---------- 3. 滚动时高亮当前章节 ---------- */
      var links = [].slice.call(list.querySelectorAll("a"));
      var byId = {};
      links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });

      var onScroll = function () {
        var current = null;
        heads.forEach(function (h) {
          if (h.getBoundingClientRect().top <= 120) current = h.id;
        });
        links.forEach(function (a) { a.classList.remove("active"); });
        if (current && byId[current]) byId[current].classList.add("active");
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  }
})();
