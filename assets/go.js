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

  var target = meta("go-target"), id = meta("go-id"), home = meta("go-home") || "../../";
  if (target && TARGET_RE.test(target) && ID_RE.test(id)) {
    count("go/" + id);
    setTimeout(function () { window.location.replace(target); }, 250);
    return;
  }
  // 404 page: /s/<id> that isn't generated yet -> let the main page look it up.
  var m = window.location.pathname.match(/\/s\/([A-Za-z0-9_-]{11})\/?$/);
  if (m) window.location.replace(home + "?s=" + m[1]);
})();
