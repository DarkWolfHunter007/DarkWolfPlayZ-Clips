/* Per-clip redirect (/s/<id>/) and 404 fallback. The target is written into the page by the
   pipeline as <meta name="go-target">; it is re-validated here before use. */
(function () {
  "use strict";
  var TARGET_RE = /^https:\/\/youtu\.be\/[A-Za-z0-9_-]{11}\?t=\d{1,6}$/;
  var ID_RE = /^[A-Za-z0-9_-]{11}$/;
  var CODE_RE = /^[a-z0-9-]{2,40}$/;
  function meta(n) { var m = document.querySelector('meta[name="' + n + '"]'); return m ? m.content : ""; }
  function count(path) {
    var code = meta("go-counter");
    if (!code || !CODE_RE.test(code)) return;
    try {
      var img = new Image(); img.referrerPolicy = "no-referrer";
      img.src = "https://" + code + ".goatcounter.com/count?p=" + encodeURIComponent(path) +
        "&e=true&rnd=" + Math.random().toString(36).slice(2);
    } catch (e) { /* never block the redirect */ }
  }


  // ---- open in the YouTube APP, not the in-app/web browser --------------------------------
  // Everyone here came from the YouTube app, so on phones we hand the video straight back to
  // it: an Android intent (with the web link as Android's own fallback) or iOS's youtube://
  // scheme. Only if the page is still showing a moment later (app missing / launch blocked)
  // do we fall back to the normal web link. Links are rebuilt from a validated id + seconds.
  function appLinks(id, t) {
    var web = "https://youtu.be/" + id + "?t=" + t;
    if (!/^[A-Za-z0-9_-]{11}$/.test(id) || !/^\d{1,6}$/.test(String(t))) return null;
    var ua = navigator.userAgent || "";
    var watch = "www.youtube.com/watch?v=" + id + "&t=" + t;
    if (/Android/i.test(ua)) {
      // Only Chrome (and Chrome-based in-app tabs) handle intent:// links. Brave, Firefox,
      // Samsung Internet & co. show an error page for them, so they get the normal YouTube
      // link, which Android opens in the YouTube app (or the browser asks to).
      var chrome = /Chrome\/\d/.test(ua) && !/EdgA|OPR|SamsungBrowser|Firefox|YaBrowser|DuckDuckGo|Vivaldi/i.test(ua)
                   && !(navigator.brave && typeof navigator.brave.isBrave === "function");
      if (!chrome) return { web: "https://www.youtube.com/watch?v=" + id + "&t=" + t + "s", app: null };
      return { web: web, app: "intent://" + watch + "#Intent;scheme=https;package=com.google.android.youtube;" +
               "S.browser_fallback_url=" + encodeURIComponent(web) + ";end" };
    }
    if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
      return { web: web, app: "youtube://" + watch };
    }
    return { web: web, app: null };
  }
  function openOriginal(links) {
    if (!links.app) { window.location.replace(links.web); return; }
    var left = false;
    var mark = function () { left = true; };
    window.addEventListener("pagehide", mark);
    window.addEventListener("blur", mark);            // iOS "Open in YouTube?" prompt
    document.addEventListener("visibilitychange", function () { if (document.hidden) left = true; });
    window.location.href = links.app;
    setTimeout(function () { if (!left && !document.hidden) window.location.replace(links.web); }, 2500);
  }

  var target = meta("go-target"), id = meta("go-id"), home = meta("go-home") || "../../";
  if (target && TARGET_RE.test(target) && ID_RE.test(id)) {
    var m0 = target.match(/^https:\/\/youtu\.be\/([A-Za-z0-9_-]{11})\?t=(\d{1,6})$/);
    var links = appLinks(m0[1], m0[2]);
    var btn = document.querySelector(".go-page .btn");
    var phone = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "") ||
                (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (btn) { btn.href = links.app || links.web; btn.textContent = "Open in YouTube ▶"; }
    if (phone) {
      // Phones only open the app from a real tap — wait for it (see site.js).
      var h = document.querySelector(".go-page h1");
      if (h) h.textContent = "Tap to watch the full video";
      if (btn) btn.addEventListener("click", function () { count("go/" + id); });
      return;
    }
    count("go/" + id);
    setTimeout(function () { openOriginal(links); }, 250);
    return;
  }
  // 404 page: /s/<id> that isn't generated yet -> let the main page look it up.
  var m = window.location.pathname.match(/\/s\/([A-Za-z0-9_-]{11})\/?$/);
  if (m) window.location.replace(home + "?s=" + m[1]);
})();
